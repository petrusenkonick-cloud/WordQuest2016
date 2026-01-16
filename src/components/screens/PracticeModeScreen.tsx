"use client";

import { useState, useEffect } from "react";

interface WeakTopic {
  _id: string;
  topic: string;
  subject: string;
  accuracy: number;
  totalAttempts: number;
  lastPracticed: string;
}

interface PracticeQuestion {
  text: string;
  type: "multiple_choice" | "fill_blank" | "true_false";
  options?: string[];
  correct: string;
  explanation: string;
  hint: string;
}

interface PracticeModeScreenProps {
  weakTopics: WeakTopic[];
  onStartPractice: (topic: string, questions: PracticeQuestion[]) => void;
  onBack: () => void;
}

export function PracticeModeScreen({
  weakTopics,
  onStartPractice,
  onBack,
}: PracticeModeScreenProps) {
  const [selectedTopic, setSelectedTopic] = useState<WeakTopic | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate practice questions for selected topic
  const generatePractice = async (topic: WeakTopic) => {
    setSelectedTopic(topic);
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
        onStartPractice(topic.topic, data.questions);
      } else {
        setError("Failed to generate practice questions");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Get difficulty color
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy < 30) return "#ef4444"; // red
    if (accuracy < 60) return "#f59e0b"; // orange
    return "#22c55e"; // green
  };

  // Get time since last practice
  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="screen active" style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
        <button
          className="btn"
          onClick={onBack}
          style={{ padding: "10px 15px", background: "rgba(0,0,0,0.3)" }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5em" }}>🎯 PRACTICE MODE</h1>
          <p style={{ margin: 0, color: "#AAA", fontSize: "0.9em" }}>
            Master your weak topics
          </p>
        </div>
      </div>

      {/* No weak topics */}
      {weakTopics.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "rgba(34, 197, 94, 0.1)",
          borderRadius: "15px",
          border: "2px solid #22c55e",
        }}>
          <div style={{ fontSize: "4em", marginBottom: "20px" }}>🏆</div>
          <h2 style={{ color: "#22c55e", marginBottom: "10px" }}>
            Amazing! No weak topics!
          </h2>
          <p style={{ color: "#AAA" }}>
            Keep up the great work! Complete more homework to find areas to improve.
          </p>
        </div>
      )}

      {/* Weak topics list */}
      {weakTopics.length > 0 && (
        <>
          <p style={{ color: "#f59e0b", marginBottom: "20px" }}>
            ⚠️ These topics need more practice (accuracy below 60%)
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
                      📚 {topic.topic.replace(/_/g, " ")}
                    </h3>
                    <p style={{ margin: 0, color: "#888", fontSize: "0.9em" }}>
                      {topic.subject} • Last practiced: {getTimeSince(topic.lastPracticed)}
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
                  disabled={isGenerating && selectedTopic?._id === topic._id}
                  style={{
                    width: "100%",
                    marginTop: "15px",
                    justifyContent: "center",
                  }}
                >
                  {isGenerating && selectedTopic?._id === topic._id ? (
                    "🔄 Generating questions..."
                  ) : (
                    "⚡ Start Practice"
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
          ❌ {error}
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
        <h4 style={{ margin: "0 0 10px 0", color: "#60a5fa" }}>💡 Tips for practice:</h4>
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
