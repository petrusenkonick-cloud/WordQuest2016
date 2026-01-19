import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { calculateNormalizedScore, AgeGroup } from "./scoring";

// Level definitions - stored here for easy access
export const LEVELS = [
  {
    id: "suffix",
    name: "SUFFIX MINE",
    icon: "stone",
    desc: 'Learn "-less" words',
    rewards: { diamonds: 50, emeralds: 20, xp: 100 },
    questions: [
      { s: "Without any end, the road seemed", a: "endless", h: "Goes on forever!" },
      { s: "She felt no hope, she was", a: "hopeless", h: "No hope = hope+less" },
      { s: "Without a care, she was", a: "careless", h: "No cares!" },
      { s: "The broken toy was", a: "useless", h: "Can't use it!" },
      { s: "No water, the land was", a: "waterless", h: "Without water" },
      { s: "No colour, the picture was", a: "colourless", h: "Without colour" },
      { s: "The stray dog was", a: "ownerless", h: "No owner" },
      { s: "Clear sky, it was", a: "cloudless", h: "No clouds!" },
      { s: "Worth nothing, it was", a: "valueless", h: "No value" },
      { s: "Never gets tired, he was", a: "tireless", h: "Never tired!" },
    ],
    wordBank: [
      "endless", "hopeless", "careless", "useless", "waterless",
      "colourless", "ownerless", "cloudless", "valueless", "tireless", "fearless"
    ],
  },
  {
    id: "imperative",
    name: "COMMAND SCROLL",
    icon: "scroll",
    desc: "Command or Request?",
    rewards: { diamonds: 50, emeralds: 25, xp: 120 },
    questions: [
      { s: "Please clear your desks.", a: "request", h: "'Please' = polite!" },
      { s: "Turn to page 45.", a: "command", h: "Direct order!" },
      { s: "Always say thank you.", a: "command", h: "A rule!" },
      { s: "Pass the ketchup, please.", a: "request", h: "Magic word!" },
      { s: "Put your shoes on.", a: "command", h: "Direct!" },
      { s: "Kindly switch off the lights.", a: "request", h: "'Kindly' = polite" },
      { s: "Be quiet during the test.", a: "command", h: "A rule!" },
      { s: "Take out your homework.", a: "command", h: "Teacher telling!" },
      { s: "Please tidy up.", a: "request", h: "'Please'!" },
      { s: "Listen to instructions.", a: "command", h: "Direct order!" },
    ],
  },
  {
    id: "interrogative",
    name: "QUESTION FORGE",
    icon: "question",
    desc: "Create questions",
    rewards: { diamonds: 60, emeralds: 30, xp: 150 },
    questions: [
      { a: "I have two cats.", h: "How many...", ex: "How many cats do you have?" },
      { a: "My favorite colour is blue.", h: "What is your...", ex: "What is your favorite colour?" },
      { a: "I play soccer on Saturdays.", h: "When do you...", ex: "When do you play soccer?" },
      { a: "By bus.", h: "How do you...", ex: "How do you get there?" },
      { a: "In the morning.", h: "When...", ex: "When do you wake up?" },
      { a: "At the library.", h: "Where...", ex: "Where do you study?" },
      { a: "Because it's fun!", h: "Why...", ex: "Why do you like it?" },
    ],
  },
  {
    id: "crossword",
    name: "WORD MAP",
    icon: "map",
    desc: "Vocabulary puzzle",
    rewards: { diamonds: 80, emeralds: 40, xp: 200 },
    wordBank: [
      "MIRROR", "REQUIRE", "FURNISH", "STAINLESS", "PURE",
      "WHIRL", "CURRENT", "NURTURE", "IRRITATE", "MIRACLE"
    ],
  },
  {
    id: "vocabulary",
    name: "CRAFTING TABLE",
    icon: "crafting",
    desc: "Build sentences",
    rewards: { diamonds: 70, emeralds: 35, xp: 180 },
    wordPairs: [
      ["Helpless", "Speechless"],
      ["Merciless", "Fruitless"],
      ["Tireless", "Stainless"],
      ["Shameless", "Countless"],
      ["Mirror", "Circumstance"],
      ["Irritate", "Require"],
      ["Whirl", "Miracle"],
      ["Furnish", "Nurture"],
      ["Pure", "Curve"],
      ["Current", "Obscure"],
    ],
  },
  {
    id: "story",
    name: "STORY QUEST",
    icon: "book",
    desc: "Be a detective!",
    rewards: { diamonds: 100, emeralds: 50, xp: 250 },
    story:
      "Lucy wandered around the park, searching for her lost puppy, Max. Everywhere she looked, there was no sign of him. As the sun began to set, she heard a whimper near the lake. Racing over, Lucy found Max, tangled in some bushes. Tears of joy filled her eyes as she hugged him tightly, promising never to let him out of her sight again.",
    questions: [
      { q: "Who was Lucy looking for?", a: "Max", options: ["Max", "Her cat", "Her friend", "Her mom"] },
      { q: "Where did Lucy hear a whimper?", a: "near the lake", options: ["near the lake", "in a tree", "at home", "on the road"] },
      { q: "What was Max tangled in?", a: "bushes", options: ["bushes", "ropes", "wires", "grass"] },
      { q: "How did Lucy feel when she found Max?", a: "joyful", options: ["joyful", "angry", "scared", "confused"] },
      { q: "What did Lucy promise?", a: "never let Max out of sight", options: ["never let Max out of sight", "buy Max a collar", "give Max treats", "take Max to the vet"] },
    ],
  },
];

