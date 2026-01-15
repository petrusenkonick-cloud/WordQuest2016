"use client";

import { useState, useEffect, useCallback } from "react";

interface ExplanationScreenProps {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  hint?: string;
  onContinue: () => void;
}

export function ExplanationScreen({
  question,
  userAnswer,
  correctAnswer,
  explanation,
  hint,
  onContinue,
}: ExplanationScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [wizardMessage, setWizardMessage] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    if ("speechSynthesis" in window && explanation) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(
        `The correct answer is ${correctAnswer}. ${explanation}`
      );
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [correctAnswer, explanation]);

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
        {explanation && (
          <div className="explanation-content">
            <div className="explanation-title">
              <span>💡</span> WHY?
            </div>
            <p className="explanation-text">{explanation}</p>
          </div>
        )}

        {/* Hint */}
        {hint && (
          <div className="explanation-hint">
            <span className="hint-icon">🔑</span>
            <span className="hint-label">TIP:</span>
            <span className="hint-text">{hint}</span>
          </div>
        )}

        {/* Visual Example (for common patterns) */}
        <div className="visual-example">
          <div className="example-blocks">
            <div className="example-block emerald">📖</div>
            <div className="example-block diamond">✨</div>
            <div className="example-block gold">🎯</div>
          </div>
          <div className="example-caption">Remember for next time!</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="explanation-actions">
        <button
          className={`btn btn-secondary ${isSpeaking ? "speaking" : ""}`}
          onClick={speakExplanation}
          disabled={isSpeaking || !explanation}
        >
          {isSpeaking ? "🔊 Speaking..." : "🔈 Listen"}
        </button>

        <button className="btn btn-emerald btn-large" onClick={onContinue}>
          ✨ GOT IT!
        </button>
      </div>

      {/* Motivational footer */}
      <div className="explanation-footer">
        <span className="footer-stars">⭐ ⭐ ⭐</span>
        <span className="footer-text">Keep trying! You&apos;re doing great!</span>
      </div>
    </div>
  );
}
