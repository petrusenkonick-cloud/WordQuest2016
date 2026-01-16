"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

interface WeeklyQuestsScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
  onStartPractice: (questId: Id<"weeklyPracticeQuests">) => void;
}

// Topic icons and colors - brighter, more distinct colors
const TOPIC_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
  suffixes: { icon: "🎯", color: "#fbbf24", bg: "#78350f" },
  prefixes: { icon: "🔑", color: "#a78bfa", bg: "#4c1d95" },
  verbs: { icon: "🏃", color: "#4ade80", bg: "#14532d" },
  nouns: { icon: "📦", color: "#60a5fa", bg: "#1e3a5f" },
  adjectives: { icon: "🎨", color: "#f472b6", bg: "#831843" },
  spelling: { icon: "✍️", color: "#2dd4bf", bg: "#134e4a" },
  grammar: { icon: "📝", color: "#fb7185", bg: "#881337" },
  punctuation: { icon: "❗", color: "#facc15", bg: "#713f12" },
  multiplication: { icon: "✖️", color: "#4ade80", bg: "#14532d" },
  division: { icon: "➗", color: "#60a5fa", bg: "#1e3a5f" },
  addition: { icon: "➕", color: "#fbbf24", bg: "#78350f" },
  subtraction: { icon: "➖", color: "#f472b6", bg: "#831843" },
  fractions: { icon: "🍕", color: "#a78bfa", bg: "#4c1d95" },
  decimals: { icon: "🔢", color: "#2dd4bf", bg: "#134e4a" },
  word_problems: { icon: "🧩", color: "#fb7185", bg: "#881337" },
  default: { icon: "📚", color: "#c4b5fd", bg: "#3730a3" },
};

function getTopicStyle(topic: string) {
  return TOPIC_STYLES[topic.toLowerCase()] || TOPIC_STYLES.default;
}

