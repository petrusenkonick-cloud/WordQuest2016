"use client";

import { motion } from "framer-motion";
import { LEVELS as GAME_LEVELS, GameUnlock } from "@/lib/gameData";
import { LevelCard } from "../ui/Card";

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

interface GamesScreenProps {
  completedLevels: Record<string, { stars: number; done: boolean }>;
  onStartLevel: (levelId: string) => void;
  onBack: () => void;
  gameUnlockState?: {
    homeworkCompletedToday: boolean;
    purchasedGames: string[];
  };
}

export function GamesScreen({
  completedLevels,
  onStartLevel,
  onBack,
  gameUnlockState,
}: GamesScreenProps) {
  // Check if a game is unlocked
  const isGameUnlocked = (levelId: string, unlock?: GameUnlock): boolean => {
    if (!unlock) return true;

    if (unlock.type === "homework") {
      // Check if homework was completed today OR if purchased
      return (
        gameUnlockState?.homeworkCompletedToday ||
        gameUnlockState?.purchasedGames?.includes(levelId) ||
        false
      );
    }

    // All other types (free, streak, purchase) - default to unlocked for simplicity
    return unlock.type === "free" || true;
  };

  return (
    <div className="screen active" style={{ paddingBottom: "100px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "15px",
        marginBottom: "20px",
      }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "2px solid #444",
            borderRadius: "10px",
            padding: "10px 15px",
            color: "white",
            cursor: "pointer",
            fontSize: "1.2em",
          }}
        >
          ←
        </button>
        <h1 style={{
          fontSize: "1.3em",
          color: "#FCDB05",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          margin: 0,
        }}>
          🎮 All Games
        </h1>
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: "12px",
          padding: "15px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-around",
          border: "2px solid #333",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#FCDB05", fontSize: "1.5em", fontWeight: "bold" }}>
            {Object.values(completedLevels).filter(l => l.done).length}
          </div>
          <div style={{ color: "#888", fontSize: "0.8em" }}>Completed</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#4AEDD9", fontSize: "1.5em", fontWeight: "bold" }}>
            {LEVELS.length}
          </div>
          <div style={{ color: "#888", fontSize: "0.8em" }}>Total Games</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#FFD700", fontSize: "1.5em", fontWeight: "bold" }}>
            {Object.values(completedLevels).reduce((sum, l) => sum + (l.stars || 0), 0)}
          </div>
          <div style={{ color: "#888", fontSize: "0.8em" }}>Stars</div>
        </div>
      </motion.div>

      {/* Level Grid */}
      <div className="level-grid">
        {LEVELS.map((level, index) => {
          const progress = completedLevels[level.id] || { stars: 0, done: false };
          const unlock = level.unlock as GameUnlock | undefined;
          const unlocked = isGameUnlocked(level.id, unlock);

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <LevelCard
                icon={level.icon}
                name={level.name}
                desc={level.desc}
                rewards={{ diamonds: level.rewards.diamonds, xp: level.rewards.xp }}
                stars={progress.stars}
                completed={progress.done}
                locked={!unlocked}
                onClick={() => onStartLevel(level.id)}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
