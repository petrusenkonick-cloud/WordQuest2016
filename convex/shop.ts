import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Rarity types for items
type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

interface ShopItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  currency: "diamonds" | "emeralds" | "gold";
  rarity: Rarity;
  effect?: string;
  bonus?: string;
}

// Massive shop inventory!
export const SHOP_ITEMS: Record<string, ShopItem[]> = {
  skins: [
    // Common
    { id: "steve", name: "Steve", icon: "boy", price: 0, currency: "diamonds", rarity: "common" },
    { id: "alex", name: "Alex", icon: "girl", price: 50, currency: "diamonds", rarity: "common" },
    { id: "villager", name: "Villager", icon: "farmer", price: 50, currency: "diamonds", rarity: "common" },

    // Uncommon
    { id: "knight", name: "Knight", icon: "knight", price: 100, currency: "diamonds", rarity: "uncommon" },
    { id: "princess", name: "Princess", icon: "princess", price: 100, currency: "diamonds", rarity: "uncommon" },
    { id: "pirate", name: "Pirate", icon: "pirate", price: 150, currency: "diamonds", rarity: "uncommon" },
    { id: "cowboy", name: "Cowboy", icon: "cowboy", price: 150, currency: "diamonds", rarity: "uncommon" },
    { id: "astronaut", name: "Astronaut", icon: "astronaut", price: 200, currency: "diamonds", rarity: "uncommon" },

    // Rare
    { id: "wizard", name: "Wizard", icon: "wizard", price: 300, currency: "diamonds", rarity: "rare", effect: "+5% XP" },
    { id: "ninja", name: "Ninja", icon: "ninja", price: 350, currency: "diamonds", rarity: "rare", effect: "+5% Stealth" },
    { id: "superhero", name: "Superhero", icon: "superhero", price: 400, currency: "diamonds", rarity: "rare", effect: "+5% Streak" },
    { id: "fairy", name: "Fairy", icon: "fairy", price: 450, currency: "diamonds", rarity: "rare", effect: "+1 Hint/day" },
    { id: "vampire", name: "Vampire", icon: "vampire", price: 500, currency: "diamonds", rarity: "rare", effect: "+10% Night XP" },

    // Epic
    { id: "robot", name: "Robot", icon: "robot", price: 750, currency: "diamonds", rarity: "epic", effect: "+10% XP" },
    { id: "alien", name: "Alien", icon: "alien", price: 800, currency: "diamonds", rarity: "epic", effect: "+10% XP" },
    { id: "zombie", name: "Zombie", icon: "zombie", price: 900, currency: "diamonds", rarity: "epic", effect: "+15% Weekend XP" },
    { id: "mermaid", name: "Mermaid", icon: "mermaid", price: 1000, currency: "diamonds", rarity: "epic", effect: "+2 Hints/day" },
    { id: "genie", name: "Genie", icon: "genie", price: 1200, currency: "diamonds", rarity: "epic", effect: "+15% XP" },
    { id: "phoenix_warrior", name: "Phoenix Warrior", icon: "phoenix", price: 1500, currency: "diamonds", rarity: "epic", effect: "Auto-revive streak" },

    // Legendary
    { id: "dragon_lord", name: "Dragon Lord", icon: "dragon_lord", price: 2000, currency: "diamonds", rarity: "legendary", effect: "+20% XP, +2 Gems/level" },
    { id: "time_wizard", name: "Time Wizard", icon: "time_wizard", price: 2500, currency: "diamonds", rarity: "legendary", effect: "+30s on timed questions" },
    { id: "shadow_master", name: "Shadow Master", icon: "shadow", price: 3000, currency: "diamonds", rarity: "legendary", effect: "+25% XP, Mystery rewards" },
    { id: "crystal_sage", name: "Crystal Sage", icon: "crystal", price: 3500, currency: "diamonds", rarity: "legendary", effect: "+3 Gems/level, +20% XP" },
    { id: "thunder_god", name: "Thunder God", icon: "thunder", price: 5000, currency: "diamonds", rarity: "legendary", effect: "+30% XP" },

    // Mythic
    { id: "cosmic_emperor", name: "Cosmic Emperor", icon: "cosmic", price: 7500, currency: "diamonds", rarity: "mythic", effect: "+50% XP, +5 Gems/level" },
    { id: "void_walker", name: "Void Walker", icon: "void", price: 10000, currency: "diamonds", rarity: "mythic", effect: "+40% XP, Skip 1 question/day" },
    { id: "infinity_master", name: "Infinity Master", icon: "infinity", price: 15000, currency: "diamonds", rarity: "mythic", effect: "+100% Weekend XP, +10 Gems/level" },
  ],

  tools: [
    // Common
    { id: "wood_pick", name: "Wood Pickaxe", icon: "axe", price: 25, currency: "emeralds", rarity: "common", effect: "+5% Gem chance" },
    { id: "magnifier", name: "Magnifier", icon: "magnifier", price: 30, currency: "emeralds", rarity: "common", effect: "+5% hint accuracy" },

    // Uncommon
    { id: "stone_pick", name: "Stone Pickaxe", icon: "pickaxe", price: 75, currency: "emeralds", rarity: "uncommon", effect: "+10% Gem chance" },
    { id: "compass", name: "Magic Compass", icon: "compass", price: 100, currency: "emeralds", rarity: "uncommon", effect: "Shows correct category" },
    { id: "lantern", name: "Lantern", icon: "lantern", price: 125, currency: "emeralds", rarity: "uncommon", effect: "+15% XP at night" },

    // Rare
    { id: "iron_pick", name: "Iron Pickaxe", icon: "hammer", price: 200, currency: "emeralds", rarity: "rare", effect: "+20% Gem chance" },
    { id: "telescope", name: "Telescope", icon: "telescope", price: 250, currency: "emeralds", rarity: "rare", effect: "See question difficulty" },
    { id: "spellbook", name: "Spellbook", icon: "book", price: 300, currency: "emeralds", rarity: "rare", effect: "+1 free hint/level" },
    { id: "lucky_clover", name: "Lucky Clover", icon: "clover", price: 350, currency: "emeralds", rarity: "rare", effect: "+15% rare gem chance" },

    // Epic
    { id: "diamond_pick", name: "Diamond Pickaxe", icon: "gem", price: 500, currency: "emeralds", rarity: "epic", effect: "+35% Gem chance" },
    { id: "crystal_ball", name: "Crystal Ball", icon: "crystal_ball", price: 600, currency: "emeralds", rarity: "epic", effect: "Preview next question" },
    { id: "golden_pen", name: "Golden Pen", icon: "pen", price: 750, currency: "emeralds", rarity: "epic", effect: "+25% XP on fill-blank" },
    { id: "time_hourglass", name: "Time Hourglass", icon: "hourglass", price: 900, currency: "emeralds", rarity: "epic", effect: "+20s on all questions" },

    // Legendary
    { id: "netherite_pick", name: "Netherite Pickaxe", icon: "netherite", price: 1500, currency: "emeralds", rarity: "legendary", effect: "+50% Gem chance" },
    { id: "wisdom_crown", name: "Crown of Wisdom", icon: "crown", price: 2000, currency: "emeralds", rarity: "legendary", effect: "+40% XP, Auto-hint" },
    { id: "infinity_gauntlet", name: "Infinity Gauntlet", icon: "gauntlet", price: 3000, currency: "emeralds", rarity: "legendary", effect: "All bonuses combined!" },
  ],

  pets: [
    // Common
    { id: "cat", name: "Whiskers", icon: "cat", price: 100, currency: "diamonds", rarity: "common", bonus: "+2% XP" },
    { id: "dog", name: "Buddy", icon: "dog", price: 100, currency: "diamonds", rarity: "common", bonus: "+2% XP" },
    { id: "hamster", name: "Nibbles", icon: "hamster", price: 75, currency: "diamonds", rarity: "common", bonus: "+1% XP" },
    { id: "rabbit", name: "Hoppy", icon: "rabbit", price: 75, currency: "diamonds", rarity: "common", bonus: "+1% XP" },

    // Uncommon
    { id: "parrot", name: "Echo", icon: "bird", price: 200, currency: "diamonds", rarity: "uncommon", bonus: "+5% XP" },
    { id: "fox", name: "Rusty", icon: "fox", price: 250, currency: "diamonds", rarity: "uncommon", bonus: "+5% XP, +2% luck" },
    { id: "owl", name: "Wisdom", icon: "owl", price: 300, currency: "diamonds", rarity: "uncommon", bonus: "+1 hint/day" },
    { id: "turtle", name: "Shelly", icon: "turtle", price: 200, currency: "diamonds", rarity: "uncommon", bonus: "+10s time" },

    // Rare
    { id: "wolf", name: "Shadow", icon: "wolf", price: 500, currency: "diamonds", rarity: "rare", bonus: "+10% XP, streak protection" },
    { id: "panda", name: "Bamboo", icon: "panda", price: 600, currency: "diamonds", rarity: "rare", bonus: "+8% XP, +5% gems" },
    { id: "lion", name: "King", icon: "lion", price: 700, currency: "diamonds", rarity: "rare", bonus: "+12% XP" },
    { id: "penguin", name: "Waddles", icon: "penguin", price: 550, currency: "diamonds", rarity: "rare", bonus: "+10% XP, +1 hint" },
    { id: "monkey", name: "Bananas", icon: "monkey", price: 500, currency: "diamonds", rarity: "rare", bonus: "+8% XP, +5% gold" },

    // Epic
    { id: "unicorn", name: "Sparkle", icon: "unicorn", price: 1500, currency: "diamonds", rarity: "epic", bonus: "+20% XP" },
    { id: "phoenix", name: "Blaze", icon: "phoenix", price: 2000, currency: "diamonds", rarity: "epic", bonus: "+15% XP, auto-retry" },
    { id: "griffin", name: "Talon", icon: "griffin", price: 1800, currency: "diamonds", rarity: "epic", bonus: "+18% XP, +10% gems" },
    { id: "ice_wolf", name: "Frost", icon: "ice_wolf", price: 2200, currency: "diamonds", rarity: "epic", bonus: "+20% XP, freeze timer" },

    // Legendary
    { id: "dragon", name: "Inferno", icon: "dragon", price: 5000, currency: "diamonds", rarity: "legendary", bonus: "+35% XP, +25% gems" },
    { id: "celestial_cat", name: "Cosmos", icon: "celestial", price: 6000, currency: "diamonds", rarity: "legendary", bonus: "+30% XP, +2 hints/day" },
    { id: "shadow_dragon", name: "Nightmare", icon: "shadow_dragon", price: 7500, currency: "diamonds", rarity: "legendary", bonus: "+40% XP" },

    // Mythic
    { id: "cosmic_dragon", name: "Galaxia", icon: "cosmic_dragon", price: 15000, currency: "diamonds", rarity: "mythic", bonus: "+75% XP, +50% gems" },
    { id: "rainbow_serpent", name: "Prisma", icon: "rainbow", price: 20000, currency: "diamonds", rarity: "mythic", bonus: "+100% Weekend XP" },
  ],

  boosts: [
    // Common
    { id: "hint_1", name: "Hint", icon: "lightbulb", price: 10, currency: "gold", rarity: "common" },
    { id: "hint_5", name: "Hint Pack", icon: "lightbulb", price: 40, currency: "gold", rarity: "common" },
    { id: "hint_20", name: "Hint Bundle", icon: "lightbulb", price: 140, currency: "gold", rarity: "uncommon" },

    // Time boosts
    { id: "time_15", name: "+15 Seconds", icon: "timer", price: 25, currency: "gold", rarity: "common" },
    { id: "time_30", name: "+30 Seconds", icon: "clock", price: 45, currency: "gold", rarity: "uncommon" },
    { id: "time_freeze", name: "Time Freeze", icon: "freeze", price: 100, currency: "gold", rarity: "rare" },

    // XP Boosts
    { id: "xp_2x_1hr", name: "2x XP (1hr)", icon: "zap", price: 75, currency: "gold", rarity: "uncommon" },
    { id: "xp_2x_day", name: "2x XP (24hr)", icon: "zap", price: 250, currency: "gold", rarity: "rare" },
    { id: "xp_3x_1hr", name: "3x XP (1hr)", icon: "fire", price: 150, currency: "gold", rarity: "rare" },
    { id: "xp_5x_30min", name: "5x XP (30min)", icon: "explosion", price: 200, currency: "gold", rarity: "epic" },

    // Protection
    { id: "shield_1", name: "Streak Shield", icon: "shield", price: 50, currency: "gold", rarity: "uncommon" },
    { id: "shield_3", name: "Triple Shield", icon: "shield", price: 125, currency: "gold", rarity: "rare" },
    { id: "immortal", name: "Immortal Mode", icon: "star", price: 300, currency: "gold", rarity: "epic" },

    // Gem boosters
    { id: "gem_luck", name: "Gem Luck", icon: "clover", price: 100, currency: "gold", rarity: "rare" },
    { id: "gem_magnet", name: "Gem Magnet", icon: "magnet", price: 200, currency: "gold", rarity: "epic" },
    { id: "legendary_luck", name: "Legendary Luck", icon: "sparkle", price: 500, currency: "gold", rarity: "legendary" },

    // Special
    { id: "second_chance", name: "Second Chance", icon: "retry", price: 75, currency: "gold", rarity: "rare" },
    { id: "skip_ticket", name: "Skip Ticket", icon: "skip", price: 100, currency: "gold", rarity: "rare" },
    { id: "answer_reveal", name: "Answer Reveal", icon: "eye", price: 150, currency: "gold", rarity: "epic" },
    { id: "mega_bundle", name: "MEGA BUNDLE", icon: "gift", price: 999, currency: "gold", rarity: "legendary" },
  ],
};

