"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface AIProcessingScreenProps {
  images: string[];
  onComplete: (result: AIAnalysisResult) => void;
  onError: (error: string) => void;
}

export interface AIAnalysisResult {
  subject: string;
  grade: string;
  topics: string[];
  totalPages: number;
  questions: {
    text: string;
    type: "multiple_choice" | "fill_blank" | "true_false";
    options?: string[];
    correct: string;
    explanation?: string;
    hint?: string;
    pageRef?: number;
  }[];
  gameName: string;
  gameIcon: string;
  // AI-analyzed difficulty for fair scoring
  difficulty?: {
    gradeLevel: number;      // 1-11
    multiplier: number;      // 1.0 - 2.0
    topics: string[];        // detected topics
    complexity?: string;     // "easy", "medium", "hard"
  };
}

// Call real Gemini API to analyze homework images
async function analyzeWithGemini(images: string[]): Promise<AIAnalysisResult> {
  const response = await fetch("/api/analyze-homework", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ images }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Use error message from API (which is now user-friendly)
    throw new Error(data.error || "Error analyzing homework");
  }

  return data;
}

export function AIProcessingScreen({ images, onComplete, onError }: AIProcessingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusText, setStatusText] = useState("Starting...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    { icon: "📷", label: "Reading photos...", done: "Photos read!" },
    { icon: "🔍", label: "Finding homework...", done: "Homework found!" },
    { icon: "📄", label: `Processing ${images.length} page${images.length > 1 ? "s" : ""}...`, done: "Pages processed!" },
    { icon: "🧠", label: "AI is thinking...", done: "Content analyzed!" },
    { icon: "🎮", label: "Creating game...", done: "Game ready!" },
  ];

  // Smoothly animate progress to target value
  useEffect(() => {
    if (displayProgress < progress) {
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(prev + 1, progress));
      }, 30); // Smooth increment
      return () => clearTimeout(timer);
    }
  }, [displayProgress, progress]);

  // Gradual progress animation during AI call
  const startGradualProgress = useCallback((from: number, to: number, duration: number) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    const steps = duration / 100; // Update every 100ms
    const increment = (to - from) / steps;
    let current = from;

    progressInterval.current = setInterval(() => {
      current += increment;
      if (current >= to) {
        current = to;
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      }
      setProgress(Math.round(current));
    }, 100);
  }, []);

  const processImages = useCallback(async () => {
    try {
      // Step 1: Reading photos (0% -> 15%)
      setCurrentStep(0);
      setStatusText(steps[0].label);
      startGradualProgress(0, 15, 800);
      await new Promise((r) => setTimeout(r, 800));

      // Step 2: Finding homework (15% -> 25%)
      setCurrentStep(1);
      setStatusText(steps[1].label);
      startGradualProgress(15, 25, 600);
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Processing pages (25% -> 45%)
      setCurrentStep(2);
      const perPageTime = 400;
      for (let i = 0; i < images.length; i++) {
        setStatusText(`Processing page ${i + 1} of ${images.length}...`);
        const pageProgress = 25 + ((i + 1) / images.length) * 20;
        startGradualProgress(25 + (i / images.length) * 20, pageProgress, perPageTime);
        await new Promise((r) => setTimeout(r, perPageTime));
      }

      // Step 4: AI thinking (45% -> 85%) - this is where real API call happens
      setCurrentStep(3);
      setStatusText(steps[3].label);
      setIsAnalyzing(true);

      // Start slow gradual progress during AI call (will be interrupted when done)
      startGradualProgress(45, 85, 30000); // 30 seconds max for this phase

      const result = await analyzeWithGemini(images);

      // AI done, stop gradual and jump to 90%
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      setProgress(90);
      setIsAnalyzing(false);

      // Step 5: Creating game (90% -> 100%)
      setCurrentStep(4);
      setStatusText(steps[4].label);
      startGradualProgress(90, 100, 500);
      await new Promise((r) => setTimeout(r, 500));

      setStatusText("Ready to play!");
      await new Promise((r) => setTimeout(r, 400));

      onComplete(result);
    } catch (error) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      // Pass the actual error message from API
      const errorMessage = error instanceof Error ? error.message : "Error processing homework. Please try again!";
      onError(errorMessage);
    }
  }, [images, onComplete, onError, startGradualProgress]);

  useEffect(() => {
    processImages();

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [processImages]);

  return (
    <div className="ai-processing active">
      {/* Wizard with pulse animation during analysis */}
      <div
        className="ai-wizard"
        style={{
          animation: isAnalyzing ? "pulse 1.5s infinite" : undefined,
        }}
      >
        🧙‍♂️
      </div>

      {/* Title */}
      <h2 className="ai-title">Creating Adventure...</h2>

      {/* Status */}
      <p className="ai-status">{statusText}</p>

      {/* Progress bar with percentage */}
      <div style={{ width: "80%", maxWidth: "300px", textAlign: "center" }}>
        <div className="ai-progress">
          <div
            className="ai-progress-bar"
            style={{
              width: `${displayProgress}%`,
              transition: "width 0.1s linear",
            }}
          />
        </div>
        {/* Percentage display */}
        <div style={{
          color: "#a5b4fc",
          fontSize: "1.2em",
          fontWeight: "bold",
          marginTop: "8px",
          fontFamily: "monospace",
        }}>
          {displayProgress}%
        </div>
      </div>

      {/* Steps with checkmarks */}
      <div className="ai-steps">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`ai-step ${i < currentStep ? "done" : ""} ${i === currentStep ? "current" : ""}`}
          >
            <span className="ai-step-icon" style={{
              animation: i === currentStep ? "pulse 1s infinite" : undefined,
            }}>
              {i < currentStep ? "✅" : step.icon}
            </span>
            <span style={{
              color: i < currentStep ? "#22c55e" : i === currentStep ? "#fff" : "#6b7280",
            }}>
              {i < currentStep ? step.done : step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Thumbnails of captured images */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
        }}
      >
        {images.slice(0, 4).map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Page ${i + 1}`}
            style={{
              width: "50px",
              height: "50px",
              objectFit: "cover",
              borderRadius: "6px",
              border: i === Math.min(currentStep, images.length - 1) && currentStep === 2
                ? "2px solid #8b5cf6"
                : "2px solid rgba(255,255,255,0.2)",
              opacity: currentStep > 2 || (currentStep === 2 && i <= Math.floor((displayProgress - 25) / 20 * images.length))
                ? 1 : 0.4,
              transition: "all 0.3s ease",
            }}
          />
        ))}
        {images.length > 4 && (
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.8em",
            }}
          >
            +{images.length - 4}
          </div>
        )}
      </div>
    </div>
  );
}
