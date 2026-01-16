/**
 * Fair Scoring System for WordQuest
 *
 * This module implements a normalized scoring system that allows players
 * of different ages to compete fairly on the same leaderboard.
 *
 * Key concept: Younger children get a multiplier bonus because the same
 * questions are harder for them relative to their developmental stage.
 */

// Age group definitions
export const AGE_GROUPS = {
  "6-8": { min: 6, max: 8, label: "6-8 years", multiplier: 1.5 },
  "9-11": { min: 9, max: 11, label: "9-11 years", multiplier: 1.2 },
  "12+": { min: 12, max: 99, label: "12+ years", multiplier: 1.0 },
} as const;

export type AgeGroup = keyof typeof AGE_GROUPS;

// Age difficulty multipliers - younger kids get bonus
const AGE_DIFFICULTY_MULTIPLIER: Record<AgeGroup, number> = {
  "6-8": 1.5, // Younger get 50% bonus
  "9-11": 1.2, // Middle get 20% bonus
  "12+": 1.0, // Older - base score
};

// Accuracy bonus thresholds
const ACCURACY_BONUSES = {
  excellent: { threshold: 90, bonus: 1.2 }, // 90%+ accuracy = 20% bonus
  good: { threshold: 80, bonus: 1.1 }, // 80%+ accuracy = 10% bonus
  normal: { threshold: 0, bonus: 1.0 }, // Below 80% = no bonus
};

// Volume bonus (rewards consistent play)
const VOLUME_BONUS_FACTOR = 100; // Questions answered to reach max bonus
const MAX_VOLUME_BONUS = 1.5; // Maximum 50% volume bonus

/**
 * Calculate age group from birth year
 */
export function calculateAgeGroup(birthYear: number): AgeGroup {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  if (age <= 8) return "6-8";
  if (age <= 11) return "9-11";
  return "12+";
}

/**
 * Calculate age from birth year
 */
