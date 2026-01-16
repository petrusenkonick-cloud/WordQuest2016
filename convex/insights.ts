import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * AI Insights System
 *
 * Analyzes player learning patterns and generates actionable insights
 * for both children and parents.
 */

// ========== INSIGHT GENERATION ==========

interface InsightData {
  playerId: Id<"players">;
  insightType: "strength" | "weakness" | "recommendation" | "pattern" | "milestone";
  category: string;
  title: string;
  description: string;
  actionItems?: string[];
  relatedTopics?: string[];
  confidence: number;
  priority: number;
}

/**
 * Generate insights from player data (called periodically or after sessions)
 */
export const generateInsights = internalMutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return { success: false, error: "Player not found" };

    // Get topic progress
    const topicProgress = await ctx.db
      .query("topicProgress")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Get recent errors
    const recentErrors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(50);

    // Get daily stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyStats = await ctx.db
      .query("dailyStats")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    const recentStats = dailyStats.filter(
      (ds) => new Date(ds.date) >= sevenDaysAgo
    );

    // Get SRS data
    const srsData = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const insights: InsightData[] = [];
    const now = new Date().toISOString();

    // ===== STRENGTH INSIGHTS =====
    const strongTopics = topicProgress.filter(
      (tp) => tp.accuracy >= 80 && tp.totalAttempts >= 5
    );
    if (strongTopics.length > 0) {
      const topThree = strongTopics
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 3);

      insights.push({
        playerId: args.playerId,
        insightType: "strength",
        category: "topic_mastery",
        title: "Сильные темы",
        description: `Отличные результаты в: ${topThree.map((t) => t.topic).join(", ")}. Продолжай в том же духе!`,
        relatedTopics: topThree.map((t) => t.topic),
        confidence: 90,
        priority: 2,
      });
    }

    // ===== WEAKNESS INSIGHTS =====
    const weakTopics = topicProgress.filter(
      (tp) => tp.accuracy < 60 && tp.totalAttempts >= 3
    );
    if (weakTopics.length > 0) {
      const worstThree = weakTopics
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3);

      insights.push({
        playerId: args.playerId,
        insightType: "weakness",
        category: "topic_mastery",
        title: "Темы для практики",
        description: `Рекомендуем больше практики в: ${worstThree.map((t) => t.topic).join(", ")}`,
        actionItems: [
          "Попробуй начать с простых заданий",
          "Используй подсказки, если нужно",
          "Повторяй каждый день понемногу",
        ],
        relatedTopics: worstThree.map((t) => t.topic),
        confidence: 85,
        priority: 4,
      });
    }

    // ===== ERROR PATTERN INSIGHTS =====
    const errorsByType: Record<string, number> = {};
    for (const err of recentErrors) {
      errorsByType[err.errorType] = (errorsByType[err.errorType] || 0) + 1;
    }

    const dominantErrorType = Object.entries(errorsByType).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (dominantErrorType && dominantErrorType[1] >= 5) {
      const errorTypeNames: Record<string, string> = {
        spelling: "орфографические ошибки",
        grammar: "грамматические ошибки",
        logic: "логические ошибки",
        comprehension: "ошибки понимания",
        general: "общие ошибки",
      };

      insights.push({
        playerId: args.playerId,
        insightType: "pattern",
        category: "error_pattern",
        title: "Паттерн ошибок",
        description: `Замечен паттерн: ${errorTypeNames[dominantErrorType[0]] || dominantErrorType[0]}. Обрати внимание на этот тип заданий.`,
        actionItems: [
          "Перечитывай вопрос перед ответом",
          "Проверяй ответ перед отправкой",
        ],
        confidence: 75,
        priority: 3,
      });
    }

    // ===== TIME PATTERN INSIGHTS =====
    if (recentStats.length >= 3) {
      // Analyze best time of day (simplified - would need session time data)
      const avgAccuracy =
        recentStats.reduce((sum, ds) => {
          const acc = ds.questionsAnswered > 0
            ? (ds.correctAnswers / ds.questionsAnswered) * 100
            : 0;
          return sum + acc;
        }, 0) / recentStats.length;

      if (avgAccuracy >= 80) {
        insights.push({
          playerId: args.playerId,
          insightType: "pattern",
          category: "performance",
          title: "Отличная неделя!",
          description: `Средняя точность за неделю: ${Math.round(avgAccuracy)}%. Так держать!`,
          confidence: 95,
          priority: 1,
        });
      }
    }

    // ===== STREAK MILESTONE INSIGHTS =====
    if (player.streak >= 7 && player.streak % 7 === 0) {
      insights.push({
        playerId: args.playerId,
        insightType: "milestone",
        category: "engagement",
        title: `${player.streak} дней подряд!`,
        description: `Невероятно! Ты занимаешься уже ${player.streak} дней подряд. Это настоящее достижение!`,
        confidence: 100,
        priority: 1,
      });
    }

    // ===== SRS RECOMMENDATIONS =====
    const today = new Date().toISOString().split("T")[0];
    const dueTopics = srsData.filter((srs) => srs.nextReviewDate <= today);

    if (dueTopics.length >= 5) {
      insights.push({
        playerId: args.playerId,
        insightType: "recommendation",
        category: "spaced_repetition",
        title: "Время повторения!",
        description: `${dueTopics.length} тем готовы к повторению. Регулярное повторение помогает запоминать надолго!`,
        actionItems: [
          "Открой раздел повторения",
          `Повтори хотя бы ${Math.min(5, dueTopics.length)} тем сегодня`,
        ],
        relatedTopics: dueTopics.slice(0, 5).map((srs) => srs.topic),
        confidence: 90,
        priority: 3,
      });
    }

    // ===== MASTERY MILESTONE =====
    const masteredTopics = srsData.filter((srs) => srs.level >= 4);
    if (masteredTopics.length > 0 && masteredTopics.length % 5 === 0) {
      insights.push({
        playerId: args.playerId,
        insightType: "milestone",
        category: "mastery",
        title: `${masteredTopics.length} тем освоено!`,
        description: `Ты освоил уже ${masteredTopics.length} тем! Продолжай учиться новому.`,
        confidence: 100,
        priority: 2,
      });
    }

    // Save insights
    const existingInsights = await ctx.db
      .query("playerInsights")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Remove old insights of same types (keep only recent)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oldInsights = existingInsights.filter(
      (i) => new Date(i.generatedAt) < oneWeekAgo
    );
    for (const old of oldInsights) {
      await ctx.db.delete(old._id);
    }

    // Insert new insights
    for (const insight of insights) {
      // Check if similar insight already exists
      const similar = existingInsights.find(
        (i) =>
          i.insightType === insight.insightType &&
          i.category === insight.category &&
          new Date(i.generatedAt) > oneWeekAgo
      );

      if (!similar) {
        await ctx.db.insert("playerInsights", {
          ...insight,
          isRead: false,
          generatedAt: now,
        });
      }
    }

    return { success: true, insightsGenerated: insights.length };
  },
});

