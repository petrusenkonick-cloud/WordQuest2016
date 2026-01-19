import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  calculateWizardLevel,
  sumStars,
  countCompleted,
  now,
} from "./shared/progressUtils";

// Life Skills Islands Data
const LIFE_SKILLS_ISLANDS = [
  { id: 1, name: "Critical Thinking Island", chapters: ["ct_ch1", "ct_ch2", "ct_ch3"] },
  { id: 2, name: "Emotion Island", chapters: ["ei_ch1", "ei_ch2", "ei_ch3"] },
  { id: 3, name: "AI Island", chapters: ["ai_ch1", "ai_ch2", "ai_ch3"] },
  { id: 4, name: "Finance Island", chapters: ["fl_ch1", "fl_ch2", "fl_ch3"] },
];

// Chapter lessons count
const CHAPTER_LESSONS: Record<string, number> = {
  "ct_ch1": 3, "ct_ch2": 2, "ct_ch3": 2,
  "ei_ch1": 3, "ei_ch2": 2, "ei_ch3": 2,
  "ai_ch1": 3, "ai_ch2": 2, "ai_ch3": 2,
  "fl_ch1": 3, "fl_ch2": 2, "fl_ch3": 2,
};

// Initialize life skills progress for a player
export const initializeLifeSkills = mutation({
  args: {
    playerId: v.id("players"),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, { playerId, callerClerkId }) => {
    // SECURITY: Verify caller owns this player account
    if (callerClerkId) {
      const player = await ctx.db.get(playerId);
      if (player && player.clerkId !== callerClerkId) {
        console.error(`SECURITY: initializeLifeSkills IDOR attempt - caller ${callerClerkId} tried to access player ${playerId}`);
        return { error: "Unauthorized" };
      }
    }

    // Check if already initialized
    const existing = await ctx.db
      .query("lifeSkillsWizard")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .first();

    if (existing) return { alreadyInitialized: true };

    // Create wizard profile
    await ctx.db.insert("lifeSkillsWizard", {
      playerId,
      wizardLevel: "apprentice",
      totalChaptersCompleted: 0,
      totalBossesDefeated: 0,
      totalStars: 0,
      currentIsland: 1,
      currentChapter: "ct_ch1",
      createdAt: now(),
    });

    // Initialize first island chapters (first chapter unlocked)
    for (const island of LIFE_SKILLS_ISLANDS) {
      for (let i = 0; i < island.chapters.length; i++) {
        const chapterId = island.chapters[i];
        await ctx.db.insert("lifeSkillsProgress", {
          playerId,
          chapterId,
          islandId: island.id,
          isUnlocked: island.id === 1 && i === 0, // Only first chapter of first island is unlocked
          isCompleted: false,
          lessonsCompleted: 0,
          totalLessons: CHAPTER_LESSONS[chapterId] || 3,
          starsEarned: 0,
          bossDefeated: false,
        });
      }
    }

    return { initialized: true };
  },
});

// Get life skills progress for a player
export const getLifeSkillsProgress = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const wizard = await ctx.db
      .query("lifeSkillsWizard")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .first();

    const chapters = await ctx.db
      .query("lifeSkillsProgress")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .collect();

    const lessons = await ctx.db
      .query("lifeSkillsLessons")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .collect();

    return {
      wizard,
      chapters,
      lessons,
    };
  },
});

// Get chapter progress
export const getChapterProgress = query({
  args: { playerId: v.id("players"), chapterId: v.string() },
  handler: async (ctx, { playerId, chapterId }) => {
    const chapter = await ctx.db
      .query("lifeSkillsProgress")
      .withIndex("by_player_chapter", (q) =>
        q.eq("playerId", playerId).eq("chapterId", chapterId)
      )
      .first();

    const lessons = await ctx.db
      .query("lifeSkillsLessons")
      .withIndex("by_player_chapter", (q) =>
        q.eq("playerId", playerId).eq("chapterId", chapterId)
      )
      .collect();

    return { chapter, lessons };
  },
});

// Complete a lesson
export const completeLesson = mutation({
  args: {
    playerId: v.id("players"),
    chapterId: v.string(),
    lessonId: v.string(),
    stars: v.number(),
    score: v.number(),
    correctAnswers: v.number(),
    totalQuestions: v.number(),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, { playerId, chapterId, lessonId, stars, score, correctAnswers, totalQuestions, callerClerkId }) => {
    // SECURITY: Verify caller owns this player account
    if (callerClerkId) {
      const player = await ctx.db.get(playerId);
      if (player && player.clerkId !== callerClerkId) {
        console.error(`SECURITY: completeLesson IDOR attempt - caller ${callerClerkId} tried to access player ${playerId}`);
        return { success: false, error: "Unauthorized" };
      }
    }

    // Check if lesson already exists
    const existingLesson = await ctx.db
      .query("lifeSkillsLessons")
      .withIndex("by_player_lesson", (q) =>
        q.eq("playerId", playerId).eq("lessonId", lessonId)
      )
      .first();

    if (existingLesson) {
      // Update if better score
      if (score > existingLesson.bestScore) {
        await ctx.db.patch(existingLesson._id, {
          starsEarned: Math.max(existingLesson.starsEarned, stars),
          bestScore: score,
          attempts: existingLesson.attempts + 1,
          correctAnswers: Math.max(existingLesson.correctAnswers, correctAnswers),
          completedAt: now(),
        });
      }
    } else {
      // Create new lesson record
      await ctx.db.insert("lifeSkillsLessons", {
        playerId,
        chapterId,
        lessonId,
        isCompleted: true,
        starsEarned: stars,
        bestScore: score,
        attempts: 1,
        correctAnswers,
        totalQuestions,
        completedAt: now(),
      });
    }

    // Update chapter progress
    const chapterLessons = await ctx.db
      .query("lifeSkillsLessons")
      .withIndex("by_player_chapter", (q) =>
        q.eq("playerId", playerId).eq("chapterId", chapterId)
      )
      .collect();

    const chapter = await ctx.db
      .query("lifeSkillsProgress")
      .withIndex("by_player_chapter", (q) =>
        q.eq("playerId", playerId).eq("chapterId", chapterId)
      )
      .first();

    if (chapter) {
      const lessonsCompleted = countCompleted(chapterLessons);
      const totalChapterStars = sumStars(chapterLessons);

      await ctx.db.patch(chapter._id, {
        lessonsCompleted,
        starsEarned: totalChapterStars,
      });
    }

    return { success: true };
  },
});