export function calculateAge(birthYear: number): number {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

/**
 * Calculate normalized score for fair competition across ages
 *
 * Formula: normalizedScore = rawScore * ageMultiplier * accuracyBonus * volumeBonus
 *
 * @param rawScore - The raw points earned
 * @param ageGroup - Player's age group ("6-8", "9-11", "12+")
 * @param accuracy - Player's accuracy percentage (0-100)
 * @param questionsAnswered - Total questions answered
 * @returns Normalized score (rounded)
 */
export function calculateNormalizedScore(
  rawScore: number,
  ageGroup: AgeGroup,
  accuracy: number,
  questionsAnswered: number
): number {
  // Get age multiplier
  const ageMultiplier = AGE_DIFFICULTY_MULTIPLIER[ageGroup] || 1.0;

  // Calculate accuracy bonus
  let accuracyBonus = ACCURACY_BONUSES.normal.bonus;
  if (accuracy >= ACCURACY_BONUSES.excellent.threshold) {
    accuracyBonus = ACCURACY_BONUSES.excellent.bonus;
  } else if (accuracy >= ACCURACY_BONUSES.good.threshold) {
    accuracyBonus = ACCURACY_BONUSES.good.bonus;
  }

  // Calculate volume bonus (rewards consistent play)
  const volumeBonus = Math.min(
    1 + questionsAnswered / VOLUME_BONUS_FACTOR,
    MAX_VOLUME_BONUS
  );

  // Calculate final normalized score
  const normalizedScore = rawScore * ageMultiplier * accuracyBonus * volumeBonus;

  return Math.round(normalizedScore);
}

/**
 * Calculate points for a single correct answer
 *
 * @param difficulty - Question difficulty (1-3)
 * @param timeSpent - Time spent in milliseconds
 * @param maxTime - Maximum allowed time in milliseconds
 * @param streakBonus - Current streak multiplier (1.0 - 2.0)
 * @returns Points earned
 */
export function calculateAnswerPoints(
  difficulty: number,
  timeSpent: number,
  maxTime: number = 30000,
  streakBonus: number = 1.0
): number {
  const BASE_POINTS = 100;
  const MAX_SPEED_BONUS = 50;

  // Difficulty multiplier
  const difficultyMultiplier = 0.8 + difficulty * 0.2; // 1.0, 1.2, 1.4

  // Speed bonus (faster = more points)
  const speedRatio = Math.max(0, (maxTime - timeSpent) / maxTime);
  const speedBonus = Math.floor(speedRatio * MAX_SPEED_BONUS);

  // Calculate points
  const points = (BASE_POINTS + speedBonus) * difficultyMultiplier * streakBonus;

  return Math.round(points);
}

/**
 * Calculate challenge winner based on normalized scores
 *
 * @param participants - Array of {playerId, score, ageGroup, accuracy, questionsAnswered}
 * @returns Winner playerId or null if tie
 */
export function determineChallengeWinner(
  participants: Array<{
    playerId: string;
    score: number;
    ageGroup: AgeGroup;
    accuracy: number;
    correctAnswers: number;
    totalTime: number;
  }>
): { winnerId: string | null; scores: Array<{ playerId: string; normalizedScore: number }> } {
  if (participants.length === 0) {
    return { winnerId: null, scores: [] };
  }

  // Calculate normalized scores for each participant
  const scores = participants.map((p) => ({
    playerId: p.playerId,
    normalizedScore: calculateNormalizedScore(
      p.score,
      p.ageGroup,
      p.accuracy,
      p.correctAnswers
    ),
    totalTime: p.totalTime,
  }));

  // Sort by normalized score (descending), then by time (ascending) for tiebreaker
  scores.sort((a, b) => {
    if (b.normalizedScore !== a.normalizedScore) {
      return b.normalizedScore - a.normalizedScore;
    }
    return a.totalTime - b.totalTime; // Faster wins tie
  });

  return {
    winnerId: scores[0].playerId,
    scores: scores.map((s) => ({ playerId: s.playerId, normalizedScore: s.normalizedScore })),
  };
}

/**
 * Calculate percentile rank for a player
 *
 * @param playerScore - Player's normalized score
 * @param allScores - Array of all normalized scores in the same group
 * @returns Percentile (0-100)
 */
export function calculatePercentile(
  playerScore: number,
  allScores: number[]
): number {
  if (allScores.length === 0) return 100;

  const belowCount = allScores.filter((score) => score < playerScore).length;
  const percentile = (belowCount / allScores.length) * 100;

  return Math.round(percentile);
}

/**
 * Generate anonymous display name for leaderboards
 * Format: [Adjective][Noun][Number]
 */
export function generateDisplayName(): string {
  const adjectives = [
    "Swift",
    "Clever",
    "Bright",
    "Magic",
    "Star",
    "Cosmic",
    "Golden",
    "Crystal",
    "Silver",
    "Mystic",
  ];
  const nouns = [
    "Wizard",
    "Mage",
    "Scholar",
    "Sage",
    "Learner",
    "Knight",
    "Phoenix",
    "Dragon",
    "Owl",
    "Fox",
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);

  return `${adj}${noun}${num}`;
}

/**
 * Get leaderboard rewards based on rank
 */
export function getLeaderboardReward(
  rank: number,
  leaderboardType: "daily" | "weekly" | "monthly"
): { diamonds: number; emeralds: number; xp: number } {
  const rewards = {
    daily: {
      1: { diamonds: 50, emeralds: 25, xp: 200 },
      2: { diamonds: 30, emeralds: 15, xp: 150 },
      3: { diamonds: 20, emeralds: 10, xp: 100 },
      top10: { diamonds: 10, emeralds: 5, xp: 50 },
    },
    weekly: {
      1: { diamonds: 200, emeralds: 100, xp: 500 },
      2: { diamonds: 150, emeralds: 75, xp: 400 },
      3: { diamonds: 100, emeralds: 50, xp: 300 },
      top10: { diamonds: 50, emeralds: 25, xp: 150 },
    },
    monthly: {
      1: { diamonds: 500, emeralds: 250, xp: 1000 },
      2: { diamonds: 350, emeralds: 175, xp: 750 },
      3: { diamonds: 250, emeralds: 125, xp: 500 },
      top10: { diamonds: 100, emeralds: 50, xp: 250 },
    },
  };

  const typeRewards = rewards[leaderboardType];

  if (rank === 1) return typeRewards[1];
  if (rank === 2) return typeRewards[2];
  if (rank === 3) return typeRewards[3];
  if (rank <= 10) return typeRewards.top10;

  return { diamonds: 0, emeralds: 0, xp: 0 };
}
