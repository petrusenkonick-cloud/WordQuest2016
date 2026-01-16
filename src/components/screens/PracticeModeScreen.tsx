"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface PracticeQuestion {
  text: string;
  type: "multiple_choice" | "fill_blank" | "true_false";
  options?: string[];
  correct: string;
  explanation: string;
  hint: string;
}

interface PracticeModeScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
}

export function PracticeModeScreen({ playerId, onBack }: PracticeModeScreenProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correct, setCorrect] = useState(0);

  // Fetch weak topics from Convex
  const weakTopics = useQuery(
    api.learning.getWeakTopics,
    playerId ? { playerId } : "skip"
  );

  // Generate practice questions for selected topic
  const generatePractice = async (topic: { _id: string; topic: string; subject: string; accuracy: number }) => {
    setSelectedTopicId(topic._id);
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.topic,
          subject: topic.subject,
          difficulty: topic.accuracy < 30 ? "easy" : topic.accuracy < 60 ? "medium" : "hard",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setIsPracticing(true);
        setCurrentIndex(0);
        setCorrect(0);
      } else {
        setError("Failed to generate practice questions");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle answer selection
  const handleAnswer = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    setShowFeedback(true);

    const isCorrect = answer.toLowerCase().trim() === questions[currentIndex].correct.toLowerCase().trim();
    if (isCorrect) {
      setCorrect((c) => c + 1);
    }

    // Move to next after delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // Practice complete
        setIsPracticing(false);
        setQuestions([]);
      }
    }, 2000);
  };

  // Get difficulty color
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy < 30) return "#ef4444";
    if (accuracy < 60) return "#f59e0b";
    return "#22c55e";
  };

  // Get time since last practice
  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  // Render practice game
  if (isPracticing && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const isCorrect = selectedAnswer?.toLowerCase().trim() === currentQ.correct.toLowerCase().trim();

    return (
      <div className="screen active" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>Practice: Question {currentIndex + 1}/{questions.length}</h2>
          <button className="btn" onClick={() => setIsPracticing(false)}>Exit</button>
        </div>

        <div style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: "15px",
          padding: "20px",
          marginBottom: "20px",
        }}>
          <div style={{ fontSize: "1.2em", marginBottom: "20px" }}>{currentQ.text}</div>

          {currentQ.hint && (
            <div style={{ color: "#60a5fa", fontSize: "0.9em", marginBottom: "15px" }}>
              Hint: {currentQ.hint}
            </div>
          )}

          {showFeedback && (
            <div style={{
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "15px",
              background: isCorrect ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
              border: `2px solid ${isCorrect ? "#22c55e" : "#ef4444"}`,
            }}>
              {isCorrect ? "Correct!" : `Wrong. Answer: ${currentQ.correct}`}
              <p style={{ margin: "10px 0 0 0", color: "#AAA" }}>{currentQ.explanation}</p>
            </div>
          )}

          {currentQ.type === "fill_blank" ? (
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Type your answer..."
                className="player-input"
                style={{ flex: 1, padding: "15px" }}
                disabled={showFeedback}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAnswer((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <button
                className="btn btn-primary"
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  handleAnswer(input?.value || "");
                }}
                disabled={showFeedback}
              >
                Check
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {currentQ.options?.map((opt) => (
                <button
                  key={opt}
                  className={`btn ${selectedAnswer === opt ? (isCorrect ? "btn-success" : "btn-danger") : "btn-secondary"}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={showFeedback}
                  style={{ padding: "15px", justifyContent: "center" }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", color: "#22c55e" }}>
          Score: {correct}/{currentIndex + (showFeedback ? 1 : 0)}
        </div>
      </div>
    );
  }

  return (
    <div className="screen active" style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
        <button
          className="btn"
          onClick={onBack}
          style={{ padding: "10px 15px", background: "rgba(0,0,0,0.3)" }}
        >
          Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5em" }}>PRACTICE MODE</h1>
          <p style={{ margin: 0, color: "#AAA", fontSize: "0.9em" }}>
            Master your weak topics
          </p>
        </div>
      </div>

      {/* Loading */}
      {!weakTopics && (
        <div style={{ textAlign: "center", padding: "40px", color: "#AAA" }}>
          Loading topics...
        </div>
      )}

      {/* No weak topics */}
      {weakTopics && weakTopics.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "rgba(34, 197, 94, 0.1)",
          borderRadius: "15px",
          border: "2px solid #22c55e",
        }}>
          <div style={{ fontSize: "4em", marginBottom: "20px" }}>OK</div>
          <h2 style={{ color: "#22c55e", marginBottom: "10px" }}>
            Amazing! No weak topics!
          </h2>
          <p style={{ color: "#AAA" }}>
            Keep up the great work! Complete more homework to find areas to improve.
          </p>
        </div>
      )}

      {/* Weak topics list */}
      {weakTopics && weakTopics.length > 0 && (
        <>
          <p style={{ color: "#f59e0b", marginBottom: "20px" }}>
            These topics need more practice (accuracy below 60%)
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {weakTopics.map((topic) => (
              <div
                key={topic._id}
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "12px",
                  padding: "15px",
                  border: `2px solid ${getAccuracyColor(topic.accuracy)}40`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: "0 0 5px 0", textTransform: "capitalize" }}>
                      {topic.topic.replace(/_/g, " ")}
                    </h3>
                    <p style={{ margin: 0, color: "#888", fontSize: "0.9em" }}>
                      {topic.subject} - Last: {getTimeSince(topic.lastPracticed)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: "1.5em",
                      fontWeight: "bold",
                      color: getAccuracyColor(topic.accuracy),
                    }}>
                      {topic.accuracy}%
                    </div>
                    <div style={{ fontSize: "0.8em", color: "#888" }}>
                      {topic.totalAttempts} attempts
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{
                  marginTop: "10px",
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: "5px",
                  height: "8px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${topic.accuracy}%`,
                    height: "100%",
                    background: getAccuracyColor(topic.accuracy),
                    transition: "width 0.3s ease",
                  }} />
                </div>

                {/* Practice button */}
                <button
                  className="btn btn-primary"
                  onClick={() => generatePractice(topic)}
                  disabled={isGenerating && selectedTopicId === topic._id}
                  style={{
                    width: "100%",
                    marginTop: "15px",
                    justifyContent: "center",
                  }}
                >
                  {isGenerating && selectedTopicId === topic._id ? (
                    "Generating questions..."
                  ) : (
                    "Start Practice"
                  )}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: "20px",
          padding: "15px",
          background: "rgba(239, 68, 68, 0.2)",
          borderRadius: "10px",
          color: "#fca5a5",
          textAlign: "center",
        }}>
          {error}
        </div>
      )}

      {/* Tips */}
      <div style={{
        marginTop: "30px",
        padding: "15px",
        background: "rgba(59, 130, 246, 0.1)",
        borderRadius: "10px",
        border: "1px solid #3b82f640",
      }}>
        <h4 style={{ margin: "0 0 10px 0", color: "#60a5fa" }}>Tips for practice:</h4>
        <ul style={{ margin: 0, paddingLeft: "20px", color: "#AAA", fontSize: "0.9em" }}>
          <li>Practice a little every day</li>
          <li>Use the &quot;I don&apos;t understand&quot; button to get different explanations</li>
          <li>Listen to explanations for better memory</li>
          <li>Don&apos;t rush - accuracy matters more than speed!</li>
        </ul>
      </div>
    </div>
  );
}
