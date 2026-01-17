import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a link code for parent to connect
export const generateLinkCode = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    // Delete any existing codes for this player
    const existing = await ctx.db
      .query("pendingLinkCodes")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    for (const code of existing) {
      await ctx.db.delete(code._id);
    }

    // Generate 6-digit code
    const code = Math.random().toString().slice(2, 8);

    // Create expiring code (24 hours)
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await ctx.db.insert("pendingLinkCodes", {
      playerId: args.playerId,
      code,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    });

    return { code, expiresAt: expires.toISOString() };
  },
});

// Link parent via Telegram (called when parent sends code to bot)
export const linkParent = mutation({
  args: {
    code: v.string(),
    telegramChatId: v.string(),
    telegramUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find pending code
    const pending = await ctx.db
      .query("pendingLinkCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!pending) {
      return { success: false, error: "Invalid code" };
    }

    // Check if expired
    if (new Date(pending.expiresAt) < new Date()) {
      await ctx.db.delete(pending._id);
      return { success: false, error: "Code expired" };
    }

    // Check if already linked
    const existingLink = await ctx.db
      .query("parentLinks")
      .withIndex("by_player", (q) => q.eq("playerId", pending.playerId))
      .first();

    if (existingLink) {
      // Update existing link
      await ctx.db.patch(existingLink._id, {
        telegramChatId: args.telegramChatId,
        telegramUsername: args.telegramUsername,
        linkCode: args.code,
        linkedAt: new Date().toISOString(),
      });
    } else {
      // Create new link
      await ctx.db.insert("parentLinks", {
        playerId: pending.playerId,
        telegramChatId: args.telegramChatId,
        telegramUsername: args.telegramUsername,
        linkCode: args.code,
        linkedAt: new Date().toISOString(),
        notificationsEnabled: true,
        dailyReportTime: "18:00",
        weeklyReportDay: 0, // Sunday
      });
    }

    // Delete the pending code
    await ctx.db.delete(pending._id);

    // Get player info
    const player = await ctx.db.get(pending.playerId);

    return {
      success: true,
      playerName: player?.name || "Unknown",
      playerId: pending.playerId,
    };
  },
});

// Get parent link status for player
export const getParentLink = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("parentLinks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();
  },
});

// Get player by telegram chat ID
export const getPlayerByTelegram = query({
  args: { telegramChatId: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_telegram", (q) => q.eq("telegramChatId", args.telegramChatId))
      .first();

    if (!link) return null;

    const player = await ctx.db.get(link.playerId);
    return player;
  },
});

// Update notification settings
export const updateNotificationSettings = mutation({
  args: {
    telegramChatId: v.string(),
    notificationsEnabled: v.optional(v.boolean()),
    dailyReportTime: v.optional(v.string()),
    weeklyReportDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_telegram", (q) => q.eq("telegramChatId", args.telegramChatId))
      .first();

    if (!link) return { success: false };

    await ctx.db.patch(link._id, {
      ...(args.notificationsEnabled !== undefined && {
        notificationsEnabled: args.notificationsEnabled,
      }),
      ...(args.dailyReportTime && { dailyReportTime: args.dailyReportTime }),
      ...(args.weeklyReportDay !== undefined && {
        weeklyReportDay: args.weeklyReportDay,
      }),
    });

    return { success: true };
  },
});

// Unlink parent
export const unlinkParent = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (link) {
      await ctx.db.delete(link._id);
    }

    return { success: true };
  },
});

// Save Telegram Chat ID directly (simple method)
export const saveTelegramChatId = mutation({
  args: {
    playerId: v.id("players"),
    telegramChatId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("parentLinks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        telegramChatId: args.telegramChatId,
        linkedAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.insert("parentLinks", {
        playerId: args.playerId,
        telegramChatId: args.telegramChatId,
        linkCode: "direct",
        linkedAt: new Date().toISOString(),
        notificationsEnabled: true,
        dailyReportTime: "18:00",
        weeklyReportDay: 0,
      });
    }

    return { success: true };
  },
});

