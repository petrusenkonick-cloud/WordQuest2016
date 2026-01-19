import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate content hash from questions for deduplication
const generateContentHash = (questions: { text: string }[]) => {
  // Use first 5 questions + count for hash
  const texts = questions.slice(0, 5).map(q => q.text.toLowerCase().trim());
  return `${questions.length}:${texts.join('|')}`;
};

// Check if homework already exists (active or completed)
export const checkForDuplicateHomework = query({
  args: {
    playerId: v.optional(v.id("players")),
    guestId: v.optional(v.string()),
    questions: v.array(v.object({
      text: v.string(),
      type: v.string(),
      options: v.optional(v.array(v.string())),
      correct: v.string(),
      explanation: v.optional(v.string()),
      hint: v.optional(v.string()),
      pageRef: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    if (!args.playerId && !args.guestId) {
      return { isDuplicate: false, duplicateType: null, originalSession: null };
    }

    const newContentHash = generateContentHash(args.questions);

    // Get all sessions (active and completed)
    const allSessions = args.playerId
      ? await ctx.db
          .query("homeworkSessions")
          .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
          .collect()
      : await ctx.db
          .query("homeworkSessions")
          .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
          .collect();

    // Find matching session
    const matchingSession = allSessions.find((session) => {
      if (session.questions.length !== args.questions.length) return false;
      const existingHash = generateContentHash(session.questions);
      return existingHash === newContentHash;
    });

    if (!matchingSession) {
      return { isDuplicate: false, duplicateType: null, originalSession: null };
    }

    return {
      isDuplicate: true,
      duplicateType: matchingSession.status as "active" | "completed",
      originalSession: {
        _id: matchingSession._id,
        gameName: matchingSession.gameName,
        gameIcon: matchingSession.gameIcon,
        subject: matchingSession.subject,
        score: matchingSession.score,
        stars: matchingSession.stars,
        completedAt: matchingSession.completedAt,
        questionsCount: matchingSession.questions.length,
      },
    };
  },
});

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
    // Practice mode flag for repeated homework
    isPracticeMode: v.optional(v.boolean()),
    originalSessionId: v.optional(v.id("homeworkSessions")),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership for logged-in users
  },
  handler: async (ctx, args) => {
    // SECURITY: If playerId provided, verify caller owns this account
    if (args.playerId && args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (!player) {
        return { sessionId: null, isDuplicate: false, error: "Player not found" };
      }
      if (player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: createHomeworkSession IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return { sessionId: null, isDuplicate: false, error: "Unauthorized" };
      }
    }

    const newContentHash = generateContentHash(args.questions);

    // Get ALL sessions (active and completed) for duplicate checking
    const allSessions = args.playerId
      ? await ctx.db
          .query("homeworkSessions")
          .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
          .collect()
      : args.guestId
        ? await ctx.db
            .query("homeworkSessions")
            .withIndex("by_guest", (q) => q.eq("guestId", args.guestId))
            .collect()
        : [];

    // Find matching session (active or completed)
    const matchingSession = allSessions.find((session) => {
      if (session.questions.length !== args.questions.length) return false;
      const existingHash = generateContentHash(session.questions);
      return existingHash === newContentHash;
    });

    // If there's an ACTIVE duplicate, return it (don't create new)
    if (matchingSession && matchingSession.status === "active") {
      return { sessionId: matchingSession._id, isDuplicate: false };
    }

    // If there's a COMPLETED duplicate and NOT in practice mode, return duplicate info
    if (matchingSession && matchingSession.status === "completed" && !args.isPracticeMode) {
      return {
        sessionId: null,
        isDuplicate: true,
        originalSession: {
          _id: matchingSession._id,
          gameName: matchingSession.gameName,
          gameIcon: matchingSession.gameIcon,
          subject: matchingSession.subject,
          score: matchingSession.score,
          stars: matchingSession.stars,
          completedAt: matchingSession.completedAt,
          questionsCount: matchingSession.questions.length,
        },
      };
    }

    // Create new homework session (could be practice mode if user confirmed)
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
      difficulty: args.difficulty,
      isPracticeMode: args.isPracticeMode || false,
      originalSessionId: args.originalSessionId || (matchingSession?._id),
    });

    return { sessionId, isDuplicate: false };
  },
});

