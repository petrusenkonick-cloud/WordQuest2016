"use client";

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
  const isFullScreen = step.position === "center";
  const isLastStep = currentIndex === totalSteps - 1;
  const isFirstStep = currentIndex === 0;

  // Calculate position based on target and position preference
  const getTooltipStyles = (): React.CSSProperties => {
    if (isFullScreen || !targetRect) {
      // Center on screen
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const margin = 20;
    const tooltipWidth = 320;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let styles: React.CSSProperties = {
      position: "fixed",
      maxWidth: `${tooltipWidth}px`,
    };

    switch (step.position) {
      case "bottom":
        styles.top = targetRect.bottom + margin;
        styles.left = Math.max(
          margin,
          Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            viewportWidth - tooltipWidth - margin
          )
        );
        break;
      case "top":
        styles.bottom = viewportHeight - targetRect.top + margin;
        styles.left = Math.max(
          margin,
          Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            viewportWidth - tooltipWidth - margin
          )
        );
        break;
      case "left":
        styles.top = targetRect.top + targetRect.height / 2 - 60;
        styles.right = viewportWidth - targetRect.left + margin;
        break;
      case "right":
        styles.top = targetRect.top + targetRect.height / 2 - 60;
        styles.left = targetRect.right + margin;
        break;
    }

    return styles;
  };

  return (
    <div
      style={{
        ...getTooltipStyles(),
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
        border: "3px solid #8b5cf6",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 10px 40px rgba(139, 92, 246, 0.4)",
        zIndex: 10000,
        animation: "fadeInScale 0.3s ease",
      }}
    >
      {/* Mascot and message */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "15px", marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "3em",
            lineHeight: 1,
            animation: "float 2s ease-in-out infinite",
          }}
        >
          {step.mascotEmoji}
        </div>
        <p
          style={{
            margin: 0,
            color: "#e2e8f0",
            fontSize: "1em",
            lineHeight: "1.6",
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
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentIndex ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background: i === currentIndex ? "#8b5cf6" : "rgba(139, 92, 246, 0.3)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        {!isFirstStep && (
          <button
            onClick={onPrev}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "2px solid rgba(139, 92, 246, 0.5)",
              background: "transparent",
              color: "#a78bfa",
              fontSize: "0.9em",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#8b5cf6";
              e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Back
          </button>
        )}

        <button
          onClick={onNext}
          style={{
            padding: "10px 30px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
            color: "#fff",
            fontSize: "0.95em",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(139, 92, 246, 0.4)";
          }}
        >
          {isLastStep ? "Let's Go!" : "Next"}
        </button>

        {!isLastStep && (
          <button
            onClick={onSkip}
            style={{
              padding: "10px 15px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              color: "#64748b",
              fontSize: "0.85em",
              cursor: "pointer",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748b";
            }}
          >
            Skip
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
