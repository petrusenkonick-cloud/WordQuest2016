import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get player by Clerk ID
export const getPlayer = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Check if player name is available
export const isNameAvailable = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const trimmedName = args.name.trim();

    if (trimmedName.length < 2) {
      return { available: false, reason: "Name must be at least 2 characters" };
    }
    if (trimmedName.length > 20) {
      return { available: false, reason: "Name must be 20 characters or less" };
    }

    // Check for existing player with same name (case insensitive)
    const allPlayers = await ctx.db.query("players").collect();
    const nameTaken = allPlayers.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameTaken) {
      return { available: false, reason: "This name is already taken" };
    }

    return { available: true };
  },
});

// Create new player
export const createPlayer = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    skin: v.string(),
    ageGroup: v.optional(v.string()), // "6-8", "9-11", "12+"
    gradeLevel: v.optional(v.number()), // 1-11
  },
  handler: async (ctx, args) => {
    const trimmedName = args.name.trim();

    // Validate name length
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      throw new Error("Name must be 2-20 characters");
    }

    // Validate grade level if provided
    if (args.gradeLevel !== undefined) {
      if (args.gradeLevel < 1 || args.gradeLevel > 11) {
        throw new Error("Grade level must be between 1 and 11");
      }
    }

    // Validate age group if provided
    const validAgeGroups = ["6-8", "9-11", "12+"];
    if (args.ageGroup && !validAgeGroups.includes(args.ageGroup)) {
      throw new Error("Invalid age group");
    }

    // Check if player already exists with this clerkId
    const existingByClerk = await ctx.db
      .query("players")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingByClerk) {
      // Update age info if provided and player exists
      if (args.ageGroup || args.gradeLevel) {
        await ctx.db.patch(existingByClerk._id, {
          ...(args.ageGroup && { ageGroup: args.ageGroup }),
          ...(args.gradeLevel !== undefined && { gradeLevel: args.gradeLevel }),
        });
      }
      return existingByClerk._id;
    }

    // Check if name is already taken (case insensitive)
    const allPlayers = await ctx.db.query("players").collect();
    const nameTaken = allPlayers.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameTaken) {
      throw new Error("This name is already taken");
    }

    // Generate anonymous display name for leaderboards
    const adjectives = ["Happy", "Brave", "Clever", "Swift", "Mighty", "Wise", "Lucky", "Cosmic"];
    const animals = ["Fox", "Wolf", "Eagle", "Tiger", "Dragon", "Phoenix", "Bear", "Owl"];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    const displayName = `${randomAdj}${randomAnimal}${randomNum}`;

    // Create new player with default values and age data
    const playerId = await ctx.db.insert("players", {
      clerkId: args.clerkId,
      name: args.name,
      skin: args.skin,
      level: 1,
      xp: 0,
      xpNext: 100,
      diamonds: 0,
      emeralds: 0,
      gold: 0,
      streak: 0,
      lastLogin: new Date().toDateString(),
      totalStars: 0,
      wordsLearned: 0,
      questsCompleted: 0,
      perfectLevels: 0,
      dailyDay: 1,
      dailyClaimed: false,
      // Age-related fields
      ageGroup: args.ageGroup,
      gradeLevel: args.gradeLevel,
      // Competition fields
      displayName,
      competitionOptIn: true,
      profileCompleted: !!(args.ageGroup && args.gradeLevel),
      normalizedScore: 0,
      totalRawScore: 0,
    });

    // Add default skin to inventory
    await ctx.db.insert("inventory", {
      playerId,
      itemId: "steve",
      itemType: "skin",
      equipped: true,
    });

    // Create initial learning profile
    await ctx.db.insert("learningProfile", {
      playerId,
      hintsEnabled: true,
      voiceEnabled: true,
      updatedAt: new Date().toISOString(),
    });

    return playerId;
  },
});

