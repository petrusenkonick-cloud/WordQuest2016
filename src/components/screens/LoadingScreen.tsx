"use client";

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Loading world...");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const texts = [
      "Loading world...",
      "Building terrain...",
      "Spawning mobs...",
      "Placing blocks...",
      "Ready!",
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setLoadingText("Ready!");
        setTimeout(() => {
          setHidden(true);
          setTimeout(onComplete, 500);
        }, 400);
      }
      setProgress(Math.min(currentProgress, 100));

      const textIndex = Math.min(
        Math.floor((currentProgress / 100) * texts.length),
        texts.length - 1
      );
      setLoadingText(texts[textIndex]);
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`loading-screen ${hidden ? "hidden" : ""}`}>
      <div className="loading-logo">⛏️ WORDCRAFT</div>
      <div className="loading-bar-container">
        <div className="loading-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="loading-text">{loadingText}</div>
    </div>
  );
}
