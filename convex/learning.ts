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
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: updateTopicProgress IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return;
      }
    }

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
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: setPreferredExplanationStyle IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return;
      }
    }

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
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: updateLearningProfile IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return;
      }
    }

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

// ========== SPACED REPETITION SYSTEM (SM-2 Algorithm) ==========

/**
 * Get all items due for review today
 */
export const getDueReviews = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    const allSRS = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Filter items due today or overdue
    const dueItems = allSRS.filter((item) => item.nextReviewDate <= today);

    // Sort by most overdue first
    dueItems.sort((a, b) =>
      new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
    );

    return dueItems;
  },
});

/**
 * Get review items from errors (not yet in SRS)
 */
export const getErrorsForReview = query({
  args: { playerId: v.id("players"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get unresolved errors
    const errors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player_resolved", (q) =>
        q.eq("playerId", args.playerId).eq("resolved", false)
      )
      .order("desc")
      .take(limit);

    return errors;
  },
});

/**
 * Update SRS after review (SM-2 algorithm)
 * quality: 0-5 (0=complete blackout, 5=perfect response)
 */
export const updateSpacedRepetition = mutation({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
    subject: v.string(),
    quality: v.number(), // 0-5
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: updateSpacedRepetition IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return;
      }
    }

    const existing = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .first();

    const today = new Date().toISOString().split("T")[0];

    if (existing) {
      // SM-2 Algorithm
      let { easeFactor, interval, repetitions, level } = existing;
      const quality = Math.max(0, Math.min(5, args.quality));

      if (quality < 3) {
        // Failed review - reset
        repetitions = 0;
        interval = 1;
        level = Math.max(1, level - 1);
      } else {
        // Successful review
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 3;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
        level = Math.min(5, level + (quality >= 4 ? 1 : 0));
      }

      // Update ease factor (minimum 1.3)
      easeFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      );

      // Calculate next review date
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + interval);

      await ctx.db.patch(existing._id, {
        easeFactor,
        interval,
        repetitions,
        level,
        nextReviewDate: nextDate.toISOString().split("T")[0],
        lastReviewDate: today,
        totalReviews: existing.totalReviews + 1,
        correctReviews: existing.correctReviews + (quality >= 3 ? 1 : 0),
        lastQuality: quality,
      });
    } else {
      // Create new SRS entry
      const interval = args.quality >= 3 ? 1 : 0;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (interval || 1));

      await ctx.db.insert("spacedRepetition", {
        playerId: args.playerId,
        topic: args.topic,
        subject: args.subject,
        level: args.quality >= 4 ? 2 : 1,
        easeFactor: 2.5,
        interval: 1,
        nextReviewDate: nextDate.toISOString().split("T")[0],
        lastReviewDate: today,
        repetitions: args.quality >= 3 ? 1 : 0,
        totalReviews: 1,
        correctReviews: args.quality >= 3 ? 1 : 0,
        lastQuality: args.quality,
      });
    }
  },
});

/**
 * Mark error as resolved (after successful review)
 */
export const resolveError = mutation({
  args: {
    errorId: v.id("errorTracking"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this error's player account
    if (args.callerClerkId) {
      const error = await ctx.db.get(args.errorId);
      if (error?.playerId) {
        const player = await ctx.db.get(error.playerId);
        if (player && player.clerkId !== args.callerClerkId) {
          console.error(`SECURITY: resolveError IDOR attempt - caller ${args.callerClerkId} tried to resolve error for player ${error.playerId}`);
          return;
        }
      }
    }

    await ctx.db.patch(args.errorId, {
      resolved: true,
      resolvedAt: new Date().toISOString(),
    });
  },
});

/**
 * Get comprehensive weak topics with stats
 */
export const getWeakTopicsDetailed = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    // Get weak topics from topicProgress
    const weakTopics = await ctx.db
      .query("topicProgress")
      .withIndex("by_player_needs_practice", (q) =>
        q.eq("playerId", args.playerId).eq("needsPractice", true)
      )
      .collect();

    // Get error counts per topic
    const errors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player_resolved", (q) =>
        q.eq("playerId", args.playerId).eq("resolved", false)
      )
      .collect();

    // Count errors per topic
    const errorCounts: Record<string, number> = {};
    for (const err of errors) {
      errorCounts[err.topic] = (errorCounts[err.topic] || 0) + 1;
    }

    // Combine data
    return weakTopics.map((tp) => ({
      topic: tp.topic,
      subject: tp.subject,
      accuracy: tp.accuracy,
      totalAttempts: tp.totalAttempts,
      errorCount: errorCounts[tp.topic] || 0,
      lastPracticed: tp.lastPracticed,
    })).sort((a, b) => a.accuracy - b.accuracy); // Most weak first
  },
});

