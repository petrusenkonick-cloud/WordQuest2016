import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Helper to send Telegram message
async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

// Format daily report message
function formatDailyReport(
  playerName: string,
  date: string,
  stats: {
    questionsAnswered: number;
    correctAnswers: number;
    xpEarned: number;
    timeSpentMinutes: number;
    topicsStudied: string[];
    weakTopics: string[];
    achievementsUnlocked: string[];
  } | null
): string {
  if (!stats || stats.questionsAnswered === 0) {
    return `📊 <b>Daily Report for ${playerName}</b>

📅 ${date}

😴 No activity today.

Encourage your child to practice! 📚`;
  }

  const accuracy = Math.round((stats.correctAnswers / stats.questionsAnswered) * 100);
  const topics = stats.topicsStudied.length > 0 ? stats.topicsStudied.join(", ") : "None";
  const weakTopics = stats.weakTopics.length > 0 ? stats.weakTopics.join(", ") : "All good! ✨";
  const achievements = stats.achievementsUnlocked.length > 0
    ? stats.achievementsUnlocked.join(", ")
    : "Keep going!";

  let emoji = "🎉";
  if (accuracy < 50) emoji = "💪";
  else if (accuracy < 70) emoji = "👍";
  else if (accuracy >= 90) emoji = "🌟";

  return `📊 <b>Daily Report for ${playerName}</b>

📅 ${date}

📝 Questions: ${stats.questionsAnswered}
✅ Correct: ${stats.correctAnswers} (${accuracy}%)
⭐ XP Earned: ${stats.xpEarned}
⏱ Time: ${stats.timeSpentMinutes} min

📚 Topics: ${topics}
⚠️ Needs Practice: ${weakTopics}
🏆 Achievements: ${achievements}

${emoji} Keep up the great work!`;
}

// Format weekly report message
function formatWeeklyReport(
  playerName: string,
  startDate: string,
  endDate: string,
  weekStats: Array<{
    questionsAnswered: number;
    correctAnswers: number;
    xpEarned: number;
    timeSpentMinutes: number;
    topicsStudied: string[];
    weakTopics: string[];
  }>
): string {
  const daysActive = weekStats.length;
  const totalQuestions = weekStats.reduce((a, b) => a + b.questionsAnswered, 0);
  const totalCorrect = weekStats.reduce((a, b) => a + b.correctAnswers, 0);
  const totalXP = weekStats.reduce((a, b) => a + b.xpEarned, 0);
  const totalMinutes = weekStats.reduce((a, b) => a + b.timeSpentMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Aggregate topics
  const allTopics = [...new Set(weekStats.flatMap((s) => s.topicsStudied))];
  const allWeak = [...new Set(weekStats.flatMap((s) => s.weakTopics))];

  const strengths = allTopics.filter((t) => !allWeak.includes(t)).slice(0, 3);
  const needsWork = allWeak.slice(0, 3);

  // Motivational message based on activity
  let motivation = "";
  if (daysActive === 0) {
    motivation = "📢 Let's get back on track this week!";
  } else if (daysActive < 3) {
    motivation = "💪 More practice will help improve!";
  } else if (daysActive < 5) {
    motivation = "👍 Good progress! Keep it up!";
  } else if (daysActive === 7) {
    motivation = "🏆 Perfect week! Amazing dedication!";
  } else {
    motivation = "🌟 Great week! Almost perfect!";
  }

  return `📊 <b>Weekly Summary for ${playerName}</b>

📅 ${startDate} - ${endDate}

🔥 Days Active: ${daysActive}/7
📝 Total Questions: ${totalQuestions}
✅ Overall Accuracy: ${accuracy}%
⭐ XP Earned: ${totalXP}
⏱ Total Time: ${hours}h ${minutes}m

📈 Strengths: ${strengths.length > 0 ? strengths.join(", ") : "Keep practicing!"}
📉 Needs Work: ${needsWork.length > 0 ? needsWork.join(", ") : "Great job!"}

${motivation}`;
}

// Internal query to get all parent links for daily reports
export const getParentLinksForDailyReport = internalQuery({
  args: { currentHour: v.string() },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("parentLinks")
      .filter((q) => q.eq(q.field("notificationsEnabled"), true))
      .collect();

    // Filter by matching hour (e.g., "18:00" -> "18")
    return links.filter((link) => {
      const reportHour = link.dailyReportTime?.split(":")[0] || "18";
      return reportHour === args.currentHour;
    });
  },
});

// Internal query to get all parent links for weekly reports
export const getParentLinksForWeeklyReport = internalQuery({
  args: { dayOfWeek: v.number() },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("parentLinks")
      .filter((q) => q.eq(q.field("notificationsEnabled"), true))
      .collect();

    // Filter by matching day (0 = Sunday, 1 = Monday, etc.)
    return links.filter((link) => {
      const reportDay = link.weeklyReportDay ?? 0;
      return reportDay === args.dayOfWeek;
    });
  },
});

