import { DatabaseWriter, DatabaseReader } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";

// Wizard level thresholds and titles
export const WIZARD_LEVELS = {
  apprentice: { min: 0, title: "Apprentice", emoji: "🧙" },
  junior: { min: 3, title: "Junior Wizard", emoji: "🧙‍♂️" },
  wizard: { min: 6, title: "Wizard", emoji: "🪄" },
  senior: { min: 9, title: "Senior Wizard", emoji: "⚡" },
  master: { min: 12, title: "Master Wizard", emoji: "🌟" },
};

/**
 * Calculate wizard level based on completed chapters
 */
export function calculateWizardLevel(completedChapters: number): {
  level: string;
  title: string;
  emoji: string;
  nextLevel: string | null;
  chaptersToNext: number;
} {
  let currentLevel = WIZARD_LEVELS.apprentice;
  let nextLevel: typeof currentLevel | null = null;

  const levels = Object.entries(WIZARD_LEVELS);
  for (let i = 0; i < levels.length; i++) {
    const [key, level] = levels[i];
    if (completedChapters >= level.min) {
      currentLevel = { ...level, level: key } as typeof currentLevel & { level: string };
    }
    if (completedChapters < level.min && !nextLevel) {
      nextLevel = { ...level, level: key } as typeof currentLevel & { level: string };
    }
  }

  const levelKey = Object.entries(WIZARD_LEVELS).find(
    ([_, v]) => v.title === currentLevel.title
  )?.[0] || "apprentice";

  return {
    level: levelKey,
    title: currentLevel.title,
    emoji: currentLevel.emoji,
    nextLevel: nextLevel ? Object.entries(WIZARD_LEVELS).find(
      ([_, v]) => v.title === nextLevel!.title
    )?.[0] || null : null,
    chaptersToNext: nextLevel ? nextLevel.min - completedChapters : 0,
  };
}

/**
 * Get wizard title from level string
 */
export function getWizardTitle(level: string): string {
  return WIZARD_LEVELS[level as keyof typeof WIZARD_LEVELS]?.title || "Apprentice";
}

/**
 * Get wizard title from completed count (legacy support)
 */
export function getWizardTitleByCount(completedChapters: number): string {
  return calculateWizardLevel(completedChapters).title;
}

/**
 * Calculate stars from score percentage
 */
export function calculateStars(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  const percentage = (correctAnswers / totalQuestions) * 100;
  if (percentage >= 90) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 50) return 1;
  return 0;
}

/**
 * Update best score - returns new values if better, null if not
 */
export function updateBestScore(
  existingScore: number,
  existingStars: number,
  newScore: number,
  newStars: number
): { bestScore: number; starsEarned: number } | null {
  if (newScore > existingScore || newStars > existingStars) {
    return {
      bestScore: Math.max(existingScore, newScore),
      starsEarned: Math.max(existingStars, newStars),
    };
  }
  return null;
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Calculate total stars from array of items with starsEarned
 */
export function sumStars<T extends { starsEarned: number }>(items: T[]): number {
  return items.reduce((sum, item) => sum + item.starsEarned, 0);
}

/**
 * Count completed items from array
 */
export function countCompleted<T extends { isCompleted: boolean }>(items: T[]): number {
  return items.filter((item) => item.isCompleted).length;
}

/**
 * Check if all items in array are completed
 */
export function allCompleted<T extends { isCompleted: boolean }>(items: T[]): boolean {
  return items.length > 0 && items.every((item) => item.isCompleted);
}

/**
 * Find first unlocked but not completed item
 */
export function findCurrentProgress<T extends { isUnlocked: boolean; isCompleted: boolean }>(
  items: T[]
): T | undefined {
  return items.find((item) => item.isUnlocked && !item.isCompleted);
}

/**
 * Progress update result type
 */
export interface ProgressUpdateResult {
  success: boolean;
  error?: string;
  unlocked?: boolean;
  chapterCompleted?: boolean;
  wizardLevel?: string;
}

/**
 * Generic chapter completion check
 */
export function checkChapterCompletion(
  lessons: { isCompleted: boolean }[],
  requiredLessons: number
): boolean {
  const completedCount = lessons.filter((l) => l.isCompleted).length;
  return completedCount >= requiredLessons;
}
