import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get the game unlock state for a player
export const getGameUnlockState = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    // Get all purchased games for this player
    const purchasedGames = await ctx.db
      .query("purchasedGames")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Check if homework was completed today
    // A homework session is "completed" if it has a completedAt date that matches today
    const homeworkSessions = await ctx.db
      .query("homeworkSessions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const homeworkCompletedToday = homeworkSessions.some((session) => {
      if (!session.completedAt) return false;
      const completedDate = session.completedAt.split("T")[0];
      return completedDate === today;
    });

    return {
      homeworkCompletedToday,
      purchasedGames: purchasedGames.map((pg) => pg.gameId),
    };
  },
});

// Purchase a game permanently
export const purchaseGame = mutation({
  args: {
    playerId: v.id("players"),
    gameId: v.string(),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the player
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Check if player has enough diamonds
    if (player.diamonds < args.cost) {
      throw new Error("Not enough diamonds");
    }

    // Check if already purchased
    const existingPurchase = await ctx.db
      .query("purchasedGames")
      .withIndex("by_player_game", (q) =>
        q.eq("playerId", args.playerId).eq("gameId", args.gameId)
      )
      .first();

    if (existingPurchase) {
      throw new Error("Game already purchased");
    }

    // Deduct diamonds from player
    await ctx.db.patch(args.playerId, {
      diamonds: player.diamonds - args.cost,
    });

    // Record the purchase
    await ctx.db.insert("purchasedGames", {
      playerId: args.playerId,
      gameId: args.gameId,
      purchasedAt: new Date().toISOString(),
      cost: args.cost,
    });

    return { success: true };
  },
});

// Check if a specific game is unlocked for a player
export const isGameUnlocked = query({
  args: {
    playerId: v.id("players"),
    gameId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if purchased
    const purchase = await ctx.db
      .query("purchasedGames")
      .withIndex("by_player_game", (q) =>
        q.eq("playerId", args.playerId).eq("gameId", args.gameId)
      )
      .first();

    if (purchase) return true;

    // Check if homework done today
    const today = new Date().toISOString().split("T")[0];
    const homeworkSessions = await ctx.db
      .query("homeworkSessions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const homeworkCompletedToday = homeworkSessions.some((session) => {
      if (!session.completedAt) return false;
      const completedDate = session.completedAt.split("T")[0];
      return completedDate === today;
    });

    return homeworkCompletedToday;
  },
});