/**
 * Generate weekly summary for parents
 */
export const generateWeeklySummary = internalMutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return null;

    // Calculate week start (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Get daily stats for this week
    const dailyStats = await ctx.db
      .query("dailyStats")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const weeklyStats = dailyStats.filter((ds) => ds.date >= weekStartStr);

    // Aggregate stats
    const totalQuestions = weeklyStats.reduce((sum, ds) => sum + ds.questionsAnswered, 0);
    const totalCorrect = weeklyStats.reduce((sum, ds) => sum + ds.correctAnswers, 0);
    const totalTime = weeklyStats.reduce((sum, ds) => sum + ds.timeSpentMinutes, 0);
    const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Get topic progress
    const topicProgress = await ctx.db
      .query("topicProgress")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const strongTopics = topicProgress
      .filter((tp) => tp.accuracy >= 80)
      .map((tp) => tp.topic)
      .slice(0, 5);

    const weakTopics = topicProgress
      .filter((tp) => tp.accuracy < 60)
      .map((tp) => tp.topic)
      .slice(0, 5);

    // Determine overall progress
    let overallProgress: "excellent" | "good" | "needs_attention" = "good";
    if (avgAccuracy >= 80 && weeklyStats.length >= 5) {
      overallProgress = "excellent";
    } else if (avgAccuracy < 50 || weeklyStats.length < 2) {
      overallProgress = "needs_attention";
    }

    // Generate summary text
    const summaryParts: string[] = [];
    if (overallProgress === "excellent") {
      summaryParts.push(`${player.name} показывает отличные результаты на этой неделе!`);
    } else if (overallProgress === "needs_attention") {
      summaryParts.push(`${player.name} занимался меньше обычного на этой неделе.`);
    } else {
      summaryParts.push(`${player.name} продолжает делать успехи в обучении.`);
    }

    if (totalQuestions > 0) {
      summaryParts.push(`Ответил на ${totalQuestions} вопросов с точностью ${avgAccuracy}%.`);
    }

    if (strongTopics.length > 0) {
      summaryParts.push(`Сильные стороны: ${strongTopics.slice(0, 3).join(", ")}.`);
    }

    if (weakTopics.length > 0) {
      summaryParts.push(`Рекомендуем практику: ${weakTopics.slice(0, 3).join(", ")}.`);
    }

    const summary = {
      playerId: args.playerId,
      weekStart: weekStartStr,
      overallProgress,
      summaryText: summaryParts.join(" "),
      strongTopics,
      weakTopics,
      suggestedFocus: weakTopics.slice(0, 3),
      timeSpentMinutes: totalTime,
      questionsAnswered: totalQuestions,
      averageAccuracy: avgAccuracy,
      streakDays: player.streak,
      engagementScore: Math.min(100, Math.round((weeklyStats.length / 7) * 100)),
      generatedAt: new Date().toISOString(),
    };

    // Check if summary already exists
    const existing = await ctx.db
      .query("weeklyInsightsSummary")
      .withIndex("by_player_week", (q) =>
        q.eq("playerId", args.playerId).eq("weekStart", weekStartStr)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, summary);
      return existing._id;
    } else {
      return await ctx.db.insert("weeklyInsightsSummary", summary);
    }
  },
});

