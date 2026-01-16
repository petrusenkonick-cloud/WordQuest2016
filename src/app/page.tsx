"use client";

import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useConvexSync } from "@/components/providers/ConvexSyncProvider";
import { useMutation } from "convex/react";
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

  // Camera/AI states
  const [showCamera, setShowCamera] = useState(false);
  const [showAIProcessing, setShowAIProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [aiGameData, setAiGameData] = useState<AIAnalysisResult | null>(null);
  const [currentHomeworkSessionId, setCurrentHomeworkSessionId] = useState<Id<"homeworkSessions"> | null>(null);
  const [isPlayingAIGame, setIsPlayingAIGame] = useState(false);
  const [aiGameProgress, setAiGameProgress] = useState({ current: 0, correct: 0, mistakes: 0 });
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
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Store
  const player = useAppStore((state) => state.player);
  const setPlayer = useAppStore((state) => state.setPlayer);
  const currentScreen = useAppStore((state) => state.ui.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);
  const spawnParticles = useAppStore((state) => state.spawnParticles);

  // Modals
  const [showDailyReward, setShowDailyReward] = useState(false);
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
            setTimeout(() => setShowDailyReward(true), 1000);
          }
        } else {
          setPhase("login");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [convexLoading, isLoggedIn, phase, player.dailyClaimed]);

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
    async (name: string, skin: string) => {
      // Create player in Convex
      await initializePlayer(name, skin);
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
    // Convert homework session to AIAnalysisResult format
    const gameData: AIAnalysisResult = {
      subject: homework.subject,
      grade: homework.grade,
      topics: homework.topics,
      totalPages: 1,
      gameName: homework.gameName,
      gameIcon: homework.gameIcon,
      questions: homework.questions.map(q => ({
        text: q.text,
        type: q.type as "multiple_choice" | "fill_blank" | "true_false",
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        hint: q.hint,
        pageRef: q.pageRef,
      })),
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
    // TODO: Implement practice quest gameplay
    // For now, log and show feedback
    console.log("Starting practice quest:", questId);
    // Could show a modal or start a mini-game for the practice quest
  }, []);

  const handleCameraCapture = useCallback((images: string[]) => {
    setCapturedImages(images);
    setShowCamera(false);
    setShowAIProcessing(true);
  }, []);

  const handleCameraCancel = useCallback(() => {
    setShowCamera(false);
  }, []);

  const handleAIComplete = useCallback(async (result: AIAnalysisResult) => {
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
        questions: result.questions.map(q => ({
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

    setAiGameData(result);
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

  // Handle answer selection in AI game
  const handleAnswerSelect = useCallback(
    async (answer: string) => {
      if (showFeedback || !aiGameData) return;

      setSelectedAnswer(answer);
      const currentQ = aiGameData.questions[aiGameProgress.current];
      const isCorrect = answer.toLowerCase().trim() === currentQ.correct.toLowerCase().trim();

      setFeedbackCorrect(isCorrect);
      setShowFeedback(true);

      if (isCorrect) {
        // Award currency via Convex
        await awardCurrency("diamonds", 5);
        spawnParticles(["💎", "✨"]);

        // Show mining overlay after a brief delay
        setTimeout(() => {
          setShowFeedback(false);
          setShowMiningOverlay(true);
        }, 1000);
      } else {
        // Track the error for personalized practice
        if (playerId && aiGameData) {
          try {
            // Determine topic from question content or use subject
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

        // Show explanation screen for wrong answers
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
        }, 1000);
      }
    },
    [aiGameData, aiGameProgress, showFeedback, awardCurrency, spawnParticles, playerId, trackError, currentHomeworkSessionId]
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

        // Mark homework session as completed
        if (currentHomeworkSessionId) {
          try {
            await completeHomeworkSession({
              sessionId: currentHomeworkSessionId,
              score: newProgress.correct,
              stars,
            });
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
        setCurrentHomeworkSessionId(null);
        spawnParticles(["💎", "🟢", "⭐"]);
      }
    },
    [aiGameData, aiGameProgress, completeLevelSync, addWordsLearned, spawnParticles, currentHomeworkSessionId, completeHomeworkSession]
  );

  // Handle continue from explanation screen
  const handleExplanationContinue = useCallback(() => {
    setShowExplanation(false);
    setExplanationData(null);
    moveToNextQuestion(false);
  }, [moveToNextQuestion]);

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
    setScreen("home");
  }, [setScreen]);

  const handleClaimDailyReward = useCallback(async () => {
    // Claim via Convex
    const reward = await claimDailyRewardSync();

    if (reward) {
      spawnParticles(["💎", "🟢", "🪙", "🎁"]);
    }

    setShowDailyReward(false);
  }, [claimDailyRewardSync, spawnParticles]);

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

    return (
      <div className="game-area">
        <div className="game-header">
          <h2 className="game-title">
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
            {feedbackCorrect ? "✅ Correct! +5💎" : `❌ Wrong! Answer: ${currentQ.correct}`}
            {currentQ.explanation && <p>{currentQ.explanation}</p>}
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
      <GameWorld>{renderScreen()}</GameWorld>

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
        isOpen={showDailyReward}
        onClose={() => setShowDailyReward(false)}
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
        levelName={aiGameData?.gameName || "QUEST"}
        stars={levelCompleteData?.stars || 0}
        rewards={levelCompleteData?.rewards || { diamonds: 0, emeralds: 0, xp: 0 }}
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
    </>
  );
}
