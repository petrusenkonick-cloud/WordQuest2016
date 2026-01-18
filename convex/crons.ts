import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour at :00 to check for daily reports to send
// Parents set their preferred time (e.g., "18:00")
// The job runs every hour and sends to parents whose time matches
crons.hourly(
  "send-daily-reports",
  { minuteUTC: 0 },
  internal.notifications.sendScheduledDailyReports
);

// Run daily at 10:00 UTC to check for weekly reports
// Weekly reports are sent on the day the parent configured (default: Sunday)
crons.daily(
  "send-weekly-reports",
  { hourUTC: 10, minuteUTC: 0 },
  internal.notifications.sendScheduledWeeklyReports
);

// ========== DASHBOARD & LEADERBOARD CRONS ==========

// Update leaderboards every hour
// Recalculates rankings and caches them for fast retrieval
crons.hourly(
  "update-leaderboards",
  { minuteUTC: 15 },
  internal.leaderboards.updateLeaderboards
);

// Aggregate platform statistics daily at 2:00 UTC
// Calculates overall platform metrics and age group stats
crons.daily(
  "aggregate-platform-stats",
  { hourUTC: 2, minuteUTC: 0 },
  internal.dashboard.aggregatePlatformStats
);

// Distribute daily leaderboard rewards at 23:55 UTC
// Awards prizes to top 10 players of the day
crons.daily(
  "daily-leaderboard-rewards",
  { hourUTC: 23, minuteUTC: 55 },
  internal.leaderboards.distributeRewards,
  { type: "daily" }
);

// Distribute weekly leaderboard rewards on Sunday at 23:55 UTC
crons.weekly(
  "weekly-leaderboard-rewards",
  { dayOfWeek: "sunday", hourUTC: 23, minuteUTC: 55 },
  internal.leaderboards.distributeRewards,
  { type: "weekly" }
);

// ========== SCORE RESETS ==========

// Reset weekly scores every Monday at 0:00 UTC
// Clears weeklyScore for all players so weekly leaderboard starts fresh
crons.weekly(
  "reset-weekly-scores",
  { dayOfWeek: "monday", hourUTC: 0, minuteUTC: 0 },
  internal.leaderboards.resetWeeklyScores
);

// Reset monthly scores on the 1st of each month at 0:00 UTC
// Clears monthlyScore for all players so monthly leaderboard starts fresh
crons.monthly(
  "reset-monthly-scores",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.leaderboards.resetMonthlyScores
);

// ========== WEEKLY PRACTICE QUESTS ==========

// Generate weekly practice quests every Monday at 6:00 UTC
// Creates personalized practice quests based on each player's weak topics
crons.weekly(
  "generate-weekly-practice-quests",
  { dayOfWeek: "monday", hourUTC: 6, minuteUTC: 0 },
  internal.weeklyQuests.generateAllPlayersWeeklyQuests
);

export default crons;
