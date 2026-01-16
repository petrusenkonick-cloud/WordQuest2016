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

// Topic icons and colors
const TOPIC_STYLES: Record<string, { icon: string; color: string }> = {
  suffixes: { icon: "🎯", color: "#f59e0b" },
  prefixes: { icon: "🔑", color: "#8b5cf6" },
  verbs: { icon: "🏃", color: "#22c55e" },
  nouns: { icon: "📦", color: "#3b82f6" },
  adjectives: { icon: "🎨", color: "#ec4899" },
  spelling: { icon: "✍️", color: "#14b8a6" },
  grammar: { icon: "📝", color: "#f43f5e" },
  punctuation: { icon: "❗", color: "#eab308" },
  multiplication: { icon: "✖️", color: "#22c55e" },
  division: { icon: "➗", color: "#3b82f6" },
  addition: { icon: "➕", color: "#f59e0b" },
  subtraction: { icon: "➖", color: "#ec4899" },
  fractions: { icon: "🍕", color: "#8b5cf6" },
  decimals: { icon: "🔢", color: "#14b8a6" },
  word_problems: { icon: "🧩", color: "#f43f5e" },
  default: { icon: "📚", color: "#a78bfa" },
};

function getTopicStyle(topic: string) {
  return TOPIC_STYLES[topic.toLowerCase()] || TOPIC_STYLES.default;
}

