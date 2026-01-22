/**
 * Fuzzy Answer Validation for Homework Questions
 *
 * Provides flexible answer checking that:
 * - Accepts answers with 1-2 character typos (Levenshtein distance)
 * - Is case-insensitive
 * - Ignores punctuation differences
 * - Provides partial credit for matching/ordering
 * - Returns helpful feedback for corrections
 */

import type {
  HomeworkQuestion,
  FillBlankQuestion,
  WritingShortQuestion,
  TrueFalseQuestion,
  MatchingQuestion,
  OrderingQuestion,
  FillBlanksMultiQuestion,
  WritingSentenceQuestion,
  CorrectionQuestion,
  CategorizationQuestion,
} from "@/types/homework";

/**
 * Validation result with feedback
 */
export interface ValidationResult {
  isCorrect: boolean;
  partialScore?: number; // 0-1 for partial credit
  feedback?: string; // Spelling correction, hints, etc.
  normalizedUserAnswer: string;
  normalizedCorrectAnswer: string;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used to detect typos (1-2 character differences)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Normalize string for comparison:
 * - Lowercase
 * - Trim whitespace
 * - Remove punctuation (except apostrophes in contractions)
 * - Collapse multiple spaces
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"\-()[\]{}]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Collapse spaces
    .trim();
}

/**
 * Check if two answers match with fuzzy tolerance
 * @param userAnswer - User's answer
 * @param correctAnswer - Correct answer
 * @param maxDistance - Maximum Levenshtein distance allowed (default: 2)
 */
export function fuzzyMatch(
  userAnswer: string,
  correctAnswer: string,
  maxDistance: number = 2
): { match: boolean; distance: number; feedback?: string } {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return { match: true, distance: 0 };
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalizedUser, normalizedCorrect);

  // Allow typos based on answer length
  // Short answers (<=4 chars): allow 1 typo
  // Longer answers: allow 2 typos
  const allowedDistance = normalizedCorrect.length <= 4 ? 1 : maxDistance;

  if (distance <= allowedDistance) {
    return {
      match: true,
      distance,
      feedback: `Correct! (Spelling: "${correctAnswer}")`,
    };
  }

  return { match: false, distance };
}

/**
 * Check if user answer matches any acceptable answer
 */
export function matchesAnyAcceptable(
  userAnswer: string,
  acceptableAnswers: string[],
  maxDistance: number = 2
): ValidationResult {
  const normalizedUser = normalizeAnswer(userAnswer);

  for (const acceptable of acceptableAnswers) {
    const result = fuzzyMatch(userAnswer, acceptable, maxDistance);
    if (result.match) {
      return {
        isCorrect: true,
        feedback: result.feedback,
        normalizedUserAnswer: normalizedUser,
        normalizedCorrectAnswer: normalizeAnswer(acceptable),
      };
    }
  }

  return {
    isCorrect: false,
    normalizedUserAnswer: normalizedUser,
    normalizedCorrectAnswer: normalizeAnswer(acceptableAnswers[0] || ""),
  };
}

/**
 * Validate multiple choice answer
 */
export function validateMultipleChoice(
  userAnswer: string,
  correctAnswer: string
): ValidationResult {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  return {
    isCorrect: normalizedUser === normalizedCorrect,
    normalizedUserAnswer: normalizedUser,
    normalizedCorrectAnswer: normalizedCorrect,
  };
}

/**
 * Validate fill blank answer with fuzzy matching
 */
export function validateFillBlank(
  userAnswer: string,
  question: FillBlankQuestion
): ValidationResult {
  const acceptableAnswers = [
    question.correct,
    ...(question.acceptableAnswers || []),
  ];

  return matchesAnyAcceptable(userAnswer, acceptableAnswers);
}

/**
 * Validate writing short answer with fuzzy matching
 */
export function validateWritingShort(
  userAnswer: string,
  question: WritingShortQuestion
): ValidationResult {
  const acceptableAnswers = [
    question.correct,
    ...(question.acceptableAnswers || []),
  ];

  // Check word count if maxWords specified
  if (question.maxWords) {
    const wordCount = userAnswer.trim().split(/\s+/).length;
    if (wordCount > question.maxWords) {
      return {
        isCorrect: false,
        feedback: `Too long! Maximum ${question.maxWords} words.`,
        normalizedUserAnswer: normalizeAnswer(userAnswer),
        normalizedCorrectAnswer: normalizeAnswer(question.correct),
      };
    }
  }

  return matchesAnyAcceptable(userAnswer, acceptableAnswers);
}

/**
 * Validate true/false answer
 */
export function validateTrueFalse(
  userAnswer: string | boolean,
  question: TrueFalseQuestion
): ValidationResult {
  const userBool =
    typeof userAnswer === "boolean"
      ? userAnswer
      : userAnswer.toLowerCase() === "true";

  return {
    isCorrect: userBool === question.correctValue,
    normalizedUserAnswer: String(userBool),
    normalizedCorrectAnswer: String(question.correctValue),
  };
}

/**
 * Validate matching pairs
 * Returns partial credit (e.g., 4/5 correct pairs)
 */
