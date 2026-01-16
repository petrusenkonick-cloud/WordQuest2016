"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
}

type LeaderboardType = "daily" | "weekly" | "monthly" | "all_time";
type AgeFilter = "all" | "6-8" | "9-11" | "12+";

export function LeaderboardScreen({
  playerId,
  onBack,
}: LeaderboardScreenProps) {
  const [type, setType] = useState<LeaderboardType>("weekly");
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("all");

  const leaderboard = useQuery(api.leaderboards.getLeaderboard, {
    type,
    ageGroup: ageFilter === "all" ? undefined : ageFilter,
    limit: 50,
  });

  const playerRank = useQuery(
    api.leaderboards.getPlayerRank,
    playerId
      ? {
          playerId,
          type,
          ageGroup: ageFilter === "all" ? undefined : ageFilter,
        }
      : "skip"
  );

  const isLoading = !leaderboard;

  const tabs: { id: LeaderboardType; label: string; icon: string }[] = [
    { id: "daily", label: "Today", icon: "📅" },
    { id: "weekly", label: "Week", icon: "📆" },
    { id: "monthly", label: "Month", icon: "🗓️" },
    { id: "all_time", label: "All Time", icon: "🏆" },
  ];

  const ageOptions: { id: AgeFilter; label: string }[] = [
    { id: "all", label: "All Ages" },
    { id: "6-8", label: "6-8 yrs" },
    { id: "9-11", label: "9-11 yrs" },
    { id: "12+", label: "12+ yrs" },
  ];

  return (
    <div
      className="screen active"
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(180deg, #0f0f23 0%, #1a1a3e 100%)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "15px",
        }}
      >
        <button
          className="btn"
          onClick={onBack}
          style={{ padding: "10px 15px", background: "rgba(0,0,0,0.3)" }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.4em" }}>🏆 Leaderboard</h1>
          <p style={{ margin: 0, color: "#AAA", fontSize: "0.85em" }}>
            Top wizards ranked by fair score
          </p>
        </div>
      </div>

      {/* Time Period Tabs */}
      <div
        style={{
          display: "flex",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "12px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setType(tab.id)}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: "10px",
              border: "none",
              background:
                type === tab.id
                  ? "linear-gradient(135deg, #8B5CF6, #EC4899)"
                  : "transparent",
              color: type === tab.id ? "#fff" : "#888",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: "0.85em",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Age Filter */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "15px",
          flexWrap: "wrap",
        }}
      >
        {ageOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setAgeFilter(option.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border:
                ageFilter === option.id
                  ? "2px solid #8B5CF6"
                  : "1px solid rgba(255,255,255,0.2)",
              background:
                ageFilter === option.id
                  ? "rgba(139, 92, 246, 0.2)"
                  : "transparent",
              color: ageFilter === option.id ? "#8B5CF6" : "#888",
              fontSize: "0.8em",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
          }}
        >
          Loading leaderboard...
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaderboard && leaderboard.entries.length >= 3 && (
            <Podium entries={leaderboard.entries.slice(0, 3)} />
          )}

          {/* Rest of the list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              marginTop: "15px",
            }}
          >
            <AnimatePresence>
              {leaderboard?.entries.slice(3).map((entry, index) => (
                <motion.div
                  key={entry.playerId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <LeaderboardRow
                    rank={entry.rank}
                    displayName={entry.displayName}
                    score={entry.normalizedScore}
                    streak={entry.streak}
                    isCurrentPlayer={
                      playerId ? entry.playerId === playerId : false
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {leaderboard?.entries.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#888",
                }}
              >
                <div style={{ fontSize: "3em", marginBottom: "15px" }}>🏜️</div>
                <div>No wizards found for this category</div>
                <div style={{ fontSize: "0.85em", marginTop: "5px" }}>
                  Be the first to join the competition!
                </div>
              </div>
            )}
          </div>

          {/* Your Position */}
          {playerRank && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background:
                  "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2))",
                borderRadius: "16px",
                padding: "15px",
                marginTop: "15px",
                border: "2px solid #8B5CF6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div
                    style={{
                      width: "45px",
                      height: "45px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "1.2em",
                    }}
                  >
                    #{playerRank.rank}
                  </div>
                  <div>
                    <div style={{ fontWeight: "bold" }}>Your Position</div>
                    <div style={{ color: "#AAA", fontSize: "0.85em" }}>
                      Top {100 - playerRank.percentile}% of{" "}
                      {playerRank.total.toLocaleString()} wizards
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "1.3em",
                      color: "#8B5CF6",
                    }}
                  >
                    {playerRank.player.normalizedScore.toLocaleString()}
                  </div>
                  <div style={{ color: "#888", fontSize: "0.8em" }}>score</div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

