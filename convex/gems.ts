import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ GEM CONSTANTS (duplicated for Convex runtime) ============
const GEM_TYPES = [
  "topaz",
  "amethyst",
  "sapphire",
  "ruby",
  "emerald_gem",
  "diamond",
  "opal",
  "onyx",
] as const;

type GemType = (typeof GEM_TYPES)[number];
type GemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

const GEM_RARITY: Record<GemType, GemRarity> = {
  topaz: "common",
  amethyst: "uncommon",
  sapphire: "rare",
  ruby: "rare",
  emerald_gem: "epic",
  diamond: "epic",
  opal: "legendary",
  onyx: "legendary",
};

const RARITY_SHARDS: Record<GemRarity, number> = {
  common: 4,
  uncommon: 4,
  rare: 4,
  epic: 6,
  legendary: 8,
};

const RARITY_DROP_CHANCE: Record<GemRarity, number> = {
  common: 30,
  uncommon: 20,
  rare: 10,
  epic: 4,
  legendary: 1,
};

// Depth to available rarities
const DEPTH_RARITIES: { minDepth: number; rarities: GemRarity[] }[] = [
  { minDepth: 0, rarities: ["common"] },
  { minDepth: 6, rarities: ["common", "uncommon"] },
  { minDepth: 16, rarities: ["uncommon", "rare"] },
  { minDepth: 26, rarities: ["rare", "epic"] },
  { minDepth: 36, rarities: ["epic", "legendary"] },
];

// Collection definitions
const COLLECTIONS = [
  { id: "starter", gems: ["topaz", "amethyst"], luckBonus: 5 },
  { id: "elements", gems: ["ruby", "sapphire", "emerald_gem"], luckBonus: 10 },
  {
    id: "rainbow",
    gems: [
      "topaz",
      "amethyst",
      "sapphire",
      "ruby",
      "emerald_gem",
      "diamond",
      "opal",
      "onyx",
    ],
    luckBonus: 25,
  },
];

// Recipe definitions
const RECIPES: Record<
  string,
  {
    ingredients: { gemType: GemType; amount: number }[];
    result: {
      boostType?: string;
      multiplier?: number;
      duration?: number;
      uses?: number;
      cosmeticId?: string;
    };
    name: string;
  }
> = {
  xp_elixir: {
    ingredients: [
      { gemType: "topaz", amount: 2 },
      { gemType: "emerald_gem", amount: 1 },
    ],
    result: { boostType: "xp_multiplier", multiplier: 2, duration: 30 },
    name: "XP Elixir",
  },
  gem_magnet: {
    ingredients: [
      { gemType: "sapphire", amount: 2 },
      { gemType: "amethyst", amount: 3 },
    ],
    result: { boostType: "gem_luck", multiplier: 1.5, duration: 60 },
    name: "Gem Magnet",
  },
  streak_shield: {
    ingredients: [
      { gemType: "ruby", amount: 3 },
      { gemType: "onyx", amount: 1 },
    ],
    result: { boostType: "streak_shield", uses: 1 },
    name: "Streak Shield",
  },
  hint_potion: {
    ingredients: [
      { gemType: "amethyst", amount: 2 },
      { gemType: "topaz", amount: 1 },
    ],
    result: { boostType: "free_hints", uses: 5 },
    name: "Hint Potion",
  },
  fortune_charm: {
    ingredients: [
      { gemType: "emerald_gem", amount: 2 },
      { gemType: "sapphire", amount: 1 },
    ],
    result: { boostType: "double_rewards", multiplier: 2, uses: 10 },
    name: "Fortune Charm",
  },
};

// ============ QUERIES ============

// Get all gems for a player
export const getPlayerGems = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("playerGems")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
  },
});

// Get a specific gem for a player
export const getPlayerGem = query({
  args: { playerId: v.id("players"), gemType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("playerGems")
      .withIndex("by_player_gem", (q) =>
        q.eq("playerId", args.playerId).eq("gemType", args.gemType)
      )
      .first();
  },
});

// Get player's collection progress
export const getCollectionProgress = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const gems = await ctx.db
      .query("playerGems")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const collections = await ctx.db
      .query("gemCollections")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const ownedGemTypes = new Set(
      gems.filter((g) => g.wholeGems > 0).map((g) => g.gemType)
    );

    return COLLECTIONS.map((col) => {
      const progress = col.gems.filter((g) => ownedGemTypes.has(g)).length;
      const dbCollection = collections.find((c) => c.setId === col.id);
      return {
        id: col.id,
        progress,
        total: col.gems.length,
        isComplete: progress === col.gems.length,
        bonusClaimed: dbCollection?.bonusClaimed || false,
        luckBonus: col.luckBonus,
      };
    });
  },
});