// ========== DAILY CHALLENGE SYSTEM ==========

/**
 * Get or create daily challenge for player
 */
export const getDailyChallenge = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    // Check if already has challenge for today
    const existing = await ctx.db
      .query("dailyQuests")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", today)
      )
      .filter((q) => q.eq(q.field("questType"), "daily_challenge"))
      .first();

    if (existing) {
      return existing;
    }

    return null;
  },
});

/**
 * Create daily challenge based on weak topics
 */
export const createDailyChallenge = mutation({
  args: {
    playerId: v.id("players"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: createDailyChallenge IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return null;
      }
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if already exists
    const existing = await ctx.db
      .query("dailyQuests")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", today)
      )
      .filter((q) => q.eq(q.field("questType"), "daily_challenge"))
      .first();

    if (existing) {
      return existing._id;
    }

    // Get weak topics
    const weakTopics = await ctx.db
      .query("topicProgress")
      .withIndex("by_player_needs_practice", (q) =>
        q.eq("playerId", args.playerId).eq("needsPractice", true)
      )
      .collect();

    // Get due reviews
    const dueReviews = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.lte(q.field("nextReviewDate"), today))
      .collect();

    // Determine challenge topic
    let challengeTopic = "general";
    let challengeSubject = "Mixed";
    let description = "Practice 5 questions to improve!";

    if (weakTopics.length > 0) {
      // Prioritize weakest topic
      const weakest = weakTopics.sort((a, b) => a.accuracy - b.accuracy)[0];
      challengeTopic = weakest.topic;
      challengeSubject = weakest.subject;
      description = `Practice ${weakest.topic} (${weakest.accuracy}% accuracy)`;
    } else if (dueReviews.length > 0) {
      const review = dueReviews[0];
      challengeTopic = review.topic;
      challengeSubject = review.subject;
      description = `Review ${review.topic} to keep it fresh!`;
    }

    // Create challenge
    const challengeId = await ctx.db.insert("dailyQuests", {
      playerId: args.playerId,
      date: today,
      questType: "daily_challenge",
      questName: `Daily: ${challengeTopic}`,
      description,
      targetCount: 5,
      currentCount: 0,
      isCompleted: false,
      reward: {
        diamonds: 20,
        emeralds: 10,
        xp: 50,
      },
    });

    return challengeId;
  },
});

/**
 * Update daily challenge progress
 */
export const updateDailyChallengeProgress = mutation({
  args: {
    playerId: v.id("players"),
    correct: v.boolean(),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: updateDailyChallengeProgress IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return null;
      }
    }

    const today = new Date().toISOString().split("T")[0];

    const challenge = await ctx.db
      .query("dailyQuests")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", today)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("questType"), "daily_challenge"),
          q.eq(q.field("isCompleted"), false)
        )
      )
      .first();

    if (!challenge) return null;

    const newCount = challenge.currentCount + (args.correct ? 1 : 0);
    const isCompleted = newCount >= challenge.targetCount;

    await ctx.db.patch(challenge._id, {
      currentCount: newCount,
      isCompleted,
      ...(isCompleted && { completedAt: new Date().toISOString() }),
    });

    return {
      currentCount: newCount,
      targetCount: challenge.targetCount,
      isCompleted,
      reward: isCompleted ? challenge.reward : null,
    };
  },
});

// Record that explanation helped (or didn't)
export const recordExplanationFeedback = mutation({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
    explanationStyle: v.string(),
    understood: v.boolean(),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: recordExplanationFeedback IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return;
      }
    }

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