// Helper to find item by ID across all categories
function findItem(itemId: string): { item: ShopItem; category: string } | null {
  for (const [category, items] of Object.entries(SHOP_ITEMS)) {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      return { item, category };
    }
  }
  return null;
}

// Get all shop items
export const getShopItems = query({
  args: {},
  handler: async () => {
    return SHOP_ITEMS;
  },
});

// Get player inventory
export const getPlayerInventory = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventory")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
  },
});

// Check if player owns an item
export const ownsItem = query({
  args: {
    playerId: v.id("players"),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("inventory")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .first();

    return !!item;
  },
});

// Purchase item
export const purchaseItem = mutation({
  args: {
    playerId: v.id("players"),
    itemId: v.string(),
    itemType: v.string(),
    price: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate item exists in shop
    const shopItem = findItem(args.itemId);
    if (!shopItem) {
      return { success: false, reason: "Item not found in shop" };
    }

    // Verify price matches (security check)
    if (shopItem.item.price !== args.price) {
      return { success: false, reason: "Price mismatch" };
    }

    // Check if already owned (except for consumable boosts)
    const isConsumable = args.itemType === "boosts";
    if (!isConsumable) {
      const existing = await ctx.db
        .query("inventory")
        .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
        .filter((q) => q.eq(q.field("itemId"), args.itemId))
        .first();

      if (existing) {
        return { success: false, reason: "Already owned" };
      }
    }

    // Check if player has enough currency
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      return { success: false, reason: "Player not found" };
    }

    const currencyField = args.currency as "diamonds" | "emeralds" | "gold";
    if (player[currencyField] < args.price) {
      return { success: false, reason: "Insufficient funds" };
    }

    // Deduct currency
    await ctx.db.patch(args.playerId, {
      [currencyField]: player[currencyField] - args.price,
    });

    // Add to inventory
    await ctx.db.insert("inventory", {
      playerId: args.playerId,
      itemId: args.itemId,
      itemType: args.itemType,
      equipped: false,
    });

    return { success: true, rarity: shopItem.item.rarity };
  },
});

