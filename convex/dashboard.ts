import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { calculatePercentile, AgeGroup, AGE_GROUPS } from "./scoring";

/**
 * Get platform-wide statistics
 */
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    // Get latest platform stats
    const today = new Date().toISOString().split("T")[0];
    const stats = await ctx.db
      .query("platformStats")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (stats) {
      return stats;
    }

    // Calculate stats on the fly if not cached
    const players = await ctx.db.query("players").collect();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activePlayers = players.filter((p) => {
      if (!p.lastLogin) return false;
      return new Date(p.lastLogin) >= sevenDaysAgo;
    });

    // Calculate age group stats
    const ageGroupStats = Object.keys(AGE_GROUPS).map((ageGroup) => {
      const groupPlayers = players.filter((p) => p.ageGroup === ageGroup);
      const avgAccuracy =
        groupPlayers.length > 0
          ? groupPlayers.reduce((sum, p) => sum + (p.totalStars || 0), 0) /
            groupPlayers.length
          : 0;
      const avgNormalizedScore =
        groupPlayers.length > 0
          ? groupPlayers.reduce((sum, p) => sum + (p.normalizedScore || 0), 0) /
            groupPlayers.length
          : 0;
      const avgStreak =
        groupPlayers.length > 0
          ? groupPlayers.reduce((sum, p) => sum + (p.streak || 0), 0) /
            groupPlayers.length
          : 0;
      const avgWordsLearned =
        groupPlayers.length > 0
          ? groupPlayers.reduce((sum, p) => sum + (p.wordsLearned || 0), 0) /
            groupPlayers.length
          : 0;

      return {
        ageGroup,
        playerCount: groupPlayers.length,
        avgAccuracy: Math.round(avgAccuracy),
        avgNormalizedScore: Math.round(avgNormalizedScore),
        avgStreak: Math.round(avgStreak * 10) / 10,
        avgWordsLearned: Math.round(avgWordsLearned),
      };
    });

    return {
      date: today,
      totalPlayers: players.length,
      activePlayers: activePlayers.length,
      totalQuestionsAnswered: 0, // Would need to aggregate from sessions
      averageAccuracy: 0,
      totalWordsLearned: players.reduce(
        (sum, p) => sum + (p.wordsLearned || 0),
        0
      ),
      ageGroupStats,
      lastUpdated: new Date().toISOString(),
    };
  },
});

/**
 * Get player comparison with peers
 */
export const getPlayerComparison = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      return null;
    }

    // Get all players in same age group
    const ageGroup = player.ageGroup || "12+";
    const peers = await ctx.db
      .query("players")
      .withIndex("by_age_group", (q) => q.eq("ageGroup", ageGroup))
      .collect();

    // Filter competitive players
    const competitivePeers = peers.filter(
      (p) => p.competitionOptIn && p.normalizedScore !== undefined
    );

    // Calculate averages
    const peerScores = competitivePeers.map((p) => p.normalizedScore || 0);
    const avgPeerScore =
      peerScores.length > 0
        ? peerScores.reduce((a, b) => a + b, 0) / peerScores.length
        : 0;

    const avgPeerStreak =
      competitivePeers.length > 0
        ? competitivePeers.reduce((sum, p) => sum + (p.streak || 0), 0) /
          competitivePeers.length
        : 0;

    const avgPeerWords =
      competitivePeers.length > 0
        ? competitivePeers.reduce((sum, p) => sum + (p.wordsLearned || 0), 0) /
          competitivePeers.length
        : 0;

    // Calculate percentile
    const percentile = calculatePercentile(
      player.normalizedScore || 0,
      peerScores
    );

    return {
      player: {
        id: player._id,
        name: player.name,
        displayName: player.name || "Anonymous",
        normalizedScore: player.normalizedScore || 0,
        streak: player.streak || 0,
        wordsLearned: player.wordsLearned || 0,
        ageGroup,
      },
      peerStats: {
        totalPeers: competitivePeers.length,
        avgScore: Math.round(avgPeerScore),
        avgStreak: Math.round(avgPeerStreak * 10) / 10,
        avgWordsLearned: Math.round(avgPeerWords),
      },
      comparison: {
        percentile,
        scoreDiff: Math.round((player.normalizedScore || 0) - avgPeerScore),
        isAboveAverage: (player.normalizedScore || 0) > avgPeerScore,
      },
    };
  },
});

/**
 * Get weekly trends for a player
 */
