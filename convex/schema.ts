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
    explanationStyle: v.optional(v.string()), // "short", "example", "step_by_step", "visual"
    understoodAfterExplanation: v.optional(v.boolean()),
    createdAt: v.string(),
  }).index("by_session", ["sessionId"]),

  // Topic progress tracking for adaptive learning
  topicProgress: defineTable({
    playerId: v.id("players"),
    topic: v.string(), // e.g., "suffixes", "multiplication", "past_tense"
    subject: v.string(), // "English", "Math", etc.
    totalAttempts: v.number(),
    correctAttempts: v.number(),
    accuracy: v.number(), // 0-100
    lastPracticed: v.string(),
    needsPractice: v.boolean(), // true if accuracy < 60%
    preferredExplanationStyle: v.optional(v.string()), // which style works best
  })
    .index("by_player", ["playerId"])
    .index("by_player_topic", ["playerId", "topic"])
    .index("by_player_needs_practice", ["playerId", "needsPractice"]),

  // Learning preferences
  learningProfile: defineTable({
    playerId: v.id("players"),
    preferredStyle: v.optional(v.string()), // "visual", "audio", "kinesthetic"
    explanationPreference: v.optional(v.string()), // "short", "detailed", "examples"
    readingSpeed: v.optional(v.string()), // "slow", "medium", "fast"
    hintsEnabled: v.boolean(),
    voiceEnabled: v.boolean(),
    updatedAt: v.string(),
  }).index("by_player", ["playerId"]),

  // Parent-child connections for Telegram bot
  parentLinks: defineTable({
    playerId: v.id("players"),
    telegramChatId: v.string(),
    telegramUsername: v.optional(v.string()),
    linkCode: v.string(), // 6-digit code for linking
    linkedAt: v.string(),
    notificationsEnabled: v.boolean(),
    dailyReportTime: v.optional(v.string()), // e.g., "18:00"
    weeklyReportDay: v.optional(v.number()), // 0=Sunday, 6=Saturday
  })
    .index("by_player", ["playerId"])
    .index("by_telegram", ["telegramChatId"])
    .index("by_code", ["linkCode"]),

  // Pending link codes (before parent connects)
  pendingLinkCodes: defineTable({
    playerId: v.id("players"),
    code: v.string(),
    createdAt: v.string(),
    expiresAt: v.string(),
  })
    .index("by_code", ["code"])
    .index("by_player", ["playerId"]),

  // Notification log
  parentNotifications: defineTable({
    parentLinkId: v.id("parentLinks"),
    type: v.string(), // "daily_report", "weekly_report", "achievement", "milestone", "inactive"
    message: v.string(),
    sentAt: v.string(),
  }).index("by_parent", ["parentLinkId"]),

  // Daily statistics for reports
  dailyStats: defineTable({
    playerId: v.id("players"),
    date: v.string(), // YYYY-MM-DD
    sessionsPlayed: v.number(),
    questionsAnswered: v.number(),
    correctAnswers: v.number(),
    xpEarned: v.number(),
    timeSpentMinutes: v.number(),
    topicsStudied: v.array(v.string()),
    weakTopics: v.array(v.string()),
    achievementsUnlocked: v.array(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_player_date", ["playerId", "date"]),
});
