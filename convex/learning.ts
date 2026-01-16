import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
