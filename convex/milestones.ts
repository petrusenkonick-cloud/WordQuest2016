import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Milestone levels
const MILESTONE_LEVELS = [10, 20, 30, 40, 50, 60, 75, 100];

// Milestone rewards by level
const MILESTONE_REWARDS: Record<number, { diamonds: number; emeralds: number; gold: number; permanentXpBoost?: number }> = {
  10: { diamonds: 200, emeralds: 100, gold: 150 },
  20: { diamonds: 400, emeralds: 200, gold: 300 },
  30: { diamonds: 750, emeralds: 350, gold: 500, permanentXpBoost: 5 },
  40: { diamonds: 1000, emeralds: 500, gold: 750 },
  50: { diamonds: 1500, emeralds: 750, gold: 1000, permanentXpBoost: 10 },
  60: { diamonds: 2500, emeralds: 1250, gold: 1500 },
  75: { diamonds: 5000, emeralds: 2500, gold: 3000, permanentXpBoost: 15 },
  100: { diamonds: 10000, emeralds: 5000, gold: 7500, permanentXpBoost: 25 },
};

// Shop discounts by level
const SHOP_DISCOUNTS: Record<number, number> = {
  10: 5,
  30: 10,
  50: 20,
  100: 35,
};

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
  let discount = 0;
  for (const [minLevel, discountPercent] of Object.entries(SHOP_DISCOUNTS)) {
    if (level >= parseInt(minLevel)) {
      discount = discountPercent;
    }
  }
  return discount;
}

// Check if milestone is available to claim
export const checkMilestone = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return { available: false };

    const level = player.level;
    const claimedMilestones = player.milestonesClaimed || [];

    // Find unclaimed milestones for current level
    const unclaimedMilestones = MILESTONE_LEVELS.filter(
      (m) => level >= m && !claimedMilestones.includes(m)
    );

    if (unclaimedMilestones.length === 0) {
      return { available: false };
    }

    // Return the lowest unclaimed milestone
    const nextMilestone = Math.min(...unclaimedMilestones);
    const rewards = MILESTONE_REWARDS[nextMilestone];

    return {
      available: true,
      milestone: nextMilestone,
      rewards,
      currentTier: getTierForLevel(level),
    };
  },
});

// Get all milestones and their status for a player
export const getMilestonesStatus = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return [];

    const claimedMilestones = player.milestonesClaimed || [];
    const level = player.level;

    return MILESTONE_LEVELS.map((m) => ({
      level: m,
      rewards: MILESTONE_REWARDS[m],
      isClaimed: claimedMilestones.includes(m),
      isUnlocked: level >= m,
      isAvailable: level >= m && !claimedMilestones.includes(m),
    }));
  },
});

// Claim milestone reward
export const claimMilestoneReward = mutation({
  args: {
    playerId: v.id("players"),
    milestoneLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      return { success: false, reason: "Player not found" };
    }

    // Validate milestone level
    if (!MILESTONE_LEVELS.includes(args.milestoneLevel)) {
      return { success: false, reason: "Invalid milestone level" };
    }

    // Check if player has reached this milestone
    if (player.level < args.milestoneLevel) {
      return { success: false, reason: "Milestone not reached yet" };
    }

    // Check if already claimed
    const claimedMilestones = player.milestonesClaimed || [];
    if (claimedMilestones.includes(args.milestoneLevel)) {
      return { success: false, reason: "Milestone already claimed" };
    }

    // Get rewards
    const rewards = MILESTONE_REWARDS[args.milestoneLevel];
    if (!rewards) {
      return { success: false, reason: "Rewards not found" };
    }

    // Calculate new values
    const newDiamonds = player.diamonds + rewards.diamonds;
    const newEmeralds = player.emeralds + rewards.emeralds;
    const newGold = player.gold + rewards.gold;
    const newMilestonesClaimed = [...claimedMilestones, args.milestoneLevel];
    const newTier = getTierForLevel(player.level);
    const newShopDiscount = calculateShopDiscount(player.level);

    // Calculate permanent XP boost (use the highest from all claimed milestones)
    let newPermanentXpBoost = 0;
    for (const milestone of newMilestonesClaimed) {
      const milestoneRewards = MILESTONE_REWARDS[milestone];
      if (milestoneRewards?.permanentXpBoost) {
        newPermanentXpBoost = Math.max(newPermanentXpBoost, milestoneRewards.permanentXpBoost);
      }
    }

    // Update player
    await ctx.db.patch(args.playerId, {
      diamonds: newDiamonds,
      emeralds: newEmeralds,
      gold: newGold,
      milestonesClaimed: newMilestonesClaimed,
      currentTier: newTier,
      permanentXpBoost: newPermanentXpBoost,
      shopDiscount: newShopDiscount,
    });

    return {
      success: true,
      rewards,
      newTier,
      permanentXpBoost: rewards.permanentXpBoost || 0,
      shopDiscount: newShopDiscount,
    };
  },
});

