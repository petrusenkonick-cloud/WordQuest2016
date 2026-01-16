import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Chapter definitions
const CHAPTERS = [
  { id: 1, name: "The Beginning", topic: "basics", lessons: 5 },
  { id: 2, name: "The Hall of Nouns", topic: "nouns", lessons: 6 },
  { id: 3, name: "Verb Valley", topic: "verbs", lessons: 7 },
  { id: 4, name: "Adjective Alley", topic: "adjectives", lessons: 6 },
  { id: 5, name: "Adverb Avenue", topic: "adverbs", lessons: 5 },
  { id: 6, name: "Pronoun Palace", topic: "pronouns", lessons: 6 },
  { id: 7, name: "Preposition Peak", topic: "prepositions", lessons: 5 },
  { id: 8, name: "Conjunction Castle", topic: "conjunctions", lessons: 5 },
  { id: 9, name: "Sentence Structure Hall", topic: "sentences", lessons: 8 },
  { id: 10, name: "Tense Tower", topic: "tenses", lessons: 8 },
  { id: 11, name: "Vocabulary Vault", topic: "vocabulary", lessons: 10 },
  { id: 12, name: "Master's Chamber", topic: "advanced", lessons: 10 },
];

// Get wizard title based on level
function getWizardTitle(level: number): string {
  if (level <= 5) return "Apprentice";
  if (level <= 10) return "Junior Wizard";
  if (level <= 15) return "Wizard";
  if (level <= 20) return "Senior Wizard";
  return "Master Wizard";
}

// Initialize wizard profile for new player
export const initializeWizardProfile = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("wizardProfile")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .first();

    if (existing) return existing._id;

    // Create wizard profile
    const profileId = await ctx.db.insert("wizardProfile", {
      playerId,
      wizardTitle: "Apprentice",
      academyLevel: 1,
      currentChapter: 1,
      totalSpellsLearned: 0,
      createdAt: new Date().toISOString(),
    });

    // Initialize first chapter
    await ctx.db.insert("questChapters", {
      playerId,
      chapterId: 1,
      chapterName: CHAPTERS[0].name,
      isUnlocked: true,
      isCompleted: false,
      starsEarned: 0,
      lessonsCompleted: 0,
      totalLessons: CHAPTERS[0].lessons,
      bossDefeated: false,
      unlockedAt: new Date().toISOString(),
    });

    // Create initial quests for chapter 1
    for (let i = 1; i <= CHAPTERS[0].lessons; i++) {
      await ctx.db.insert("quests", {
        playerId,
        chapterId: 1,
        questId: `ch1_q${i}`,
        questName: i === CHAPTERS[0].lessons ? "Chapter Boss: Word Guardian" : `Lesson ${i}: Basic Vocabulary`,
        questType: i === CHAPTERS[0].lessons ? "boss" : "lesson",
        topic: "basics",
        isUnlocked: i === 1, // Only first quest unlocked
        isCompleted: false,
        starsEarned: 0,
        bestScore: 0,
        attempts: 0,
      });
    }

    return profileId;
  },
});

// Get wizard profile
export const getWizardProfile = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    return await ctx.db
      .query("wizardProfile")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .first();
  },
});

// Get all chapters for player
export const getChapters = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const chapters = await ctx.db
      .query("questChapters")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .collect();

    // Return chapters with static data merged
    return CHAPTERS.map((ch) => {
      const progress = chapters.find((c) => c.chapterId === ch.id);
      return {
        ...ch,
        isUnlocked: progress?.isUnlocked ?? ch.id === 1,
        isCompleted: progress?.isCompleted ?? false,
        starsEarned: progress?.starsEarned ?? 0,
        lessonsCompleted: progress?.lessonsCompleted ?? 0,
        bossDefeated: progress?.bossDefeated ?? false,
      };
    });
  },
});

// Get quests for a specific chapter
export const getChapterQuests = query({
  args: { playerId: v.id("players"), chapterId: v.number() },
  handler: async (ctx, { playerId, chapterId }) => {
    return await ctx.db
      .query("quests")
      .withIndex("by_player_chapter", (q) =>
        q.eq("playerId", playerId).eq("chapterId", chapterId)
      )
      .collect();
  },
});

