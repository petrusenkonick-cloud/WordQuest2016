"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

// Types for new features
interface DueReviewItem {
  _id: Id<"spacedRepetition">;
  topic: string;
  subject: string;
  level: number;
  nextReviewDate: string;
  easeFactor: number;
}

interface DailyChallenge {
  _id: Id<"dailyQuests">;
  questName: string;
  description: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  reward: { diamonds?: number; emeralds?: number; xp?: number };
}

interface HomeworkSession {
  _id: Id<"homeworkSessions">;
  _creationTime: number; // Convex timestamp
  gameName: string;
  gameIcon: string;
  subject: string;
  grade: string;
  topics: string[];
  questions: {
    text: string;
    type: string;
    options?: string[];
    correct: string;
    explanation?: string;
    hint?: string;
    pageRef?: number;
  }[];
  status: string;
  score?: number;
  stars?: number;
}

interface WeeklyQuestsScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
  onStartPractice: (questId: Id<"weeklyPracticeQuests">) => void;
  onPlayHomework?: (homework: HomeworkSession) => void;
  onStartReview?: (topic: string, subject: string, srsId?: Id<"spacedRepetition">) => void;
  isLoadingReview?: boolean;
}

// Topic icons and colors - brighter, more distinct colors
const TOPIC_STYLES: Record<string, { icon: string; color: string; bg: string; glow: string }> = {
  suffixes: { icon: "🎯", color: "#fbbf24", bg: "#78350f", glow: "rgba(251, 191, 36, 0.5)" },
  prefixes: { icon: "🔑", color: "#a78bfa", bg: "#4c1d95", glow: "rgba(167, 139, 250, 0.5)" },
  verbs: { icon: "🏃", color: "#4ade80", bg: "#14532d", glow: "rgba(74, 222, 128, 0.5)" },
  nouns: { icon: "📦", color: "#60a5fa", bg: "#1e3a5f", glow: "rgba(96, 165, 250, 0.5)" },
  adjectives: { icon: "🎨", color: "#f472b6", bg: "#831843", glow: "rgba(244, 114, 182, 0.5)" },
  spelling: { icon: "✍️", color: "#2dd4bf", bg: "#134e4a", glow: "rgba(45, 212, 191, 0.5)" },
  grammar: { icon: "📝", color: "#fb7185", bg: "#881337", glow: "rgba(251, 113, 133, 0.5)" },
  punctuation: { icon: "❗", color: "#facc15", bg: "#713f12", glow: "rgba(250, 204, 21, 0.5)" },
  multiplication: { icon: "✖️", color: "#4ade80", bg: "#14532d", glow: "rgba(74, 222, 128, 0.5)" },
  division: { icon: "➗", color: "#60a5fa", bg: "#1e3a5f", glow: "rgba(96, 165, 250, 0.5)" },
  addition: { icon: "➕", color: "#fbbf24", bg: "#78350f", glow: "rgba(251, 191, 36, 0.5)" },
  subtraction: { icon: "➖", color: "#f472b6", bg: "#831843", glow: "rgba(244, 114, 182, 0.5)" },
  fractions: { icon: "🍕", color: "#a78bfa", bg: "#4c1d95", glow: "rgba(167, 139, 250, 0.5)" },
  decimals: { icon: "🔢", color: "#2dd4bf", bg: "#134e4a", glow: "rgba(45, 212, 191, 0.5)" },
  word_problems: { icon: "🧩", color: "#fb7185", bg: "#881337", glow: "rgba(251, 113, 133, 0.5)" },
  default: { icon: "📚", color: "#c4b5fd", bg: "#3730a3", glow: "rgba(196, 181, 253, 0.5)" },
};

function getTopicStyle(topic: string) {
  return TOPIC_STYLES[topic.toLowerCase()] || TOPIC_STYLES.default;
}