// Complete boss battle
export const completeBossBattle = mutation({
  args: {
    playerId: v.id("players"),
    chapterId: v.string(),
    victory: v.boolean(),
    callerClerkId: v.optional(v.string()), // SECURITY: verify ownership
  },
  handler: async (ctx, { playerId, chapterId, victory, callerClerkId }) => {
    // SECURITY: Verify caller owns this player account
    if (callerClerkId) {
      const player = await ctx.db.get(playerId);
      if (player && player.clerkId !== callerClerkId) {
        console.error(`SECURITY: completeBossBattle IDOR attempt - caller ${callerClerkId} tried to access player ${playerId}`);
        return { success: false, error: "Unauthorized" };
      }
    }

    if (!victory) return { success: true, victory: false };

    // Update chapter
    const chapter = await ctx.db
      .query("lifeSkillsProgress")
      .withIndex("by_player_chapter", (q) =>
        q.eq("playerId", playerId).eq("chapterId", chapterId)
      )
      .first();

    if (!chapter) return { success: false, error: "Chapter not found" };

    await ctx.db.patch(chapter._id, {
      isCompleted: true,
      bossDefeated: true,
      completedAt: now(),
    });

    // Unlock next chapter
    const islandId = chapter.islandId;
    const island = LIFE_SKILLS_ISLANDS.find(i => i.id === islandId);
    if (island) {
      const chapterIndex = island.chapters.indexOf(chapterId);
      let nextChapterId: string | null = null;

      if (chapterIndex < island.chapters.length - 1) {
        // Next chapter in same island
        nextChapterId = island.chapters[chapterIndex + 1];
      } else {
        // First chapter of next island
        const nextIsland = LIFE_SKILLS_ISLANDS.find(i => i.id === islandId + 1);
        if (nextIsland) {
          nextChapterId = nextIsland.chapters[0];
        }
      }

      if (nextChapterId) {
        const nextChapter = await ctx.db
          .query("lifeSkillsProgress")
          .withIndex("by_player_chapter", (q) =>
            q.eq("playerId", playerId).eq("chapterId", nextChapterId!)
          )
          .first();

        if (nextChapter && !nextChapter.isUnlocked) {
          await ctx.db.patch(nextChapter._id, {
            isUnlocked: true,
            unlockedAt: now(),
          });
        }
      }
    }

    // Update wizard profile
    const allChapters = await ctx.db
      .query("lifeSkillsProgress")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .collect();

    const completedCount = countCompleted(allChapters);
    const bossCount = allChapters.filter(c => c.bossDefeated).length;
    const totalStars = sumStars(allChapters);
    const wizardLevel = calculateWizardLevel(completedCount).level;

    const wizard = await ctx.db
      .query("lifeSkillsWizard")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .first();

    if (wizard) {
      // Determine current island/chapter
      const nextUnlocked = allChapters.find(c => c.isUnlocked && !c.isCompleted);
      const currentIsland = nextUnlocked ? nextUnlocked.islandId : 4;
      const currentChapter = nextUnlocked ? nextUnlocked.chapterId : "fl_ch3";

      await ctx.db.patch(wizard._id, {
        wizardLevel,
        totalChaptersCompleted: completedCount,
        totalBossesDefeated: bossCount,
        totalStars,
        currentIsland,
        currentChapter,
        lastPlayedAt: now(),
      });
    }

    return {
      success: true,
      victory: true,
      wizardLevel,
      chaptersCompleted: completedCount,
    };
  },
});

// Get island progress
export const getIslandProgress = query({
  args: { playerId: v.id("players"), islandId: v.number() },
  handler: async (ctx, { playerId, islandId }) => {
    const chapters = await ctx.db
      .query("lifeSkillsProgress")
      .withIndex("by_player_island", (q) =>
        q.eq("playerId", playerId).eq("islandId", islandId)
      )
      .collect();

    const completedCount = countCompleted(chapters);
    const totalStars = sumStars(chapters);
    const allBossesDefeated = chapters.every(c => c.bossDefeated || !CHAPTER_LESSONS[c.chapterId]);

    return {
      chapters,
      completedCount,
      totalChapters: chapters.length,
      totalStars,
      maxStars: chapters.length * 9, // 3 lessons * 3 stars each
      isComplete: completedCount === chapters.length,
      allBossesDefeated,
    };
  },
});
