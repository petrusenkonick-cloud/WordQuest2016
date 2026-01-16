"use client";

import { motion } from "framer-motion";
import { SpeakButton } from "@/components/ui/SpeakButton";

interface Question {
  text: string;
  type: string;
  options?: string[];
  correct: string;
  explanation?: string;
  hint?: string;
  pageRef?: number;
}

interface UserAnswer {
  questionIndex: number;
  userAnswer: string;
  isCorrect: boolean;
}

interface HomeworkAnswersScreenProps {
  subject: string;
  gameName: string;
  gameIcon: string;
  questions: Question[];
  userAnswers: UserAnswer[];
  onClose: () => void;
}

export function HomeworkAnswersScreen({
  subject,
  gameName,
  gameIcon,
  questions,
  userAnswers,
  onClose,
}: HomeworkAnswersScreenProps) {
  // Group questions by page
  const questionsByPage = questions.reduce((acc, q, index) => {
    const page = q.pageRef || 1;
    if (!acc[page]) acc[page] = [];
    acc[page].push({ ...q, index });
    return acc;
  }, {} as Record<number, (Question & { index: number })[]>);

  const pages = Object.keys(questionsByPage).map(Number).sort((a, b) => a - b);

  // Calculate stats
  const totalCorrect = userAnswers.filter((a) => a.isCorrect).length;
  const totalQuestions = questions.length;
  const percentage = Math.round((totalCorrect / totalQuestions) * 100);

  return (
    <div className="screen active" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 4px 20px rgba(34, 197, 94, 0.3)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
            color: "white",
            cursor: "pointer",
            fontSize: "1em",
          }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: "white", fontSize: "1.1em" }}>
            {gameIcon} {gameName}
          </h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "0.85em" }}>
            Answers to copy to paper
          </p>
        </div>
      </div>

      {/* Stats Banner */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-around",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5em", color: "#22c55e" }}>{totalCorrect}</div>
          <div style={{ fontSize: "0.75em", color: "#888" }}>Correct</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5em", color: "#ef4444" }}>{totalQuestions - totalCorrect}</div>
          <div style={{ fontSize: "0.75em", color: "#888" }}>Wrong</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5em", color: "#a855f7" }}>{percentage}%</div>
          <div style={{ fontSize: "0.75em", color: "#888" }}>Score</div>
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          background: "rgba(34, 197, 94, 0.1)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderRadius: "12px",
          padding: "12px 16px",
          margin: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "1.5em" }}>📝</span>
        <div>
          <p style={{ margin: 0, color: "#22c55e", fontWeight: "bold", fontSize: "0.9em" }}>
            Copy these answers to your homework paper!
          </p>
          <p style={{ margin: "4px 0 0 0", color: "#a5b4fc", fontSize: "0.8em" }}>
            The correct answers are highlighted in green
          </p>
        </div>
      </div>

      {/* Questions List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px 100px 16px",
        }}
      >
        {pages.map((pageNum) => (
          <div key={pageNum} style={{ marginBottom: "24px" }}>
            {/* Page Header */}
            {pages.length > 1 && (
              <div
                style={{
                  background: "rgba(139, 92, 246, 0.2)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "1.2em" }}>📄</span>
                <span style={{ color: "#a855f7", fontWeight: "bold" }}>Page {pageNum}</span>
              </div>
            )}

            {/* Questions for this page */}
            {questionsByPage[pageNum].map((q, idx) => {
              const userAnswer = userAnswers.find((a) => a.questionIndex === q.index);
              const isCorrect = userAnswer?.isCorrect || false;

              return (
                <motion.div
                  key={q.index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    background: isCorrect
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                    border: `2px solid ${isCorrect ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  {/* Question Number & Status */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        background: isCorrect ? "#22c55e" : "#ef4444",
                        color: "white",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.8em",
                        fontWeight: "bold",
                      }}
                    >
                      #{q.index + 1} {isCorrect ? "✓" : "✗"}
                    </span>
                    <SpeakButton text={q.text} size="sm" variant="minimal" />
                  </div>

                  {/* Question Text */}
                  <p
                    style={{
                      color: "#e2e8f0",
                      fontSize: "0.95em",
                      lineHeight: 1.5,
                      margin: "0 0 12px 0",
                    }}
                  >
                    {q.text}
                  </p>

                  {/* Your Answer (if wrong) */}
                  {!isCorrect && userAnswer && (
                    <div
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ color: "#888", fontSize: "0.75em" }}>Your answer: </span>
                      <span style={{ color: "#ef4444", textDecoration: "line-through" }}>
                        {userAnswer.userAnswer}
                      </span>
                    </div>
                  )}

                  {/* Correct Answer - THE MAIN THING TO COPY */}
                  <div
                    style={{
                      background: "rgba(34, 197, 94, 0.2)",
                      border: "2px solid #22c55e",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <span style={{ color: "#22c55e", fontSize: "0.75em", fontWeight: "bold" }}>
                        ✅ CORRECT ANSWER:
                      </span>
                      <p
                        style={{
                          color: "white",
                          fontSize: "1.1em",
                          fontWeight: "bold",
                          margin: "4px 0 0 0",
                        }}
                      >
                        {q.correct}
                      </p>
                    </div>
                    <SpeakButton text={q.correct} size="md" />
                  </div>

                  {/* Explanation (collapsed by default) */}
                  {q.explanation && (
                    <details style={{ marginTop: "12px" }}>
                      <summary
                        style={{
                          color: "#a5b4fc",
                          cursor: "pointer",
                          fontSize: "0.85em",
                        }}
                      >
                        💡 Why this is correct
                      </summary>
                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "0.85em",
                          lineHeight: 1.5,
                          marginTop: "8px",
                          paddingLeft: "12px",
                          borderLeft: "2px solid rgba(165, 180, 252, 0.3)",
                        }}
                      >
                        {q.explanation}
                      </p>
                    </details>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Action Bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(180deg, transparent 0%, #1a1a2e 20%)",
          padding: "20px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            border: "none",
            borderRadius: "12px",
            padding: "14px 32px",
            color: "white",
            fontSize: "1em",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
          }}
        >
          ✓ Done - Go Home
        </button>
      </div>
    </div>
  );
}
