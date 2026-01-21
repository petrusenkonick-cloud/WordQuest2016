"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Track expanded state for each page (all expanded by default)
  const [expandedPages, setExpandedPages] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    pages.forEach(p => initial[p] = true);
    return initial;
  });

  // Track expanded details for individual questions
  const [expandedDetails, setExpandedDetails] = useState<Record<number, boolean>>({});

  // Ref for answers section
  const answersRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to answers section
  useEffect(() => {
    const timer = setTimeout(() => {
      if (answersRef.current) {
        answersRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const togglePage = (page: number) => {
    setExpandedPages(prev => ({ ...prev, [page]: !prev[page] }));
  };

  const toggleDetails = (index: number) => {
    setExpandedDetails(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Expand/collapse all
  const expandAll = () => {
    const newState: Record<number, boolean> = {};
    pages.forEach(p => newState[p] = true);
    setExpandedPages(newState);
  };

  const collapseAll = () => {
    const newState: Record<number, boolean> = {};
    pages.forEach(p => newState[p] = false);
    setExpandedPages(newState);
  };

  return (
    <div className="screen active" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" }}>
      {/* Compact Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "6px",
            padding: "6px 10px",
            color: "white",
            cursor: "pointer",
            fontSize: "0.9em",
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: "white", fontSize: "1em" }}>
            {gameIcon} {gameName}
          </h2>
        </div>
        {/* Stats inline */}
        <div style={{ display: "flex", gap: "12px", fontSize: "0.85em" }}>
          <span style={{ color: "#bbf7d0" }}>✓{totalCorrect}</span>
          <span style={{ color: "#fecaca" }}>✗{totalQuestions - totalCorrect}</span>
          <span style={{ color: "white", fontWeight: "bold" }}>{percentage}%</span>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div
        ref={answersRef}
        style={{
          background: "rgba(34, 197, 94, 0.15)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(34, 197, 94, 0.3)",
        }}
      >
        <span style={{ color: "#22c55e", fontSize: "0.85em", fontWeight: "bold" }}>
          📝 Copy answers to paper
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={expandAll}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "4px",
              padding: "4px 8px",
              color: "#a5b4fc",
              cursor: "pointer",
              fontSize: "0.75em",
            }}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "4px",
              padding: "4px 8px",
              color: "#a5b4fc",
              cursor: "pointer",
              fontSize: "0.75em",
            }}
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Compact Answers List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 12px 80px 12px",
        }}
      >
        {pages.map((pageNum) => {
          const pageQuestions = questionsByPage[pageNum];
          const pageCorrect = pageQuestions.filter(q =>
            userAnswers.find(a => a.questionIndex === q.index)?.isCorrect
          ).length;
          const isExpanded = expandedPages[pageNum];

          return (
            <div key={pageNum} style={{ marginBottom: "8px" }}>
              {/* Page Header - Clickable to expand/collapse */}
              <button
                onClick={() => togglePage(pageNum)}
                style={{
                  width: "100%",
                  background: "rgba(139, 92, 246, 0.2)",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    fontSize: "0.8em",
                  }}>
                    ▶
                  </span>
                  <span style={{ fontSize: "1em" }}>📄</span>
                  <span style={{ fontWeight: "bold" }}>
                    {pages.length > 1 ? `Page ${pageNum}` : "Answers"}
                  </span>
                  <span style={{ color: "#a5b4fc", fontSize: "0.85em" }}>
                    ({pageQuestions.length} questions)
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", fontSize: "0.8em" }}>
                  <span style={{ color: "#22c55e" }}>✓{pageCorrect}</span>
                  <span style={{ color: "#ef4444" }}>✗{pageQuestions.length - pageCorrect}</span>
                </div>
              </button>

              {/* Questions for this page - Compact list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "0 0 8px 8px",
                      padding: "6px",
                      marginTop: "-1px",
                    }}>
                      {pageQuestions.map((q) => {
                        const userAnswer = userAnswers.find((a) => a.questionIndex === q.index);
                        const isCorrect = userAnswer?.isCorrect || false;
                        const showDetails = expandedDetails[q.index];

                        return (
                          <div
                            key={q.index}
                            style={{
                              background: isCorrect
                                ? "rgba(34, 197, 94, 0.1)"
                                : "rgba(239, 68, 68, 0.1)",
                              borderLeft: `3px solid ${isCorrect ? "#22c55e" : "#ef4444"}`,
                              borderRadius: "4px",
                              padding: "8px 10px",
                              marginBottom: "4px",
                            }}
                          >
                            {/* Compact answer row */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              {/* Question number */}
                              <span
                                style={{
                                  background: isCorrect ? "#22c55e" : "#ef4444",
                                  color: "white",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "0.75em",
                                  fontWeight: "bold",
                                  minWidth: "28px",
                                  textAlign: "center",
                                }}
                              >
                                {q.index + 1}
                              </span>

                              {/* Answer - THE MAIN THING */}
                              <span
                                style={{
                                  color: "#22c55e",
                                  fontWeight: "bold",
                                  fontSize: "0.95em",
                                  flex: 1,
                                }}
                              >
                                {q.correct}
                              </span>

                              {/* Wrong indicator */}
                              {!isCorrect && userAnswer && (
                                <span style={{
                                  color: "#ef4444",
                                  fontSize: "0.75em",
                                  textDecoration: "line-through",
                                  opacity: 0.7,
                                }}>
                                  {userAnswer.userAnswer}
                                </span>
                              )}

                              {/* Expand button for details */}
                              <button
                                onClick={() => toggleDetails(q.index)}
                                style={{
                                  background: "rgba(255,255,255,0.1)",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "4px 6px",
                                  color: "#a5b4fc",
                                  cursor: "pointer",
                                  fontSize: "0.7em",
                                }}
                              >
                                {showDetails ? "−" : "+"}
                              </button>

                              {/* Speak button */}
                              <SpeakButton text={q.correct} size="sm" variant="minimal" />
                            </div>

                            {/* Expanded details */}
                            <AnimatePresence>
                              {showDetails && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  style={{ overflow: "hidden" }}
                                >
                                  <div style={{
                                    marginTop: "8px",
                                    paddingTop: "8px",
                                    borderTop: "1px solid rgba(255,255,255,0.1)",
                                  }}>
                                    {/* Question text */}
                                    <p style={{
                                      color: "#94a3b8",
                                      fontSize: "0.8em",
                                      margin: "0 0 6px 0",
                                      lineHeight: 1.4,
                                    }}>
                                      {q.text}
                                    </p>

                                    {/* Explanation */}
                                    {q.explanation && (
                                      <p style={{
                                        color: "#a5b4fc",
                                        fontSize: "0.75em",
                                        margin: 0,
                                        paddingLeft: "8px",
                                        borderLeft: "2px solid rgba(165, 180, 252, 0.3)",
                                      }}>
                                        💡 {q.explanation}
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar - Compact */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(180deg, transparent 0%, #1a1a2e 30%)",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            border: "none",
            borderRadius: "10px",
            padding: "12px 28px",
            color: "white",
            fontSize: "0.95em",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
          }}
        >
          ✓ Done
        </button>
      </div>
    </div>
  );
}
