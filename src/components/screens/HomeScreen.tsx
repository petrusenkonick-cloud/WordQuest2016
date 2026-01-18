"use client";

import { useAppStore } from "@/lib/store";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { LeaderboardPodium } from "../ui/LeaderboardPodium";
import { LEVELS as GAME_LEVELS, GameUnlock } from "@/lib/gameData";

// Map icons for each level
const LEVEL_ICONS: Record<string, string> = {
  suffix: "🪨",
  imperative: "📜",
  interrogative: "❓",
  crossword: "🗺️",
  vocabulary: "⚒️",
  story: "📖",
  factfinder: "🔍",
  emotiondecoder: "💭",
  responsecraft: "🤝",
  aihelper: "🤖",
  coinquest: "💰",
  fakenews: "🕵️",
  promptcraft: "✨",
  budgetbuilder: "📊",
};

// Build LEVELS from gameData with icons
const LEVELS = GAME_LEVELS.map((level) => ({
  ...level,
  icon: LEVEL_ICONS[level.id] || "⭐",
}));

interface HomeworkSession {
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
  createdAt: string;
}

// Game unlock state
interface GameUnlockState {
  homeworkCompletedToday: boolean;
  purchasedGames: string[];
}

interface HomeScreenProps {
  playerId: Id<"players"> | null;
  completedLevels: Record<string, { stars: number; done: boolean }>;
  onStartLevel: (levelId: string) => void;
  onScanHomework?: () => void;
  onPracticeMode?: () => void;
  onQuestMap?: () => void;
  onSpellBook?: () => void;
  onParentSettings?: () => void;
  onDashboard?: () => void;
  onLeaderboard?: () => void;
  onLogout?: () => void;
  weakTopicsCount?: number;
  onPlayHomework?: (homework: HomeworkSession) => void;
  // New navigation handlers
  onShop?: () => void;
  onInventory?: () => void;
  onAchievements?: () => void;
  onGemHub?: () => void;
  onProfileSettings?: () => void;
  onHomework?: () => void;
  onAllGames?: () => void;
}

