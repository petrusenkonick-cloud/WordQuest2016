import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getLeaderboardReward } from "./scoring";

type LeaderboardType = "daily" | "weekly" | "monthly" | "all_time";

/**
 * Get leaderboard entries
 */
export const getLeaderboard = query({
  args: {
    type: v.string(), // "daily", "weekly", "monthly", "all_time"
    ageGroup: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Try to get cached leaderboard
    let leaderboard;
    if (args.ageGroup) {
      leaderboard = await ctx.db
        .query("leaderboards")
        .withIndex("by_type_age", (q) =>
          q.eq("type", args.type).eq("ageGroup", args.ageGroup)
        )
        .first();
    } else {
      const leaderboards = await ctx.db
        .query("leaderboards")
        .withIndex("by_type", (q) => q.eq("type", args.type))
        .collect();
      leaderboard = leaderboards.find((l) => !l.ageGroup);
    }

    if (leaderboard) {
      return {
        type: leaderboard.type,
        ageGroup: leaderboard.ageGroup,
        entries: leaderboard.entries.slice(0, limit),
        periodStart: leaderboard.periodStart,
        periodEnd: leaderboard.periodEnd,
        lastUpdated: leaderboard.lastUpdated,
      };
    }

    // Calculate on the fly if no cache exists
    let playersQuery = ctx.db.query("players");

    const players = await playersQuery.collect();

    // Filter competitive players
    let filteredPlayers = players.filter(
      (p) => p.competitionOptIn && p.normalizedScore !== undefined
    );

    // Filter by age group if specified
    if (args.ageGroup) {
      filteredPlayers = filteredPlayers.filter(
        (p) => p.ageGroup === args.ageGroup
      );
    }

    // Sort by normalized score
    filteredPlayers.sort(
      (a, b) => (b.normalizedScore || 0) - (a.normalizedScore || 0)
    );

    // Create entries
    const entries = filteredPlayers.slice(0, limit).map((p, index) => ({
      playerId: p._id,
      displayName: p.displayName || "Anonymous",
      normalizedScore: p.normalizedScore || 0,
      rawScore: p.totalRawScore || 0,
      accuracy: 0, // Would need to calculate from daily stats
      streak: p.streak || 0,
      wordsLearned: p.wordsLearned || 0,
      rank: index + 1,
    }));

    const today = new Date();
    return {
      type: args.type,
      ageGroup: args.ageGroup || null,
      entries,
      periodStart: today.toISOString(),
      periodEnd: today.toISOString(),
      lastUpdated: today.toISOString(),
    };
  },
});

/**
 * Get player's rank in leaderboard
 */
export const getPlayerRank = query({
  args: {
    playerId: v.id("players"),
    type: v.string(),
    ageGroup: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player || !player.competitionOptIn) {
      return null;
    }

    let playersQuery = ctx.db.query("players");
    const players = await playersQuery.collect();

    // Filter competitive players
    let filteredPlayers = players.filter(
      (p) => p.competitionOptIn && p.normalizedScore !== undefined
    );

    // Filter by age group if specified
    if (args.ageGroup) {
      filteredPlayers = filteredPlayers.filter(
        (p) => p.ageGroup === args.ageGroup
      );
    }

    // Sort by normalized score
    filteredPlayers.sort(
      (a, b) => (b.normalizedScore || 0) - (a.normalizedScore || 0)
    );

    // Find player's rank
    const rank =
      filteredPlayers.findIndex((p) => p._id === args.playerId) + 1;

    if (rank === 0) {
      return null;
    }

    // Get nearby players (3 above and 3 below)
    const playerIndex = rank - 1;
    const startIndex = Math.max(0, playerIndex - 3);
    const endIndex = Math.min(filteredPlayers.length, playerIndex + 4);
    const nearbyPlayers = filteredPlayers.slice(startIndex, endIndex);

    return {
      rank,
      total: filteredPlayers.length,
      percentile: Math.round(
        ((filteredPlayers.length - rank) / filteredPlayers.length) * 100
      ),
      player: {
        id: player._id,
        displayName: player.displayName || "Anonymous",
        normalizedScore: player.normalizedScore || 0,
        streak: player.streak || 0,
      },
      nearby: nearbyPlayers.map((p, i) => ({
        rank: startIndex + i + 1,
        displayName: p.displayName || "Anonymous",
        normalizedScore: p.normalizedScore || 0,
        isCurrentPlayer: p._id === args.playerId,
      })),
    };
  },
});

/**
 * Claim leaderboard reward
 */
export const claimReward = mutation({
  args: {
    playerId: v.id("players"),
    rewardId: v.id("competitionRewards"),
  },
  handler: async (ctx, args) => {
    const reward = await ctx.db.get(args.rewardId);
    if (!reward || reward.playerId !== args.playerId || reward.claimed) {
      throw new Error("Invalid or already claimed reward");
    }

    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Add rewards to player
    await ctx.db.patch(args.playerId, {
      diamonds: player.diamonds + reward.reward.diamonds,
      emeralds: player.emeralds + reward.reward.emeralds,
      xp: player.xp + reward.reward.xp,
    });

    // Mark reward as claimed
    await ctx.db.patch(args.rewardId, {
      claimed: true,
      claimedAt: new Date().toISOString(),
    });

    return { success: true, reward: reward.reward };
  },
});