// Get daily stats for a player
export const getDailyStats = query({
  args: {
    playerId: v.id("players"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyStats")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", args.date)
      )
      .first();
  },
});

// Get weekly stats
export const getWeeklyStats = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    // Get last 7 days
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    return stats.filter((s) => dates.includes(s.date));
  },
});

// Update or create daily stats
export const updateDailyStats = mutation({
  args: {
    playerId: v.id("players"),
    questionsAnswered: v.optional(v.number()),
    correctAnswers: v.optional(v.number()),
    xpEarned: v.optional(v.number()),
    timeSpentMinutes: v.optional(v.number()),
    topic: v.optional(v.string()),
    achievement: v.optional(v.string()),
    isWeakTopic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("dailyStats")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", today)
      )
      .first();

    if (existing) {
      // Update existing
      const updates: Partial<typeof existing> = {};

      if (args.questionsAnswered) {
        updates.questionsAnswered =
          existing.questionsAnswered + args.questionsAnswered;
      }
      if (args.correctAnswers) {
        updates.correctAnswers = existing.correctAnswers + args.correctAnswers;
      }
      if (args.xpEarned) {
        updates.xpEarned = existing.xpEarned + args.xpEarned;
      }
      if (args.timeSpentMinutes) {
        updates.timeSpentMinutes =
          existing.timeSpentMinutes + args.timeSpentMinutes;
      }
      if (args.topic && !existing.topicsStudied.includes(args.topic)) {
        updates.topicsStudied = [...existing.topicsStudied, args.topic];
      }
      if (args.isWeakTopic && args.topic && !existing.weakTopics.includes(args.topic)) {
        updates.weakTopics = [...existing.weakTopics, args.topic];
      }
      if (args.achievement && !existing.achievementsUnlocked.includes(args.achievement)) {
        updates.achievementsUnlocked = [
          ...existing.achievementsUnlocked,
          args.achievement,
        ];
      }

      await ctx.db.patch(existing._id, updates);
    } else {
      // Create new
      await ctx.db.insert("dailyStats", {
        playerId: args.playerId,
        date: today,
        sessionsPlayed: 1,
        questionsAnswered: args.questionsAnswered || 0,
        correctAnswers: args.correctAnswers || 0,
        xpEarned: args.xpEarned || 0,
        timeSpentMinutes: args.timeSpentMinutes || 0,
        topicsStudied: args.topic ? [args.topic] : [],
        weakTopics: args.isWeakTopic && args.topic ? [args.topic] : [],
        achievementsUnlocked: args.achievement ? [args.achievement] : [],
      });
    }
  },
});

// Log notification sent
export const logNotification = mutation({
  args: {
    parentLinkId: v.id("parentLinks"),
    type: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("parentNotifications", {
      parentLinkId: args.parentLinkId,
      type: args.type,
      message: args.message,
      sentAt: new Date().toISOString(),
    });
  },
});

// ========== NOTIFICATION TRIGGERS ==========

// Get notification data for sending (returns chatId if parent wants notifications)
export const getNotificationTarget = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (!link || !link.notificationsEnabled) {
      return null;
    }

    const player = await ctx.db.get(args.playerId);
    return {
      chatId: link.telegramChatId,
      playerName: player?.name || "Your child",
      parentLinkId: link._id,
    };
  },
});

