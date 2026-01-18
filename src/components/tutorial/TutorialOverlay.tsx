"use client";

import { useEffect, useState, useRef } from "react";
import { useTutorial, TUTORIAL_STEPS } from "./TutorialProvider";
import { CoachMark } from "./CoachMark";

export function TutorialOverlay() {
  const { isActive, currentStep, currentStepData, nextStep, prevStep, skipTutorial, getElement } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Update target element position
  useEffect(() => {
    if (!isActive || !currentStepData?.targetElement) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const element = getElement(currentStepData.targetElement!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    updatePosition();

    // Update on scroll/resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isActive, currentStepData, getElement]);

  if (!isActive || !currentStepData) {
    return null;
  }

  const isFullScreen = currentStepData.position === "center";
  const padding = currentStepData.highlightPadding || 8;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      {/* Darkened overlay with cutout */}
      {!isFullScreen && targetRect && (
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx={12}
                ry={12}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.85)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      )}

      {/* Full screen overlay for center positioned steps */}
      {isFullScreen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
          }}
        />
      )}

      {/* Highlight border around target */}
      {!isFullScreen && targetRect && (
        <div
          style={{
            position: "absolute",
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            border: "3px solid #8b5cf6",
            borderRadius: "12px",
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(139, 92, 246, 0.1)",
            pointerEvents: "none",
            animation: "pulse-glow 2s infinite",
          }}
        />
      )}

      {/* Coach mark tooltip */}
      <CoachMark
        step={currentStepData}
        targetRect={targetRect}
        currentIndex={currentStep}
        totalSteps={TUTORIAL_STEPS.length}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTutorial}
      />

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(139, 92, 246, 0.1); }
          50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.8), inset 0 0 30px rgba(139, 92, 246, 0.2); }
        }
      `}</style>
    </div>
  );
}
