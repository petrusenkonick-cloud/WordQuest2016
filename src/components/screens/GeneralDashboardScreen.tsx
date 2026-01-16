"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";

interface GeneralDashboardScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
  onViewLeaderboard: () => void;
}

type ViewMode = "personal" | "platform";

export function GeneralDashboardScreen({
  playerId,
  onBack,
  onViewLeaderboard,
}: GeneralDashboardScreenProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("personal");

  const platformStats = useQuery(api.dashboard.getPlatformStats);
  const playerComparison = useQuery(
    api.dashboard.getPlayerComparison,
    playerId ? { playerId } : "skip"
  );
  const weeklyTrends = useQuery(
    api.dashboard.getWeeklyTrends,
    playerId ? { playerId } : "skip"
  );
  const ageGroupStats = useQuery(api.dashboard.getAgeGroupStats);

  const isLoading = !platformStats || !weeklyTrends;

  return (
    <div
      className="screen active"
      style={{
        padding: "20px",
        overflowY: "auto",
        background: "linear-gradient(180deg, #0f0f23 0%, #1a1a3e 100%)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <button
          className="btn"
          onClick={onBack}
          style={{ padding: "10px 15px", background: "rgba(0,0,0,0.3)" }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.4em" }}>📊 Dashboard</h1>
          <p style={{ margin: 0, color: "#AAA", fontSize: "0.85em" }}>
            Track your progress
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div
        style={{
          display: "flex",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setViewMode("personal")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            background:
              viewMode === "personal"
                ? "linear-gradient(135deg, #8B5CF6, #EC4899)"
                : "transparent",
            color: viewMode === "personal" ? "#fff" : "#888",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          📈 My Stats
        </button>
        <button
          onClick={() => setViewMode("platform")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            background:
              viewMode === "platform"
                ? "linear-gradient(135deg, #8B5CF6, #EC4899)"
                : "transparent",
            color: viewMode === "platform" ? "#fff" : "#888",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          🌍 All Wizards
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
          Loading...
        </div>
      ) : viewMode === "personal" ? (
        <PersonalDashboard
          playerComparison={playerComparison}
          weeklyTrends={weeklyTrends}
          onViewLeaderboard={onViewLeaderboard}
        />
      ) : (
        <PlatformDashboard
          platformStats={platformStats}
          ageGroupStats={ageGroupStats || []}
        />
      )}
    </div>
  );
}

// Types for dashboard data
interface PlayerComparisonData {
  player: {
    id: string;
    name: string;
    displayName: string;
    normalizedScore: number;
    streak: number;
    wordsLearned: number;
    ageGroup: string;
  };
  peerStats: {
    totalPeers: number;
    avgScore: number;
    avgStreak: number;
    avgWordsLearned: number;
  };
  comparison: {
    isAboveAverage: boolean;
    percentile: number;
    scoreDiff: number;
  };
}

interface WeeklyTrendsData {
  days: Array<{
    date: string;
    day: string;
    questionsAnswered: number;
    correctAnswers: number;
    xpEarned: number;
    timeSpentMinutes: number;
  }>;
  totals: {
    totalQuestions: number;
    totalCorrect: number;
    totalXp: number;
    totalTime: number;
    activeDays: number;
  };
  accuracy: number;
}

// Personal Dashboard View
function PersonalDashboard({
  playerComparison,
  weeklyTrends,
  onViewLeaderboard,
}: {
  playerComparison: PlayerComparisonData | null | undefined;
  weeklyTrends: WeeklyTrendsData | null | undefined;
  onViewLeaderboard: () => void;
}) {
  if (!weeklyTrends) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Percentile Card */}
      {playerComparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2))",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          }}
        >
          <div style={{ fontSize: "3em", marginBottom: "10px" }}>
            {playerComparison.comparison.percentile >= 90
              ? "🏆"
              : playerComparison.comparison.percentile >= 75
                ? "🥈"
                : playerComparison.comparison.percentile >= 50
                  ? "🥉"
                  : "⭐"}
          </div>
          <div style={{ fontSize: "2.5em", fontWeight: "bold", color: "#8B5CF6" }}>
            Top {100 - playerComparison.comparison.percentile}%
          </div>
          <div style={{ color: "#AAA", marginTop: "5px" }}>
            among {playerComparison.player.ageGroup} year olds
          </div>
          <button
            onClick={onViewLeaderboard}
            style={{
              marginTop: "15px",
              padding: "10px 25px",
              background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
              border: "none",
              borderRadius: "20px",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            View Leaderboard →
          </button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}
      >
        <StatCard
          icon="📝"
          label="Questions"
          value={weeklyTrends.totals.totalQuestions}
          subtext="this week"
          color="#3B82F6"
        />
        <StatCard
          icon="✅"
          label="Accuracy"
          value={`${weeklyTrends.accuracy}%`}
          subtext={
            weeklyTrends.accuracy >= 80
              ? "Great job!"
              : weeklyTrends.accuracy >= 60
                ? "Keep practicing!"
                : "You can do it!"
          }
          color={
            weeklyTrends.accuracy >= 80
              ? "#22C55E"
              : weeklyTrends.accuracy >= 60
                ? "#F59E0B"
                : "#EF4444"
          }
        />
        <StatCard
          icon="⭐"
          label="XP Earned"
          value={weeklyTrends.totals.totalXp}
          subtext="this week"
          color="#FBBF24"
        />
        <StatCard
          icon="📅"
          label="Active Days"
          value={`${weeklyTrends.totals.activeDays}/7`}
          subtext={
            weeklyTrends.totals.activeDays >= 5
              ? "Amazing streak!"
              : "Keep it up!"
          }
          color="#8B5CF6"
        />
      </div>

      {/* Weekly Activity Chart */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: "16px",
          padding: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", fontSize: "1.1em" }}>
          📅 Weekly Activity
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            height: "120px",
            gap: "8px",
          }}
        >
          {weeklyTrends.days.map((day, i) => {
            const maxQuestions = Math.max(
              ...weeklyTrends.days.map((d) => d.questionsAnswered),
              1
            );
            const height = (day.questionsAnswered / maxQuestions) * 100;
            const correctHeight =
              day.questionsAnswered > 0
                ? (day.correctAnswers / day.questionsAnswered) * height
                : 0;

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    position: "relative",
                  }}
                >
                  {/* Total questions bar */}
                  <div
                    style={{
                      width: "100%",
                      height: `${height}%`,
                      background: "rgba(59, 130, 246, 0.3)",
                      borderRadius: "4px 4px 0 0",
                      position: "relative",
                    }}
                  >
                    {/* Correct answers overlay */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        width: "100%",
                        height: `${day.questionsAnswered > 0 ? (correctHeight / height) * 100 : 0}%`,
                        background: "#22C55E",
                        borderRadius: "4px 4px 0 0",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "0.75em",
                    color: "#888",
                  }}
                >
                  {day.day}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginTop: "15px",
            fontSize: "0.8em",
          }}
        >
          <span>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                background: "rgba(59, 130, 246, 0.3)",
                borderRadius: "2px",
                marginRight: "5px",
              }}
            />
            Questions
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                background: "#22C55E",
                borderRadius: "2px",
                marginRight: "5px",
              }}
            />
            Correct
          </span>
        </div>
      </div>

      {/* Comparison with Peers */}
      {playerComparison && (
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", fontSize: "1.1em" }}>
            👥 vs Other {playerComparison.player.ageGroup} Year Olds
          </h3>
          <ComparisonBar
            label="Score"
            yourValue={playerComparison.player.normalizedScore}
            avgValue={playerComparison.peerStats.avgScore}
          />
          <ComparisonBar
            label="Streak"
            yourValue={playerComparison.player.streak}
            avgValue={playerComparison.peerStats.avgStreak}
          />
          <ComparisonBar
            label="Words"
            yourValue={playerComparison.player.wordsLearned}
            avgValue={playerComparison.peerStats.avgWordsLearned}
          />
        </div>
      )}
    </div>
  );
}