// Practice Quest Card - Redesigned for clarity
function PracticeQuestCard({
  quest,
  index,
  onStart,
}: {
  quest: {
    _id: Id<"weeklyPracticeQuests">;
    questName: string;
    questIcon: string;
    description: string;
    topic: string;
    subject: string;
    errorCount: number;
    targetCorrect: number;
    currentCorrect: number;
    isCompleted: boolean;
    reward: { diamonds: number; emeralds: number; xp: number };
  };
  index: number;
  onStart: () => void;
}) {
  const progress = (quest.currentCorrect / quest.targetCorrect) * 100;
  const topicStyle = getTopicStyle(quest.topic);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={!quest.isCompleted ? onStart : undefined}
      className={`relative ${quest.isCompleted ? "" : "cursor-pointer"}`}
      whileHover={!quest.isCompleted ? { scale: 1.02, y: -2 } : {}}
      whileTap={!quest.isCompleted ? { scale: 0.98 } : {}}
    >
      {/* Main Card Container */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: quest.isCompleted
            ? "linear-gradient(180deg, #166534 0%, #14532d 100%)"
            : "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          border: quest.isCompleted
            ? "3px solid #4ade80"
            : "3px solid #334155",
          boxShadow: quest.isCompleted
            ? "0 8px 32px rgba(74, 222, 128, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
            : "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Top Section with Icon and Title */}
        <div className="flex items-center gap-4 p-4 pb-3">
          {/* Large Icon Badge */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 relative"
            style={{
              background: quest.isCompleted
                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                : `linear-gradient(135deg, ${topicStyle.color} 0%, ${topicStyle.bg} 100%)`,
              boxShadow: quest.isCompleted
                ? "0 4px 12px rgba(34, 197, 94, 0.5), inset 0 2px 0 rgba(255,255,255,0.3)"
                : `0 4px 12px ${topicStyle.color}40, inset 0 2px 0 rgba(255,255,255,0.2)`,
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          >
            {quest.isCompleted ? "✅" : quest.questIcon}
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-lg mb-1 leading-tight"
              style={{
                color: quest.isCompleted ? "#86efac" : "#f1f5f9",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {quest.questName}
            </h3>
            <p
              className="text-sm leading-snug"
              style={{ color: quest.isCompleted ? "#bbf7d0" : "#94a3b8" }}
            >
              {quest.description}
            </p>
          </div>

          {/* Play Button or Done Badge */}
          {quest.isCompleted ? (
            <div
              className="px-4 py-2 rounded-xl font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                color: "#052e16",
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)",
              }}
            >
              ✓ DONE
            </div>
          ) : (
            <motion.div
              className="px-5 py-3 rounded-xl font-bold text-sm"
              style={{
                background: `linear-gradient(135deg, ${topicStyle.color} 0%, ${topicStyle.bg} 100%)`,
                color: "#fff",
                boxShadow: `0 4px 16px ${topicStyle.color}50`,
                border: "2px solid rgba(255,255,255,0.2)",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
              whileHover={{ scale: 1.05 }}
            >
              PLAY →
            </motion.div>
          )}
        </div>

        {/* Progress Section */}
        <div
          className="px-4 py-3"
          style={{
            background: quest.isCompleted
              ? "rgba(0,0,0,0.2)"
              : "rgba(0,0,0,0.3)",
          }}
        >
          {/* Progress Label */}
          <div className="flex justify-between items-center mb-2">
            <span
              className="text-sm font-semibold"
              style={{ color: quest.isCompleted ? "#86efac" : "#e2e8f0" }}
            >
              Progress: {quest.currentCorrect} / {quest.targetCorrect} correct
            </span>
            <span
              className="text-sm font-bold px-2 py-0.5 rounded"
              style={{
                background: quest.isCompleted ? "rgba(74, 222, 128, 0.2)" : `${topicStyle.color}20`,
                color: quest.isCompleted ? "#4ade80" : topicStyle.color,
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className="h-4 rounded-full overflow-hidden"
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "2px solid rgba(255,255,255,0.1)",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 + 0.2, ease: "easeOut" }}
              className="h-full rounded-full relative"
              style={{
                background: quest.isCompleted
                  ? "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)"
                  : `linear-gradient(90deg, ${topicStyle.bg} 0%, ${topicStyle.color} 100%)`,
                boxShadow: quest.isCompleted
                  ? "0 0 8px #4ade80"
                  : `0 0 8px ${topicStyle.color}80`,
              }}
            >
              {/* Shine effect */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Rewards Section */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            background: quest.isCompleted
              ? "rgba(0,0,0,0.15)"
              : "rgba(0,0,0,0.2)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "#64748b" }}
          >
            Reward:
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(6, 182, 212, 0.15)" }}>
              <span className="text-base">💎</span>
              <span className="font-bold text-cyan-400">{quest.reward.diamonds}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(34, 197, 94, 0.15)" }}>
              <span className="text-base">🟢</span>
              <span className="font-bold text-green-400">{quest.reward.emeralds}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(168, 85, 247, 0.15)" }}>
              <span className="text-base">✨</span>
              <span className="font-bold text-purple-400">{quest.reward.xp} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error count badge - repositioned */}
      {!quest.isCompleted && quest.errorCount > 0 && (
        <div
          className="absolute -top-2 -left-2 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.5)",
            border: "2px solid #fecaca",
          }}
        >
          {quest.errorCount} mistakes
        </div>
      )}
    </motion.div>
  );
}

// Weekly Champion Progress Component - Redesigned
function WeeklyChampionCard({
  champion,
  onClaim,
}: {
  champion: {
    totalQuestsCompleted: number;
    totalQuestsAvailable: number;
    bonusClaimed: boolean;
    bonusReward: { diamonds: number; emeralds: number; xp: number };
  } | null;
  onClaim: () => void;
}) {
  if (!champion) return null;

  const progress = champion.totalQuestsAvailable > 0
    ? (champion.totalQuestsCompleted / champion.totalQuestsAvailable) * 100
    : 0;
  const canClaim = champion.totalQuestsCompleted >= champion.totalQuestsAvailable &&
    champion.totalQuestsAvailable > 0 && !champion.bonusClaimed;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden mb-5"
      style={{
        background: canClaim
          ? "linear-gradient(135deg, #854d0e 0%, #422006 100%)"
          : champion.bonusClaimed
          ? "linear-gradient(135deg, #166534 0%, #14532d 100%)"
          : "linear-gradient(135deg, #3730a3 0%, #1e1b4b 100%)",
        border: canClaim
          ? "3px solid #fbbf24"
          : champion.bonusClaimed
          ? "3px solid #4ade80"
          : "3px solid #6366f1",
        boxShadow: canClaim
          ? "0 8px 32px rgba(251, 191, 36, 0.4)"
          : champion.bonusClaimed
          ? "0 8px 32px rgba(74, 222, 128, 0.3)"
          : "0 8px 32px rgba(99, 102, 241, 0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        <motion.div
          className="text-5xl"
          animate={canClaim ? {
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.6, repeat: canClaim ? Infinity : 0, repeatDelay: 2 }}
        >
          {champion.bonusClaimed ? "✅" : "🏆"}
        </motion.div>
        <div className="flex-1">
          <h3
            className="font-bold text-xl mb-1"
            style={{
              color: canClaim ? "#fef3c7" : champion.bonusClaimed ? "#bbf7d0" : "#e0e7ff",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {champion.bonusClaimed ? "Champion Bonus Claimed!" : "Weekly Champion Bonus"}
          </h3>
          <p style={{ color: canClaim ? "#fde68a" : champion.bonusClaimed ? "#86efac" : "#a5b4fc" }}>
            {champion.bonusClaimed
              ? "Great job! Come back next week!"
              : "Complete all quests to unlock!"}
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-4 py-3" style={{ background: "rgba(0,0,0,0.2)" }}>
        <div className="flex justify-between text-sm mb-2">
          <span
            className="font-semibold"
            style={{ color: canClaim ? "#fef3c7" : champion.bonusClaimed ? "#86efac" : "#c7d2fe" }}
          >
            Progress
          </span>
          <span
            className="font-bold px-3 py-1 rounded-full"
            style={{
              background: canClaim ? "rgba(251, 191, 36, 0.2)" : "rgba(255,255,255,0.1)",
              color: canClaim ? "#fbbf24" : champion.bonusClaimed ? "#4ade80" : "#a5b4fc",
            }}
          >
            {champion.totalQuestsCompleted} / {champion.totalQuestsAvailable} Quests
          </span>
        </div>
        <div
          className="h-5 rounded-full overflow-hidden"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "2px solid rgba(255,255,255,0.1)",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full relative"
            style={{
              background: champion.bonusClaimed
                ? "linear-gradient(90deg, #16a34a 0%, #4ade80 100%)"
                : canClaim
                ? "linear-gradient(90deg, #d97706 0%, #fbbf24 100%)"
                : "linear-gradient(90deg, #4f46e5 0%, #818cf8 100%)",
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)" }}
            />
          </motion.div>
        </div>
      </div>

      {/* Rewards Row */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(0,0,0,0.15)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(6, 182, 212, 0.2)" }}>
            <span className="text-lg">💎</span>
            <span className="font-bold text-lg text-cyan-400">{champion.bonusReward.diamonds}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(34, 197, 94, 0.2)" }}>
            <span className="text-lg">🟢</span>
            <span className="font-bold text-lg text-green-400">{champion.bonusReward.emeralds}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(168, 85, 247, 0.2)" }}>
            <span className="text-lg">✨</span>
            <span className="font-bold text-lg text-purple-400">{champion.bonusReward.xp} XP</span>
          </div>
        </div>

        {canClaim && (
          <motion.button
            onClick={onClaim}
            className="px-5 py-3 rounded-xl font-bold"
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              color: "#78350f",
              boxShadow: "0 4px 16px rgba(251, 191, 36, 0.5)",
              border: "2px solid #fef3c7",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            🎁 CLAIM BONUS!
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// Weak Topics Summary - Redesigned
function WeakTopicsSummary({
  topics,
}: {
  topics: Array<{ topic: string; count: number; lastError: string }>;
}) {
  if (topics.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl p-4 mb-5"
      style={{
        background: "linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)",
        border: "2px solid #f87171",
        boxShadow: "0 4px 16px rgba(248, 113, 113, 0.2)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🔥</span>
        <span
          className="font-bold"
          style={{ color: "#fecaca", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
        >
          This week you struggled with:
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.slice(0, 5).map((t, i) => {
          const style = getTopicStyle(t.topic);
          return (
            <span
              key={i}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${style.bg} 0%, ${style.bg}dd 100%)`,
                color: style.color,
                border: `2px solid ${style.color}60`,
                boxShadow: `0 2px 8px ${style.color}30`,
              }}
            >
              {style.icon} {t.topic} ({t.count})
            </span>
          );
        })}
      </div>
    </motion.div>
  );
}

export function WeeklyQuestsScreen({
  playerId,
  onBack,
  onStartPractice,
}: WeeklyQuestsScreenProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch weekly quests data
  const weeklyData = useQuery(
    api.weeklyQuests.getWeeklyQuests,
    playerId ? { playerId } : "skip"
  );

  // Fetch weak topics
  const weakTopics = useQuery(
    api.errors.getWeakTopics,
    playerId ? { playerId } : "skip"
  );

  // Mutations
  const generateQuests = useMutation(api.weeklyQuests.generateWeeklyQuests);
  const claimBonus = useMutation(api.weeklyQuests.claimWeeklyBonus);

  // Generate quests if none exist
  useEffect(() => {
    if (playerId && weeklyData && weeklyData.quests.length === 0 && weakTopics && weakTopics.length > 0) {
      generateQuests({ playerId });
    }
  }, [playerId, weeklyData, weakTopics, generateQuests]);

  const handleClaimBonus = async () => {
    if (!playerId) return;

    const result = await claimBonus({ playerId });
    if (result.success) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const handleGenerateQuests = async () => {
    if (!playerId) return;
    await generateQuests({ playerId });
  };

  // Loading state
  if (weeklyData === undefined) {
    return (
      <div
        className="screen active flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #0c0a1d 0%, #1a1333 50%, #0f172a 100%)",
        }}
      >
        <div className="text-center">
          <motion.div
            className="text-6xl mb-4"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ⚔️
          </motion.div>
          <div
            className="text-xl font-bold"
            style={{ color: "#a5b4fc", textShadow: "0 2px 8px rgba(165, 180, 252, 0.5)" }}
          >
            Loading Practice Arena...
          </div>
        </div>
      </div>
    );
  }

  const { quests, champion, weekStart, weekEnd, totalCompleted, totalQuests } = weeklyData;

  return (
    <div
      className="screen active flex flex-col"
      style={{
        background: "linear-gradient(180deg, #0c0a1d 0%, #1a1333 50%, #0f172a 100%)",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)" }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="text-center p-8 rounded-3xl"
              style={{
                background: "linear-gradient(135deg, #854d0e 0%, #422006 100%)",
                border: "4px solid #fbbf24",
                boxShadow: "0 0 60px rgba(251, 191, 36, 0.5)",
              }}
            >
              <motion.div
                className="text-7xl mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                🏆🎉
              </motion.div>
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: "#fef3c7", textShadow: "0 4px 8px rgba(0,0,0,0.5)" }}
              >
                WEEKLY CHAMPION!
              </h2>
              <p className="text-xl" style={{ color: "#fde68a" }}>
                Bonus rewards claimed!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl font-bold text-sm"
          style={{
            background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
            color: "#f3f4f6",
            border: "2px solid #4b5563",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          ← Back
        </button>
        <div className="flex-1">
          <h1
            className="text-xl font-bold flex items-center gap-2"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "0.95em",
              color: "#f1f5f9",
              textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.3)",
            }}
          >
            <span>⚔️</span> PRACTICE ARENA
          </h1>
          <p style={{ color: "#a5b4fc", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
            Train your weak spots!
          </p>
        </div>
      </div>

      {/* Week Info */}
      <div
        className="text-center text-sm py-2 px-4 rounded-lg mb-5 font-medium"
        style={{
          background: "rgba(99, 102, 241, 0.15)",
          color: "#a5b4fc",
          border: "1px solid rgba(99, 102, 241, 0.3)",
        }}
      >
        Week: {weekStart} to {weekEnd}
      </div>

      {/* Weekly Champion Progress */}
      <WeeklyChampionCard champion={champion} onClaim={handleClaimBonus} />

      {/* Weak Topics Summary */}
      {weakTopics && <WeakTopicsSummary topics={weakTopics} />}

      {/* Practice Quests */}
      {quests.length > 0 ? (
        <>
          <h2
            className="font-bold text-base mb-4 flex items-center gap-2 px-1"
            style={{ color: "#e2e8f0", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          >
            <span className="text-xl">📋</span>
            Your Practice Quests ({totalCompleted}/{totalQuests})
          </h2>

          <div className="flex flex-col gap-4 flex-1 pb-4">
            {quests.map((quest, index) => (
              <PracticeQuestCard
                key={quest._id}
                quest={quest}
                index={index}
                onStart={() => onStartPractice(quest._id)}
              />
            ))}
          </div>
        </>
      ) : weakTopics && weakTopics.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center p-8"
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            🔄
          </motion.div>
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: "#e2e8f0" }}
          >
            Generating Your Quests...
          </h3>
          <p className="mb-6" style={{ color: "#94a3b8" }}>
            Creating personalized practice based on your mistakes
          </p>
          <motion.button
            onClick={handleGenerateQuests}
            className="px-8 py-3 rounded-xl font-bold"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(139, 92, 246, 0.5)",
              border: "2px solid #a78bfa",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Generate Quests
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center p-8"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: "#e2e8f0" }}
          >
            No Mistakes This Week!
          </h3>
          <p style={{ color: "#94a3b8" }}>
            Keep playing homework quests to discover topics that need practice.
          </p>
          <motion.div
            className="mt-6 text-7xl"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⭐
          </motion.div>
        </motion.div>
      )}

      {/* Tip at bottom */}
      <div
        className="mt-4 p-4 rounded-xl text-center"
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)",
          border: "2px solid rgba(139, 92, 246, 0.3)",
          boxShadow: "0 4px 16px rgba(139, 92, 246, 0.1)",
        }}
      >
        <span style={{ color: "#c4b5fd" }}>
          💡 Complete practice quests to improve your weak topics and earn extra rewards!
        </span>
      </div>
    </div>
  );
}