// Complete a quest
export const completeQuest = mutation({
  args: {
    playerId: v.id("players"),
    questId: v.string(),
    score: v.number(),
    stars: v.number(),
  },
  handler: async (ctx, { playerId, questId, score, stars }) => {
    // Find the quest
    const quest = await ctx.db
      .query("quests")
      .withIndex("by_player_quest", (q) =>
        q.eq("playerId", playerId).eq("questId", questId)
      )
      .first();

    if (!quest) return { success: false, error: "Quest not found" };

    // Update quest
    await ctx.db.patch(quest._id, {
      isCompleted: true,
      starsEarned: Math.max(quest.starsEarned, stars),
      bestScore: Math.max(quest.bestScore, score),
      attempts: quest.attempts + 1,
      lastAttempt: new Date().toISOString(),
    });

    // Unlock next quest in chapter
    const nextQuestId = `ch${quest.chapterId}_q${parseInt(questId.split("_q")[1]) + 1}`;
    const nextQuest = await ctx.db
      .query("quests")
      .withIndex("by_player_quest", (q) =>
        q.eq("playerId", playerId).eq("questId", nextQuestId)
      )
      .first();

    if (nextQuest && !nextQuest.isUnlocked) {
      await ctx.db.patch(nextQuest._id, { isUnlocked: true });
    }

    // Check if chapter completed
    const chapterQuests = await ctx.db
      .query("quests")
      .withIndex("by_player_chapter", (q) =>
        q.eq("playerId", playerId).eq("chapterId", quest.chapterId)
      )
      .collect();

    const allCompleted = chapterQuests.every((q) =>
      q._id === quest._id ? true : q.isCompleted
    );

    if (allCompleted) {
      // Mark chapter as completed
      const chapter = await ctx.db
        .query("questChapters")
        .withIndex("by_player_chapter", (q) =>
          q.eq("playerId", playerId).eq("chapterId", quest.chapterId)
        )
        .first();

      if (chapter) {
        const totalStars = chapterQuests.reduce(
          (sum, q) => sum + (q._id === quest._id ? stars : q.starsEarned),
          0
        );
        await ctx.db.patch(chapter._id, {
          isCompleted: true,
          starsEarned: totalStars,
          lessonsCompleted: chapterQuests.length,
          bossDefeated: quest.questType === "boss",
          completedAt: new Date().toISOString(),
        });
      }

      // Unlock next chapter
      const nextChapterDef = CHAPTERS.find((c) => c.id === quest.chapterId + 1);
      if (nextChapterDef) {
        const existingNextChapter = await ctx.db
          .query("questChapters")
          .withIndex("by_player_chapter", (q) =>
            q.eq("playerId", playerId).eq("chapterId", nextChapterDef.id)
          )
          .first();

        if (!existingNextChapter) {
          await ctx.db.insert("questChapters", {
            playerId,
            chapterId: nextChapterDef.id,
            chapterName: nextChapterDef.name,
            isUnlocked: true,
            isCompleted: false,
            starsEarned: 0,
            lessonsCompleted: 0,
            totalLessons: nextChapterDef.lessons,
            bossDefeated: false,
            unlockedAt: new Date().toISOString(),
          });

          // Create quests for new chapter
          for (let i = 1; i <= nextChapterDef.lessons; i++) {
            await ctx.db.insert("quests", {
              playerId,
              chapterId: nextChapterDef.id,
              questId: `ch${nextChapterDef.id}_q${i}`,
              questName:
                i === nextChapterDef.lessons
                  ? `Chapter Boss: ${nextChapterDef.topic} Master`
                  : `Lesson ${i}: ${nextChapterDef.topic}`,
              questType: i === nextChapterDef.lessons ? "boss" : "lesson",
              topic: nextChapterDef.topic,
              isUnlocked: i === 1,
              isCompleted: false,
              starsEarned: 0,
              bestScore: 0,
              attempts: 0,
            });
          }
        }
      }

      // Update wizard profile
      const profile = await ctx.db
        .query("wizardProfile")
        .withIndex("by_player", (q) => q.eq("playerId", playerId))
        .first();

      if (profile) {
        const newLevel = profile.academyLevel + 1;
        await ctx.db.patch(profile._id, {
          academyLevel: newLevel,
          wizardTitle: getWizardTitle(newLevel),
          currentChapter: quest.chapterId + 1,
        });
      }
    }

    return { success: true, chapterCompleted: allCompleted };
  },
});

// Get daily quests
export const getDailyQuests = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const today = new Date().toISOString().split("T")[0];

    return await ctx.db
      .query("dailyQuests")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", playerId).eq("date", today)
      )
      .collect();
  },
});

