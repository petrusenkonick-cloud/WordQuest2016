import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get tutorial status for a player
export const getTutorialStatus = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      return null;
    }

    return {
      tutorialCompleted: player.tutorialCompleted ?? false,
      tutorialStep: player.tutorialStep ?? 0,
    };
  },
});

// Complete the tutorial
export const completeTutorial = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    await ctx.db.patch(args.playerId, {
      tutorialCompleted: true,
      tutorialStep: 6, // Total steps completed
    });

    return { success: true };
  },
});

// Save tutorial progress (for resuming later)
export const saveTutorialProgress = mutation({
  args: {
    playerId: v.id("players"),
    step: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    await ctx.db.patch(args.playerId, {
      tutorialStep: args.step,
    });

    return { success: true };
  },
});

// Reset tutorial (for testing or re-learning)
export const resetTutorial = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    await ctx.db.patch(args.playerId, {
      tutorialCompleted: false,
      tutorialStep: 0,
    });

    return { success: true };
  },
});