// Get player's total luck bonus from collections
export const getPlayerLuckBonus = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const collections = await ctx.db
      .query("gemCollections")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    let totalBonus = 0;
    for (const col of collections) {
      if (col.bonusClaimed) {
        const colDef = COLLECTIONS.find((c) => c.id === col.setId);
        if (colDef) {
          totalBonus += colDef.luckBonus;
        }
      }
    }
    return totalBonus;
  },
});

// Get active boosts for a player
export const getActiveBoosts = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const boosts = await ctx.db
      .query("activeBoosts")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Filter to only active boosts
    return boosts.filter(
      (b) => b.expiresAt > now || (b.usesRemaining && b.usesRemaining > 0)
    );
  },
});

// Get crafting history
export const getCraftingHistory = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("craftingHistory")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(50);
  },
});

// Get recent gem drops
export const getRecentDrops = query({
  args: { playerId: v.id("players"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gemDrops")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(args.limit || 20);
  },
});

// Get active mining session
export const getActiveMiningSession = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("miningSessions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .take(1);

    const session = sessions[0];
    if (session && session.status === "active") {
      return session;
    }
    return null;
  },
});

// ============ MUTATIONS ============

// Add gems or shards to player inventory
export const addGem = mutation({
  args: {
    playerId: v.id("players"),
    gemType: v.string(),
    isWhole: v.boolean(),
    source: v.string(),
    levelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const gemType = args.gemType as GemType;
    const rarity = GEM_RARITY[gemType];
    const shardsNeeded = RARITY_SHARDS[rarity];

    // Get or create gem record
    let gemRecord = await ctx.db
      .query("playerGems")
      .withIndex("by_player_gem", (q) =>
        q.eq("playerId", args.playerId).eq("gemType", gemType)
      )
      .first();

    let newWholeGems = 0;
    let newShards = 0;
    let totalFound = 1;

    if (gemRecord) {
      newWholeGems = gemRecord.wholeGems;
      newShards = gemRecord.shards;
      totalFound = gemRecord.totalFound + 1;
    }

    if (args.isWhole) {
      newWholeGems += 1;
    } else {
      newShards += 1;
      // Check if shards complete a gem
      if (newShards >= shardsNeeded) {
        newWholeGems += 1;
        newShards -= shardsNeeded;
      }
    }

    if (gemRecord) {
      await ctx.db.patch(gemRecord._id, {
        wholeGems: newWholeGems,
        shards: newShards,
        totalFound,
      });
    } else {
      await ctx.db.insert("playerGems", {
        playerId: args.playerId,
        gemType,
        wholeGems: newWholeGems,
        shards: newShards,
        totalFound,
      });
    }

    // Log the drop
    await ctx.db.insert("gemDrops", {
      playerId: args.playerId,
      gemType,
      isWhole: args.isWhole,
      source: args.source,
      levelId: args.levelId,
      droppedAt: new Date().toISOString(),
    });

    // Check collection completion
    await checkCollections(ctx, args.playerId);

    return {
      gemType,
      isWhole: args.isWhole,
      newTotal: newWholeGems,
      newShards,
      shardsNeeded,
      gemCompleted: args.isWhole || newShards === 0,
    };
  },
});

// Helper to check and update collection progress
async function checkCollections(
  ctx: { db: any },
  playerId: string
): Promise<void> {
  const gems = await ctx.db
    .query("playerGems")
    .withIndex("by_player", (q: any) => q.eq("playerId", playerId))
    .collect();

  const ownedGemTypes = new Set(
    gems.filter((g: any) => g.wholeGems > 0).map((g: any) => g.gemType)
  );

  for (const col of COLLECTIONS) {
    const isComplete = col.gems.every((g) => ownedGemTypes.has(g));
    if (!isComplete) continue;

    // Check if collection record exists
    const existing = await ctx.db
      .query("gemCollections")
      .withIndex("by_player_set", (q: any) =>
        q.eq("playerId", playerId).eq("setId", col.id)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("gemCollections", {
        playerId,
        setId: col.id,
        isComplete: true,
        bonusClaimed: false,
        completedAt: new Date().toISOString(),
      });
    } else if (!existing.isComplete) {
      await ctx.db.patch(existing._id, {
        isComplete: true,
        completedAt: new Date().toISOString(),
      });
    }
  }
}