// Podium for top 3
function Podium({
  entries,
}: {
  entries: Array<{
    displayName: string;
    normalizedScore: number;
    rank: number;
  }>;
}) {
  // Reorder for visual: [2nd, 1st, 3rd]
  const orderedEntries = [entries[1], entries[0], entries[2]];
  const heights = ["80px", "110px", "60px"];
  const colors = [
    "linear-gradient(180deg, #C0C0C0, #A8A8A8)", // Silver
    "linear-gradient(180deg, #FFD700, #FFC700)", // Gold
    "linear-gradient(180deg, #CD7F32, #B87333)", // Bronze
  ];
  const emojis = ["🥈", "🥇", "🥉"];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: "10px",
        padding: "20px 0",
      }}
    >
      {orderedEntries.map((entry, i) => {
        if (!entry) return null;
        const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;

        return (
          <motion.div
            key={actualRank}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              maxWidth: "120px",
            }}
          >
            {/* Avatar/Emoji */}
            <div
              style={{
                fontSize: "2.5em",
                marginBottom: "8px",
              }}
            >
              {emojis[i]}
            </div>

            {/* Name */}
            <div
              style={{
                fontWeight: "bold",
                fontSize: "0.85em",
                textAlign: "center",
                marginBottom: "5px",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {entry.displayName}
            </div>

            {/* Score */}
            <div
              style={{
                color: "#AAA",
                fontSize: "0.8em",
                marginBottom: "10px",
              }}
            >
              {entry.normalizedScore.toLocaleString()}
            </div>

            {/* Podium block */}
            <div
              style={{
                width: "100%",
                height: heights[i],
                background: colors[i],
                borderRadius: "8px 8px 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "1.5em",
                color: "#333",
              }}
            >
              {actualRank}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Leaderboard row for 4th place and below
function LeaderboardRow({
  rank,
  displayName,
  score,
  streak,
  isCurrentPlayer,
}: {
  rank: number;
  displayName: string;
  score: number;
  streak: number;
  isCurrentPlayer: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 15px",
        marginBottom: "8px",
        background: isCurrentPlayer
          ? "rgba(139, 92, 246, 0.2)"
          : "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        border: isCurrentPlayer
          ? "2px solid #8B5CF6"
          : "1px solid transparent",
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: "35px",
          height: "35px",
          borderRadius: "8px",
          background: isCurrentPlayer
            ? "linear-gradient(135deg, #8B5CF6, #EC4899)"
            : "rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          marginRight: "12px",
        }}
      >
        {rank}
      </div>

      {/* Name */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: isCurrentPlayer ? "bold" : "normal",
            color: isCurrentPlayer ? "#fff" : "#ccc",
          }}
        >
          {displayName}
          {isCurrentPlayer && (
            <span style={{ color: "#8B5CF6", marginLeft: "5px" }}>(You)</span>
          )}
        </div>
        {streak > 0 && (
          <div style={{ color: "#888", fontSize: "0.75em" }}>
            🔥 {streak} day streak
          </div>
        )}
      </div>

      {/* Score */}
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontWeight: "bold",
            color: isCurrentPlayer ? "#8B5CF6" : "#fff",
          }}
        >
          {score.toLocaleString()}
        </div>
        <div style={{ color: "#888", fontSize: "0.7em" }}>score</div>
      </div>
    </div>
  );
}
