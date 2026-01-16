"use client";

import { useAppStore } from "@/lib/store";
import { UserButton, useAuth } from "@clerk/nextjs";

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
  completedLevels: Record<string, { stars: number; done: boolean }>;
  onStartLevel: (levelId: string) => void;
  onScanHomework?: () => void;
  onPracticeMode?: () => void;
  weakTopicsCount?: number;
}

export function HomeScreen({
  completedLevels,
  onStartLevel,
  onScanHomework,
  onPracticeMode,
  weakTopicsCount = 0,
}: HomeScreenProps) {
  const player = useAppStore((state) => state.player);
  const showDailyReward = useAppStore((state) => state.showDailyRewardModal);
  const { isSignedIn } = useAuth();

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
          <span style={{ fontSize: "2em" }}>{player.skin}</span>
          <div>
            <div style={{ fontWeight: "bold", color: "white" }}>{player.name}</div>
            <div style={{ fontSize: "0.8em", color: "#AAA" }}>
              Level {player.level} • {player.xp}/{player.xpNext} XP
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
          <div style={{
            padding: "5px 10px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "5px",
            fontSize: "0.8em",
            color: "#AAA",
          }}>
            👤 Guest
          </div>
        )}
      </div>

      {/* Daily Banner */}
      <div className="daily-banner" onClick={showDailyReward}>
        <div>
          <h3>🎁 DAILY REWARD!</h3>
          <p>Claim free rewards!</p>
        </div>
        <div className="daily-icon">📦</div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="icon">🔥</div>
          <div className="value">{player.streak}</div>
          <div className="label">Day Streak</div>
        </div>
        <div className="stat-card">
          <div className="icon">⭐</div>
          <div className="value">{player.totalStars}</div>
          <div className="label">Stars</div>
        </div>
        <div className="stat-card">
          <div className="icon">📚</div>
          <div className="value">{player.wordsLearned}</div>
          <div className="label">Words</div>
        </div>
        <div className="stat-card">
          <div className="icon">🏆</div>
          <div className="value">{player.questsCompleted}</div>
          <div className="label">Quests</div>
        </div>
      </div>

      {/* MAIN FEATURE: Scan Homework Button (from PRD) */}
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