// Get all levels
export const getAllLevels = query({
  args: {},
  handler: async () => {
    return LEVELS;
  },
});

// Get single level by ID
export const getLevel = query({
  args: { levelId: v.string() },
  handler: async (_, args) => {
    return LEVELS.find((l) => l.id === args.levelId);
  },
});

// Get player's completed levels
export const getPlayerProgress = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const completed = await ctx.db
      .query("completedLevels")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const progressMap: Record<string, { stars: number; done: boolean }> = {};
    for (const level of completed) {
      progressMap[level.levelId] = {
        stars: level.stars,
        done: true,
      };
    }

    return progressMap;
  },
});

// Complete a level
export const completeLevel = mutation({
  args: {
    playerId: v.id("players"),
    levelId: v.string(),
    stars: v.number(),
    score: v.number(),
    callerClerkId: v.string(), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      return { success: false, reason: "Player not found", isNewCompletion: false, rewards: null };
    }
    if (player.clerkId !== args.callerClerkId) {
      console.error(`SECURITY: completeLevel IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId} owned by ${player.clerkId}`);
      return { success: false, reason: "Unauthorized: not your account", isNewCompletion: false, rewards: null };
    }

    // Check if already completed
    const existing = await ctx.db
      .query("completedLevels")
      .withIndex("by_player_level", (q) =>
        q.eq("playerId", args.playerId).eq("levelId", args.levelId)
      )
      .first();

    if (existing) {
      // Update if better score
      if (args.stars > existing.stars || args.score > existing.bestScore) {
        await ctx.db.patch(existing._id, {
          stars: Math.max(existing.stars, args.stars),
          bestScore: Math.max(existing.bestScore, args.score),
        });
      }
      // BUG FIX #3: No rewards for replaying levels
      return { isNewCompletion: false, rewards: null };
    }

    // New completion
    await ctx.db.insert("completedLevels", {
      playerId: args.playerId,
      levelId: args.levelId,
      stars: args.stars,
      bestScore: args.score,
      completedAt: new Date().toISOString(),
    });

    // BUG FIX #3: Give rewards on the backend (single source of truth)
    const level = LEVELS.find((l) => l.id === args.levelId);

    if (level && level.rewards) {
      const rewards = level.rewards;

      // Apply XP with level-up logic
      let newXP = player.xp + rewards.xp;
      let newLevel = player.level;
      let newXpNext = player.xpNext;

      // Level up logic
      while (newXP >= newXpNext) {
        newXP -= newXpNext;
        newLevel += 1;
        newXpNext = Math.floor(newXpNext * 1.5);
      }

      // Calculate score for leaderboard (rawScore based on stars and level completion)
      const rawScoreToAdd = args.score * 100 + args.stars * 50;
      const ageGroup = (player.ageGroup || "12+") as AgeGroup;
      const sessionScore = calculateNormalizedScore(
        rawScoreToAdd,
        ageGroup,
        100, // Assume good accuracy for level completion
        10   // Approximate questions answered
      );

      // Update all-time score
      const newRawScore = (player.totalRawScore || 0) + rawScoreToAdd;
      const normalizedScore = calculateNormalizedScore(
        newRawScore,
        ageGroup,
        100,
        player.questsCompleted + 1
      );

      // Update weekly and monthly scores
      const newWeeklyScore = (player.weeklyScore || 0) + sessionScore;
      const newMonthlyScore = (player.monthlyScore || 0) + sessionScore;

      // Update player with all rewards AND leaderboard scores
      await ctx.db.patch(args.playerId, {
        diamonds: player.diamonds + rewards.diamonds,
        emeralds: player.emeralds + rewards.emeralds,
        xp: newXP,
        level: newLevel,
        xpNext: newXpNext,
        totalStars: player.totalStars + args.stars,
        questsCompleted: player.questsCompleted + 1,
        perfectLevels: args.stars === 3 ? player.perfectLevels + 1 : player.perfectLevels,
        // Leaderboard scores
        totalRawScore: newRawScore,
        normalizedScore,
        weeklyScore: newWeeklyScore,
        monthlyScore: newMonthlyScore,
      });

      return {
        isNewCompletion: true,
        rewards,
        leveledUp: newLevel > player.level,
        newLevel
      };
    }

    return { isNewCompletion: true, rewards: null };
  },
});