// ========== QUERIES ==========

/**
 * Get player's unread insights
 */
export const getUnreadInsights = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("playerInsights")
      .withIndex("by_player_unread", (q) =>
        q.eq("playerId", args.playerId).eq("isRead", false)
      )
      .collect();
  },
});

/**
 * Get all insights for a player (paginated)
 */
export const getPlayerInsights = query({
  args: {
    playerId: v.id("players"),
    limit: v.optional(v.number()),
    insightType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("playerInsights")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId));

    let insights = await query.collect();

    // Filter by type if specified
    if (args.insightType) {
      insights = insights.filter((i) => i.insightType === args.insightType);
    }

    // Sort by priority and date
    insights.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
    });

    const limit = args.limit || 20;
    return insights.slice(0, limit);
  },
});

/**
 * Get weekly summary for parent view
 */
export const getWeeklySummary = query({
  args: {
    playerId: v.id("players"),
    weekStart: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.weekStart) {
      const weekStart = args.weekStart;
      return await ctx.db
        .query("weeklyInsightsSummary")
        .withIndex("by_player_week", (q) =>
          q.eq("playerId", args.playerId).eq("weekStart", weekStart)
        )
        .first();
    }

    // Get most recent summary
    const summaries = await ctx.db
      .query("weeklyInsightsSummary")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(1);

    return summaries[0] || null;
  },
});

/**
 * Get insight statistics
 */
export const getInsightStats = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("playerInsights")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const byType = {
      strength: insights.filter((i) => i.insightType === "strength").length,
      weakness: insights.filter((i) => i.insightType === "weakness").length,
      recommendation: insights.filter((i) => i.insightType === "recommendation").length,
      pattern: insights.filter((i) => i.insightType === "pattern").length,
      milestone: insights.filter((i) => i.insightType === "milestone").length,
    };

    const unreadCount = insights.filter((i) => !i.isRead).length;
    const highPriorityCount = insights.filter((i) => i.priority >= 4 && !i.isRead).length;

    return {
      total: insights.length,
      unreadCount,
      highPriorityCount,
      byType,
    };
  },
});

// ========== MUTATIONS ==========

/**
 * Mark insight as read
 */
export const markInsightRead = mutation({
  args: { insightId: v.id("playerInsights") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.insightId, { isRead: true });
  },
});

/**
 * Mark all insights as read
 */
export const markAllInsightsRead = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("playerInsights")
      .withIndex("by_player_unread", (q) =>
        q.eq("playerId", args.playerId).eq("isRead", false)
      )
      .collect();

    for (const insight of insights) {
      await ctx.db.patch(insight._id, { isRead: true });
    }

    return { markedRead: insights.length };
  },
});

/**
 * Trigger insight generation manually (e.g., after a learning session)
 */
export const triggerInsightGeneration = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    // This would typically schedule the internal mutation
    // For now, we'll just return a success indicator
    // In production, use scheduler to run generateInsights
    return { scheduled: true };
  },
});