// Claim collection bonus
export const claimCollectionBonus = mutation({
  args: { playerId: v.id("players"), setId: v.string() },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("gemCollections")
      .withIndex("by_player_set", (q) =>
        q.eq("playerId", args.playerId).eq("setId", args.setId)
      )
      .first();

    if (!collection || !collection.isComplete || collection.bonusClaimed) {
      return { success: false, error: "Cannot claim this bonus" };
    }

    await ctx.db.patch(collection._id, { bonusClaimed: true });

    const colDef = COLLECTIONS.find((c) => c.id === args.setId);
    return {
      success: true,
      luckBonus: colDef?.luckBonus || 0,
    };
  },
});

// Craft an item
export const craftItem = mutation({
  args: { playerId: v.id("players"), recipeId: v.string() },
  handler: async (ctx, args) => {
    const recipe = RECIPES[args.recipeId];
    if (!recipe) {
      return { success: false, error: "Recipe not found" };
    }

    // Check if player has enough gems
    const playerGems = await ctx.db
      .query("playerGems")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const gemMap = new Map(playerGems.map((g) => [g.gemType, g]));

    for (const ing of recipe.ingredients) {
      const gem = gemMap.get(ing.gemType);
      if (!gem || gem.wholeGems < ing.amount) {
        return {
          success: false,
          error: `Not enough ${ing.gemType} gems`,
        };
      }
    }

    // Deduct gems
    for (const ing of recipe.ingredients) {
      const gem = gemMap.get(ing.gemType)!;
      await ctx.db.patch(gem._id, {
        wholeGems: gem.wholeGems - ing.amount,
      });
    }

    // Create the result
    const result = recipe.result;
    if (result.boostType) {
      const expiresAt = result.duration
        ? new Date(Date.now() + result.duration * 60 * 1000).toISOString()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year for use-based items

      await ctx.db.insert("activeBoosts", {
        playerId: args.playerId,
        boostType: result.boostType,
        boostName: recipe.name,
        multiplier: result.multiplier || 1,
        usesRemaining: result.uses,
        expiresAt,
        sourceRecipe: args.recipeId,
      });
    }

    // Log crafting
    await ctx.db.insert("craftingHistory", {
      playerId: args.playerId,
      recipeId: args.recipeId,
      itemName: recipe.name,
      ingredientsUsed: recipe.ingredients,
      craftedAt: new Date().toISOString(),
    });

    return {
      success: true,
      itemName: recipe.name,
      result: recipe.result,
    };
  },
});

// Use a boost (decrement uses)
export const useBoost = mutation({
  args: { playerId: v.id("players"), boostType: v.string() },
  handler: async (ctx, args) => {
    const boost = await ctx.db
      .query("activeBoosts")
      .withIndex("by_player_type", (q) =>
        q.eq("playerId", args.playerId).eq("boostType", args.boostType)
      )
      .first();

    if (!boost) {
      return { success: false, error: "No active boost found" };
    }

    const now = new Date().toISOString();

    // Check if boost is expired
    if (boost.expiresAt < now && !boost.usesRemaining) {
      await ctx.db.delete(boost._id);
      return { success: false, error: "Boost expired" };
    }

    // Decrement uses if applicable
    if (boost.usesRemaining !== undefined) {
      if (boost.usesRemaining <= 1) {
        await ctx.db.delete(boost._id);
      } else {
        await ctx.db.patch(boost._id, {
          usesRemaining: boost.usesRemaining - 1,
        });
      }
    }

    return {
      success: true,
      multiplier: boost.multiplier,
      remainingUses: boost.usesRemaining ? boost.usesRemaining - 1 : undefined,
    };
  },
});

// ============ MINING MUTATIONS ============

// Start a mining session
export const startMiningSession = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    // Check for existing active session
    const existing = await ctx.db
      .query("miningSessions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .first();

    if (existing && existing.status === "active") {
      return { success: false, error: "Session already active", session: existing };
    }

    const session = await ctx.db.insert("miningSessions", {
      playerId: args.playerId,
      depth: 0,
      gemsFound: [],
      questionsAnswered: 0,
      correctAnswers: 0,
      mistakes: 0,
      startedAt: new Date().toISOString(),
      status: "active",
    });

    return { success: true, sessionId: session };
  },
});

