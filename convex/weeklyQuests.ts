import { mutation, query, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ========== CHAMPION TIER SYSTEM ==========
// Tiered rewards based on consecutive weeks as champion

const CHAMPION_TIERS = [
  { tier: 1, name: "Champion", minStreak: 1, multiplier: 1.0, color: "#8b5cf6" },
  { tier: 2, name: "Super Champion", minStreak: 2, multiplier: 1.25, color: "#06b6d4" },
  { tier: 3, name: "Ultra Champion", minStreak: 3, multiplier: 1.5, color: "#22c55e" },
  { tier: 4, name: "Master Champion", minStreak: 5, multiplier: 2.0, color: "#fbbf24" },
  { tier: 5, name: "Legendary Champion", minStreak: 10, multiplier: 3.0, color: "#ef4444" },
];

const MYSTERY_CHEST_REWARDS = [
  { type: "diamonds_small", weight: 30, diamonds: 50, emeralds: 0, gold: 0 },
  { type: "diamonds_medium", weight: 20, diamonds: 100, emeralds: 25, gold: 0 },
  { type: "diamonds_jackpot", weight: 5, diamonds: 300, emeralds: 100, gold: 50 },
  { type: "emeralds_boost", weight: 25, diamonds: 25, emeralds: 75, gold: 0 },
  { type: "gold_find", weight: 10, diamonds: 0, emeralds: 50, gold: 100 },
  { type: "streak_freeze", weight: 8, diamonds: 50, streakFreezes: 2 },
  { type: "xp_boost", weight: 2, diamonds: 25, xpBoostPercent: 50, xpBoostHours: 24 },
];

function getChampionTier(streak: number): typeof CHAMPION_TIERS[0] {
  for (let i = CHAMPION_TIERS.length - 1; i >= 0; i--) {
    if (streak >= CHAMPION_TIERS[i].minStreak) {
      return CHAMPION_TIERS[i];
    }
  }
  return CHAMPION_TIERS[0];
}

function generateMysteryChestReward() {
  const totalWeight = MYSTERY_CHEST_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;

  for (const reward of MYSTERY_CHEST_REWARDS) {
    random -= reward.weight;
    if (random <= 0) {
      return {
        type: reward.type,
        diamonds: reward.diamonds || 0,
        emeralds: reward.emeralds || 0,
        gold: reward.gold || 0,
        streakFreezes: reward.streakFreezes,
        xpBoostPercent: reward.xpBoostPercent,
        xpBoostHours: reward.xpBoostHours,
      };
    }
  }

  return MYSTERY_CHEST_REWARDS[0]; // Fallback
}

// Get current week's practice quests for a player
export const getWeeklyQuests = query({
  args: {
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const weekStart = getWeekStartString(new Date());

    const quests = await ctx.db
      .query("weeklyPracticeQuests")
      .withIndex("by_player_week", (q) =>
        q.eq("playerId", args.playerId).eq("weekStart", weekStart)
      )
      .collect();

    // Get weekly champion progress
    const champion = await ctx.db
      .query("weeklyChampion")
      .withIndex("by_player_week", (q) =>
        q.eq("playerId", args.playerId).eq("weekStart", weekStart)
      )
      .first();

    return {
      quests,
      weekStart,
      weekEnd: getWeekEndString(new Date()),
      champion,
      totalCompleted: quests.filter((q) => q.isCompleted).length,
      totalQuests: quests.length,
    };
  },
});

// Generate weekly quests based on errors (called by cron or manually)
export const generateWeeklyQuests = mutation({
  args: {
    playerId: v.id("players"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: generateWeeklyQuests IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return { created: 0, error: "Unauthorized" };
      }
    }

    const weekStart = getWeekStartString(new Date());

    // Check if quests already exist for this week
    const existingQuests = await ctx.db
      .query("weeklyPracticeQuests")
      .withIndex("by_player_week", (q) =>
        q.eq("playerId", args.playerId).eq("weekStart", weekStart)
      )
      .first();

    if (existingQuests) {
      return { created: 0, message: "Quests already exist for this week" };
    }

    // Get weak topics from last 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const errors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player_resolved", (q) =>
        q.eq("playerId", args.playerId).eq("resolved", false)
      )
      .filter((q) => q.gte(q.field("createdAt"), twoWeeksAgo.toISOString()))
      .collect();

    // Group by topic
    const topicErrors: Record<
      string,
      {
        topic: string;
        subject: string;
        count: number;
        questions: Array<{
          question: string;
          wrongAnswer: string;
          correctAnswer: string;
        }>;
      }
    > = {};

    for (const error of errors) {
      if (!topicErrors[error.topic]) {
        topicErrors[error.topic] = {
          topic: error.topic,
          subject: error.subject,
          count: 0,
          questions: [],
        };
      }
      topicErrors[error.topic].count++;
      if (topicErrors[error.topic].questions.length < 5) {
        topicErrors[error.topic].questions.push({
          question: error.question,
          wrongAnswer: error.wrongAnswer,
          correctAnswer: error.correctAnswer,
        });
      }
    }

    // Sort by error count and take top 6
    const topTopics = Object.values(topicErrors)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Create quests for each weak topic
    const questsCreated: string[] = [];
    const now = new Date().toISOString();

    for (const topicData of topTopics) {
      // Generate quest based on topic
      const questConfig = generateQuestConfig(topicData);

      const questId = await ctx.db.insert("weeklyPracticeQuests", {
        playerId: args.playerId,
        weekStart,
        topic: topicData.topic,
        subject: topicData.subject,
        questName: questConfig.name,
        questIcon: questConfig.icon,
        description: questConfig.description,
        errorCount: topicData.count,
        questions: questConfig.questions,
        targetCorrect: questConfig.targetCorrect,
        currentCorrect: 0,
        isCompleted: false,
        reward: questConfig.reward,
        createdAt: now,
      });

      questsCreated.push(questId);
    }

    // Create or update weekly champion tracker with streak calculation
    const existingChampion = await ctx.db
      .query("weeklyChampion")
      .withIndex("by_player_week", (q) =>
        q.eq("playerId", args.playerId).eq("weekStart", weekStart)
      )
      .first();

    if (!existingChampion) {
      // Calculate champion streak from previous weeks
      const previousWeekStart = new Date(weekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      const previousWeekString = previousWeekStart.toISOString().split("T")[0];

      const previousChampion = await ctx.db
        .query("weeklyChampion")
        .withIndex("by_player_week", (q) =>
          q.eq("playerId", args.playerId).eq("weekStart", previousWeekString)
        )
        .first();

      // Check if previous week was a champion week (all quests completed)
      let championStreak = 1;
      if (previousChampion &&
          previousChampion.bonusClaimed &&
          previousChampion.totalQuestsCompleted >= previousChampion.totalQuestsAvailable) {
        championStreak = (previousChampion.championStreak || 0) + 1;
      }

      // Get tiered rewards based on streak
      const tier = getChampionTier(championStreak);
      const baseReward = {
        diamonds: 100 + questsCreated.length * 20,
        emeralds: 50 + questsCreated.length * 10,
        xp: 200 + questsCreated.length * 50,
      };

      // Apply tier multiplier
      const tieredReward = {
        diamonds: Math.floor(baseReward.diamonds * tier.multiplier),
        emeralds: Math.floor(baseReward.emeralds * tier.multiplier),
        xp: Math.floor(baseReward.xp * tier.multiplier),
      };

      // Mystery chest is earned at tier 2+ or every 3rd week
      const earnsMysteryChest = tier.tier >= 2 || championStreak % 3 === 0;

      await ctx.db.insert("weeklyChampion", {
        playerId: args.playerId,
        weekStart,
        totalQuestsCompleted: 0,
        totalQuestsAvailable: questsCreated.length,
        bonusClaimed: false,
        bonusReward: tieredReward,
        championStreak,
        bonusTier: tier.tier,
        mysteryChestEarned: earnsMysteryChest,
        mysteryChestOpened: false,
      });
    }

    return { created: questsCreated.length, questIds: questsCreated };
  },
});

