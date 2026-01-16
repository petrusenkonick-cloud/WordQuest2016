import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Spaced Repetition System (SRS) using SM-2 Algorithm
 *
 * The SM-2 algorithm is a proven method for optimal learning intervals:
 * - New items start with interval of 1 day
 * - Successful reviews increase interval exponentially
 * - Failed reviews reset the interval
 * - Ease factor adjusts based on answer quality
 */

// ========== SM-2 ALGORITHM CONSTANTS ==========

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 3.0;

// Quality ratings (0-5 scale)
// 0 - Complete blackout
// 1 - Wrong answer, but recognized correct one
// 2 - Wrong answer, but correct seemed easy to recall
// 3 - Correct answer with serious difficulty
// 4 - Correct answer after hesitation
// 5 - Perfect response

/**
 * Calculate the quality rating based on performance
 */
function calculateQuality(
  isCorrect: boolean,
  hintsUsed: number,
  responseTimeMs?: number,
  expectedTimeMs?: number
): number {
  if (!isCorrect) {
    return hintsUsed > 0 ? 1 : 0; // Saw hints vs complete blackout
  }

  // Correct answer
  if (hintsUsed > 1) return 3; // Multiple hints needed
  if (hintsUsed === 1) return 4; // One hint needed

  // No hints - check response time
  if (responseTimeMs && expectedTimeMs) {
    if (responseTimeMs < expectedTimeMs * 0.5) return 5; // Very fast
    if (responseTimeMs > expectedTimeMs * 2) return 3; // Very slow
  }

  return 5; // Default to perfect if no time data
}

/**
 * SM-2 Algorithm Implementation
 */
function sm2Algorithm(
  repetitions: number,
  interval: number,
  easeFactor: number,
  quality: number
): { newInterval: number; newRepetitions: number; newEaseFactor: number } {
  // Calculate new ease factor
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEaseFactor));

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Failed - reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Success - increase interval
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  return { newInterval, newRepetitions, newEaseFactor };
}

/**
 * Calculate mastery level (1-5 stars) based on SRS data
 */
function calculateMasteryLevel(
  repetitions: number,
  easeFactor: number,
  accuracy: number
): number {
  // Combine factors
  const repetitionScore = Math.min(repetitions / 10, 1) * 2; // 0-2 points
  const easeScore = ((easeFactor - MIN_EASE_FACTOR) / (MAX_EASE_FACTOR - MIN_EASE_FACTOR)) * 1.5; // 0-1.5 points
  const accuracyScore = (accuracy / 100) * 1.5; // 0-1.5 points

  const totalScore = repetitionScore + easeScore + accuracyScore;

  // Convert to 1-5 scale
  if (totalScore >= 4) return 5;
  if (totalScore >= 3) return 4;
  if (totalScore >= 2) return 3;
  if (totalScore >= 1) return 2;
  return 1;
}

// ========== MUTATIONS ==========

/**
 * Record a review/practice attempt and update SRS data
 */
export const recordReview = mutation({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
    subject: v.string(),
    isCorrect: v.boolean(),
    hintsUsed: v.optional(v.number()),
    responseTimeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    // Get existing SRS data
    const existing = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .first();

    // Calculate quality rating
    const quality = calculateQuality(
      args.isCorrect,
      args.hintsUsed || 0,
      args.responseTimeMs,
      10000 // Expected 10 seconds
    );

    if (existing) {
      // Apply SM-2 algorithm
      const { newInterval, newRepetitions, newEaseFactor } = sm2Algorithm(
        existing.repetitions,
        existing.interval,
        existing.easeFactor,
        quality
      );

      // Calculate next review date
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);
      const nextReviewDate = nextReview.toISOString().split("T")[0];

      // Calculate accuracy
      const newTotalReviews = existing.totalReviews + 1;
      const newCorrectReviews = existing.correctReviews + (args.isCorrect ? 1 : 0);
      const accuracy = Math.round((newCorrectReviews / newTotalReviews) * 100);

      // Calculate mastery level
      const level = calculateMasteryLevel(newRepetitions, newEaseFactor, accuracy);

      // Update record
      await ctx.db.patch(existing._id, {
        level,
        easeFactor: newEaseFactor,
        interval: newInterval,
        nextReviewDate,
        lastReviewDate: today,
        repetitions: newRepetitions,
        totalReviews: newTotalReviews,
        correctReviews: newCorrectReviews,
        lastQuality: quality,
      });

      return {
        isNew: false,
        level,
        interval: newInterval,
        nextReviewDate,
        quality,
        mastered: level >= 4,
      };
    } else {
      // Create new SRS entry
      const initialInterval = args.isCorrect ? 1 : 1;
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + initialInterval);
      const nextReviewDate = nextReview.toISOString().split("T")[0];

      await ctx.db.insert("spacedRepetition", {
        playerId: args.playerId,
        topic: args.topic,
        subject: args.subject,
        level: 1,
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: initialInterval,
        nextReviewDate,
        lastReviewDate: today,
        repetitions: args.isCorrect ? 1 : 0,
        totalReviews: 1,
        correctReviews: args.isCorrect ? 1 : 0,
        lastQuality: quality,
      });

      return {
        isNew: true,
        level: 1,
        interval: initialInterval,
        nextReviewDate,
        quality,
        mastered: false,
      };
    }
  },
});

