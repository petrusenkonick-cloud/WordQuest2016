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

    // Always calculate fresh data (skip cache for now to ensure skin field is included)
    let playersQuery = ctx.db.query("players");

    const players = await playersQuery.collect();

    // Get all players with some activity (has name and played at least once)
    let filteredPlayers = players.filter(
      (p) => p.name && (p.totalStars > 0 || p.xp > 0 || p.questsCompleted > 0)
    );

    // Filter by age group if specified
    if (args.ageGroup) {
      filteredPlayers = filteredPlayers.filter(
        (p) => p.ageGroup === args.ageGroup
      );
    }

    // Calculate score: always use totalStars * 100 + xp for consistency across app
    const getScore = (p: typeof players[0]) => {
      return (p.totalStars || 0) * 100 + (p.xp || 0);
    };

    // Sort by calculated score
    filteredPlayers.sort((a, b) => getScore(b) - getScore(a));

    // Create entries
    const entries = filteredPlayers.slice(0, limit).map((p, index) => ({
      playerId: p._id,
      displayName: p.name || "Anonymous",
      skin: p.skin || "🧙",
      normalizedScore: getScore(p),
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
        displayName: player.name || "Anonymous",
        normalizedScore: player.normalizedScore || 0,
        streak: player.streak || 0,
      },
      nearby: nearbyPlayers.map((p, i) => ({
        rank: startIndex + i + 1,
        displayName: p.name || "Anonymous",
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
        displayName: p.name || "Anonymous",
        skin: p.skin || "🧙",
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

// ========== AGE-BASED LEAGUES ==========

/**
 * Age group display names and emojis
 */
const AGE_GROUP_INFO: Record<string, { name: string; emoji: string; description: string }> = {
  "6-8": { name: "Юные Искатели", emoji: "🐣", description: "1-2 класс" },
  "9-11": { name: "Умные Лисы", emoji: "🦊", description: "3-5 класс" },
  "12+": { name: "Мудрые Волки", emoji: "🐺", description: "6+ класс" },
};

/**
 * Get leaderboard for a specific age group (league)
 */
export const getAgeLeagueLeaderboard = query({
  args: {
    ageGroup: v.string(),
    type: v.optional(v.string()), // "daily", "weekly", "monthly", "all_time"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const type = args.type || "weekly";
    const limit = args.limit || 50;

    // Get cached leaderboard
    const leaderboard = await ctx.db
      .query("leaderboards")
      .withIndex("by_type_age", (q) =>
        q.eq("type", type).eq("ageGroup", args.ageGroup)
      )
      .first();

    const leagueInfo = AGE_GROUP_INFO[args.ageGroup] || {
      name: "Unknown League",
      emoji: "🏆",
      description: "",
    };

    if (leaderboard) {
      return {
        type,
        ageGroup: args.ageGroup,
        leagueName: leagueInfo.name,
        leagueEmoji: leagueInfo.emoji,
        leagueDescription: leagueInfo.description,
        entries: leaderboard.entries.slice(0, limit),
        totalPlayers: leaderboard.entries.length,
        periodStart: leaderboard.periodStart,
        periodEnd: leaderboard.periodEnd,
        lastUpdated: leaderboard.lastUpdated,
      };
    }

    // Calculate on-the-fly if no cache
    const players = await ctx.db.query("players").collect();
    const filteredPlayers = players.filter(
      (p) =>
        p.competitionOptIn &&
        p.normalizedScore !== undefined &&
        p.ageGroup === args.ageGroup
    );

    filteredPlayers.sort(
      (a, b) => (b.normalizedScore || 0) - (a.normalizedScore || 0)
    );

    const entries = filteredPlayers.slice(0, limit).map((p, index) => ({
      playerId: p._id,
      displayName: p.name || "Anonymous",
      skin: p.skin || "🧙",
      normalizedScore: p.normalizedScore || 0,
      rawScore: p.totalRawScore || 0,
      accuracy: 0,
      streak: p.streak || 0,
      wordsLearned: p.wordsLearned || 0,
      rank: index + 1,
    }));

    const today = new Date();
    return {
      type,
      ageGroup: args.ageGroup,
      leagueName: leagueInfo.name,
      leagueEmoji: leagueInfo.emoji,
      leagueDescription: leagueInfo.description,
      entries,
      totalPlayers: filteredPlayers.length,
      periodStart: today.toISOString(),
      periodEnd: today.toISOString(),
      lastUpdated: today.toISOString(),
    };
  },
});

/**
 * Get all age leagues summary (for league selector UI)
 */
export const getAgeLeaguesSummary = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();
    const competitivePlayers = players.filter(
      (p) => p.competitionOptIn && p.ageGroup
    );

    const leagues = [];
    for (const [ageGroup, info] of Object.entries(AGE_GROUP_INFO)) {
      const leaguePlayers = competitivePlayers.filter(
        (p) => p.ageGroup === ageGroup
      );
      const topPlayer = leaguePlayers.sort(
        (a, b) => (b.normalizedScore || 0) - (a.normalizedScore || 0)
      )[0];

      leagues.push({
        ageGroup,
        name: info.name,
        emoji: info.emoji,
        description: info.description,
        playerCount: leaguePlayers.length,
        topPlayer: topPlayer
          ? {
              displayName: topPlayer.name || "Anonymous",
              normalizedScore: topPlayer.normalizedScore || 0,
            }
          : null,
      });
    }

    return leagues;
  },
});

// ========== IMPROVEMENT SCORES ==========

/**
 * Calculate and get improvement-based leaderboard
 * Ranks players by how much they improved this week/month
 */
export const getImprovementLeaderboard = query({
  args: {
    period: v.string(), // "weekly" or "monthly"
    ageGroup: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Calculate period start
    const now = new Date();
    const periodStart = new Date();
    if (args.period === "weekly") {
      periodStart.setDate(now.getDate() - 7);
    } else {
      periodStart.setDate(now.getDate() - 30);
    }
    const periodStartStr = periodStart.toISOString().split("T")[0];

    // Get all daily stats
    const allDailyStats = await ctx.db.query("dailyStats").collect();

    // Get all players
    let players = await ctx.db.query("players").collect();
    players = players.filter((p) => p.competitionOptIn);

    if (args.ageGroup) {
      players = players.filter((p) => p.ageGroup === args.ageGroup);
    }

    // Calculate improvement for each player
    const improvements = [];
    for (const player of players) {
      const playerStats = allDailyStats.filter(
        (ds) => ds.playerId === player._id && ds.date >= periodStartStr
      );

      if (playerStats.length < 2) continue;

      // Sort by date
      playerStats.sort((a, b) => a.date.localeCompare(b.date));

      // Calculate metrics
      const totalQuestions = playerStats.reduce(
        (sum, ds) => sum + ds.questionsAnswered,
        0
      );
      const totalCorrect = playerStats.reduce(
        (sum, ds) => sum + ds.correctAnswers,
        0
      );
      const avgAccuracy =
        totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      // Calculate accuracy improvement (compare first half vs second half)
      const midpoint = Math.floor(playerStats.length / 2);
      const firstHalf = playerStats.slice(0, midpoint);
      const secondHalf = playerStats.slice(midpoint);

      const firstHalfAccuracy =
        firstHalf.reduce((sum, ds) => sum + ds.questionsAnswered, 0) > 0
          ? (firstHalf.reduce((sum, ds) => sum + ds.correctAnswers, 0) /
              firstHalf.reduce((sum, ds) => sum + ds.questionsAnswered, 0)) *
            100
          : 0;

      const secondHalfAccuracy =
        secondHalf.reduce((sum, ds) => sum + ds.questionsAnswered, 0) > 0
          ? (secondHalf.reduce((sum, ds) => sum + ds.correctAnswers, 0) /
              secondHalf.reduce((sum, ds) => sum + ds.questionsAnswered, 0)) *
            100
          : 0;

      const accuracyImprovement = secondHalfAccuracy - firstHalfAccuracy;

      // Calculate engagement improvement
      const daysActive = playerStats.length;
      const expectedDays = args.period === "weekly" ? 7 : 30;
      const consistencyScore = (daysActive / expectedDays) * 100;

      // Combined improvement score
      const improvementScore = Math.round(
        accuracyImprovement * 0.5 + // Weight accuracy improvement
          consistencyScore * 0.3 + // Weight consistency
          Math.min(totalQuestions / 10, 20) // Weight activity (capped)
      );

      improvements.push({
        playerId: player._id,
        displayName: player.name || "Anonymous",
        ageGroup: player.ageGroup,
        improvementScore,
        accuracyImprovement: Math.round(accuracyImprovement),
        avgAccuracy: Math.round(avgAccuracy),
        daysActive,
        totalQuestions,
        streak: player.streak,
      });
    }

    // Sort by improvement score
    improvements.sort((a, b) => b.improvementScore - a.improvementScore);

    // Add ranks
    const entries = improvements.slice(0, limit).map((imp, index) => ({
      ...imp,
      rank: index + 1,
    }));

    const leagueInfo = args.ageGroup
      ? AGE_GROUP_INFO[args.ageGroup]
      : null;

    return {
      period: args.period,
      ageGroup: args.ageGroup || "all",
      leagueName: leagueInfo?.name || "Все игроки",
      leagueEmoji: leagueInfo?.emoji || "🏆",
      entries,
      periodStart: periodStartStr,
      periodEnd: now.toISOString().split("T")[0],
    };
  },
});

// ========== PERSONAL RECORDS ==========

/**
 * Get player's personal records and comparison with past performance
 */
export const getPlayerPersonalRecords = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return null;

    // Get all daily stats
    const dailyStats = await ctx.db
      .query("dailyStats")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    if (dailyStats.length === 0) {
      return {
        hasData: false,
        message: "Начни играть, чтобы увидеть свои рекорды!",
      };
    }

    // Calculate records
    const bestAccuracyDay = dailyStats
      .filter((ds) => ds.questionsAnswered >= 5)
      .sort((a, b) => {
        const accA = (a.correctAnswers / a.questionsAnswered) * 100;
        const accB = (b.correctAnswers / b.questionsAnswered) * 100;
        return accB - accA;
      })[0];

    const mostQuestionsDay = dailyStats.sort(
      (a, b) => b.questionsAnswered - a.questionsAnswered
    )[0];

    const longestSessionDay = dailyStats.sort(
      (a, b) => b.timeSpentMinutes - a.timeSpentMinutes
    )[0];

    // Compare with recent performance
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    const lastWeekStats = dailyStats.filter(
      (ds) => new Date(ds.date) >= weekAgo
    );
    const lastMonthStats = dailyStats.filter(
      (ds) => new Date(ds.date) >= monthAgo
    );

    const calcAvgAccuracy = (stats: typeof dailyStats) => {
      const total = stats.reduce((sum, ds) => sum + ds.questionsAnswered, 0);
      const correct = stats.reduce((sum, ds) => sum + ds.correctAnswers, 0);
      return total > 0 ? Math.round((correct / total) * 100) : 0;
    };

    const weeklyAvgAccuracy = calcAvgAccuracy(lastWeekStats);
    const monthlyAvgAccuracy = calcAvgAccuracy(lastMonthStats);
    const allTimeAvgAccuracy = calcAvgAccuracy(dailyStats);

    return {
      hasData: true,
      records: {
        bestAccuracy: bestAccuracyDay
          ? {
              date: bestAccuracyDay.date,
              accuracy: Math.round(
                (bestAccuracyDay.correctAnswers /
                  bestAccuracyDay.questionsAnswered) *
                  100
              ),
            }
          : null,
        mostQuestions: mostQuestionsDay
          ? {
              date: mostQuestionsDay.date,
              count: mostQuestionsDay.questionsAnswered,
            }
          : null,
        longestSession: longestSessionDay
          ? {
              date: longestSessionDay.date,
              minutes: longestSessionDay.timeSpentMinutes,
            }
          : null,
        longestStreak: player.streak, // Current streak is often the longest
      },
      comparison: {
        weeklyAvgAccuracy,
        monthlyAvgAccuracy,
        allTimeAvgAccuracy,
        trend:
          weeklyAvgAccuracy > monthlyAvgAccuracy
            ? "improving"
            : weeklyAvgAccuracy < monthlyAvgAccuracy
              ? "declining"
              : "stable",
      },
      totalDaysPlayed: dailyStats.length,
      totalQuestions: dailyStats.reduce(
        (sum, ds) => sum + ds.questionsAnswered,
        0
      ),
    };
  },
});
