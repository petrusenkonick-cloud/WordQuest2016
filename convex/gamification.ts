import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// ========== DAILY CHALLENGE TYPES ==========

const DAILY_CHALLENGE_TYPES = [
  {
    type: "streak",
    title: "Streak Master",
    description: "Answer 5 questions in a row correctly",
    targetValue: 5,
    reward: { diamonds: 30, emeralds: 15, xp: 100 },
  },
  {
    type: "speed",
    title: "Speed Demon",
    description: "Answer 10 questions in under 5 minutes",
    targetValue: 10,
    reward: { diamonds: 40, emeralds: 20, xp: 150 },
  },
  {
    type: "accuracy",
    title: "Perfectionist",
    description: "Get 90% or higher accuracy on any practice",
    targetValue: 90,
    reward: { diamonds: 50, emeralds: 25, xp: 200 },
  },
  {
    type: "review",
    title: "Memory Champion",
    description: "Complete 3 review sessions",
    targetValue: 3,
    reward: { diamonds: 35, emeralds: 20, xp: 120 },
  },
  {
    type: "practice",
    title: "Practice Makes Perfect",
    description: "Answer 20 practice questions",
    targetValue: 20,
    reward: { diamonds: 25, emeralds: 15, xp: 80 },
  },
  {
    type: "perfect",
    title: "Star Collector",
    description: "Get 3 stars on any quest",
    targetValue: 1,
    reward: { diamonds: 60, emeralds: 30, xp: 250 },
  },
];

// ========== DAILY CHALLENGES ==========

// Get today's daily challenge for a player (creates one if doesn't exist)
export const getTodayChallenge = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    // Check if challenge exists for today
    const existingChallenge = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", today)
      )
      .first();

    return existingChallenge;
  },
});

// Generate a new daily challenge
export const generateDailyChallenge = mutation({
  args: {
    playerId: v.id("players"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: generateDailyChallenge IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return null;
      }
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if challenge already exists
    const existing = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", today)
      )
      .first();

    if (existing) {
      return existing;
    }

    // Get yesterday's challenge to avoid repeating
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const yesterdayChallenge = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", yesterday)
      )
      .first();

    // Pick a random challenge type (different from yesterday if possible)
    let availableTypes = DAILY_CHALLENGE_TYPES;
    if (yesterdayChallenge) {
      availableTypes = DAILY_CHALLENGE_TYPES.filter(
        (c) => c.type !== yesterdayChallenge.challengeType
      );
    }
    if (availableTypes.length === 0) {
      availableTypes = DAILY_CHALLENGE_TYPES;
    }

    const challengeTemplate =
      availableTypes[Math.floor(Math.random() * availableTypes.length)];

    // Create the challenge
    const challengeId = await ctx.db.insert("dailyChallenges", {
      playerId: args.playerId,
      date: today,
      challengeType: challengeTemplate.type,
      title: challengeTemplate.title,
      description: challengeTemplate.description,
      targetValue: challengeTemplate.targetValue,
      currentValue: 0,
      isCompleted: false,
      reward: challengeTemplate.reward,
    });

    return await ctx.db.get(challengeId);
  },
});

// Update daily challenge progress
export const updateChallengeProgress = mutation({
  args: {
    playerId: v.id("players"),
    challengeType: v.string(),
    incrementBy: v.number(),
    setValue: v.optional(v.number()), // For accuracy-type challenges
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: updateChallengeProgress IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return null;
      }
    }

    const today = new Date().toISOString().split("T")[0];

    const challenge = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", today)
      )
      .first();

    if (!challenge || challenge.isCompleted) {
      return null;
    }

    // Only update if challenge type matches
    if (challenge.challengeType !== args.challengeType) {
      return null;
    }

    const newValue = args.setValue !== undefined
      ? args.setValue
      : challenge.currentValue + args.incrementBy;

    const isNowCompleted = newValue >= challenge.targetValue;

    // BUG FIX #2: Use rewardClaimedAt for idempotency check
    const rewardClaimedAt = isNowCompleted && !challenge.isCompleted
      ? new Date().toISOString()
      : challenge.rewardClaimedAt;

    await ctx.db.patch(challenge._id, {
      currentValue: Math.min(newValue, challenge.targetValue),
      isCompleted: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
      rewardClaimedAt,
    });

    // BUG FIX #2 & #6: Only give reward if not already claimed, and use proper XP level-up logic
    if (isNowCompleted && !challenge.isCompleted && !challenge.rewardClaimedAt) {
      const player = await ctx.db.get(args.playerId);
      if (player) {
        // BUG FIX #6: Apply XP with level-up logic (same as addXP mutation)
        let newXP = player.xp + challenge.reward.xp;
        let newLevel = player.level;
        let newXpNext = player.xpNext;

        // Level up logic
        while (newXP >= newXpNext) {
          newXP -= newXpNext;
          newLevel += 1;
          newXpNext = Math.floor(newXpNext * 1.5);
        }

        await ctx.db.patch(args.playerId, {
          diamonds: player.diamonds + challenge.reward.diamonds,
          emeralds: player.emeralds + challenge.reward.emeralds,
          xp: newXP,
          level: newLevel,
          xpNext: newXpNext,
        });
      }
    }

    return { completed: isNowCompleted, reward: isNowCompleted ? challenge.reward : null };
  },
});