// Equip item
export const equipItem = mutation({
  args: {
    playerId: v.id("players"),
    itemId: v.string(),
    itemType: v.string(),
  },
  handler: async (ctx, args) => {
    // Unequip all items of same type
    const items = await ctx.db
      .query("inventory")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("itemType"), args.itemType))
      .collect();

    for (const item of items) {
      if (item.equipped) {
        await ctx.db.patch(item._id, { equipped: false });
      }
    }

    // Equip the selected item
    const itemToEquip = items.find((i) => i.itemId === args.itemId);
    if (itemToEquip) {
      await ctx.db.patch(itemToEquip._id, { equipped: true });

      // If it's a skin, update player's skin
      if (args.itemType === "skins") {
        const shopItem = findItem(args.itemId);
        if (shopItem) {
          await ctx.db.patch(args.playerId, { skin: shopItem.item.icon });
        }
      }
    }

    return { success: true };
  },
});

// Get equipped items
export const getEquippedItems = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("inventory")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("equipped"), true))
      .collect();

    const equipped: Record<string, string> = {};
    for (const item of items) {
      equipped[item.itemType] = item.itemId;
    }

    return equipped;
  },
});

// Get player's active boosts
export const getActiveBoosts = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db
      .query("activeBoosts")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();
  },
});

// Activate a boost
export const activateBoost = mutation({
  args: {
    playerId: v.id("players"),
    boostId: v.string(),
    boostName: v.optional(v.string()),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + args.durationMinutes * 60 * 1000);

    await ctx.db.insert("activeBoosts", {
      playerId: args.playerId,
      boostType: args.boostId,
      boostName: args.boostName || args.boostId,
      multiplier: 1,
      expiresAt: expiresAt.toISOString(),
    });

    return { success: true, expiresAt: expiresAt.toISOString() };
  },
});
