/**
 * Homework Question Types
 *
 * Supports multiple question formats detected from homework images:
 * - multiple_choice: When A, B, C, D options are printed on homework
 * - fill_blank: Single blank, text input (no forced options)
 * - writing_short: Write a word/phrase answer
 * - true_false: True/False questions
 * - matching: Connect left items to right items
 * - ordering: Put items in correct sequence
 * - reading_comprehension: Passage + sub-questions
 * - fill_blanks_multi: Multiple blanks in one sentence
 * - writing_sentence: Write complete sentence(s)
 * - correction: Find and fix errors in text
 * - categorization: Sort items into groups
 */

export type QuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "writing_short"
  | "true_false"
  | "matching"
  | "ordering"
  | "reading_comprehension"
  | "fill_blanks_multi"
  | "writing_sentence"
  | "correction"
  | "categorization";

/**
 * Base question - all types have these fields
 */
interface BaseQuestion {
  type: QuestionType;
  text: string;
  originalNumber?: string; // "1", "a)", "Q1"
  correct: string; // Paper-ready answer
  explanation?: string;
  hint?: string;
  pageRef: number;
}

/**
 * Multiple Choice - ONLY when options printed on homework
 */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  options: string[]; // 2-5 options from homework
}

/**
 * Fill Blank - Single blank in a sentence
 */
export interface FillBlankQuestion extends BaseQuestion {
  type: "fill_blank";
  sentence: string; // Use ___ for blank position
  options?: string[]; // ONLY if word bank shown on page
  acceptableAnswers?: string[]; // Alternative correct spellings
}

/**
 * Writing Short - Write a word/phrase answer
 */
export interface WritingShortQuestion extends BaseQuestion {
  type: "writing_short";
  acceptableAnswers?: string[]; // Alternative correct answers
  maxWords?: number;
}

/**
 * True/False questions
 */
export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false";
  correctValue: boolean;
}

/**
 * Matching - Connect left items to right items
 */
export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  leftColumn: { id: string; text: string }[];
  rightColumn: { id: string; text: string }[];
  correctPairs: { left: string; right: string }[];
  // correct field format: "1-B, 2-A, 3-C" for paper
}

/**
 * Ordering - Put items in correct sequence
 */
export interface OrderingQuestion extends BaseQuestion {
  type: "ordering";
  items: string[]; // Shuffled items to order
  correctOrder: string[]; // Correct sequence
  // correct field format: "C, A, D, B" for paper
}

/**
 * Reading Comprehension - Passage + sub-questions
 */
export interface ReadingComprehensionQuestion extends BaseQuestion {
  type: "reading_comprehension";
  passage: string;
  passageTitle?: string;
  subQuestions: SubQuestion[];
  // correct field format: "a) answer\nb) answer" for paper
}

/**
 * Sub-question types allowed in reading comprehension
 */
export type SubQuestion =
  | Omit<MultipleChoiceQuestion, "pageRef">
  | Omit<FillBlankQuestion, "pageRef">
  | Omit<WritingShortQuestion, "pageRef">
  | Omit<TrueFalseQuestion, "pageRef">;

/**
 * Fill Blanks Multi - Multiple blanks in one sentence/paragraph
 */
export interface FillBlanksMultiQuestion extends BaseQuestion {
  type: "fill_blanks_multi";
  sentence: string; // Use ___1___, ___2___, etc. for blank positions
  blanks: {
    id: string;
    acceptableAnswers: string[];
  }[];
  options?: string[]; // ONLY if word bank shown on page
  // correct field format: "(1) word1 (2) word2" for paper
}

/**
 * Writing Sentence - Write complete sentence(s)
 */
export interface WritingSentenceQuestion extends BaseQuestion {
  type: "writing_sentence";
  modelAnswer: string; // Example of good answer
  keyElements?: string[]; // Required elements to include
  minWords?: number;
  maxWords?: number;
}

/**
 * Correction - Find and fix errors in text
 */
