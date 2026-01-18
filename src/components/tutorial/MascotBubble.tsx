"use client";

import { useState, useEffect } from "react";

interface MascotBubbleProps {
  message: string;
  showHelp?: boolean;
  onHelpClick?: () => void;
  variant?: "greeting" | "tip" | "celebration";
  animate?: boolean;
  dismissable?: boolean;
  onDismiss?: () => void;
}

const MASCOT_VARIANTS = {
  greeting: {
    emoji: "🧙‍♂️",
    gradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
    border: "#8b5cf6",
  },
  tip: {
    emoji: "💡",
    gradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
    border: "#fbbf24",
  },
  celebration: {
    emoji: "🎉",
    gradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
    border: "#22c55e",
  },
};

export function MascotBubble({
  message,
  showHelp = true,
  onHelpClick,
  variant = "greeting",
  animate = true,
  dismissable = false,
  onDismiss,
}: MascotBubbleProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [bobAnimation, setBobAnimation] = useState(false);
  const config = MASCOT_VARIANTS[variant];

  useEffect(() => {
    if (animate) {
      const interval = setInterval(() => {
        setBobAnimation((prev) => !prev);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [animate]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      style={{
        background: config.gradient,
        borderRadius: "14px",
        padding: "12px",
        marginBottom: "12px",
        border: `2px solid ${config.border}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        position: "relative",
        boxShadow: `0 4px 20px rgba(139, 92, 246, 0.2)`,
      }}
    >
      {/* Mascot */}
      <div
        style={{
          fontSize: "2em",
          transform: bobAnimation ? "translateY(-3px)" : "translateY(0)",
          transition: "transform 0.3s ease",
          flexShrink: 0,
        }}
      >
        {config.emoji}
      </div>

      {/* Message */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            color: "#e2e8f0",
            fontSize: "0.85em",
            lineHeight: "1.4",
          }}
        >
          {message}
        </p>
      </div>

      {/* Help button */}
      {showHelp && (
        <button
          onClick={onHelpClick}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: `2px solid ${config.border}`,
            background: "rgba(0,0,0,0.3)",
            color: config.border,
            fontSize: "1em",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = config.border;
            e.currentTarget.style.color = "#000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.3)";
            e.currentTarget.style.color = config.border;
          }}
        >
          ?
        </button>
      )}

      {/* Dismiss button */}
      {dismissable && (
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.4)",
            color: "#94a3b8",
            fontSize: "0.8em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Pre-defined messages for different contexts
export const MASCOT_MESSAGES = {
  welcome: "Welcome, young wizard! Ready to learn today?",
  welcomeBack: "Welcome back! Let's continue your magical journey!",
  startHomework: "Scan your homework with the camera - I'll turn it into a fun game!",
  practiceTime: "You have some mistakes to practice. Want to become stronger?",
  newGameUnlocked: "A new game has been unlocked! Try it out!",
  streakWarning: "Don't forget to play today to keep your streak!",
  allComplete: "Amazing! You've completed all your tasks! Keep exploring!",
  encouragement: "You're doing great! Keep going!",
  firstVisit: "Hello, new wizard! Let me show you around the academy!",
};
