import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ========== PLAYER CONTEXT FOR AI PERSONALIZATION ==========

/**
 * Get comprehensive player context for AI-powered question generation
 * This includes age, grade, topic progress, recent errors, and learning preferences
 */
export const getPlayerContext = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return null;

    // Get topic progress
    const topicProgress = await ctx.db
      .query("topicProgress")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Get learning profile
    const learningProfile = await ctx.db
      .query("learningProfile")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    // Get recent errors (last 20)
    const recentErrors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(20);

    // Get topics due for review (SRS)
    const today = new Date().toISOString().split("T")[0];
    const dueSRS = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    const topicsDueForReview = dueSRS
      .filter((srs) => srs.nextReviewDate <= today)
      .map((srs) => ({
        topic: srs.topic,
        subject: srs.subject,
        level: srs.level,
        daysSinceReview: Math.floor(
          (new Date().getTime() - new Date(srs.lastReviewDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));

    // Calculate adaptive difficulty based on recent performance
    const recentTopicProgress = topicProgress.slice(0, 10);
    const averageAccuracy = recentTopicProgress.length > 0
      ? recentTopicProgress.reduce((sum, tp) => sum + tp.accuracy, 0) / recentTopicProgress.length
      : 50;

    // Determine difficulty level
    let adaptiveDifficulty: "very_easy" | "easy" | "medium" | "hard" | "very_hard" = "medium";
    if (averageAccuracy >= 90) adaptiveDifficulty = "very_hard";
    else if (averageAccuracy >= 75) adaptiveDifficulty = "hard";
    else if (averageAccuracy >= 60) adaptiveDifficulty = "medium";
    else if (averageAccuracy >= 40) adaptiveDifficulty = "easy";
    else adaptiveDifficulty = "very_easy";

    // Get weak topics (needs practice)
    const weakTopics = topicProgress
      .filter((tp) => tp.needsPractice)
      .map((tp) => ({
        topic: tp.topic,
        subject: tp.subject,
        accuracy: tp.accuracy,
      }));

    // Get strong topics
    const strongTopics = topicProgress
      .filter((tp) => tp.accuracy >= 80 && tp.totalAttempts >= 5)
      .map((tp) => ({
        topic: tp.topic,
        subject: tp.subject,
        accuracy: tp.accuracy,
      }));

    // Calculate age from birth year or use grade level
    const currentYear = new Date().getFullYear();
    const playerAge = player.birthYear
      ? currentYear - player.birthYear
      : player.gradeLevel
        ? player.gradeLevel + 5 // Approximate age from grade
        : 10; // Default age

    return {
      // Player demographics
      playerAge,
      gradeLevel: player.gradeLevel || 5,
      ageGroup: player.ageGroup || "9-11",
      nativeLanguage: player.nativeLanguage || "ru",

      // Learning stats
      level: player.level,
      totalStars: player.totalStars,
      wordsLearned: player.wordsLearned,
      streak: player.streak,

      // Adaptive difficulty
      adaptiveDifficulty,
      averageAccuracy: Math.round(averageAccuracy),

      // Topic analysis
      weakTopics,
      strongTopics,
      topicsDueForReview,

      // Recent errors for targeted practice
      recentErrors: recentErrors.map((err) => ({
        topic: err.topic,
        errorType: err.errorType,
        question: err.question,
        wrongAnswer: err.wrongAnswer,
        correctAnswer: err.correctAnswer,
      })),

      // Learning preferences
      preferredStyle: learningProfile?.preferredStyle || "visual",
      explanationPreference: learningProfile?.explanationPreference || "examples",
      hintsEnabled: learningProfile?.hintsEnabled ?? true,
      voiceEnabled: learningProfile?.voiceEnabled ?? true,
    };
  },
});

/**
 * Get specific topic context for generating questions about a single topic
 */
export const getTopicContext = query({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return null;

    // Get topic progress
    const topicProgress = await ctx.db
      .query("topicProgress")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .first();

    // Get SRS data for this topic
    const srsData = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .first();

    // Get recent errors for this topic
    const recentErrors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .order("desc")
      .take(10);

    // Calculate difficulty for this specific topic
    const accuracy = topicProgress?.accuracy ?? 50;
    let difficulty: "very_easy" | "easy" | "medium" | "hard" | "very_hard" = "medium";
    if (accuracy >= 90) difficulty = "very_hard";
    else if (accuracy >= 75) difficulty = "hard";
    else if (accuracy >= 60) difficulty = "medium";
    else if (accuracy >= 40) difficulty = "easy";
    else difficulty = "very_easy";

    const currentYear = new Date().getFullYear();
    const playerAge = player.birthYear
      ? currentYear - player.birthYear
      : player.gradeLevel
        ? player.gradeLevel + 5
        : 10;

    return {
      playerAge,
      gradeLevel: player.gradeLevel || 5,
      ageGroup: player.ageGroup || "9-11",
      topic: args.topic,
      subject: args.subject,
      difficulty,
      accuracy,
      totalAttempts: topicProgress?.totalAttempts ?? 0,
      masteryLevel: srsData?.level ?? 0,
      recentErrors: recentErrors.map((err) => ({
        question: err.question,
        wrongAnswer: err.wrongAnswer,
        correctAnswer: err.correctAnswer,
        errorType: err.errorType,
      })),
      preferredExplanationStyle: topicProgress?.preferredExplanationStyle,
    };
  },
});

