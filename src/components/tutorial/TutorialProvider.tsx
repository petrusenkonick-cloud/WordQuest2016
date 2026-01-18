"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// Tutorial step definition
export interface TutorialStep {
  id: string;
  targetElement: string | null; // CSS selector or null for full-screen
  message: string;
  mascotEmoji: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  highlightPadding?: number;
}

// All tutorial steps
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    targetElement: null,
    message: "Welcome to WordQuest Academy! I'm Merlin the Wizard, and I'll help you become a master of words!",
    mascotEmoji: "🧙‍♂️",
    position: "center",
  },
  {
    id: "homework",
    targetElement: "#homework-section",
    message: "Start here! Scan your homework with the camera - I'll turn it into a fun game for you!",
    mascotEmoji: "📸",
    position: "bottom",
    highlightPadding: 8,
  },
  {
    id: "quest-map",
    targetElement: "#quest-map",
    message: "Follow the Quest Map to learn new words and complete chapters! Each chapter teaches you new spells!",
    mascotEmoji: "🗺️",
    position: "bottom",
    highlightPadding: 8,
  },
  {
    id: "practice",
    targetElement: "#practice-arena",
    message: "Made some mistakes? No worries! Practice Arena helps you train on what you got wrong!",
    mascotEmoji: "⚔️",
    position: "top",
    highlightPadding: 8,
  },
  {
    id: "games",
    targetElement: "#games-section",
    message: "Play fun mini-games to practice your skills and earn rewards like diamonds and gems!",
    mascotEmoji: "🎮",
    position: "top",
    highlightPadding: 8,
  },
  {
    id: "done",
    targetElement: null,
    message: "You're all set! Start with scanning your homework or try a quest. Good luck, young wizard!",
    mascotEmoji: "🎉",
    position: "center",
  },
];

interface TutorialContextType {
  // State
  isActive: boolean;
  currentStep: number;
  currentStepData: TutorialStep | null;
  isCompleted: boolean;

  // Actions
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  goToStep: (stepIndex: number) => void;

  // Registration
  registerElement: (id: string, element: HTMLElement | null) => void;
  getElement: (id: string) => HTMLElement | null;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

interface TutorialProviderProps {
  children: ReactNode;
  playerId: Id<"players"> | null;
}

export function TutorialProvider({ children, playerId }: TutorialProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [registeredElements, setRegisteredElements] = useState<Map<string, HTMLElement>>(new Map());

  // Query tutorial status from Convex
  const tutorialStatus = useQuery(
    api.tutorial.getTutorialStatus,
    playerId ? { playerId } : "skip"
  );

  // Mutation to complete tutorial
  const completeTutorial = useMutation(api.tutorial.completeTutorial);

  // Check if should auto-start tutorial
  useEffect(() => {
    if (tutorialStatus && !tutorialStatus.tutorialCompleted && !isActive) {
      // Small delay to let the page render
      const timeout = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [tutorialStatus, isActive]);

  const currentStepData = isActive && currentStep < TUTORIAL_STEPS.length
    ? TUTORIAL_STEPS[currentStep]
    : null;

  const isCompleted = tutorialStatus?.tutorialCompleted ?? false;

  const startTutorial = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Tutorial complete
      setIsActive(false);
      if (playerId) {
        completeTutorial({ playerId });
      }
    }
  }, [currentStep, playerId, completeTutorial]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    if (playerId) {
      completeTutorial({ playerId });
    }
  }, [playerId, completeTutorial]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < TUTORIAL_STEPS.length) {
      setCurrentStep(stepIndex);
    }
  }, []);

  const registerElement = useCallback((id: string, element: HTMLElement | null) => {
    setRegisteredElements((prev) => {
      const next = new Map(prev);
      if (element) {
        next.set(id, element);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const getElement = useCallback((id: string): HTMLElement | null => {
    return registeredElements.get(id) || document.querySelector(id);
  }, [registeredElements]);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        currentStepData,
        isCompleted,
        startTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        goToStep,
        registerElement,
        getElement,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within TutorialProvider");
  }
  return context;
}

// Optional hook that doesn't throw if outside provider
export function useTutorialOptional() {
  return useContext(TutorialContext);
}