// Practice Quest Card
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={!quest.isCompleted ? onStart : undefined}
      className={`relative rounded-xl p-4 ${quest.isCompleted ? "" : "cursor-pointer"}`}
      style={{
        background: quest.isCompleted
          ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)"
          : `linear-gradient(135deg, ${topicStyle.color}20 0%, rgba(15, 23, 42, 0.9) 100%)`,
        border: `2px solid ${quest.isCompleted ? "#22c55e" : topicStyle.color}`,
        boxShadow: quest.isCompleted
          ? "0 0 15px rgba(34, 197, 94, 0.2)"
          : `0 4px 15px ${topicStyle.color}30`,
      }}
      whileHover={!quest.isCompleted ? { scale: 1.02 } : {}}
      whileTap={!quest.isCompleted ? { scale: 0.98 } : {}}
    >
      {/* Completed Badge */}
      {quest.isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-black"
        >
          ✓ DONE
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: quest.isCompleted ? "rgba(34, 197, 94, 0.3)" : `${topicStyle.color}30`,
            border: `2px solid ${quest.isCompleted ? "#22c55e" : topicStyle.color}`,
          }}
        >
          {quest.isCompleted ? "✅" : quest.questIcon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm">{quest.questName}</h3>
          <p className="text-gray-400 text-xs mb-2">{quest.description}</p>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">
                {quest.currentCorrect} / {quest.targetCorrect} correct
              </span>
              <span style={{ color: quest.isCompleted ? "#22c55e" : topicStyle.color }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(0,0,0,0.4)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                className="h-full rounded-full"
                style={{
                  background: quest.isCompleted
                    ? "#22c55e"
                    : `linear-gradient(90deg, ${topicStyle.color}, ${topicStyle.color}88)`,
                }}
              />
            </div>
          </div>

          {/* Rewards */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">Reward:</span>
            <span className="text-cyan-400">💎 {quest.reward.diamonds}</span>
            <span className="text-green-400">🟢 {quest.reward.emeralds}</span>
            <span className="text-purple-400">✨ {quest.reward.xp} XP</span>
          </div>
        </div>

        {/* Play/Done indicator */}
        {!quest.isCompleted && (
          <div
            className="px-3 py-2 rounded-lg font-bold text-xs self-center"
            style={{ background: topicStyle.color, color: "#000" }}
          >
            PLAY →
          </div>
        )}
      </div>

      {/* Error count badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-300">
        {quest.errorCount} mistakes to fix
      </div>
    </motion.div>
  );
}

// Weekly Champion Progress Component
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
  const canClaim = champion.totalQuestsCompleted >= champion.totalQuestsAvailable && !champion.bonusClaimed;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 mb-4"
      style={{
        background: canClaim
          ? "linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(30, 27, 75, 0.9) 100%)"
          : champion.bonusClaimed
          ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(30, 27, 75, 0.9) 100%)"
          : "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(30, 27, 75, 0.9) 100%)",
        border: `2px solid ${canClaim ? "#eab308" : champion.bonusClaimed ? "#22c55e" : "#8b5cf6"}`,
        boxShadow: canClaim ? "0 0 30px rgba(234, 179, 8, 0.4)" : undefined,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          className="text-4xl"
          animate={canClaim ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: canClaim ? Infinity : 0, repeatDelay: 2 }}
        >
          {champion.bonusClaimed ? "✅" : "🏆"}
        </motion.div>
        <div className="flex-1">
          <h3 className="text-white font-bold">
            {champion.bonusClaimed ? "Champion Bonus Claimed!" : "Weekly Champion Bonus"}
          </h3>
          <p className="text-gray-400 text-xs">
            {champion.bonusClaimed
              ? "Great job! Come back next week for more!"
              : "Complete all quests to unlock!"}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="text-yellow-400 font-bold">
            {champion.totalQuestsCompleted} / {champion.totalQuestsAvailable} Quests
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full"
            style={{
              background: champion.bonusClaimed
                ? "#22c55e"
                : "linear-gradient(90deg, #eab308, #f59e0b)",
            }}
          />
        </div>
      </div>

      {/* Bonus Rewards */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <span className="text-cyan-400">💎 {champion.bonusReward.diamonds}</span>
          <span className="text-green-400">🟢 {champion.bonusReward.emeralds}</span>
          <span className="text-purple-400">✨ {champion.bonusReward.xp} XP</span>
        </div>

        {canClaim && (
          <motion.button
            onClick={onClaim}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #eab308 0%, #f59e0b 100%)",
              color: "#000",
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

// Weak Topics Summary
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
      className="rounded-lg p-3 mb-4"
      style={{
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔥</span>
        <span className="text-white font-bold text-sm">This week you struggled with:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.slice(0, 5).map((t, i) => {
          const style = getTopicStyle(t.topic);
          return (
            <span
              key={i}
              className="px-2 py-1 rounded text-xs flex items-center gap-1"
              style={{ background: `${style.color}20`, color: style.color }}
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
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)" }}
      >
        <div className="text-center">
          <motion.div
            className="text-5xl mb-4"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ⚔️
          </motion.div>
          <div className="text-indigo-300">Loading Practice Arena...</div>
        </div>
      </div>
    );
  }

  const { quests, champion, weekStart, weekEnd, totalCompleted, totalQuests } = weeklyData;

  return (
    <div
      className="screen active flex flex-col"
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🏆🎉</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">WEEKLY CHAMPION!</h2>
              <p className="text-white">Bonus rewards claimed!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="px-3 py-2 rounded-lg text-white"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          ← Back
        </button>
        <div className="flex-1">
          <h1
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "0.9em" }}
          >
            ⚔️ PRACTICE ARENA
          </h1>
          <p className="text-indigo-300 text-xs">
            Train your weak spots!
          </p>
        </div>
      </div>

      {/* Week Info */}
      <div className="text-center text-xs text-gray-500 mb-4">
        Week: {weekStart} to {weekEnd}
      </div>

      {/* Weekly Champion Progress */}
      <WeeklyChampionCard champion={champion} onClaim={handleClaimBonus} />

      {/* Weak Topics Summary */}
      {weakTopics && <WeakTopicsSummary topics={weakTopics} />}

      {/* Practice Quests */}
      {quests.length > 0 ? (
        <>
          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <span>📋</span>
            Your Practice Quests ({totalCompleted}/{totalQuests})
          </h2>

          <div className="flex flex-col gap-3 flex-1">
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
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          <div className="text-5xl mb-4">🔄</div>
          <h3 className="text-white font-bold mb-2">Generating Your Quests...</h3>
          <p className="text-gray-400 text-sm mb-4">
            Creating personalized practice based on your mistakes
          </p>
          <button
            onClick={handleGenerateQuests}
            className="px-6 py-2 rounded-lg font-bold"
            style={{ background: "#8b5cf6", color: "#fff" }}
          >
            Generate Quests
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-white font-bold mb-2">No Mistakes This Week!</h3>
          <p className="text-gray-400 text-sm max-w-xs">
            Keep playing homework quests to discover topics that need practice.
          </p>
          <div className="mt-4 text-6xl">⭐</div>
        </motion.div>
      )}

      {/* Tip at bottom */}
      <div
        className="mt-4 p-3 rounded-lg text-center text-xs"
        style={{
          background: "rgba(139, 92, 246, 0.1)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
        }}
      >
        <span className="text-indigo-300">
          💡 Complete practice quests to improve your weak topics and earn extra rewards!
        </span>
      </div>
    </div>
  );
}
