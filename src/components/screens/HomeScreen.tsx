"use client";

import { useAppStore } from "@/lib/store";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useState, useMemo } from "react";
import { LEVELS as GAME_LEVELS, GameUnlock } from "@/lib/gameData";
import { SectionHeader } from "../ui/SectionHeader";
import { MascotBubble, MASCOT_MESSAGES } from "../tutorial/MascotBubble";
import { StartHereIndicator } from "../tutorial/StartHereIndicator";
import { useTutorialOptional } from "../tutorial/TutorialProvider";
import { LeaderboardPodium } from "../ui/LeaderboardPodium";

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
  onLifeSkillsAcademy?: () => void;
}

// Determine recommended action for "START HERE" indicator
function getRecommendedAction(
  homeworkSessions: HomeworkSession[] | undefined,
  weeklyQuestsCount: number,
  dailyQuestsCompleted: number,
  totalDailyQuests: number,
  weakTopicsCount: number
): "homework" | "practice" | "daily" | "quest" | "games" {
  // New player - start with homework
  if (!homeworkSessions || homeworkSessions.length === 0) {
    return "homework";
  }
  // Has mistakes to practice
  if (weeklyQuestsCount > 0 || weakTopicsCount > 0) {
    return "practice";
  }
  // Daily quests incomplete
  if (dailyQuestsCompleted < totalDailyQuests) {
    return "daily";
  }
  // Default - play games
  return "games";
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
  weakTopicsCount = 0,
  onPlayHomework,
  onShop,
  onInventory,
  onAchievements,
  onGemHub,
  onProfileSettings,
  onHomework,
  onAllGames,
  onLifeSkillsAcademy,
}: HomeScreenProps) {
  const player = useAppStore((state) => state.player);
  const showDailyReward = useAppStore((state) => state.showDailyRewardModal);
  const tutorial = useTutorialOptional();

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
      if (wizardProfile === null) {
        initWizard({ playerId });
      }
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
  const pendingWeeklyQuests = totalWeeklyQuests - completedWeeklyQuests;

  // Determine recommended action
  const recommendedAction = useMemo(() => {
    return getRecommendedAction(
      homeworkSessions as HomeworkSession[] | undefined,
      pendingWeeklyQuests,
      completedDailyQuests,
      totalDailyQuests,
      weakTopicsCount
    );
  }, [homeworkSessions, pendingWeeklyQuests, completedDailyQuests, totalDailyQuests, weakTopicsCount]);

  // Mascot message based on context
  const mascotMessage = useMemo(() => {
    if (!homeworkSessions || homeworkSessions.length === 0) {
      return MASCOT_MESSAGES.startHomework;
    }
    if (pendingWeeklyQuests > 0) {
      return MASCOT_MESSAGES.practiceTime;
    }
    if (completedDailyQuests >= totalDailyQuests) {
      return MASCOT_MESSAGES.allComplete;
    }
    return MASCOT_MESSAGES.welcomeBack;
  }, [homeworkSessions, pendingWeeklyQuests, completedDailyQuests, totalDailyQuests]);

  return (
    <div className="screen active" style={{ paddingTop: "10px" }}>
      {/* Top Wizards Leaderboard */}
      <LeaderboardPodium playerId={playerId} onViewFull={onLeaderboard} />

      {/* Quick Actions Row - Daily Reward & Share */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
        marginBottom: "12px",
      }}>
        {/* Daily Reward Banner */}
        <div
          onClick={showDailyReward}
          style={{
            background: "linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)",
            borderRadius: "12px",
            padding: "10px 12px",
            cursor: "pointer",
            border: "2px solid #fbbf24",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "1.5em" }}>🎁</span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "0.8em", color: "#fbbf24" }}>Daily Reward</div>
            <div style={{ color: "#fde68a", fontSize: "0.65em" }}>Free gems!</div>
          </div>
        </div>

        {/* Share & Get 1000 Banner */}
        <div
          onClick={() => {
            // Share functionality
            const shareUrl = `${window.location.origin}?ref=${playerId || 'guest'}`;
            const shareText = "Join me on WordQuest Academy! Learn words and have fun! 🧙‍♂️✨";

            if (navigator.share) {
              navigator.share({
                title: "WordQuest Academy",
                text: shareText,
                url: shareUrl,
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
              alert("Link copied! Share it with friends to earn 1000 points!");
            }
          }}
          style={{
            background: "linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.3) 100%)",
            borderRadius: "12px",
            padding: "10px 12px",
            cursor: "pointer",
            border: "2px solid #22c55e",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "1.5em" }}>🎉</span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "0.8em", color: "#22c55e" }}>Share & Get</div>
            <div style={{ color: "#86efac", fontSize: "0.65em" }}>+1000 pts!</div>
          </div>
        </div>
      </div>

      {/* 🧙‍♂️ MASCOT HEADER */}
      <MascotBubble
        message={mascotMessage}
        showHelp={true}
        onHelpClick={() => tutorial?.startTutorial()}
        variant="greeting"
      />

      {/* ════════════ 📚 LEARN SECTION ════════════ */}
      <SectionHeader title="LEARN" icon="📚" infoKey="learn" />

      {/* Homework + Quest Map Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
        marginBottom: "8px",
      }}>
        {/* Homework Card */}
        <StartHereIndicator active={recommendedAction === "homework"}>
          <div
            id="homework-section"
            onClick={onScanHomework}
            style={{
              background: "linear-gradient(135deg, rgba(251, 146, 60, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
              borderRadius: "14px",
              padding: "16px 12px",
              cursor: "pointer",
              border: "2px solid #fb923c",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "2em" }}>📸</span>
            <div style={{ fontWeight: "bold", fontSize: "0.85em" }}>HOMEWORK</div>
            <div style={{ color: "#fed7aa", fontSize: "0.7em" }}>Scan & Play</div>
          </div>
        </StartHereIndicator>

        {/* Quest Map Card */}
        <div
          id="quest-map"
          onClick={onQuestMap}
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
            borderRadius: "14px",
            padding: "16px 12px",
            cursor: "pointer",
            border: "2px solid #6366f1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "2em" }}>🗺️</span>
          <div style={{ fontWeight: "bold", fontSize: "0.85em" }}>QUEST MAP</div>
          <div style={{ color: "#a5b4fc", fontSize: "0.7em" }}>
            Ch. {wizardProfile?.currentChapter || 1}
          </div>
        </div>
      </div>

      {/* Life Skills Academy - Full Width */}
      <div
        onClick={onLifeSkillsAcademy}
        style={{
          background: "linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
          borderRadius: "12px",
          padding: "12px",
          cursor: "pointer",
          border: "2px solid #ec4899",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "1.6em" }}>🏰</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: "bold", fontSize: "0.85em" }}>LIFE SKILLS ACADEMY</div>
          <div style={{ color: "#f9a8d4", fontSize: "0.7em" }}>
            21st Century Skills
          </div>
        </div>
        <span style={{
          background: "linear-gradient(135deg, #ec4899, #f472b6)",
          padding: "3px 6px",
          borderRadius: "6px",
          fontSize: "0.65em",
          fontWeight: "bold",
          flexShrink: 0,
        }}>
          NEW
        </span>
      </div>

      {/* ════════════ 🎯 PRACTICE SECTION ════════════ */}
      <SectionHeader title="PRACTICE" icon="🎯" infoKey="practice" />

      {/* Practice Arena */}
      <StartHereIndicator active={recommendedAction === "practice"} label="TRAIN!">
        <div
          id="practice-arena"
          onClick={onPracticeMode}
          style={{
            background: pendingWeeklyQuests > 0 || weakTopicsCount > 0
              ? "linear-gradient(180deg, #4c1d95 0%, #2e1065 100%)"
              : "linear-gradient(180deg, #166534 0%, #14532d 100%)",
            borderRadius: "14px",
            padding: "12px 14px",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            border: pendingWeeklyQuests > 0 || weakTopicsCount > 0
              ? "2px solid #a78bfa"
              : "2px solid #4ade80",
            boxShadow: pendingWeeklyQuests > 0 || weakTopicsCount > 0
              ? "0 4px 15px rgba(139, 92, 246, 0.3)"
              : "0 4px 15px rgba(74, 222, 128, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5em",
              background: pendingWeeklyQuests > 0 || weakTopicsCount > 0
                ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.2)",
              flexShrink: 0,
            }}>
              ⚔️
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                margin: 0,
                fontSize: "0.95em",
                color: "#f1f5f9",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}>PRACTICE ARENA</h3>
              <p style={{
                margin: "2px 0 0 0",
                color: pendingWeeklyQuests > 0 || weakTopicsCount > 0 ? "#c4b5fd" : "#86efac",
                fontSize: "0.75em"
              }}>
                {pendingWeeklyQuests > 0
                  ? `${pendingWeeklyQuests} from YOUR mistakes`
                  : weakTopicsCount > 0
                  ? `${weakTopicsCount} topic${weakTopicsCount > 1 ? "s" : ""} need practice`
                  : "All topics mastered!"}
              </p>
            </div>
          </div>
          {(pendingWeeklyQuests > 0 || weakTopicsCount > 0) && (
            <div style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#000",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "0.95em",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              border: "2px solid rgba(255,255,255,0.3)",
              flexShrink: 0,
            }}>
              {pendingWeeklyQuests > 0 ? pendingWeeklyQuests : weakTopicsCount}
            </div>
          )}
        </div>
      </StartHereIndicator>

      {/* Daily Quests Progress */}
      {dailyQuests && dailyQuests.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(30, 27, 75, 0.4) 100%)",
          borderRadius: "10px",
          padding: "10px 12px",
          marginBottom: "12px",
          border: "1px solid #8b5cf640",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ color: "#c4b5fd", fontWeight: "bold", fontSize: "0.8em" }}>
              📋 Daily Quests
            </span>
            <span style={{ color: "#8b5cf6", fontSize: "0.75em" }}>
              {completedDailyQuests}/{totalDailyQuests}
            </span>
          </div>
          <div style={{
            display: "flex",
            gap: "4px",
          }}>
            {dailyQuests.map((quest, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "5px",
                  borderRadius: "3px",
                  background: quest.isCompleted ? "#8b5cf6" : "rgba(0,0,0,0.4)",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ════════════ 🎮 PLAY SECTION ════════════ */}
      <SectionHeader title="PLAY" icon="🎮" infoKey="play" />

      {/* Game Grid - First 3 games */}
      <div id="games-section" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
        marginBottom: "8px",
      }}>
        {LEVELS.slice(0, 3).map((level) => {
          const progress = completedLevels[level.id] || { stars: 0, done: false };
          const unlock = level.unlock as GameUnlock | undefined;
          const unlocked = isGameUnlocked(level.id, unlock);

          return (
            <div
              key={level.id}
              onClick={() => handleGameClick(level)}
              style={{
                background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)",
                borderRadius: "12px",
                padding: "12px 8px",
                cursor: "pointer",
                border: unlocked ? "2px solid #6366f1" : "2px solid #475569",
                textAlign: "center",
                opacity: unlocked ? 1 : 0.7,
                position: "relative",
              }}
            >
              {!unlocked && (
                <div style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  fontSize: "0.8em",
                }}>
                  🔒
                </div>
              )}
              <div style={{ fontSize: "1.6em", marginBottom: "4px" }}>{level.icon}</div>
              <div style={{
                fontSize: "0.65em",
                fontWeight: "bold",
                marginBottom: "2px",
                color: "#e2e8f0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {level.name.toUpperCase()}
              </div>
              <div style={{
                fontSize: "0.65em",
                color: "#a78bfa",
              }}>
                💎 {level.rewards.diamonds}
              </div>
              {progress.done && (
                <div style={{
                  fontSize: "0.6em",
                  color: "#fbbf24",
                  marginTop: "2px",
                }}>
                  {"⭐".repeat(progress.stars)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* See All Games Button */}
      <div
        onClick={onAllGames}
        style={{
          background: "linear-gradient(135deg, rgba(252, 219, 5, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)",
          borderRadius: "10px",
          padding: "10px",
          cursor: "pointer",
          border: "2px solid #FCDB05",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <span style={{ color: "#FCDB05", fontWeight: "bold", fontSize: "0.8em" }}>
          See All {LEVELS.length} Games
        </span>
        <span style={{ color: "#FCDB05" }}>→</span>
      </div>

      {/* ════════════ 📊 PROGRESS SECTION ════════════ */}
      <SectionHeader title="PROGRESS" icon="📊" infoKey="progress" />

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: "12px" }}>
        <div className="stat-card">
          <div className="icon" style={{ fontSize: "1em" }}>🔥</div>
          <div className="value">{player.streak}</div>
          <div className="label">Streak</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ fontSize: "1em" }}>⭐</div>
          <div className="value">{player.totalStars}</div>
          <div className="label">Stars</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ fontSize: "1em" }}>✨</div>
          <div className="value">{wizardProfile?.totalSpellsLearned || 0}</div>
          <div className="label">Spells</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ fontSize: "1em" }}>🏆</div>
          <div className="value">{player.questsCompleted}</div>
          <div className="label">Quests</div>
        </div>
      </div>

      {/* Dashboard & Leaderboard Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
        marginBottom: "12px",
      }}>
        {/* Dashboard */}
        <div
          onClick={onDashboard}
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
            borderRadius: "10px",
            padding: "12px",
            cursor: "pointer",
            border: "2px solid #3b82f6",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "1.4em" }}>📊</span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "0.8em" }}>Dashboard</div>
            <div style={{ color: "#93c5fd", fontSize: "0.7em" }}>Your Stats</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div
          onClick={onLeaderboard}
          style={{
            background: "linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
            borderRadius: "10px",
            padding: "12px",
            cursor: "pointer",
            border: "2px solid #eab308",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "1.4em" }}>🏆</span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "0.8em" }}>Leaders</div>
            <div style={{ color: "#fde047", fontSize: "0.7em" }}>Top Wizards</div>
          </div>
        </div>
      </div>

      {/* ════════════ 🔧 SETTINGS SECTION ════════════ */}
      <SectionHeader title="MORE" icon="🔧" infoKey="settings" />

      {/* Settings Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
        marginBottom: "12px",
      }}>
        {/* Parent Settings */}
        <div
          onClick={onParentSettings}
          style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: "10px",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          }}
        >
          <span style={{ fontSize: "1.2em" }}>👨‍👩‍👧</span>
          <div style={{ fontSize: "0.8em" }}>Parents</div>
        </div>

        {/* Spell Book */}
        <div
          onClick={onSpellBook}
          style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: "10px",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          }}
        >
          <span style={{ fontSize: "1.2em" }}>📖</span>
          <div style={{ fontSize: "0.8em" }}>
            Spells ({spellBookStats?.totalSpells || 0})
          </div>
        </div>
      </div>

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
