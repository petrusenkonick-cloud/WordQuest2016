"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingGemReward } from "@/components/gems";
import { GemType, GEM_CONFIG, RARITY_CONFIG } from "@/lib/gemTypes";
import { useAudio } from "@/hooks/useAudio";

interface GemReward {
  gemType: GemType;
  isWhole: boolean;
}

interface LevelCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNextLevel: () => void;
  levelName: string;
  stars: number;
  rewards: {
    diamonds: number;
    emeralds: number;
    xp: number;
  };
  gemsFound?: GemReward[];
  isHomework?: boolean;
  onViewAnswers?: () => void;
}

export function LevelCompleteModal({
  isOpen,
  onClose,
  onNextLevel,
  levelName,
  stars,
  rewards,
  gemsFound = [],
  isHomework = false,
  onViewAnswers,
}: LevelCompleteModalProps) {
  const [animatedStars, setAnimatedStars] = useState(0);
  const { playSound } = useAudio();

  useEffect(() => {
    if (isOpen) {
      // Play level complete sound
      playSound("levelComplete");

      setAnimatedStars(0);
      const timer1 = setTimeout(() => setAnimatedStars(1), 300);
      const timer2 = setTimeout(() => setAnimatedStars(2), 600);
      const timer3 = setTimeout(() => setAnimatedStars(3), 900);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen, playSound]);

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? "active" : ""}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{levelName} COMPLETE!</h2>

        {/* Stars */}
        <div className="level-complete-stars">
          {[1, 2, 3].map((starNum) => (
            <span
              key={starNum}
              className={`star ${starNum <= stars && animatedStars >= starNum ? "earned" : ""}`}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Performance message */}
        <p style={{ color: "#AAA", marginBottom: "16px" }}>
          {stars === 3
            ? "Perfect! No mistakes! 🏆"
            : stars === 2
              ? "Great job! 👍"
              : "Good effort! Keep practicing! 💪"}
        </p>

        {/* Rewards */}
        <div className="modal-rewards">
          <div className="modal-reward-item">
            <div className="icon">💎</div>
            <div className="amount">+{rewards.diamonds}</div>
          </div>
          <div className="modal-reward-item">
            <div className="icon">🟢</div>
            <div className="amount">+{rewards.emeralds}</div>
          </div>
          <div className="modal-reward-item">
            <div className="icon">⭐</div>
            <div className="amount">+{rewards.xp}XP</div>
          </div>
        </div>

        {/* Gems Found Section */}
        {gemsFound.length > 0 && (
          <div style={{ marginTop: "16px", marginBottom: "16px" }}>
            <p
              style={{
                color: "#A855F7",
                fontSize: "0.9em",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              ✨ Gems Found ✨
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {gemsFound.map((gem, index) => (
                <FloatingGemReward
                  key={index}
                  gemType={gem.gemType}
                  isWhole={gem.isWhole}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Homework hint */}
        {isHomework && (
          <div style={{
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            borderRadius: "12px",
            padding: "12px",
            marginBottom: "16px",
          }}>
            <p style={{ color: "#22c55e", fontSize: "0.9em", margin: 0 }}>
              📝 View the correct answers to copy onto your paper!
            </p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={onClose}>
            HOME
          </button>
          {isHomework && onViewAnswers && (
            <button
              className="btn btn-primary"
              onClick={onViewAnswers}
              style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}
            >
              📝 VIEW ANSWERS
            </button>
          )}
          {!isHomework && (
            <button className="btn btn-primary" onClick={onNextLevel}>
              NEXT →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
