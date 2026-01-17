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
    // Profile demographics
    birthYear: v.optional(v.number()), // e.g., 2015
    gradeLevel: v.optional(v.number()), // 1-11
    nativeLanguage: v.optional(v.string()), // "ru", "en", "uk"
    ageGroup: v.optional(v.string()), // "6-8", "9-11", "12+"
    // Competition settings
    displayName: v.optional(v.string()), // Anonymous name for leaderboards
    competitionOptIn: v.optional(v.boolean()), // Opted into competitions
    profileCompleted: v.optional(v.boolean()), // Profile setup completed
    // Normalized score for fair competition
    normalizedScore: v.optional(v.number()), // Fair score across ages
    totalRawScore: v.optional(v.number()), // Raw cumulative score
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_name", ["name"])
    .index("by_grade", ["gradeLevel"])
    .index("by_age_group", ["ageGroup"])
    .index("by_normalized_score", ["normalizedScore"]),

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
    // AI-analyzed difficulty for fair scoring
    difficulty: v.optional(v.object({
      gradeLevel: v.number(),        // 1-11 (detected grade level)
      multiplier: v.number(),        // 1.0 - 2.0 (scoring multiplier)
      topics: v.array(v.string()),   // detected topics
      analyzedByAI: v.boolean(),
    })),
    // User's answers for each question (to show summary at end)
    userAnswers: v.optional(
      v.array(
        v.object({
          questionIndex: v.number(),
          userAnswer: v.string(),
          isCorrect: v.boolean(),
        })
      )
    ),
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
    // TTS Settings
    voiceLanguage: v.optional(v.string()), // "en-US", "en-CA", "ru-RU"
    voiceSpeed: v.optional(v.string()), // "slow", "normal", "fast"
    voicePitch: v.optional(v.number()), // 0.8-1.5 (higher = younger sounding)
    autoPlayVoice: v.optional(v.boolean()), // Auto-read questions
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

  // ========== WORD WIZARD ACADEMY TABLES ==========

  // Wizard profile (extends player with academy features)
  wizardProfile: defineTable({
    playerId: v.id("players"),
    wizardTitle: v.string(), // "Apprentice", "Junior Wizard", "Wizard", "Senior Wizard", "Master Wizard"
    academyLevel: v.number(), // 1-25+
    currentChapter: v.number(), // 1-12
    totalSpellsLearned: v.number(),
    favoriteSubject: v.optional(v.string()),
    petId: v.optional(v.string()), // equipped pet familiar
    wandStyle: v.optional(v.string()),
    robeColor: v.optional(v.string()),
    hatStyle: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_player", ["playerId"]),

  // Quest chapters and progress
  questChapters: defineTable({
    playerId: v.id("players"),
    chapterId: v.number(), // 1-12
    chapterName: v.string(), // "The Beginning", "Forest of Nouns", etc.
    isUnlocked: v.boolean(),
    isCompleted: v.boolean(),
    starsEarned: v.number(), // 0-3
    lessonsCompleted: v.number(),
    totalLessons: v.number(),
    bossDefeated: v.boolean(),
    unlockedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_player_chapter", ["playerId", "chapterId"]),

  // Individual quests/lessons within chapters
  quests: defineTable({
    playerId: v.id("players"),
    chapterId: v.number(),
    questId: v.string(), // e.g., "ch1_q1"
    questName: v.string(),
    questType: v.string(), // "lesson", "practice", "boss", "bonus"
    topic: v.string(), // "nouns", "verbs", etc.
    isUnlocked: v.boolean(),
    isCompleted: v.boolean(),
    starsEarned: v.number(),
    bestScore: v.number(),
    attempts: v.number(),
    lastAttempt: v.optional(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_player_chapter", ["playerId", "chapterId"])
    .index("by_player_quest", ["playerId", "questId"]),

  // Spell Book - collected words as spells
  spellBook: defineTable({
    playerId: v.id("players"),
    word: v.string(),
    category: v.string(), // "noun", "verb", "adjective", "adverb", "phrase"
    definition: v.string(),
    exampleSentence: v.optional(v.string()),
    spellPower: v.number(), // 1-5 stars rarity
    isRare: v.boolean(),
    learnedAt: v.string(),
    masteryLevel: v.number(), // 0-100 how well they know it
    timesUsed: v.number(),
  })
    .index("by_player", ["playerId"])
    .index("by_player_word", ["playerId", "word"])
    .index("by_player_category", ["playerId", "category"]),

  // Daily quests tracking
  dailyQuests: defineTable({
    playerId: v.id("players"),
    date: v.string(), // YYYY-MM-DD
    questType: v.string(), // "morning_practice", "homework", "evening_review", "bonus"
    questName: v.string(),
    description: v.string(),
    targetCount: v.number(), // e.g., answer 10 questions
    currentCount: v.number(),
    isCompleted: v.boolean(),
    reward: v.object({
      diamonds: v.optional(v.number()),
      emeralds: v.optional(v.number()),
      xp: v.optional(v.number()),
    }),
    completedAt: v.optional(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_player_date", ["playerId", "date"]),

  // Pet familiars
  petFamiliars: defineTable({
    playerId: v.id("players"),
    petId: v.string(), // "owl", "cat", "bookworm", "phoenix"
    petName: v.string(),
    petType: v.string(),
    level: v.number(),
    xp: v.number(),
    ability: v.string(), // "hint_boost", "xp_bonus", "spell_power"
    isEquipped: v.boolean(),
    obtainedAt: v.string(),
  })
    .index("by_player", ["playerId"])
    .index("by_player_pet", ["playerId", "petId"]),

  // ========== PLATFORM DASHBOARD & LEADERBOARDS ==========

  // Aggregated platform statistics (updated by cron)
  platformStats: defineTable({
    date: v.string(), // YYYY-MM-DD
    totalPlayers: v.number(),
    activePlayers: v.number(), // Active in last 7 days
    totalQuestionsAnswered: v.number(),
    averageAccuracy: v.number(),
    totalWordsLearned: v.number(),
    ageGroupStats: v.array(
      v.object({
        ageGroup: v.string(),
        playerCount: v.number(),
        avgAccuracy: v.number(),
        avgNormalizedScore: v.number(),
        avgStreak: v.number(),
        avgWordsLearned: v.number(),
      })
    ),
    lastUpdated: v.string(),
  }).index("by_date", ["date"]),

  // Leaderboards (cached aggregates)
  leaderboards: defineTable({
    type: v.string(), // "daily", "weekly", "monthly", "all_time"
    ageGroup: v.optional(v.string()), // null for global leaderboard
    entries: v.array(
      v.object({
        playerId: v.id("players"),
        displayName: v.string(),
        normalizedScore: v.number(), // Fair score
        rawScore: v.number(),
        accuracy: v.number(),
        streak: v.number(),
        wordsLearned: v.number(),
        rank: v.number(),
      })
    ),
    periodStart: v.string(),
    periodEnd: v.string(),
    lastUpdated: v.string(),
  })
    .index("by_type", ["type"])
    .index("by_type_age", ["type", "ageGroup"]),

  // ========== CHALLENGES & COMPETITIONS ==========

  // Async challenges between players
  challenges: defineTable({
    challengerId: v.id("players"),
    challengerName: v.string(),
    challengeeId: v.optional(v.id("players")), // null for open challenges
    challengeeName: v.optional(v.string()),
    topic: v.string(),
    difficulty: v.string(), // "easy", "medium", "hard"
    questions: v.array(
      v.object({
        text: v.string(),
        options: v.array(v.string()),
        correct: v.string(),
        difficulty: v.number(), // 1-3
      })
    ),
    questionCount: v.number(),
    status: v.string(), // "pending", "active", "completed", "expired", "declined"
    winnerId: v.optional(v.id("players")),
    winnerName: v.optional(v.string()),
    reward: v.object({
      diamonds: v.number(),
      xp: v.number(),
    }),
    createdAt: v.string(),
    expiresAt: v.string(),
    completedAt: v.optional(v.string()),
  })
    .index("by_challenger", ["challengerId"])
    .index("by_challengee", ["challengeeId"])
    .index("by_status", ["status"]),

  // Challenge participant responses
  challengeParticipants: defineTable({
    challengeId: v.id("challenges"),
    playerId: v.id("players"),
    playerName: v.string(),
    answers: v.array(
      v.object({
        questionIndex: v.number(),
        answer: v.string(),
        isCorrect: v.boolean(),
        timeSpent: v.number(), // milliseconds
      })
    ),
    score: v.number(),
    normalizedScore: v.number(),
    correctAnswers: v.number(),
    totalTime: v.number(),
    status: v.string(), // "in_progress", "completed"
    startedAt: v.string(),
    finishedAt: v.optional(v.string()),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_player", ["playerId"])
    .index("by_challenge_player", ["challengeId", "playerId"]),

  // Competition rewards history
  competitionRewards: defineTable({
    playerId: v.id("players"),
    competitionType: v.string(), // "daily_leaderboard", "weekly_leaderboard", "challenge_win"
    competitionId: v.optional(v.string()),
    rank: v.optional(v.number()),
    reward: v.object({
      diamonds: v.number(),
      emeralds: v.number(),
      xp: v.number(),
    }),
    claimed: v.boolean(),
    claimedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_player", ["playerId"])
    .index("by_player_unclaimed", ["playerId", "claimed"]),

  // ========== GEM SYSTEM TABLES ==========

  // Player gem inventory
  playerGems: defineTable({
    playerId: v.id("players"),
    gemType: v.string(), // "topaz", "amethyst", "sapphire", "ruby", "emerald", "diamond", "opal", "onyx"
    wholeGems: v.number(),
    shards: v.number(),
    totalFound: v.number(),
  })
    .index("by_player", ["playerId"])
    .index("by_player_gem", ["playerId", "gemType"]),

  // Gem collection progress
  gemCollections: defineTable({
    playerId: v.id("players"),
    setId: v.string(), // "starter", "elements", "rainbow"
    isComplete: v.boolean(),
    bonusClaimed: v.boolean(),
    completedAt: v.optional(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_player_set", ["playerId", "setId"]),

  // Crafting history
  craftingHistory: defineTable({
    playerId: v.id("players"),
    recipeId: v.string(),
    itemName: v.string(),
    ingredientsUsed: v.array(
      v.object({
        gemType: v.string(),
        amount: v.number(),
      })
    ),
    craftedAt: v.string(),
  }).index("by_player", ["playerId"]),

  // Mining sessions
  miningSessions: defineTable({
    playerId: v.id("players"),
    depth: v.number(),
    gemsFound: v.array(
      v.object({
        gemType: v.string(),
        isWhole: v.boolean(),
      })
    ),
    questionsAnswered: v.number(),
    correctAnswers: v.number(),
    mistakes: v.number(),
    startedAt: v.string(),
    endedAt: v.optional(v.string()),
    status: v.string(), // "active", "completed", "failed"
  }).index("by_player", ["playerId"]),

  // Active gem boosts
  activeBoosts: defineTable({
    playerId: v.id("players"),
    boostType: v.string(), // "xp_multiplier", "gem_luck", "streak_shield", "double_rewards"
    boostName: v.string(),
    multiplier: v.number(),
    usesRemaining: v.optional(v.number()), // For single-use items like streak shield
    expiresAt: v.string(),
    sourceRecipe: v.optional(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_player_type", ["playerId", "boostType"]),

  // Gem drop history (for analytics)
  gemDrops: defineTable({
    playerId: v.id("players"),
    gemType: v.string(),
    isWhole: v.boolean(),
    source: v.string(), // "correct_answer", "level_complete", "mining", "achievement"
    levelId: v.optional(v.string()),
    droppedAt: v.string(),
  }).index("by_player", ["playerId"]),

  // ========== ERROR TRACKING & PRACTICE ARENA ==========

  // Individual error tracking for personalized practice
  errorTracking: defineTable({
    playerId: v.id("players"),
    topic: v.string(), // "suffixes", "multiplication", "verbs"
    subTopic: v.optional(v.string()), // "-tion words", "times-7"
    subject: v.string(), // "English", "Math"
    errorType: v.string(), // "spelling", "logic", "grammar", "comprehension"
    question: v.string(), // Original question text
    wrongAnswer: v.string(), // What the child answered
    correctAnswer: v.string(), // Correct answer
    source: v.string(), // "homework", "practice", "weekly_quest"
    homeworkSessionId: v.optional(v.id("homeworkSessions")),
    resolved: v.boolean(), // Has this been practiced and corrected?
    resolvedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_player", ["playerId"])
    .index("by_player_topic", ["playerId", "topic"])
    .index("by_player_subject", ["playerId", "subject"])
    .index("by_player_resolved", ["playerId", "resolved"])
    .index("by_player_date", ["playerId", "createdAt"]),

  // Weekly practice quests generated from errors (Practice Arena)
  weeklyPracticeQuests: defineTable({
    playerId: v.id("players"),
    weekStart: v.string(), // YYYY-MM-DD of Monday
    topic: v.string(), // "suffixes", "multiplication"
    subject: v.string(),
    questName: v.string(), // "Suffix Master", "Times Table 7"
    questIcon: v.string(), // Emoji
    description: v.string(), // "Practice -tion and -ness words"
    errorCount: v.number(), // How many errors triggered this quest
    questions: v.array(
      v.object({
        text: v.string(),
        type: v.string(),
        options: v.optional(v.array(v.string())),
        correct: v.string(),
        explanation: v.optional(v.string()),
      })
    ),
    targetCorrect: v.number(), // Need to get X correct to complete
    currentCorrect: v.number(),
    isCompleted: v.boolean(),
    reward: v.object({
      diamonds: v.number(),
      emeralds: v.number(),
      xp: v.number(),
    }),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_player_week", ["playerId", "weekStart"])
    .index("by_player_completed", ["playerId", "isCompleted"]),

  // Weekly champion tracking
  weeklyChampion: defineTable({
    playerId: v.id("players"),
    weekStart: v.string(),
    totalQuestsCompleted: v.number(),
    totalQuestsAvailable: v.number(),
    bonusClaimed: v.boolean(),
    bonusReward: v.object({
      diamonds: v.number(),
      emeralds: v.number(),
      xp: v.number(),
    }),
    // Enhanced champion features
    championStreak: v.optional(v.number()), // Consecutive weeks as champion
    bonusTier: v.optional(v.number()), // 1-5 bonus tier based on streak
    mysteryChestEarned: v.optional(v.boolean()), // Earned mystery chest this week
    mysteryChestOpened: v.optional(v.boolean()), // Opened the chest
    mysteryChestReward: v.optional(v.object({
      type: v.string(), // "rare_gems", "streak_freeze", "xp_boost", "diamonds_jackpot"
      diamonds: v.optional(v.number()),
      emeralds: v.optional(v.number()),
      gold: v.optional(v.number()),
      streakFreezes: v.optional(v.number()),
      xpBoostPercent: v.optional(v.number()),
      xpBoostHours: v.optional(v.number()),
    })),
  })
    .index("by_player", ["playerId"])
    .index("by_player_week", ["playerId", "weekStart"]),

  // ========== SPACED REPETITION SYSTEM ==========

  // Spaced repetition tracking for intelligent review scheduling
  spacedRepetition: defineTable({
    playerId: v.id("players"),
    topic: v.string(), // e.g., "verbs", "past_tense", "multiplication"
    subject: v.string(), // "English", "Math"
    level: v.number(), // 1-5 (mastery level)
    easeFactor: v.number(), // 2.5 default, adjusted based on performance
    interval: v.number(), // Days until next review
    nextReviewDate: v.string(), // ISO date string
    lastReviewDate: v.string(), // Last practice date
    repetitions: v.number(), // Number of successful reviews
    totalReviews: v.number(), // Total review attempts
    correctReviews: v.number(), // Successful reviews
    lastQuality: v.optional(v.number()), // Last answer quality 0-5
  })
    .index("by_player", ["playerId"])
    .index("by_player_topic", ["playerId", "topic"])
    .index("by_player_due", ["playerId", "nextReviewDate"])
    .index("by_player_subject", ["playerId", "subject"]),

  // ========== AI INSIGHTS & ANALYTICS ==========

  // AI-generated insights for players and parents
  playerInsights: defineTable({
    playerId: v.id("players"),
    insightType: v.string(), // "strength", "weakness", "recommendation", "pattern", "milestone"
    category: v.string(), // "learning_style", "time_pattern", "topic_mastery", "progress"
    title: v.string(), // Short insight title
    description: v.string(), // Detailed explanation
    actionItems: v.optional(v.array(v.string())), // Suggested actions
    relatedTopics: v.optional(v.array(v.string())), // Related topics
    confidence: v.number(), // 0-100 confidence score
    priority: v.number(), // 1-5 priority level
    isRead: v.boolean(),
    generatedAt: v.string(),
    expiresAt: v.optional(v.string()), // Some insights are time-limited
  })
    .index("by_player", ["playerId"])
    .index("by_player_type", ["playerId", "insightType"])
    .index("by_player_unread", ["playerId", "isRead"]),

  // Weekly insights summary (for parent reports)
  weeklyInsightsSummary: defineTable({
    playerId: v.id("players"),
    weekStart: v.string(), // YYYY-MM-DD
    overallProgress: v.string(), // "excellent", "good", "needs_attention"
    summaryText: v.string(), // AI-generated summary paragraph
    strongTopics: v.array(v.string()),
    weakTopics: v.array(v.string()),
    suggestedFocus: v.array(v.string()),
    timeSpentMinutes: v.number(),
    questionsAnswered: v.number(),
    averageAccuracy: v.number(),
    streakDays: v.number(),
    bestTimeOfDay: v.optional(v.string()), // "morning", "afternoon", "evening"
    engagementScore: v.number(), // 0-100
    generatedAt: v.string(),
  })
    .index("by_player", ["playerId"])
    .index("by_player_week", ["playerId", "weekStart"]),

  // Learning session analytics (detailed per-session tracking)
  learningSessionAnalytics: defineTable({
    playerId: v.id("players"),
    sessionId: v.string(), // Unique session identifier
    startTime: v.string(),
    endTime: v.optional(v.string()),
    durationMinutes: v.number(),
    questionsAttempted: v.number(),
    questionsCorrect: v.number(),
    topicsStudied: v.array(v.string()),
    difficultyLevels: v.array(v.string()), // Difficulties encountered
    averageResponseTime: v.optional(v.number()), // Milliseconds
    hintsUsed: v.number(),
    explanationsViewed: v.number(),
    frustrationEvents: v.optional(v.number()), // Multiple wrong answers in row
    engagementDropoff: v.optional(v.boolean()), // Left mid-session
  })
    .index("by_player", ["playerId"])
    .index("by_player_date", ["playerId", "startTime"]),

  // ========== DAILY CHALLENGES & STREAKS ==========

  // Daily challenges (one per day, gamified goals)
  dailyChallenges: defineTable({
    playerId: v.id("players"),
    date: v.string(), // YYYY-MM-DD
    challengeType: v.string(), // "streak", "speed", "accuracy", "review", "explore", "perfect"
    title: v.string(), // "Streak Master"
    description: v.string(), // "Answer 5 questions in a row correctly"
    targetValue: v.number(), // Target to reach (5, 10, 90, etc.)
    currentValue: v.number(), // Current progress
    isCompleted: v.boolean(),
    reward: v.object({
      diamonds: v.number(),
      emeralds: v.number(),
      xp: v.number(),
    }),
    completedAt: v.optional(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_player_date", ["playerId", "date"]),

  // Player streaks (detailed tracking)
  playerStreaks: defineTable({
    playerId: v.id("players"),
    currentStreak: v.number(), // Days in a row
    longestStreak: v.number(), // Best ever
    lastActivityDate: v.string(), // YYYY-MM-DD
    streakFreezes: v.number(), // Can skip 1 day without losing streak
    weeklyActivity: v.array(v.boolean()), // Last 7 days activity [Mon...Sun]
    totalActiveDays: v.number(), // All-time active days
  }).index("by_player", ["playerId"]),

  // ========== PERSONALIZED LEARNING PATHS ==========

  // Learning path progress
  learningPaths: defineTable({
    playerId: v.id("players"),
    pathId: v.string(), // "beginner_english", "intermediate_math"
    pathName: v.string(),
    pathDescription: v.string(),
    targetAgeGroup: v.string(), // "6-8", "9-11", "12+"
    subject: v.string(),
    totalMilestones: v.number(),
    completedMilestones: v.number(),
    currentMilestone: v.number(),
    milestones: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        topics: v.array(v.string()),
        isCompleted: v.boolean(),
        completedAt: v.optional(v.string()),
        requiredAccuracy: v.number(), // 0-100
      })
    ),
    isActive: v.boolean(),
    startedAt: v.string(),
    completedAt: v.optional(v.string()),
  })
    .index("by_player", ["playerId"])
    .index("by_player_active", ["playerId", "isActive"])
    .index("by_player_path", ["playerId", "pathId"]),
});