export function validateMatching(
  userPairs: Record<string, string>,
  question: MatchingQuestion
): ValidationResult {
  let correctCount = 0;
  const totalPairs = question.correctPairs.length;

  for (const pair of question.correctPairs) {
    const userMatch = userPairs[pair.left];
    if (userMatch && normalizeAnswer(userMatch) === normalizeAnswer(pair.right)) {
      correctCount++;
    }
  }

  const partialScore = correctCount / totalPairs;
  const isFullyCorrect = correctCount === totalPairs;

  return {
    isCorrect: isFullyCorrect,
    partialScore,
    feedback: isFullyCorrect
      ? undefined
      : `${correctCount}/${totalPairs} pairs correct`,
    normalizedUserAnswer: JSON.stringify(userPairs),
    normalizedCorrectAnswer: question.correct,
  };
}

/**
 * Validate ordering
 * Returns partial credit for items in correct position
 */
export function validateOrdering(
  userOrder: string[],
  question: OrderingQuestion
): ValidationResult {
  let correctPositions = 0;
  const totalItems = question.correctOrder.length;

  for (let i = 0; i < totalItems; i++) {
    if (
      userOrder[i] &&
      normalizeAnswer(userOrder[i]) === normalizeAnswer(question.correctOrder[i])
    ) {
      correctPositions++;
    }
  }

  const partialScore = correctPositions / totalItems;
  const isFullyCorrect = correctPositions === totalItems;

  return {
    isCorrect: isFullyCorrect,
    partialScore,
    feedback: isFullyCorrect
      ? undefined
      : `${correctPositions}/${totalItems} items in correct position`,
    normalizedUserAnswer: userOrder.join(", "),
    normalizedCorrectAnswer: question.correct,
  };
}

/**
 * Validate multiple blanks in one sentence
 */
export function validateFillBlanksMulti(
  userAnswers: Record<string, string>,
  question: FillBlanksMultiQuestion
): ValidationResult {
  let correctCount = 0;
  const totalBlanks = question.blanks.length;
  const corrections: string[] = [];

  for (const blank of question.blanks) {
    const userAnswer = userAnswers[blank.id];
    if (userAnswer) {
      const result = matchesAnyAcceptable(userAnswer, blank.acceptableAnswers, 1);
      if (result.isCorrect) {
        correctCount++;
        if (result.feedback) {
          corrections.push(`${blank.id}: ${result.feedback}`);
        }
      }
    }
  }

  const partialScore = correctCount / totalBlanks;
  const isFullyCorrect = correctCount === totalBlanks;

  return {
    isCorrect: isFullyCorrect,
    partialScore,
    feedback:
      corrections.length > 0
        ? corrections.join("; ")
        : isFullyCorrect
          ? undefined
          : `${correctCount}/${totalBlanks} blanks correct`,
    normalizedUserAnswer: JSON.stringify(userAnswers),
    normalizedCorrectAnswer: question.correct,
  };
}

/**
 * Validate writing sentence
 * More lenient - checks for key elements and reasonable length
 */
export function validateWritingSentence(
  userAnswer: string,
  question: WritingSentenceQuestion
): ValidationResult {
  const words = userAnswer.trim().split(/\s+/);
  const wordCount = words.length;

  // Check minimum word count
  if (question.minWords && wordCount < question.minWords) {
    return {
      isCorrect: false,
      feedback: `Too short! Write at least ${question.minWords} words.`,
      normalizedUserAnswer: normalizeAnswer(userAnswer),
      normalizedCorrectAnswer: question.modelAnswer,
    };
  }

  // Check maximum word count
  if (question.maxWords && wordCount > question.maxWords) {
    return {
      isCorrect: false,
      feedback: `Too long! Maximum ${question.maxWords} words.`,
      normalizedUserAnswer: normalizeAnswer(userAnswer),
      normalizedCorrectAnswer: question.modelAnswer,
    };
  }

  // Check for key elements if specified
  if (question.keyElements && question.keyElements.length > 0) {
    const normalizedUser = normalizeAnswer(userAnswer);
    const foundElements = question.keyElements.filter((element) =>
      normalizedUser.includes(normalizeAnswer(element))
    );

    const elementScore = foundElements.length / question.keyElements.length;

    if (elementScore < 0.5) {
      return {
        isCorrect: false,
        partialScore: elementScore,
        feedback: `Missing key words. Check the model answer.`,
        normalizedUserAnswer: normalizeAnswer(userAnswer),
        normalizedCorrectAnswer: question.modelAnswer,
      };
    }

    return {
      isCorrect: elementScore >= 0.75,
      partialScore: elementScore,
      feedback:
        elementScore >= 0.75
          ? undefined
          : `Good, but missing some elements. Model: "${question.modelAnswer}"`,
      normalizedUserAnswer: normalizeAnswer(userAnswer),
      normalizedCorrectAnswer: question.modelAnswer,
    };
  }

  // No key elements - accept if reasonable length
  return {
    isCorrect: wordCount >= 3, // Accept any sentence with at least 3 words
    feedback: `Model answer: "${question.modelAnswer}"`,
    normalizedUserAnswer: normalizeAnswer(userAnswer),
    normalizedCorrectAnswer: question.modelAnswer,
  };
}

