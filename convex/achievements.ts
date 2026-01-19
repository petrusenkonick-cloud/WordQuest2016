import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Achievement definitions
export const ACHIEVEMENTS = [
  // === GETTING STARTED ===
  {
    id: "first",
    name: "First Steps",
    desc: "Complete 1 quest",
    icon: "baby",
    reward: { diamonds: 50 },
    condition: { type: "quests", value: 1 },
  },
  {
    id: "first_homework",
    name: "Homework Hero",
    desc: "Complete your first homework",
    icon: "book",
    reward: { diamonds: 75 },
    condition: { type: "homework", value: 1 },
  },

  // === STREAK ACHIEVEMENTS ===
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
    id: "streak14",
    name: "Fortnight Fighter",
    desc: "14 day streak",
    icon: "shield",
    reward: { diamonds: 400, emeralds: 150 },
    condition: { type: "streak", value: 14 },
  },
  {
    id: "streak30",
    name: "Monthly Master",
    desc: "30 day streak",
    icon: "crown",
    reward: { diamonds: 1000, emeralds: 500, gold: 250 },
    condition: { type: "streak", value: 30 },
  },
  {
    id: "streak100",
    name: "Century Legend",
    desc: "100 day streak!",
    icon: "gem",
    reward: { diamonds: 5000, emeralds: 2000, gold: 1000 },
    condition: { type: "streak", value: 100 },
  },

  // === DAILY CHALLENGE ACHIEVEMENTS ===
  {
    id: "challenge1",
    name: "Challenge Accepted",
    desc: "Complete 1 daily challenge",
    icon: "zap",
    reward: { diamonds: 50 },
    condition: { type: "dailyChallenges", value: 1 },
  },
  {
    id: "challenge7",
    name: "Challenge Champion",
    desc: "Complete 7 daily challenges",
    icon: "medal",
    reward: { diamonds: 200, emeralds: 50 },
    condition: { type: "dailyChallenges", value: 7 },
  },
  {
    id: "challenge30",
    name: "Challenge Master",
    desc: "Complete 30 daily challenges",
    icon: "award",
    reward: { diamonds: 500, emeralds: 200, gold: 100 },
    condition: { type: "dailyChallenges", value: 30 },
  },

  // === PRACTICE ARENA ACHIEVEMENTS ===
  {
    id: "practice10",
    name: "Practice Beginner",
    desc: "Complete 10 practice quests",
    icon: "dumbbell",
    reward: { diamonds: 100 },
    condition: { type: "practiceQuests", value: 10 },
  },
  {
    id: "practice50",
    name: "Practice Pro",
    desc: "Complete 50 practice quests",
    icon: "muscle",
    reward: { diamonds: 300, emeralds: 100 },
    condition: { type: "practiceQuests", value: 50 },
  },
  {
    id: "errors_resolved_10",
    name: "Error Crusher",
    desc: "Resolve 10 errors through practice",
    icon: "check-circle",
    reward: { diamonds: 150 },
    condition: { type: "errorsResolved", value: 10 },
  },
  {
    id: "errors_resolved_50",
    name: "Mistake Master",
    desc: "Resolve 50 errors through practice",
    icon: "check-double",
    reward: { diamonds: 400, emeralds: 150 },
    condition: { type: "errorsResolved", value: 50 },
  },

  // === SPACED REPETITION ACHIEVEMENTS ===
  {
    id: "review5",
    name: "Memory Keeper",
    desc: "Complete 5 review sessions",
    icon: "brain",
    reward: { diamonds: 75 },
    condition: { type: "reviews", value: 5 },
  },
  {
    id: "review25",
    name: "Memory Champion",
    desc: "Complete 25 review sessions",
    icon: "lightbulb",
    reward: { diamonds: 200, emeralds: 75 },
    condition: { type: "reviews", value: 25 },
  },
  {
    id: "mastery5",
    name: "Topic Master",
    desc: "Master 5 topics (90%+ accuracy)",
    icon: "star",
    reward: { diamonds: 300, emeralds: 100 },
    condition: { type: "topicsMastered", value: 5 },
  },

  // === VOCABULARY ACHIEVEMENTS ===
  {
    id: "words50",
    name: "Word Collector",
    desc: "Learn 50 words",
    icon: "book-open",
    reward: { diamonds: 150 },
    condition: { type: "words", value: 50 },
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
    id: "words500",
    name: "Dictionary Wizard",
    desc: "Learn 500 words",
    icon: "library",
    reward: { diamonds: 1000, emeralds: 500, gold: 250 },
    condition: { type: "words", value: 500 },
  },

  // === PERFECT SCORE ACHIEVEMENTS ===
  {
    id: "perfect",
    name: "Perfect Score",
    desc: "Complete level with no mistakes",
    icon: "target",
    reward: { emeralds: 100 },
    condition: { type: "perfect", value: 1 },
  },
  {
    id: "perfect10",
    name: "Perfectionist",
    desc: "Get 10 perfect scores",
    icon: "bullseye",
    reward: { diamonds: 300, emeralds: 150 },
    condition: { type: "perfect", value: 10 },
  },

  // === CHAMPION ACHIEVEMENTS ===
  {
    id: "champion",
    name: "Champion",
    desc: "Complete all levels",
    icon: "trophy",
    reward: { diamonds: 500, emeralds: 250 },
    condition: { type: "allLevels", value: 6 },
  },
  {
    id: "weekly_champion",
    name: "Weekly Champion",
    desc: "Complete all weekly quests",
    icon: "calendar-check",
    reward: { diamonds: 200, emeralds: 100 },
    condition: { type: "weeklyChampion", value: 1 },
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

    // Get completed homework sessions count
    const completedHomework = await ctx.db
      .query("homeworkSessions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    // Get completed daily challenges count
    const completedChallenges = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    // Get completed practice quests count
    const completedPracticeQuests = await ctx.db
      .query("weeklyPracticeQuests")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    // Get resolved errors count
    const resolvedErrors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player_resolved", (q) => q.eq("playerId", args.playerId).eq("resolved", true))
      .collect();

    // Get completed reviews count
    const completedReviews = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    const totalReviews = completedReviews.reduce((sum, r) => sum + r.totalReviews, 0);

    // Get mastered topics count (90%+ accuracy)
    const topicProgress = await ctx.db
      .query("topicProgress")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    const masteredTopics = topicProgress.filter((t) => t.accuracy >= 90).length;

    // Get weekly champion count
    const weeklyChampions = await ctx.db
      .query("weeklyChampion")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("bonusClaimed"), true))
      .collect();

    return ACHIEVEMENTS.map((achievement) => {
      const unlocked = unlockedIds.has(achievement.id);
      let progress = 0;
      const target = achievement.condition.value;

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
        case "homework":
          progress = completedHomework.length;
          break;
        case "dailyChallenges":
          progress = completedChallenges.length;
          break;
        case "practiceQuests":
          progress = completedPracticeQuests.length;
          break;
        case "errorsResolved":
          progress = resolvedErrors.length;
          break;
        case "reviews":
          progress = totalReviews;
          break;
        case "topicsMastered":
          progress = masteredTopics;
          break;
        case "weeklyChampion":
          progress = weeklyChampions.length;
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
  args: {
    playerId: v.id("players"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return [];

    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId && player.clerkId !== args.callerClerkId) {
      console.error(`SECURITY: checkAchievements IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
      return [];
    }

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

    // Get completed homework sessions count
    const completedHomework = await ctx.db
      .query("homeworkSessions")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    // Get completed daily challenges count
    const completedChallenges = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    // Get completed practice quests count
    const completedPracticeQuests = await ctx.db
      .query("weeklyPracticeQuests")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    // Get resolved errors count
    const resolvedErrors = await ctx.db
      .query("errorTracking")
      .withIndex("by_player_resolved", (q) => q.eq("playerId", args.playerId).eq("resolved", true))
      .collect();

    // Get completed reviews count
    const completedReviews = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    const totalReviews = completedReviews.reduce((sum, r) => sum + r.totalReviews, 0);

    // Get mastered topics count (90%+ accuracy)
    const topicProgress = await ctx.db
      .query("topicProgress")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();
    const masteredTopics = topicProgress.filter((t) => t.accuracy >= 90).length;

    // Get weekly champion count
    const weeklyChampions = await ctx.db
      .query("weeklyChampion")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .filter((q) => q.eq(q.field("bonusClaimed"), true))
      .collect();

    const newlyUnlocked: typeof ACHIEVEMENTS = [];

    // BUG FIX #5: Accumulate all rewards first, then apply atomically
    let totalDiamondsReward = 0;
    let totalEmeraldsReward = 0;
    let totalGoldReward = 0;

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
        case "homework":
          shouldUnlock = completedHomework.length >= achievement.condition.value;
          break;
        case "dailyChallenges":
          shouldUnlock = completedChallenges.length >= achievement.condition.value;
          break;
        case "practiceQuests":
          shouldUnlock = completedPracticeQuests.length >= achievement.condition.value;
          break;
        case "errorsResolved":
          shouldUnlock = resolvedErrors.length >= achievement.condition.value;
          break;
        case "reviews":
          shouldUnlock = totalReviews >= achievement.condition.value;
          break;
        case "topicsMastered":
          shouldUnlock = masteredTopics >= achievement.condition.value;
          break;
        case "weeklyChampion":
          shouldUnlock = weeklyChampions.length >= achievement.condition.value;
          break;
      }

      if (shouldUnlock) {
        // Unlock achievement
        await ctx.db.insert("playerAchievements", {
          playerId: args.playerId,
          achievementId: achievement.id,
          unlockedAt: new Date().toISOString(),
        });

        // BUG FIX #5: Accumulate rewards instead of applying immediately
        if (achievement.reward.diamonds) {
          totalDiamondsReward += achievement.reward.diamonds;
        }
        if (achievement.reward.emeralds) {
          totalEmeraldsReward += achievement.reward.emeralds;
        }
        if (achievement.reward.gold) {
          totalGoldReward += achievement.reward.gold;
        }

        newlyUnlocked.push(achievement);
      }
    }

    // BUG FIX #5: Apply all rewards in a single atomic update
    if (newlyUnlocked.length > 0) {
      await ctx.db.patch(args.playerId, {
        diamonds: player.diamonds + totalDiamondsReward,
        emeralds: player.emeralds + totalEmeraldsReward,
        gold: player.gold + totalGoldReward,
      });
    }

    return newlyUnlocked;
  },
});
