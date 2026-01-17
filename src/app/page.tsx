"use client";

import { useState, useCallback, useEffect } from "react";
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
import { GeneralDashboardScreen } from "@/components/screens/GeneralDashboardScreen";
import { LeaderboardScreen } from "@/components/screens/LeaderboardScreen";
import { GemHubScreen } from "@/components/screens/GemHubScreen";
import { WeeklyQuestsScreen } from "@/components/screens/WeeklyQuestsScreen";
import { HomeworkAnswersScreen } from "@/components/screens/HomeworkAnswersScreen";

// UI Components
import { GameWorld } from "@/components/ui/GameWorld";

// Modals
import { DailyRewardModal } from "@/components/modals/DailyRewardModal";
import { LevelCompleteModal } from "@/components/modals/LevelCompleteModal";
import { AchievementModal } from "@/components/modals/AchievementModal";

// Game Components
import { MiningOverlay } from "@/components/game/MiningOverlay";

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

// Helper function to generate options for questions that don't have them
function generateOptionsForQuestion(q: { text: string; correct: string; type?: string; options?: string[] }): string[] {
  // If already has valid options, use them
  if (q.options && q.options.length >= 2) {
    return q.options;
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
  // Default: include the correct answer as an option
  return [q.correct];
}

export default function Home() {
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

  // Error tracking mutation
  const trackError = useMutation(api.errors.trackError);

  // Spell Book mutation - add words when correct answers given
  const addToSpellBook = useMutation(api.quests.addToSpellBook);

  // Practice quest progress mutation
  const answerPracticeQuestion = useMutation(api.weeklyQuests.answerPracticeQuestion);

  // Topic progress mutation
  const updateTopicProgress = useMutation(api.learning.updateTopicProgress);

  // Generate weekly quests on demand
  const generateWeeklyQuests = useMutation(api.weeklyQuests.generateWeeklyQuests);

  // Weekly quests query - for practice quest gameplay
  const weeklyQuestsData = useQuery(
    api.weeklyQuests.getWeeklyQuests,
    playerId ? { playerId } : "skip"
  );

  // Camera/AI states
  const [showCamera, setShowCamera] = useState(false);
  const [showAIProcessing, setShowAIProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [aiGameData, setAiGameData] = useState<AIAnalysisResult | null>(null);
  const [currentHomeworkSessionId, setCurrentHomeworkSessionId] = useState<Id<"homeworkSessions"> | null>(null);
  const [currentPracticeQuestId, setCurrentPracticeQuestId] = useState<Id<"weeklyPracticeQuests"> | null>(null);
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
  const [isSpeaking, setIsSpeaking] = useState(false);

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
      setScreen("game");
    },
    [setScreen]
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

    // Convert homework session to AIAnalysisResult format
    const gameData: AIAnalysisResult = {
      subject: homework.subject,
      grade: homework.grade,
      topics: homework.topics,
      totalPages: 1,
      gameName: homework.gameName,
      gameIcon: homework.gameIcon,
      questions: validQuestions.map(q => {
        const options = generateOptionsForQuestion(q);
        return {
          text: q.text,
          type: options.length >= 2 ? "multiple_choice" as const : q.type as "multiple_choice" | "fill_blank" | "true_false",
          options: options,
          correct: q.correct,
          explanation: q.explanation,
          hint: q.hint,
          pageRef: q.pageRef,
        };
      }),
    };

    // Set the homework session ID for completion tracking
    setCurrentHomeworkSessionId(homework._id);

    // Start the game
    setAiGameData(gameData);
    setIsPlayingAIGame(true);
    setAiGameProgress({ current: 0, correct: 0, mistakes: 0 });
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, []);

  const handleStartQuest = useCallback((questId: string, chapterId: number) => {
    // TODO: Start the quest game with the questId
    console.log("Starting quest:", questId, "in chapter:", chapterId);
    // For now, just go back to home
    setScreen("home");
  }, [setScreen]);

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
    const gameData: AIAnalysisResult = {
      subject: quest.subject,
      grade: "Practice",
      topics: [quest.topic],
      totalPages: 1,
      gameName: quest.questName,
      gameIcon: quest.questIcon,
      questions: quest.questions.map(q => ({
        text: q.text,
        type: q.type as "multiple_choice" | "fill_blank" | "true_false",
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
      })),
    };

    // Set the practice quest ID for progress tracking
    setCurrentPracticeQuestId(questId);
    setCurrentHomeworkSessionId(null); // Clear any homework session

    // Start the game
    setAiGameData(gameData);
    setIsPlayingAIGame(true);
    setAiGameProgress({ current: 0, correct: 0, mistakes: 0 });
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [weeklyQuestsData]);

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
    const processedQuestions = result.questions.map(q => {
      const options = generateOptionsForQuestion(q);
      return {
        ...q,
        type: options.length >= 2 ? "multiple_choice" as const : q.type,
        options: options,
      };
    });

    const processedResult: AIAnalysisResult = {
      ...result,
      questions: processedQuestions,
    };

    // Save homework session to database
    try {
      const sessionId = await createHomeworkSession({
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
      });
      setCurrentHomeworkSessionId(sessionId || null);
    } catch (error) {
      console.error("Failed to save homework session:", error);
    }

    setAiGameData(processedResult);
    setShowAIProcessing(false);
    setIsPlayingAIGame(true);
    setAiGameProgress({ current: 0, correct: 0, mistakes: 0 });
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [createHomeworkSession, playerId, capturedImages]);

  const handleAIError = useCallback((error: string) => {
    alert(error);
    setShowAIProcessing(false);
    setCapturedImages([]);
  }, []);

  // Handle answer selection in AI game - Multiple attempts system
  const handleAnswerSelect = useCallback(
    async (answer: string) => {
      if (showFeedback || !aiGameData) return;

      setSelectedAnswer(answer);
      const currentQ = aiGameData.questions[aiGameProgress.current];
      const isCorrect = answer.toLowerCase().trim() === currentQ.correct.toLowerCase().trim();

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
          setHomeworkAnswers(prev => {
            // Remove any previous answer for this question and add the correct one
            const filtered = prev.filter(a => a.questionIndex !== aiGameProgress.current);
            return [...filtered, {
              questionIndex: aiGameProgress.current,
              userAnswer: answer,
              isCorrect: true,
            }];
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
            }
          } catch (err) {
            console.error("Failed to add word to spell book:", err);
          }
        }

        // Reset attempt state and move to next question
        setTimeout(() => {
          setShowFeedback(false);
          setShowHint(false);
          setCurrentHint(null);
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
          setHomeworkAnswers(prev => [...prev, {
            questionIndex: aiGameProgress.current,
            userAnswer: answer,
            isCorrect: false,
          }]);
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
          // SECOND WRONG: Show full explanation, then they must answer correctly
          setTimeout(() => {
            setExplanationData({
              question: currentQ.text,
              userAnswer: answer,
              correctAnswer: currentQ.correct,
              explanation: currentQ.explanation,
              hint: currentQ.hint,
            });
            setShowExplanation(true);
            setShowFeedback(false);
            setMustAnswerCorrectly(true);
          }, 1000);
        } else {
          // 3+ WRONG (mustAnswerCorrectly mode): Keep showing they need to pick correct
          setTimeout(() => {
            setShowFeedback(false);
            setSelectedAnswer(null);
            // Show a message that they need to pick the correct answer
            setCurrentHint(`The correct answer is: ${currentQ.correct}. Select it to continue!`);
            setShowHint(true);
          }, 800);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aiGameData, aiGameProgress, showFeedback, awardCurrency, spawnParticles, playerId, trackError, currentHomeworkSessionId, addToSpellBook, currentPracticeQuestId, answerPracticeQuestion, updateTopicProgress, currentQuestionAttempts]
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

      // Check if game is complete
      if (newProgress.current >= aiGameData.questions.length) {
        const stars = newProgress.mistakes === 0 ? 3 : newProgress.mistakes <= 2 ? 2 : 1;
        const rewards = {
          diamonds: 50 + newProgress.correct * 10,
          emeralds: 20 + stars * 5,
          xp: 100 + newProgress.correct * 20,
        };

        // Complete level via Convex and check for achievements
        const newAchievements = await completeLevelSync("ai-game", stars, newProgress.correct, rewards);

        // Mark homework session as completed and save answers
        if (currentHomeworkSessionId) {
          try {
            await completeHomeworkSession({
              sessionId: currentHomeworkSessionId,
              score: newProgress.correct,
              stars,
              userAnswers: homeworkAnswers,
            });
            // Save data for the answers summary screen
            setCompletedHomeworkData(aiGameData);
          } catch (error) {
            console.error("Failed to complete homework session:", error);
          }
        }

        // Update words learned
        await addWordsLearned(newProgress.correct);

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
    [aiGameData, aiGameProgress, completeLevelSync, addWordsLearned, spawnParticles, currentHomeworkSessionId, completeHomeworkSession, homeworkAnswers]
  );

  // Handle continue from explanation screen - now returns to question for retry
  const handleExplanationContinue = useCallback(() => {
    setShowExplanation(false);
    setExplanationData(null);
    setSelectedAnswer(null);
    // Don't move to next question - child must answer correctly now
    // mustAnswerCorrectly is already set to true, hint will show the correct answer
    if (aiGameData) {
      const currentQ = aiGameData.questions[aiGameProgress.current];
      setCurrentHint(`Now select the correct answer: ${currentQ.correct}`);
      setShowHint(true);
    }
  }, [aiGameData, aiGameProgress]);

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
    setHomeworkAnswers([]);
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
            <button className="btn btn-secondary" onClick={handleExitAIGame}>
              ← EXIT
            </button>
          </div>

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
        {showHint && currentHint && !showFeedback && (
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
                {mustAnswerCorrectly ? "Select the correct answer" : "Hint:"}
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

        {currentQ.type === "fill_blank" ? (
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
        )}
        </div>
      </div>
    );
  };

  // Render current screen
  const renderScreen = () => {
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
          />
        );
      case "shop":
        return <ShopScreen ownedItems={ownedItems} onPurchase={handlePurchase} />;
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
          <ProfileSetupScreen
            playerId={playerId}
            onComplete={() => setScreen("home")}
            onSkip={() => setScreen("home")}
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
    <>
      <GameWorld playerId={playerId}>{renderScreen()}</GameWorld>

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
    </>
  );
}
