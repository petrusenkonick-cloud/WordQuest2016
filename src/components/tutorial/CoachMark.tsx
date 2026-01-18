"use client";

import { useEffect, useState } from "react";
import { TutorialStep } from "./TutorialProvider";

interface CoachMarkProps {
  step: TutorialStep;
  targetRect: DOMRect | null;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function CoachMark({
  step,
  targetRect,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: CoachMarkProps) {
  const [tooltipHeight, setTooltipHeight] = useState(250);
  const isFullScreen = step.position === "center";
  const isLastStep = currentIndex === totalSteps - 1;
  const isFirstStep = currentIndex === 0;

  // Calculate safe position ensuring tooltip stays within viewport
  const getTooltipStyles = (): React.CSSProperties => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 400;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
    const margin = 15;
    const tooltipWidth = Math.min(320, viewportWidth - margin * 2);
    const safeAreaBottom = 20; // Safe area for mobile devices

    // Full screen centered - always safe
    if (isFullScreen || !targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: `${tooltipWidth}px`,
        maxWidth: `${tooltipWidth}px`,
      };
    }

    let styles: React.CSSProperties = {
      position: "fixed",
      width: `${tooltipWidth}px`,
      maxWidth: `${tooltipWidth}px`,
    };

    // Calculate horizontal center position
    const horizontalCenter = Math.max(
      margin,
      Math.min(
        targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        viewportWidth - tooltipWidth - margin
      )
    );

    // Calculate available space above and below target
    const spaceAbove = targetRect.top;
    const spaceBelow = viewportHeight - targetRect.bottom - safeAreaBottom;

    // Determine best vertical position
    let position = step.position;

    // Auto-flip if not enough space
    if (position === "bottom" && spaceBelow < tooltipHeight + margin) {
      if (spaceAbove > spaceBelow) {
        position = "top";
      }
    } else if (position === "top" && spaceAbove < tooltipHeight + margin) {
      if (spaceBelow > spaceAbove) {
        position = "bottom";
      }
    }

    switch (position) {
      case "bottom":
        // Position below target, but ensure it stays within viewport
        const bottomTop = targetRect.bottom + margin;
        const maxBottomTop = viewportHeight - tooltipHeight - safeAreaBottom;
        styles.top = Math.min(bottomTop, maxBottomTop);
        styles.left = horizontalCenter;
        break;

      case "top":
        // Position above target, but ensure it stays within viewport
        const topBottom = viewportHeight - targetRect.top + margin;
        styles.bottom = Math.max(topBottom, safeAreaBottom);
        styles.left = horizontalCenter;
        break;

      case "left":
        styles.top = Math.max(margin, Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          viewportHeight - tooltipHeight - safeAreaBottom
        ));
        styles.right = viewportWidth - targetRect.left + margin;
        styles.maxWidth = `${Math.min(tooltipWidth, targetRect.left - margin * 2)}px`;
        break;

      case "right":
        styles.top = Math.max(margin, Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          viewportHeight - tooltipHeight - safeAreaBottom
        ));
        styles.left = targetRect.right + margin;
        styles.maxWidth = `${Math.min(tooltipWidth, viewportWidth - targetRect.right - margin * 2)}px`;
        break;

      default:
        // Fallback to center
        styles.top = "50%";
        styles.left = "50%";
        styles.transform = "translate(-50%, -50%)";
    }

    return styles;
  };

  return (
    <>
      {/* Fixed skip button in top-right corner - always accessible */}
      <button
        onClick={onSkip}
        style={{
          position: "fixed",
          top: "15px",
          right: "15px",
          zIndex: 10001,
          padding: "8px 16px",
          borderRadius: "20px",
          border: "2px solid rgba(255, 255, 255, 0.3)",
          background: "rgba(0, 0, 0, 0.7)",
          color: "#fff",
          fontSize: "0.85em",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backdropFilter: "blur(10px)",
        }}
      >
        ✕ Skip Tutorial
      </button>

      {/* Main tooltip */}
      <div
        style={{
          ...getTooltipStyles(),
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
          border: "3px solid #8b5cf6",
          borderRadius: "20px",
          padding: "20px",
          boxShadow: "0 10px 40px rgba(139, 92, 246, 0.4)",
          zIndex: 10000,
          animation: "coachMarkFadeIn 0.3s ease",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Mascot and message */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "16px"
        }}>
          <div
            style={{
              fontSize: "2.5em",
              lineHeight: 1,
              animation: "mascotFloat 2s ease-in-out infinite",
              flexShrink: 0,
            }}
          >
            {step.mascotEmoji}
          </div>
          <p
            style={{
              margin: 0,
              color: "#e2e8f0",
              fontSize: "0.95em",
              lineHeight: "1.5",
            }}
          >
            {step.message}
          </p>
        </div>

        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginBottom: "16px",
          }}
        >
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentIndex ? "20px" : "8px",
                height: "8px",
                borderRadius: "4px",
                background: i === currentIndex ? "#8b5cf6" : "rgba(139, 92, 246, 0.3)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Step indicator */}
        <div style={{
          textAlign: "center",
          color: "#64748b",
          fontSize: "0.8em",
          marginBottom: "12px",
        }}>
          Step {currentIndex + 1} of {totalSteps}
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {!isFirstStep && (
            <button
              onClick={onPrev}
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                border: "2px solid rgba(139, 92, 246, 0.5)",
                background: "transparent",
                color: "#a78bfa",
                fontSize: "0.9em",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minWidth: "80px",
              }}
            >
              ← Back
            </button>
          )}

          <button
            onClick={onNext}
            style={{
              padding: "12px 30px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
              color: "#fff",
              fontSize: "0.95em",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
              transition: "all 0.2s ease",
              minWidth: "100px",
            }}
          >
            {isLastStep ? "Let's Go! 🚀" : "Next →"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes coachMarkFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes mascotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