// Floating particles background
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: ['#8b5cf6', '#ec4899', '#06b6d4', '#fbbf24', '#4ade80'][Math.floor(Math.random() * 5)],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.6,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: Math.random() * 3 + 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Daily Challenge Card - Compact but eye-catching
function DailyChallengeCard({
  challenge,
  onStart,
  onCreateChallenge,
  isLoading,
}: {
  challenge: DailyChallenge | null | undefined;
  onStart: () => void;
  onCreateChallenge: () => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)",
          border: "2px solid rgba(251, 191, 36, 0.3)",
        }}
      >
        <div className="flex items-center gap-3">
          <motion.span
            className="text-3xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            ⏳
          </motion.span>
          <span style={{ color: "#fde68a" }}>Loading challenge...</span>
        </div>
      </motion.div>
    );
  }

  if (!challenge) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)",
          border: "2px solid rgba(139, 92, 246, 0.4)",
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
          <motion.span
            className="text-4xl"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🌟
          </motion.span>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-lg" style={{ color: "#e0e7ff" }}>
              Daily Challenge
            </h3>
            <p className="text-sm" style={{ color: "#a5b4fc" }}>
              Generate your personalized daily challenge!
            </p>
          </div>
          <motion.button
            onClick={onCreateChallenge}
            className="px-5 py-3 rounded-xl font-bold"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(139, 92, 246, 0.4)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create ✨
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const progress = (challenge.currentCount / challenge.targetCount) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Animated glow */}
      <motion.div
        className="absolute -inset-2 rounded-3xl blur-lg"
        style={{
          background: challenge.isCompleted
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          opacity: 0.3,
        }}
        animate={!challenge.isCompleted ? {
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.02, 1],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: challenge.isCompleted
            ? "linear-gradient(145deg, rgba(22, 101, 52, 0.95) 0%, rgba(20, 83, 45, 0.98) 100%)"
            : "linear-gradient(145deg, rgba(120, 53, 15, 0.95) 0%, rgba(66, 32, 6, 0.98) 100%)",
          border: challenge.isCompleted
            ? "3px solid rgba(74, 222, 128, 0.6)"
            : "3px solid rgba(251, 191, 36, 0.5)",
        }}
      >
        {/* Shine effect */}
        {!challenge.isCompleted && (
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(251, 191, 36, 0.5) 45%, transparent 50%)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
        )}

        <div className="relative flex flex-col sm:flex-row items-center gap-4 p-4">
          {/* Icon with mini progress */}
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: challenge.isCompleted
                  ? "rgba(74, 222, 128, 0.2)"
                  : "rgba(251, 191, 36, 0.2)",
                border: `3px solid ${challenge.isCompleted ? "#4ade80" : "#fbbf24"}`,
              }}
            >
              <motion.span
                className="text-3xl"
                animate={!challenge.isCompleted ? {
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {challenge.isCompleted ? "🏆" : "⚡"}
              </motion.span>
            </motion.div>
            {/* Progress ring */}
            <svg
              className="absolute inset-0 -rotate-90"
              width="64"
              height="64"
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={challenge.isCompleted ? "#4ade80" : "#fbbf24"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={176}
                initial={{ strokeDashoffset: 176 }}
                animate={{ strokeDashoffset: 176 - (progress / 100) * 176 }}
                transition={{ duration: 1 }}
              />
            </svg>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h3
                className="font-bold"
                style={{
                  fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                  color: challenge.isCompleted ? "#bbf7d0" : "#fef3c7",
                }}
              >
                {challenge.questName}
              </h3>
              {challenge.isCompleted && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#4ade80", color: "#052e16" }}>
                  DONE!
                </span>
              )}
            </div>
            <p
              className="text-sm mb-2"
              style={{ color: challenge.isCompleted ? "#86efac" : "#fde68a" }}
            >
              {challenge.description}
            </p>
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-3 rounded-full overflow-hidden"
                style={{ background: "rgba(0,0,0,0.3)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1 }}
                  style={{
                    background: challenge.isCompleted
                      ? "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)"
                      : "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
                    boxShadow: `0 0 10px ${challenge.isCompleted ? "#4ade80" : "#fbbf24"}80`,
                  }}
                />
              </div>
              <span
                className="font-bold text-sm"
                style={{ color: challenge.isCompleted ? "#4ade80" : "#fbbf24" }}
              >
                {challenge.currentCount}/{challenge.targetCount}
              </span>
            </div>
          </div>

          {/* Rewards & Action */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {challenge.reward.diamonds && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm" style={{ background: "rgba(6, 182, 212, 0.2)", color: "#06b6d4" }}>
                  💎 {challenge.reward.diamonds}
                </span>
              )}
              {challenge.reward.xp && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm" style={{ background: "rgba(168, 85, 247, 0.2)", color: "#a855f7" }}>
                  ⚡ {challenge.reward.xp}
                </span>
              )}
            </div>
            {!challenge.isCompleted && (
              <motion.button
                onClick={onStart}
                className="px-5 py-2 rounded-xl font-bold text-sm"
                style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  color: "#78350f",
                  boxShadow: "0 4px 12px rgba(251, 191, 36, 0.4)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                START →
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Due Reviews Section - Spaced Repetition items due today
function DueReviewsSection({
  reviews,
  onStartReview,
  isLoading = false,
}: {
  reviews: DueReviewItem[];
  onStartReview: (topic: string, subject: string) => void;
  isLoading?: boolean;
}) {
  if (!reviews || reviews.length === 0) return null;

  // Topic styles mapping
  const getReviewStyle = (level: number) => {
    if (level >= 4) return { color: "#4ade80", bg: "rgba(74, 222, 128, 0.15)", icon: "🌟" };
    if (level >= 3) return { color: "#60a5fa", bg: "rgba(96, 165, 250, 0.15)", icon: "📘" };
    if (level >= 2) return { color: "#fbbf24", bg: "rgba(251, 191, 36, 0.15)", icon: "📙" };
    return { color: "#f472b6", bg: "rgba(244, 114, 182, 0.15)", icon: "📕" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Subtle glow */}
      <div
        className="absolute -inset-2 rounded-2xl blur-lg opacity-25"
        style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" }}
      />

      <div
        className="relative rounded-2xl p-5"
        style={{
          background: "linear-gradient(145deg, rgba(8, 51, 68, 0.9) 0%, rgba(6, 37, 50, 0.95) 100%)",
          border: "2px solid rgba(6, 182, 212, 0.4)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.span
            className="text-3xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🔄
          </motion.span>
          <div className="flex-1">
            <h3
              className="font-bold"
              style={{ fontSize: "1.1rem", color: "#a5f3fc" }}
            >
              Review Time!
            </h3>
            <p className="text-sm" style={{ color: "#67e8f9" }}>
              {reviews.length} topic{reviews.length > 1 ? "s" : ""} ready for review today
            </p>
          </div>
          <span
            className="px-3 py-1.5 rounded-full font-bold text-sm"
            style={{
              background: "rgba(6, 182, 212, 0.2)",
              color: "#06b6d4",
              border: "1px solid rgba(6, 182, 212, 0.4)",
            }}
          >
            +50 XP each
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {reviews.slice(0, 6).map((review, index) => {
            const style = getReviewStyle(review.level);
            return (
              <motion.button
                key={review._id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => !isLoading && onStartReview(review.topic, review.subject)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold disabled:opacity-50"
                style={{
                  background: style.bg,
                  color: style.color,
                  border: `2px solid ${style.color}40`,
                }}
                whileHover={!isLoading ? { scale: 1.05, y: -2 } : {}}
                whileTap={!isLoading ? { scale: 0.95 } : {}}
              >
                {isLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⏳
                  </motion.span>
                ) : (
                  <span>{style.icon}</span>
                )}
                <span className="capitalize">{review.topic}</span>
                <span
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: "rgba(0,0,0,0.3)" }}
                >
                  Lv{review.level}
                </span>
              </motion.button>
            );
          })}
          {reviews.length > 6 && (
            <span
              className="flex items-center px-3 py-2 rounded-xl text-sm"
              style={{ background: "rgba(255,255,255,0.1)", color: "#67e8f9" }}
            >
              +{reviews.length - 6} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Homework Section - Shows active homework sessions grouped by date
function HomeworkSection({
  sessions,
  onPlayHomework,
}: {
  sessions: HomeworkSession[];
  onPlayHomework: (homework: HomeworkSession) => void;
}) {
  if (!sessions || sessions.length === 0) return null;

  // Group sessions by date using Convex _creationTime
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const groupedSessions = sessions.reduce((acc, session) => {
    // Convert Convex timestamp to date string
    const sessionDate = new Date(session._creationTime).toISOString().split('T')[0];
    let label = sessionDate;

    if (sessionDate === today) label = "Today";
    else if (sessionDate === yesterday) label = "Yesterday";
    else {
      // Format as "Mon, Jan 15"
      const date = new Date(session._creationTime);
      label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    if (!acc[label]) acc[label] = [];
    acc[label].push(session);
    return acc;
  }, {} as Record<string, HomeworkSession[]>);

  // Sort groups: Today first, then Yesterday, then by date descending
  const sortedGroups = Object.entries(groupedSessions).sort(([a], [b]) => {
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    return 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Glow */}
      <div
        className="absolute -inset-2 rounded-2xl blur-lg opacity-20"
        style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}
      />

      <div
        className="relative rounded-2xl p-5"
        style={{
          background: "linear-gradient(145deg, rgba(20, 83, 45, 0.9) 0%, rgba(15, 61, 33, 0.95) 100%)",
          border: "2px solid rgba(74, 222, 128, 0.4)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.span
            className="text-3xl"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            📚
          </motion.span>
          <div className="flex-1">
            <h3 className="font-bold" style={{ fontSize: "1.1rem", color: "#bbf7d0" }}>
              Your Homework
            </h3>
            <p className="text-sm" style={{ color: "#86efac" }}>
              {sessions.length} assignment{sessions.length > 1 ? 's' : ''} ready to play
            </p>
          </div>
        </div>

        {sortedGroups.map(([dateLabel, dateSessions]) => (
          <div key={dateLabel} className="mb-4 last:mb-0">
            {/* Date label */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.3)", color: "#86efac" }}>
                {dateLabel}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(134, 239, 172, 0.2)" }} />
            </div>

            {/* Sessions for this date */}
            <div className="flex flex-col gap-2">
              {dateSessions.map((session, index) => (
                <motion.button
                  key={session._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onPlayHomework(session)}
                  className="flex items-center gap-3 p-3 rounded-xl w-full text-left"
                  style={{
                    background: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid rgba(74, 222, 128, 0.3)",
                  }}
                  whileHover={{ scale: 1.02, background: "rgba(0, 0, 0, 0.35)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl">{session.gameIcon || "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate" style={{ color: "#f0fdf4" }}>
                      {session.gameName}
                    </h4>
                    <p className="text-sm" style={{ color: "#86efac" }}>
                      {session.subject} • {session.questions.length} questions
                    </p>
                  </div>
                  <motion.span
                    className="px-3 py-1.5 rounded-lg font-bold text-sm"
                    style={{
                      background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                      color: "#fff",
                    }}
                    whileHover={{ scale: 1.1 }}
                  >
                    PLAY →
                  </motion.span>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Circular Progress Ring Component
function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  color = "#8b5cf6",
  bgColor = "rgba(255,255,255,0.1)",
  children
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Practice Quest Card - Redesigned for visual impact
function PracticeQuestCard({
  quest,
  index,
  onStart,
}: {
  quest: {
    _id: Id<"weeklyPracticeQuests">;
    questName: string;
    questIcon: string;
    description: string;
    topic: string;
    subject: string;
    errorCount: number;
    targetCorrect: number;
    currentCorrect: number;
    isCompleted: boolean;
    reward: { diamonds: number; emeralds: number; xp: number };
  };
  index: number;
  onStart: () => void;
}) {
  const progress = (quest.currentCorrect / quest.targetCorrect) * 100;
  const topicStyle = getTopicStyle(quest.topic);

  return (
    <motion.div
      initial={{ opacity: 0, x: -50, rotateY: -10 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
      onClick={!quest.isCompleted ? onStart : undefined}
      className={`relative ${quest.isCompleted ? "" : "cursor-pointer"}`}
      whileHover={!quest.isCompleted ? {
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2 }
      } : {}}
      whileTap={!quest.isCompleted ? { scale: 0.98 } : {}}
    >
      {/* Glow effect behind card */}
      <div
        className="absolute -inset-1 rounded-3xl blur-lg opacity-50"
        style={{
          background: quest.isCompleted
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : `linear-gradient(135deg, ${topicStyle.color} 0%, ${topicStyle.bg} 100%)`,
        }}
      />

      {/* Main Card Container */}
      <div
        className="relative rounded-2xl overflow-hidden backdrop-blur-sm"
        style={{
          background: quest.isCompleted
            ? "linear-gradient(145deg, rgba(22, 101, 52, 0.95) 0%, rgba(20, 83, 45, 0.98) 100%)"
            : "linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
          border: quest.isCompleted
            ? "2px solid rgba(74, 222, 128, 0.6)"
            : `2px solid ${topicStyle.color}40`,
          boxShadow: quest.isCompleted
            ? "0 20px 40px rgba(74, 222, 128, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
            : `0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        {/* Animated shine effect */}
        {!quest.isCompleted && (
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(105deg, transparent 40%, ${topicStyle.color}40 45%, transparent 50%)`,
            }}
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Content Layout - responsive: stack on mobile */}
        <div className="relative flex flex-col sm:flex-row sm:items-stretch">
          {/* Top/Left: Icon with Progress Ring */}
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              padding: "20px",
              background: quest.isCompleted
                ? "rgba(0,0,0,0.2)"
                : `linear-gradient(180deg, ${topicStyle.bg}80 0%, ${topicStyle.bg}40 100%)`,
            }}
          >
            <ProgressRing
              progress={progress}
              size={90}
              strokeWidth={7}
              color={quest.isCompleted ? "#4ade80" : topicStyle.color}
              bgColor="rgba(255,255,255,0.1)"
            >
              <motion.span
                className="text-4xl"
                animate={quest.isCompleted ? {} : { scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {quest.isCompleted ? "✅" : quest.questIcon}
              </motion.span>
            </ProgressRing>
          </div>

          {/* Middle: Title, Description, Progress */}
          <div className="flex-1" style={{ padding: "20px" }}>
            <h3
              className="font-bold"
              style={{
                fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                marginBottom: "10px",
                color: quest.isCompleted ? "#86efac" : "#f8fafc",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {quest.questName}
            </h3>
            <p
              className="line-clamp-2"
              style={{
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                lineHeight: "1.5",
                marginBottom: "16px",
                color: quest.isCompleted ? "#bbf7d0" : "#94a3b8"
              }}
            >
              {quest.description}
            </p>

            {/* Progress Bar */}
            <div className="flex items-center gap-4" style={{ marginBottom: "16px" }}>
              <div
                className="flex-1 rounded-full overflow-hidden"
                style={{
                  height: "12px",
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.3, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: quest.isCompleted
                      ? "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)"
                      : `linear-gradient(90deg, ${topicStyle.bg} 0%, ${topicStyle.color} 100%)`,
                    boxShadow: `0 0 10px ${quest.isCompleted ? "#4ade80" : topicStyle.color}80`,
                  }}
                />
              </div>
              <span
                className="font-bold px-3 py-1.5 rounded-lg text-center"
                style={{
                  fontSize: "clamp(0.85rem, 2vw, 1rem)",
                  minWidth: "60px",
                  background: quest.isCompleted ? "rgba(74, 222, 128, 0.2)" : `${topicStyle.color}25`,
                  color: quest.isCompleted ? "#4ade80" : topicStyle.color,
                }}
              >
                {quest.currentCorrect}/{quest.targetCorrect}
              </span>
            </div>

            {/* Rewards Row */}
            <div className="flex flex-wrap items-center gap-3">
              <RewardBadge icon="💎" value={quest.reward.diamonds} color="#06b6d4" />
              <RewardBadge icon="🟢" value={quest.reward.emeralds} color="#22c55e" />
              <RewardBadge icon="⚡" value={quest.reward.xp} label="XP" color="#a855f7" />
            </div>
          </div>

          {/* Bottom/Right: Play Button */}
          <div className="flex items-center justify-center sm:justify-end p-4 sm:pr-6">
            {quest.isCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="rounded-xl font-bold"
                style={{
                  padding: "14px 20px",
                  fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "#052e16",
                  boxShadow: "0 4px 16px rgba(34, 197, 94, 0.4), inset 0 2px 0 rgba(255,255,255,0.2)",
                }}
              >
                DONE ✓
              </motion.div>
            ) : (
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Button glow */}
                <div
                  className="absolute inset-0 rounded-xl blur-md"
                  style={{ background: topicStyle.color, opacity: 0.5 }}
                />
                <div
                  className="relative rounded-xl font-bold flex items-center gap-2"
                  style={{
                    padding: "14px 22px",
                    fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
                    background: `linear-gradient(135deg, ${topicStyle.color} 0%, ${topicStyle.bg} 100%)`,
                    color: "#fff",
                    boxShadow: `0 4px 20px ${topicStyle.glow}`,
                    border: "2px solid rgba(255,255,255,0.3)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  PLAY
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Error count badge */}
      {!quest.isCompleted && quest.errorCount > 0 && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-3 -left-2 px-3 py-1.5 rounded-full text-xs font-bold z-10"
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            color: "#fff",
            boxShadow: "0 4px 16px rgba(239, 68, 68, 0.6)",
            border: "2px solid #fecaca",
          }}
        >
          🔥 {quest.errorCount} mistakes
        </motion.div>
      )}
    </motion.div>
  );
}

// Small reward badge component
function RewardBadge({
  icon,
  value,
  label,
  color
}: {
  icon: string;
  value: number;
  label?: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg font-bold px-2.5 py-1.5 sm:px-3 sm:py-2"
      style={{
        fontSize: "clamp(0.85rem, 2vw, 1rem)",
        background: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <span className="text-base sm:text-lg">{icon}</span>
      <span>{value}{label && ` ${label}`}</span>
    </div>
  );
}

// Weekly Champion Progress Component - Redesigned with trophy animation
function WeeklyChampionCard({
  champion,
  onClaim,
}: {
  champion: {
    totalQuestsCompleted: number;
    totalQuestsAvailable: number;
    bonusClaimed: boolean;
    bonusReward: { diamonds: number; emeralds: number; xp: number };
  } | null;
  onClaim: () => void;
}) {
  if (!champion) return null;

  const progress = champion.totalQuestsAvailable > 0
    ? (champion.totalQuestsCompleted / champion.totalQuestsAvailable) * 100
    : 0;
  const canClaim = champion.totalQuestsCompleted >= champion.totalQuestsAvailable &&
    champion.totalQuestsAvailable > 0 && !champion.bonusClaimed;

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Animated glow behind card */}
      <motion.div
        className="absolute -inset-3 rounded-3xl blur-xl"
        style={{
          background: canClaim
            ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
            : champion.bonusClaimed
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
          opacity: canClaim ? 0.4 : 0.2,
        }}
        animate={canClaim ? {
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.02, 1],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: canClaim
            ? "linear-gradient(145deg, rgba(120, 53, 15, 0.95) 0%, rgba(66, 32, 6, 0.98) 100%)"
            : champion.bonusClaimed
            ? "linear-gradient(145deg, rgba(22, 101, 52, 0.95) 0%, rgba(20, 83, 45, 0.98) 100%)"
            : "linear-gradient(145deg, rgba(55, 48, 163, 0.95) 0%, rgba(30, 27, 75, 0.98) 100%)",
          border: canClaim
            ? "3px solid rgba(251, 191, 36, 0.6)"
            : champion.bonusClaimed
            ? "3px solid rgba(74, 222, 128, 0.6)"
            : "3px solid rgba(139, 92, 246, 0.4)",
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6">
          {/* Trophy with Progress Ring */}
          <ProgressRing
            progress={progress}
            size={80}
            strokeWidth={7}
            color={canClaim ? "#fbbf24" : champion.bonusClaimed ? "#4ade80" : "#a78bfa"}
          >
            <motion.div
              className="text-5xl"
              animate={canClaim ? {
                rotate: [-10, 10, -10],
                scale: [1, 1.15, 1],
              } : champion.bonusClaimed ? {} : {
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {champion.bonusClaimed ? "🎖️" : "🏆"}
            </motion.div>
          </ProgressRing>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h3
              className="font-bold mb-2"
              style={{
                fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                color: canClaim ? "#fef3c7" : champion.bonusClaimed ? "#bbf7d0" : "#e0e7ff",
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              {champion.bonusClaimed ? "Champion Achieved!" : "Weekly Champion"}
            </h3>
            <p
              className="mb-4"
              style={{
                fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
                color: canClaim ? "#fde68a" : champion.bonusClaimed ? "#86efac" : "#a5b4fc"
              }}
            >
              {champion.bonusClaimed
                ? "Amazing work! See you next week!"
                : `Complete all ${champion.totalQuestsAvailable} quests to unlock bonus!`}
            </p>

            {/* Rewards preview */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(6, 182, 212, 0.2)" }}>
                <span className="text-lg">💎</span>
                <span className="font-bold text-base text-cyan-400">{champion.bonusReward.diamonds}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(34, 197, 94, 0.2)" }}>
                <span className="text-lg">🟢</span>
                <span className="font-bold text-base text-green-400">{champion.bonusReward.emeralds}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(168, 85, 247, 0.2)" }}>
                <span className="text-lg">⚡</span>
                <span className="font-bold text-base text-purple-400">{champion.bonusReward.xp} XP</span>
              </div>
            </div>
          </div>

          {/* Claim Button or Status */}
          {canClaim ? (
            <motion.button
              onClick={onClaim}
              className="px-7 py-5 rounded-xl font-bold text-lg relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                color: "#78350f",
                boxShadow: "0 8px 24px rgba(251, 191, 36, 0.5)",
                border: "3px solid #fef3c7",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, transparent 50%)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              <span className="relative flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                CLAIM!
              </span>
            </motion.button>
          ) : !champion.bonusClaimed ? (
            <div
              className="px-5 py-4 rounded-xl font-bold text-center"
              style={{
                background: "rgba(0,0,0,0.3)",
                color: "#a5b4fc",
                fontSize: "1.1rem",
                border: "2px solid rgba(139, 92, 246, 0.3)",
              }}
            >
              {champion.totalQuestsCompleted}/{champion.totalQuestsAvailable}
              <div className="text-sm opacity-70 mt-1">quests</div>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

// Weak Topics Summary - Redesigned with better visuals
function WeakTopicsSummary({
  topics,
}: {
  topics: Array<{ topic: string; count: number; lastError: string }>;
}) {
  if (topics.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      {/* Subtle glow */}
      <div
        className="absolute -inset-2 rounded-2xl blur-lg opacity-30"
        style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}
      />

      <div
        className="relative rounded-2xl p-5"
        style={{
          background: "linear-gradient(145deg, rgba(127, 29, 29, 0.9) 0%, rgba(69, 10, 10, 0.95) 100%)",
          border: "3px solid rgba(248, 113, 113, 0.4)",
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <motion.span
            className="text-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            🎯
          </motion.span>
          <span
            className="font-bold"
            style={{ fontSize: "1.15rem", color: "#fecaca", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          >
            Focus Areas This Week:
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {topics.slice(0, 5).map((t, i) => {
            const style = getTopicStyle(t.topic);
            return (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2"
                style={{
                  fontSize: "1rem",
                  background: `linear-gradient(135deg, ${style.bg} 0%, ${style.bg}cc 100%)`,
                  color: style.color,
                  border: `2px solid ${style.color}50`,
                  boxShadow: `0 4px 12px ${style.glow}`,
                }}
              >
                <span className="text-lg">{style.icon}</span>
                {t.topic}
                <span
                  className="px-2 py-1 rounded-lg text-sm"
                  style={{ background: "rgba(0,0,0,0.3)" }}
                >
                  {t.count}
                </span>
              </motion.span>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function WeeklyQuestsScreen({
  playerId,
  onBack,
  onStartPractice,
  onPlayHomework,
  onStartReview,
  isLoadingReview = false,
}: WeeklyQuestsScreenProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch weekly quests data
  const weeklyData = useQuery(
    api.weeklyQuests.getWeeklyQuests,
    playerId ? { playerId } : "skip"
  );

  // Fetch weak topics
  const weakTopics = useQuery(
    api.errors.getWeakTopics,
    playerId ? { playerId } : "skip"
  );

  // Fetch daily challenge
  const dailyChallenge = useQuery(
    api.learning.getDailyChallenge,
    playerId ? { playerId } : "skip"
  );

  // Fetch due reviews (Spaced Repetition)
  const dueReviews = useQuery(
    api.learning.getDueReviews,
    playerId ? { playerId } : "skip"
  );

  // Fetch active homework sessions
  const homeworkSessions = useQuery(
    api.homework.getActiveHomeworkSessions,
    playerId ? { playerId } : "skip"
  );

  // Mutations
  const generateQuests = useMutation(api.weeklyQuests.generateWeeklyQuests);
  const claimBonus = useMutation(api.weeklyQuests.claimWeeklyBonus);
  const createDailyChallenge = useMutation(api.learning.createDailyChallenge);

  // Generate quests if none exist
  useEffect(() => {
    if (playerId && weeklyData && weeklyData.quests.length === 0 && weakTopics && weakTopics.length > 0) {
      generateQuests({ playerId });
    }
  }, [playerId, weeklyData, weakTopics, generateQuests]);

  const handleClaimBonus = async () => {
    if (!playerId) return;

    const result = await claimBonus({ playerId });
    if (result.success) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  };

  const handleGenerateQuests = async () => {
    if (!playerId) return;
    await generateQuests({ playerId });
  };

  const handleCreateDailyChallenge = async () => {
    if (!playerId) return;
    await createDailyChallenge({ playerId });
  };

  const handleStartDailyChallenge = () => {
    // For now, start the first quest as the daily challenge
    // In a full implementation, this would start a dedicated daily challenge mode
    if (weeklyData?.quests && weeklyData.quests.length > 0) {
      const firstIncomplete = weeklyData.quests.find(q => !q.isCompleted);
      if (firstIncomplete) {
        onStartPractice(firstIncomplete._id);
      }
    }
  };

  const handleStartReview = (topic: string, subject: string) => {
    // Use the dedicated SRS review handler if available
    if (onStartReview) {
      // Find the SRS ID for this topic
      const reviewItem = (dueReviews as DueReviewItem[])?.find(
        r => r.topic.toLowerCase() === topic.toLowerCase()
      );
      onStartReview(topic, subject, reviewItem?._id);
    } else {
      // Fallback: Find quest matching the topic
      if (weeklyData?.quests) {
        const matchingQuest = weeklyData.quests.find(
          q => q.topic.toLowerCase() === topic.toLowerCase() && !q.isCompleted
        );
        if (matchingQuest) {
          onStartPractice(matchingQuest._id);
        } else {
          const firstIncomplete = weeklyData.quests.find(q => !q.isCompleted);
          if (firstIncomplete) {
            onStartPractice(firstIncomplete._id);
          }
        }
      }
    }
  };

  // Loading state
  if (weeklyData === undefined) {
    return (
      <div
        className="screen active flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #0c0a1d 0%, #1a1333 50%, #0f172a 100%)",
        }}
      >
        <FloatingParticles />
        <div className="text-center relative z-10">
          <motion.div
            className="text-7xl mb-4"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity },
            }}
          >
            ⚔️
          </motion.div>
          <motion.div
            className="text-2xl font-bold"
            style={{ color: "#a5b4fc", textShadow: "0 2px 12px rgba(165, 180, 252, 0.6)" }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading Practice Arena...
          </motion.div>
        </div>
      </div>
    );
  }

  const { quests, champion, weekStart, weekEnd, totalCompleted, totalQuests } = weeklyData;

  return (
    <div
      className="screen active flex flex-col relative"
      style={{
        background: "linear-gradient(180deg, #0c0a1d 0%, #1a1333 40%, #0f172a 100%)",
        padding: "clamp(16px, 4vw, 28px)",
        overflowY: "auto",
      }}
    >
      {/* Background particles */}
      <FloatingParticles />

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.9)" }}
          >
            {/* Confetti */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  backgroundColor: ['#fbbf24', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4'][Math.floor(Math.random() * 5)],
                }}
                animate={{
                  y: [0, window.innerHeight + 100],
                  x: [(Math.random() - 0.5) * 200],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  ease: "easeOut",
                  delay: Math.random() * 0.5,
                }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 20 }}
              className="text-center p-10 rounded-3xl relative"
              style={{
                background: "linear-gradient(145deg, rgba(120, 53, 15, 0.98) 0%, rgba(66, 32, 6, 1) 100%)",
                border: "4px solid #fbbf24",
                boxShadow: "0 0 80px rgba(251, 191, 36, 0.6), 0 0 160px rgba(251, 191, 36, 0.3)",
              }}
            >
              <motion.div
                className="text-8xl mb-6"
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, -15, 15, 0],
                }}
                transition={{ duration: 0.8, repeat: 3 }}
              >
                🏆
              </motion.div>
              <h2
                className="text-4xl font-bold mb-3"
                style={{
                  color: "#fef3c7",
                  textShadow: "0 4px 12px rgba(0,0,0,0.5), 0 0 30px rgba(251, 191, 36, 0.5)"
                }}
              >
                WEEKLY CHAMPION!
              </h2>
              <p className="text-xl" style={{ color: "#fde68a" }}>
                All bonus rewards collected!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 mb-6 sm:mb-8">
        <motion.button
          onClick={onBack}
          className="px-4 py-2 sm:px-5 sm:py-3 rounded-xl font-bold"
          style={{
            background: "linear-gradient(135deg, rgba(55, 65, 81, 0.9) 0%, rgba(31, 41, 55, 0.95) 100%)",
            color: "#f3f4f6",
            fontSize: "clamp(0.85rem, 2vw, 1rem)",
            border: "2px solid rgba(75, 85, 99, 0.6)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Back
        </motion.button>
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-bold flex items-center gap-2 sm:gap-3"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "clamp(0.9em, 3vw, 1.4em)",
              color: "#f1f5f9",
              textShadow: "0 2px 12px rgba(0,0,0,0.5), 0 0 30px rgba(139, 92, 246, 0.4)",
            }}
          >
            <motion.span
              className="text-2xl sm:text-3xl"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚔️
            </motion.span>
            PRACTICE ARENA
          </motion.h1>
          <p style={{ color: "#a5b4fc", fontSize: "clamp(0.85rem, 2.5vw, 1.1rem)", marginTop: "6px", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
            Master your weak spots & earn rewards!
          </p>
        </div>
      </div>

      {/* Daily Challenge - Top Priority */}
      <div className="relative z-10" style={{ marginBottom: "20px" }}>
        <DailyChallengeCard
          challenge={dailyChallenge as DailyChallenge | null | undefined}
          onStart={handleStartDailyChallenge}
          onCreateChallenge={handleCreateDailyChallenge}
          isLoading={dailyChallenge === undefined}
        />
      </div>

      {/* Due Reviews - Spaced Repetition */}
      {dueReviews && dueReviews.length > 0 && (
        <div className="relative z-10" style={{ marginBottom: "20px" }}>
          <DueReviewsSection
            reviews={dueReviews as DueReviewItem[]}
            onStartReview={handleStartReview}
            isLoading={isLoadingReview}
          />
        </div>
      )}

      {/* Your Homework - Active homework sessions */}
      {homeworkSessions && homeworkSessions.length > 0 && onPlayHomework && (
        <div className="relative z-10" style={{ marginBottom: "20px" }}>
          <HomeworkSection
            sessions={homeworkSessions as HomeworkSession[]}
            onPlayHomework={onPlayHomework}
          />
        </div>
      )}

      {/* Weekly Champion Progress */}
      <div className="relative z-10" style={{ marginBottom: "20px" }}>
        <WeeklyChampionCard champion={champion} onClaim={handleClaimBonus} />
      </div>

      {/* Week Info Badge - Compact */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center rounded-full mx-auto"
        style={{
          padding: "8px 16px",
          marginBottom: "16px",
          background: "rgba(99, 102, 241, 0.15)",
          color: "#a5b4fc",
          fontSize: "0.9rem",
          border: "1px solid rgba(139, 92, 246, 0.3)",
        }}
      >
        <span className="font-medium">📅 Week:</span> {weekStart} → {weekEnd}
      </motion.div>

      {/* Weak Topics Summary */}
      <div className="relative z-10" style={{ marginBottom: "20px" }}>
        {weakTopics && <WeakTopicsSummary topics={weakTopics} />}
      </div>

      {/* Practice Quests */}
      <div className="relative z-10 flex-1">
        {quests.length > 0 ? (
          <>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold flex items-center gap-4"
              style={{ fontSize: "1.35rem", marginBottom: "24px", color: "#e2e8f0", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
            >
              <span className="text-3xl">📋</span>
              Your Quests
              <span
                className="px-4 py-1.5 rounded-full"
                style={{
                  fontSize: "1rem",
                  background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.2) 100%)",
                  border: "2px solid rgba(168, 85, 247, 0.4)",
                }}
              >
                {totalCompleted}/{totalQuests}
              </span>
            </motion.h2>

            <div className="flex flex-col gap-8 pb-8">
              {quests.map((quest, index) => (
                <PracticeQuestCard
                  key={quest._id}
                  quest={quest}
                  index={index}
                  onStart={() => onStartPractice(quest._id)}
                />
              ))}
            </div>
          </>
        ) : weakTopics && weakTopics.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8"
          >
            <motion.div
              className="text-7xl mb-4"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              ⚙️
            </motion.div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#e2e8f0" }}>
              Creating Your Quests...
            </h3>
            <p className="mb-6" style={{ color: "#94a3b8" }}>
              Building personalized practice from your mistakes
            </p>
            <motion.button
              onClick={handleGenerateQuests}
              className="px-8 py-4 rounded-xl font-bold"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                color: "#fff",
                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.5)",
                border: "2px solid #a78bfa",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Generate Quests ✨
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8"
          >
            <motion.div
              className="text-7xl mb-4"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌟
            </motion.div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: "#e2e8f0" }}>
              Perfect Week!
            </h3>
            <p style={{ color: "#94a3b8", maxWidth: 280 }}>
              No mistakes found! Keep playing to discover topics that need practice.
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 mt-6 p-5 rounded-xl text-center"
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)",
          border: "2px solid rgba(139, 92, 246, 0.25)",
        }}
      >
        <span style={{ color: "#c4b5fd", fontSize: "1.05rem" }}>
          💡 <strong>Tip:</strong> Complete all quests to become Weekly Champion and earn bonus rewards!
        </span>
      </motion.div>
    </div>
  );
}
