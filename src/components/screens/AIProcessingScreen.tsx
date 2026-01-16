"use client";

import { useState, useEffect, useCallback } from "react";

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
    // Use error message from API (which is now user-friendly in Russian)
    throw new Error(data.error || "Ошибка при анализе домашки");
  }

  return data;
}

export function AIProcessingScreen({ images, onComplete, onError }: AIProcessingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusText, setStatusText] = useState("Recognizing homework...");

  const steps = [
    { icon: "🔍", label: "Recognizing homework...", done: "Homework recognized!" },
    { icon: "📄", label: `Processing ${images.length} page${images.length > 1 ? "s" : ""}...`, done: "All pages processed!" },
    { icon: "🧠", label: "Understanding content...", done: "Content analyzed!" },
    { icon: "🎮", label: "Creating game...", done: "Game ready!" },
  ];

  const processImages = useCallback(async () => {
    try {
      // Step 1: Recognizing
      setCurrentStep(0);
      setStatusText(steps[0].label);
      await new Promise((r) => setTimeout(r, 1000));
      setProgress(20);

      // Step 2: Processing pages
      setCurrentStep(1);
      setStatusText(steps[1].label);
      // Simulate processing each page
      for (let i = 0; i < images.length; i++) {
        await new Promise((r) => setTimeout(r, 600));
        setProgress(20 + ((i + 1) / images.length) * 30);
        setStatusText(`Processing page ${i + 1} of ${images.length}...`);
      }
      setProgress(50);

      // Step 3: Understanding
      setCurrentStep(2);
      setStatusText(steps[2].label);
      await new Promise((r) => setTimeout(r, 1200));
      setProgress(75);

      // Step 4: Creating game - call real AI
      setCurrentStep(3);
      setStatusText(steps[3].label);
      const result = await analyzeWithGemini(images);
      setProgress(100);
      setStatusText("Ready to play!");

      await new Promise((r) => setTimeout(r, 500));
      onComplete(result);
    } catch (error) {
      // Pass the actual error message from API
      const errorMessage = error instanceof Error ? error.message : "Ошибка при обработке домашки. Попробуй ещё раз!";
      onError(errorMessage);
    }
  }, [images, onComplete, onError]);

  useEffect(() => {
    processImages();
  }, [processImages]);

  return (
    <div className="ai-processing active">
      {/* Wizard */}
      <div className="ai-wizard">🧙‍♂️</div>

      {/* Title */}
      <h2 className="ai-title">Creating Adventure...</h2>

      {/* Status */}
      <p className="ai-status">{statusText}</p>

      {/* Progress bar */}
      <div className="ai-progress">
        <div className="ai-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* Steps */}
      <div className="ai-steps">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`ai-step ${i < currentStep ? "done" : ""} ${i === currentStep ? "current" : ""}`}
          >
            <span className="ai-step-icon">
              {i < currentStep ? "✅" : step.icon}
            </span>
            <span>{i < currentStep ? step.done : step.label}</span>
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
              border: "2px solid rgba(255,255,255,0.2)",
              opacity: 0.6,
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
