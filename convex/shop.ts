import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Shop items
export const SHOP_ITEMS = {
  skins: [
    { id: "steve", name: "Steve", icon: "boy", price: 0, currency: "diamonds" },
    { id: "alex", name: "Alex", icon: "girl", price: 100, currency: "diamonds" },
    { id: "knight", name: "Knight", icon: "knight", price: 200, currency: "diamonds" },
    { id: "wizard", name: "Wizard", icon: "wizard", price: 300, currency: "diamonds" },
    { id: "ninja", name: "Ninja", icon: "ninja", price: 500, currency: "diamonds" },
    { id: "robot", name: "Robot", icon: "robot", price: 1000, currency: "diamonds" },
  ],
  tools: [
    { id: "wood_pick", name: "Wood Pick", icon: "axe", price: 50, currency: "emeralds", effect: "+5% XP" },
    { id: "stone_pick", name: "Stone Pick", icon: "pickaxe", price: 100, currency: "emeralds", effect: "+10% XP" },
    { id: "iron_pick", name: "Iron Pick", icon: "hammer", price: 200, currency: "emeralds", effect: "+15% XP" },
    { id: "diamond_pick", name: "Diamond Pick", icon: "gem", price: 500, currency: "emeralds", effect: "+25% XP" },
  ],
  pets: [
    { id: "cat", name: "Cat", icon: "cat", price: 150, currency: "diamonds" },
    { id: "dog", name: "Dog", icon: "dog", price: 150, currency: "diamonds" },
    { id: "parrot", name: "Parrot", icon: "bird", price: 200, currency: "diamonds" },
    { id: "fox", name: "Fox", icon: "fox", price: 300, currency: "diamonds" },
    { id: "dragon", name: "Dragon", icon: "dragon", price: 1000, currency: "diamonds" },
  ],
  boosts: [
    { id: "hints", name: "Hints x5", icon: "lightbulb", price: 25, currency: "gold" },
    { id: "shield", name: "Shield", icon: "shield", price: 50, currency: "gold" },
    { id: "2xp", name: "2X XP", icon: "zap", price: 100, currency: "gold" },
  ],
};

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
    // Check if already owned
    const existing = await ctx.db
      .query("inventory")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("itemId"), args.itemId))
      .first();

    if (existing) {
      return { success: false, reason: "Already owned" };
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

    return { success: true };
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
      if (args.itemType === "skin") {
        // Find the skin icon from shop items
        const skinItem = SHOP_ITEMS.skins.find((s) => s.id === args.itemId);
        if (skinItem) {
          await ctx.db.patch(args.playerId, { skin: skinItem.icon });
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
