import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Player profiles
  players: defineTable({
    clerkId: v.string(),
    name: v.string(),
    skin: v.string(),
    level: v.number(),
    xp: v.number(),
    xpNext: v.number(),
    diamonds: v.number(),
    emeralds: v.number(),
    gold: v.number(),
    streak: v.number(),
    lastLogin: v.optional(v.string()),
    totalStars: v.number(),
    wordsLearned: v.number(),
    questsCompleted: v.number(),
    perfectLevels: v.number(),
    dailyDay: v.number(),
    dailyClaimed: v.boolean(),
  }).index("by_clerk_id", ["clerkId"]),

  // Player inventory
  inventory: defineTable({
    playerId: v.id("players"),
    itemId: v.string(),
    itemType: v.string(), // "skin", "tool", "pet", "boost"
    equipped: v.boolean(),
  }).index("by_player", ["playerId"]),

  // Completed levels
  completedLevels: defineTable({
    playerId: v.id("players"),
    levelId: v.string(),
    stars: v.number(),
    bestScore: v.number(),
    completedAt: v.string(),
  })
    .index("by_player", ["playerId"])
    .index("by_player_level", ["playerId", "levelId"]),

  // Achievements
  playerAchievements: defineTable({
    playerId: v.id("players"),
    achievementId: v.string(),
    unlockedAt: v.string(),
  })
    .index("by_player", ["playerId"])
    .index("by_player_achievement", ["playerId", "achievementId"]),

  // Game sessions (for analytics)
  gameSessions: defineTable({
    playerId: v.id("players"),
    levelId: v.string(),
    startedAt: v.string(),
    endedAt: v.optional(v.string()),
    questionsAnswered: v.number(),
    correctAnswers: v.number(),
    xpEarned: v.number(),
  }).index("by_player", ["playerId"]),

  // AI homework sessions (supports multiple pages)
  homeworkSessions: defineTable({
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
    status: v.string(),
    score: v.optional(v.number()),
    stars: v.optional(v.number()),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_guest", ["guestId"]),

  // Question attempts for analytics
  questionAttempts: defineTable({
    sessionId: v.id("homeworkSessions"),
    questionIndex: v.number(),
    userAnswer: v.string(),
    isCorrect: v.boolean(),
    attemptNumber: v.number(),
    hintsUsed: v.number(),
    createdAt: v.string(),
  }).index("by_session", ["sessionId"]),
});
