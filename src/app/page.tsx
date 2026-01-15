"use client";

import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useConvexSync } from "@/components/providers/ConvexSyncProvider";

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

// UI Components
import { GameWorld } from "@/components/ui/GameWorld";

// Modals
import { DailyRewardModal } from "@/components/modals/DailyRewardModal";
import { LevelCompleteModal } from "@/components/modals/LevelCompleteModal";
import { AchievementModal } from "@/components/modals/AchievementModal";

export default function Home() {
  // Convex sync
  const {
    isLoading: convexLoading,
    isLoggedIn,
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

  // Camera/AI states
  const [showCamera, setShowCamera] = useState(false);
  const [showAIProcessing, setShowAIProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [aiGameData, setAiGameData] = useState<AIAnalysisResult | null>(null);
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

  const handleCameraCapture = useCallback((images: string[]) => {
    setCapturedImages(images);
    setShowCamera(false);
    setShowAIProcessing(true);
  }, []);

  const handleCameraCancel = useCallback(() => {
    setShowCamera(false);
  }, []);

  const handleAIComplete = useCallback((result: AIAnalysisResult) => {
    setAiGameData(result);
    setShowAIProcessing(false);
    setIsPlayingAIGame(true);
    setAiGameProgress({ current: 0, correct: 0, mistakes: 0 });
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, []);

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

        // Move to next question after delay for correct answers
        setTimeout(() => {
          moveToNextQuestion(isCorrect);
        }, 1500);
      } else {
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
    [aiGameData, aiGameProgress, showFeedback, awardCurrency, spawnParticles]
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
        spawnParticles(["💎", "🟢", "⭐"]);
      }
    },
    [aiGameData, aiGameProgress, completeLevelSync, addWordsLearned, spawnParticles]
  );

  // Handle continue from explanation screen
  const handleExplanationContinue = useCallback(() => {
    setShowExplanation(false);
    setExplanationData(null);
    moveToNextQuestion(false);
  }, [moveToNextQuestion]);

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
            completedLevels={completedLevels}
            onStartLevel={handleStartLevel}
            onScanHomework={handleScanHomework}
          />
        );
      case "shop":
        return <ShopScreen ownedItems={ownedItems} onPurchase={handlePurchase} />;
      case "inventory":
        return <InventoryScreen inventory={inventory} onEquip={handleEquip} />;
      case "achievements":
        return <AchievementsScreen />;
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
        onClaim={handleClaimDailyReward}
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