// Generate daily quests
export const generateDailyQuests = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const today = new Date().toISOString().split("T")[0];

    // Check if already generated
    const existing = await ctx.db
      .query("dailyQuests")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", playerId).eq("date", today)
      )
      .first();

    if (existing) return { alreadyGenerated: true };

    // Generate daily quests
    const dailyQuestTypes = [
      {
        type: "morning_practice",
        name: "Morning Spell Practice",
        desc: "Answer 5 questions correctly",
        target: 5,
        reward: { diamonds: 10, xp: 50 },
      },
      {
        type: "homework",
        name: "Homework Hero",
        desc: "Scan and complete homework",
        target: 1,
        reward: { diamonds: 25, emeralds: 10, xp: 100 },
      },
      {
        type: "word_collector",
        name: "Word Collector",
        desc: "Learn 3 new words",
        target: 3,
        reward: { diamonds: 15, xp: 75 },
      },
      {
        type: "streak_keeper",
        name: "Streak Keeper",
        desc: "Play for 10 minutes",
        target: 10,
        reward: { emeralds: 5, xp: 50 },
      },
    ];

    for (const quest of dailyQuestTypes) {
      await ctx.db.insert("dailyQuests", {
        playerId,
        date: today,
        questType: quest.type,
        questName: quest.name,
        description: quest.desc,
        targetCount: quest.target,
        currentCount: 0,
        isCompleted: false,
        reward: quest.reward,
      });
    }

    return { generated: true };
  },
});

// Update daily quest progress
export const updateDailyQuestProgress = mutation({
  args: {
    playerId: v.id("players"),
    questType: v.string(),
    increment: v.number(),
  },
  handler: async (ctx, { playerId, questType, increment }) => {
    const today = new Date().toISOString().split("T")[0];

    const quest = await ctx.db
      .query("dailyQuests")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", playerId).eq("date", today)
      )
      .filter((q) => q.eq(q.field("questType"), questType))
      .first();

    if (!quest || quest.isCompleted) return { success: false };

    const newCount = Math.min(quest.currentCount + increment, quest.targetCount);
    const isNowComplete = newCount >= quest.targetCount;

    await ctx.db.patch(quest._id, {
      currentCount: newCount,
      isCompleted: isNowComplete,
      completedAt: isNowComplete ? new Date().toISOString() : undefined,
    });

    return {
      success: true,
      completed: isNowComplete,
      reward: isNowComplete ? quest.reward : null,
    };
  },
});

// Add word to spell book
export const addToSpellBook = mutation({
  args: {
    playerId: v.id("players"),
    word: v.string(),
    category: v.string(),
    definition: v.string(),
    exampleSentence: v.optional(v.string()),
  },
  handler: async (ctx, { playerId, word, category, definition, exampleSentence }) => {
    // Check if word already exists
    const existing = await ctx.db
      .query("spellBook")
      .withIndex("by_player_word", (q) =>
        q.eq("playerId", playerId).eq("word", word.toLowerCase())
      )
      .first();

    if (existing) {
      // Update mastery
      await ctx.db.patch(existing._id, {
        masteryLevel: Math.min(existing.masteryLevel + 10, 100),
        timesUsed: existing.timesUsed + 1,
      });
      return { alreadyExists: true, masteryLevel: existing.masteryLevel + 10 };
    }

    // Determine spell power (rarity)
    const spellPower = word.length > 8 ? 4 : word.length > 6 ? 3 : word.length > 4 ? 2 : 1;
    const isRare = Math.random() < 0.1; // 10% chance for rare

    await ctx.db.insert("spellBook", {
      playerId,
      word: word.toLowerCase(),
      category,
      definition,
      exampleSentence,
      spellPower: isRare ? spellPower + 1 : spellPower,
      isRare,
      learnedAt: new Date().toISOString(),
      masteryLevel: 10,
      timesUsed: 1,
    });

    // Update wizard profile
    const profile = await ctx.db
      .query("wizardProfile")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        totalSpellsLearned: profile.totalSpellsLearned + 1,
      });
    }

    return { added: true, isRare, spellPower };
  },
});

// Get spell book
export const getSpellBook = query({
  args: { playerId: v.id("players"), category: v.optional(v.string()) },
  handler: async (ctx, { playerId, category }) => {
    if (category) {
      return await ctx.db
        .query("spellBook")
        .withIndex("by_player_category", (q) =>
          q.eq("playerId", playerId).eq("category", category)
        )
        .collect();
    }

    return await ctx.db
      .query("spellBook")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .collect();
  },
});

// Get spell book stats
export const getSpellBookStats = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const allSpells = await ctx.db
      .query("spellBook")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .collect();

    const categories: Record<string, number> = {};
    let rareCount = 0;
    let totalPower = 0;

    for (const spell of allSpells) {
      categories[spell.category] = (categories[spell.category] || 0) + 1;
      if (spell.isRare) rareCount++;
      totalPower += spell.spellPower;
    }

    return {
      totalSpells: allSpells.length,
      categories,
      rareCount,
      totalPower,
      averageMastery:
        allSpells.length > 0
          ? Math.round(
              allSpells.reduce((sum, s) => sum + s.masteryLevel, 0) / allSpells.length
            )
          : 0,
    };
  },
});
