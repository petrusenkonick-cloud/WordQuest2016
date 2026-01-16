"use client";

import { useAppStore } from "@/lib/store";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useEffect } from "react";
import { AudioControls } from "../ui/AudioControls";
import { motion } from "framer-motion";

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
}

interface HomeScreenProps {
  playerId: Id<"players"> | null;
  completedLevels: Record<string, { stars: number; done: boolean }>;
  onStartLevel: (levelId: string) => void;
  onScanHomework?: () => void;
  onPracticeMode?: () => void;
  onQuestMap?: () => void;
  onSpellBook?: () => void;
  onParentSettings?: () => void;
  onDashboard?: () => void;
  onLeaderboard?: () => void;
  onLogout?: () => void;
  weakTopicsCount?: number;
  onPlayHomework?: (homework: HomeworkSession) => void;
}

export function HomeScreen({
  playerId,
  completedLevels,
  onStartLevel,
  onScanHomework,
  onPracticeMode,
  onQuestMap,
  onSpellBook,
  onParentSettings,
  onDashboard,
  onLeaderboard,
  onLogout,
  weakTopicsCount = 0,
  onPlayHomework,
}: HomeScreenProps) {
  const player = useAppStore((state) => state.player);
  const showDailyReward = useAppStore((state) => state.showDailyRewardModal);
  const { isSignedIn } = useAuth();

  // Active homework sessions
  const homeworkSessions = useQuery(
    api.homework.getActiveHomeworkSessions,
    playerId ? { playerId } : { guestId: undefined }
  );

  // Wizard academy data
  const wizardProfile = useQuery(
    api.quests.getWizardProfile,
    playerId ? { playerId } : "skip"
  );

  const dailyQuests = useQuery(
    api.quests.getDailyQuests,
    playerId ? { playerId } : "skip"
  );

  const spellBookStats = useQuery(
    api.quests.getSpellBookStats,
    playerId ? { playerId } : "skip"
  );

  // Initialize wizard profile and daily quests
  const initWizard = useMutation(api.quests.initializeWizardProfile);
  const generateDailyQuests = useMutation(api.quests.generateDailyQuests);

  useEffect(() => {
    if (playerId) {
      // Initialize wizard if needed
      if (wizardProfile === null) {
        initWizard({ playerId });
      }
      // Generate daily quests if needed
      if (dailyQuests && dailyQuests.length === 0) {
        generateDailyQuests({ playerId });
      }
    }
  }, [playerId, wizardProfile, dailyQuests, initWizard, generateDailyQuests]);

  // Calculate daily quest progress
  const completedDailyQuests = dailyQuests?.filter(q => q.isCompleted).length || 0;
  const totalDailyQuests = dailyQuests?.length || 4;

  // Get active and completed homework counts
  const activeHomeworkCount = homeworkSessions?.length || 0;

  // Fetch completed homework
  const completedHomework = useQuery(
    api.homework.getCompletedHomeworkSessions,
    playerId ? { playerId, limit: 10 } : "skip"
  );
  const completedHomeworkCount = completedHomework?.length || 0;

  // Fetch weak topics for Practice Arena
  const weakTopics = useQuery(
    api.errors.getWeakTopics,
    playerId ? { playerId } : "skip"
  );
  const currentWeakTopicsCount = weakTopics?.length || weakTopicsCount || 0;

  return (
    <div className="screen active" style={{ padding: "16px", overflowY: "auto" }}>
      {/* Player Header with Auth */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5em",
            border: "2px solid #a5b4fc",
          }}>
            🧙
          </div>
          <div>
            <div style={{ fontWeight: "bold", color: "white", fontSize: "1.1em" }}>
              Hi, {player.name}!
            </div>
            <div style={{ fontSize: "0.8em", color: "#a5b4fc" }}>
              {wizardProfile?.wizardTitle || "Apprentice"} • Lvl {wizardProfile?.academyLevel || 1}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AudioControls compact />
          {isSignedIn ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { avatarBox: { width: "36px", height: "36px" } },
              }}
            />
          ) : (
            <div
              onClick={onLogout}
              style={{
                padding: "6px 12px",
                background: "rgba(239, 68, 68, 0.2)",
                borderRadius: "8px",
                fontSize: "0.8em",
                color: "#fca5a5",
                cursor: "pointer",
                border: "1px solid #ef444440",
              }}
            >
              Guest ↪
            </div>
          )}
        </div>
      </div>

      {/* Currency Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        background: "rgba(0,0,0,0.3)",
        borderRadius: "12px",
        padding: "10px",
        marginBottom: "16px",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.2em" }}>💎</div>
          <div style={{ color: "#22d3ee", fontWeight: "bold" }}>{player.diamonds}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.2em" }}>🟢</div>
          <div style={{ color: "#22c55e", fontWeight: "bold" }}>{player.emeralds}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.2em" }}>🔥</div>
          <div style={{ color: "#f59e0b", fontWeight: "bold" }}>{player.streak} day</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.2em" }}>⭐</div>
          <div style={{ color: "#fbbf24", fontWeight: "bold" }}>{player.totalStars}</div>
        </div>
      </div>

      {/* ========== MAIN SECTION 1: HOMEWORK ADVENTURES ========== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onQuestMap}
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(30, 27, 75, 0.9) 100%)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "12px",
          border: "2px solid #6366f1",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "12px" }}>
          <motion.div
            style={{ fontSize: "2.5em" }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🗺️
          </motion.div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.1em", color: "white" }}>HOMEWORK ADVENTURES</h2>
            <p style={{ margin: "4px 0 0", color: "#a5b4fc", fontSize: "0.85em" }}>
              Turn homework into exciting quests!
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "15px", marginBottom: "12px" }}>
          <div style={{
            flex: 1,
            background: "rgba(0,0,0,0.3)",
            borderRadius: "10px",
            padding: "10px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "#818cf8" }}>{activeHomeworkCount}</div>
            <div style={{ fontSize: "0.75em", color: "#a5b4fc" }}>Active Quests</div>
          </div>
          <div style={{
            flex: 1,
            background: "rgba(0,0,0,0.3)",
            borderRadius: "10px",
            padding: "10px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "1.5em", fontWeight: "bold", color: "#22c55e" }}>{completedHomeworkCount}</div>
            <div style={{ fontSize: "0.75em", color: "#a5b4fc" }}>Completed</div>
          </div>
        </div>
        <div style={{
          background: "#6366f1",
          color: "white",
          borderRadius: "10px",
          padding: "10px",
          textAlign: "center",
          fontWeight: "bold",
        }}>
          OPEN MAP →
        </div>
      </motion.div>

      {/* ========== MAIN SECTION 2: PRACTICE ARENA ========== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={onPracticeMode}
        style={{
          background: currentWeakTopicsCount > 0
            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(30, 27, 75, 0.9) 100%)"
            : "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(30, 27, 75, 0.9) 100%)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "12px",
          border: `2px solid ${currentWeakTopicsCount > 0 ? "#f59e0b" : "#22c55e"}`,
          cursor: "pointer",
          boxShadow: currentWeakTopicsCount > 0
            ? "0 4px 20px rgba(245, 158, 11, 0.3)"
            : "0 4px 20px rgba(34, 197, 94, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "12px" }}>
          <motion.div
            style={{ fontSize: "2.5em" }}
            animate={currentWeakTopicsCount > 0 ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.5, repeat: currentWeakTopicsCount > 0 ? Infinity : 0, repeatDelay: 2 }}
          >
            ⚔️
          </motion.div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.1em", color: "white" }}>PRACTICE ARENA</h2>
            <p style={{ margin: "4px 0 0", color: currentWeakTopicsCount > 0 ? "#fcd34d" : "#86efac", fontSize: "0.85em" }}>
              {currentWeakTopicsCount > 0
                ? `${currentWeakTopicsCount} topics need practice based on YOUR mistakes!`
                : "All topics mastered! Keep it up!"}
            </p>
          </div>
          {currentWeakTopicsCount > 0 && (
            <div style={{
              background: "#f59e0b",
              color: "#000",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "1.1em",
            }}>
              {currentWeakTopicsCount}
            </div>
          )}
        </div>
        <div style={{
          background: currentWeakTopicsCount > 0 ? "#f59e0b" : "#22c55e",
          color: "#000",
          borderRadius: "10px",
          padding: "10px",
          textAlign: "center",
          fontWeight: "bold",
        }}>
          {currentWeakTopicsCount > 0 ? "TRAIN NOW →" : "VIEW PROGRESS →"}
        </div>
      </motion.div>

      {/* ========== SCAN HOMEWORK BUTTON ========== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={onScanHomework}
        style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "15px",
          boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
        }}
      >
        <motion.div
          style={{ fontSize: "2.5em" }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          📸
        </motion.div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: "1.1em", color: "white" }}>SCAN NEW HOMEWORK</h2>
          <p style={{ margin: "4px 0 0", color: "#c4b5fd", fontSize: "0.85em" }}>
            AI turns your homework into a game!
          </p>
        </div>
        <div style={{ color: "white", fontSize: "1.5em" }}>→</div>
      </motion.div>

      {/* Daily Reward Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={showDailyReward}
        style={{
          background: "linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(30, 27, 75, 0.9) 100%)",
          borderRadius: "12px",
          padding: "12px 16px",
          marginBottom: "16px",
          border: "2px solid #eab308",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <motion.span
            style={{ fontSize: "1.8em" }}
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            🎁
          </motion.span>
          <div>
            <div style={{ fontWeight: "bold", color: "white", fontSize: "0.95em" }}>DAILY REWARD!</div>
            <div style={{ color: "#fcd34d", fontSize: "0.8em" }}>Claim free rewards</div>
          </div>
        </div>
        <div style={{
          background: "#eab308",
          color: "#000",
          borderRadius: "8px",
          padding: "6px 12px",
          fontWeight: "bold",
          fontSize: "0.85em",
        }}>
          CLAIM
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px",
        marginBottom: "16px",
      }}>
        {/* Spell Book */}
        <div
          onClick={onSpellBook}
          style={{
            background: "rgba(168, 85, 247, 0.2)",
            borderRadius: "12px",
            padding: "12px 8px",
            cursor: "pointer",
            border: "1px solid #a855f740",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5em", marginBottom: "4px" }}>📖</div>
          <div style={{ fontSize: "0.7em", color: "#c4b5fd" }}>Spells</div>
        </div>

        {/* Dashboard */}
        <div
          onClick={onDashboard}
          style={{
            background: "rgba(59, 130, 246, 0.2)",
            borderRadius: "12px",
            padding: "12px 8px",
            cursor: "pointer",
            border: "1px solid #3b82f640",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5em", marginBottom: "4px" }}>📊</div>
          <div style={{ fontSize: "0.7em", color: "#93c5fd" }}>Stats</div>
        </div>

        {/* Leaderboard */}
        <div
          onClick={onLeaderboard}
          style={{
            background: "rgba(234, 179, 8, 0.2)",
            borderRadius: "12px",
            padding: "12px 8px",
            cursor: "pointer",
            border: "1px solid #eab30840",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5em", marginBottom: "4px" }}>🏆</div>
          <div style={{ fontSize: "0.7em", color: "#fde047" }}>Rank</div>
        </div>

        {/* Parent Settings */}
        <div
          onClick={onParentSettings}
          style={{
            background: "rgba(239, 68, 68, 0.2)",
            borderRadius: "12px",
            padding: "12px 8px",
            cursor: "pointer",
            border: "1px solid #ef444440",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5em", marginBottom: "4px" }}>👨‍👩‍👧</div>
          <div style={{ fontSize: "0.7em", color: "#fca5a5" }}>Parents</div>
        </div>
      </div>

      {/* Daily Quests Progress */}
      {dailyQuests && dailyQuests.length > 0 && (
        <div style={{
          background: "rgba(139, 92, 246, 0.1)",
          borderRadius: "12px",
          padding: "12px 15px",
          marginBottom: "16px",
          border: "1px solid #8b5cf620",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ color: "#c4b5fd", fontWeight: "bold", fontSize: "0.85em" }}>
              📋 Daily Quests
            </span>
            <span style={{ color: "#8b5cf6", fontSize: "0.8em" }}>
              {completedDailyQuests}/{totalDailyQuests} done
            </span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {dailyQuests.map((quest, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "6px",
                  borderRadius: "3px",
                  background: quest.isCompleted ? "#8b5cf6" : "rgba(0,0,0,0.4)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tip at bottom */}
      <div style={{
        background: "rgba(139, 92, 246, 0.1)",
        borderRadius: "10px",
        padding: "12px",
        textAlign: "center",
        border: "1px solid rgba(139, 92, 246, 0.2)",
      }}>
        <span style={{ color: "#a5b4fc", fontSize: "0.85em" }}>
          💡 Scan your homework to turn it into a fun adventure!
        </span>
      </div>
    </div>
  );
}