/**
 * Batch record multiple reviews (for efficiency)
 */
export const recordBatchReviews = mutation({
  args: {
    playerId: v.id("players"),
    reviews: v.array(
      v.object({
        topic: v.string(),
        subject: v.string(),
        isCorrect: v.boolean(),
        hintsUsed: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    const today = new Date().toISOString().split("T")[0];

    for (const review of args.reviews) {
      const existing = await ctx.db
        .query("spacedRepetition")
        .withIndex("by_player_topic", (q) =>
          q.eq("playerId", args.playerId).eq("topic", review.topic)
        )
        .first();

      const quality = calculateQuality(review.isCorrect, review.hintsUsed || 0);

      if (existing) {
        const { newInterval, newRepetitions, newEaseFactor } = sm2Algorithm(
          existing.repetitions,
          existing.interval,
          existing.easeFactor,
          quality
        );

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);
        const nextReviewDate = nextReview.toISOString().split("T")[0];

        const newTotalReviews = existing.totalReviews + 1;
        const newCorrectReviews = existing.correctReviews + (review.isCorrect ? 1 : 0);
        const accuracy = Math.round((newCorrectReviews / newTotalReviews) * 100);
        const level = calculateMasteryLevel(newRepetitions, newEaseFactor, accuracy);

        await ctx.db.patch(existing._id, {
          level,
          easeFactor: newEaseFactor,
          interval: newInterval,
          nextReviewDate,
          lastReviewDate: today,
          repetitions: newRepetitions,
          totalReviews: newTotalReviews,
          correctReviews: newCorrectReviews,
          lastQuality: quality,
        });

        results.push({ topic: review.topic, level, nextReviewDate });
      } else {
        const initialInterval = review.isCorrect ? 1 : 1;
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + initialInterval);
        const nextReviewDate = nextReview.toISOString().split("T")[0];

        await ctx.db.insert("spacedRepetition", {
          playerId: args.playerId,
          topic: review.topic,
          subject: review.subject,
          level: 1,
          easeFactor: DEFAULT_EASE_FACTOR,
          interval: initialInterval,
          nextReviewDate,
          lastReviewDate: today,
          repetitions: review.isCorrect ? 1 : 0,
          totalReviews: 1,
          correctReviews: review.isCorrect ? 1 : 0,
          lastQuality: quality,
        });

        results.push({ topic: review.topic, level: 1, nextReviewDate });
      }
    }

    return results;
  },
});

// ========== QUERIES ==========

/**
 * Get topics due for review today
 */
export const getTopicsDueForReview = query({
  args: {
    playerId: v.id("players"),
    subject: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    const limit = args.limit || 20;

    let srsRecords = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Filter by due date
    srsRecords = srsRecords.filter((srs) => srs.nextReviewDate <= today);

    // Filter by subject if specified
    if (args.subject) {
      srsRecords = srsRecords.filter((srs) => srs.subject === args.subject);
    }

    // Sort by priority (overdue items first, then by level)
    srsRecords.sort((a, b) => {
      const aOverdue = Math.max(0, (new Date().getTime() - new Date(a.nextReviewDate).getTime()) / (1000 * 60 * 60 * 24));
      const bOverdue = Math.max(0, (new Date().getTime() - new Date(b.nextReviewDate).getTime()) / (1000 * 60 * 60 * 24));

      if (aOverdue !== bOverdue) return bOverdue - aOverdue; // More overdue first
      return a.level - b.level; // Lower level (less mastered) first
    });

    return srsRecords.slice(0, limit).map((srs) => ({
      topic: srs.topic,
      subject: srs.subject,
      level: srs.level,
      daysOverdue: Math.max(
        0,
        Math.floor((new Date().getTime() - new Date(srs.nextReviewDate).getTime()) / (1000 * 60 * 60 * 24))
      ),
      lastReviewDate: srs.lastReviewDate,
      totalReviews: srs.totalReviews,
      accuracy: Math.round((srs.correctReviews / srs.totalReviews) * 100),
    }));
  },
});

/**
 * Get all SRS data for a player (for dashboard)
 */
export const getPlayerSRSStats = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    const srsRecords = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Calculate stats
    const totalTopics = srsRecords.length;
    const masteredTopics = srsRecords.filter((srs) => srs.level >= 4).length;
    const dueToday = srsRecords.filter((srs) => srs.nextReviewDate <= today).length;

    // Group by mastery level
    const byLevel = {
      beginner: srsRecords.filter((srs) => srs.level === 1).length,
      learning: srsRecords.filter((srs) => srs.level === 2).length,
      familiar: srsRecords.filter((srs) => srs.level === 3).length,
      proficient: srsRecords.filter((srs) => srs.level === 4).length,
      mastered: srsRecords.filter((srs) => srs.level === 5).length,
    };

    // Group by subject
    const bySubject: Record<string, { total: number; mastered: number; due: number }> = {};
    for (const srs of srsRecords) {
      if (!bySubject[srs.subject]) {
        bySubject[srs.subject] = { total: 0, mastered: 0, due: 0 };
      }
      bySubject[srs.subject].total++;
      if (srs.level >= 4) bySubject[srs.subject].mastered++;
      if (srs.nextReviewDate <= today) bySubject[srs.subject].due++;
    }

    // Calculate overall accuracy
    const totalReviews = srsRecords.reduce((sum, srs) => sum + srs.totalReviews, 0);
    const correctReviews = srsRecords.reduce((sum, srs) => sum + srs.correctReviews, 0);
    const overallAccuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

    return {
      totalTopics,
      masteredTopics,
      dueToday,
      byLevel,
      bySubject,
      overallAccuracy,
      totalReviews,
      masteryPercentage: totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0,
    };
  },
});

