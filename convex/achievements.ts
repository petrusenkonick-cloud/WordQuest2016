import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Achievement definitions
export const ACHIEVEMENTS = [
  {
    id: "first",
    name: "First Steps",
    desc: "Complete 1 quest",
    icon: "baby",
    reward: { diamonds: 50 },
    condition: { type: "quests", value: 1 },
  },
  {
    id: "streak3",
    name: "Hot Streak",
    desc: "3 day streak",
    icon: "flame",
    reward: { diamonds: 100 },
    condition: { type: "streak", value: 3 },
  },
  {
    id: "streak7",
    name: "Weekly Warrior",
    desc: "7 day streak",
    icon: "swords",
    reward: { diamonds: 250, emeralds: 100 },
    condition: { type: "streak", value: 7 },
  },
  {
    id: "words50",
    name: "Word Collector",
    desc: "Learn 50 words",
    icon: "book-open",
    reward: { diamonds: 150 },
    condition: { type: "words", value: 50 },
  },
  {
    id: "perfect",
    name: "Perfect Score",
    desc: "Complete level with no mistakes",
    icon: "target",
    reward: { emeralds: 100 },
    condition: { type: "perfect", value: 1 },
  },
  {
    id: "champion",
    name: "Champion",
    desc: "Complete all levels",
    icon: "trophy",
    reward: { diamonds: 500, emeralds: 250 },
    condition: { type: "allLevels", value: 6 },
  },
  {
    id: "words100",
    name: "Vocabulary Master",
    desc: "Learn 100 words",
    icon: "graduation-cap",
    reward: { diamonds: 300, gold: 100 },
    condition: { type: "words", value: 100 },
  },
  {
    id: "streak30",
    name: "Monthly Master",
    desc: "30 day streak",
    icon: "crown",
    reward: { diamonds: 1000, emeralds: 500, gold: 250 },
    condition: { type: "streak", value: 30 },
  },
];

// Get all achievements with player progress
export const getAchievements = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return [];

    const unlockedAchievements = await ctx.db
      .query("playerAchievements")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievementId));

    // Get completed levels count
    const completedLevels = await ctx.db
      .query("completedLevels")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    return ACHIEVEMENTS.map((achievement) => {
      const unlocked = unlockedIds.has(achievement.id);
      let progress = 0;
      let target = achievement.condition.value;

      // Calculate progress based on condition type
      switch (achievement.condition.type) {
        case "quests":
          progress = player.questsCompleted;
          break;
        case "streak":
          progress = player.streak;
          break;
        case "words":
          progress = player.wordsLearned;
          break;
        case "perfect":
          progress = player.perfectLevels;
          break;
        case "allLevels":
          progress = completedLevels.length;
          break;
      }

      return {
        ...achievement,
        unlocked,
        progress,
        target,
      };
    });
  },
});

// Check and unlock achievements
export const checkAchievements = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return [];

    const unlockedAchievements = await ctx.db
      .query("playerAchievements")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievementId));

    // Get completed levels count
    const completedLevels = await ctx.db
      .query("completedLevels")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const newlyUnlocked: typeof ACHIEVEMENTS = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.condition.type) {
        case "quests":
          shouldUnlock = player.questsCompleted >= achievement.condition.value;
          break;
        case "streak":
          shouldUnlock = player.streak >= achievement.condition.value;
          break;
        case "words":
          shouldUnlock = player.wordsLearned >= achievement.condition.value;
          break;
        case "perfect":
          shouldUnlock = player.perfectLevels >= achievement.condition.value;
          break;
        case "allLevels":
          shouldUnlock = completedLevels.length >= achievement.condition.value;
          break;
      }

      if (shouldUnlock) {
        // Unlock achievement
        await ctx.db.insert("playerAchievements", {
          playerId: args.playerId,
          achievementId: achievement.id,
          unlockedAt: new Date().toISOString(),
        });

        // Give rewards
        const updates: Partial<typeof player> = {};
        if (achievement.reward.diamonds) {
          updates.diamonds = player.diamonds + achievement.reward.diamonds;
        }
        if (achievement.reward.emeralds) {
          updates.emeralds = player.emeralds + (achievement.reward.emeralds || 0);
        }
        if (achievement.reward.gold) {
          updates.gold = player.gold + (achievement.reward.gold || 0);
        }

        await ctx.db.patch(args.playerId, updates);

        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  },
});