// Prepare homework completion notification
export const prepareHomeworkNotification = query({
  args: {
    playerId: v.id("players"),
    subject: v.string(),
    score: v.number(),
    totalQuestions: v.number(),
    stars: v.number(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (!link || !link.notificationsEnabled) {
      return null;
    }

    const player = await ctx.db.get(args.playerId);
    const playerName = player?.name || "Your child";
    const accuracy = Math.round((args.score / args.totalQuestions) * 100);
    const starEmoji = "⭐".repeat(args.stars);

    let message = `📚 <b>Homework Complete!</b>\n\n`;
    message += `${playerName} finished their <b>${args.subject}</b> homework!\n\n`;
    message += `📊 <b>Results:</b>\n`;
    message += `• Score: ${args.score}/${args.totalQuestions} (${accuracy}%)\n`;
    message += `• Stars: ${starEmoji}\n\n`;

    if (accuracy >= 80) {
      message += `🎉 Excellent work!`;
    } else if (accuracy >= 60) {
      message += `👍 Good effort! Keep practicing!`;
    } else {
      message += `💪 Some topics need more practice. Keep going!`;
    }

    return {
      chatId: link.telegramChatId,
      message,
      parentLinkId: link._id,
    };
  },
});

// Prepare achievement notification
export const prepareAchievementNotification = query({
  args: {
    playerId: v.id("players"),
    achievementName: v.string(),
    achievementIcon: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (!link || !link.notificationsEnabled) {
      return null;
    }

    const player = await ctx.db.get(args.playerId);
    const playerName = player?.name || "Your child";

    const message = `🏆 <b>Achievement Unlocked!</b>\n\n${playerName} earned a new achievement:\n\n${args.achievementIcon} <b>${args.achievementName}</b>\n\n🎉 Great job!`;

    return {
      chatId: link.telegramChatId,
      message,
      parentLinkId: link._id,
    };
  },
});

// Prepare weak topic alert
export const prepareWeakTopicAlert = query({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (!link || !link.notificationsEnabled) {
      return null;
    }

    const player = await ctx.db.get(args.playerId);
    const playerName = player?.name || "Your child";

    const message = `📊 <b>Practice Needed</b>\n\n${playerName} is having difficulty with <b>${args.topic}</b> (${args.accuracy}% accuracy).\n\nThe app will create targeted practice questions to help!`;

    return {
      chatId: link.telegramChatId,
      message,
      parentLinkId: link._id,
    };
  },
});

// Prepare daily summary
export const prepareDailySummary = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (!link || !link.notificationsEnabled) {
      return null;
    }

    const player = await ctx.db.get(args.playerId);
    const playerName = player?.name || "Your child";
    const today = new Date().toISOString().split("T")[0];

    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", today)
      )
      .first();

    if (!stats || stats.questionsAnswered === 0) {
      // No activity today
      return {
        chatId: link.telegramChatId,
        message: `📅 <b>Daily Update</b>\n\n${playerName} didn't practice today.\n\nEncourage them to complete their daily challenge! 💪`,
        parentLinkId: link._id,
      };
    }

    const accuracy = stats.questionsAnswered > 0
      ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
      : 0;

    let message = `📅 <b>Daily Summary</b>\n\n`;
    message += `<b>${playerName}'s Progress Today:</b>\n\n`;
    message += `📝 Questions: ${stats.questionsAnswered}\n`;
    message += `✅ Correct: ${stats.correctAnswers} (${accuracy}%)\n`;
    message += `⚡ XP Earned: ${stats.xpEarned}\n`;
    message += `⏱ Time: ${stats.timeSpentMinutes} minutes\n`;

    if (stats.topicsStudied.length > 0) {
      message += `\n📚 Topics: ${stats.topicsStudied.join(", ")}`;
    }

    if (stats.weakTopics.length > 0) {
      message += `\n\n⚠️ Needs practice: ${stats.weakTopics.join(", ")}`;
    }

    if (stats.achievementsUnlocked.length > 0) {
      message += `\n\n🏆 Achievements: ${stats.achievementsUnlocked.join(", ")}`;
    }

    // Add streak info
    if (player?.streak && player.streak > 1) {
      message += `\n\n🔥 ${player.streak} day streak!`;
    }

    return {
      chatId: link.telegramChatId,
      message,
      parentLinkId: link._id,
    };
  },
});
