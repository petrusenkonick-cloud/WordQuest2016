import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Track an error when a child answers incorrectly
export const trackError = mutation({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
    subTopic: v.optional(v.string()),
    subject: v.string(),
    errorType: v.string(),
    question: v.string(),
    wrongAnswer: v.string(),
    correctAnswer: v.string(),
    source: v.string(),
    homeworkSessionId: v.optional(v.id("homeworkSessions")),
  },
  handler: async (ctx, args) => {
    // Check if there's already an unresolved error for this exact question
    const existingError = await ctx.db
      .query("errorTracking")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) =>
        q.and(
          q.eq(q.field("question"), args.question),
          q.eq(q.field("resolved"), false)
        )
      )
      .first();

    if (existingError) {
      // Don't duplicate - just return the existing one
      return existingError._id;
    }

    // Create new error record
    const errorId = await ctx.db.insert("errorTracking", {
      playerId: args.playerId,
      topic: args.topic,
      subTopic: args.subTopic,
      subject: args.subject,
      errorType: args.errorType,
      question: args.question,
      wrongAnswer: args.wrongAnswer,
      correctAnswer: args.correctAnswer,
      source: args.source,
      homeworkSessionId: args.homeworkSessionId,
      resolved: false,
      createdAt: new Date().toISOString(),
    });

    // Also update topic progress if it exists
    const topicProgress = await ctx.db
      .query("topicProgress")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .first();

    if (topicProgress) {
      const newAccuracy = Math.round(
        ((topicProgress.correctAttempts) / (topicProgress.totalAttempts + 1)) * 100
      );
      await ctx.db.patch(topicProgress._id, {
        totalAttempts: topicProgress.totalAttempts + 1,
        accuracy: newAccuracy,
        needsPractice: newAccuracy < 60,
        lastPracticed: new Date().toISOString(),
      });
    } else {
      // Create new topic progress
      await ctx.db.insert("topicProgress", {
        playerId: args.playerId,
        topic: args.topic,
        subject: args.subject,
        totalAttempts: 1,
        correctAttempts: 0,
        accuracy: 0,
        lastPracticed: new Date().toISOString(),
        needsPractice: true,
      });
    }

    return errorId;
  },
});

// Mark an error as resolved (practiced and corrected)
export const resolveError = mutation({
  args: {
    errorId: v.id("errorTracking"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.errorId, {
      resolved: true,
      resolvedAt: new Date().toISOString(),
    });
  },
});

// Get weak topics for a player (topics with most unresolved errors)
export const getWeakTopics = query({
  args: {
    playerId: v.id("players"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 6;

    // Get all unresolved errors from the past 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const errors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player_resolved", (q) =>
        q.eq("playerId", args.playerId).eq("resolved", false)
      )
      .filter((q) => q.gte(q.field("createdAt"), twoWeeksAgo.toISOString()))
      .collect();

    // Group by topic and count
    const topicCounts: Record<
      string,
      {
        topic: string;
        subject: string;
        count: number;
        lastError: string;
        examples: string[];
      }
    > = {};

    for (const error of errors) {
      if (!topicCounts[error.topic]) {
        topicCounts[error.topic] = {
          topic: error.topic,
          subject: error.subject,
          count: 0,
          lastError: error.createdAt,
          examples: [],
        };
      }
      topicCounts[error.topic].count++;
      if (error.createdAt > topicCounts[error.topic].lastError) {
        topicCounts[error.topic].lastError = error.createdAt;
      }
      if (topicCounts[error.topic].examples.length < 3) {
        topicCounts[error.topic].examples.push(error.question);
      }
    }

    // Sort by count (most errors first) and return top N
    return Object.values(topicCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
});

// Get error statistics for a player
export const getErrorStats = query({
  args: {
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    // Get errors from this week
    const weekStart = getWeekStart(new Date());

    const thisWeekErrors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.gte(q.field("createdAt"), weekStart.toISOString()))
      .collect();

    const resolved = thisWeekErrors.filter((e) => e.resolved).length;
    const unresolved = thisWeekErrors.filter((e) => !e.resolved).length;

    // Group by subject
    const bySubject: Record<string, { total: number; resolved: number }> = {};
    for (const error of thisWeekErrors) {
      if (!bySubject[error.subject]) {
        bySubject[error.subject] = { total: 0, resolved: 0 };
      }
      bySubject[error.subject].total++;
      if (error.resolved) {
        bySubject[error.subject].resolved++;
      }
    }

    return {
      thisWeekTotal: thisWeekErrors.length,
      resolved,
      unresolved,
      bySubject,
      weekStart: weekStart.toISOString(),
    };
  },
});

// Get recent errors for display
export const getRecentErrors = query({
  args: {
    playerId: v.id("players"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const errors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(limit);

    return errors;
  },
});

// Helper function to get Monday of current week
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Bulk resolve errors for a topic (when completing a practice quest)
export const resolveTopicErrors = mutation({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    const errors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .filter((q) => q.eq(q.field("resolved"), false))
      .collect();

    const now = new Date().toISOString();
    let resolved = 0;

    for (const error of errors) {
      await ctx.db.patch(error._id, {
        resolved: true,
        resolvedAt: now,
      });
      resolved++;
    }

    // Update topic progress
    const topicProgress = await ctx.db
      .query("topicProgress")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .first();

    if (topicProgress) {
      // Boost accuracy after practice
      const newAccuracy = Math.min(topicProgress.accuracy + 20, 100);
      await ctx.db.patch(topicProgress._id, {
        accuracy: newAccuracy,
        needsPractice: newAccuracy < 60,
        lastPracticed: now,
      });
    }

    return { resolved };
  },
});
