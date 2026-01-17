import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new homework session after AI processing
export const createHomeworkSession = mutation({
  args: {
    playerId: v.optional(v.id("players")),
    guestId: v.optional(v.string()),
    imageUrls: v.array(v.string()),
    totalPages: v.number(),
    subject: v.string(),
    grade: v.string(),
    topics: v.array(v.string()),
    gameName: v.string(),
    gameIcon: v.string(),
    questions: v.array(
      v.object({
        text: v.string(),
        type: v.string(),
        options: v.optional(v.array(v.string())),
        correct: v.string(),
        explanation: v.optional(v.string()),
        hint: v.optional(v.string()),
        pageRef: v.optional(v.number()),
      })
    ),
    // AI-analyzed difficulty for fair scoring
    difficulty: v.optional(v.object({
      gradeLevel: v.number(),
      multiplier: v.number(),
      topics: v.array(v.string()),
      analyzedByAI: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    // Check for existing active session with same content (deduplication)
    const existingSessions = args.playerId
      ? await ctx.db
          .query("homeworkSessions")
          .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
          .filter((q) =>
            q.and(
              q.eq(q.field("status"), "active"),
              q.eq(q.field("subject"), args.subject),
              q.eq(q.field("gameName"), args.gameName)
            )
          )
          .collect()
      : args.guestId
        ? await ctx.db
            .query("homeworkSessions")
            .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
            .filter((q) =>
              q.and(
                q.eq(q.field("status"), "active"),
                q.eq(q.field("subject"), args.subject),
                q.eq(q.field("gameName"), args.gameName)
              )
            )
            .collect()
        : [];

    // Check if questions are similar (compare first question text)
    const isDuplicate = existingSessions.some((session) => {
      if (session.questions.length === 0 || args.questions.length === 0)
        return false;
      return session.questions[0].text === args.questions[0].text;
    });

    if (isDuplicate) {
      // Return existing session ID instead of creating duplicate
      const existing = existingSessions.find(
        (s) =>
          s.questions.length > 0 &&
          s.questions[0].text === args.questions[0].text
      );
      return existing?._id;
    }

    // Create new homework session
    const sessionId = await ctx.db.insert("homeworkSessions", {
      playerId: args.playerId,
      guestId: args.guestId,
      imageUrls: args.imageUrls,
      totalPages: args.totalPages,
      subject: args.subject,
      grade: args.grade,
      topics: args.topics,
      gameName: args.gameName,
      gameIcon: args.gameIcon,
      questions: args.questions,
      status: "active",
      createdAt: new Date().toISOString(),
      // Save AI-analyzed difficulty for scoring
      difficulty: args.difficulty,
    });

    return sessionId;
  },
});

// Get active homework sessions for a player
export const getActiveHomeworkSessions = query({
  args: {
    playerId: v.optional(v.id("players")),
    guestId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.playerId && !args.guestId) {
      return [];
    }

    const sessions = args.playerId
      ? await ctx.db
          .query("homeworkSessions")
          .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .order("desc")
          .collect()
      : await ctx.db
          .query("homeworkSessions")
          .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .order("desc")
          .collect();

    return sessions;
  },
});

// Get a specific homework session by ID
export const getHomeworkSession = query({
  args: {
    sessionId: v.id("homeworkSessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

// Complete a homework session
export const completeHomeworkSession = mutation({
  args: {
    sessionId: v.id("homeworkSessions"),
    score: v.number(),
    stars: v.number(),
    userAnswers: v.optional(
      v.array(
        v.object({
          questionIndex: v.number(),
          userAnswer: v.string(),
          isCorrect: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Homework session not found");
    }

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      score: args.score,
      stars: args.stars,
      userAnswers: args.userAnswers,
      completedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Delete a homework session (if user wants to remove it)
export const deleteHomeworkSession = mutation({
  args: {
    sessionId: v.id("homeworkSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Homework session not found");
    }

    await ctx.db.delete(args.sessionId);
    return { success: true };
  },
});

// Get completed homework sessions for history
export const getCompletedHomeworkSessions = query({
  args: {
    playerId: v.optional(v.id("players")),
    guestId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.playerId && !args.guestId) {
      return [];
    }

    const limit = args.limit || 10;

    const sessions = args.playerId
      ? await ctx.db
          .query("homeworkSessions")
          .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("homeworkSessions")
          .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .order("desc")
          .take(limit);

    return sessions;
  },
});
