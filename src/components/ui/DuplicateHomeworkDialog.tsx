"use client";

import { motion, AnimatePresence } from "framer-motion";

interface OriginalSession {
  _id: string;
  gameName: string;
  gameIcon: string;
  subject: string;
  score?: number;
  stars?: number;
  completedAt?: string;
  questionsCount: number;
}

interface DuplicateHomeworkDialogProps {
  isOpen: boolean;
  originalSession: OriginalSession;
  onPracticeMode: () => void;
  onScanNew: () => void;
  onClose: () => void;
}

export function DuplicateHomeworkDialog({
  isOpen,
  originalSession,
  onPracticeMode,
  onScanNew,
  onClose,
}: DuplicateHomeworkDialogProps) {
  if (!isOpen) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
            borderRadius: "20px",
            padding: "24px",
            maxWidth: "360px",
            width: "100%",
            border: "3px solid #8b5cf6",
            boxShadow: "0 10px 40px rgba(139, 92, 246, 0.4)",
          }}
        >
          {/* Wizard mascot */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: "3em" }}
            >
              🧙‍♂️
            </motion.div>
          </div>

          {/* Title */}
          <h2
            style={{
              color: "#fbbf24",
              fontSize: "1.2em",
              fontWeight: "bold",
              textAlign: "center",
              margin: "0 0 12px 0",
            }}
          >
            You already completed this!
          </h2>

          {/* Original session info */}
          <div
            style={{
              background: "rgba(34, 197, 94, 0.15)",
              border: "2px solid rgba(34, 197, 94, 0.4)",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "1.8em" }}>{originalSession.gameIcon}</span>
              <div>
                <div
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.95em",
                  }}
                >
                  {originalSession.gameName}
                </div>
                <div style={{ color: "#888", fontSize: "0.8em" }}>
                  {originalSession.subject} • {originalSession.questionsCount} questions
                </div>
              </div>
            </div>

            {/* Previous result */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "10px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ color: "#888", fontSize: "0.85em" }}>
                Previous result:
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {originalSession.stars !== undefined && (
                  <span style={{ color: "#FCDB05" }}>
                    {"⭐".repeat(originalSession.stars)}
                  </span>
                )}
                {originalSession.score !== undefined && (
                  <span
                    style={{
                      background: "#22c55e",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "0.85em",
                      fontWeight: "bold",
                    }}
                  >
                    {originalSession.score}%
                  </span>
                )}
                {originalSession.completedAt && (
                  <span style={{ color: "#666", fontSize: "0.75em" }}>
                    {formatDate(originalSession.completedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Practice mode button */}
            <button
              onClick={onPracticeMode}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none",
                borderRadius: "12px",
                padding: "14px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
              }}
            >
              <span style={{ fontSize: "1.4em" }}>🔄</span>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.95em",
                  }}
                >
                  Play Again (Practice)
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75em" }}>
                  25% XP only • No leaderboard points
                </div>
              </div>
            </button>

            {/* Scan new button */}
            <button
              onClick={onScanNew}
              style={{
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                border: "none",
                borderRadius: "12px",
                padding: "14px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
              }}
            >
              <span style={{ fontSize: "1.4em" }}>📷</span>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.95em",
                  }}
                >
                  Scan Different Homework
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75em" }}>
                  Full rewards • Counts for leaderboard
                </div>
              </div>
            </button>
          </div>

          {/* Info text */}
          <p
            style={{
              color: "#64748b",
              fontSize: "0.75em",
              textAlign: "center",
              margin: "14px 0 0 0",
              lineHeight: 1.4,
            }}
          >
            Practice mode helps you learn, but new homework earns full rewards!
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