// Answer a mining question (dig deeper)
export const mineDig = mutation({
  args: {
    sessionId: v.id("miningSessions"),
    isCorrect: v.boolean(),
    luckBonus: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      return { success: false, error: "Session not active" };
    }

    const newDepth = session.depth + (args.isCorrect ? 1 : 0);
    const newMistakes = session.mistakes + (args.isCorrect ? 0 : 1);
    const newCorrect = session.correctAnswers + (args.isCorrect ? 1 : 0);

    // Check if session ends (3 mistakes)
    if (newMistakes >= 3) {
      await ctx.db.patch(args.sessionId, {
        depth: newDepth,
        mistakes: newMistakes,
        correctAnswers: newCorrect,
        questionsAnswered: session.questionsAnswered + 1,
        status: "failed",
        endedAt: new Date().toISOString(),
      });
      return {
        success: true,
        sessionEnded: true,
        reason: "Too many mistakes",
        depth: newDepth,
        gemsFound: session.gemsFound,
      };
    }

    // Calculate gem drop if correct
    let gemDrop: { gemType: string; isWhole: boolean } | null = null;
    if (args.isCorrect) {
      const luckMult = 1 + (args.luckBonus || 0) / 100;
      gemDrop = calculateMiningDrop(newDepth, luckMult);
    }

    const newGemsFound = gemDrop
      ? [...session.gemsFound, gemDrop]
      : session.gemsFound;

    await ctx.db.patch(args.sessionId, {
      depth: newDepth,
      mistakes: newMistakes,
      correctAnswers: newCorrect,
      questionsAnswered: session.questionsAnswered + 1,
      gemsFound: newGemsFound,
    });

    return {
      success: true,
      sessionEnded: false,
      depth: newDepth,
      mistakes: newMistakes,
      gemDrop,
    };
  },
});