// Update player profile
export const updatePlayer = mutation({
  args: {
    playerId: v.id("players"),
    updates: v.object({
      name: v.optional(v.string()),
      skin: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, args.updates);
  },
});

// Milestone levels for tracking
const MILESTONE_LEVELS = [10, 20, 30, 40, 50, 60, 75, 100];

// Get tier for level
function getTierForLevel(level: number): number {
  if (level >= 100) return 9;
  if (level >= 75) return 8;
  if (level >= 60) return 7;
  if (level >= 50) return 6;
  if (level >= 40) return 5;
  if (level >= 30) return 4;
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  return 1;
}

// Calculate shop discount based on level
function calculateShopDiscount(level: number): number {
  if (level >= 100) return 35;
  if (level >= 50) return 20;
  if (level >= 30) return 10;
  if (level >= 10) return 5;
  return 0;
}

// Add XP and handle level ups
export const addXP = mutation({
  args: {
    playerId: v.id("players"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    // Apply permanent XP boost if player has one
    const xpBoost = player.permanentXpBoost || 0;
    const boostedAmount = Math.floor(args.amount * (1 + xpBoost / 100));

    let newXP = player.xp + boostedAmount;
    let newLevel = player.level;
    let newXpNext = player.xpNext;
    const oldLevel = player.level;

    // Level up logic
    while (newXP >= newXpNext) {
      newXP -= newXpNext;
      newLevel += 1;
      newXpNext = Math.floor(newXpNext * 1.5); // Increase XP needed each level
    }

    // Check for new milestone reached
    const claimedMilestones = player.milestonesClaimed || [];
    let newMilestoneReached: number | null = null;

    if (newLevel > oldLevel) {
      // Check if we crossed a milestone level
      for (const milestone of MILESTONE_LEVELS) {
        if (oldLevel < milestone && newLevel >= milestone && !claimedMilestones.includes(milestone)) {
          newMilestoneReached = milestone;
          break; // Only trigger for the first unclaimed milestone
        }
      }
    }

    // Calculate new tier and shop discount
    const newTier = getTierForLevel(newLevel);
    const newShopDiscount = calculateShopDiscount(newLevel);

    await ctx.db.patch(args.playerId, {
      xp: newXP,
      level: newLevel,
      xpNext: newXpNext,
      currentTier: newTier,
      shopDiscount: newShopDiscount,
    });

    return {
      leveledUp: newLevel > oldLevel,
      newLevel,
      xpBoosted: boostedAmount > args.amount,
      boostedAmount,
      newMilestoneReached,
      newTier,
    };
  },
});

// Add currency (with validation)
export const addCurrency = mutation({
  args: {
    playerId: v.id("players"),
    currency: v.union(
      v.literal("diamonds"),
      v.literal("emeralds"),
      v.literal("gold")
    ),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // BUG FIX #1: Validate amount is positive
    if (args.amount <= 0) {
      console.warn(`Invalid currency amount: ${args.amount}`);
      return { success: false, reason: "Amount must be positive" };
    }

    const player = await ctx.db.get(args.playerId);
    if (!player) return { success: false, reason: "Player not found" };

    const currentAmount = player[args.currency];
    await ctx.db.patch(args.playerId, {
      [args.currency]: currentAmount + args.amount,
    });

    return { success: true, newAmount: currentAmount + args.amount };
  },
});

// Spend currency
export const spendCurrency = mutation({
  args: {
    playerId: v.id("players"),
    currency: v.union(
      v.literal("diamonds"),
      v.literal("emeralds"),
      v.literal("gold")
    ),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return { success: false, reason: "Player not found" };

    const currentAmount = player[args.currency];
    if (currentAmount < args.amount) {
      return { success: false, reason: "Insufficient funds" };
    }

    await ctx.db.patch(args.playerId, {
      [args.currency]: currentAmount - args.amount,
    });

    return { success: true };
  },
});

// Check and update daily login
export const checkDailyLogin = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    const today = new Date().toDateString();

    if (player.lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = player.lastLogin === yesterday.toDateString();

      const newStreak = wasYesterday ? player.streak + 1 : 1;

      await ctx.db.patch(args.playerId, {
        lastLogin: today,
        streak: newStreak,
        dailyClaimed: false,
      });

      return { streakUpdated: true, newStreak };
    }

    return { streakUpdated: false, newStreak: player.streak };
  },
});