// Update topic progress after answering a question
export const updateTopicProgress = mutation({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
    subject: v.string(),
    isCorrect: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("topicProgress")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .first();

    if (existing) {
      const newTotal = existing.totalAttempts + 1;
      const newCorrect = existing.correctAttempts + (args.isCorrect ? 1 : 0);
      const newAccuracy = Math.round((newCorrect / newTotal) * 100);

      await ctx.db.patch(existing._id, {
        totalAttempts: newTotal,
        correctAttempts: newCorrect,
        accuracy: newAccuracy,
        lastPracticed: new Date().toISOString(),
        needsPractice: newAccuracy < 60,
      });
    } else {
      await ctx.db.insert("topicProgress", {
        playerId: args.playerId,
        topic: args.topic,
        subject: args.subject,
        totalAttempts: 1,
        correctAttempts: args.isCorrect ? 1 : 0,
        accuracy: args.isCorrect ? 100 : 0,
        lastPracticed: new Date().toISOString(),
        needsPractice: !args.isCorrect,
      });
    }
  },
});

// Set preferred explanation style for a topic
export const setPreferredExplanationStyle = mutation({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
    style: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("topicProgress")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        preferredExplanationStyle: args.style,
      });
    }
  },
});

// Get topics that need practice
export const getWeakTopics = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topicProgress")
      .withIndex("by_player_needs_practice", (q) =>
        q.eq("playerId", args.playerId).eq("needsPractice", true)
      )
      .collect();
  },
});

// Get all topic progress for a player
export const getTopicProgress = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topicProgress")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
  },
});

// Get or create learning profile
export const getLearningProfile = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("learningProfile")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();
  },
});

// Update learning profile
export const updateLearningProfile = mutation({
  args: {
    playerId: v.id("players"),
    preferredStyle: v.optional(v.string()),
    explanationPreference: v.optional(v.string()),
    hintsEnabled: v.optional(v.boolean()),
    voiceEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("learningProfile")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    const updates = {
      ...(args.preferredStyle && { preferredStyle: args.preferredStyle }),
      ...(args.explanationPreference && { explanationPreference: args.explanationPreference }),
      ...(args.hintsEnabled !== undefined && { hintsEnabled: args.hintsEnabled }),
      ...(args.voiceEnabled !== undefined && { voiceEnabled: args.voiceEnabled }),
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("learningProfile", {
        playerId: args.playerId,
        hintsEnabled: args.hintsEnabled ?? true,
        voiceEnabled: args.voiceEnabled ?? true,
        updatedAt: new Date().toISOString(),
        ...(args.preferredStyle && { preferredStyle: args.preferredStyle }),
        ...(args.explanationPreference && { explanationPreference: args.explanationPreference }),
      });
    }
  },
});

// Record that explanation helped (or didn't)
export const recordExplanationFeedback = mutation({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
    explanationStyle: v.string(),
    understood: v.boolean(),
  },
  handler: async (ctx, args) => {
    // If understood, update preferred style for this topic
    if (args.understood) {
      const existing = await ctx.db
        .query("topicProgress")
        .withIndex("by_player_topic", (q) =>
          q.eq("playerId", args.playerId).eq("topic", args.topic)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          preferredExplanationStyle: args.explanationStyle,
        });
      }
    }
  },
});