// Internal query to get player info
export const getPlayerInfo = internalQuery({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});

// Internal query to get daily stats
export const getDailyStatsInternal = internalQuery({
  args: { playerId: v.id("players"), date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyStats")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", args.playerId).eq("date", args.date)
      )
      .first();
  },
});

// Internal query to get weekly stats
export const getWeeklyStatsInternal = internalQuery({
  args: { playerId: v.id("players"), dates: v.array(v.string()) },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    return stats.filter((s) => args.dates.includes(s.date));
  },
});

// Internal mutation to log notification
export const logNotificationInternal = internalMutation({
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

// Main action: Send scheduled daily reports
export const sendScheduledDailyReports = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get current hour in UTC
    const now = new Date();
    const currentHour = now.getUTCHours().toString().padStart(2, "0");
    const today = now.toISOString().split("T")[0];

    console.log(`[Daily Reports] Running at ${currentHour}:00 UTC for date ${today}`);

    // Get parent links that should receive reports at this hour
    const parentLinks = await ctx.runQuery(
      internal.notifications.getParentLinksForDailyReport,
      { currentHour }
    );

    console.log(`[Daily Reports] Found ${parentLinks.length} parents to notify`);

    let sent = 0;
    let failed = 0;

    for (const link of parentLinks) {
      try {
        // Get player info
        const player = await ctx.runQuery(
          internal.notifications.getPlayerInfo,
          { playerId: link.playerId }
        );

        if (!player) continue;

        // Get today's stats
        const stats = await ctx.runQuery(
          internal.notifications.getDailyStatsInternal,
          { playerId: link.playerId, date: today }
        );

        // Format message
        const message = formatDailyReport(player.name, today, stats);

        // Send to Telegram
        const success = await sendTelegramMessage(link.telegramChatId, message);

        if (success) {
          // Log notification
          await ctx.runMutation(internal.notifications.logNotificationInternal, {
            parentLinkId: link._id,
            type: "daily_report",
            message,
          });
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[Daily Reports] Error for link ${link._id}:`, error);
        failed++;
      }
    }

    console.log(`[Daily Reports] Completed: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  },
});

// Main action: Send scheduled weekly reports
export const sendScheduledWeeklyReports = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday

    console.log(`[Weekly Reports] Running for day ${dayOfWeek}`);

    // Get parent links that should receive weekly reports today
    const parentLinks = await ctx.runQuery(
      internal.notifications.getParentLinksForWeeklyReport,
      { dayOfWeek }
    );

    console.log(`[Weekly Reports] Found ${parentLinks.length} parents to notify`);

    // Generate last 7 days
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    const startDate = dates[dates.length - 1];
    const endDate = dates[0];

    let sent = 0;
    let failed = 0;

    for (const link of parentLinks) {
      try {
        // Get player info
        const player = await ctx.runQuery(
          internal.notifications.getPlayerInfo,
          { playerId: link.playerId }
        );

        if (!player) continue;

        // Get week's stats
        const weekStats = await ctx.runQuery(
          internal.notifications.getWeeklyStatsInternal,
          { playerId: link.playerId, dates }
        );

        // Format message
        const message = formatWeeklyReport(player.name, startDate, endDate, weekStats);

        // Send to Telegram
        const success = await sendTelegramMessage(link.telegramChatId, message);

        if (success) {
          // Log notification
          await ctx.runMutation(internal.notifications.logNotificationInternal, {
            parentLinkId: link._id,
            type: "weekly_report",
            message,
          });
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[Weekly Reports] Error for link ${link._id}:`, error);
        failed++;
      }
    }

    console.log(`[Weekly Reports] Completed: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  },
});

// Action to send achievement notification (callable from frontend via mutation)
export const sendAchievementNotification = internalAction({
  args: {
    playerId: v.id("players"),
    achievementName: v.string(),
    achievementDescription: v.string(),
  },
  handler: async (ctx, args) => {
    // Get parent link
    const links = await ctx.runQuery(
      internal.notifications.getParentLinksForDailyReport,
      { currentHour: "00" } // Dummy - we'll filter differently
    );

    // Actually get the specific parent link
    const parentLinks = await ctx.runQuery(
      internal.notifications.getParentLinksForDailyReport,
      { currentHour: new Date().getUTCHours().toString().padStart(2, "0") }
    );

    // Find the link for this player
    // Note: This is a workaround since we can't query by playerId directly in internalQuery
    // In production, you'd want a dedicated query for this

    const player = await ctx.runQuery(
      internal.notifications.getPlayerInfo,
      { playerId: args.playerId }
    );

    if (!player) return { sent: false };

    const message = `🏆 <b>Achievement Unlocked!</b>

${player.name} just earned:

<b>${args.achievementName}</b>
${args.achievementDescription}

Congratulations! 🎉`;

    // We need to get the parent link for this specific player
    // This would require another internal query
    // For now, return early - this needs the proper query setup
    return { sent: false, reason: "Need to implement player-specific parent link query" };
  },
});
