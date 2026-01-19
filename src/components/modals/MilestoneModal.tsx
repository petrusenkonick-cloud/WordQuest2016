"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  getTierForLevel,
  getTitleBadge,
  getMilestoneRewards,
  getShopDiscount,
  TITLE_BADGES,
  MilestoneRewards,
  MILESTONE_LEVELS,
  isMilestoneLevel,
  TIERS,
} from "@/lib/tierSystem";
import { AvatarFrame } from "@/components/ui/AvatarFrame";

interface MilestoneModalProps {
  isOpen: boolean;
  level: number;
  playerSkin: string;
  onClaim: () => void;
  onClose: () => void;
  isClaimed?: boolean; // Whether milestone rewards were already claimed
}

export function MilestoneModal({
  isOpen,
  level,
  playerSkin,
  onClaim,
  onClose,
  isClaimed: alreadyClaimed = false,
}: MilestoneModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const tier = getTierForLevel(level);
  const titleBadge = getTitleBadge(level);
  const rewards = getMilestoneRewards(level);
  const shopDiscount = getShopDiscount(level);
  const hasMilestone = isMilestoneLevel(level);

  // Find next milestone level
  const nextMilestone = MILESTONE_LEVELS.find(m => m > level) || null;
  const levelsToNextMilestone = nextMilestone ? nextMilestone - level : null;

  // Find next tier
  const nextTier = TIERS.find(t => t.minLevel > level);
  const levelsToNextTier = nextTier ? nextTier.minLevel - level : null;

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(hasMilestone && !alreadyClaimed);
      setClaimed(alreadyClaimed);
      // Play celebration sound if available
    }
  }, [isOpen, hasMilestone, alreadyClaimed]);

  const handleClaim = () => {
    if (alreadyClaimed) {
      onClose();
      return;
    }
    setClaimed(true);
    onClaim();
    // Delay close to show claimed state
    setTimeout(() => {
      onClose();
      setShowConfetti(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
        >
          {/* Confetti particles */}
          {showConfetti && <ConfettiEffect tier={tier.tier} />}

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`,
              borderRadius: "24px",
              padding: "30px",
              maxWidth: "380px",
              width: "100%",
              border: `4px solid ${tier.color}`,
              boxShadow: `0 0 60px ${tier.glowColor}, 0 20px 60px rgba(0, 0, 0, 0.5)`,
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Animated background */}
            <motion.div
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, ${tier.color}10, ${tier.color}30, ${tier.color}10)`,
                backgroundSize: "200% 200%",
                zIndex: 0,
              }}
            />

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div
                  style={{
                    fontSize: "0.9em",
                    color: tier.color,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "3px",
                    marginBottom: "10px",
                  }}
                >
                  {hasMilestone && !alreadyClaimed ? "Milestone Reached!" : alreadyClaimed ? "Milestone Claimed ✓" : "Your Progress"}
                </div>
                <motion.div
                  animate={hasMilestone && !alreadyClaimed ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  style={{
                    fontSize: "3em",
                    fontWeight: "bold",
                    background: tier.gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: `0 0 30px ${tier.glowColor}`,
                  }}
                >
                  LEVEL {level}
                </motion.div>
              </motion.div>

              {/* Avatar with tier frame */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                transition={{ delay: 0.3, type: "spring" }}
                style={{ margin: "20px 0" }}
              >
                <AvatarFrame level={level} size={100} showTierName>
                  {playerSkin}
                </AvatarFrame>
              </motion.div>

              {/* Tier announcement */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  background: `${tier.color}20`,
                  borderRadius: "12px",
                  padding: "12px",
                  marginBottom: "15px",
                  border: `2px solid ${tier.color}40`,
                }}
              >
                <div style={{ fontSize: "0.85em", color: "#888", marginBottom: "4px" }}>
                  {hasMilestone && !alreadyClaimed ? "New Rank Achieved" : "Current Rank"}
                </div>
                <div
                  style={{
                    fontSize: "1.3em",
                    fontWeight: "bold",
                    color: tier.color,
                  }}
                >
                  {tier.name}
                </div>
                <div style={{ fontSize: "0.8em", color: "#666" }}>
                  ({tier.nameRu})
                </div>
              </motion.div>

              {/* Title badge */}
              {titleBadge && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    background: "rgba(255, 215, 0, 0.1)",
                    borderRadius: "12px",
                    padding: "10px",
                    marginBottom: "15px",
                    border: "2px solid rgba(255, 215, 0, 0.3)",
                  }}
                >
                  <div style={{ fontSize: "0.8em", color: "#888", marginBottom: "4px" }}>
                    {hasMilestone && !alreadyClaimed ? "New Title Unlocked" : "Current Title"}
                  </div>
                  <div style={{ fontSize: "1.2em", fontWeight: "bold", color: "#FFD700" }}>
                    {titleBadge.emoji} {titleBadge.title}
                  </div>
                </motion.div>
              )}

              {/* Rewards - only show for milestone levels */}
              {rewards && (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{ marginBottom: "15px" }}
                >
                  <div
                    style={{
                      fontSize: "0.9em",
                      color: "#888",
                      marginBottom: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {alreadyClaimed ? "CLAIMED REWARDS" : "REWARDS"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "15px",
                      flexWrap: "wrap",
                      opacity: alreadyClaimed ? 0.6 : 1,
                    }}
                  >
                    <RewardItem emoji="💎" amount={rewards.diamonds} label="Diamonds" color="#60A5FA" />
                    <RewardItem emoji="🟢" amount={rewards.emeralds} label="Emeralds" color="#4ADE80" />
                    <RewardItem emoji="🪙" amount={rewards.gold} label="Gold" color="#FBBF24" />
                  </div>
                </motion.div>
              )}

              {/* Progress section - show for non-milestone levels */}
              {!hasMilestone && (nextMilestone || nextTier) && (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    borderRadius: "12px",
                    padding: "12px",
                    marginBottom: "15px",
                    border: "2px solid rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <div style={{ fontSize: "0.8em", color: "#60A5FA", marginBottom: "8px", fontWeight: "bold" }}>
                    NEXT GOALS
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {nextMilestone && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.2em" }}>🎯</span>
                        <span style={{ color: "#fff" }}>
                          Level {nextMilestone} milestone in{" "}
                          <span style={{ color: "#22C55E", fontWeight: "bold" }}>{levelsToNextMilestone}</span> levels
                        </span>
                      </div>
                    )}
                    {nextTier && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.2em" }}>⬆️</span>
                        <span style={{ color: "#fff" }}>
                          <span style={{ color: nextTier.color, fontWeight: "bold" }}>{nextTier.name}</span> rank in{" "}
                          <span style={{ color: "#22C55E", fontWeight: "bold" }}>{levelsToNextTier}</span> levels
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Permanent bonuses */}
              {(rewards?.permanentXpBoost || shopDiscount > 0) && (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  style={{
                    background: "rgba(139, 92, 246, 0.1)",
                    borderRadius: "12px",
                    padding: "12px",
                    marginBottom: "20px",
                    border: "2px solid rgba(139, 92, 246, 0.3)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8em",
                      color: "#A78BFA",
                      marginBottom: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    {hasMilestone ? "PERMANENT BONUSES" : "CURRENT BONUSES"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {rewards?.permanentXpBoost && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.2em" }}>⚡</span>
                        <span style={{ color: "#22C55E", fontWeight: "bold" }}>
                          +{rewards.permanentXpBoost}% XP Boost
                        </span>
                        <span style={{ fontSize: "0.8em", color: "#666" }}>(Forever!)</span>
                      </div>
                    )}
                    {shopDiscount > 0 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.2em" }}>🏷️</span>
                        <span style={{ color: "#F59E0B", fontWeight: "bold" }}>
                          {shopDiscount}% Shop Discount
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Action button */}
              <motion.button
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: (claimed || !hasMilestone || alreadyClaimed) ? 1 : 1.05 }}
                whileTap={{ scale: (claimed || !hasMilestone || alreadyClaimed) ? 1 : 0.95 }}
                onClick={hasMilestone && !alreadyClaimed ? handleClaim : onClose}
                disabled={claimed && hasMilestone && !alreadyClaimed}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: claimed ? "default" : "pointer",
                  fontWeight: "bold",
                  fontSize: "1.2em",
                  background: claimed
                    ? "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)"
                    : !hasMilestone || alreadyClaimed
                      ? "linear-gradient(135deg, #4B5563 0%, #6B7280 100%)"
                      : tier.gradient,
                  color: "white",
                  boxShadow: claimed
                    ? "0 4px 20px rgba(34, 197, 94, 0.5)"
                    : `0 4px 20px ${tier.glowColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                {claimed ? (
                  <>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      ✓
                    </motion.span>
                    CLAIMED!
                  </>
                ) : hasMilestone && !alreadyClaimed ? (
                  <>
                    🎁 CLAIM REWARDS
                  </>
                ) : (
                  <>
                    ✓ CLOSE
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Reward item component
function RewardItem({
  emoji,
  amount,
  label,
  color,
}: {
  emoji: string;
  amount: number;
  label: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", delay: Math.random() * 0.3 }}
      style={{
        background: "rgba(0, 0, 0, 0.3)",
        borderRadius: "12px",
        padding: "10px 15px",
        minWidth: "80px",
      }}
    >
      <div style={{ fontSize: "1.5em", marginBottom: "4px" }}>{emoji}</div>
      <div style={{ fontSize: "1.1em", fontWeight: "bold", color }}>
        +{amount.toLocaleString()}
      </div>
      <div style={{ fontSize: "0.7em", color: "#888" }}>{label}</div>
    </motion.div>
  );
}

// Confetti effect component
function ConfettiEffect({ tier }: { tier: number }) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; color: string; delay: number; size: number }>
  >([]);

  useEffect(() => {
    const colors =
      tier === 9
        ? ["#EF4444", "#F59E0B", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#FFD700"]
        : [
            getTierForLevel(tier * 10).color,
            "#FFD700",
            "#FFFFFF",
            "#22C55E",
          ];

    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      size: Math.random() * 10 + 5,
    }));

    setParticles(newParticles);
  }, [tier]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1 }}
          animate={{ y: "100vh", opacity: 0 }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}
