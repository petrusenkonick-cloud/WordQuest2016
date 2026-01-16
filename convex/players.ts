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
  },
  handler: async (ctx, args) => {
    const trimmedName = args.name.trim();

    // Validate name length
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      throw new Error("Name must be 2-20 characters");
    }

    // Check if player already exists with this clerkId
    const existingByClerk = await ctx.db
      .query("players")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingByClerk) {
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

    // Create new player with default values
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
    });

    // Add default skin to inventory
    await ctx.db.insert("inventory", {
      playerId,
      itemId: "steve",
      itemType: "skin",
      equipped: true,
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

// Add XP and handle level ups
export const addXP = mutation({
  args: {
    playerId: v.id("players"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    let newXP = player.xp + args.amount;
    let newLevel = player.level;
    let newXpNext = player.xpNext;

    // Level up logic
    while (newXP >= newXpNext) {
      newXP -= newXpNext;
      newLevel += 1;
      newXpNext = Math.floor(newXpNext * 1.5); // Increase XP needed each level
    }

    await ctx.db.patch(args.playerId, {
      xp: newXP,
      level: newLevel,
      xpNext: newXpNext,
    });

    return { leveledUp: newLevel > player.level, newLevel };
  },
});

// Add currency
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
    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    const currentAmount = player[args.currency];
    await ctx.db.patch(args.playerId, {
      [args.currency]: currentAmount + args.amount,
    });
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
