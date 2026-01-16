"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

interface HomeworkSessionData {
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
}

interface QuestMapScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
  onStartQuest: (questId: string, chapterId: number) => void;
  onScanHomework?: () => void;
  onPlayHomework?: (session: HomeworkSessionData) => void;
}

// Subject icons and colors
const SUBJECT_STYLES: Record<string, { icon: string; color: string; bgGradient: string }> = {
  English: { icon: "📖", color: "#60a5fa", bgGradient: "linear-gradient(135deg, #1e40af 0%, #1e1b4b 100%)" },
  Math: { icon: "📐", color: "#22c55e", bgGradient: "linear-gradient(135deg, #166534 0%, #1e1b4b 100%)" },
  Mathematics: { icon: "📐", color: "#22c55e", bgGradient: "linear-gradient(135deg, #166534 0%, #1e1b4b 100%)" },
  Science: { icon: "🔬", color: "#f59e0b", bgGradient: "linear-gradient(135deg, #b45309 0%, #1e1b4b 100%)" },
  History: { icon: "🏛️", color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #6d28d9 0%, #1e1b4b 100%)" },
  Geography: { icon: "🌍", color: "#14b8a6", bgGradient: "linear-gradient(135deg, #0d9488 0%, #1e1b4b 100%)" },
  Reading: { icon: "📚", color: "#ec4899", bgGradient: "linear-gradient(135deg, #be185d 0%, #1e1b4b 100%)" },
  Writing: { icon: "✍️", color: "#f43f5e", bgGradient: "linear-gradient(135deg, #e11d48 0%, #1e1b4b 100%)" },
  Grammar: { icon: "📝", color: "#06b6d4", bgGradient: "linear-gradient(135deg, #0891b2 0%, #1e1b4b 100%)" },
  Spelling: { icon: "🔤", color: "#84cc16", bgGradient: "linear-gradient(135deg, #65a30d 0%, #1e1b4b 100%)" },
  default: { icon: "📚", color: "#a78bfa", bgGradient: "linear-gradient(135deg, #7c3aed 0%, #1e1b4b 100%)" },
};

// Get style for a subject
function getSubjectStyle(subject: string) {
  return SUBJECT_STYLES[subject] || SUBJECT_STYLES.default;
}

// Format date nicely
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

// Homework Quest Card Component
function HomeworkQuestCard({
  session,
  index,
  onPlay,
}: {
  session: {
    _id: Id<"homeworkSessions">;
    gameName: string;
    gameIcon: string;
    subject: string;
    grade: string;
    topics: string[];
    questions: Array<unknown>;
    status: string;
    score?: number;
    stars?: number;
    createdAt: string;
    completedAt?: string;
  };
  index: number;
  onPlay: () => void;
}) {
  const style = getSubjectStyle(session.subject);
  const isCompleted = session.status === "completed";
  const questionCount = session.questions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onPlay}
      className="relative cursor-pointer"
      style={{
        background: style.bgGradient,
        borderRadius: "16px",
        padding: "16px",
        border: `2px solid ${isCompleted ? "#22c55e" : style.color}`,
        boxShadow: isCompleted
          ? "0 0 20px rgba(34, 197, 94, 0.3)"
          : `0 4px 20px ${style.color}40`,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Completed Badge */}
      {isCompleted && (
        <div
          className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold"
          style={{ background: "#22c55e", color: "#000" }}
        >
          ✓ DONE
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
          style={{
            background: `${style.color}30`,
            border: `2px solid ${style.color}`,
          }}
        >
          {session.gameIcon || style.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm truncate">
            {session.gameName}
          </h3>
          <p className="text-gray-400 text-xs">
            {session.subject} • {session.grade}
          </p>
          <p className="text-gray-500 text-xs">
            {questionCount} questions
          </p>
        </div>

        {/* Stars or Play */}
        <div className="text-right">
          {isCompleted ? (
            <div className="text-yellow-400 text-lg">
              {"★".repeat(session.stars || 0)}
              {"☆".repeat(3 - (session.stars || 0))}
            </div>
          ) : (
            <div
              className="px-3 py-1 rounded-lg font-bold text-sm"
              style={{ background: style.color, color: "#000" }}
            >
              PLAY →
            </div>
          )}
        </div>
      </div>

      {/* Topics */}
      {session.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {session.topics.slice(0, 3).map((topic, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-xs"
              style={{ background: `${style.color}20`, color: style.color }}
            >
              {topic}
            </span>
          ))}
          {session.topics.length > 3 && (
            <span className="text-xs text-gray-500">
              +{session.topics.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Date */}
      <div className="text-xs text-gray-500 text-right">
        {formatDate(session.createdAt)}
      </div>

      {/* Score for completed */}
      {isCompleted && session.score !== undefined && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Score</span>
            <span className="text-green-400 font-bold">{session.score}%</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function QuestMapScreen({
  playerId,
  onBack,
  onScanHomework,
  onPlayHomework,
}: QuestMapScreenProps) {
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  // Fetch homework sessions
  const activeSessions = useQuery(
    api.homework.getActiveHomeworkSessions,
    playerId ? { playerId } : "skip"
  );

  const completedSessions = useQuery(
    api.homework.getCompletedHomeworkSessions,
    playerId ? { playerId, limit: 20 } : "skip"
  );

  const deleteSession = useMutation(api.homework.deleteHomeworkSession);

  const handlePlayHomework = (session: HomeworkSessionData) => {
    if (onPlayHomework) {
      onPlayHomework(session);
    }
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: Id<"homeworkSessions">
  ) => {
    e.stopPropagation();
    if (confirm("Delete this homework quest?")) {
      await deleteSession({ sessionId });
    }
  };

  // Loading state
  if (activeSessions === undefined) {
    return (
      <div
        className="screen active flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
        }}
      >
        <div className="text-center">
          <motion.div
            className="text-5xl mb-4"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            🗺️
          </motion.div>
          <div className="text-indigo-300">Loading Adventures...</div>
        </div>
      </div>
    );
  }

  const activeCount = activeSessions?.length || 0;
  const completedCount = completedSessions?.length || 0;
  const currentSessions = activeTab === "active" ? activeSessions : completedSessions;

  return (
    <div
      className="screen active flex flex-col"
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="px-3 py-2 rounded-lg text-white"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          ← Back
        </button>
        <div className="flex-1">
          <h1
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "0.9em" }}
          >
            🗺️ HOMEWORK ADVENTURES
          </h1>
          <p className="text-indigo-300 text-xs">
            Turn homework into exciting quests!
          </p>
        </div>
      </div>

      {/* Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 mb-4"
        style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(30, 27, 75, 0.9) 100%)",
          border: "2px solid #8b5cf6",
        }}
      >
        <div className="flex justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-white">{activeCount}</div>
            <div className="text-xs text-indigo-300">Active Quests</div>
          </div>
          <div className="w-px bg-indigo-500/30" />
          <div>
            <div className="text-2xl font-bold text-green-400">{completedCount}</div>
            <div className="text-xs text-indigo-300">Completed</div>
          </div>
          <div className="w-px bg-indigo-500/30" />
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              {completedSessions?.reduce((sum, s) => sum + (s.stars || 0), 0) || 0}
            </div>
            <div className="text-xs text-indigo-300">Stars Earned</div>
          </div>
        </div>
      </motion.div>

      {/* Scan New Homework Button */}
      {onScanHomework && (
        <motion.button
          onClick={onScanHomework}
          className="w-full py-4 px-6 rounded-xl font-bold text-lg mb-4 flex items-center justify-center gap-3"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "#000",
            boxShadow: "0 4px 20px rgba(245, 158, 11, 0.4)",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-2xl">📸</span>
          SCAN NEW HOMEWORK
        </motion.button>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === "active"
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-400"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === "completed"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-400"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Quest List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentSessions && currentSessions.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === "active" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === "active" ? 20 : -20 }}
              className="flex flex-col gap-3"
            >
              {currentSessions.map((session, index) => (
                <div key={session._id} className="relative">
                  <HomeworkQuestCard
                    session={session}
                    index={index}
                    onPlay={() => handlePlayHomework(session as HomeworkSessionData)}
                  />
                  {/* Delete button for active sessions */}
                  {activeTab === "active" && (
                    <button
                      onClick={(e) => handleDeleteSession(e, session._id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center justify-center hover:bg-red-500/40"
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-center"
            >
              <div className="text-5xl mb-4">
                {activeTab === "active" ? "📚" : "🏆"}
              </div>
              <h3 className="text-white font-bold mb-2">
                {activeTab === "active"
                  ? "No Active Homework Quests"
                  : "No Completed Quests Yet"}
              </h3>
              <p className="text-gray-400 text-sm max-w-xs">
                {activeTab === "active"
                  ? "Scan your homework to start a new adventure!"
                  : "Complete homework quests to see them here."}
              </p>
              {activeTab === "active" && onScanHomework && (
                <button
                  onClick={onScanHomework}
                  className="mt-4 px-6 py-2 rounded-lg font-bold"
                  style={{ background: "#f59e0b", color: "#000" }}
                >
                  📸 Scan Homework
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tip at bottom */}
      <div
        className="mt-4 p-3 rounded-lg text-center text-xs"
        style={{
          background: "rgba(139, 92, 246, 0.1)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
        }}
      >
        <span className="text-indigo-300">
          💡 Complete quests to earn stars and unlock rewards!
        </span>
      </div>
    </div>
  );
}