// Streak bonus multipliers - the longer the streak, the bigger the bonus!
const STREAK_BONUSES: Record<number, number> = {
  3: 0.10,   // +10% for 3 days
  5: 0.25,   // +25% for 5 days
  7: 0.50,   // +50% for 1 week
  14: 0.75,  // +75% for 2 weeks
  30: 1.00,  // +100% for 1 month!
};

// Calculate streak bonus based on current streak
function getStreakBonus(streak: number): number {
  const thresholds = Object.keys(STREAK_BONUSES)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of thresholds) {
    if (streak >= threshold) {
      return STREAK_BONUSES[threshold];
    }
  }
  return 0;
}

// Claim daily reward
export const claimDailyReward = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return { success: false };
    if (player.dailyClaimed) return { success: false, reason: "Already claimed" };

    // Base daily rewards (escalating over 7 days)
    const baseRewards = [
      { diamonds: 10, emeralds: 5, gold: 20 },   // Day 1
      { diamonds: 15, emeralds: 8, gold: 30 },   // Day 2
      { diamonds: 20, emeralds: 10, gold: 40 },  // Day 3
      { diamonds: 30, emeralds: 15, gold: 50 },  // Day 4
      { diamonds: 40, emeralds: 20, gold: 60 },  // Day 5
      { diamonds: 50, emeralds: 25, gold: 80 },  // Day 6
      { diamonds: 100, emeralds: 50, gold: 150 }, // Day 7 MEGA BONUS!
    ];

    const dayIndex = Math.min(player.dailyDay - 1, 6);
    const baseReward = baseRewards[dayIndex];

    // Calculate streak bonus
    const streakBonus = getStreakBonus(player.streak);

    // Apply streak bonus to rewards
    const finalReward = {
      diamonds: Math.floor(baseReward.diamonds * (1 + streakBonus)),
      emeralds: Math.floor(baseReward.emeralds * (1 + streakBonus)),
      gold: Math.floor(baseReward.gold * (1 + streakBonus)),
    };

    // Calculate bonus amounts for display
    const bonusAmounts = {
      diamonds: finalReward.diamonds - baseReward.diamonds,
      emeralds: finalReward.emeralds - baseReward.emeralds,
      gold: finalReward.gold - baseReward.gold,
    };

    await ctx.db.patch(args.playerId, {
      diamonds: player.diamonds + finalReward.diamonds,
      emeralds: player.emeralds + finalReward.emeralds,
      gold: player.gold + finalReward.gold,
      dailyClaimed: true,
      dailyDay: player.dailyDay >= 7 ? 1 : player.dailyDay + 1,
    });

    return {
      success: true,
      reward: finalReward,
      baseReward,
      bonusAmounts,
      streakBonus: Math.round(streakBonus * 100), // Return as percentage
      streak: player.streak,
      currentDay: player.dailyDay,
    };
  },
});

// Update words learned
export const updateWordsLearned = mutation({
  args: {
    playerId: v.id("players"),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    await ctx.db.patch(args.playerId, {
      wordsLearned: player.wordsLearned + args.count,
    });
  },
});

// Update quests completed
export const updateQuestsCompleted = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    await ctx.db.patch(args.playerId, {
      questsCompleted: player.questsCompleted + 1,
    });
  },
});

// Update total stars
export const updateTotalStars = mutation({
  args: {
    playerId: v.id("players"),
    stars: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    await ctx.db.patch(args.playerId, {
      totalStars: player.totalStars + args.stars,
    });
  },
});

// ========== ADMIN FUNCTIONS ==========

// Delete all players (DANGER: for testing only)
export const deleteAllPlayers = mutation({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();

    let deletedCount = 0;
    for (const player of players) {
      await ctx.db.delete(player._id);
      deletedCount++;
    }

    return { success: true, deletedCount };
  },
});
