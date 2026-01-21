"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { ScanHomeworkButton } from "../ui/ScanHomeworkButton";

interface HomeworkSession {
  _id: Id<"homeworkSessions">;
  subject: string;
  grade: string;
  topics: string[];
  gameName: string;
  gameIcon: string;
  questions: {
    text: string;
    type: string;
    options?: string[];
    correct: string;
    explanation?: string;
    hint?: string;
    pageRef?: number;
  }[];
  createdAt: string;
  status?: string;
  score?: number;
  stars?: number;
  userAnswers?: {
    questionIndex: number;
    userAnswer: string;
    isCorrect: boolean;
  }[];
}

interface HomeworkScreenProps {
  playerId: Id<"players"> | null;
  guestId?: string;
  onBack: () => void;
  onPlayHomework: (homework: HomeworkSession) => void;
  onScanHomework: () => void;
  onViewAnswers?: (homework: HomeworkSession) => void;
}

export function HomeworkScreen({
  playerId,
  guestId,
  onBack,
  onPlayHomework,
  onScanHomework,
  onViewAnswers,
}: HomeworkScreenProps) {
  const [showAnswersModal, setShowAnswersModal] = useState(false);

  // Get active homework sessions (support both playerId and guestId for guests)
  const homeworkSessions = useQuery(
    api.homework.getActiveHomeworkSessions,
    playerId ? { playerId } : guestId ? { guestId } : "skip"
  ) as HomeworkSession[] | undefined;

  // Get completed homework sessions
  const completedSessions = useQuery(
    api.homework.getCompletedHomeworkSessions,
    playerId ? { playerId } : guestId ? { guestId } : "skip"
  ) as HomeworkSession[] | undefined;

  return (
    <div className="screen active" style={{ paddingBottom: "100px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "15px",
        marginBottom: "20px",
      }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "2px solid #444",
            borderRadius: "10px",
            padding: "10px 15px",
            color: "white",
            cursor: "pointer",
            fontSize: "1.2em",
          }}
        >
          ←
        </button>
        <h1 style={{
          fontSize: "1.3em",
          color: "#a855f7",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          margin: 0,
        }}>
          📚 My Homework
        </h1>
      </div>

      {/* Scan Homework Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "25px" }}
      >
        <ScanHomeworkButton
          onClick={onScanHomework}
          completedCount={completedSessions?.length}
          onViewAnswers={onViewAnswers && completedSessions && completedSessions.length > 0 ? () => {
            setShowAnswersModal(true);
          } : undefined}
        />
      </motion.div>

      {/* Active Homework Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          border: "2px solid #333",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "15px",
        }}>
          <h2 style={{
            color: "#a855f7",
            fontSize: "1.1em",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>📝</span>
            Active Homework
          </h2>
          {homeworkSessions && homeworkSessions.length > 0 && (
            <span style={{
              background: "#8b5cf6",
              color: "white",
              borderRadius: "10px",
              padding: "4px 10px",
              fontSize: "0.85em",
            }}>
              {homeworkSessions.length}
            </span>
          )}
        </div>

        {homeworkSessions && homeworkSessions.length > 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            {homeworkSessions.map((hw, index) => {
              const hasProgress = hw.userAnswers && hw.userAnswers.length > 0;
              const progressCount = hw.userAnswers?.length || 0;
              const totalQuestions = hw.questions.length;

              return (
                <motion.div
                  key={hw._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onPlayHomework(hw)}
                  style={{
                    background: hasProgress
                      ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(30, 27, 75, 0.4) 100%)"
                      : "linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(30, 27, 75, 0.4) 100%)",
                    borderRadius: "12px",
                    padding: "15px",
                    cursor: "pointer",
                    border: hasProgress ? "2px solid #22c55e" : "2px solid #a855f7",
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  <div style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background: hasProgress ? "rgba(34, 197, 94, 0.3)" : "rgba(168, 85, 247, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8em",
                  }}>
                    {hw.gameIcon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: "1em", marginBottom: "4px", color: "white" }}>
                      {hw.gameName}
                    </div>
                    <div style={{ color: "#c4b5fd", fontSize: "0.85em", marginBottom: "4px" }}>
                      {hw.subject} • {hw.grade}
                    </div>
                    <div style={{ color: hasProgress ? "#22c55e" : "#8b5cf6", fontSize: "0.8em" }}>
                      {hasProgress
                        ? `${progressCount}/${totalQuestions} completed`
                        : `${totalQuestions} questions`
                      }
                    </div>
                    {/* Progress bar for partial progress */}
                    {hasProgress && (
                      <div style={{
                        marginTop: "6px",
                        height: "4px",
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${(progressCount / totalQuestions) * 100}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #22c55e, #4ade80)",
                          borderRadius: "2px",
                        }} />
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: hasProgress
                      ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                      : "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "0.85em",
                    fontWeight: "bold",
                    color: "white",
                  }}>
                    {hasProgress ? "CONTINUE" : "PLAY"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "30px",
            color: "#888",
          }}>
            <div style={{ fontSize: "2.5em", marginBottom: "10px" }}>📷</div>
            <div style={{ marginBottom: "5px" }}>No active homework</div>
            <div style={{ fontSize: "0.85em", color: "#666" }}>
              Scan your homework to create games!
            </div>
          </div>
        )}
      </motion.div>

      {/* Completed Homework Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: "16px",
          padding: "20px",
          border: "2px solid #333",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "15px",
        }}>
          <h2 style={{
            color: "#22c55e",
            fontSize: "1.1em",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>✅</span>
            Completed
          </h2>
          {completedSessions && completedSessions.length > 0 && (
            <span style={{
              background: "#22c55e",
              color: "white",
              borderRadius: "10px",
              padding: "4px 10px",
              fontSize: "0.85em",
            }}>
              {completedSessions.length}
            </span>
          )}
        </div>

        {completedSessions && completedSessions.length > 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            {completedSessions.slice(0, 5).map((hw, index) => (
              <motion.div
                key={hw._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                style={{
                  background: "rgba(34, 197, 94, 0.1)",
                  borderRadius: "10px",
                  padding: "12px",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                }}
              >
                {/* Top Row: Icon, Title, Score */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "10px",
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(34, 197, 94, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4em",
                    flexShrink: 0,
                  }}>
                    {hw.gameIcon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.95em", color: "white" }}>
                      {hw.gameName}
                    </div>
                    <div style={{ color: "#888", fontSize: "0.8em" }}>
                      {hw.subject} • {hw.questions.length} questions
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0,
                  }}>
                    {hw.stars !== undefined && (
                      <div style={{ color: "#FCDB05", fontSize: "0.9em" }}>
                        {"⭐".repeat(hw.stars)}
                      </div>
                    )}
                    {hw.score !== undefined && (
                      <div style={{
                        background: "rgba(34, 197, 94, 0.2)",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        color: "#22c55e",
                        fontSize: "0.85em",
                        fontWeight: "bold",
                      }}>
                        {hw.score}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Action Buttons */}
                <div style={{
                  display: "flex",
                  gap: "8px",
                }}>
                  {/* View Answers Button */}
                  {onViewAnswers && hw.userAnswers && hw.userAnswers.length > 0 && (
                    <button
                      onClick={() => onViewAnswers(hw)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "2px solid #22c55e",
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e",
                        fontSize: "0.8em",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      📝 View Answers
                    </button>
                  )}

                  {/* Retry Button */}
                  <button
                    onClick={() => onPlayHomework(hw)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "2px solid #8b5cf6",
                      background: "rgba(139, 92, 246, 0.15)",
                      color: "#a78bfa",
                      fontSize: "0.8em",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    🔄 Play Again
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "20px",
            color: "#888",
          }}>
            <div style={{ fontSize: "1.5em", marginBottom: "5px" }}>📊</div>
            <div style={{ fontSize: "0.9em" }}>No completed homework yet</div>
          </div>
        )}
      </motion.div>

      {/* Answers Selection Modal */}
      <AnimatePresence>
        {showAnswersModal && completedSessions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAnswersModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              zIndex: 100,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "500px",
                maxHeight: "70vh",
                background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)",
                borderRadius: "20px 20px 0 0",
                padding: "20px",
                overflowY: "auto",
              }}
            >
              {/* Handle bar */}
              <div style={{
                width: "40px",
                height: "4px",
                background: "#444",
                borderRadius: "2px",
                margin: "0 auto 16px",
              }} />

              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "white", fontSize: "1.2em", margin: "0 0 4px 0" }}>
                  📝 My Homework Answers
                </h2>
                <p style={{ color: "#888", fontSize: "0.85em", margin: 0 }}>
                  Select homework to copy answers
                </p>
              </div>

              {/* Homework list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {completedSessions.map((hw) => (
                  <motion.button
                    key={hw._id}
                    onClick={() => {
                      setShowAnswersModal(false);
                      if (onViewAnswers) {
                        onViewAnswers(hw);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "12px",
                      border: "2px solid rgba(34, 197, 94, 0.4)",
                      background: "rgba(34, 197, 94, 0.1)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: "45px",
                      height: "45px",
                      borderRadius: "10px",
                      background: "rgba(34, 197, 94, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5em",
                      flexShrink: 0,
                    }}>
                      {hw.gameIcon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "white", fontWeight: "bold", fontSize: "0.95em" }}>
                        {hw.gameName}
                      </div>
                      <div style={{ color: "#888", fontSize: "0.8em" }}>
                        {hw.questions.length} answers • {hw.score !== undefined ? `${hw.score}%` : ""}
                      </div>
                    </div>
                    <div style={{ color: "#22c55e", fontSize: "1.2em" }}>→</div>
                  </motion.button>
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowAnswersModal(false)}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #444",
                  background: "rgba(255,255,255,0.05)",
                  color: "#888",
                  fontSize: "0.9em",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