export interface CorrectionQuestion extends BaseQuestion {
  type: "correction";
  errorText: string; // The text with errors
  correctedText: string; // The fixed text
  errors: {
    original: string;
    correction: string;
    position?: number;
  }[];
  // correct field format: "walked (not walk), were (not was)" for paper
}

/**
 * Categorization - Sort items into groups
 */
export interface CategorizationQuestion extends BaseQuestion {
  type: "categorization";
  items: string[]; // Items to categorize (shuffled)
  categories: {
    name: string;
    correctItems: string[];
  }[];
  // correct field format: "Nouns: cat, dog | Verbs: run, jump" for paper
}

/**
 * Union type for all homework questions
 */
export type HomeworkQuestion =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | WritingShortQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | OrderingQuestion
  | ReadingComprehensionQuestion
  | FillBlanksMultiQuestion
  | WritingSentenceQuestion
  | CorrectionQuestion
  | CategorizationQuestion;

/**
 * Type guard functions
 */
export function isMultipleChoice(q: HomeworkQuestion): q is MultipleChoiceQuestion {
  return q.type === "multiple_choice";
}

export function isFillBlank(q: HomeworkQuestion): q is FillBlankQuestion {
  return q.type === "fill_blank";
}

export function isWritingShort(q: HomeworkQuestion): q is WritingShortQuestion {
  return q.type === "writing_short";
}

export function isTrueFalse(q: HomeworkQuestion): q is TrueFalseQuestion {
  return q.type === "true_false";
}

export function isMatching(q: HomeworkQuestion): q is MatchingQuestion {
  return q.type === "matching";
}

export function isOrdering(q: HomeworkQuestion): q is OrderingQuestion {
  return q.type === "ordering";
}

export function isReadingComprehension(q: HomeworkQuestion): q is ReadingComprehensionQuestion {
  return q.type === "reading_comprehension";
}

export function isFillBlanksMulti(q: HomeworkQuestion): q is FillBlanksMultiQuestion {
  return q.type === "fill_blanks_multi";
}

export function isWritingSentence(q: HomeworkQuestion): q is WritingSentenceQuestion {
  return q.type === "writing_sentence";
}

export function isCorrection(q: HomeworkQuestion): q is CorrectionQuestion {
  return q.type === "correction";
}

export function isCategorization(q: HomeworkQuestion): q is CategorizationQuestion {
  return q.type === "categorization";
}

/**
 * Check if question requires text input (no predefined options)
 */
export function requiresTextInput(q: HomeworkQuestion): boolean {
  switch (q.type) {
    case "fill_blank":
      return !(q as FillBlankQuestion).options?.length;
    case "writing_short":
    case "writing_sentence":
    case "correction":
      return true;
    case "fill_blanks_multi":
      return !(q as FillBlanksMultiQuestion).options?.length;
    default:
      return false;
  }
}

/**
 * Check if question type supports options/choices
 */
export function hasOptions(q: HomeworkQuestion): boolean {
  switch (q.type) {
    case "multiple_choice":
    case "true_false":
      return true;
    case "fill_blank":
      return !!(q as FillBlankQuestion).options?.length;
    case "fill_blanks_multi":
      return !!(q as FillBlanksMultiQuestion).options?.length;
    default:
      return false;
  }
}

/**
 * Answer value type - all possible answer formats
 */
export type AnswerValue = string | boolean | string[] | Record<string, string> | Record<string, string[]>;

/**
 * User answer format for different question types
 */
export interface UserAnswer {
  questionIndex: number;
  userAnswer: AnswerValue;
  isCorrect: boolean;
  partialScore?: number; // For matching/ordering (e.g., 4/5)
  feedback?: string; // Spelling correction or other feedback
}

/**
 * AI homework analysis response
 */
export interface HomeworkAnalysisResult {
  isValid: boolean;
  error?: string;
  subject?: string;
  grade?: string;
  topics?: string[];
  gameName?: string;
  gameIcon?: string;
  questions?: HomeworkQuestion[];
  totalPages?: number;
  isHomework?: boolean;
  difficulty?: {
    gradeLevel: number;
    multiplier: number;
    topics: string[];
    complexity: "easy" | "medium" | "hard";
  };
}