export const getWeeklyTrends = query({
  args: { playerId: v.optional(v.id("players")) },
  handler: async (ctx, args) => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      if (args.playerId) {
        // Get player's daily stats
        const stats = await ctx.db
          .query("dailyStats")
          .withIndex("by_player_date", (q) =>
            q.eq("playerId", args.playerId!).eq("date", dateStr)
          )
          .first();

        days.push({
          date: dateStr,
          day: dayName,
          questionsAnswered: stats?.questionsAnswered || 0,
          correctAnswers: stats?.correctAnswers || 0,
          xpEarned: stats?.xpEarned || 0,
          timeSpentMinutes: stats?.timeSpentMinutes || 0,
        });
      } else {
        // Platform-wide stats (simplified)
        days.push({
          date: dateStr,
          day: dayName,
          questionsAnswered: 0,
          correctAnswers: 0,
          xpEarned: 0,
          timeSpentMinutes: 0,
        });
      }
    }

    // Calculate totals
    const totals = days.reduce(
      (acc, day) => ({
        totalQuestions: acc.totalQuestions + day.questionsAnswered,
        totalCorrect: acc.totalCorrect + day.correctAnswers,
        totalXp: acc.totalXp + day.xpEarned,
        totalTime: acc.totalTime + day.timeSpentMinutes,
        activeDays: acc.activeDays + (day.questionsAnswered > 0 ? 1 : 0),
      }),
      {
        totalQuestions: 0,
        totalCorrect: 0,
        totalXp: 0,
        totalTime: 0,
        activeDays: 0,
      }
    );

    return {
      days,
      totals,
      accuracy:
        totals.totalQuestions > 0
          ? Math.round((totals.totalCorrect / totals.totalQuestions) * 100)
          : 0,
    };
  },
});

/**
 * Get age group stats for comparison chart
 */
export const getAgeGroupStats = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();

    return Object.keys(AGE_GROUPS).map((ageGroup) => {
      const groupPlayers = players.filter(
        (p) => p.ageGroup === ageGroup && p.competitionOptIn
      );

      if (groupPlayers.length === 0) {
        return {
          ageGroup,
          label: AGE_GROUPS[ageGroup as AgeGroup].label,
          playerCount: 0,
          avgScore: 0,
          avgStreak: 0,
          topScore: 0,
        };
      }

      const scores = groupPlayers.map((p) => p.normalizedScore || 0);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const avgStreak =
        groupPlayers.reduce((sum, p) => sum + (p.streak || 0), 0) /
        groupPlayers.length;
      const topScore = Math.max(...scores);

      return {
        ageGroup,
        label: AGE_GROUPS[ageGroup as AgeGroup].label,
        playerCount: groupPlayers.length,
        avgScore: Math.round(avgScore),
        avgStreak: Math.round(avgStreak * 10) / 10,
        topScore,
      };
    });
  },
});

/**
 * Aggregate platform stats (called by cron)
 */
export const aggregatePlatformStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];

    // Check if already aggregated today
    const existing = await ctx.db
      .query("platformStats")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    const players = await ctx.db.query("players").collect();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activePlayers = players.filter((p) => {
      if (!p.lastLogin) return false;
      return new Date(p.lastLogin) >= sevenDaysAgo;
    });

    // Get all daily stats for today
    const todayStats = await ctx.db
      .query("dailyStats")
      .withIndex("by_player_date")
      .collect();

    const todayStatsFiltered = todayStats.filter((s) => s.date === today);

    const totalQuestions = todayStatsFiltered.reduce(
      (sum, s) => sum + s.questionsAnswered,
      0
    );
    const totalCorrect = todayStatsFiltered.reduce(
      (sum, s) => sum + s.correctAnswers,
      0
    );

    // Calculate age group stats
    const ageGroupStats = Object.keys(AGE_GROUPS).map((ageGroup) => {
      const groupPlayers = players.filter((p) => p.ageGroup === ageGroup);
      const competitivePlayers = groupPlayers.filter((p) => p.competitionOptIn);

      return {
        ageGroup,
        playerCount: competitivePlayers.length,
        avgAccuracy:
          competitivePlayers.length > 0
            ? Math.round(
                competitivePlayers.reduce(
                  (sum, p) => sum + (p.totalStars || 0),
                  0
                ) / competitivePlayers.length
              )
            : 0,
        avgNormalizedScore:
          competitivePlayers.length > 0
            ? Math.round(
                competitivePlayers.reduce(
                  (sum, p) => sum + (p.normalizedScore || 0),
                  0
                ) / competitivePlayers.length
              )
            : 0,
        avgStreak:
          competitivePlayers.length > 0
            ? Math.round(
                (competitivePlayers.reduce(
                  (sum, p) => sum + (p.streak || 0),
                  0
                ) /
                  competitivePlayers.length) *
                  10
              ) / 10
            : 0,
        avgWordsLearned:
          competitivePlayers.length > 0
            ? Math.round(
                competitivePlayers.reduce(
                  (sum, p) => sum + (p.wordsLearned || 0),
                  0
                ) / competitivePlayers.length
              )
            : 0,
      };
    });

    const statsData = {
      date: today,
      totalPlayers: players.length,
      activePlayers: activePlayers.length,
      totalQuestionsAnswered: totalQuestions,
      averageAccuracy:
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0,
      totalWordsLearned: players.reduce(
        (sum, p) => sum + (p.wordsLearned || 0),
        0
      ),
      ageGroupStats,
      lastUpdated: new Date().toISOString(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, statsData);
    } else {
      await ctx.db.insert("platformStats", statsData);
    }

    return { success: true };
  },
});
