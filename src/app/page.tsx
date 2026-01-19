"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

// Get device ID for IDOR protection
function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  return localStorage.getItem("wordquest_device_id") || "unknown";
}
import { useAppStore } from "@/lib/store";
import { useConvexSync } from "@/components/providers/ConvexSyncProvider";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Screens
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ShopScreen } from "@/components/screens/ShopScreen";
import { InventoryScreen } from "@/components/screens/InventoryScreen";
import { CameraScreen } from "@/components/screens/CameraScreen";
import { AIProcessingScreen, AIAnalysisResult } from "@/components/screens/AIProcessingScreen";
import { ExplanationScreen } from "@/components/screens/ExplanationScreen";
import { AchievementsScreen } from "@/components/screens/AchievementsScreen";
import { PracticeModeScreen } from "@/components/screens/PracticeModeScreen";
import { AnalyticsDashboard } from "@/components/screens/AnalyticsDashboard";
import { LearningProfileScreen } from "@/components/screens/LearningProfileScreen";
import { ParentSettingsScreen } from "@/components/screens/ParentSettingsScreen";
import { QuestMapScreen } from "@/components/screens/QuestMapScreen";
import { SpellBookScreen } from "@/components/screens/SpellBookScreen";
import { ProfileSetupScreen } from "@/components/screens/ProfileSetupScreen";
import { ProfileSettingsScreen } from "@/components/screens/ProfileSettingsScreen";
import { GeneralDashboardScreen } from "@/components/screens/GeneralDashboardScreen";
import { LeaderboardScreen } from "@/components/screens/LeaderboardScreen";
import { GemHubScreen } from "@/components/screens/GemHubScreen";
import { WeeklyQuestsScreen } from "@/components/screens/WeeklyQuestsScreen";
import { HomeworkAnswersScreen } from "@/components/screens/HomeworkAnswersScreen";
import { HomeworkScreen } from "@/components/screens/HomeworkScreen";
import { GamesScreen } from "@/components/screens/GamesScreen";
import { ChapterMapScreen } from "@/components/screens/ChapterMapScreen";
import { QuestGameScreen } from "@/components/screens/QuestGameScreen";
import { BossBattleScreen } from "@/components/screens/BossBattleScreen";
import { LIFE_SKILLS_ISLANDS, Chapter, getChapterById } from "@/data/lifeSkillsQuestions";

// UI Components
import { GameWorld } from "@/components/ui/GameWorld";

// Modals
import { DailyRewardModal } from "@/components/modals/DailyRewardModal";
import { LevelCompleteModal } from "@/components/modals/LevelCompleteModal";
import { AchievementModal } from "@/components/modals/AchievementModal";
import { ErrorModal } from "@/components/modals/ErrorModal";
import { DuplicateHomeworkDialog } from "@/components/ui/DuplicateHomeworkDialog";
import { MilestoneModal } from "@/components/modals/MilestoneModal";

// Ambient Effects
import { AmbientEffects } from "@/components/ui/AmbientEffects";

// Tutorial System
import { TutorialProvider, TutorialOverlay } from "@/components/tutorial";

// Game Components
import { MiningOverlay } from "@/components/game/MiningOverlay";
import {
  SuffixGame,
  ImperativeGame,
  InterrogativeGame,
  VocabularyGame,
  StoryGame,
  CrosswordGame,
  FactFinderGame,
  EmotionDecoderGame,
  ResponseCraftGame,
  AIHelperGame,
  CoinQuestGame,
  FakeNewsGame,
  PromptCraftGame,
  BudgetBuilderGame,
} from "@/components/game";

// Hooks
import { useGemDrop } from "@/hooks/useGemDrop";

// Helper function to detect topic from question content
function detectTopic(questionText: string, subject: string): string {
  const text = questionText.toLowerCase();

  // English topics
  if (text.includes("suffix") || text.includes("-tion") || text.includes("-ness") || text.includes("-ment") || text.includes("-ful") || text.includes("-less")) {
    return "suffixes";
  }
  if (text.includes("prefix") || text.includes("un-") || text.includes("re-") || text.includes("pre-") || text.includes("dis-")) {
    return "prefixes";
  }
  if (text.includes("verb") || text.includes("action word") || text.includes("past tense") || text.includes("present tense")) {
    return "verbs";
  }
  if (text.includes("noun") || text.includes("naming word") || text.includes("person, place")) {
    return "nouns";
  }
  if (text.includes("adjective") || text.includes("describing word")) {
    return "adjectives";
  }
  if (text.includes("spell") || text.includes("correct spelling")) {
    return "spelling";
  }
  if (text.includes("punctuation") || text.includes("comma") || text.includes("period") || text.includes("question mark")) {
    return "punctuation";
  }
  if (text.includes("grammar") || text.includes("sentence") || text.includes("correct form")) {
    return "grammar";
  }

  // Math topics
  if (text.includes("multiply") || text.includes("times") || text.includes("×") || text.includes("*")) {
    return "multiplication";
  }
  if (text.includes("divide") || text.includes("÷") || text.includes("/")) {
    return "division";
  }
  if (text.includes("add") || text.includes("+") || text.includes("plus") || text.includes("sum")) {
    return "addition";
  }
  if (text.includes("subtract") || text.includes("-") || text.includes("minus") || text.includes("difference")) {
    return "subtraction";
  }
  if (text.includes("fraction") || text.includes("/") || text.includes("half") || text.includes("quarter")) {
    return "fractions";
  }
  if (text.includes("decimal") || text.includes(".")) {
    return "decimals";
  }

  // Default to subject-based topic
  return subject.toLowerCase().replace(/\s+/g, "_");
}

// Helper function to detect error type from question and answers
function detectErrorType(questionText: string, wrongAnswer: string, correctAnswer: string): string {
  const text = questionText.toLowerCase();

  // Check for spelling errors
  if (text.includes("spell") || levenshteinDistance(wrongAnswer.toLowerCase(), correctAnswer.toLowerCase()) <= 2) {
    return "spelling";
  }

  // Check for grammar errors
  if (text.includes("grammar") || text.includes("correct form") || text.includes("verb form")) {
    return "grammar";
  }

  // Check for logic/math errors
  if (text.includes("calculate") || text.includes("solve") || /\d/.test(correctAnswer)) {
    return "logic";
  }

  // Check for comprehension errors
  if (text.includes("what") || text.includes("which") || text.includes("choose")) {
    return "comprehension";
  }

  return "general";
}

// Helper function to extract word from question for Spell Book
function extractWordFromQuestion(
  question: { text: string; correct: string; type: string; explanation?: string },
  subject: string
): { word: string; category: string; definition: string } | null {
  const text = question.text.toLowerCase();
  const correct = question.correct;

  // Try to extract meaningful word from correct answer
  // For suffix/prefix questions, the correct answer often IS the word
  if (text.includes("suffix") || text.includes("prefix")) {
    // Extract the base word or result word
    const words = correct.match(/[a-zA-Z]{4,}/g);
    if (words && words.length > 0) {
      // Take the longest word as the target
      const word = words.reduce((a, b) => (a.length > b.length ? a : b));
      return {
        word: word.toLowerCase(),
        category: text.includes("suffix") ? "noun" : "verb", // suffixes often create nouns
        definition: question.explanation || `A word formed with a ${text.includes("suffix") ? "suffix" : "prefix"}`,
      };
    }
  }

  // For vocabulary questions, extract word from correct answer
  if (text.includes("meaning") || text.includes("define") || text.includes("synonym")) {
    const word = correct.match(/[a-zA-Z]{3,}/)?.[0];
    if (word) {
      return {
        word: word.toLowerCase(),
        category: "noun",
        definition: question.explanation || question.text,
      };
    }
  }

  // For grammar questions, detect part of speech
  if (text.includes("verb") || text.includes("action word")) {
    const word = correct.match(/[a-zA-Z]{3,}/)?.[0];
    if (word) {
      return {
        word: word.toLowerCase(),
        category: "verb",
        definition: question.explanation || `A verb meaning to ${word}`,
      };
    }
  }

  if (text.includes("adjective") || text.includes("describing")) {
    const word = correct.match(/[a-zA-Z]{3,}/)?.[0];
    if (word) {
      return {
        word: word.toLowerCase(),
        category: "adjective",
        definition: question.explanation || `An adjective describing something`,
      };
    }
  }

  if (text.includes("noun") || text.includes("naming word")) {
    const word = correct.match(/[a-zA-Z]{3,}/)?.[0];
    if (word) {
      return {
        word: word.toLowerCase(),
        category: "noun",
        definition: question.explanation || `A noun`,
      };
    }
  }

  if (text.includes("adverb")) {
    const word = correct.match(/[a-zA-Z]{3,}/)?.[0];
    if (word) {
      return {
        word: word.toLowerCase(),
        category: "adverb",
        definition: question.explanation || `An adverb`,
      };
    }
  }

  // For spelling questions, the correct answer is the word
  if (text.includes("spell") || text.includes("spelling")) {
    const word = correct.match(/[a-zA-Z]{3,}/)?.[0];
    if (word) {
      return {
        word: word.toLowerCase(),
        category: "noun", // default category for spelling words
        definition: question.explanation || `Correctly spelled word`,
      };
    }
  }

  // Generic extraction: take a meaningful word from correct answer
  // Skip math/numeric answers
  if (subject.toLowerCase() === "english" || subject.toLowerCase() === "grammar" || subject.toLowerCase() === "spelling") {
    const word = correct.match(/[a-zA-Z]{4,}/)?.[0];
    if (word && word.length >= 4) {
      // Detect category from question content
      let category = "noun"; // default
      if (text.includes("verb") || text.includes("action")) category = "verb";
      else if (text.includes("adjective") || text.includes("describ")) category = "adjective";
      else if (text.includes("adverb")) category = "adverb";
      else if (text.includes("preposition")) category = "preposition";
      else if (text.includes("conjunction")) category = "conjunction";
      else if (text.includes("pronoun")) category = "pronoun";
      else if (text.includes("phrase")) category = "phrase";

      return {
        word: word.toLowerCase(),
        category,
        definition: question.explanation || question.text.slice(0, 100),
      };
    }
  }

  return null;
}

// Simple Levenshtein distance for spell checking
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Fisher-Yates shuffle for randomizing question order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Common English prefixes for generating word variants
const PREFIXES = ['un', 're', 'dis', 'pre', 'mis', 'over', 'under', 'out', 'up', 'down', 'de', 'non', 'anti', 'sub', 'super'];

// Generate word variants by adding/removing prefixes
function generateWordVariants(word: string): string[] {
  const variants: string[] = [];
  const lowerWord = word.toLowerCase();

  // Try removing existing prefix
  for (const prefix of PREFIXES) {
    if (lowerWord.startsWith(prefix)) {
      const base = word.slice(prefix.length);
      if (base.length >= 2) {
        variants.push(base); // Base word without prefix
        // Add other prefixes to base
        for (const otherPrefix of PREFIXES) {
          if (otherPrefix !== prefix) {
            variants.push(otherPrefix + base);
          }
        }
      }
      break;
    }
  }

  // If no prefix found, try adding common prefixes
  if (variants.length === 0) {
    for (const prefix of PREFIXES) {
      variants.push(prefix + lowerWord);
    }
  }

  // Filter out duplicates and the original word
  return [...new Set(variants)]
    .filter(v => v.toLowerCase() !== lowerWord && v.length > 2)
    .slice(0, 5);
}

