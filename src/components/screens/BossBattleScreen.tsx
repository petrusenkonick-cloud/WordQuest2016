"use client";

import { useState, useEffect, useCallback } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { BossBattle, QuizQuestion, getIslandByChapter } from "@/data/lifeSkillsQuestions";
import { NPCS, BOSS_DIALOGUES, getRandomMessage } from "@/data/npcDialogues";

interface BossBattleScreenProps {
  playerId: Id<"players"> | null;
  boss: BossBattle;
  chapterId: string;
  onVictory: (result: { diamonds: number; emeralds: number; xp: number }) => void;
  onDefeat: () => void;
  onBack: () => void;
}

type BattlePhase = "intro" | "battle" | "victory" | "defeat";

// Safe emoji mapping - using Unicode characters directly
const BOSS_EMOJI_MAP: Record<string, string> = {
  dragon: "\u{1F409}",
  cloud_with_lightning: "\u26C8\uFE0F",
  space_invader: "\u{1F47E}",
  moneybag: "\u{1F4B0}",
};

const NPC_EMOJI_MAP: Record<string, string> = {
  owl: "\u{1F989}",
  fox: "\u{1F98A}",
  robot: "\u{1F916}",
  pirate_flag: "\u{1F3F4}",
};

export function BossBattleScreen({
  playerId,
  boss,
  chapterId,
  onVictory,
  onDefeat,
  onBack,
}: BossBattleScreenProps) {
  const island = getIslandByChapter(chapterId);
  const npc = island ? NPCS[island.npcId] : null;
  const bossDialogue = BOSS_DIALOGUES[boss.id.replace("boss_", "")] || BOSS_DIALOGUES.rumor_dragon;

  const [phase, setPhase] = useState<BattlePhase>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [bossHealth, setBossHealth] = useState(boss.health);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [bossMessage, setBossMessage] = useState("");
  const [npcMessage, setNpcMessage] = useState("");
  const [shakeScreen, setShakeScreen] = useState(false);
  const [bossShake, setBossShake] = useState(false);
  const [introStep, setIntroStep] = useState(0);

  const currentQuestion = boss.questions[currentQuestionIndex];
  const damagePerHit = Math.ceil(boss.health / boss.questions.length);
  const damageFromBoss = 25;

  // Get boss emoji safely
  const getBossEmoji = (bossEmoji: string): string => {
    return BOSS_EMOJI_MAP[bossEmoji] || BOSS_EMOJI_MAP.dragon;
  };

  // Get NPC emoji safely
  const getNpcEmoji = (emoji: string): string => {
    return NPC_EMOJI_MAP[emoji] || "\u{1F9D9}";
  };

  // Handle answer selection
  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correct;
    setFeedbackCorrect(isCorrect);

    if (isCorrect) {
      // Hit boss
      const newBossHealth = Math.max(0, bossHealth - damagePerHit);
      setBossHealth(newBossHealth);
      setBossShake(true);
      setTimeout(() => setBossShake(false), 500);

      if (newBossHealth <= 30 && newBossHealth > 0) {
        setBossMessage(bossDialogue.lowHealth);
      } else {
        setBossMessage(bossDialogue.hit);
      }
      setNpcMessage(getRandomMessage(npc?.correctResponses || ["Great hit!"]));
    } else {
      // Boss attacks player
      const newPlayerHealth = Math.max(0, playerHealth - damageFromBoss);
      setPlayerHealth(newPlayerHealth);
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);

      setBossMessage(bossDialogue.miss);
      setNpcMessage(getRandomMessage(npc?.wrongResponses || ["Oh no!"]));
    }

    setShowFeedback(true);
  };

  // Move to next question or end battle
  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);

    // Check win condition
    if (bossHealth <= 0) {
      setBossMessage(bossDialogue.victory);
      setPhase("victory");
      return;
    }

    // Check lose condition
    if (playerHealth <= 0) {
      setBossMessage(bossDialogue.defeat);
      setPhase("defeat");
      return;
    }

    // Next question
    if (currentQuestionIndex < boss.questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setBossMessage(bossDialogue.taunt);
    } else {
      // Out of questions but boss not dead - victory anyway
      if (bossHealth > 0 && bossHealth < boss.health) {
        setBossMessage(bossDialogue.victory);
        setPhase("victory");
      } else {
        setBossMessage(bossDialogue.defeat);
        setPhase("defeat");
      }
    }
  };

  // Intro animation
  useEffect(() => {
    if (phase === "intro") {
      const timer = setTimeout(() => {
        if (introStep < 2) {
          setIntroStep(s => s + 1);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, introStep]);

  // Intro Phase
  if (phase === "intro") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 50%, #7f1d1d 100%)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}>
        {/* Step 0: NPC Warning */}
        {introStep === 0 && (
          <div style={{
            animation: "fadeIn 0.5s ease",
          }}>
            <div style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${npc?.gradientFrom || '#6366f1'}, ${npc?.gradientTo || '#818cf8'})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3em",
              border: "3px solid white",
              margin: "0 auto 20px",
            }}>
              {npc?.emoji && getNpcEmoji(npc.emoji)}
            </div>
            <h2 style={{ color: "#fbbf24", marginBottom: "15px" }}>{npc?.name}</h2>
            <p style={{
              color: "#e2e8f0",
              fontSize: "1.1em",
              maxWidth: "350px",
              lineHeight: "1.5",
            }}>
              {boss.intro.npcMessage}
            </p>
          </div>
        )}

        {/* Step 1: Boss Appears */}
        {introStep === 1 && (
          <div style={{
            animation: "fadeIn 0.5s ease",
          }}>
            <div style={{
              width: "150px",
              height: "150px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "4em",
              border: "4px solid #fbbf24",
              margin: "0 auto 20px",
              boxShadow: "0 0 50px rgba(220, 38, 38, 0.5)",
            }}>
              {getBossEmoji(boss.bossEmoji)}
            </div>
            <h2 style={{
              color: "#ef4444",
              fontSize: "1.5em",
              marginBottom: "15px",
              textShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
            }}>
              {boss.bossName}
            </h2>
            <p style={{
              color: "#fca5a5",
              fontSize: "1em",
              maxWidth: "350px",
              lineHeight: "1.5",
              fontStyle: "italic",
            }}>
              &quot;{boss.intro.bossMessage}&quot;
            </p>
          </div>
        )}

        {/* Step 2: Ready to Battle */}
        {introStep === 2 && (
          <div style={{
            animation: "fadeIn 0.5s ease",
          }}>
            <h1 style={{
              color: "#fbbf24",
              fontSize: "2em",
              marginBottom: "30px",
              textShadow: "0 0 20px rgba(251, 191, 36, 0.5)",
            }}>
              {"\u2694\uFE0F"} BOSS BATTLE {"\u2694\uFE0F"}
            </h1>

            <div style={{
              width: "120px",
              height: "120px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3.5em",
              border: "4px solid #fbbf24",
              margin: "0 auto 20px",
              boxShadow: "0 0 30px rgba(220, 38, 38, 0.5)",
            }}>
              {getBossEmoji(boss.bossEmoji)}
            </div>

            <h2 style={{ color: "#ef4444", marginBottom: "30px" }}>
              {boss.bossName}
            </h2>

            <button
              onClick={() => setPhase("battle")}
              style={{
                background: "linear-gradient(135deg, #dc2626, #991b1b)",
                border: "3px solid #fbbf24",
                borderRadius: "16px",
                padding: "18px 50px",
                color: "white",
                fontSize: "1.2em",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
              }}
            >
              {"\u2694\uFE0F"} START BATTLE {"\u2694\uFE0F"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Victory Phase
  if (phase === "victory") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #166534 0%, #14532d 50%, #0f172a 100%)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "4em",
          marginBottom: "20px",
        }}>
          {"\u{1F3C6}"}
        </div>

        <h1 style={{
          color: "#4ade80",
          fontSize: "2em",
          marginBottom: "10px",
          textShadow: "0 0 20px rgba(74, 222, 128, 0.5)",
        }}>
          VICTORY!
        </h1>

        <p style={{
          color: "#86efac",
          fontSize: "1.1em",
          marginBottom: "30px",
        }}>
          You defeated {boss.bossName}!
        </p>

        {/* Boss defeat message */}
        <div style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: "16px",
          padding: "20px",
          maxWidth: "350px",
          marginBottom: "20px",
        }}>
          <p style={{
            color: "#fca5a5",
            fontSize: "0.9em",
            fontStyle: "italic",
            margin: 0,
          }}>
            &quot;{bossDialogue.victory}&quot;
          </p>
        </div>

        {/* NPC celebration */}
        <div style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "16px",
          padding: "20px",
          maxWidth: "350px",
          marginBottom: "30px",
        }}>
          <p style={{
            color: "#e2e8f0",
            fontSize: "0.95em",
            margin: 0,
          }}>
            {boss.victory.npcMessage}
          </p>
        </div>

        {/* Rewards */}
        <div style={{
          display: "flex",
          gap: "30px",
          marginBottom: "30px",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2em" }}>{"\u{1F48E}"}</div>
            <div style={{ color: "#60a5fa", fontWeight: "bold" }}>+{boss.victory.reward.diamonds}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2em" }}>{"\u{1F49A}"}</div>
            <div style={{ color: "#4ade80", fontWeight: "bold" }}>+{boss.victory.reward.emeralds}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2em" }}>{"\u2728"}</div>
            <div style={{ color: "#a78bfa", fontWeight: "bold" }}>+{boss.victory.reward.xp} XP</div>
          </div>
        </div>

        <button
          onClick={() => onVictory(boss.victory.reward)}
          style={{
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            border: "none",
            borderRadius: "16px",
            padding: "18px 50px",
            color: "white",
            fontSize: "1.1em",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
          }}
        >
          Claim Rewards {"\u{1F389}"}
        </button>
      </div>
    );
  }

  // Defeat Phase
  if (phase === "defeat") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #7f1d1d 0%, #450a0a 50%, #0f172a 100%)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "4em",
          marginBottom: "20px",
        }}>
          {"\u{1F494}"}
        </div>

        <h1 style={{
          color: "#ef4444",
          fontSize: "2em",
          marginBottom: "10px",
        }}>
          DEFEATED
        </h1>

        <p style={{
          color: "#fca5a5",
          fontSize: "1.1em",
          marginBottom: "30px",
        }}>
          {boss.bossName} was too strong...
        </p>

        {/* Boss taunt */}
        <div style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: "16px",
          padding: "20px",
          maxWidth: "350px",
          marginBottom: "20px",
        }}>
          <p style={{
            color: "#fca5a5",
            fontSize: "0.9em",
            fontStyle: "italic",
            margin: 0,
          }}>
            &quot;{boss.defeat.bossMessage}&quot;
          </p>
        </div>

        {/* NPC encouragement */}
        <div style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "16px",
          padding: "20px",
          maxWidth: "350px",
          marginBottom: "30px",
        }}>
          <p style={{
            color: "#e2e8f0",
            fontSize: "0.95em",
            margin: 0,
          }}>
            {boss.defeat.npcMessage}
          </p>
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={onDefeat}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "2px solid #6b7280",
              borderRadius: "12px",
              padding: "15px 30px",
              color: "#9ca3af",
              fontSize: "1em",
              cursor: "pointer",
            }}
          >
            Review Lessons
          </button>
          <button
            onClick={() => {
              setBossHealth(boss.health);
              setPlayerHealth(100);
              setCurrentQuestionIndex(0);
              setPhase("intro");
              setIntroStep(2);
            }}
            style={{
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              border: "none",
              borderRadius: "12px",
              padding: "15px 30px",
              color: "white",
              fontSize: "1em",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Try Again {"\u2694\uFE0F"}
          </button>
        </div>
      </div>
    );
  }

  // Battle Phase
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 50%, #7f1d1d 100%)",
      padding: "20px",
      paddingBottom: "120px",
      transition: shakeScreen ? "none" : "transform 0.5s ease",
      transform: shakeScreen ? "translateX(5px)" : "translateX(0)",
      animation: shakeScreen ? "shake 0.5s ease" : "none",
    }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes bossShake {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.95); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header - Health Bars */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "20px",
        gap: "20px",
      }}>
        {/* Player Health */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "6px",
          }}>
            <span style={{ fontSize: "1.2em" }}>{"\u{1F9D9}"}</span>
            <span style={{ color: "#4ade80", fontSize: "0.85em", fontWeight: "bold" }}>YOU</span>
          </div>
          <div style={{
            height: "12px",
            borderRadius: "6px",
            background: "rgba(0,0,0,0.4)",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${playerHealth}%`,
              height: "100%",
              background: playerHealth > 50 ? "#22c55e" : playerHealth > 25 ? "#eab308" : "#ef4444",
              transition: "width 0.5s ease, background 0.3s ease",
            }} />
          </div>
          <div style={{
            color: "#94a3b8",
            fontSize: "0.75em",
            marginTop: "4px",
          }}>
            HP: {playerHealth}/100
          </div>
        </div>

        {/* VS */}
        <div style={{
          color: "#fbbf24",
          fontWeight: "bold",
          fontSize: "1.2em",
          textShadow: "0 0 10px rgba(251, 191, 36, 0.5)",
        }}>
          VS
        </div>

        {/* Boss Health */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "6px",
            justifyContent: "flex-end",
          }}>
            <span style={{ color: "#ef4444", fontSize: "0.85em", fontWeight: "bold" }}>{boss.bossName}</span>
            <span style={{ fontSize: "1.2em" }}>{getBossEmoji(boss.bossEmoji)}</span>
          </div>
          <div style={{
            height: "12px",
            borderRadius: "6px",
            background: "rgba(0,0,0,0.4)",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${(bossHealth / boss.health) * 100}%`,
              height: "100%",
              background: "#ef4444",
              transition: "width 0.5s ease",
              marginLeft: "auto",
            }} />
          </div>
          <div style={{
            color: "#94a3b8",
            fontSize: "0.75em",
            marginTop: "4px",
            textAlign: "right",
          }}>
            HP: {bossHealth}/{boss.health}
          </div>
        </div>
      </div>

      {/* Boss Display */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: "20px",
      }}>
        <div style={{
          width: "100px",
          height: "100px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, #dc2626, #991b1b)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "3em",
          border: "3px solid #fbbf24",
          boxShadow: "0 0 30px rgba(220, 38, 38, 0.5)",
          animation: bossShake ? "bossShake 0.3s ease" : "none",
        }}>
          {getBossEmoji(boss.bossEmoji)}
        </div>
      </div>

      {/* Boss Message */}
      {bossMessage && !showFeedback && (
        <div style={{
          background: "rgba(239, 68, 68, 0.2)",
          borderRadius: "12px",
          padding: "12px 16px",
          marginBottom: "20px",
          borderLeft: "4px solid #ef4444",
        }}>
          <p style={{
            color: "#fca5a5",
            fontSize: "0.9em",
            margin: 0,
            fontStyle: "italic",
          }}>
            &quot;{bossMessage}&quot;
          </p>
        </div>
      )}

      {/* Question */}
      {currentQuestion && (
        <div style={{
          background: "rgba(0,0,0,0.4)",
          borderRadius: "20px",
          padding: "25px",
          marginBottom: "20px",
        }}>
          <div style={{
            color: "#94a3b8",
            fontSize: "0.8em",
            marginBottom: "10px",
            textAlign: "center",
          }}>
            Question {currentQuestionIndex + 1}/{boss.questions.length}
          </div>

          <h3 style={{
            color: "white",
            fontSize: "1.1em",
            marginBottom: "25px",
            lineHeight: "1.5",
            textAlign: "center",
          }}>
            {currentQuestion.text}
          </h3>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            {currentQuestion.options.map((option, i) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correct;
              const showResult = showFeedback;

              let bgColor = "rgba(255,255,255,0.1)";
              let borderColor = "rgba(255,255,255,0.1)";
              if (showResult) {
                if (isCorrect) {
                  bgColor = "rgba(34, 197, 94, 0.3)";
                  borderColor = "#22c55e";
                } else if (isSelected && !isCorrect) {
                  bgColor = "rgba(239, 68, 68, 0.3)";
                  borderColor = "#ef4444";
                }
              } else if (isSelected) {
                borderColor = "#fbbf24";
              }

              return (
                <button
                  key={i}
                  onClick={() => !showFeedback && handleAnswer(option)}
                  disabled={showFeedback}
                  style={{
                    background: bgColor,
                    border: `2px solid ${borderColor}`,
                    borderRadius: "12px",
                    padding: "15px 20px",
                    color: "white",
                    fontSize: "0.95em",
                    cursor: showFeedback ? "default" : "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback Panel */}
      {showFeedback && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: feedbackCorrect
            ? "linear-gradient(180deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95))"
            : "linear-gradient(180deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))",
          padding: "20px",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "15px",
          }}>
            <span style={{ fontSize: "2em" }}>
              {feedbackCorrect ? "\u2694\uFE0F" : "\u{1F494}"}
            </span>
            <div>
              <div style={{
                color: "white",
                fontWeight: "bold",
                fontSize: "1.1em",
              }}>
                {feedbackCorrect ? `HIT! -${damagePerHit} HP` : `MISS! You took ${damageFromBoss} damage!`}
              </div>
              <div style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.9em",
              }}>
                {feedbackCorrect ? npcMessage : bossMessage}
              </div>
            </div>
          </div>

          {/* Explanation */}
          {currentQuestion.explanation && (
            <div style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: "10px",
              padding: "12px",
              marginBottom: "15px",
            }}>
              <p style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "0.85em",
                margin: 0,
                lineHeight: "1.4",
              }}>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          <button
            onClick={handleNext}
            style={{
              width: "100%",
              background: "white",
              border: "none",
              borderRadius: "12px",
              padding: "15px",
              color: feedbackCorrect ? "#16a34a" : "#dc2626",
              fontSize: "1em",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {bossHealth <= 0 ? "Victory!" : playerHealth <= 0 ? "Continue..." : `Next Attack \u2694\uFE0F`}
          </button>
        </div>
      )}
    </div>
  );
}