/**
 * Get forecast of upcoming reviews
 */
export const getReviewForecast = query({
  args: {
    playerId: v.id("players"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const today = new Date();

    const srsRecords = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    // Create forecast
    const forecast: Array<{ date: string; count: number; topics: string[] }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dueTopics = srsRecords
        .filter((srs) => srs.nextReviewDate === dateStr)
        .map((srs) => srs.topic);

      forecast.push({
        date: dateStr,
        count: dueTopics.length,
        topics: dueTopics.slice(0, 5), // Limit topics shown
      });
    }

    return forecast;
  },
});

/**
 * Get topic mastery details
 */
export const getTopicMastery = query({
  args: {
    playerId: v.id("players"),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    const srsRecord = await ctx.db
      .query("spacedRepetition")
      .withIndex("by_player_topic", (q) =>
        q.eq("playerId", args.playerId).eq("topic", args.topic)
      )
      .first();

    if (!srsRecord) {
      return null;
    }

    const accuracy = Math.round((srsRecord.correctReviews / srsRecord.totalReviews) * 100);

    return {
      topic: srsRecord.topic,
      subject: srsRecord.subject,
      level: srsRecord.level,
      levelName: ["", "Beginner", "Learning", "Familiar", "Proficient", "Mastered"][srsRecord.level],
      accuracy,
      totalReviews: srsRecord.totalReviews,
      correctReviews: srsRecord.correctReviews,
      currentInterval: srsRecord.interval,
      nextReviewDate: srsRecord.nextReviewDate,
      lastReviewDate: srsRecord.lastReviewDate,
      easeFactor: srsRecord.easeFactor,
      repetitions: srsRecord.repetitions,
    };
  },
});
