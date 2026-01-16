import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  calculateAgeGroup,
  generateDisplayName,
  calculateNormalizedScore,
  AgeGroup,
} from "./scoring";

/**
 * Update player's demographic profile
 */
export const updatePlayerProfile = mutation({
  args: {
    playerId: v.id("players"),
    birthYear: v.optional(v.number()),
    gradeLevel: v.optional(v.number()),
    nativeLanguage: v.optional(v.string()),
    competitionOptIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Validate birth year
    if (args.birthYear) {
      const currentYear = new Date().getFullYear();
      if (args.birthYear > currentYear - 4 || args.birthYear < currentYear - 20) {
        throw new Error("Invalid birth year. Player must be between 4 and 20 years old.");
      }
    }

    // Validate grade level
    if (args.gradeLevel !== undefined) {
      if (args.gradeLevel < 1 || args.gradeLevel > 11) {
        throw new Error("Grade level must be between 1 and 11");
      }
    }

    // Validate native language
    const validLanguages = ["ru", "en", "uk"];
    if (args.nativeLanguage && !validLanguages.includes(args.nativeLanguage)) {
      throw new Error("Invalid language. Must be 'ru', 'en', or 'uk'");
    }

    // Calculate age group from birth year
    const ageGroup = args.birthYear
      ? calculateAgeGroup(args.birthYear)
      : player.ageGroup;

    // Generate display name if opting into competition and doesn't have one
    let displayName = player.displayName;
    if (args.competitionOptIn && !displayName) {
      displayName = generateDisplayName();
    }

    // Update player
    await ctx.db.patch(args.playerId, {
      ...(args.birthYear && { birthYear: args.birthYear }),
      ...(args.gradeLevel !== undefined && { gradeLevel: args.gradeLevel }),
      ...(args.nativeLanguage && { nativeLanguage: args.nativeLanguage }),
      ...(args.competitionOptIn !== undefined && {
        competitionOptIn: args.competitionOptIn,
      }),
      ...(ageGroup && { ageGroup }),
      ...(displayName && { displayName }),
      profileCompleted: true,
    });

    return { success: true, ageGroup, displayName };
  },
});

/**
 * Complete profile setup (wizard flow)
 */
export const completeProfileSetup = mutation({
  args: {
    playerId: v.id("players"),
    birthYear: v.number(),
    gradeLevel: v.number(),
    nativeLanguage: v.string(),
    competitionOptIn: v.boolean(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Validate birth year
    const currentYear = new Date().getFullYear();
    if (args.birthYear > currentYear - 4 || args.birthYear < currentYear - 20) {
      throw new Error("Invalid birth year. Player must be between 4 and 20 years old.");
    }

    // Validate grade level
    if (args.gradeLevel < 1 || args.gradeLevel > 11) {
      throw new Error("Grade level must be between 1 and 11");
    }

    // Calculate age group
    const ageGroup = calculateAgeGroup(args.birthYear);

    // Generate display name for competition
    const displayName = generateDisplayName();

    // Calculate initial normalized score
    const normalizedScore = calculateNormalizedScore(
      player.totalStars * 100 + player.wordsLearned * 10, // Base raw score
      ageGroup as AgeGroup,
      100, // Assume 100% accuracy for initial score
      player.questsCompleted
    );

    // Update player with all profile data
    await ctx.db.patch(args.playerId, {
      birthYear: args.birthYear,
      gradeLevel: args.gradeLevel,
      nativeLanguage: args.nativeLanguage,
      ageGroup,
      displayName,
      competitionOptIn: args.competitionOptIn,
      profileCompleted: true,
      normalizedScore,
      totalRawScore: player.totalStars * 100 + player.wordsLearned * 10,
    });

    return { success: true, ageGroup, displayName, normalizedScore };
  },
});

/**
 * Get player profile with all demographics
 */
export const getPlayerProfile = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      return null;
    }

    return {
      id: player._id,
      name: player.name,
      skin: player.skin,
      level: player.level,
      xp: player.xp,
      // Demographics
      birthYear: player.birthYear,
      gradeLevel: player.gradeLevel,
      nativeLanguage: player.nativeLanguage,
      ageGroup: player.ageGroup,
      // Competition
      displayName: player.displayName,
      competitionOptIn: player.competitionOptIn,
      profileCompleted: player.profileCompleted,
      normalizedScore: player.normalizedScore,
      // Stats
      totalStars: player.totalStars,
      wordsLearned: player.wordsLearned,
      streak: player.streak,
      questsCompleted: player.questsCompleted,
    };
  },
});

/**
 * Check if player profile is complete
 */
export const isProfileComplete = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      return false;
    }
    return player.profileCompleted === true;
  },
});

/**
 * Update player's normalized score (called after game completion)
 */
export const updateNormalizedScore = mutation({
  args: {
    playerId: v.id("players"),
    rawScoreToAdd: v.number(),
    accuracy: v.number(),
    questionsAnswered: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Calculate new raw score
    const newRawScore = (player.totalRawScore || 0) + args.rawScoreToAdd;

    // Calculate new normalized score
    const ageGroup = (player.ageGroup || "12+") as AgeGroup;
    const normalizedScore = calculateNormalizedScore(
      newRawScore,
      ageGroup,
      args.accuracy,
      args.questionsAnswered
    );

    // Update player
    await ctx.db.patch(args.playerId, {
      totalRawScore: newRawScore,
      normalizedScore,
    });

    return { normalizedScore, rawScore: newRawScore };
  },
});

/**
 * Regenerate display name
 */
export const regenerateDisplayName = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const newDisplayName = generateDisplayName();
    await ctx.db.patch(args.playerId, { displayName: newDisplayName });
    return { displayName: newDisplayName };
  },
});

/**
 * Get players by age group (for dashboard)
 */
export const getPlayersByAgeGroup = query({
  args: { ageGroup: v.string() },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_age_group", (q) => q.eq("ageGroup", args.ageGroup))
      .collect();

    return players.map((p) => ({
      id: p._id,
      displayName: p.displayName || "Anonymous",
      normalizedScore: p.normalizedScore || 0,
      level: p.level,
      streak: p.streak,
      wordsLearned: p.wordsLearned,
    }));
  },
});

/**
 * Get top players for quick leaderboard preview
 */
export const getTopPlayers = query({
  args: {
    limit: v.optional(v.number()),
    ageGroup: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get all players (filter by age group in memory for simplicity)
    const allPlayers = await ctx.db.query("players").collect();

    // Filter by age group if specified
    const players = args.ageGroup
      ? allPlayers.filter(p => p.ageGroup === args.ageGroup)
      : allPlayers;

    // Filter only those who opted in and have scores
    const competitivePlayers = players.filter(
      (p) => p.competitionOptIn && p.normalizedScore !== undefined
    );

    // Sort by normalized score descending
    competitivePlayers.sort(
      (a, b) => (b.normalizedScore || 0) - (a.normalizedScore || 0)
    );

    // Take top N
    return competitivePlayers.slice(0, limit).map((p, index) => ({
      rank: index + 1,
      id: p._id,
      displayName: p.displayName || "Anonymous",
      normalizedScore: p.normalizedScore || 0,
      level: p.level,
      ageGroup: p.ageGroup,
    }));
  },
});