// Answer a question in a practice quest
export const answerPracticeQuestion = mutation({
  args: {
    questId: v.id("weeklyPracticeQuests"),
    questionIndex: v.number(),
    answer: v.string(),
    isCorrect: v.boolean(),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    const quest = await ctx.db.get(args.questId);
    if (!quest) {
      throw new Error("Quest not found");
    }

    // SECURITY: Verify caller owns this quest's player account
    if (args.callerClerkId && quest.playerId) {
      const player = await ctx.db.get(quest.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: answerPracticeQuestion IDOR attempt - caller ${args.callerClerkId} tried to access quest for player ${quest.playerId}`);
        return { error: "Unauthorized" };
      }
    }

    if (quest.isCompleted) {
      return { alreadyCompleted: true };
    }

    const newCorrect = args.isCorrect
      ? quest.currentCorrect + 1
      : quest.currentCorrect;

    const isNowCompleted = newCorrect >= quest.targetCorrect;

    await ctx.db.patch(args.questId, {
      currentCorrect: newCorrect,
      isCompleted: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
    });

    // If completed, resolve the topic errors
    if (isNowCompleted) {
      // Resolve errors for this topic
      const errors = await ctx.db
        .query("errorTracking")
        .withIndex("by_player_topic", (q) =>
          q.eq("playerId", quest.playerId).eq("topic", quest.topic)
        )
        .filter((q) => q.eq(q.field("resolved"), false))
        .collect();

      const now = new Date().toISOString();
      for (const error of errors) {
        await ctx.db.patch(error._id, {
          resolved: true,
          resolvedAt: now,
        });
      }

      // Update weekly champion
      const weekStart = getWeekStartString(new Date());
      const champion = await ctx.db
        .query("weeklyChampion")
        .withIndex("by_player_week", (q) =>
          q.eq("playerId", quest.playerId).eq("weekStart", weekStart)
        )
        .first();

      if (champion) {
        await ctx.db.patch(champion._id, {
          totalQuestsCompleted: champion.totalQuestsCompleted + 1,
        });
      }

      // Award quest rewards
      const player = await ctx.db.get(quest.playerId);
      if (player) {
        await ctx.db.patch(quest.playerId, {
          diamonds: player.diamonds + quest.reward.diamonds,
          emeralds: player.emeralds + quest.reward.emeralds,
          xp: player.xp + quest.reward.xp,
        });
      }
    }

    return {
      isCorrect: args.isCorrect,
      currentCorrect: newCorrect,
      targetCorrect: quest.targetCorrect,
      isCompleted: isNowCompleted,
      reward: isNowCompleted ? quest.reward : null,
    };
  },
});

// Get champion tier info (for UI display)
export const getChampionTierInfo = query({
  args: {},
  handler: async () => {
    return CHAMPION_TIERS;
  },
});

// Claim weekly champion bonus
export const claimWeeklyBonus = mutation({
  args: {
    playerId: v.id("players"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: claimWeeklyBonus IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return { success: false, reason: "Unauthorized" };
      }
    }

    const weekStart = getWeekStartString(new Date());

    const champion = await ctx.db
      .query("weeklyChampion")
      .withIndex("by_player_week", (q) =>
        q.eq("playerId", args.playerId).eq("weekStart", weekStart)
      )
      .first();

    if (!champion) {
      return { success: false, reason: "No champion data" };
    }

    if (champion.bonusClaimed) {
      return { success: false, reason: "Already claimed" };
    }

    if (champion.totalQuestsCompleted < champion.totalQuestsAvailable) {
      return {
        success: false,
        reason: "Not all quests completed",
        completed: champion.totalQuestsCompleted,
        total: champion.totalQuestsAvailable,
      };
    }

    // Award bonus
    const player = await ctx.db.get(args.playerId);
    if (player) {
      await ctx.db.patch(args.playerId, {
        diamonds: player.diamonds + champion.bonusReward.diamonds,
        emeralds: player.emeralds + champion.bonusReward.emeralds,
        xp: player.xp + champion.bonusReward.xp,
      });
    }

    // Generate mystery chest reward if earned
    let mysteryChestReward = undefined;
    if (champion.mysteryChestEarned && !champion.mysteryChestOpened) {
      mysteryChestReward = generateMysteryChestReward();
    }

    await ctx.db.patch(champion._id, {
      bonusClaimed: true,
      mysteryChestReward,
    });

    return {
      success: true,
      reward: champion.bonusReward,
      championStreak: champion.championStreak || 1,
      bonusTier: champion.bonusTier || 1,
      mysteryChestEarned: champion.mysteryChestEarned,
      tierInfo: getChampionTier(champion.championStreak || 1),
    };
  },
});

// Open mystery chest
export const openMysteryChest = mutation({
  args: {
    playerId: v.id("players"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: openMysteryChest IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return { success: false, reason: "Unauthorized" };
      }
    }

    const weekStart = getWeekStartString(new Date());

    const champion = await ctx.db
      .query("weeklyChampion")
      .withIndex("by_player_week", (q) =>
        q.eq("playerId", args.playerId).eq("weekStart", weekStart)
      )
      .first();

    if (!champion) {
      return { success: false, reason: "No champion data" };
    }

    if (!champion.mysteryChestEarned) {
      return { success: false, reason: "No mystery chest earned" };
    }

    if (champion.mysteryChestOpened) {
      return { success: false, reason: "Already opened" };
    }

    if (!champion.bonusClaimed) {
      return { success: false, reason: "Claim bonus first" };
    }

    const reward = champion.mysteryChestReward || generateMysteryChestReward();

    // Award mystery chest rewards
    const player = await ctx.db.get(args.playerId);
    if (player) {
      const updates: Record<string, number> = {};

      if (reward.diamonds) {
        updates.diamonds = player.diamonds + reward.diamonds;
      }
      if (reward.emeralds) {
        updates.emeralds = player.emeralds + reward.emeralds;
      }
      if (reward.gold) {
        updates.gold = player.gold + reward.gold;
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(args.playerId, updates);
      }

      // Handle streak freezes (add to gamification streak table)
      if (reward.streakFreezes) {
        const streak = await ctx.db
          .query("playerStreaks")
          .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
          .first();

        if (streak) {
          await ctx.db.patch(streak._id, {
            streakFreezes: streak.streakFreezes + reward.streakFreezes,
          });
        }
      }

      // TODO: Handle XP boost (could add to activeBoosts table)
    }

    await ctx.db.patch(champion._id, {
      mysteryChestOpened: true,
      mysteryChestReward: reward,
    });

    return {
      success: true,
      reward,
    };
  },
});

// Helper functions
function getWeekStartString(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function getWeekEndString(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// Internal mutation for cron job - generate weekly quests for all active players
export const generateAllPlayersWeeklyQuests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const weekStart = getWeekStartString(new Date());

    // Get all players
    const players = await ctx.db
      .query("players")
      .collect();

    let generated = 0;
    let skipped = 0;

    for (const player of players) {
      // Check if quests already exist for this week
      const existingQuests = await ctx.db
        .query("weeklyPracticeQuests")
        .withIndex("by_player_week", (q) =>
          q.eq("playerId", player._id).eq("weekStart", weekStart)
        )
        .first();

      if (existingQuests) {
        skipped++;
        continue;
      }

      // Get weak topics from last 2 weeks
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const errors = await ctx.db
        .query("errorTracking")
        .withIndex("by_player_resolved", (q) =>
          q.eq("playerId", player._id).eq("resolved", false)
        )
        .filter((q) => q.gte(q.field("createdAt"), twoWeeksAgo.toISOString()))
        .collect();

      // Group by topic
      const topicErrors: Record<
        string,
        {
          topic: string;
          subject: string;
          count: number;
          questions: Array<{
            question: string;
            wrongAnswer: string;
            correctAnswer: string;
          }>;
        }
      > = {};

      for (const error of errors) {
        if (!topicErrors[error.topic]) {
          topicErrors[error.topic] = {
            topic: error.topic,
            subject: error.subject,
            count: 0,
            questions: [],
          };
        }
        topicErrors[error.topic].count++;
        if (topicErrors[error.topic].questions.length < 5) {
          topicErrors[error.topic].questions.push({
            question: error.question,
            wrongAnswer: error.wrongAnswer,
            correctAnswer: error.correctAnswer,
          });
        }
      }

      // Get top 3-5 weak topics
      const sortedTopics = Object.values(topicErrors)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (sortedTopics.length === 0) {
        skipped++;
        continue;
      }

      // Create quests for each weak topic
      const questsCreated: string[] = [];

      // Initialize weekly champion
      await ctx.db.insert("weeklyChampion", {
        playerId: player._id,
        weekStart,
        totalQuestsAvailable: sortedTopics.length,
        totalQuestsCompleted: 0,
        bonusReward: {
          diamonds: 100,
          emeralds: 50,
          xp: 500,
        },
        bonusClaimed: false,
      });

      for (const topicData of sortedTopics) {
        // Generate quest name and icon based on topic
        const questDetails = getQuestDetails(topicData.topic, topicData.subject);

        // Generate practice questions
        const questions = topicData.questions.map((q) => ({
          text: q.question,
          type: "multiple_choice" as const,
          options: generateOptions(q.correctAnswer, q.wrongAnswer),
          correct: q.correctAnswer,
          explanation: `The correct answer is: ${q.correctAnswer}`,
        }));

        // Add some extra practice questions if needed
        while (questions.length < 5) {
          questions.push({
            text: `Practice question for ${topicData.topic}`,
            type: "multiple_choice" as const,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct: "Option A",
            explanation: "Keep practicing!",
          });
        }

        await ctx.db.insert("weeklyPracticeQuests", {
          playerId: player._id,
          weekStart,
          topic: topicData.topic,
          subject: topicData.subject,
          questName: questDetails.name,
          questIcon: questDetails.icon,
          description: questDetails.description,
          errorCount: topicData.count,
          questions,
          targetCorrect: 4,
          currentCorrect: 0,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          reward: {
            diamonds: 30 + topicData.count * 5,
            emeralds: 15 + topicData.count * 2,
            xp: 100 + topicData.count * 10,
          },
        });

        questsCreated.push(topicData.topic);
      }

      generated++;
    }

    return { generated, skipped, totalPlayers: players.length };
  },
});

// Helper to generate quest details from topic
function getQuestDetails(
  topic: string,
  subject: string
): { name: string; icon: string; description: string } {
  const topicLower = topic.toLowerCase();

  // Subject-specific quest names
  if (topicLower.includes("suffix")) {
    return {
      name: "Suffix Sorcery",
      icon: "🎯",
      description: "Master those tricky suffixes!",
    };
  }
  if (topicLower.includes("prefix")) {
    return {
      name: "Prefix Power",
      icon: "✨",
      description: "Learn prefix magic!",
    };
  }
  if (topicLower.includes("verb")) {
    return {
      name: "Verb Victory",
      icon: "⚡",
      description: "Conquer action words!",
    };
  }
  if (topicLower.includes("noun")) {
    return {
      name: "Noun Knight",
      icon: "🏰",
      description: "Name all the things!",
    };
  }
  if (topicLower.includes("spell")) {
    return {
      name: "Spelling Spells",
      icon: "📝",
      description: "Perfect your spelling!",
    };
  }
  if (topicLower.includes("grammar")) {
    return {
      name: "Grammar Guardian",
      icon: "🛡️",
      description: "Protect proper grammar!",
    };
  }
  if (topicLower.includes("multiply") || topicLower.includes("times")) {
    return {
      name: "Multiply Master",
      icon: "✖️",
      description: "Multiply your skills!",
    };
  }
  if (topicLower.includes("divide")) {
    return {
      name: "Division Dojo",
      icon: "➗",
      description: "Divide and conquer!",
    };
  }
  if (topicLower.includes("add")) {
    return {
      name: "Addition Arena",
      icon: "➕",
      description: "Add up your wins!",
    };
  }
  if (topicLower.includes("subtract")) {
    return {
      name: "Subtraction Station",
      icon: "➖",
      description: "Subtract mistakes!",
    };
  }

  // Default
  return {
    name: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Training`,
    icon: "🎯",
    description: `Practice ${topic} skills!`,
  };
}


// Generate quest configuration based on topic and errors
function generateQuestConfig(topicData: {
  topic: string;
  subject: string;
  count: number;
  questions: Array<{
    question: string;
    wrongAnswer: string;
    correctAnswer: string;
  }>;
}) {
  // Topic-specific configurations
  const topicConfigs: Record<
    string,
    {
      icon: string;
      nameTemplate: string;
      descTemplate: string;
    }
  > = {
    // English topics
    suffixes: {
      icon: "🎯",
      nameTemplate: "Suffix Master",
      descTemplate: "Practice words with endings like -tion, -ness, -ment",
    },
    prefixes: {
      icon: "🔑",
      nameTemplate: "Prefix Pro",
      descTemplate: "Learn words with beginnings like un-, re-, pre-",
    },
    verbs: {
      icon: "🏃",
      nameTemplate: "Verb Victor",
      descTemplate: "Master action words and tenses",
    },
    nouns: {
      icon: "📦",
      nameTemplate: "Noun Navigator",
      descTemplate: "Practice naming words",
    },
    adjectives: {
      icon: "🎨",
      nameTemplate: "Adjective Artist",
      descTemplate: "Describing words practice",
    },
    spelling: {
      icon: "✍️",
      nameTemplate: "Spelling Wizard",
      descTemplate: "Fix tricky spellings",
    },
    grammar: {
      icon: "📝",
      nameTemplate: "Grammar Guardian",
      descTemplate: "Master sentence structure",
    },
    punctuation: {
      icon: "❗",
      nameTemplate: "Punctuation Patrol",
      descTemplate: "Practice commas, periods, and more",
    },

    // Math topics
    multiplication: {
      icon: "✖️",
      nameTemplate: "Times Table Titan",
      descTemplate: "Multiplication mastery",
    },
    division: {
      icon: "➗",
      nameTemplate: "Division Dragon",
      descTemplate: "Conquering division",
    },
    addition: {
      icon: "➕",
      nameTemplate: "Addition Ace",
      descTemplate: "Adding numbers quickly",
    },
    subtraction: {
      icon: "➖",
      nameTemplate: "Subtraction Star",
      descTemplate: "Taking away practice",
    },
    fractions: {
      icon: "🍕",
      nameTemplate: "Fraction Fighter",
      descTemplate: "Parts of a whole",
    },
    decimals: {
      icon: "🔢",
      nameTemplate: "Decimal Detective",
      descTemplate: "Working with decimal points",
    },
    word_problems: {
      icon: "🧩",
      nameTemplate: "Problem Solver",
      descTemplate: "Math word problem practice",
    },

    // Default
    default: {
      icon: "📚",
      nameTemplate: `${topicData.topic.charAt(0).toUpperCase() + topicData.topic.slice(1)} Practice`,
      descTemplate: `Practice ${topicData.topic} to improve your skills`,
    },
  };

  const config = topicConfigs[topicData.topic.toLowerCase()] || topicConfigs.default;

  // Generate practice questions based on original errors
  const practiceQuestions = topicData.questions.map((q, i) => ({
    text: `What is the correct answer? "${q.question}"`,
    type: "multiple_choice",
    options: generateOptions(q.correctAnswer, q.wrongAnswer),
    correct: q.correctAnswer,
    explanation: `The correct answer is "${q.correctAnswer}". You previously answered "${q.wrongAnswer}".`,
  }));

  // Add more questions if we don't have enough (minimum 5)
  while (practiceQuestions.length < 5) {
    const lastQ = practiceQuestions[practiceQuestions.length - 1];
    practiceQuestions.push({
      ...lastQ,
      text: `Try again: ${lastQ.text}`,
    });
  }

  // Calculate reward based on difficulty
  const baseReward = 20 + topicData.count * 5;

  return {
    name: config.nameTemplate,
    icon: config.icon,
    description: config.descTemplate,
    questions: practiceQuestions,
    targetCorrect: Math.min(5, practiceQuestions.length),
    reward: {
      diamonds: baseReward,
      emeralds: Math.floor(baseReward / 2),
      xp: baseReward * 2,
    },
  };
}

// Generate options for multiple choice including correct and wrong answers
function generateOptions(correct: string, wrong: string): string[] {
  const options = [correct, wrong];

  // Add some dummy options to make it 4 total
  const dummyOptions = [
    "Not sure",
    "Need more info",
    "Skip this one",
    "All of the above",
    "None of the above",
  ];

  while (options.length < 4) {
    const dummy = dummyOptions[Math.floor(Math.random() * dummyOptions.length)];
    if (!options.includes(dummy)) {
      options.push(dummy);
    }
  }

  // Shuffle options
  return options.sort(() => Math.random() - 0.5);
}