/**
 * Get unclaimed rewards for a player
 */
export const getUnclaimedRewards = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const rewards = await ctx.db
      .query("competitionRewards")
      .withIndex("by_player_unclaimed", (q) =>
        q.eq("playerId", args.playerId).eq("claimed", false)
      )
      .collect();

    return rewards;
  },
});

/**
 * Update leaderboards (called by cron)
 */
export const updateLeaderboards = internalMutation({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();

    // Filter competitive players
    const competitivePlayers = players.filter(
      (p) => p.competitionOptIn && p.normalizedScore !== undefined
    );

    // Sort by normalized score
    competitivePlayers.sort(
      (a, b) => (b.normalizedScore || 0) - (a.normalizedScore || 0)
    );

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Calculate period dates
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Create entries
    const createEntries = (players: typeof competitivePlayers) =>
      players.slice(0, 100).map((p, index) => ({
        playerId: p._id,
        displayName: p.displayName || "Anonymous",
        normalizedScore: p.normalizedScore || 0,
        rawScore: p.totalRawScore || 0,
        accuracy: 0,
        streak: p.streak || 0,
        wordsLearned: p.wordsLearned || 0,
        rank: index + 1,
      }));

    // Update global leaderboards
    const leaderboardTypes: LeaderboardType[] = [
      "daily",
      "weekly",
      "monthly",
      "all_time",
    ];

    for (const type of leaderboardTypes) {
      // Global leaderboard
      const existingGlobal = await ctx.db
        .query("leaderboards")
        .withIndex("by_type", (q) => q.eq("type", type))
        .collect();

      const globalLeaderboard = existingGlobal.find((l) => !l.ageGroup);

      const globalData = {
        type,
        ageGroup: undefined,
        entries: createEntries(competitivePlayers),
        periodStart:
          type === "daily"
            ? today
            : type === "weekly"
              ? weekStart.toISOString()
              : type === "monthly"
                ? monthStart.toISOString()
                : "2024-01-01",
        periodEnd: now.toISOString(),
        lastUpdated: now.toISOString(),
      };

      if (globalLeaderboard) {
        await ctx.db.patch(globalLeaderboard._id, globalData);
      } else {
        await ctx.db.insert("leaderboards", globalData);
      }

      // Age group leaderboards
      for (const ageGroup of ["6-8", "9-11", "12+"]) {
        const agePlayers = competitivePlayers.filter(
          (p) => p.ageGroup === ageGroup
        );

        const existingAge = await ctx.db
          .query("leaderboards")
          .withIndex("by_type_age", (q) =>
            q.eq("type", type).eq("ageGroup", ageGroup)
          )
          .first();

        const ageData = {
          type,
          ageGroup,
          entries: createEntries(agePlayers),
          periodStart:
            type === "daily"
              ? today
              : type === "weekly"
                ? weekStart.toISOString()
                : type === "monthly"
                  ? monthStart.toISOString()
                  : "2024-01-01",
          periodEnd: now.toISOString(),
          lastUpdated: now.toISOString(),
        };

        if (existingAge) {
          await ctx.db.patch(existingAge._id, ageData);
        } else {
          await ctx.db.insert("leaderboards", ageData);
        }
      }
    }

    return { success: true, playersProcessed: competitivePlayers.length };
  },
});

/**
 * Distribute daily leaderboard rewards (called by cron at end of day)
 */
export const distributeRewards = internalMutation({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    const type = args.type as "daily" | "weekly" | "monthly";

    // Get the leaderboard
    const leaderboards = await ctx.db
      .query("leaderboards")
      .withIndex("by_type", (q) => q.eq("type", type))
      .collect();

    const globalLeaderboard = leaderboards.find((l) => !l.ageGroup);
    if (!globalLeaderboard) {
      return { success: false, error: "Leaderboard not found" };
    }

    // Distribute rewards to top 10
    const rewardsCreated = [];
    for (let i = 0; i < Math.min(10, globalLeaderboard.entries.length); i++) {
      const entry = globalLeaderboard.entries[i];
      const reward = getLeaderboardReward(entry.rank, type);

      if (reward.diamonds > 0 || reward.emeralds > 0 || reward.xp > 0) {
        const rewardId = await ctx.db.insert("competitionRewards", {
          playerId: entry.playerId,
          competitionType: `${type}_leaderboard`,
          competitionId: globalLeaderboard._id,
          rank: entry.rank,
          reward,
          claimed: false,
          createdAt: new Date().toISOString(),
        });
        rewardsCreated.push(rewardId);
      }
    }

    return { success: true, rewardsCreated: rewardsCreated.length };
  },
});
