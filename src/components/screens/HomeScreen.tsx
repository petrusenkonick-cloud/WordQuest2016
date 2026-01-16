"use client";

import { useAppStore } from "@/lib/store";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useEffect } from "react";

// Level data
const LEVELS = [
  {
    id: "suffix",
    name: "SUFFIX MINE",
    icon: "🪨",
    desc: 'Learn "-less" words',
    rewards: { diamonds: 50, emeralds: 20, xp: 100 },
  },
  {
    id: "imperative",
    name: "COMMAND SCROLL",
    icon: "📜",
    desc: "Command or Request?",
    rewards: { diamonds: 50, emeralds: 25, xp: 120 },
  },
  {
    id: "interrogative",
    name: "QUESTION FORGE",
    icon: "❓",
    desc: "Create questions",
    rewards: { diamonds: 60, emeralds: 30, xp: 150 },
  },
  {
    id: "crossword",
    name: "WORD MAP",
    icon: "🗺️",
    desc: "Vocabulary puzzle",
    rewards: { diamonds: 80, emeralds: 40, xp: 200 },
  },
  {
    id: "vocabulary",
    name: "CRAFTING TABLE",
    icon: "⚒️",
    desc: "Build sentences",
    rewards: { diamonds: 70, emeralds: 35, xp: 180 },
  },
  {
    id: "story",
    name: "STORY QUEST",
    icon: "📖",
    desc: "Be a detective!",
    rewards: { diamonds: 100, emeralds: 50, xp: 250 },
  },
];

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
}: HomeScreenProps) {
  const player = useAppStore((state) => state.player);
  const showDailyReward = useAppStore((state) => state.showDailyRewardModal);
  const { isSignedIn } = useAuth();

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

  return (
    <div className="screen active">
      {/* Player Header with Auth */}
      <div className="player-header" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        marginBottom: "10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5em",
            border: "2px solid #a5b4fc",
          }}>
            🧙
          </div>
          <div>
            <div style={{ fontWeight: "bold", color: "white" }}>{player.name}</div>
            <div style={{ fontSize: "0.8em", color: "#a5b4fc" }}>
              {wizardProfile?.wizardTitle || "Apprentice"} • Lvl {wizardProfile?.academyLevel || 1}
            </div>
          </div>
        </div>
        {isSignedIn && (
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: {
                  width: "40px",
                  height: "40px",
                },
              },
            }}
          />
        )}
        {!isSignedIn && (
          <div
            onClick={onLogout}
            style={{
              padding: "8px 12px",
              background: "rgba(239, 68, 68, 0.2)",
              borderRadius: "8px",
              fontSize: "0.85em",
              color: "#fca5a5",
              cursor: "pointer",
              border: "1px solid #ef444440",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Guest</span>
            <span style={{ fontSize: "0.9em" }}>↪</span>
          </div>
        )}
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

      {/* MAIN FEATURE: Scan Homework Button */}
      <div className="scan-homework-btn" onClick={onScanHomework}>
        <span className="camera-icon">📸</span>
        <h3>SCAN HOMEWORK</h3>
        <p>AI creates a game from your homework!</p>
      </div>

      {/* Practice Mode Button */}
      <div
        onClick={onPracticeMode}
        style={{
          background: weakTopicsCount > 0
            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.3) 100%)"
            : "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)",
          borderRadius: "15px",
          padding: "15px 20px",
          margin: "15px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          border: `2px solid ${weakTopicsCount > 0 ? "#f59e0b" : "#22c55e"}`,
          transition: "transform 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: "2em" }}>🎯</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1em" }}>PRACTICE MODE</h3>
            <p style={{ margin: 0, color: "#AAA", fontSize: "0.9em" }}>
              {weakTopicsCount > 0
                ? `${weakTopicsCount} topic${weakTopicsCount > 1 ? "s" : ""} need practice`
                : "All topics mastered!"}
            </p>
          </div>
        </div>
        {weakTopicsCount > 0 && (
          <div style={{
            background: "#f59e0b",
            color: "#000",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}>
            {weakTopicsCount}
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

      {/* Level Grid */}
      <div className="level-grid">
        {LEVELS.map((level, index) => {
          const progress = completedLevels[level.id] || { stars: 0, done: false };
          const prevLevel = index > 0 ? LEVELS[index - 1] : null;
          const locked = prevLevel ? !completedLevels[prevLevel.id]?.done : false;

          return (
            <div
              key={level.id}
              className={`level-card ${locked ? "locked" : ""} ${progress.done ? "completed" : ""}`}
              onClick={() => !locked && onStartLevel(level.id)}
            >
              {locked && <div className="lock-overlay">🔒</div>}
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
    </div>
  );
}