export function HomeScreen({
  playerId,
  completedLevels,
  onStartLevel,
  onScanHomework,
  onPracticeMode,
  onQuestMap,
  onSpellBook,
  onParentSettings,
  onDashboard,
  onLeaderboard,
  onLogout,
  weakTopicsCount = 0,
  onPlayHomework,
  onShop,
  onInventory,
  onAchievements,
  onGemHub,
  onProfileSettings,
  onHomework,
  onAllGames,
}: HomeScreenProps) {
  const player = useAppStore((state) => state.player);
  const showDailyReward = useAppStore((state) => state.showDailyRewardModal);

  // Unlock modal state
  const [unlockModal, setUnlockModal] = useState<{
    show: boolean;
    levelId: string;
    levelName: string;
    cost: number;
    unlock: GameUnlock;
  } | null>(null);

  // Game unlock state query
  const gameUnlockState = useQuery(
    api.gameUnlocks.getGameUnlockState,
    playerId ? { playerId } : "skip"
  );

  // Purchase game mutation
  const purchaseGame = useMutation(api.gameUnlocks.purchaseGame);

  // Check if a game is unlocked
  const isGameUnlocked = (levelId: string, unlock?: GameUnlock): boolean => {
    if (!unlock) return true; // No unlock info = free
    if (unlock.type === "free") return true;
    if (unlock.type === "homework") {
      // Unlocked if homework done today OR purchased
      const purchasedGames = gameUnlockState?.purchasedGames || [];
      const homeworkDoneToday = gameUnlockState?.homeworkCompletedToday || false;
      return homeworkDoneToday || purchasedGames.includes(levelId);
    }
    if (unlock.type === "streak") {
      return (player.streak || 0) >= (unlock.requirement || 0);
    }
    if (unlock.type === "purchase") {
      const purchasedGames = gameUnlockState?.purchasedGames || [];
      return purchasedGames.includes(levelId);
    }
    return false;
  };

  // Handle game click
  const handleGameClick = (level: typeof LEVELS[number]) => {
    const unlock = level.unlock as GameUnlock | undefined;
    if (isGameUnlocked(level.id, unlock)) {
      onStartLevel(level.id);
    } else {
      // Show unlock modal
      setUnlockModal({
        show: true,
        levelId: level.id,
        levelName: level.name,
        cost: unlock?.requirement || 150,
        unlock: unlock || { type: "free" },
      });
    }
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!unlockModal || !playerId) return;

    const cost = unlockModal.cost;
    if (player.diamonds < cost) {
      // Not enough diamonds
      alert(`Not enough diamonds! You need ${cost} 💎`);
      return;
    }

    try {
      await purchaseGame({
        playerId,
        gameId: unlockModal.levelId,
        cost,
      });
      setUnlockModal(null);
      // Start the game after purchase
      onStartLevel(unlockModal.levelId);
    } catch (error) {
      console.error("Failed to purchase game:", error);
    }
  };

  // Active homework sessions
  const homeworkSessions = useQuery(
    api.homework.getActiveHomeworkSessions,
    playerId ? { playerId } : { guestId: undefined }
  );

  // Wizard academy data
  const wizardProfile = useQuery(
    api.quests.getWizardProfile,
    playerId ? { playerId } : "skip"
  );

  const dailyQuests = useQuery(
    api.quests.getDailyQuests,
    playerId ? { playerId } : "skip"
  );

  const spellBookStats = useQuery(
    api.quests.getSpellBookStats,
    playerId ? { playerId } : "skip"
  );

  // Weekly quests data
  const weeklyQuests = useQuery(
    api.weeklyQuests.getWeeklyQuests,
    playerId ? { playerId } : "skip"
  );

  // Initialize wizard profile and daily quests
  const initWizard = useMutation(api.quests.initializeWizardProfile);
  const generateDailyQuests = useMutation(api.quests.generateDailyQuests);

  useEffect(() => {
    if (playerId) {
      // Initialize wizard if needed
      if (wizardProfile === null) {
        initWizard({ playerId });
      }
      // Generate daily quests if needed
      if (dailyQuests && dailyQuests.length === 0) {
        generateDailyQuests({ playerId });
      }
    }
  }, [playerId, wizardProfile, dailyQuests, initWizard, generateDailyQuests]);

  // Calculate daily quest progress
  const completedDailyQuests = dailyQuests?.filter(q => q.isCompleted).length || 0;
  const totalDailyQuests = dailyQuests?.length || 4;

  // Calculate weekly quest progress
  const weeklyQuestsList = weeklyQuests?.quests || [];
  const completedWeeklyQuests = weeklyQuestsList.filter(q => q.completedAt).length;
  const totalWeeklyQuests = weeklyQuestsList.length;

  return (
    <div className="screen active">
      {/* Top Wizards Leaderboard */}
      <LeaderboardPodium playerId={playerId} onViewFull={onLeaderboard} />

      {/* MAIN FEATURE: Scan Homework Button - RIGHT AFTER LEADERBOARD */}
      <div className="scan-homework-btn" onClick={onScanHomework}>
        <span className="camera-icon">📸</span>
        <h3>SCAN HOMEWORK</h3>
        <p>AI creates a game from your homework!</p>
      </div>

      {/* Daily Quests Progress */}
      {dailyQuests && dailyQuests.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(30, 27, 75, 0.4) 100%)",
          borderRadius: "12px",
          padding: "12px 15px",
          marginBottom: "15px",
          border: "1px solid #8b5cf640",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ color: "#c4b5fd", fontWeight: "bold", fontSize: "0.9em" }}>
              Daily Quests
            </span>
            <span style={{ color: "#8b5cf6", fontSize: "0.85em" }}>
              {completedDailyQuests}/{totalDailyQuests}
            </span>
          </div>
          <div style={{
            display: "flex",
            gap: "5px",
          }}>
            {dailyQuests.map((quest, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "6px",
                  borderRadius: "3px",
                  background: quest.isCompleted ? "#8b5cf6" : "rgba(0,0,0,0.4)",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions - Academy Features */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginBottom: "15px",
      }}>
        {/* Quest Map */}
        <div
          onClick={onQuestMap}
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
            borderRadius: "12px",
            padding: "15px",
            cursor: "pointer",
            border: "2px solid #6366f1",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "2em" }}>🗺️</span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "0.95em" }}>QUEST MAP</div>
            <div style={{ color: "#a5b4fc", fontSize: "0.8em" }}>
              Ch. {wizardProfile?.currentChapter || 1}
            </div>
          </div>
        </div>

        {/* Spell Book */}
        <div
          onClick={onSpellBook}
          style={{
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
            borderRadius: "12px",
            padding: "15px",
            cursor: "pointer",
            border: "2px solid #a855f7",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "2em" }}>📖</span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "0.95em" }}>SPELL BOOK</div>
            <div style={{ color: "#c4b5fd", fontSize: "0.8em" }}>
              {spellBookStats?.totalSpells || 0} Words
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard & Leaderboard Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginBottom: "15px",
      }}>
        {/* Dashboard */}
        <div
          onClick={onDashboard}
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
            borderRadius: "12px",
            padding: "15px",
            cursor: "pointer",
            border: "2px solid #3b82f6",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "2em" }}>📊</span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "0.95em" }}>DASHBOARD</div>
            <div style={{ color: "#93c5fd", fontSize: "0.8em" }}>
              Your Stats
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div
          onClick={onLeaderboard}
          style={{
            background: "linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
            borderRadius: "12px",
            padding: "15px",
            cursor: "pointer",
            border: "2px solid #eab308",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "2em" }}>🏆</span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "0.95em" }}>LEADERBOARD</div>
            <div style={{ color: "#fde047", fontSize: "0.8em" }}>
              Top Wizards
            </div>
          </div>
        </div>
      </div>

      {/* Daily Banner */}
      <div className="daily-banner" onClick={showDailyReward}>
        <div>
          <h3>DAILY REWARD!</h3>
          <p>Claim free rewards!</p>
        </div>
        <div className="daily-icon">🎁</div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon" style={{ fontSize: "1.2em" }}>🔥</div>
          <div className="value">{player.streak}</div>
          <div className="label">Streak</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ fontSize: "1.2em" }}>⭐</div>
          <div className="value">{player.totalStars}</div>
          <div className="label">Stars</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ fontSize: "1.2em" }}>✨</div>
          <div className="value">{wizardProfile?.totalSpellsLearned || 0}</div>
          <div className="label">Spells</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ fontSize: "1.2em" }}>🏆</div>
          <div className="value">{player.questsCompleted}</div>
          <div className="label">Quests</div>
        </div>
      </div>

      {/* Practice Arena - Combined practice button */}
      <div
        onClick={onPracticeMode}
        style={{
          background: totalWeeklyQuests > 0 || weakTopicsCount > 0
            ? "linear-gradient(180deg, #4c1d95 0%, #2e1065 100%)"
            : "linear-gradient(180deg, #166534 0%, #14532d 100%)",
          borderRadius: "16px",
          padding: "16px 20px",
          margin: "15px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          border: totalWeeklyQuests > 0 || weakTopicsCount > 0
            ? "3px solid #a78bfa"
            : "3px solid #4ade80",
          boxShadow: totalWeeklyQuests > 0 || weakTopicsCount > 0
            ? "0 6px 20px rgba(139, 92, 246, 0.4)"
            : "0 6px 20px rgba(74, 222, 128, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8em",
            background: totalWeeklyQuests > 0 || weakTopicsCount > 0
              ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
              : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,0.2)",
          }}>
            ⚔️
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: "1.1em",
              color: "#f1f5f9",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}>PRACTICE ARENA</h3>
            <p style={{
              margin: "4px 0 0 0",
              color: totalWeeklyQuests > 0 || weakTopicsCount > 0 ? "#c4b5fd" : "#86efac",
              fontSize: "0.85em"
            }}>
              {totalWeeklyQuests > 0
                ? `${completedWeeklyQuests}/${totalWeeklyQuests} exercises from YOUR mistakes`
                : weakTopicsCount > 0
                ? `${weakTopicsCount} topic${weakTopicsCount > 1 ? "s" : ""} need practice`
                : "All topics mastered!"}
            </p>
          </div>
        </div>
        {(totalWeeklyQuests > 0 || weakTopicsCount > 0) && (
          <div style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "#000",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "1.1em",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            border: "2px solid rgba(255,255,255,0.3)",
          }}>
            {totalWeeklyQuests > 0 ? totalWeeklyQuests - completedWeeklyQuests : weakTopicsCount}
          </div>
        )}
      </div>

      {/* Parent Settings Quick Link */}
      <div
        onClick={onParentSettings}
        style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: "10px",
          padding: "12px 15px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
          marginBottom: "15px",
        }}
      >
        <span style={{ fontSize: "1.5em" }}>👨‍👩‍👧</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.9em" }}>Parent Notifications</div>
          <div style={{ color: "#888", fontSize: "0.8em" }}>Link Telegram for progress reports</div>
        </div>
        <span style={{ color: "#888" }}>→</span>
      </div>

      {/* Section Title */}
      <h2 className="section-title">📜 WEEKLY QUESTS - Week 12</h2>

      {/* Homework Link Card */}
      <div
        onClick={onHomework}
        style={{
          background: "linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
          borderRadius: "12px",
          padding: "15px",
          cursor: "pointer",
          border: "2px solid #a855f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "15px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "2em" }}>📚</span>
          <div>
            <div style={{ fontWeight: "bold", color: "white" }}>My Homework</div>
            <div style={{ color: "#c4b5fd", fontSize: "0.85em" }}>
              {homeworkSessions && homeworkSessions.length > 0
                ? `${homeworkSessions.length} active`
                : "Scan to create games"}
            </div>
          </div>
        </div>
        {homeworkSessions && homeworkSessions.length > 0 && (
          <span style={{
            background: "#8b5cf6",
            color: "white",
            borderRadius: "10px",
            padding: "4px 10px",
            fontSize: "0.9em",
            fontWeight: "bold",
          }}>
            {homeworkSessions.length}
          </span>
        )}
        <span style={{ color: "#a855f7", fontSize: "1.2em" }}>→</span>
      </div>

      {/* Level Grid - Show only first 6 games */}
      <div className="level-grid">
        {LEVELS.slice(0, 6).map((level) => {
          const progress = completedLevels[level.id] || { stars: 0, done: false };
          const unlock = level.unlock as GameUnlock | undefined;
          const unlocked = isGameUnlocked(level.id, unlock);
          const isHomeworkLocked = unlock?.type === "homework" && !unlocked;
          const isPurchasable = isHomeworkLocked && unlock?.requirement;

          return (
            <div
              key={level.id}
              className={`level-card ${!unlocked ? "locked" : ""} ${progress.done ? "completed" : ""}`}
              onClick={() => handleGameClick(level)}
              style={!unlocked ? {
                opacity: 0.7,
                filter: "grayscale(30%)",
                position: "relative",
              } : undefined}
            >
              {!unlocked && (
                <div
                  className="lock-overlay"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "2em" }}>🔒</span>
                  {isHomeworkLocked && (
                    <div style={{
                      textAlign: "center",
                      padding: "0 10px",
                    }}>
                      <div style={{
                        fontSize: "0.75em",
                        color: "#fbbf24",
                        fontWeight: "bold",
                        marginBottom: "4px",
                      }}>
                        📸 Do homework to unlock!
                      </div>
                      {isPurchasable && (
                        <div style={{
                          fontSize: "0.7em",
                          color: "#a78bfa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}>
                          or buy for 💎 {unlock?.requirement}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="level-header">
                <div className="level-icon">{level.icon}</div>
                <div className="level-rewards">
                  <span className="reward-tag">💎 {level.rewards.diamonds}</span>
                  <span className="reward-tag">⭐ {level.rewards.xp}</span>
                </div>
              </div>
              <h3>{level.name}</h3>
              <p>{level.desc}</p>
              {progress.done && (
                <div className="level-progress">
                  <div className="level-progress-bar">
                    <div
                      className="level-progress-fill"
                      style={{ width: `${(progress.stars / 3) * 100}%` }}
                    />
                  </div>
                  <span className="level-progress-text">
                    {"⭐".repeat(progress.stars)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* See All Games Button */}
      {LEVELS.length > 6 && (
        <div
          onClick={onAllGames}
          style={{
            background: "linear-gradient(135deg, rgba(252, 219, 5, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)",
            borderRadius: "12px",
            padding: "15px",
            cursor: "pointer",
            border: "2px solid #FCDB05",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginTop: "15px",
          }}
        >
          <span style={{ color: "#FCDB05", fontWeight: "bold" }}>
            See All {LEVELS.length} Games
          </span>
          <span style={{ color: "#FCDB05" }}>→</span>
        </div>
      )}

      {/* Unlock Modal */}
      {unlockModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setUnlockModal(null)}
        >
          <div
            style={{
              background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)",
              borderRadius: "20px",
              padding: "30px",
              maxWidth: "350px",
              width: "100%",
              border: "3px solid #8b5cf6",
              boxShadow: "0 0 40px rgba(139, 92, 246, 0.5)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "3em", marginBottom: "15px" }}>🔒</div>
            <h2 style={{
              fontSize: "1.3em",
              color: "#f1f5f9",
              marginBottom: "10px",
            }}>
              {unlockModal.levelName}
            </h2>
            <p style={{
              color: "#94a3b8",
              marginBottom: "25px",
              lineHeight: "1.5",
            }}>
              This game is locked! Complete your homework today to unlock it for free.
            </p>

            {/* Scan Homework Button */}
            <button
              onClick={() => {
                setUnlockModal(null);
                onScanHomework?.();
              }}
              style={{
                width: "100%",
                padding: "15px",
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                border: "none",
                borderRadius: "12px",
                color: "#000",
                fontWeight: "bold",
                fontSize: "1em",
                cursor: "pointer",
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>📸</span> Scan Homework
            </button>

            {/* Divider */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}>
              <div style={{ flex: 1, height: "1px", background: "#334155" }} />
              <span style={{ color: "#64748b", fontSize: "0.85em" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "#334155" }} />
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={player.diamonds < unlockModal.cost}
              style={{
                width: "100%",
                padding: "15px",
                background: player.diamonds >= unlockModal.cost
                  ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                  : "rgba(100,100,100,0.3)",
                border: "none",
                borderRadius: "12px",
                color: player.diamonds >= unlockModal.cost ? "#fff" : "#666",
                fontWeight: "bold",
                fontSize: "1em",
                cursor: player.diamonds >= unlockModal.cost ? "pointer" : "not-allowed",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>💎</span> Buy Forever for {unlockModal.cost}
            </button>

            <div style={{
              color: "#64748b",
              fontSize: "0.8em",
            }}>
              You have: 💎 {player.diamonds}
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setUnlockModal(null)}
              style={{
                marginTop: "15px",
                background: "transparent",
                border: "1px solid #475569",
                borderRadius: "8px",
                padding: "10px 20px",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "0.9em",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