// End mining session and collect gems
export const endMiningSession = mutation({
  args: { sessionId: v.id("miningSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    if (session.status !== "active") {
      return { success: false, error: "Session already ended" };
    }

    // Mark session as completed
    await ctx.db.patch(args.sessionId, {
      status: "completed",
      endedAt: new Date().toISOString(),
    });

    // Add all found gems to player inventory (inline logic)
    for (const gem of session.gemsFound) {
      const gemType = gem.gemType as GemType;
      const rarity = GEM_RARITY[gemType];
      const shardsNeeded = RARITY_SHARDS[rarity];

      // Get or create gem record
      let gemRecord = await ctx.db
        .query("playerGems")
        .withIndex("by_player_gem", (q) =>
          q.eq("playerId", session.playerId).eq("gemType", gemType)
        )
        .first();

      let newWholeGems = 0;
      let newShards = 0;
      let totalFound = 1;

      if (gemRecord) {
        newWholeGems = gemRecord.wholeGems;
        newShards = gemRecord.shards;
        totalFound = gemRecord.totalFound + 1;
      }

      if (gem.isWhole) {
        newWholeGems += 1;
      } else {
        newShards += 1;
        if (newShards >= shardsNeeded) {
          newWholeGems += 1;
          newShards -= shardsNeeded;
        }
      }

      if (gemRecord) {
        await ctx.db.patch(gemRecord._id, {
          wholeGems: newWholeGems,
          shards: newShards,
          totalFound,
        });
      } else {
        await ctx.db.insert("playerGems", {
          playerId: session.playerId,
          gemType,
          wholeGems: newWholeGems,
          shards: newShards,
          totalFound,
        });
      }

      // Log the drop
      await ctx.db.insert("gemDrops", {
        playerId: session.playerId,
        gemType,
        isWhole: gem.isWhole,
        source: "mining",
        droppedAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      depth: session.depth,
      gemsCollected: session.gemsFound.length,
    };
  },
});

// Helper function to calculate mining gem drop
function calculateMiningDrop(
  depth: number,
  luckMultiplier: number
): { gemType: string; isWhole: boolean } | null {
  // Find available rarities for this depth
  let availableRarities: GemRarity[] = ["common"];
  for (const d of DEPTH_RARITIES) {
    if (depth >= d.minDepth) {
      availableRarities = d.rarities;
    }
  }

  // 60% base chance to find something while mining
  if (Math.random() > 0.6 * luckMultiplier) {
    return null;
  }

  // Roll for rarity
  const roll = Math.random() * 100;
  let cumulative = 0;
  let selectedRarity: GemRarity = availableRarities[0];

  for (const rarity of availableRarities) {
    cumulative += RARITY_DROP_CHANCE[rarity] * luckMultiplier;
    if (roll < cumulative) {
      selectedRarity = rarity;
      break;
    }
  }

  // Get gems of selected rarity
  const gemsOfRarity = (Object.keys(GEM_RARITY) as GemType[]).filter(
    (g) => GEM_RARITY[g] === selectedRarity
  );

  if (gemsOfRarity.length === 0) return null;

  const gemType = gemsOfRarity[Math.floor(Math.random() * gemsOfRarity.length)];

  // 25% chance for whole gem in mining
  const isWhole = Math.random() < 0.25;

  return { gemType, isWhole };
}

// ============ DROP CALCULATION FOR GAMEPLAY ============

// Calculate if a gem drops after a correct answer
export const calculateGemDrop = mutation({
  args: {
    playerId: v.id("players"),
    streak: v.number(),
    difficulty: v.optional(v.number()), // 1-3
    levelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get player's luck bonus from collections
    const collections = await ctx.db
      .query("gemCollections")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    let luckBonus = 0;
    for (const col of collections) {
      if (col.bonusClaimed) {
        const colDef = COLLECTIONS.find((c) => c.id === col.setId);
        if (colDef) luckBonus += colDef.luckBonus;
      }
    }

    // Check for active gem luck boost
    const boosts = await ctx.db
      .query("activeBoosts")
      .withIndex("by_player_type", (q) =>
        q.eq("playerId", args.playerId).eq("boostType", "gem_luck")
      )
      .collect();

    const now = new Date().toISOString();
    const activeBoost = boosts.find(
      (b) => b.expiresAt > now || (b.usesRemaining && b.usesRemaining > 0)
    );

    if (activeBoost) {
      luckBonus += (activeBoost.multiplier - 1) * 50; // Convert multiplier to bonus
    }

    // Calculate drop chance: base 35% + streak bonus (1% per streak, max 20%) + luck
    const streakBonus = Math.min(args.streak * 1, 20);
    const difficultyBonus = ((args.difficulty || 1) - 1) * 5;
    const totalChance = 35 + streakBonus + luckBonus + difficultyBonus;

    // Roll for drop
    if (Math.random() * 100 > totalChance) {
      return { dropped: false };
    }

    // Determine rarity based on difficulty
    let availableRarities: GemRarity[] = ["common", "uncommon"];
    if ((args.difficulty || 1) >= 2) {
      availableRarities.push("rare");
    }
    if ((args.difficulty || 1) >= 3) {
      availableRarities.push("epic");
    }
    // Legendary only in special circumstances
    if (args.streak >= 10 && Math.random() < 0.05) {
      availableRarities.push("legendary");
    }

    // Roll for rarity
    const luckMult = 1 + luckBonus / 100;
    const roll = Math.random() * 100;
    let cumulative = 0;
    let selectedRarity: GemRarity = "common";

    for (const rarity of availableRarities) {
      cumulative += RARITY_DROP_CHANCE[rarity] * luckMult;
      if (roll < cumulative) {
        selectedRarity = rarity;
        break;
      }
    }

    // Get gems of selected rarity
    const gemsOfRarity = (Object.keys(GEM_RARITY) as GemType[]).filter(
      (g) => GEM_RARITY[g] === selectedRarity
    );

    const gemType =
      gemsOfRarity[Math.floor(Math.random() * gemsOfRarity.length)];

    // 20% chance for whole gem
    const isWhole = Math.random() < 0.2;

    // Add the gem
    const result = await ctx.runMutation((ctx as any).api.gems.addGem, {
      playerId: args.playerId,
      gemType,
      isWhole,
      source: "correct_answer",
      levelId: args.levelId,
    });

    return {
      dropped: true,
      gemType,
      isWhole,
      rarity: selectedRarity,
      ...result,
    };
  },
});

// Award a gem for level completion
export const awardLevelCompletionGem = mutation({
  args: {
    playerId: v.id("players"),
    levelId: v.string(),
    stars: v.number(),
  },
  handler: async (ctx, args) => {
    // Better gems for more stars
    let availableRarities: GemRarity[] = ["common", "uncommon"];
    if (args.stars >= 2) availableRarities.push("rare");
    if (args.stars === 3) {
      availableRarities.push("epic");
      if (Math.random() < 0.1) availableRarities.push("legendary");
    }

    const roll = Math.random() * 100;
    let cumulative = 0;
    let selectedRarity: GemRarity = "common";

    for (const rarity of availableRarities) {
      cumulative += RARITY_DROP_CHANCE[rarity];
      if (roll < cumulative) {
        selectedRarity = rarity;
        break;
      }
    }

    const gemsOfRarity = (Object.keys(GEM_RARITY) as GemType[]).filter(
      (g) => GEM_RARITY[g] === selectedRarity
    );

    const gemType =
      gemsOfRarity[Math.floor(Math.random() * gemsOfRarity.length)];
    const isWhole = Math.random() < 0.3; // 30% chance for whole gem on level complete

    const result = await ctx.runMutation((ctx as any).api.gems.addGem, {
      playerId: args.playerId,
      gemType,
      isWhole,
      source: "level_complete",
      levelId: args.levelId,
    });

    return {
      gemType,
      isWhole,
      rarity: selectedRarity,
      ...result,
    };
  },
});
