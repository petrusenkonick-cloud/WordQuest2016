"use client";

import { useEffect, useState } from "react";

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
}

export function LevelCompleteModal({
  isOpen,
  onClose,
  onNextLevel,
  levelName,
  stars,
  rewards,
}: LevelCompleteModalProps) {
  const [animatedStars, setAnimatedStars] = useState(0);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

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

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={onClose}>
            HOME
          </button>
          <button className="btn btn-primary" onClick={onNextLevel}>
            NEXT →
          </button>
        </div>
      </div>
    </div>
  );
}
