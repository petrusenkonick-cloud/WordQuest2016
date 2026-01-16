"use client";

import { useState, useEffect, useCallback } from "react";

interface ExplanationScreenProps {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  hint?: string;
  topic?: string;
  onContinue: () => void;
  onUnderstood?: (style: string, understood: boolean) => void;
}

export function ExplanationScreen({
  question,
  userAnswer,
  correctAnswer,
  explanation: initialExplanation,
  hint,
  topic,
  onContinue,
  onUnderstood,
}: ExplanationScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [wizardMessage, setWizardMessage] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Adaptive learning state
  const [currentExplanation, setCurrentExplanation] = useState(initialExplanation);
  const [currentStyle, setCurrentStyle] = useState<string>("short");
  const [isLoadingNewExplanation, setIsLoadingNewExplanation] = useState(false);
  const [explanationAttempts, setExplanationAttempts] = useState(0);
  const [memoryTrick, setMemoryTrick] = useState<string | null>(null);
  const [encouragement, setEncouragement] = useState<string | null>(null);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Wizard messages cycle
  const wizardMessages = [
    "Don't worry! Let me explain...",
    "Everyone makes mistakes!",
    "Learning is about trying!",
    "You'll get it next time!",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setWizardMessage((prev) => (prev + 1) % wizardMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Text-to-speech function
  const speakExplanation = useCallback(() => {
    if ("speechSynthesis" in window && currentExplanation) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(
        `The correct answer is ${correctAnswer}. ${currentExplanation}`
      );
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [correctAnswer, currentExplanation]);

  // Get alternative explanation ("I don't understand" button)
  const getAlternativeExplanation = useCallback(async () => {
    setIsLoadingNewExplanation(true);
    setExplanationAttempts((prev) => prev + 1);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          correctAnswer,
          userAnswer,
          topic,
          previousStyle: currentStyle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentExplanation(data.explanation);
        setCurrentStyle(data.style);
        setMemoryTrick(data.memoryTrick);
        setEncouragement(data.encouragement);

        // Track that previous style didn't work
        onUnderstood?.(currentStyle, false);
      }
    } catch (error) {
      console.error("Failed to get alternative explanation:", error);
    } finally {
      setIsLoadingNewExplanation(false);
    }
  }, [question, correctAnswer, userAnswer, topic, currentStyle, onUnderstood]);

  // Handle "Got it!" - understood
  const handleUnderstood = () => {
    onUnderstood?.(currentStyle, true);
    onContinue();
  };

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className={`explanation-screen ${isVisible ? "visible" : ""}`}>
      {/* Wizard Character */}
      <div className="explanation-wizard">
        <div className="wizard-character">🧙‍♂️</div>
        <div className="wizard-speech-bubble">
          <span className="wizard-text">{wizardMessages[wizardMessage]}</span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="explanation-card">
        {/* Header */}
        <div className="explanation-header">
          <span className="explanation-icon">📚</span>
          <h2>LET&apos;S LEARN!</h2>
        </div>

        {/* Question Recap */}
        <div className="explanation-question">
          <div className="question-label">QUESTION:</div>
          <div className="question-text">{question}</div>
        </div>

        {/* Answer Comparison */}
        <div className="answer-comparison">
          <div className="answer-box wrong">
            <div className="answer-label">YOUR ANSWER</div>
            <div className="answer-value">
              <span className="answer-icon">❌</span>
              {userAnswer || "(no answer)"}
            </div>
          </div>

          <div className="answer-arrow">→</div>

          <div className="answer-box correct">
            <div className="answer-label">CORRECT ANSWER</div>
            <div className="answer-value">
              <span className="answer-icon">✅</span>
              {correctAnswer}
            </div>
          </div>
        </div>

        {/* Explanation */}
        {currentExplanation && (
          <div className="explanation-content">
            <div className="explanation-title">
              <span>💡</span> WHY?
              {explanationAttempts > 0 && (
                <span style={{ fontSize: "0.7em", marginLeft: "10px", color: "#888" }}>
                  (Explanation style: {currentStyle})
                </span>
              )}
            </div>
            <p className="explanation-text">{currentExplanation}</p>
          </div>
        )}

        {/* Memory Trick */}
        {memoryTrick && (
          <div className="explanation-hint" style={{ background: "rgba(147, 51, 234, 0.2)", borderColor: "#9333ea" }}>
            <span className="hint-icon">🧠</span>
            <span className="hint-label">MEMORY TRICK:</span>
            <span className="hint-text">{memoryTrick}</span>
          </div>
        )}

        {/* Hint */}
        {hint && !memoryTrick && (
          <div className="explanation-hint">
            <span className="hint-icon">🔑</span>
            <span className="hint-label">TIP:</span>
            <span className="hint-text">{hint}</span>
          </div>
        )}

        {/* Encouragement */}
        {encouragement && (
          <div style={{
            textAlign: "center",
            padding: "10px",
            color: "#4ade80",
            fontWeight: "bold",
            fontSize: "1.1em",
          }}>
            ✨ {encouragement}
          </div>
        )}

        {/* Visual Example (for common patterns) */}
        {!encouragement && (
          <div className="visual-example">
            <div className="example-blocks">
              <div className="example-block emerald">📖</div>
              <div className="example-block diamond">✨</div>
              <div className="example-block gold">🎯</div>
            </div>
            <div className="example-caption">Remember for next time!</div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="explanation-actions">
        <button
          className={`btn btn-secondary ${isSpeaking ? "speaking" : ""}`}
          onClick={speakExplanation}
          disabled={isSpeaking || !currentExplanation}
        >
          {isSpeaking ? "🔊 Speaking..." : "🔈 Listen"}
        </button>

        <button className="btn btn-emerald btn-large" onClick={handleUnderstood}>
          ✨ GOT IT!
        </button>
      </div>

      {/* "I don't understand" Button */}
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <button
          className="btn"
          onClick={getAlternativeExplanation}
          disabled={isLoadingNewExplanation || explanationAttempts >= 5}
          style={{
            background: "rgba(239, 68, 68, 0.2)",
            border: "2px solid #ef4444",
            color: "#fca5a5",
            width: "100%",
            justifyContent: "center",
          }}
        >
          {isLoadingNewExplanation ? (
            "🔄 Thinking of another way..."
          ) : explanationAttempts >= 5 ? (
            "Ask your teacher for help! 👩‍🏫"
          ) : (
            <>🤔 I don&apos;t understand - explain differently</>
          )}
        </button>
        {explanationAttempts > 0 && explanationAttempts < 5 && (
          <div style={{ fontSize: "0.8em", color: "#888", marginTop: "5px" }}>
            Tried {explanationAttempts}/5 different explanations
          </div>
        )}
      </div>

      {/* Motivational footer */}
      <div className="explanation-footer">
        <span className="footer-stars">⭐ ⭐ ⭐</span>
        <span className="footer-text">Keep trying! You&apos;re doing great!</span>
      </div>
    </div>
  );
}