// Helper function to generate options for questions that don't have them
function generateOptionsForQuestion(q: { text: string; correct: string; type?: string; options?: string[] }): string[] {
  // If already has valid options (not generic), use them
  if (q.options && q.options.length >= 2) {
    const hasGeneric = q.options.some(opt =>
      opt.toLowerCase().includes('none of the above') ||
      opt.toLowerCase().includes('all of the above') ||
      opt.toLowerCase().includes('cannot be determined')
    );
    if (!hasGeneric) {
      return q.options;
    }
    // Filter out generic options and regenerate
    const goodOptions = q.options.filter(opt =>
      !opt.toLowerCase().includes('none of the above') &&
      !opt.toLowerCase().includes('all of the above') &&
      !opt.toLowerCase().includes('cannot be determined')
    );
    if (goodOptions.length >= 2) {
      return goodOptions;
    }
  }

  const correct = q.correct.toLowerCase().trim();
  const text = q.text.toLowerCase();

  // Classification: command vs request
  if (text.includes('command') && text.includes('request')) {
    return ['Command', 'Request'];
  }
  // True/False questions
  if (correct === 'true' || correct === 'false' || q.type === 'true_false') {
    return ['True', 'False'];
  }
  // Yes/No questions
  if (correct === 'yes' || correct === 'no') {
    return ['Yes', 'No'];
  }
  // Singular/Plural
  if (text.includes('singular') && text.includes('plural')) {
    return ['Singular', 'Plural'];
  }
  // Past/Present/Future tense
  if (text.includes('tense')) {
    if (correct.includes('past') || correct.includes('present') || correct.includes('future')) {
      return ['Past', 'Present', 'Future'];
    }
  }
  // Noun/Verb/Adjective/Adverb
  if (text.includes('part of speech') || text.includes('noun') || text.includes('verb')) {
    return ['Noun', 'Verb', 'Adjective', 'Adverb'];
  }
  // Positive/Negative
  if (text.includes('positive') && text.includes('negative')) {
    return ['Positive', 'Negative'];
  }
  // Subject/Object
  if (text.includes('subject') && text.includes('object')) {
    return ['Subject', 'Object'];
  }

  // OPPOSITE/ANTONYM questions - use prefix manipulation
  if (text.includes('opposite') || text.includes('antonym')) {
    const variants = generateWordVariants(q.correct);
    if (variants.length >= 3) {
      // Capitalize first letter to match the correct answer style
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      const correctCapitalized = capitalize(q.correct);
      const distractors = variants.slice(0, 3).map(capitalize);
      return shuffleArray([correctCapitalized, ...distractors]);
    }
  }

  // Conditional/If only sentences - generate plausible alternatives
  if (text.includes('if only') || text.includes('conditional') || text.includes('wish')) {
    const correctAnswer = q.correct;
    const distractors = [
      correctAnswer.replace(/had /g, 'have ').replace(/would /g, 'will '),
      correctAnswer.replace(/I /g, 'We ').replace(/my /g, 'our '),
      correctAnswer.replace(/had /g, 'has ').replace(/were /g, 'was '),
    ].filter(d => d !== correctAnswer);

    if (distractors.length >= 1) {
      return shuffleArray([correctAnswer, ...distractors.slice(0, 3)]);
    }
  }

  // Single word answer - try to generate variants using prefixes
  if (q.correct.split(' ').length === 1 && q.correct.length >= 3) {
    const variants = generateWordVariants(q.correct);
    if (variants.length >= 3) {
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      const correctCapitalized = capitalize(q.correct);
      const distractors = variants.slice(0, 3).map(capitalize);
      return shuffleArray([correctCapitalized, ...distractors]);
    }
  }

  // Fill-in-blank or short answer without good options - return empty to trigger text input
  if ((q.type === 'fill_blank' || q.type === 'short_answer') && (!q.options || q.options.length < 2)) {
    return []; // Empty array signals: use text input instead
  }

  // Last resort: return just the correct answer (will show text input)
  return [q.correct];
}

