import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Lazy initialization to avoid build-time errors
function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}

// Send message to Telegram
async function sendTelegramMessage(chatId: string, text: string, parseMode = "HTML") {
  if (!TELEGRAM_BOT_TOKEN) return;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
}

// Handle Telegram webhook
export async function POST(request: NextRequest) {
  try {
    const update = await request.json();

    // Handle message
    if (update.message) {
      const chatId = update.message.chat.id.toString();
      const text = update.message.text || "";
      const username = update.message.from?.username;

      // /start command
      if (text === "/start") {
        await sendTelegramMessage(
          chatId,
          `<b>WordQuest - Parent Notifications</b>

Hello! I am the bot for tracking your child's learning progress.

<b>Your Chat ID:</b> <code>${chatId}</code>

Copy this ID and enter it in your child's app:
Settings - Parent Notifications - Paste ID

After that you will receive:
- Daily progress reports
- Achievement notifications
- Weak topic alerts`
        );
        return NextResponse.json({ ok: true });
      }

      // /link command
      if (text.startsWith("/link")) {
        const code = text.split(" ")[1]?.trim();

        if (!code || code.length !== 6) {
          await sendTelegramMessage(
            chatId,
            "❌ Please provide a 6-digit code: <code>/link 123456</code>"
          );
          return NextResponse.json({ ok: true });
        }

        const result = await getConvexClient().mutation(api.parents.linkParent, {
          code,
          telegramChatId: chatId,
          telegramUsername: username,
        });

        if (result.success) {
          await sendTelegramMessage(
            chatId,
            `✅ <b>Successfully linked!</b>

You are now connected to <b>${result.playerName}</b>'s account.

You will receive:
• Daily progress reports at 6:00 PM
• Weekly summaries on Sundays
• Achievement notifications
• Alerts if your child hasn't played for 3+ days

Use /settings to customize notifications.`
          );
        } else {
          await sendTelegramMessage(
            chatId,
            `❌ ${result.error || "Failed to link. Please try again."}`
          );
        }
        return NextResponse.json({ ok: true });
      }

      // /stats command - today's progress
      if (text === "/stats") {
        const player = await getConvexClient().query(api.parents.getPlayerByTelegram, {
          telegramChatId: chatId,
        });

        if (!player) {
          await sendTelegramMessage(
            chatId,
            "❌ Not linked to any child. Use /link [code] first."
          );
          return NextResponse.json({ ok: true });
        }

        const today = new Date().toISOString().split("T")[0];
        const stats = await getConvexClient().query(api.parents.getDailyStats, {
          playerId: player._id,
          date: today,
        });

        if (!stats) {
          await sendTelegramMessage(
            chatId,
            `📊 <b>${player.name}'s Progress Today</b>

😴 No activity yet today.

Encourage ${player.name} to practice!`
          );
        } else {
          const accuracy =
            stats.questionsAnswered > 0
              ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
              : 0;

          await sendTelegramMessage(
            chatId,
            `📊 <b>${player.name}'s Progress Today</b>

📝 Questions: ${stats.questionsAnswered}
✅ Correct: ${stats.correctAnswers} (${accuracy}%)
⭐ XP Earned: ${stats.xpEarned}
⏱ Time: ${stats.timeSpentMinutes} minutes

📚 Topics studied: ${stats.topicsStudied.length > 0 ? stats.topicsStudied.join(", ") : "None"}
${stats.weakTopics.length > 0 ? `\n⚠️ Needs practice: ${stats.weakTopics.join(", ")}` : ""}
${stats.achievementsUnlocked.length > 0 ? `\n🏆 Achievements: ${stats.achievementsUnlocked.join(", ")}` : ""}`
          );
        }
        return NextResponse.json({ ok: true });
      }

      // /week command - weekly stats
      if (text === "/week") {
        const player = await getConvexClient().query(api.parents.getPlayerByTelegram, {
          telegramChatId: chatId,
        });

        if (!player) {
          await sendTelegramMessage(
            chatId,
            "❌ Not linked to any child. Use /link [code] first."
          );
          return NextResponse.json({ ok: true });
        }

        const weekStats = await getConvexClient().query(api.parents.getWeeklyStats, {
          playerId: player._id,
        });

        if (weekStats.length === 0) {
          await sendTelegramMessage(
            chatId,
            `📅 <b>${player.name}'s Weekly Summary</b>

No activity recorded this week.`
          );
        } else {
          const totalQuestions = weekStats.reduce((a, b) => a + b.questionsAnswered, 0);
          const totalCorrect = weekStats.reduce((a, b) => a + b.correctAnswers, 0);
          const totalXP = weekStats.reduce((a, b) => a + b.xpEarned, 0);
          const totalTime = weekStats.reduce((a, b) => a + b.timeSpentMinutes, 0);
          const daysActive = weekStats.length;
          const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

          const allTopics = [...new Set(weekStats.flatMap((s) => s.topicsStudied))];
          const allWeak = [...new Set(weekStats.flatMap((s) => s.weakTopics))];

          await sendTelegramMessage(
            chatId,
            `📅 <b>${player.name}'s Weekly Summary</b>

📆 Days active: ${daysActive}/7
📝 Total questions: ${totalQuestions}
✅ Accuracy: ${accuracy}%
⭐ XP earned: ${totalXP}
⏱ Total time: ${totalTime} minutes

📚 Topics covered: ${allTopics.length > 0 ? allTopics.slice(0, 5).join(", ") : "None"}
${allWeak.length > 0 ? `\n⚠️ Needs more practice: ${allWeak.slice(0, 3).join(", ")}` : ""}

${daysActive >= 5 ? "🌟 Great consistency!" : daysActive >= 3 ? "👍 Good effort!" : "💪 Encourage more practice!"}`
          );
        }
        return NextResponse.json({ ok: true });
      }

      // /settings command
      if (text === "/settings") {
        await sendTelegramMessage(
          chatId,
          `⚙️ <b>Notification Settings</b>

/notifications on - Enable all notifications
/notifications off - Disable notifications
/dailytime HH:MM - Set daily report time
/unlink - Remove connection

Current settings can be viewed with /status`
        );
        return NextResponse.json({ ok: true });
      }

      // /notifications command
      if (text.startsWith("/notifications")) {
        const setting = text.split(" ")[1]?.toLowerCase();

        if (setting === "on" || setting === "off") {
          await getConvexClient().mutation(api.parents.updateNotificationSettings, {
            telegramChatId: chatId,
            notificationsEnabled: setting === "on",
          });

          await sendTelegramMessage(
            chatId,
            `✅ Notifications ${setting === "on" ? "enabled" : "disabled"}`
          );
        } else {
          await sendTelegramMessage(
            chatId,
            "Usage: /notifications on OR /notifications off"
          );
        }
        return NextResponse.json({ ok: true });
      }

      // /help command
      if (text === "/help") {
        await sendTelegramMessage(
          chatId,
          `📚 <b>WordQuest Parent Bot Commands</b>

<b>Account:</b>
/link [code] - Connect to child's account
/unlink - Remove connection
/status - View connection status

<b>Progress:</b>
/stats - Today's learning progress
/week - Weekly summary
/topics - Topics practiced

<b>Settings:</b>
/notifications on/off - Toggle notifications
/dailytime HH:MM - Set daily report time
/settings - All settings

<b>Support:</b>
/help - This message
/about - About WordQuest`
        );
        return NextResponse.json({ ok: true });
      }

      // /unlink command
      if (text === "/unlink") {
        const player = await getConvexClient().query(api.parents.getPlayerByTelegram, {
          telegramChatId: chatId,
        });

        if (player) {
          await getConvexClient().mutation(api.parents.unlinkParent, {
            playerId: player._id,
          });
          await sendTelegramMessage(
            chatId,
            "✅ Successfully unlinked. Use /link [code] to connect again."
          );
        } else {
          await sendTelegramMessage(chatId, "❌ Not currently linked to any account.");
        }
        return NextResponse.json({ ok: true });
      }

      // Unknown command
      if (text.startsWith("/")) {
        await sendTelegramMessage(
          chatId,
          "❓ Unknown command. Use /help to see available commands."
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// For Telegram webhook verification
export async function GET() {
  return NextResponse.json({ status: "Telegram webhook active" });
}