/**
 * Validate correction question
 * Check if user found and fixed the errors
 */
export function validateCorrection(
  userAnswer: string,
  question: CorrectionQuestion
): ValidationResult {
  // Check if user's corrected text matches
  const result = fuzzyMatch(userAnswer, question.correctedText, 3);

  if (result.match) {
    return {
      isCorrect: true,
      feedback: result.feedback,
      normalizedUserAnswer: normalizeAnswer(userAnswer),
      normalizedCorrectAnswer: normalizeAnswer(question.correctedText),
    };
  }

  // Check individual corrections
  const normalizedUser = normalizeAnswer(userAnswer);
  let correctionsFound = 0;

  for (const error of question.errors) {
    if (normalizedUser.includes(normalizeAnswer(error.correction))) {
      correctionsFound++;
    }
  }

  const partialScore = correctionsFound / question.errors.length;

  return {
    isCorrect: false,
    partialScore,
    feedback:
      correctionsFound > 0
        ? `Found ${correctionsFound}/${question.errors.length} corrections`
        : `Correct answer: "${question.correctedText}"`,
    normalizedUserAnswer: normalizeAnswer(userAnswer),
    normalizedCorrectAnswer: normalizeAnswer(question.correctedText),
  };
}

/**
 * Validate categorization
 * Check if items are sorted into correct categories
 */
export function validateCategorization(
  userCategories: Record<string, string[]>,
  question: CategorizationQuestion
): ValidationResult {
  let correctItems = 0;
  let totalItems = 0;

  for (const category of question.categories) {
    const userItems = userCategories[category.name] || [];
    totalItems += category.correctItems.length;

    for (const correctItem of category.correctItems) {
      const found = userItems.some(
        (item) => normalizeAnswer(item) === normalizeAnswer(correctItem)
      );
      if (found) {
        correctItems++;
      }
    }
  }

  const partialScore = correctItems / totalItems;
  const isFullyCorrect = correctItems === totalItems;

  return {
    isCorrect: isFullyCorrect,
    partialScore,
    feedback: isFullyCorrect
      ? undefined
      : `${correctItems}/${totalItems} items in correct category`,
    normalizedUserAnswer: JSON.stringify(userCategories),
    normalizedCorrectAnswer: question.correct,
  };
}

/**
 * Main validation function - dispatches to appropriate validator
 */
export function validateAnswer(
  question: HomeworkQuestion,
  userAnswer: string | string[] | Record<string, string> | Record<string, string[]> | boolean
): ValidationResult {
  switch (question.type) {
    case "multiple_choice":
      return validateMultipleChoice(userAnswer as string, question.correct);

    case "fill_blank":
      return validateFillBlank(userAnswer as string, question as FillBlankQuestion);

    case "writing_short":
      return validateWritingShort(
        userAnswer as string,
        question as WritingShortQuestion
      );

    case "true_false":
      return validateTrueFalse(
        userAnswer as string | boolean,
        question as TrueFalseQuestion
      );

    case "matching":
      return validateMatching(
        userAnswer as Record<string, string>,
        question as MatchingQuestion
      );

    case "ordering":
      return validateOrdering(userAnswer as string[], question as OrderingQuestion);

    case "fill_blanks_multi":
      return validateFillBlanksMulti(
        userAnswer as Record<string, string>,
        question as FillBlanksMultiQuestion
      );

    case "writing_sentence":
      return validateWritingSentence(
        userAnswer as string,
        question as WritingSentenceQuestion
      );

    case "correction":
      return validateCorrection(userAnswer as string, question as CorrectionQuestion);

    case "categorization":
      return validateCategorization(
        userAnswer as Record<string, string[]>,
        question as CategorizationQuestion
      );

    case "reading_comprehension":
      // Reading comprehension is handled by validating sub-questions individually
      return {
        isCorrect: false,
        feedback: "Validate sub-questions individually",
        normalizedUserAnswer: String(userAnswer),
        normalizedCorrectAnswer: question.correct,
      };

    default:
      // Fallback to simple string comparison
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return validateMultipleChoice(String(userAnswer), (question as any).correct || "");
  }
}

/**
 * Format user answer for display
 */
export function formatUserAnswer(
  question: HomeworkQuestion,
  userAnswer: string | string[] | Record<string, string> | Record<string, string[]>
): string {
  switch (question.type) {
    case "matching":
      const pairs = userAnswer as Record<string, string>;
      return Object.entries(pairs)
        .map(([left, right]) => `${left}-${right}`)
        .join(", ");

    case "ordering":
      return (userAnswer as string[]).join(", ");

    case "categorization":
      const cats = userAnswer as Record<string, string[]>;
      return Object.entries(cats)
        .map(([cat, items]) => `${cat}: ${items.join(", ")}`)
        .join(" | ");

    case "fill_blanks_multi":
      const blanks = userAnswer as Record<string, string>;
      return Object.entries(blanks)
        .map(([id, val]) => `(${id}) ${val}`)
        .join(" ");

    default:
      return String(userAnswer);
  }
}