// Get active homework sessions for a player (with duplicate filtering)
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

    // Filter out duplicates (keep first occurrence - most recent)
    const generateContentHash = (questions: { text: string }[]) => {
      const texts = questions.slice(0, 5).map(q => q.text.toLowerCase().trim());
      return `${questions.length}:${texts.join('|')}`;
    };

    const seen = new Set<string>();
    const uniqueSessions = sessions.filter((session) => {
      const hash = generateContentHash(session.questions);
      if (seen.has(hash)) {
        return false; // Skip duplicate
      }
      seen.add(hash);
      return true;
    });

    return uniqueSessions;
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
    // Anti-cheat data
    antiCheatData: v.optional(v.object({
      tabSwitchCount: v.number(),
      suspiciouslyFastAnswers: v.number(),
      suspiciouslySlowAnswers: v.number(),
      averageResponseTimeMs: v.number(),
      totalTimeMs: v.number(),
    })),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return { success: false, error: "Homework session not found" };
    }

    // SECURITY: If session has playerId and caller provided clerkId, verify ownership
    if (session.playerId && args.callerClerkId) {
      const player = await ctx.db.get(session.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: completeHomeworkSession IDOR attempt - caller ${args.callerClerkId} tried to complete session for player ${session.playerId}`);
        return { success: false, error: "Unauthorized" };
      }
    }

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      score: args.score,
      stars: args.stars,
      userAnswers: args.userAnswers,
      antiCheatData: args.antiCheatData,
      completedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Delete a homework session (if user wants to remove it)
export const deleteHomeworkSession = mutation({
  args: {
    sessionId: v.id("homeworkSessions"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return { success: false, error: "Homework session not found" };
    }

    // SECURITY: If session has playerId and caller provided clerkId, verify ownership
    if (session.playerId && args.callerClerkId) {
      const player = await ctx.db.get(session.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: deleteHomeworkSession IDOR attempt - caller ${args.callerClerkId} tried to delete session for player ${session.playerId}`);
        return { success: false, error: "Unauthorized" };
      }
    }

    await ctx.db.delete(args.sessionId);
    return { success: true };
  },
});

// Clean up duplicate homework sessions (keeps the oldest one)
export const cleanupDuplicateSessions = mutation({
  args: {
    playerId: v.id("players"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (!player) {
        return { removed: 0, error: "Player not found" };
      }
      if (player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: cleanupDuplicateSessions IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return { removed: 0, error: "Unauthorized" };
      }
    }

    // Get all active sessions for player
    const sessions = await ctx.db
      .query("homeworkSessions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (sessions.length <= 1) {
      return { removed: 0 };
    }

    // Generate content hash for deduplication
    const generateContentHash = (questions: { text: string }[]) => {
      const texts = questions.slice(0, 5).map(q => q.text.toLowerCase().trim());
      return `${questions.length}:${texts.join('|')}`;
    };

    // Group by content hash
    const groups: Record<string, typeof sessions> = {};
    for (const session of sessions) {
      const hash = generateContentHash(session.questions);
      if (!groups[hash]) {
        groups[hash] = [];
      }
      groups[hash].push(session);
    }

    // For each group with duplicates, keep oldest (first created), delete rest
    let removedCount = 0;
    for (const hash in groups) {
      const group = groups[hash];
      if (group.length > 1) {
        // Sort by createdAt ascending (oldest first)
        group.sort((a, b) =>
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );

        // Delete all except the first (oldest)
        for (let i = 1; i < group.length; i++) {
          await ctx.db.delete(group[i]._id);
          removedCount++;
        }
      }
    }

    return { removed: removedCount };
  },
});

// Save partial progress (called after each answer)
export const savePartialProgress = mutation({
  args: {
    sessionId: v.id("homeworkSessions"),
    userAnswers: v.array(
      v.object({
        questionIndex: v.number(),
        userAnswer: v.string(),
        isCorrect: v.boolean(),
      })
    ),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return { success: false, error: "Homework session not found" };
    }

    // Don't update if already completed
    if (session.status === "completed") {
      return { success: false, error: "Session already completed" };
    }

    // SECURITY: If session has playerId and caller provided clerkId, verify ownership
    if (session.playerId && args.callerClerkId) {
      const player = await ctx.db.get(session.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: savePartialProgress IDOR attempt - caller ${args.callerClerkId} tried to update session for player ${session.playerId}`);
        return { success: false, error: "Unauthorized" };
      }
    }

    await ctx.db.patch(args.sessionId, {
      userAnswers: args.userAnswers,
    });

    return { success: true, savedCount: args.userAnswers.length };
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
