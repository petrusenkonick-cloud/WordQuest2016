"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface AnalyticsDashboardProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
}

type TimeRange = "today" | "week" | "month";

export function AnalyticsDashboard({ playerId, onBack }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const topicProgress = useQuery(
    api.learning.getTopicProgress,
    playerId ? { playerId } : "skip"
  );

  const weakTopics = useQuery(
    api.learning.getWeakTopics,
    playerId ? { playerId } : "skip"
  );

  const weeklyStats = useQuery(
    api.parents.getWeeklyStats,
    playerId ? { playerId } : "skip"
  );

  // Calculate overall stats
  const calculateStats = () => {
    if (!weeklyStats || weeklyStats.length === 0) {
      return {
        totalQuestions: 0,
        totalCorrect: 0,
        accuracy: 0,
        totalXP: 0,
        totalTime: 0,
        daysActive: 0,
        streak: 0,
      };
    }

    const totalQuestions = weeklyStats.reduce((a, b) => a + b.questionsAnswered, 0);
    const totalCorrect = weeklyStats.reduce((a, b) => a + b.correctAnswers, 0);
    const totalXP = weeklyStats.reduce((a, b) => a + b.xpEarned, 0);
    const totalTime = weeklyStats.reduce((a, b) => a + b.timeSpentMinutes, 0);

    return {
      totalQuestions,
      totalCorrect,
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      totalXP,
      totalTime,
      daysActive: weeklyStats.length,
      streak: weeklyStats.length, // Simplified
    };
  };

  const stats = calculateStats();

  // Get accuracy color
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "#22c55e";
    if (accuracy >= 60) return "#f59e0b";
    return "#ef4444";
  };

  // Generate bar chart data
  const getBarChartData = () => {
    if (!weeklyStats) return [];

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayStats = weeklyStats.find((s) => s.date === dateStr);

      last7Days.push({
        day: date.toLocaleDateString("en", { weekday: "short" }),
        questions: dayStats?.questionsAnswered || 0,
        correct: dayStats?.correctAnswers || 0,
      });
    }

    return last7Days;
  };

  const chartData = getBarChartData();
  const maxQuestions = Math.max(...chartData.map((d) => d.questions), 10);

  return (
    <div className="screen active" style={{ padding: "20px", overflowY: "auto" }}>
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
          <h1 style={{ margin: 0, fontSize: "1.5em" }}>📊 ANALYTICS</h1>
          <p style={{ margin: 0, color: "#AAA", fontSize: "0.9em" }}>
            Track your learning progress
          </p>
        </div>
      </div>

      {/* Time Range Selector */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {(["today", "week", "month"] as TimeRange[]).map((range) => (
          <button
            key={range}
            className="btn"
            onClick={() => setTimeRange(range)}
            style={{
              flex: 1,
              padding: "10px",
              background: timeRange === range ? "#3b82f6" : "rgba(0,0,0,0.3)",
              border: `2px solid ${timeRange === range ? "#3b82f6" : "#555"}`,
              textTransform: "capitalize",
            }}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "15px",
        marginBottom: "25px",
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)",
          borderRadius: "12px",
          padding: "15px",
          border: "2px solid #22c55e40",
        }}>
          <div style={{ color: "#888", fontSize: "0.8em" }}>ACCURACY</div>
          <div style={{ fontSize: "2em", fontWeight: "bold", color: getAccuracyColor(stats.accuracy) }}>
            {stats.accuracy}%
          </div>
          <div style={{ color: "#888", fontSize: "0.8em" }}>
            {stats.totalCorrect}/{stats.totalQuestions} correct
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)",
          borderRadius: "12px",
          padding: "15px",
          border: "2px solid #3b82f640",
        }}>
          <div style={{ color: "#888", fontSize: "0.8em" }}>XP EARNED</div>
          <div style={{ fontSize: "2em", fontWeight: "bold", color: "#60a5fa" }}>
            {stats.totalXP}
          </div>
          <div style={{ color: "#888", fontSize: "0.8em" }}>This {timeRange}</div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)",
          borderRadius: "12px",
          padding: "15px",
          border: "2px solid #f59e0b40",
        }}>
          <div style={{ color: "#888", fontSize: "0.8em" }}>TIME SPENT</div>
          <div style={{ fontSize: "2em", fontWeight: "bold", color: "#fcd34d" }}>
            {stats.totalTime}m
          </div>
          <div style={{ color: "#888", fontSize: "0.8em" }}>Learning time</div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(126, 34, 206, 0.2) 100%)",
          borderRadius: "12px",
          padding: "15px",
          border: "2px solid #9333ea40",
        }}>
          <div style={{ color: "#888", fontSize: "0.8em" }}>ACTIVE DAYS</div>
          <div style={{ fontSize: "2em", fontWeight: "bold", color: "#c084fc" }}>
            {stats.daysActive}/7
          </div>
          <div style={{ color: "#888", fontSize: "0.8em" }}>Days this week</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        borderRadius: "15px",
        padding: "20px",
        marginBottom: "25px",
      }}>
        <h3 style={{ margin: "0 0 15px 0", fontSize: "1em", color: "#AAA" }}>
          📈 Weekly Activity
        </h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
          {chartData.map((data, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: "100%",
                background: "rgba(59, 130, 246, 0.3)",
                borderRadius: "5px 5px 0 0",
                height: `${(data.questions / maxQuestions) * 100}px`,
                minHeight: data.questions > 0 ? "10px" : "0",
                position: "relative",
              }}>
                {data.correct > 0 && (
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    background: "#22c55e",
                    borderRadius: "5px 5px 0 0",
                    height: `${(data.correct / maxQuestions) * 100}px`,
                  }} />
                )}
              </div>
              <div style={{ fontSize: "0.7em", color: "#888", marginTop: "5px" }}>
                {data.day}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "15px", marginTop: "10px", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8em", color: "#888" }}>
            <div style={{ width: "12px", height: "12px", background: "rgba(59, 130, 246, 0.3)", borderRadius: "2px" }} />
            Questions
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8em", color: "#888" }}>
            <div style={{ width: "12px", height: "12px", background: "#22c55e", borderRadius: "2px" }} />
            Correct
          </div>
        </div>
      </div>

      {/* Topic Progress */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        borderRadius: "15px",
        padding: "20px",
        marginBottom: "25px",
      }}>
        <h3 style={{ margin: "0 0 15px 0", fontSize: "1em", color: "#AAA" }}>
          📚 Topic Progress
        </h3>
        {(!topicProgress || topicProgress.length === 0) ? (
          <p style={{ color: "#666", textAlign: "center" }}>
            No topic data yet. Complete some homework to see progress!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {topicProgress.slice(0, 5).map((topic) => (
              <div key={topic._id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ color: "#CCC", textTransform: "capitalize" }}>
                    {topic.topic.replace(/_/g, " ")}
                  </span>
                  <span style={{ color: getAccuracyColor(topic.accuracy) }}>
                    {topic.accuracy}%
                  </span>
                </div>
                <div style={{
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weak Topics Alert */}
      {weakTopics && weakTopics.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)",
          borderRadius: "15px",
          padding: "20px",
          border: "2px solid #ef444440",
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#fca5a5" }}>
            ⚠️ Topics Needing Practice
          </h3>
          <p style={{ color: "#AAA", marginBottom: "15px", fontSize: "0.9em" }}>
            These topics have accuracy below 60%
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {weakTopics.map((topic) => (
              <div
                key={topic._id}
                style={{
                  background: "rgba(239, 68, 68, 0.3)",
                  padding: "5px 12px",
                  borderRadius: "15px",
                  color: "#fca5a5",
                  fontSize: "0.9em",
                  textTransform: "capitalize",
                }}
              >
                {topic.topic.replace(/_/g, " ")} ({topic.accuracy}%)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