export default function Home() {
  // SECURITY: Get device ID for ownership verification
  const deviceId = useMemo(() => getDeviceId(), []);

  // Convex sync
  const {
    isLoading: convexLoading,
    isLoggedIn,
    playerId,
    levelProgress,
    inventory: convexInventory,
    ownedItems: convexOwnedItems,
    initializePlayer,
    awardCurrency,
    claimDailyReward: claimDailyRewardSync,
    completeLevelSync,
    purchaseItemSync,
    equipItemSync,
    addWordsLearned,
  } = useConvexSync();

  // App phases
  const [phase, setPhase] = useState<"loading" | "login" | "game">("loading");

  // Convex mutations for homework
  const createHomeworkSession = useMutation(api.homework.createHomeworkSession);
  const completeHomeworkSession = useMutation(api.homework.completeHomeworkSession);
  const savePartialProgress = useMutation(api.homework.savePartialProgress);

  // Error tracking mutation
  const trackError = useMutation(api.errors.trackError);

  // Spell Book mutation - add words when correct answers given
  const addToSpellBook = useMutation(api.quests.addToSpellBook);

  // Daily quest progress mutation
  const updateDailyQuestProgress = useMutation(api.quests.updateDailyQuestProgress);

  // Life Skills mutations
  const initializeLifeSkills = useMutation(api.lifeSkills.initializeLifeSkills);
  const completeLessonMutation = useMutation(api.lifeSkills.completeLesson);
  const completeBossBattleMutation = useMutation(api.lifeSkills.completeBossBattle);

  // Life Skills progress query
  const lifeSkillsProgress = useQuery(
    api.lifeSkills.getLifeSkillsProgress,
    playerId ? { playerId } : "skip"
  );

  // Practice quest progress mutation
  const answerPracticeQuestion = useMutation(api.weeklyQuests.answerPracticeQuestion);

  // Topic progress mutation
  const updateTopicProgress = useMutation(api.learning.updateTopicProgress);

  // Spaced Repetition mutations
  const updateSpacedRepetition = useMutation(api.learning.updateSpacedRepetition);

  // Generate weekly quests on demand
  const generateWeeklyQuests = useMutation(api.weeklyQuests.generateWeeklyQuests);

  // Streak tracking - record activity when player practices
  const recordActivity = useMutation(api.gamification.recordActivity);

  // Milestone mutations
  const claimMilestoneReward = useMutation(api.milestones.claimMilestoneReward);
  const checkMilestoneQuery = useQuery(
    api.milestones.checkMilestone,
    playerId ? { playerId } : "skip"
  );

  // Weekly quests query - for practice quest gameplay
  const weeklyQuestsData = useQuery(
    api.weeklyQuests.getWeeklyQuests,
    playerId ? { playerId } : "skip"
  );

  // Parent notification query
  const parentLink = useQuery(
    api.parents.getParentLink,
    playerId ? { playerId } : "skip"
  );

  // Helper function to send Telegram notifications to parents
  const sendParentNotification = useCallback(async (message: string) => {
    if (!parentLink?.telegramChatId || !parentLink?.notificationsEnabled) return;

    try {
      await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: parentLink.telegramChatId,
          message,
        }),
      });
    } catch (err) {
      console.error("Failed to send parent notification:", err);
    }
  }, [parentLink]);

  // Camera/AI states
  const [showCamera, setShowCamera] = useState(false);
  const [showAIProcessing, setShowAIProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [aiGameData, setAiGameData] = useState<AIAnalysisResult | null>(null);
  const [currentHomeworkSessionId, setCurrentHomeworkSessionId] = useState<Id<"homeworkSessions"> | null>(null);
  const [currentPracticeQuestId, setCurrentPracticeQuestId] = useState<Id<"weeklyPracticeQuests"> | null>(null);
  // Practice mode for duplicate homework (25% rewards)
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingHomeworkData, setPendingHomeworkData] = useState<AIAnalysisResult | null>(null);
  const [duplicateSessionInfo, setDuplicateSessionInfo] = useState<{
    _id: string;
    gameName: string;
    gameIcon: string;
    subject: string;
    score?: number;
    stars?: number;
    completedAt?: string;
    questionsCount: number;
  } | null>(null);
  // Spaced Repetition Review tracking
  const [currentReviewSession, setCurrentReviewSession] = useState<{
    topic: string;
    subject: string;
    srsId?: Id<"spacedRepetition">;
  } | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [isPlayingAIGame, setIsPlayingAIGame] = useState(false);
  const [aiGameProgress, setAiGameProgress] = useState({ current: 0, correct: 0, mistakes: 0 });
  const [homeworkAnswers, setHomeworkAnswers] = useState<Array<{ questionIndex: number; userAnswer: string; isCorrect: boolean }>>([]);
  const [showHomeworkAnswers, setShowHomeworkAnswers] = useState(false);
  const [completedHomeworkData, setCompletedHomeworkData] = useState<AIAnalysisResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationData, setExplanationData] = useState<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    explanation?: string;
    hint?: string;
  } | null>(null);
  // Multiple attempts system: track attempts per question
  const [currentQuestionAttempts, setCurrentQuestionAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [mustAnswerCorrectly, setMustAnswerCorrectly] = useState(false); // After 2nd wrong, must get it right

  // Anti-cheat: Time tracking per question
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [responseTimeData, setResponseTimeData] = useState<Array<{
    questionIndex: number;
    responseTimeMs: number;
    isSuspiciouslyFast: boolean; // < 3 seconds
    isSuspiciouslySlow: boolean; // > 2 minutes
  }>>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Similar questions system (instead of showing answer)
  const [similarQuestion, setSimilarQuestion] = useState<{
    text: string;
    type: "multiple_choice";
    options: string[];
    correct: string;
    explanation: string;
    hint: string;
    isEasier: boolean;
  } | null>(null);
  const [showSimilarQuestion, setShowSimilarQuestion] = useState(false);
  const [loadingSimilarQuestion, setLoadingSimilarQuestion] = useState(false);
  const [originalQuestionIndex, setOriginalQuestionIndex] = useState<number | null>(null); // Track which question we're helping with

  // Verification question - after explanation, verify child truly understood
  const [verificationQuestion, setVerificationQuestion] = useState<{
    text: string;
    type: "multiple_choice";
    options: string[];
    correct: string;
    explanation: string;
    hint: string;
  } | null>(null);
  const [showVerificationQuestion, setShowVerificationQuestion] = useState(false);
  const [loadingVerificationQuestion, setLoadingVerificationQuestion] = useState(false);

  // Store
  const player = useAppStore((state) => state.player);
  const setPlayer = useAppStore((state) => state.setPlayer);
  const currentScreen = useAppStore((state) => state.ui.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const spawnParticles = useAppStore((state) => state.spawnParticles);

  // Modals - Daily Reward uses store state
  const showDailyRewardUI = useAppStore((state) => state.ui.showDailyReward);
  const showDailyRewardModalFn = useAppStore((state) => state.showDailyRewardModal);
  const hideDailyRewardModalFn = useAppStore((state) => state.hideDailyRewardModal);

  // Milestone modal state
  const showMilestoneModalUI = useAppStore((state) => state.ui.showMilestoneModal);
  const milestoneLevel = useAppStore((state) => state.ui.milestoneLevel);
  const showMilestoneModalFn = useAppStore((state) => state.showMilestoneModal);
  const hideMilestoneModalFn = useAppStore((state) => state.hideMilestoneModal);

  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [levelCompleteData, setLevelCompleteData] = useState<{
    levelId: string;
    stars: number;
    rewards: { diamonds: number; emeralds: number; xp: number };
  } | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState<{
    id: string;
    name: string;
    desc: string;
    icon: string;
    reward: { diamonds?: number; emeralds?: number; gold?: number };
  } | null>(null);

  // Mining overlay state
  const [showMiningOverlay, setShowMiningOverlay] = useState(false);
  const [miningDepth, setMiningDepth] = useState(0);
  const { checkGemDrop } = useGemDrop({ playerId, enabled: true });

  // Active mini-game state
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Life Skills Academy state
  const [selectedLifeSkillsChapter, setSelectedLifeSkillsChapter] = useState<Chapter | null>(null);
  const [selectedLifeSkillsLesson, setSelectedLifeSkillsLesson] = useState<number>(0);
  const [currentBossBattle, setCurrentBossBattle] = useState<Chapter | null>(null);

  // Error modal state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use Convex data for completed levels, inventory, and owned items
  const completedLevels = levelProgress;
  const inventory = convexInventory.length > 0
    ? convexInventory.map((item) => ({
        itemId: item.itemId,
        itemType: item.itemType,
        equipped: item.equipped,
      }))
    : [{ itemId: "steve", itemType: "skin", equipped: true }];
  const ownedItems = convexOwnedItems.length > 0 ? convexOwnedItems : ["steve"];

  // Handle Convex loading state and transition to appropriate phase
  useEffect(() => {
    if (!convexLoading && phase === "loading") {
      // Short delay for splash screen
      const timer = setTimeout(() => {
        if (isLoggedIn) {
          setPhase("game");
          // Show daily reward if not claimed
          if (!player.dailyClaimed) {
            setTimeout(() => showDailyRewardModalFn(), 1000);
          }
        } else {
          setPhase("login");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [convexLoading, isLoggedIn, phase, player.dailyClaimed]);

  // Generate weekly quests if player has none
  useEffect(() => {
    if (playerId && weeklyQuestsData && weeklyQuestsData.quests.length === 0) {
      generateWeeklyQuests({ playerId }).catch(err => {
        console.log("Weekly quests generation:", err.message);
      });
    }
  }, [playerId, weeklyQuestsData, generateWeeklyQuests]);

  // Anti-cheat: Track tab switches during gameplay
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlayingAIGame) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          console.warn(`⚠️ Tab switch detected during game! Total: ${newCount}`);
          return newCount;
        });
        // Show warning when player returns to the tab
      } else if (!document.hidden && isPlayingAIGame) {
        // Player returned to tab - show warning if they switched away
        if (tabSwitchCount > 0) {
          setShowTabSwitchWarning(true);
          // Auto-hide after 4 seconds
          setTimeout(() => setShowTabSwitchWarning(false), 4000);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPlayingAIGame, tabSwitchCount]);

  // Game timer - updates every second
  useEffect(() => {
    if (!isPlayingAIGame || !gameStartTime) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayingAIGame, gameStartTime]);

  // Handlers
  const handleLoadingComplete = useCallback(() => {
    if (!convexLoading) {
      if (isLoggedIn) {
        setPhase("game");
      } else {
        setPhase("login");
      }
    }
  }, [convexLoading, isLoggedIn]);

  const handleLogin = useCallback(
    async (name: string, skin: string, ageData?: { ageGroup: string; gradeLevel: number }) => {
      // Create player in Convex with age data
      await initializePlayer(name, skin, ageData);
      setPlayer({ name, skin });
      setPhase("game");
    },
    [initializePlayer, setPlayer]
  );

  const handleLogout = useCallback(() => {
    // Reset to login screen for guest users
    setPhase("login");
    setScreen("home");
  }, [setScreen]);

  const handleStartLevel = useCallback(
    (levelId: string) => {
      setActiveGame(levelId);
    },
    []
  );

  // CAMERA & AI FLOW
  const handleScanHomework = useCallback(() => {
    setShowCamera(true);
  }, []);

  const handlePracticeMode = useCallback(() => {
    setScreen("practice");
  }, [setScreen]);

  const handleOpenAnalytics = useCallback(() => {
    setScreen("analytics");
  }, [setScreen]);

  const handleOpenLearningProfile = useCallback(() => {
    setScreen("learning-profile");
  }, [setScreen]);

  const handleOpenParentSettings = useCallback(() => {
    setScreen("parent-settings");
  }, [setScreen]);

  const handleOpenQuestMap = useCallback(() => {
    setScreen("quest-map");
  }, [setScreen]);

  const handleOpenSpellBook = useCallback(() => {
    setScreen("spell-book");
  }, [setScreen]);

  const handleOpenDashboard = useCallback(() => {
    setScreen("dashboard");
  }, [setScreen]);

  const handleOpenLeaderboard = useCallback(() => {
    setScreen("leaderboard");
  }, [setScreen]);

  const handleOpenShop = useCallback(() => {
    setScreen("shop");
  }, [setScreen]);

  const handleOpenInventory = useCallback(() => {
    setScreen("inventory");
  }, [setScreen]);

  const handleOpenAchievements = useCallback(() => {
    setScreen("achievements");
  }, [setScreen]);

  const handleOpenGemHub = useCallback(() => {
    setScreen("gem-hub");
  }, [setScreen]);

  const handleOpenProfileSettings = useCallback(() => {
    setScreen("profile-settings");
  }, [setScreen]);

  // Handle level click - show milestone modal if there's an unclaimed milestone
  const handleLevelClick = useCallback(() => {
    if (checkMilestoneQuery?.available && checkMilestoneQuery?.milestone) {
      showMilestoneModalFn(checkMilestoneQuery.milestone);
    } else {
      // Show current level info even if no milestone
      showMilestoneModalFn(player.level);
    }
  }, [checkMilestoneQuery, showMilestoneModalFn, player.level]);

  // Handle claiming milestone reward
  const handleClaimMilestone = useCallback(async () => {
    if (!playerId || !milestoneLevel) return;

    try {
      const result = await claimMilestoneReward({ playerId, milestoneLevel, callerClerkId: deviceId });
      if (result?.success && result.rewards) {
        // Spawn celebration particles
        spawnParticles(["🎉", "⭐", "✨", "🏆"]);

        // Update local player state with rewards
        setPlayer({
          diamonds: player.diamonds + result.rewards.diamonds,
          emeralds: player.emeralds + result.rewards.emeralds,
          gold: player.gold + result.rewards.gold,
          permanentXpBoost: result.permanentXpBoost || player.permanentXpBoost,
          shopDiscount: result.shopDiscount || player.shopDiscount,
          milestonesClaimed: [...(player.milestonesClaimed || []), milestoneLevel],
        });
      }
      hideMilestoneModalFn();
    } catch (error) {
      console.error("Failed to claim milestone:", error);
      hideMilestoneModalFn();
    }
  }, [playerId, milestoneLevel, claimMilestoneReward, spawnParticles, setPlayer, player, hideMilestoneModalFn, deviceId]);

  // Play a saved homework session from WEEKLY QUESTS
  const handlePlayHomework = useCallback((homework: {
    _id: Id<"homeworkSessions">;
    subject: string;
    grade: string;
    topics: string[];
    gameName: string;
    gameIcon: string;
    questions: {
      text: string;
      type: string;
      options?: string[];
      correct: string;
      explanation?: string;
      hint?: string;
      pageRef?: number;
    }[];
    userAnswers?: {
      questionIndex: number;
      userAnswer: string;
      isCorrect: boolean;
    }[];
  }) => {
    // VALIDATION: Check if homework has questions
    if (!homework.questions || homework.questions.length === 0) {
      console.error("Homework has no questions:", homework);
      alert("Error: No questions found in homework! Try scanning again.");
      return;
    }

    // VALIDATION: Filter out invalid questions
    const validQuestions = homework.questions.filter(q => {
      // Must have text and correct answer
      if (!q.text || !q.correct) return false;
      // For multiple choice, must have at least 2 options
      if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) return false;
      return true;
    });

    if (validQuestions.length === 0) {
      console.error("No valid questions in homework:", homework);
      alert("Error: Homework questions are invalid! Try scanning again.");
      return;
    }

    // Check if resuming from partial progress
    const savedAnswers = homework.userAnswers || [];
    const isResuming = savedAnswers.length > 0 && savedAnswers.length < validQuestions.length;

    // Convert homework session to AIAnalysisResult format
    // DON'T shuffle if resuming - keep original order to match saved answers
    const mappedQuestions = validQuestions.map(q => {
      const options = generateOptionsForQuestion(q);
      return {
        text: q.text,
        type: options.length >= 2 ? "multiple_choice" as const : q.type as "multiple_choice" | "fill_blank" | "true_false",
        options: isResuming ? options : shuffleArray(options), // Only shuffle on fresh start
        correct: q.correct,
        explanation: q.explanation,
        hint: q.hint,
        pageRef: q.pageRef,
      };
    });

    const gameData: AIAnalysisResult = {
      subject: homework.subject,
      grade: homework.grade,
      topics: homework.topics,
      totalPages: 1,
      gameName: homework.gameName,
      gameIcon: homework.gameIcon,
      questions: isResuming ? mappedQuestions : shuffleArray(mappedQuestions), // Only shuffle on fresh start
    };

    // Set the homework session ID for completion tracking
    setCurrentHomeworkSessionId(homework._id);

    // Calculate progress from saved answers
    const correctCount = savedAnswers.filter(a => a.isCorrect).length;
    const mistakeCount = savedAnswers.filter(a => !a.isCorrect).length;
    const startQuestion = savedAnswers.length; // Start from first unanswered question

    // Start the game
    setAiGameData(gameData);
    setIsPlayingAIGame(true);
    setGameStartTime(Date.now());
    setAiGameProgress({
      current: startQuestion,
      correct: correctCount,
      mistakes: mistakeCount,
    });
    setHomeworkAnswers(savedAnswers); // Load saved answers
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuestionStartTime(Date.now()); // Anti-cheat: Start timer
    setResponseTimeData([]); // Reset response time data
    setTabSwitchCount(0); // Reset tab switch count

    if (isResuming) {
      console.log(`📚 Resuming homework: ${startQuestion}/${validQuestions.length} questions completed`);
    }
  }, []);

  // View answers for a completed homework session (from history)
  const handleViewHomeworkAnswers = useCallback((homework: {
    _id: Id<"homeworkSessions">;
    subject: string;
    grade: string;
    topics: string[];
    gameName: string;
    gameIcon: string;
    questions: {
      text: string;
      type: string;
      options?: string[];
      correct: string;
      explanation?: string;
      hint?: string;
      pageRef?: number;
    }[];
    userAnswers?: {
      questionIndex: number;
      userAnswer: string;
      isCorrect: boolean;
    }[];
  }) => {
    // Must have userAnswers to view
    if (!homework.userAnswers || homework.userAnswers.length === 0) {
      console.error("Homework has no user answers:", homework);
      alert("No answers found for this homework session.");
      return;
    }

    // Convert to the format expected by HomeworkAnswersScreen
    const gameData: AIAnalysisResult = {
      subject: homework.subject,
      grade: homework.grade,
      topics: homework.topics,
      totalPages: 1,
      gameName: homework.gameName,
      gameIcon: homework.gameIcon,
      questions: homework.questions.map(q => ({
        text: q.text,
        type: (q.type as "multiple_choice" | "fill_blank" | "true_false") || "multiple_choice",
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        hint: q.hint,
        pageRef: q.pageRef,
      })),
    };

    // Set up the answers screen data
    setCompletedHomeworkData(gameData);
    setHomeworkAnswers(homework.userAnswers);
    setShowHomeworkAnswers(true);
  }, []);

  const handleStartQuest = useCallback((questId: string, chapterId: number) => {
    // TODO: Start the quest game with the questId
    console.log("Starting quest:", questId, "in chapter:", chapterId);
    // For now, just go back to home
    setScreen("home");
  }, [setScreen]);

  // Life Skills Academy handlers
  const handleOpenLifeSkillsMap = useCallback(async () => {
    // Initialize life skills progress if not already done
    if (playerId && lifeSkillsProgress && !lifeSkillsProgress.wizard) {
      try {
        await initializeLifeSkills({ playerId });
      } catch (err) {
        console.error("Failed to initialize life skills:", err);
      }
    }
    setScreen("life-skills-map");
  }, [playerId, lifeSkillsProgress, initializeLifeSkills, setScreen]);

  const handleSelectLifeSkillsChapter = useCallback((chapter: Chapter) => {
    setSelectedLifeSkillsChapter(chapter);
    setSelectedLifeSkillsLesson(0);
    setScreen("life-skills-lesson");
  }, [setScreen]);

  const handleLifeSkillsLessonComplete = useCallback(async (
    chapterId: string,
    lessonIndex: number,
    stars: number,
    score: number,
    correctAnswers: number,
    totalQuestions: number
  ) => {
    if (!playerId) return;

    try {
      // Save lesson progress
      await completeLessonMutation({
        playerId,
        chapterId,
        lessonId: `${chapterId}_lesson_${lessonIndex}`,
        stars,
        score,
        correctAnswers,
        totalQuestions,
      });

      // Award diamonds based on stars
      const diamondsToAward = stars * 10;
      await awardCurrency("diamonds", diamondsToAward);
      spawnParticles(["💎", "✨", "⭐"]);

      // Check if all lessons complete - start boss battle
      const chapter = getChapterById(chapterId);
      if (chapter && lessonIndex >= chapter.lessons.length - 1) {
        // All lessons complete, start boss battle
        setCurrentBossBattle(chapter);
        setScreen("life-skills-boss");
      } else {
        // Move to next lesson
        setSelectedLifeSkillsLesson(lessonIndex + 1);
      }
    } catch (err) {
      console.error("Failed to save lesson progress:", err);
    }
  }, [playerId, completeLessonMutation, awardCurrency, spawnParticles, setScreen]);

  const handleBossBattleComplete = useCallback(async (victory: boolean, chapterId: string) => {
    if (!playerId) return;

    try {
      const result = await completeBossBattleMutation({
        playerId,
        chapterId,
        victory,
      });

      if (victory && result.victory) {
        // Award bonus rewards
        await awardCurrency("diamonds", 50);
        spawnParticles(["💎", "🏆", "✨", "🎉"]);
      }

      // Return to map
      setCurrentBossBattle(null);
      setSelectedLifeSkillsChapter(null);
      setScreen("life-skills-map");
    } catch (err) {
      console.error("Failed to complete boss battle:", err);
    }
  }, [playerId, completeBossBattleMutation, awardCurrency, spawnParticles, setScreen]);

  const handleLifeSkillsBack = useCallback(() => {
    if (currentBossBattle) {
      setCurrentBossBattle(null);
    }
    if (selectedLifeSkillsChapter) {
      setSelectedLifeSkillsChapter(null);
      setScreen("life-skills-map");
    } else {
      setScreen("home");
    }
  }, [currentBossBattle, selectedLifeSkillsChapter, setScreen]);

  // Start a practice quest from WeeklyQuestsScreen
  const handleStartPracticeQuest = useCallback((questId: Id<"weeklyPracticeQuests">) => {
    // Find the quest in weeklyQuestsData
    const quest = weeklyQuestsData?.quests?.find(q => q._id === questId);
    if (!quest) {
      console.error("Practice quest not found:", questId);
      return;
    }

    // Check if already completed
    if (quest.isCompleted) {
      alert("This practice quest is already completed!");
      return;
    }

    // Convert practice quest to AIAnalysisResult format
    // Shuffle questions and options for variety
    const mappedQuestions = quest.questions.map(q => ({
      text: q.text,
      type: q.type as "multiple_choice" | "fill_blank" | "true_false",
      options: q.options ? shuffleArray(q.options) : undefined,
      correct: q.correct,
      explanation: q.explanation,
    }));

    const gameData: AIAnalysisResult = {
      subject: quest.subject,
      grade: "Practice",
      topics: [quest.topic],
      totalPages: 1,
      gameName: quest.questName,
      gameIcon: quest.questIcon,
      questions: shuffleArray(mappedQuestions),
    };

    // Set the practice quest ID for progress tracking
    setCurrentPracticeQuestId(questId);
    setCurrentHomeworkSessionId(null); // Clear any homework session

    // Start the game
    setAiGameData(gameData);
    setIsPlayingAIGame(true);
    setGameStartTime(Date.now());
    setAiGameProgress({ current: 0, correct: 0, mistakes: 0 });
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuestionStartTime(Date.now()); // Anti-cheat: Start timer
    setResponseTimeData([]); // Reset response time data
    setTabSwitchCount(0); // Reset tab switch count
  }, [weeklyQuestsData]);

  // Start a Spaced Repetition review session
  const handleStartReview = useCallback(async (topic: string, subject: string, srsId?: Id<"spacedRepetition">) => {
    if (!playerId) return;

    setIsLoadingReview(true);
    setCurrentReviewSession({ topic, subject, srsId });

    try {
      // Generate questions via API
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subject,
          difficulty: "medium",
          playerContext: {
            // Add player context for better personalization
            gradeLevel: 5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate review questions");
      }

      const data = await response.json();

      // Convert to AIAnalysisResult format with shuffled questions
      const mappedQuestions = data.questions.map((q: { text: string; type: string; options?: string[]; correct: string; explanation: string; hint?: string }) => ({
        text: q.text,
        type: q.type as "multiple_choice" | "fill_blank" | "true_false",
        options: q.options ? shuffleArray(q.options) : [],
        correct: q.correct,
        explanation: q.explanation,
        hint: q.hint,
      }));

      const gameData: AIAnalysisResult = {
        subject,
        grade: "Review",
        topics: [topic],
        totalPages: 1,
        gameName: `Review: ${topic}`,
        gameIcon: "🔄",
        questions: shuffleArray(mappedQuestions),
      };

      // Clear other session types
      setCurrentPracticeQuestId(null);
      setCurrentHomeworkSessionId(null);

      // Start the review game
      setAiGameData(gameData);
      setIsPlayingAIGame(true);
      setGameStartTime(Date.now());
      setAiGameProgress({ current: 0, correct: 0, mistakes: 0 });
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(Date.now()); // Anti-cheat: Start timer
      setResponseTimeData([]); // Reset response time data
      setTabSwitchCount(0); // Reset tab switch count

    } catch (error) {
      console.error("Error starting review:", error);
      setCurrentReviewSession(null);
      alert("Failed to load review questions. Please try again.");
    } finally {
      setIsLoadingReview(false);
    }
  }, [playerId]);

  const handleCameraCapture = useCallback((images: string[]) => {
    setCapturedImages(images);
    setShowCamera(false);
    setShowAIProcessing(true);
  }, []);

  const handleCameraCancel = useCallback(() => {
    setShowCamera(false);
  }, []);

  const handleAIComplete = useCallback(async (result: AIAnalysisResult) => {
    // Process questions to ensure they have proper options
    // Shuffle both question order and option order for variety
    const processedQuestions = result.questions.map(q => {
      const options = generateOptionsForQuestion(q);
      return {
        ...q,
        type: options.length >= 2 ? "multiple_choice" as const : q.type,
        options: shuffleArray(options), // Shuffle options
      };
    });

    // Shuffle question order
    const shuffledQuestions = shuffleArray(processedQuestions);

    const processedResult: AIAnalysisResult = {
      ...result,
      questions: shuffledQuestions,
    };

    // Check for duplicates and save homework session
    try {
      const response = await createHomeworkSession({
        playerId: playerId || undefined,
        guestId: playerId ? undefined : `guest_${Date.now()}`,
        imageUrls: capturedImages,
        totalPages: capturedImages.length,
        subject: result.subject,
        grade: result.grade,
        topics: result.topics,
        gameName: result.gameName,
        gameIcon: result.gameIcon,
        questions: processedQuestions.map(q => ({
          text: q.text,
          type: q.type,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
          hint: q.hint,
          pageRef: q.pageRef,
        })),
        difficulty: result.difficulty ? {
          gradeLevel: result.difficulty.gradeLevel,
          multiplier: result.difficulty.multiplier,
          topics: result.difficulty.topics,
          analyzedByAI: true,
        } : undefined,
      });

      // Handle duplicate detection response
      if (response && typeof response === 'object' && 'isDuplicate' in response) {
        if (response.isDuplicate && response.originalSession) {
          // Show duplicate dialog - user needs to choose
          setPendingHomeworkData(processedResult);
          setDuplicateSessionInfo(response.originalSession as typeof duplicateSessionInfo);
          setShowAIProcessing(false);
          setShowDuplicateDialog(true);
          return; // Don't start game yet
        }
        // Not a duplicate or already handled - set session ID
        setCurrentHomeworkSessionId(response.sessionId || null);
      } else {
        // Legacy response format (just session ID)
        setCurrentHomeworkSessionId(response as Id<"homeworkSessions"> | null);
      }
    } catch (error) {
      console.error("Failed to save homework session:", error);
    }

    // Start the game
    setAiGameData(processedResult);
    setShowAIProcessing(false);
    setIsPlayingAIGame(true);
    setGameStartTime(Date.now());
    setIsPracticeMode(false);
    setAiGameProgress({ current: 0, correct: 0, mistakes: 0 });
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuestionStartTime(Date.now());
    setResponseTimeData([]);
    setTabSwitchCount(0);
  }, [createHomeworkSession, playerId, capturedImages, duplicateSessionInfo]);

  const handleAIError = useCallback((error: string) => {
    setErrorMessage(error);
    setShowAIProcessing(false);
    setCapturedImages([]);
  }, []);

  // Handle practice mode selection from duplicate dialog
  const handlePracticeModeSelect = useCallback(async () => {
    if (!pendingHomeworkData || !duplicateSessionInfo) return;

    setShowDuplicateDialog(false);

    // Create session in practice mode
    try {
      const response = await createHomeworkSession({
        playerId: playerId || undefined,
        guestId: playerId ? undefined : `guest_${Date.now()}`,
        imageUrls: capturedImages,
        totalPages: capturedImages.length,
        subject: pendingHomeworkData.subject,
        grade: pendingHomeworkData.grade,
        topics: pendingHomeworkData.topics,
        gameName: pendingHomeworkData.gameName,
        gameIcon: pendingHomeworkData.gameIcon,
        questions: pendingHomeworkData.questions.map(q => ({
          text: q.text,
          type: q.type,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
          hint: q.hint,
          pageRef: q.pageRef,
        })),
        difficulty: pendingHomeworkData.difficulty ? {
          gradeLevel: pendingHomeworkData.difficulty.gradeLevel,
          multiplier: pendingHomeworkData.difficulty.multiplier,
          topics: pendingHomeworkData.difficulty.topics,
          analyzedByAI: true,
        } : undefined,
        isPracticeMode: true,
        originalSessionId: duplicateSessionInfo._id as Id<"homeworkSessions">,
      });

      if (response && typeof response === 'object' && 'sessionId' in response) {
        setCurrentHomeworkSessionId(response.sessionId || null);
      }
    } catch (error) {
      console.error("Failed to create practice session:", error);
    }

    // Start game in practice mode
    setAiGameData(pendingHomeworkData);
    setIsPlayingAIGame(true);
    setGameStartTime(Date.now());
    setIsPracticeMode(true); // 25% rewards
    setAiGameProgress({ current: 0, correct: 0, mistakes: 0 });
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuestionStartTime(Date.now());
    setResponseTimeData([]);
    setTabSwitchCount(0);
    setPendingHomeworkData(null);
    setDuplicateSessionInfo(null);
  }, [pendingHomeworkData, duplicateSessionInfo, createHomeworkSession, playerId, capturedImages]);

  // Handle "scan new homework" from duplicate dialog
  const handleScanNewFromDialog = useCallback(() => {
    setShowDuplicateDialog(false);
    setPendingHomeworkData(null);
    setDuplicateSessionInfo(null);
    setCapturedImages([]);
    setShowCamera(true); // Go back to camera
  }, []);

  // Close duplicate dialog
  const handleCloseDuplicateDialog = useCallback(() => {
    setShowDuplicateDialog(false);
    setPendingHomeworkData(null);
    setDuplicateSessionInfo(null);
    setCapturedImages([]);
  }, []);

  // Handle answer selection in AI game - Multiple attempts system
  const handleAnswerSelect = useCallback(
    async (answer: string) => {
      if (showFeedback || !aiGameData) return;

      // Anti-cheat: Record response time (only on first attempt per question)
      if (questionStartTime && currentQuestionAttempts === 0) {
        const responseTime = Date.now() - questionStartTime;
        const isSuspiciouslyFast = responseTime < 3000; // Less than 3 seconds
        const isSuspiciouslySlow = responseTime > 120000; // More than 2 minutes

        setResponseTimeData(prev => [...prev, {
          questionIndex: aiGameProgress.current,
          responseTimeMs: responseTime,
          isSuspiciouslyFast,
          isSuspiciouslySlow,
        }]);

        // Log suspicious activity for debugging
        if (isSuspiciouslyFast) {
          console.warn(`⚠️ Suspiciously fast answer: ${responseTime}ms for question ${aiGameProgress.current + 1}`);
        }
        if (isSuspiciouslySlow) {
          console.warn(`⚠️ Suspiciously slow answer: ${Math.round(responseTime / 1000)}s for question ${aiGameProgress.current + 1}`);
        }
      }

      setSelectedAnswer(answer);
      const currentQ = aiGameData.questions[aiGameProgress.current];

      // Smart answer comparison to handle multiple formats:
      // - Direct match: "Perfect and without any mistakes" === "Perfect and without any mistakes"
      // - Letter match: "E) Perfect..." starts with "E" (when correct is just a letter)
      // - Text match: "E) Perfect..." contains "Perfect..." (when correct is the text without letter)
      const answerLower = answer.toLowerCase().trim();
      const correctLower = currentQ.correct.toLowerCase().trim();

      // Extract letter prefix if present (e.g., "E)" from "E) Perfect...")
      const answerLetterMatch = answerLower.match(/^([a-e])\)/);
      const answerLetter = answerLetterMatch ? answerLetterMatch[1] : null;
      const answerTextOnly = answerLower.replace(/^[a-e]\)\s*/, '');

      // Check if correct is just a letter (A, B, C, D, E)
      const correctIsJustLetter = /^[a-e]\.?$/.test(correctLower);
      const correctLetter = correctIsJustLetter ? correctLower.replace('.', '') : null;
      const correctTextOnly = correctLower.replace(/^[a-e]\)\s*/, '');

      const isCorrect =
        answerLower === correctLower || // Direct match
        (answerLetter && correctLetter && answerLetter === correctLetter) || // Letter matches letter
        (answerLetter && answerLetter === correctLower.charAt(0) && correctIsJustLetter) || // Answer letter matches correct letter
        answerTextOnly === correctTextOnly || // Text without letters matches
        answerTextOnly === correctLower || // Answer text matches full correct
        answerLower === correctTextOnly; // Full answer matches correct text

      setFeedbackCorrect(isCorrect);
      setShowFeedback(true);

      // Track practice quest progress if playing a practice quest (only on first attempt)
      if (currentPracticeQuestId && currentQuestionAttempts === 0) {
        try {
          await answerPracticeQuestion({
            questId: currentPracticeQuestId,
            questionIndex: aiGameProgress.current,
            answer,
            isCorrect,
          });
        } catch (err) {
          console.error("Failed to track practice quest progress:", err);
        }
      }

      // Update topic progress for adaptive learning (only on first attempt)
      if (playerId && aiGameData && currentQuestionAttempts === 0) {
        try {
          const topic = detectTopic(currentQ.text, aiGameData.subject);
          await updateTopicProgress({
            playerId,
            topic,
            subject: aiGameData.subject,
            isCorrect,
          });
        } catch (err) {
          console.error("Failed to update topic progress:", err);
        }
      }

      if (isCorrect) {
        // Track final answer for homework summary (correct after any attempts)
        if (currentHomeworkSessionId) {
          // Calculate new answers for both state and database
          const newAnswer = {
            questionIndex: aiGameProgress.current,
            userAnswer: answer,
            isCorrect: true,
          };

          setHomeworkAnswers(prev => {
            const filtered = prev.filter(a => a.questionIndex !== aiGameProgress.current);
            const updatedAnswers = [...filtered, newAnswer];

            // Save partial progress to database (fire and forget)
            savePartialProgress({
              sessionId: currentHomeworkSessionId,
              userAnswers: updatedAnswers,
              callerClerkId: deviceId || undefined,
            }).catch(err => console.error("Failed to save partial progress:", err));

            return updatedAnswers;
          });
        }

        // Award currency based on attempts
        // 1st try correct = 5 diamonds, 2nd try = 2 diamonds, after explanation = 0
        const reward = currentQuestionAttempts === 0 ? 5 : currentQuestionAttempts === 1 ? 2 : 0;
        if (reward > 0) {
          await awardCurrency("diamonds", reward);
          spawnParticles(reward === 5 ? ["💎", "✨"] : ["💎"]);
        }

        // Add word to Spell Book (for language subjects) - only on first attempt
        if (playerId && aiGameData && currentQuestionAttempts === 0) {
          try {
            const wordData = extractWordFromQuestion(currentQ, aiGameData.subject);
            if (wordData) {
              await addToSpellBook({
                playerId,
                word: wordData.word,
                category: wordData.category,
                definition: wordData.definition,
                exampleSentence: currentQ.text,
              });
              // Update word_collector daily quest
              await updateDailyQuestProgress({
                playerId,
                questType: "word_collector",
                increment: 1,
              });
            }
          } catch (err) {
            console.error("Failed to add word to spell book:", err);
          }

          // Update morning_practice daily quest (correct answer on first try)
          try {
            await updateDailyQuestProgress({
              playerId,
              questType: "morning_practice",
              increment: 1,
            });
          } catch (err) {
            console.error("Failed to update morning_practice quest:", err);
          }
        }

        // Reset attempt state and move to next question (or show verification)
        setTimeout(async () => {
          setShowFeedback(false);
          setShowHint(false);
          setCurrentHint(null);

          // If they were in mustAnswerCorrectly mode (saw explanation),
          // generate a VERIFICATION question to ensure they truly understood
          if (mustAnswerCorrectly && aiGameData) {
            setLoadingVerificationQuestion(true);
            try {
              const topic = detectTopic(currentQ.text, aiGameData.subject);
              const response = await fetch("/api/similar-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  originalQuestion: currentQ.text,
                  originalCorrect: currentQ.correct,
                  topic,
                  subject: aiGameData.subject,
                  wrongAnswer: "", // Not relevant for verification
                  difficulty: "same", // Same difficulty, different question
                }),
              });

              const data = await response.json();
              if (data.success && data.question) {
                setVerificationQuestion(data.question);
                setShowVerificationQuestion(true);
                setLoadingVerificationQuestion(false);
                setMustAnswerCorrectly(false);
                setCurrentQuestionAttempts(0);
                return; // Don't move to next question yet
              }
            } catch (err) {
              console.error("Failed to generate verification question:", err);
            }
            setLoadingVerificationQuestion(false);
          }

          // Normal flow - move to next question
          setMustAnswerCorrectly(false);
          setCurrentQuestionAttempts(0);
          moveToNextQuestion(currentQuestionAttempts === 0); // Only count as "correct" if first try
        }, 1200);
      } else {
        // WRONG ANSWER - Multiple attempts system
        const newAttempts = currentQuestionAttempts + 1;
        setCurrentQuestionAttempts(newAttempts);

        // Track homework answer only on first wrong attempt
        if (currentHomeworkSessionId && currentQuestionAttempts === 0) {
          const newAnswer = {
            questionIndex: aiGameProgress.current,
            userAnswer: answer,
            isCorrect: false,
          };

          setHomeworkAnswers(prev => {
            const updatedAnswers = [...prev, newAnswer];

            // Save partial progress to database (fire and forget)
            savePartialProgress({
              sessionId: currentHomeworkSessionId,
              userAnswers: updatedAnswers,
              callerClerkId: deviceId || undefined,
            }).catch(err => console.error("Failed to save partial progress:", err));

            return updatedAnswers;
          });
        }

        // Track error only on first wrong attempt
        if (playerId && aiGameData && currentQuestionAttempts === 0) {
          try {
            const topic = detectTopic(currentQ.text, aiGameData.subject);
            await trackError({
              playerId,
              topic,
              subject: aiGameData.subject,
              errorType: detectErrorType(currentQ.text, answer, currentQ.correct),
              question: currentQ.text,
              wrongAnswer: answer,
              correctAnswer: currentQ.correct,
              source: "homework",
              homeworkSessionId: currentHomeworkSessionId || undefined,
            });
          } catch (err) {
            console.error("Failed to track error:", err);
          }
        }

        if (newAttempts === 1) {
          // FIRST WRONG: Show hint and let them try again
          setTimeout(() => {
            setShowFeedback(false);
            setSelectedAnswer(null);
            setCurrentHint(currentQ.hint || "Think about this more carefully...");
            setShowHint(true);
          }, 1000);
        } else if (newAttempts === 2) {
          // SECOND WRONG: Generate a SIMILAR EASIER question instead of showing the answer!
          // This helps the child understand the concept through practice, not just memorization
          setTimeout(async () => {
            setShowFeedback(false);
            setLoadingSimilarQuestion(true);
            setOriginalQuestionIndex(aiGameProgress.current);

            try {
              const topic = detectTopic(currentQ.text, aiGameData.subject);
              const response = await fetch("/api/similar-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  originalQuestion: currentQ.text,
                  originalCorrect: currentQ.correct,
                  topic,
                  subject: aiGameData.subject,
                  wrongAnswer: answer,
                  difficulty: "easier",
                }),
              });

              const data = await response.json();
              if (data.success && data.question) {
                setSimilarQuestion(data.question);
                setShowSimilarQuestion(true);
                setLoadingSimilarQuestion(false);
              } else {
                // Fallback to old behavior if AI fails
                setLoadingSimilarQuestion(false);
                setExplanationData({
                  question: currentQ.text,
                  userAnswer: answer,
                  correctAnswer: currentQ.correct,
                  explanation: currentQ.explanation,
                  hint: currentQ.hint,
                });
                setShowExplanation(true);
                setMustAnswerCorrectly(true);
              }
            } catch (err) {
              console.error("Failed to generate similar question:", err);
              // Fallback to old behavior
              setLoadingSimilarQuestion(false);
              setExplanationData({
                question: currentQ.text,
                userAnswer: answer,
                correctAnswer: currentQ.correct,
                explanation: currentQ.explanation,
                hint: currentQ.hint,
              });
              setShowExplanation(true);
              setMustAnswerCorrectly(true);
            }
          }, 1000);
        } else {
          // 3+ WRONG (mustAnswerCorrectly mode): Keep showing they need to pick correct
          setTimeout(() => {
            setShowFeedback(false);
            setSelectedAnswer(null);
            // Find the correct option to display in hint
            const correctLower = currentQ.correct.toLowerCase().trim();
            const correctIsJustLetter = /^[a-e]\.?$/.test(correctLower);
            let correctOptionText = currentQ.correct;

            // If correct is just a letter, find the matching option
            if (correctIsJustLetter && currentQ.options) {
              const letter = correctLower.replace('.', '');
              const matchingOption = currentQ.options.find(opt =>
                opt.toLowerCase().trim().startsWith(letter + ')')
              );
              if (matchingOption) {
                correctOptionText = matchingOption;
              }
            }

            setCurrentHint(`The correct answer is: ${correctOptionText}. Select it to continue!`);
            setShowHint(true);
          }, 800);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aiGameData, aiGameProgress, showFeedback, awardCurrency, spawnParticles, playerId, trackError, currentHomeworkSessionId, addToSpellBook, currentPracticeQuestId, answerPracticeQuestion, updateTopicProgress, currentQuestionAttempts, questionStartTime, updateDailyQuestProgress]
  );

  // Move to next question helper
  const moveToNextQuestion = useCallback(
    async (wasCorrect: boolean) => {
      if (!aiGameData) return;

      const newProgress = {
        current: aiGameProgress.current + 1,
        correct: aiGameProgress.correct + (wasCorrect ? 1 : 0),
        mistakes: aiGameProgress.mistakes + (wasCorrect ? 0 : 1),
      };
      setAiGameProgress(newProgress);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(Date.now()); // Anti-cheat: Reset timer for next question

      // Update streak_keeper daily quest (each question ~1 minute of play)
      if (playerId) {
        try {
          await updateDailyQuestProgress({
            playerId,
            questType: "streak_keeper",
            increment: 1,
          });
        } catch (err) {
          console.error("Failed to update streak_keeper quest:", err);
        }
      }

      // Check if game is complete
      if (newProgress.current >= aiGameData.questions.length) {
        const stars = newProgress.mistakes === 0 ? 3 : newProgress.mistakes <= 2 ? 2 : 1;

        // Calculate time bonus
        const expectedTimePerQuestion = 90; // 1.5 minutes per question
        const totalQuestions = aiGameData.questions.length;
        const expectedTotalSeconds = totalQuestions * expectedTimePerQuestion;
        const actualTimeSeconds = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : expectedTotalSeconds;

        // Speed bonus: +50% if under 50% time, +25% if under expected time
        let speedBonus = 1.0;
        let speedBonusLabel = "";
        if (actualTimeSeconds <= expectedTotalSeconds * 0.5) {
          speedBonus = 1.5; // +50% for super speed
          speedBonusLabel = "⚡ SPEED BONUS +50%!";
        } else if (actualTimeSeconds <= expectedTotalSeconds) {
          speedBonus = 1.25; // +25% for finishing on time
          speedBonusLabel = "🎯 TIME BONUS +25%!";
        }

        // Practice mode: 25% rewards, no leaderboard points
        // Anti-cheat penalty: 50% rewards if 3+ tab switches
        const practiceMultiplier = isPracticeMode ? 0.25 : 1.0;
        const antiCheatPenalty = tabSwitchCount >= 3 ? 0.5 : 1.0;
        const rewardMultiplier = practiceMultiplier * antiCheatPenalty * speedBonus;

        const baseRewards = {
          diamonds: isPracticeMode ? 0 : 50 + newProgress.correct * 10,
          emeralds: isPracticeMode ? 0 : 20 + stars * 5,
          xp: 100 + newProgress.correct * 20,
        };

        const rewards = {
          diamonds: Math.round(baseRewards.diamonds * antiCheatPenalty * speedBonus), // Apply penalty + bonus
          emeralds: Math.round(baseRewards.emeralds * antiCheatPenalty * speedBonus), // Apply penalty + bonus
          xp: Math.round(baseRewards.xp * rewardMultiplier), // Apply all multipliers
        };

        // Show speed bonus particles if earned
        if (speedBonus > 1.0) {
          spawnParticles(["⚡", "🎯", "💨", "🏃"]);
        }

        // Calculate session stats for normalized scoring
        const accuracy = totalQuestions > 0 ? Math.round((newProgress.correct / totalQuestions) * 100) : 0;
        // Include difficulty multiplier from AI analysis (default 1.0 if not available)
        const difficultyMultiplier = aiGameData.difficulty?.multiplier || 1.0;
        const sessionStats = {
          accuracy,
          questionsAnswered: totalQuestions,
          difficultyMultiplier,
          isPracticeMode, // Pass to scoring to skip weekly/monthly updates
        };

        // Complete level via Convex and check for achievements
        const newAchievements = await completeLevelSync("ai-game", stars, newProgress.correct, rewards, sessionStats);

        // Record activity for streak tracking
        if (playerId) {
          try {
            await recordActivity({ playerId });
          } catch (err) {
            console.error("Failed to record activity for streak:", err);
          }
        }

        // Mark homework session as completed and save answers
        if (currentHomeworkSessionId) {
          try {
            // Calculate anti-cheat metrics
            const suspiciouslyFastAnswers = responseTimeData.filter(r => r.isSuspiciouslyFast).length;
            const suspiciouslySlowAnswers = responseTimeData.filter(r => r.isSuspiciouslySlow).length;
            const totalTimeMs = responseTimeData.reduce((sum, r) => sum + r.responseTimeMs, 0);
            const averageResponseTimeMs = responseTimeData.length > 0
              ? Math.round(totalTimeMs / responseTimeData.length)
              : 0;

            await completeHomeworkSession({
              sessionId: currentHomeworkSessionId,
              score: newProgress.correct,
              stars,
              userAnswers: homeworkAnswers,
              antiCheatData: {
                tabSwitchCount,
                suspiciouslyFastAnswers,
                suspiciouslySlowAnswers,
                averageResponseTimeMs,
                totalTimeMs,
              },
            });
            // Save data for the answers summary screen
            setCompletedHomeworkData(aiGameData);

            // Update daily quest progress for homework completion
            if (playerId) {
              try {
                await updateDailyQuestProgress({
                  playerId,
                  questType: "homework",
                  increment: 1,
                });
              } catch (err) {
                console.error("Failed to update daily quest progress:", err);
              }
            }

            // Send parent notification about homework completion
            const notifAccuracy = totalQuestions > 0 ? Math.round((newProgress.correct / totalQuestions) * 100) : 0;
            const starEmoji = "⭐".repeat(stars);
            const timeMinutes = Math.round(actualTimeSeconds / 60);
            const expectedMinutes = Math.round(expectedTotalSeconds / 60);
            let notifMessage = `📚 <b>Homework Complete!</b>\n\n`;
            notifMessage += `${player.name} finished their <b>${aiGameData.subject}</b> homework!\n\n`;
            notifMessage += `📊 <b>Results:</b>\n`;
            notifMessage += `• Score: ${newProgress.correct}/${totalQuestions} (${notifAccuracy}%)\n`;
            notifMessage += `• Stars: ${starEmoji}\n`;
            notifMessage += `• Time: ${timeMinutes} min (expected: ${expectedMinutes} min)\n`;

            // Add speed bonus info
            if (speedBonusLabel) {
              notifMessage += `• ${speedBonusLabel}\n`;
            }
            notifMessage += `\n`;

            // Add anti-cheat warning if suspicious activity detected
            if (tabSwitchCount > 0 || suspiciouslyFastAnswers > 2) {
              notifMessage += `⚠️ <b>Activity Note:</b>\n`;
              if (tabSwitchCount > 0) {
                notifMessage += `• Switched tabs ${tabSwitchCount} time(s)\n`;
              }
              if (suspiciouslyFastAnswers > 2) {
                notifMessage += `• ${suspiciouslyFastAnswers} very fast answers (&lt;3s)\n`;
              }
              notifMessage += `\n`;
            }

            if (accuracy >= 80) notifMessage += `🎉 Excellent work!`;
            else if (accuracy >= 60) notifMessage += `👍 Good effort!`;
            else notifMessage += `💪 Keep practicing!`;
            sendParentNotification(notifMessage);
          } catch (error) {
            console.error("Failed to complete homework session:", error);
          }
        }

        // Update words learned
        await addWordsLearned(newProgress.correct);

        // Update Spaced Repetition if this was a review session
        if (currentReviewSession && playerId) {
          try {
            // Calculate quality score (0-5) based on accuracy
            // 0-1: complete blackout, 2: wrong but recognized, 3: correct with difficulty
            // 4: correct after hesitation, 5: perfect recall
            const quality = accuracy >= 90 ? 5 : accuracy >= 70 ? 4 : accuracy >= 50 ? 3 : accuracy >= 30 ? 2 : 1;

            await updateSpacedRepetition({
              playerId,
              topic: currentReviewSession.topic,
              subject: currentReviewSession.subject,
              quality,
            });

            console.log(`SRS updated: ${currentReviewSession.topic} with quality ${quality}`);
          } catch (error) {
            console.error("Failed to update SRS:", error);
          }
          setCurrentReviewSession(null);
        }

        // Show achievement if any were unlocked
        if (newAchievements && newAchievements.length > 0) {
          const achievement = newAchievements[0] as {
            id: string;
            name: string;
            desc: string;
            icon: string;
            reward: { diamonds?: number; emeralds?: number; gold?: number };
          };
          setAchievementData(achievement);
          setTimeout(() => setShowAchievement(true), 500);

          // Send parent notification about achievement
          sendParentNotification(`🏆 <b>Achievement Unlocked!</b>\n\n${player.name} earned a new achievement:\n\n${achievement.icon} <b>${achievement.name}</b>\n\n🎉 Great job!`);
        }

        setLevelCompleteData({
          levelId: "ai-game",
          stars,
          rewards,
        });
        setShowLevelComplete(true);
        setIsPlayingAIGame(false);
        // Don't clear homework data yet - we'll show the answers screen
        if (!currentHomeworkSessionId) {
          setCurrentPracticeQuestId(null);
        }
        spawnParticles(["💎", "🟢", "⭐"]);
      }
    },
    [aiGameData, aiGameProgress, completeLevelSync, addWordsLearned, spawnParticles, currentHomeworkSessionId, completeHomeworkSession, homeworkAnswers, sendParentNotification, player.name, currentReviewSession, updateSpacedRepetition, playerId, recordActivity, updateDailyQuestProgress]
  );

  // Handle continue from explanation screen - now returns to question for retry
  const handleExplanationContinue = useCallback(() => {
    setShowExplanation(false);
    setExplanationData(null);
    setSelectedAnswer(null);
    // Don't move to next question - child must answer correctly now
    // mustAnswerCorrectly is already set to true - show encouraging hint without revealing answer
    if (aiGameData) {
      const currentQ = aiGameData.questions[aiGameProgress.current];
      // Don't show the answer - let them figure it out from what they learned
      setCurrentHint(currentQ.hint || "Think about the explanation you just read. You can do it!");
      setShowHint(true);
    }
  }, [aiGameData, aiGameProgress]);

  // Handle similar question answer - when child answers the easier practice question
  const handleSimilarQuestionAnswer = useCallback((answer: string) => {
    if (!similarQuestion) return;

    const isCorrect = answer.toLowerCase().trim() === similarQuestion.correct.toLowerCase().trim();

    if (isCorrect) {
      // Good job on the similar question! Now go back to the original
      setShowSimilarQuestion(false);
      setSimilarQuestion(null);
      setSelectedAnswer(null);

      // Give encouraging hint and let them try the original question again
      if (aiGameData && originalQuestionIndex !== null) {
        const originalQ = aiGameData.questions[originalQuestionIndex];
        setCurrentHint(`Great job! Now try the original question again. Think about what you just learned!`);
        setShowHint(true);
      }
    } else {
      // Even the easier question is hard - show explanation and the correct answer for original
      setShowSimilarQuestion(false);
      setSimilarQuestion(null);

      if (aiGameData && originalQuestionIndex !== null) {
        const originalQ = aiGameData.questions[originalQuestionIndex];
        setExplanationData({
          question: originalQ.text,
          userAnswer: answer,
          correctAnswer: originalQ.correct,
          explanation: originalQ.explanation || similarQuestion.explanation,
          hint: originalQ.hint,
        });
        setShowExplanation(true);
        setMustAnswerCorrectly(true);
      }
    }
  }, [similarQuestion, aiGameData, originalQuestionIndex]);

  // Handle verification question answer - verifies child truly understood the concept
  const handleVerificationQuestionAnswer = useCallback((answer: string) => {
    if (!verificationQuestion) return;

    const isCorrect = answer.toLowerCase().trim() === verificationQuestion.correct.toLowerCase().trim();

    if (isCorrect) {
      // Great! They truly understood - move to next question
      setShowVerificationQuestion(false);
      setVerificationQuestion(null);
      setSelectedAnswer(null);

      // Show success message briefly
      setFeedbackCorrect(true);
      setShowFeedback(true);

      setTimeout(() => {
        setShowFeedback(false);
        moveToNextQuestion(false); // Don't count as first-try correct
      }, 1000);
    } else {
      // They didn't understand - show hint and let them try again
      setSelectedAnswer(null);
      setCurrentHint(verificationQuestion.hint || "Think carefully about what you learned!");
      setShowHint(true);

      // Show wrong feedback briefly
      setFeedbackCorrect(false);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 800);
    }
  }, [verificationQuestion, moveToNextQuestion]);

  // Handle mining complete
  const handleMiningComplete = useCallback((gemsFound: { gemType: string; isWhole: boolean; rarity: string }[]) => {
    setShowMiningOverlay(false);
    // Update depth for next time
    setMiningDepth((d) => d + 3);
    // Move to next question
    moveToNextQuestion(true);
  }, [moveToNextQuestion]);

  // Handle gem drop during mining
  const handleMiningDig = useCallback(async () => {
    if (!playerId) return null;
    const result = await checkGemDrop(player.streak, 1, "mining");
    return result;
  }, [playerId, checkGemDrop, player.streak]);

  // Text-to-speech for questions
  const speakQuestion = useCallback((text: string, options?: string[]) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      setIsSpeaking(true);

      // Speak the question
      const questionUtterance = new SpeechSynthesisUtterance(text);
      questionUtterance.rate = 0.85;
      questionUtterance.pitch = 1.0;

      // If there are options, speak them too
      if (options && options.length > 0) {
        questionUtterance.onend = () => {
          setTimeout(() => {
            const optionsText = "Options: " + options.join(", ");
            const optionsUtterance = new SpeechSynthesisUtterance(optionsText);
            optionsUtterance.rate = 0.85;
            optionsUtterance.pitch = 1.0;
            optionsUtterance.onend = () => setIsSpeaking(false);
            optionsUtterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(optionsUtterance);
          }, 300);
        };
      } else {
        questionUtterance.onend = () => setIsSpeaking(false);
      }

      questionUtterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(questionUtterance);
    }
  }, []);

  // Stop speech when component unmounts or game exits
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleExitAIGame = useCallback(() => {
    setIsPlayingAIGame(false);
    setAiGameData(null);
    setCapturedImages([]);
    setCurrentPracticeQuestId(null);
    setCurrentHomeworkSessionId(null);
    // Reset attempt tracking state
    setCurrentQuestionAttempts(0);
    setShowHint(false);
    setCurrentHint(null);
    setMustAnswerCorrectly(false);
    setGameStartTime(null);
    setHomeworkAnswers([]);
    // Reset similar/verification question state
    setSimilarQuestion(null);
    setShowSimilarQuestion(false);
    setVerificationQuestion(null);
    setShowVerificationQuestion(false);
    // Reset anti-cheat tracking
    setTabSwitchCount(0);
    setShowTabSwitchWarning(false);
    setResponseTimeData([]);
    setQuestionStartTime(null);
    setScreen("home");
  }, [setScreen]);

  const handleClaimDailyReward = useCallback(async () => {
    // Claim via Convex
    const reward = await claimDailyRewardSync();

    if (reward) {
      spawnParticles(["💎", "🟢", "🪙", "🎁"]);
    }

    hideDailyRewardModalFn();
  }, [claimDailyRewardSync, spawnParticles, hideDailyRewardModalFn]);

  const handlePurchase = useCallback(
    async (itemId: string, itemType: string, price: number, currency: string) => {
      const result = await purchaseItemSync(itemId, itemType, price, currency);

      if (result.success) {
        spawnParticles(["✨", "🛍️"]);
      }
    },
    [purchaseItemSync, spawnParticles]
  );

  const handleEquip = useCallback(
    async (itemId: string, itemType: string) => {
      await equipItemSync(itemId, itemType);
    },
    [equipItemSync]
  );

  // Handle mini-game completion (games pass correct count and mistakes count)
  const handleGameComplete = useCallback(
    async (correct: number, mistakes: number) => {
      const totalQuestions = correct + mistakes;
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      const rewards = {
        diamonds: 50 + correct * 10,
        emeralds: 20 + stars * 5,
        xp: 100 + correct * 20,
      };

      // Complete level and check for achievements
      if (activeGame) {
        const newAchievements = await completeLevelSync(activeGame, stars, correct, rewards);

        // Record activity for streak
        if (playerId) {
          try {
            await recordActivity({ playerId });
          } catch (err) {
            console.error("Failed to record activity:", err);
          }
        }

        // Show achievement if unlocked
        if (newAchievements && newAchievements.length > 0) {
          const achievement = newAchievements[0] as {
            id: string;
            name: string;
            desc: string;
            icon: string;
            reward: { diamonds?: number; emeralds?: number; gold?: number };
          };
          setAchievementData(achievement);
          setTimeout(() => setShowAchievement(true), 500);
        }

        // Show level complete modal
        setLevelCompleteData({
          levelId: activeGame,
          stars,
          rewards,
        });
        setShowLevelComplete(true);
      }

      // Add words learned
      await addWordsLearned(correct);
      spawnParticles(["💎", "🟢", "⭐"]);

      // Exit game
      setActiveGame(null);
    },
    [activeGame, completeLevelSync, addWordsLearned, spawnParticles, playerId, recordActivity]
  );

  // Handle correct answer in mini-game
  const handleGameCorrectAnswer = useCallback(() => {
    // Award small bonus for correct answer
    awardCurrency("diamonds", 5);
    spawnParticles(["💎", "✨"]);
  }, [awardCurrency, spawnParticles]);

  // Handle wrong answer in mini-game
  const handleGameWrongAnswer = useCallback(() => {
    // Could track errors here if needed
  }, []);

  // Handle mini-game exit
  const handleGameExit = useCallback(() => {
    setActiveGame(null);
  }, []);

  // Render mini-game based on activeGame state
  const renderMiniGame = () => {
    if (!activeGame) return null;

    const gameProps = {
      onComplete: handleGameComplete,
      onExit: handleGameExit,
      onCorrectAnswer: handleGameCorrectAnswer,
      onWrongAnswer: handleGameWrongAnswer,
    };

    switch (activeGame) {
      case "suffix":
        return <SuffixGame {...gameProps} />;
      case "imperative":
        return <ImperativeGame {...gameProps} />;
      case "interrogative":
        return <InterrogativeGame {...gameProps} />;
      case "vocabulary":
        return <VocabularyGame {...gameProps} />;
      case "story":
        return <StoryGame {...gameProps} />;
      case "crossword":
        return <CrosswordGame {...gameProps} />;
      case "factfinder":
        return <FactFinderGame {...gameProps} />;
      case "emotiondecoder":
        return <EmotionDecoderGame {...gameProps} />;
      case "responsecraft":
        return <ResponseCraftGame {...gameProps} />;
      case "aihelper":
        return <AIHelperGame {...gameProps} />;
      case "coinquest":
        return <CoinQuestGame {...gameProps} />;
      case "fakenews":
        return <FakeNewsGame {...gameProps} />;
      case "promptcraft":
        return <PromptCraftGame {...gameProps} />;
      case "budgetbuilder":
        return <BudgetBuilderGame {...gameProps} />;
      default:
        return null;
    }
  };

  // Render AI Game
  const renderAIGame = () => {
    if (!aiGameData) return null;
    const currentQ = aiGameData.questions[aiGameProgress.current];
    if (!currentQ) return null;

    // Determine game mode for visual styling
    const isHomework = !!currentHomeworkSessionId;
    const isPractice = !!currentPracticeQuestId;
    const modeClass = isHomework ? 'homework-mode' : isPractice ? 'practice-mode' : '';

    return (
      <div className="screen active">
        <div className={`game-area ${modeClass}`}>
          <div className="game-header">
            <h2 className="game-title">
              {isHomework && "📚 "}
              {isPractice && "⚔️ "}
              {aiGameData.gameIcon} {aiGameData.gameName}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Timer display - 90 seconds per question is expected */}
              {(() => {
                const expectedTimePerQuestion = 90; // 1.5 minutes per question
                const totalQuestions = aiGameData.questions.length;
                const expectedTotalSeconds = totalQuestions * expectedTimePerQuestion;
                const isOverTime = elapsedSeconds > expectedTotalSeconds;
                const isNearLimit = elapsedSeconds > expectedTotalSeconds * 0.8;

                return (
                  <div style={{
                    background: isOverTime
                      ? "rgba(239, 68, 68, 0.3)"
                      : isNearLimit
                        ? "rgba(251, 191, 36, 0.2)"
                        : "rgba(0,0,0,0.3)",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.9em",
                    fontFamily: "monospace",
                    color: isOverTime ? "#fca5a5" : isNearLimit ? "#fbbf24" : "#94a3b8",
                    border: isOverTime ? "1px solid #ef4444" : "none",
                  }}>
                    ⏱️ {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                    <span style={{ fontSize: "0.75em", marginLeft: "6px", opacity: 0.7 }}>
                      / {Math.floor(expectedTotalSeconds / 60)}:{(expectedTotalSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                );
              })()}
              <button className="btn btn-secondary" onClick={handleExitAIGame}>
                ← EXIT
              </button>
            </div>
          </div>

          {/* Tab switch warning banner */}
          {showTabSwitchWarning && (
            <div style={{
              background: tabSwitchCount >= 3
                ? "linear-gradient(135deg, rgba(127, 29, 29, 0.98) 0%, rgba(69, 10, 10, 0.98) 100%)"
                : "linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%)",
              border: tabSwitchCount >= 3 ? "2px solid #ef4444" : "2px solid #fca5a5",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              animation: "pulse 1s ease-in-out infinite",
              boxShadow: tabSwitchCount >= 3
                ? "0 4px 20px rgba(239, 68, 68, 0.6)"
                : "0 4px 15px rgba(239, 68, 68, 0.4)",
            }}>
              <span style={{ fontSize: "1.8em" }}>{tabSwitchCount >= 3 ? "🚫" : "👀"}</span>
              <div>
                <p style={{
                  margin: 0,
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "1em",
                }}>
                  {tabSwitchCount >= 3
                    ? "Too many tab switches! Rewards reduced 50%"
                    : tabSwitchCount === 2
                      ? "Warning! One more switch = reduced rewards"
                      : "We noticed you switched tabs!"}
                </p>
                <p style={{
                  margin: "4px 0 0 0",
                  color: "#fecaca",
                  fontSize: "0.85em",
                }}>
                  {tabSwitchCount >= 3
                    ? "Your parent will be notified about this activity"
                    : "Try solving it yourself — you'll learn better! 💪"}
                </p>
              </div>
              <span style={{
                fontSize: "1.2em",
                marginLeft: "auto",
                color: tabSwitchCount >= 3 ? "#ef4444" : "#fff",
                fontWeight: tabSwitchCount >= 3 ? "bold" : "normal",
              }}>
                {tabSwitchCount}x
              </span>
            </div>
          )}

        <div className="xp-progress">
          <div
            className="xp-progress-bar"
            style={{ width: `${((aiGameProgress.current + 1) / aiGameData.questions.length) * 100}%` }}
          />
          <div className="xp-progress-text">
            {aiGameProgress.current + 1}/{aiGameData.questions.length}
          </div>
        </div>

        <div className="question-card">
          <div className="question-header-row">
            <div className="question-number">
              QUESTION {aiGameProgress.current + 1} OF {aiGameData.questions.length}
            </div>
            <button
              className={`speak-btn ${isSpeaking ? "speaking" : ""}`}
              onClick={() => speakQuestion(currentQ.text, currentQ.options)}
              disabled={isSpeaking}
              title="Read question aloud"
            >
              {isSpeaking ? "🔊" : "🔈"}
            </button>
          </div>
          <div className="question-text">{currentQ.text}</div>
          {currentQ.hint && (
            <div className="question-hint">
              <span className="hint-icon">💡</span>
              <span className="hint-text">{currentQ.hint}</span>
            </div>
          )}
        </div>

        {showFeedback && (
          <div className={`feedback-banner ${feedbackCorrect ? "correct" : "wrong"}`}>
            {feedbackCorrect
              ? currentQuestionAttempts === 0
                ? "✅ Correct! +5💎"
                : currentQuestionAttempts === 1
                  ? "✅ Correct! +2💎"
                  : "✅ That's right!"
              : currentQuestionAttempts === 0
                ? "❌ Not quite... Try again!"
                : "❌ Wrong!"}
          </div>
        )}

        {/* Hint banner - shows after first wrong attempt */}
        {showHint && currentHint && !showFeedback && !showSimilarQuestion && (
          <div style={{
            background: mustAnswerCorrectly
              ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)"
              : "linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)",
            border: mustAnswerCorrectly
              ? "2px solid rgba(34, 197, 94, 0.5)"
              : "2px solid rgba(251, 191, 36, 0.5)",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <span style={{ fontSize: "1.5em" }}>
              {mustAnswerCorrectly ? "👆" : "💡"}
            </span>
            <div>
              <p style={{
                margin: 0,
                color: mustAnswerCorrectly ? "#22c55e" : "#fbbf24",
                fontWeight: "bold",
                fontSize: "0.9em"
              }}>
                {mustAnswerCorrectly ? "Try again! 💪" : "Hint:"}
              </p>
              <p style={{
                margin: "4px 0 0 0",
                color: "#e2e8f0",
                fontSize: "0.85em"
              }}>
                {currentHint}
              </p>
            </div>
          </div>
        )}

        {/* Loading similar question */}
        {loadingSimilarQuestion && (
          <div style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
            border: "2px solid rgba(139, 92, 246, 0.5)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "2em", marginBottom: "12px", animation: "pulse 1.5s infinite" }}>
              🧙‍♂️
            </div>
            <p style={{ color: "#a5b4fc", fontWeight: "bold", margin: 0 }}>
              Creating a practice question to help you learn...
            </p>
          </div>
        )}

        {/* Similar (easier) question overlay */}
        {showSimilarQuestion && similarQuestion && (
          <div style={{
            background: "linear-gradient(145deg, rgba(30, 58, 95, 0.98) 0%, rgba(23, 37, 84, 0.98) 100%)",
            border: "3px solid rgba(96, 165, 250, 0.6)",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "16px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 40px rgba(96, 165, 250, 0.2)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}>
              <span style={{ fontSize: "2em" }}>🎯</span>
              <div>
                <h3 style={{ margin: 0, color: "#93c5fd", fontSize: "1.1em" }}>
                  Practice Question
                </h3>
                <p style={{ margin: "4px 0 0 0", color: "#60a5fa", fontSize: "0.85em" }}>
                  Let&apos;s try an easier example first!
                </p>
              </div>
            </div>

            <div style={{
              background: "rgba(0, 0, 0, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px",
            }}>
              <p style={{ color: "#e2e8f0", fontSize: "1.1em", margin: 0, lineHeight: 1.5 }}>
                {similarQuestion.text}
              </p>
              {similarQuestion.hint && (
                <p style={{
                  color: "#fbbf24",
                  fontSize: "0.9em",
                  margin: "12px 0 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <span>💡</span> {similarQuestion.hint}
                </p>
              )}
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}>
              {similarQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSimilarQuestionAnswer(option)}
                  style={{
                    background: "linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)",
                    border: "2px solid rgba(96, 165, 250, 0.4)",
                    borderRadius: "12px",
                    padding: "16px",
                    color: "#e2e8f0",
                    fontSize: "1em",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(96, 165, 250, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)";
                    e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.8)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)";
                    e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.4)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading verification question */}
        {loadingVerificationQuestion && (
          <div style={{
            background: "linear-gradient(145deg, rgba(30, 58, 95, 0.95) 0%, rgba(23, 37, 84, 0.95) 100%)",
            border: "2px solid rgba(34, 197, 94, 0.4)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "16px",
            textAlign: "center",
          }}>
            <div className="loading-dots" style={{ marginBottom: "8px" }}>
              <span style={{ fontSize: "2em" }}>🧠</span>
            </div>
            <p style={{ color: "#86efac", margin: 0 }}>
              Checking your understanding...
            </p>
          </div>
        )}

        {/* Verification question overlay - different color to distinguish from practice */}
        {showVerificationQuestion && verificationQuestion && (
          <div style={{
            background: "linear-gradient(145deg, rgba(22, 78, 56, 0.98) 0%, rgba(20, 83, 45, 0.98) 100%)",
            border: "3px solid rgba(34, 197, 94, 0.6)",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "16px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}>
              <span style={{ fontSize: "2em" }}>🧠</span>
              <div>
                <h3 style={{ margin: 0, color: "#86efac", fontSize: "1.1em" }}>
                  Quick Check!
                </h3>
                <p style={{ margin: "4px 0 0 0", color: "#4ade80", fontSize: "0.85em" }}>
                  Prove you understood - answer this similar question
                </p>
              </div>
            </div>

            {showFeedback && (
              <div style={{
                background: feedbackCorrect ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
                border: `2px solid ${feedbackCorrect ? "#22c55e" : "#ef4444"}`,
                borderRadius: "8px",
                padding: "8px 12px",
                marginBottom: "12px",
                textAlign: "center",
              }}>
                <span style={{ color: feedbackCorrect ? "#86efac" : "#fca5a5", fontWeight: "bold" }}>
                  {feedbackCorrect ? "✅ Correct!" : "❌ Try again!"}
                </span>
              </div>
            )}

            {showHint && currentHint && !showFeedback && (
              <div style={{
                background: "rgba(251, 191, 36, 0.15)",
                border: "1px solid rgba(251, 191, 36, 0.4)",
                borderRadius: "8px",
                padding: "8px 12px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span>💡</span>
                <span style={{ color: "#fbbf24", fontSize: "0.9em" }}>{currentHint}</span>
              </div>
            )}

            <div style={{
              background: "rgba(0, 0, 0, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px",
            }}>
              <p style={{ color: "#e2e8f0", fontSize: "1.1em", margin: 0, lineHeight: 1.5 }}>
                {verificationQuestion.text}
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}>
              {verificationQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleVerificationQuestionAnswer(option)}
                  disabled={showFeedback}
                  style={{
                    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)",
                    border: "2px solid rgba(34, 197, 94, 0.4)",
                    borderRadius: "12px",
                    padding: "16px",
                    color: "#e2e8f0",
                    fontSize: "1em",
                    cursor: showFeedback ? "not-allowed" : "pointer",
                    opacity: showFeedback ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!showFeedback) {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(22, 163, 74, 0.4) 100%)";
                      e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.8)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)";
                    e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.4)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {!showSimilarQuestion && !loadingSimilarQuestion && !showVerificationQuestion && !loadingVerificationQuestion && (
          currentQ.type === "fill_blank" ? (
            <div className="fill-blank-input">
              <input
                type="text"
                placeholder="Type your answer..."
                className="player-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAnswerSelect((e.target as HTMLInputElement).value);
                  }
                }}
                disabled={showFeedback}
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  const input = document.querySelector(".fill-blank-input input") as HTMLInputElement;
                  handleAnswerSelect(input?.value || "");
                }}
                disabled={showFeedback}
              >
                CHECK
              </button>
            </div>
          ) : (
            <div className="options-grid">
              {currentQ.options?.map((option) => (
                <button
                  key={option}
                  className={`option-btn ${selectedAnswer === option ? (feedbackCorrect ? "correct" : "wrong") : ""}`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showFeedback}
                >
                  {option}
                </button>
              ))}
            </div>
          )
        )}
        </div>
      </div>
    );
  };

  // Render current screen
  const renderScreen = () => {
    // Mini-games take priority
    if (activeGame) {
      return renderMiniGame();
    }

    if (isPlayingAIGame) {
      return renderAIGame();
    }

    switch (currentScreen) {
      case "home":
        return (
          <HomeScreen
            playerId={playerId}
            completedLevels={completedLevels}
            onStartLevel={handleStartLevel}
            onScanHomework={handleScanHomework}
            onPracticeMode={handlePracticeMode}
            onQuestMap={handleOpenQuestMap}
            onSpellBook={handleOpenSpellBook}
            onParentSettings={handleOpenParentSettings}
            onDashboard={handleOpenDashboard}
            onLeaderboard={handleOpenLeaderboard}
            onLogout={handleLogout}
            onPlayHomework={handlePlayHomework}
            onShop={handleOpenShop}
            onInventory={handleOpenInventory}
            onAchievements={handleOpenAchievements}
            onGemHub={handleOpenGemHub}
            onProfileSettings={handleOpenProfileSettings}
            onHomework={() => setScreen("homework")}
            onAllGames={() => setScreen("games")}
            onLifeSkillsAcademy={handleOpenLifeSkillsMap}
          />
        );
      case "shop":
        return (
          <ShopScreen
            ownedItems={ownedItems}
            diamonds={player.diamonds}
            emeralds={player.emeralds}
            gold={player.gold}
            shopDiscount={player.shopDiscount}
            onPurchase={handlePurchase}
          />
        );
      case "inventory":
        return <InventoryScreen inventory={inventory} onEquip={handleEquip} />;
      case "achievements":
        return <AchievementsScreen />;
      case "practice":
        return (
          <WeeklyQuestsScreen
            playerId={playerId}
            onBack={() => setScreen("home")}
            onStartPractice={handleStartPracticeQuest}
            onPlayHomework={handlePlayHomework}
            onStartReview={handleStartReview}
            isLoadingReview={isLoadingReview}
          />
        );
      case "analytics":
        return (
          <AnalyticsDashboard
            playerId={playerId}
            onBack={() => setScreen("home")}
          />
        );
      case "learning-profile":
        return (
          <LearningProfileScreen
            playerId={playerId}
            onBack={() => setScreen("home")}
          />
        );
      case "parent-settings":
        return (
          <ParentSettingsScreen
            playerId={playerId}
            onBack={() => setScreen("home")}
          />
        );
      case "quest-map":
        return (
          <QuestMapScreen
            playerId={playerId}
            onBack={() => setScreen("home")}
            onStartQuest={handleStartQuest}
            onScanHomework={handleScanHomework}
            onPlayHomework={handlePlayHomework}
          />
        );
      case "spell-book":
        return (
          <SpellBookScreen
            playerId={playerId}
            onBack={() => setScreen("home")}
          />
        );
      case "profile-setup":
        return (
          <ProfileSetupScreen
            playerId={playerId}
            onComplete={() => setScreen("home")}
            onSkip={() => setScreen("home")}
          />
        );
      case "profile-settings":
        return (
          <ProfileSettingsScreen
            playerId={playerId}
            onBack={() => setScreen("home")}
            onLogout={handleLogout}
          />
        );
      case "dashboard":
        return (
          <GeneralDashboardScreen
            playerId={playerId}
            onBack={() => setScreen("home")}
            onViewLeaderboard={handleOpenLeaderboard}
          />
        );
      case "leaderboard":
        return (
          <LeaderboardScreen
            playerId={playerId}
            onBack={() => setScreen("home")}
          />
        );
      case "gem-hub":
        return playerId ? (
          <GemHubScreen
            playerId={playerId}
            onBack={() => setScreen("home")}
          />
        ) : null;
      case "homework":
        return (
          <HomeworkScreen
            playerId={playerId}
            onBack={() => setScreen("home")}
            onPlayHomework={handlePlayHomework}
            onScanHomework={handleScanHomework}
            onViewAnswers={handleViewHomeworkAnswers}
          />
        );
      case "games":
        return (
          <GamesScreen
            completedLevels={completedLevels}
            onStartLevel={handleStartLevel}
            onBack={() => setScreen("home")}
          />
        );
      case "life-skills-map":
        return (
          <ChapterMapScreen
            playerId={playerId}
            chapterProgress={lifeSkillsProgress?.chapters?.map(ch => ({
              chapterId: ch.chapterId,
              isUnlocked: ch.isUnlocked,
              isCompleted: ch.isCompleted,
              lessonsCompleted: ch.lessonsCompleted,
              totalLessons: ch.totalLessons,
              starsEarned: ch.starsEarned,
              bossDefeated: ch.bossDefeated,
            })) || []}
            onSelectChapter={handleSelectLifeSkillsChapter}
            onBack={() => setScreen("home")}
            totalStars={lifeSkillsProgress?.wizard?.totalStars || 0}
            diamonds={player.diamonds}
          />
        );
      case "life-skills-lesson":
        return selectedLifeSkillsChapter ? (
          <QuestGameScreen
            chapter={selectedLifeSkillsChapter}
            lessonIndex={selectedLifeSkillsLesson}
            onComplete={(result) =>
              handleLifeSkillsLessonComplete(
                selectedLifeSkillsChapter.chapterId,
                selectedLifeSkillsLesson,
                result.stars,
                result.xp,
                result.correctCount,
                result.totalCount
              )
            }
            onBack={handleLifeSkillsBack}
            playerId={playerId}
          />
        ) : null;
      case "life-skills-boss":
        return currentBossBattle && currentBossBattle.boss ? (
          <BossBattleScreen
            boss={currentBossBattle.boss}
            chapterId={currentBossBattle.chapterId}
            onVictory={() => handleBossBattleComplete(true, currentBossBattle.chapterId)}
            onDefeat={() => handleBossBattleComplete(false, currentBossBattle.chapterId)}
            onBack={handleLifeSkillsBack}
            playerId={playerId}
          />
        ) : null;
      default:
        return null;
    }
  };

  // Loading phase
  if (phase === "loading") {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  // Login phase
  if (phase === "login") {
    return <LoginScreen onStart={handleLogin} defaultName={player.name} />;
  }

  // Game phase
  return (
    <TutorialProvider playerId={playerId}>
      {/* Ambient Effects - Snow & Day/Night */}
      <AmbientEffects enableSnow={true} enableDayNight={true} snowIntensity="medium" />

      <GameWorld playerId={playerId} onProfileSettings={handleOpenProfileSettings} onLevelClick={handleLevelClick}>{renderScreen()}</GameWorld>

      {/* Tutorial Overlay */}
      <TutorialOverlay />

      {/* Camera Screen */}
      {showCamera && (
        <CameraScreen onCapture={handleCameraCapture} onCancel={handleCameraCancel} />
      )}

      {/* AI Processing Screen */}
      {showAIProcessing && capturedImages.length > 0 && (
        <AIProcessingScreen
          images={capturedImages}
          onComplete={handleAIComplete}
          onError={handleAIError}
        />
      )}

      {/* Daily Reward Modal */}
      <DailyRewardModal
        isOpen={showDailyRewardUI}
        onClose={hideDailyRewardModalFn}
        currentDay={player.dailyDay}
        claimed={player.dailyClaimed}
        streak={player.streak}
        onClaim={handleClaimDailyReward}
      />

      {/* Milestone Modal - shows when clicking on level */}
      <MilestoneModal
        isOpen={showMilestoneModalUI}
        onClose={hideMilestoneModalFn}
        level={milestoneLevel || player.level}
        playerSkin={player.skin}
        onClaim={handleClaimMilestone}
        isClaimed={(player.milestonesClaimed || []).includes(milestoneLevel || 0)}
      />

      {/* Mining Overlay - shows after correct answer */}
      <MiningOverlay
        isOpen={showMiningOverlay}
        onComplete={handleMiningComplete}
        currentDepth={miningDepth}
        onDepthChange={setMiningDepth}
        checkGemDrop={handleMiningDig}
      />

      {/* Level Complete Modal */}
      <LevelCompleteModal
        isOpen={showLevelComplete}
        onClose={() => {
          setShowLevelComplete(false);
          setLevelCompleteData(null);
          setAiGameData(null);
          setCompletedHomeworkData(null);
          setHomeworkAnswers([]);
          setCurrentHomeworkSessionId(null);
          setCapturedImages([]);
          setScreen("home");
        }}
        onNextLevel={() => {
          setShowLevelComplete(false);
          setLevelCompleteData(null);
          setAiGameData(null);
          setCapturedImages([]);
          setScreen("home");
        }}
        levelName={aiGameData?.gameName || completedHomeworkData?.gameName || "QUEST"}
        stars={levelCompleteData?.stars || 0}
        rewards={levelCompleteData?.rewards || { diamonds: 0, emeralds: 0, xp: 0 }}
        isHomework={!!currentHomeworkSessionId || !!completedHomeworkData}
        onViewAnswers={() => {
          setShowLevelComplete(false);
          setShowHomeworkAnswers(true);
        }}
      />

      {/* Achievement Modal */}
      {achievementData && (
        <AchievementModal
          isOpen={showAchievement}
          onClose={() => {
            setShowAchievement(false);
            setAchievementData(null);
          }}
          achievement={achievementData}
        />
      )}

      {/* Duplicate Homework Dialog - shows when scanning homework that was already completed */}
      {showDuplicateDialog && duplicateSessionInfo && (
        <DuplicateHomeworkDialog
          isOpen={showDuplicateDialog}
          originalSession={duplicateSessionInfo}
          onPracticeMode={handlePracticeModeSelect}
          onScanNew={handleScanNewFromDialog}
          onClose={handleCloseDuplicateDialog}
        />
      )}

      {/* Error Modal - shows when homework scanning fails */}
      {errorMessage && (
        <ErrorModal
          error={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* Explanation Screen - shows when user gets wrong answer */}
      {showExplanation && explanationData && (
        <ExplanationScreen
          question={explanationData.question}
          userAnswer={explanationData.userAnswer}
          correctAnswer={explanationData.correctAnswer}
          explanation={explanationData.explanation}
          hint={explanationData.hint}
          onContinue={handleExplanationContinue}
        />
      )}

      {/* Homework Answers Screen - shows correct answers for copying to paper */}
      {showHomeworkAnswers && completedHomeworkData && (
        <HomeworkAnswersScreen
          subject={completedHomeworkData.subject}
          gameName={completedHomeworkData.gameName}
          gameIcon={completedHomeworkData.gameIcon}
          questions={completedHomeworkData.questions}
          userAnswers={homeworkAnswers}
          onClose={() => {
            setShowHomeworkAnswers(false);
            setCompletedHomeworkData(null);
            setHomeworkAnswers([]);
            setCurrentHomeworkSessionId(null);
            setAiGameData(null);
            setLevelCompleteData(null);
            setCapturedImages([]);
            setScreen("home");
          }}
        />
      )}
    </TutorialProvider>
  );
}