// ========== STREAKS ==========

// Get player streak data
export const getPlayerStreak = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const streak = await ctx.db
      .query("playerStreaks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    return streak;
  },
});

// Initialize or update player streak on activity
export const recordActivity = mutation({
  args: {
    playerId: v.id("players"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: recordActivity IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return null;
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let streak = await ctx.db
      .query("playerStreaks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (!streak) {
      // Create new streak record
      const streakId = await ctx.db.insert("playerStreaks", {
        playerId: args.playerId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        streakFreezes: 0,
        weeklyActivity: getWeeklyActivityArray(today),
        totalActiveDays: 1,
      });

      // Also update player's streak field
      const player = await ctx.db.get(args.playerId);
      if (player) {
        await ctx.db.patch(args.playerId, { streak: 1, lastLogin: today });
      }

      return await ctx.db.get(streakId);
    }

    // Already recorded today
    if (streak.lastActivityDate === today) {
      return streak;
    }

    let newCurrentStreak = streak.currentStreak;
    let usedFreeze = false;

    if (streak.lastActivityDate === yesterday) {
      // Consecutive day - increment streak
      newCurrentStreak = streak.currentStreak + 1;
    } else {
      // Missed day(s)
      const daysMissed = getDaysDifference(streak.lastActivityDate, today);

      if (daysMissed === 2 && streak.streakFreezes > 0) {
        // Use freeze to save streak (missed 1 day)
        newCurrentStreak = streak.currentStreak + 1;
        usedFreeze = true;
      } else {
        // Streak broken
        newCurrentStreak = 1;
      }
    }

    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

    await ctx.db.patch(streak._id, {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
      streakFreezes: usedFreeze ? streak.streakFreezes - 1 : streak.streakFreezes,
      weeklyActivity: getWeeklyActivityArray(today),
      totalActiveDays: streak.totalActiveDays + 1,
    });

    // Also update player's streak field
    const player = await ctx.db.get(args.playerId);
    if (player) {
      await ctx.db.patch(args.playerId, {
        streak: newCurrentStreak,
        lastLogin: today
      });
    }

    return {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      usedFreeze,
      streakBroken: newCurrentStreak === 1 && streak.currentStreak > 1,
    };
  },
});

// Add streak freeze (earned through achievements or purchases)
export const addStreakFreeze = mutation({
  args: {
    playerId: v.id("players"),
    count: v.number(),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify caller owns this player account
    if (args.callerClerkId) {
      const player = await ctx.db.get(args.playerId);
      if (player && player.clerkId !== args.callerClerkId) {
        console.error(`SECURITY: addStreakFreeze IDOR attempt - caller ${args.callerClerkId} tried to access player ${args.playerId}`);
        return null;
      }
    }

    const streak = await ctx.db
      .query("playerStreaks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (!streak) {
      return null;
    }

    await ctx.db.patch(streak._id, {
      streakFreezes: streak.streakFreezes + args.count,
    });

    return streak.streakFreezes + args.count;
  },
});

// ========== HELPER FUNCTIONS ==========

function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getWeeklyActivityArray(today: string): boolean[] {
  // Returns array for current week [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const date = new Date(today);
  const dayOfWeek = date.getDay(); // 0 = Sunday
  const mondayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const activity = [false, false, false, false, false, false, false];
  activity[mondayIndex] = true;

  return activity;
}
