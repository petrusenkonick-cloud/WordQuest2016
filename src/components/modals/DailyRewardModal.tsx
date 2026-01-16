"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/hooks/useAudio";

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDay: number;
  claimed: boolean;
  streak: number;
  onClaim: () => void;
}

// Base rewards for each day (before streak bonus)
const BASE_REWARDS = [
  { diamonds: 10, emeralds: 5, gold: 20 },   // Day 1
  { diamonds: 15, emeralds: 8, gold: 30 },   // Day 2
  { diamonds: 20, emeralds: 10, gold: 40 },  // Day 3
  { diamonds: 30, emeralds: 15, gold: 50 },  // Day 4
  { diamonds: 40, emeralds: 20, gold: 60 },  // Day 5
  { diamonds: 50, emeralds: 25, gold: 80 },  // Day 6
  { diamonds: 100, emeralds: 50, gold: 150 }, // Day 7 MEGA BONUS!
];

// Get streak bonus percentage
function getStreakBonus(streak: number): number {
  if (streak >= 30) return 100;
  if (streak >= 14) return 75;
  if (streak >= 7) return 50;
  if (streak >= 5) return 25;
  if (streak >= 3) return 10;
  return 0;
}

// Floating sparkles animation
function Sparkles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-xl"
          initial={{
            x: Math.random() * 300 - 150,
            y: Math.random() * 300,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            y: [null, -100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${50 + Math.random() * 50}%`,
          }}
        >
          {["✨", "⭐", "💫", "🌟"][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}
    </div>
  );
}

export function DailyRewardModal({
  isOpen,
  onClose,
  currentDay,
  claimed,
  streak,
  onClaim,
}: DailyRewardModalProps) {
  const { playSound } = useAudio();
  const [showRewards, setShowRewards] = useState(false);
  const [claimAnimation, setClaimAnimation] = useState(false);

  const streakBonus = getStreakBonus(streak);
  const dayIndex = Math.min(currentDay - 1, 6);
  const todayReward = BASE_REWARDS[dayIndex];
  const tomorrowReward = BASE_REWARDS[Math.min(dayIndex + 1, 6)];

  // Calculate rewards with streak bonus
  const finalReward = {
    diamonds: Math.floor(todayReward.diamonds * (1 + streakBonus / 100)),
    emeralds: Math.floor(todayReward.emeralds * (1 + streakBonus / 100)),
    gold: Math.floor(todayReward.gold * (1 + streakBonus / 100)),
  };

  const bonusAmounts = {
    diamonds: finalReward.diamonds - todayReward.diamonds,
    emeralds: finalReward.emeralds - todayReward.emeralds,
    gold: finalReward.gold - todayReward.gold,
  };

  useEffect(() => {
    if (isOpen) {
      // Play sound on open
      playSound("reward");
      // Delay showing rewards for entrance animation
      setTimeout(() => setShowRewards(true), 300);
    } else {
      setShowRewards(false);
      setClaimAnimation(false);
    }
  }, [isOpen, playSound]);

  const handleClaim = () => {
    setClaimAnimation(true);
    playSound("dailyReward");
    setTimeout(() => {
      onClaim();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-[340px] max-w-[95vw] overflow-hidden"
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
        >
          <Sparkles />

          <div
            className="relative rounded-2xl p-5"
            style={{
              background: "linear-gradient(180deg, #1e1b4b 0%, #0f0a1e 100%)",
              border: "3px solid #8b5cf6",
              boxShadow: "0 0 40px rgba(139, 92, 246, 0.4), inset 0 0 60px rgba(139, 92, 246, 0.1)",
            }}
          >
            {/* Header */}
            <motion.div
              className="text-center mb-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="text-4xl mb-2"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                🎁
              </motion.div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "0.9em" }}>
                DAILY TREASURE!
              </h2>
            </motion.div>

            {/* Streak Banner */}
            {streak >= 3 && (
              <motion.div
                className="mb-4 py-2 px-3 rounded-lg text-center"
                style={{
                  background: "linear-gradient(90deg, rgba(245, 158, 11, 0.3) 0%, rgba(239, 68, 68, 0.3) 100%)",
                  border: "1px solid #f59e0b",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <span className="text-lg">🔥</span>
                <span className="text-yellow-300 font-bold mx-2">
                  {streak} Day Streak!
                </span>
                <span className="text-orange-400 font-bold">+{streakBonus}% BONUS!</span>
                <span className="text-lg">🔥</span>
              </motion.div>
            )}

            {/* 7 Day Progress */}
            <motion.div
              className="flex justify-between gap-1 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {BASE_REWARDS.map((_, i) => {
                const day = i + 1;
                const isPast = day < currentDay;
                const isCurrent = day === currentDay && !claimed;
                const isDay7 = day === 7;

                return (
                  <motion.div
                    key={day}
                    className="flex flex-col items-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05, type: "spring" }}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-lg
                        transition-all duration-300
                        ${isPast ? "bg-emerald-600 border-emerald-400" : ""}
                        ${isCurrent ? "border-yellow-400 animate-pulse" : "border-gray-600"}
                        ${!isPast && !isCurrent ? "bg-gray-800/50" : ""}
                        ${isDay7 ? "bg-gradient-to-br from-yellow-500/30 to-orange-500/30" : ""}
                      `}
                      style={{
                        border: `2px solid ${isPast ? "#10b981" : isCurrent ? "#fbbf24" : "#4b5563"}`,
                        boxShadow: isCurrent ? "0 0 15px rgba(251, 191, 36, 0.5)" : isDay7 && !isPast ? "0 0 10px rgba(245, 158, 11, 0.3)" : "none",
                      }}
                    >
                      {isPast ? (
                        <span className="text-white">✓</span>
                      ) : isCurrent ? (
                        <span>⭐</span>
                      ) : isDay7 ? (
                        <span>👑</span>
                      ) : (
                        <span className="text-gray-500 text-sm">○</span>
                      )}
                    </div>
                    <span className={`text-[0.6em] mt-1 ${isCurrent ? "text-yellow-400 font-bold" : "text-gray-500"}`}>
                      D{day}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Today's Reward Card */}
            <AnimatePresence>
              {showRewards && (
                <motion.div
                  className="rounded-xl p-4 mb-4"
                  style={{
                    background: currentDay === 7
                      ? "linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.2) 100%)"
                      : "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(88, 28, 135, 0.2) 100%)",
                    border: currentDay === 7 ? "2px solid #f59e0b" : "2px solid #8b5cf6",
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  <div className="text-center text-sm text-gray-400 mb-3">
                    {currentDay === 7 ? "🏆 MEGA TREASURE! 🏆" : "TODAY'S TREASURE:"}
                  </div>

                  {/* Rewards Display */}
                  <div className="flex justify-center gap-6">
                    {/* Diamonds */}
                    <motion.div
                      className="text-center"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="text-2xl">💎</div>
                      <div className="text-white font-bold">{finalReward.diamonds}</div>
                      {bonusAmounts.diamonds > 0 && (
                        <div className="text-green-400 text-xs">+{bonusAmounts.diamonds}</div>
                      )}
                    </motion.div>

                    {/* Emeralds */}
                    <motion.div
                      className="text-center"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="text-2xl">🟢</div>
                      <div className="text-white font-bold">{finalReward.emeralds}</div>
                      {bonusAmounts.emeralds > 0 && (
                        <div className="text-green-400 text-xs">+{bonusAmounts.emeralds}</div>
                      )}
                    </motion.div>

                    {/* Gold */}
                    <motion.div
                      className="text-center"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div className="text-2xl">🪙</div>
                      <div className="text-white font-bold">{finalReward.gold}</div>
                      {bonusAmounts.gold > 0 && (
                        <div className="text-green-400 text-xs">+{bonusAmounts.gold}</div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tomorrow Preview */}
            {!claimed && currentDay < 7 && (
              <motion.div
                className="text-center text-sm text-gray-400 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Tomorrow: 💎{tomorrowReward.diamonds} 🟢{tomorrowReward.emeralds} 🪙{tomorrowReward.gold}
                {currentDay === 6 && <span className="text-yellow-400 ml-1">👑 MEGA!</span>}
              </motion.div>
            )}

            {/* Claim Button */}
            <motion.button
              className={`
                w-full py-3 px-6 rounded-xl font-bold text-lg
                transition-all duration-300
                ${claimed ? "bg-gray-600 text-gray-400 cursor-not-allowed" : ""}
              `}
              style={!claimed ? {
                background: "linear-gradient(180deg, #fbbf24 0%, #d97706 100%)",
                color: "#000",
                boxShadow: "0 4px 15px rgba(251, 191, 36, 0.4)",
              } : {}}
              onClick={claimed ? onClose : handleClaim}
              disabled={claimAnimation}
              whileHover={!claimed ? { scale: 1.02 } : {}}
              whileTap={!claimed ? { scale: 0.98 } : {}}
              animate={claimAnimation ? {
                scale: [1, 1.1, 0.9, 1],
                rotate: [0, -5, 5, 0],
              } : {}}
            >
              {claimed ? (
                "✓ CLAIMED!"
              ) : claimAnimation ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                >
                  ✨ OPENING... ✨
                </motion.span>
              ) : (
                <>🎁 CLAIM TREASURE!</>
              )}
            </motion.button>

            {/* Motivational text */}
            {!claimed && streak < 3 && (
              <motion.p
                className="text-center text-xs text-gray-500 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Login 3 days in a row for +10% bonus!
              </motion.p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
