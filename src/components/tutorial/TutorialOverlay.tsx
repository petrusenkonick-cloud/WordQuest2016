"use client";

import { useEffect, useState, useRef } from "react";
import { useTutorial, TUTORIAL_STEPS } from "./TutorialProvider";
import { CoachMark } from "./CoachMark";

export function TutorialOverlay() {
  const { isActive, currentStep, currentStepData, nextStep, prevStep, skipTutorial, getElement } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Update target element position and scroll into view
  useEffect(() => {
    if (!isActive || !currentStepData?.targetElement) {
      setTargetRect(null);
      return;
    }

    setIsTransitioning(true);

    const updatePosition = () => {
      const element = getElement(currentStepData.targetElement!);
      if (element) {
        // Scroll element into view with some padding
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Check if element is outside viewport
        if (rect.top < 100 || rect.bottom > viewportHeight - 100) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Wait for scroll to complete before getting final rect
          setTimeout(() => {
            const newRect = element.getBoundingClientRect();
            setTargetRect(newRect);
            setIsTransitioning(false);
          }, 300);
        } else {
          setTargetRect(rect);
          setIsTransitioning(false);
        }
      } else {
        // Element not found - fallback to centered display
        setTargetRect(null);
        setIsTransitioning(false);
      }
    };

    // Small delay to let DOM settle
    const initialTimeout = setTimeout(updatePosition, 100);

    // Update on scroll/resize
    const handleUpdate = () => {
      if (!isTransitioning) {
        const element = getElement(currentStepData.targetElement!);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        }
      }
    };

    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isActive, currentStepData, getElement, currentStep]);

  if (!isActive || !currentStepData) {
    return null;
  }

  const isFullScreen = currentStepData.position === "center";
  const padding = currentStepData.highlightPadding || 8;

  // Don't render spotlight during transition or if element not found for non-center steps
  const showSpotlight = !isFullScreen && targetRect && !isTransitioning;

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
      {showSpotlight && (
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

      {/* Full screen overlay for center positioned steps or when element not found */}
      {(isFullScreen || (!targetRect && !isTransitioning)) && (
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

      {/* Loading overlay during transition */}
      {isTransitioning && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{
            fontSize: "3em",
            animation: "spin 1s linear infinite",
          }}>
            ✨
          </div>
        </div>
      )}

      {/* Highlight border around target */}
      {showSpotlight && (
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

      {/* Coach mark tooltip - always show unless transitioning */}
      {!isTransitioning && (
        <CoachMark
          step={currentStepData}
          targetRect={targetRect}
          currentIndex={currentStep}
          totalSteps={TUTORIAL_STEPS.length}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTutorial}
        />
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(139, 92, 246, 0.1); }
          50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.8), inset 0 0 30px rgba(139, 92, 246, 0.2); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