// Update player tier (call after level up to sync tier)
export const updatePlayerTier = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return { success: false };

    const newTier = getTierForLevel(player.level);
    const newShopDiscount = calculateShopDiscount(player.level);

    // Only update if changed
    if (player.currentTier !== newTier || player.shopDiscount !== newShopDiscount) {
      await ctx.db.patch(args.playerId, {
        currentTier: newTier,
        shopDiscount: newShopDiscount,
      });
    }

    // Check if there are unclaimed milestones
    const claimedMilestones = player.milestonesClaimed || [];
    const unclaimedMilestones = MILESTONE_LEVELS.filter(
      (m) => player.level >= m && !claimedMilestones.includes(m)
    );

    return {
      success: true,
      newTier,
      shopDiscount: newShopDiscount,
      hasUnclaimedMilestone: unclaimedMilestones.length > 0,
      nextUnclaimedMilestone: unclaimedMilestones.length > 0 ? Math.min(...unclaimedMilestones) : null,
    };
  },
});

// TEST ONLY: Set player level directly for testing milestones
export const setPlayerLevel = mutation({
  args: {
    clerkId: v.string(),
    level: v.number(),
    xp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find player by clerkId
    const player = await ctx.db
      .query("players")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!player) {
      return { success: false, reason: "Player not found" };
    }

    const newTier = getTierForLevel(args.level);
    const newShopDiscount = calculateShopDiscount(args.level);

    // Calculate XP needed for next level
    let xpNext = 100;
    for (let i = 1; i < args.level; i++) {
      xpNext = Math.floor(xpNext * 1.5);
    }

    await ctx.db.patch(player._id, {
      level: args.level,
      xp: args.xp ?? 0,
      xpNext: xpNext,
      currentTier: newTier,
      shopDiscount: newShopDiscount,
    });

    return {
      success: true,
      playerId: player._id,
      newLevel: args.level,
      newTier,
      shopDiscount: newShopDiscount,
    };
  },
});

// Get player's current tier info
export const getPlayerTierInfo = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return null;

    const tier = getTierForLevel(player.level);
    const claimedMilestones = player.milestonesClaimed || [];
    const shopDiscount = calculateShopDiscount(player.level);

    // Calculate progress to next tier
    const tierMinLevels = [1, 10, 20, 30, 40, 50, 60, 75, 100];
    const currentTierMin = tierMinLevels[tier - 1];
    const nextTierMin = tier < 9 ? tierMinLevels[tier] : null;

    let progressToNextTier = 100; // 100% if max tier
    if (nextTierMin) {
      const levelsInTier = nextTierMin - currentTierMin;
      const levelsCompleted = player.level - currentTierMin;
      progressToNextTier = Math.floor((levelsCompleted / levelsInTier) * 100);
    }

    return {
      tier,
      level: player.level,
      claimedMilestones,
      permanentXpBoost: player.permanentXpBoost || 0,
      shopDiscount,
      progressToNextTier,
      nextTierLevel: nextTierMin,
    };
  },
});