// Platform Stats type
interface PlatformStatsData {
  totalPlayers: number;
  activePlayers: number;
  totalQuestionsAnswered: number;
  totalWordsLearned: number;
  averageAccuracy: number;
}

// Platform Dashboard View
function PlatformDashboard({
  platformStats,
  ageGroupStats,
}: {
  platformStats: PlatformStatsData | null | undefined;
  ageGroupStats: Array<{
    ageGroup: string;
    label: string;
    playerCount: number;
    avgScore: number;
    avgStreak: number;
    topScore: number;
  }>;
}) {
  if (!platformStats) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Platform Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}
      >
        <StatCard
          icon="👥"
          label="Total Wizards"
          value={platformStats.totalPlayers}
          subtext="joined"
          color="#8B5CF6"
        />
        <StatCard
          icon="🔥"
          label="Active This Week"
          value={platformStats.activePlayers}
          subtext="wizards"
          color="#EF4444"
        />
        <StatCard
          icon="📚"
          label="Words Learned"
          value={platformStats.totalWordsLearned}
          subtext="total"
          color="#22C55E"
        />
        <StatCard
          icon="📝"
          label="Questions"
          value={platformStats.totalQuestionsAnswered}
          subtext="answered"
          color="#3B82F6"
        />
      </div>

      {/* Age Group Comparison */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: "16px",
          padding: "20px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", fontSize: "1.1em" }}>
          📊 Stats by Age Group
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {ageGroupStats.map((group) => (
            <div
              key={group.ageGroup}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                padding: "12px 15px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "10px",
                  background:
                    group.ageGroup === "6-8"
                      ? "linear-gradient(135deg, #F472B6, #EC4899)"
                      : group.ageGroup === "9-11"
                        ? "linear-gradient(135deg, #60A5FA, #3B82F6)"
                        : "linear-gradient(135deg, #34D399, #10B981)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {group.label.split(" ")[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>{group.label}</div>
                <div style={{ color: "#888", fontSize: "0.85em" }}>
                  {group.playerCount} wizards
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "bold", color: "#8B5CF6" }}>
                  {group.avgScore}
                </div>
                <div style={{ color: "#888", fontSize: "0.75em" }}>avg score</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fun Fact */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1))",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid rgba(251, 191, 36, 0.3)",
        }}
      >
        <div style={{ fontSize: "1.5em", marginBottom: "8px" }}>💡</div>
        <div style={{ color: "#FCD34D", fontWeight: "bold" }}>Did you know?</div>
        <div style={{ color: "#AAA", marginTop: "5px", fontSize: "0.9em" }}>
          Our wizards have learned {platformStats.totalWordsLearned.toLocaleString()} words together!
          That&apos;s enough to fill {Math.round(platformStats.totalWordsLearned / 500)} spell books!
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: string;
  label: string;
  value: number | string;
  subtext: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        padding: "15px",
        border: `1px solid ${color}20`,
      }}
    >
      <div style={{ fontSize: "1.5em", marginBottom: "8px" }}>{icon}</div>
      <div style={{ color, fontSize: "1.5em", fontWeight: "bold" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div style={{ color: "#888", fontSize: "0.8em" }}>
        {label}
        <br />
        <span style={{ fontSize: "0.9em" }}>{subtext}</span>
      </div>
    </motion.div>
  );
}

function ComparisonBar({
  label,
  yourValue,
  avgValue,
}: {
  label: string;
  yourValue: number;
  avgValue: number;
}) {
  const maxValue = Math.max(yourValue, avgValue, 1);
  const yourPercent = (yourValue / maxValue) * 100;
  const avgPercent = (avgValue / maxValue) * 100;
  const isAboveAvg = yourValue > avgValue;

  return (
    <div style={{ marginBottom: "15px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.85em",
          marginBottom: "5px",
        }}
      >
        <span style={{ color: "#888" }}>{label}</span>
        <span style={{ color: isAboveAvg ? "#22C55E" : "#888" }}>
          You: {yourValue} | Avg: {Math.round(avgValue)}
        </span>
      </div>
      <div
        style={{
          height: "8px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "4px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Average marker */}
        <div
          style={{
            position: "absolute",
            left: `${avgPercent}%`,
            top: 0,
            bottom: 0,
            width: "2px",
            background: "#888",
          }}
        />
        {/* Your value bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${yourPercent}%` }}
          transition={{ duration: 0.5 }}
          style={{
            height: "100%",
            background: isAboveAvg
              ? "linear-gradient(90deg, #22C55E, #16A34A)"
              : "linear-gradient(90deg, #F59E0B, #D97706)",
            borderRadius: "4px",
          }}
        />
      </div>
    </div>
  );
}
