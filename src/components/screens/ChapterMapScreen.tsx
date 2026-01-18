"use client";

import { useState, useEffect } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { LIFE_SKILLS_ISLANDS, Island, Chapter, getWizardLevel } from "@/data/lifeSkillsQuestions";
import { NPCS, getRandomMessage } from "@/data/npcDialogues";

interface ChapterProgress {
  chapterId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  starsEarned: number;
  lessonsCompleted: number;
  totalLessons: number;
  bossDefeated: boolean;
}

interface ChapterMapScreenProps {
  playerId: Id<"players"> | null;
  chapterProgress: ChapterProgress[];
  onSelectChapter: (chapter: Chapter) => void;
  onBack: () => void;
  totalStars?: number;
  diamonds?: number;
}

export function ChapterMapScreen({
  playerId,
  chapterProgress,
  onSelectChapter,
  onBack,
  totalStars = 0,
  diamonds = 0,
}: ChapterMapScreenProps) {
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const [npcMessage, setNpcMessage] = useState<string>("");
  const [showNpcBubble, setShowNpcBubble] = useState(false);

  // Calculate completed chapters
  const completedChapters = chapterProgress.filter(p => p.isCompleted).length;
  const wizardInfo = getWizardLevel(completedChapters);

  // Get progress for a chapter
  const getChapterProgress = (chapterId: string): ChapterProgress | undefined => {
    return chapterProgress.find(p => p.chapterId === chapterId);
  };

  // Check if island is unlocked (first island always unlocked, others need previous island completed)
  const isIslandUnlocked = (islandId: number): boolean => {
    if (islandId === 1) return true;
    const prevIsland = LIFE_SKILLS_ISLANDS.find(i => i.id === islandId - 1);
    if (!prevIsland) return false;
    return prevIsland.chapters.every(ch => {
      const progress = getChapterProgress(ch.chapterId);
      return progress?.isCompleted;
    });
  };

  // Show NPC greeting when island selected
  useEffect(() => {
    if (selectedIsland) {
      const npc = NPCS[selectedIsland.npcId];
      if (npc) {
        setNpcMessage(getRandomMessage(npc.greetings));
        setShowNpcBubble(true);
        const timer = setTimeout(() => setShowNpcBubble(false), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedIsland]);

  // Island view - shows chapters
  if (selectedIsland) {
    const npc = NPCS[selectedIsland.npcId];
    const islandChapters = selectedIsland.chapters;

    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${selectedIsland.gradientFrom} 0%, #0f172a 100%)`,
        padding: "20px",
        paddingBottom: "100px",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "20px",
        }}>
          <button
            onClick={() => setSelectedIsland(null)}
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "none",
              borderRadius: "10px",
              padding: "10px 15px",
              color: "white",
              fontSize: "1.2em",
              cursor: "pointer",
            }}
          >
            &larr;
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              margin: 0,
              fontSize: "1.3em",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              {selectedIsland.emoji === "brain" && <span>&#129504;</span>}
              {selectedIsland.emoji === "purple_heart" && <span>&#128156;</span>}
              {selectedIsland.emoji === "robot" && <span>&#129302;</span>}
              {selectedIsland.emoji === "coin" && <span>&#129689;</span>}
              {selectedIsland.name}
            </h1>
          </div>
        </div>

        {/* NPC Panel */}
        <div style={{
          background: "rgba(0,0,0,0.4)",
          borderRadius: "16px",
          padding: "15px",
          marginBottom: "20px",
          display: "flex",
          gap: "15px",
          alignItems: "flex-start",
          border: `2px solid ${selectedIsland.color}40`,
        }}>
          {/* NPC Avatar */}
          <div style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${npc?.gradientFrom || '#6366f1'}, ${npc?.gradientTo || '#818cf8'})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5em",
            border: "3px solid white",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            flexShrink: 0,
          }}>
            {npc?.emoji === "owl" && <span>&#129417;</span>}
            {npc?.emoji === "fox" && <span>&#129418;</span>}
            {npc?.emoji === "robot" && <span>&#129302;</span>}
            {npc?.emoji === "pirate_flag" && <span>&#127988;</span>}
          </div>

          {/* NPC Info & Message */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: "bold",
              color: "white",
              fontSize: "1em",
              marginBottom: "4px",
            }}>
              {npc?.name} <span style={{ color: selectedIsland.color, fontSize: "0.8em" }}>({npc?.title})</span>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "10px 15px",
              color: "#e2e8f0",
              fontSize: "0.9em",
              lineHeight: "1.4",
              position: "relative",
            }}>
              {showNpcBubble ? npcMessage : getRandomMessage(npc?.catchphrases || [])}
              <div style={{
                position: "absolute",
                left: "-8px",
                top: "15px",
                width: 0,
                height: 0,
                borderTop: "8px solid transparent",
                borderBottom: "8px solid transparent",
                borderRight: "8px solid rgba(255,255,255,0.1)",
              }} />
            </div>
          </div>
        </div>

        {/* Chapter List */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}>
          {islandChapters.map((chapter, index) => {
            const progress = getChapterProgress(chapter.chapterId);
            const isUnlocked = index === 0 ||
              getChapterProgress(islandChapters[index - 1]?.chapterId)?.isCompleted;
            const isCompleted = progress?.isCompleted;
            const lessonsComplete = progress?.lessonsCompleted || 0;
            const totalLessons = chapter.lessons.length + (chapter.boss ? 1 : 0);
            const progressPercent = (lessonsComplete / totalLessons) * 100;

            return (
              <div
                key={chapter.chapterId}
                onClick={() => isUnlocked && onSelectChapter(chapter)}
                style={{
                  background: isCompleted
                    ? `linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.2))`
                    : isUnlocked
                    ? `linear-gradient(135deg, ${selectedIsland.color}30, rgba(30, 27, 75, 0.4))`
                    : "rgba(0,0,0,0.4)",
                  borderRadius: "16px",
                  padding: "20px",
                  cursor: isUnlocked ? "pointer" : "not-allowed",
                  border: isCompleted
                    ? "2px solid #22c55e"
                    : isUnlocked
                    ? `2px solid ${selectedIsland.color}`
                    : "2px solid #334155",
                  opacity: isUnlocked ? 1 : 0.6,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Lock Overlay */}
                {!isUnlocked && (
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "2em",
                    zIndex: 10,
                  }}>
                    &#128274;
                  </div>
                )}

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                }}>
                  {/* Chapter Number */}
                  <div style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background: isCompleted
                      ? "linear-gradient(135deg, #22c55e, #16a34a)"
                      : `linear-gradient(135deg, ${selectedIsland.gradientFrom}, ${selectedIsland.gradientTo})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "1.3em",
                    color: "white",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  }}>
                    {isCompleted ? "&#10004;" : chapter.id}
                  </div>

                  {/* Chapter Info */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: "1.1em",
                      color: "white",
                      marginBottom: "4px",
                    }}>
                      {chapter.name}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: "0.85em",
                      color: "#94a3b8",
                    }}>
                      {chapter.description}
                    </p>
                  </div>

                  {/* Stars */}
                  {isUnlocked && (
                    <div style={{
                      display: "flex",
                      gap: "2px",
                    }}>
                      {[1, 2, 3].map(star => (
                        <span key={star} style={{
                          fontSize: "1.2em",
                          color: (progress?.starsEarned || 0) >= star ? "#fbbf24" : "#475569",
                        }}>
                          &#11088;
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {isUnlocked && !isCompleted && lessonsComplete > 0 && (
                  <div style={{
                    marginTop: "12px",
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}>
                      <span style={{ color: "#94a3b8", fontSize: "0.8em" }}>
                        {lessonsComplete}/{totalLessons} lessons
                      </span>
                      <span style={{ color: selectedIsland.color, fontSize: "0.8em" }}>
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                    <div style={{
                      height: "6px",
                      borderRadius: "3px",
                      background: "rgba(0,0,0,0.3)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${progressPercent}%`,
                        height: "100%",
                        background: selectedIsland.color,
                        borderRadius: "3px",
                        transition: "width 0.3s ease",
                      }} />
                    </div>
                  </div>
                )}

                {/* Boss indicator */}
                {chapter.boss && (
                  <div style={{
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "8px",
                  }}>
                    <span style={{ fontSize: "1.2em" }}>&#128081;</span>
                    <span style={{ color: "#f59e0b", fontSize: "0.85em", fontWeight: "bold" }}>
                      Boss: {chapter.boss.bossName}
                    </span>
                    {progress?.bossDefeated && (
                      <span style={{ marginLeft: "auto", color: "#22c55e" }}>&#9989;</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // World Map view - shows all islands
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 50%, #134e4a 100%)",
      padding: "20px",
      paddingBottom: "100px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
      }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "none",
            borderRadius: "10px",
            padding: "10px 15px",
            color: "white",
            fontSize: "1.2em",
            cursor: "pointer",
          }}
        >
          &larr;
        </button>
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            margin: 0,
            fontSize: "1.3em",
            color: "white",
          }}>
            &#127757; Academy of Life Skills
          </h1>
          <div style={{
            fontSize: "0.85em",
            color: "#a78bfa",
            marginTop: "4px",
          }}>
            {wizardInfo.title} &#10024;
          </div>
        </div>
        <div style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}>
          <span style={{ color: "#fbbf24" }}>&#11088; {totalStars}</span>
          <span style={{ color: "#60a5fa" }}>&#128142; {diamonds}</span>
        </div>
      </div>

      {/* Wizard Progress */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        borderRadius: "12px",
        padding: "15px",
        marginBottom: "25px",
        border: "1px solid #8b5cf640",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}>
          <span style={{ color: "white", fontWeight: "bold" }}>
            &#129497; {wizardInfo.title}
          </span>
          <span style={{ color: "#a78bfa", fontSize: "0.9em" }}>
            {completedChapters}/12 Chapters
          </span>
        </div>
        <div style={{
          height: "8px",
          borderRadius: "4px",
          background: "rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${(completedChapters / 12) * 100}%`,
            height: "100%",
            background: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
            borderRadius: "4px",
          }} />
        </div>
        {wizardInfo.nextLevel && (
          <div style={{
            marginTop: "8px",
            fontSize: "0.8em",
            color: "#94a3b8",
            textAlign: "center",
          }}>
            {wizardInfo.chaptersToNext} more chapter{wizardInfo.chaptersToNext > 1 ? "s" : ""} to become {wizardInfo.nextLevel}!
          </div>
        )}
      </div>

      {/* Islands Grid */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}>
        {LIFE_SKILLS_ISLANDS.map((island) => {
          const unlocked = isIslandUnlocked(island.id);
          const npc = NPCS[island.npcId];
          const chaptersCompleted = island.chapters.filter(ch => {
            const progress = getChapterProgress(ch.chapterId);
            return progress?.isCompleted;
          }).length;
          const totalChapters = island.chapters.length;
          const islandComplete = chaptersCompleted === totalChapters;

          return (
            <div
              key={island.id}
              onClick={() => unlocked && setSelectedIsland(island)}
              style={{
                background: islandComplete
                  ? `linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))`
                  : unlocked
                  ? `linear-gradient(135deg, ${island.color}20, rgba(30, 27, 75, 0.4))`
                  : "rgba(0,0,0,0.4)",
                borderRadius: "20px",
                padding: "20px",
                cursor: unlocked ? "pointer" : "not-allowed",
                border: islandComplete
                  ? "3px solid #22c55e"
                  : unlocked
                  ? `3px solid ${island.color}`
                  : "3px solid #334155",
                opacity: unlocked ? 1 : 0.6,
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s ease",
              }}
            >
              {/* Lock overlay */}
              {!unlocked && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  flexDirection: "column",
                  gap: "10px",
                }}>
                  <span style={{ fontSize: "2.5em" }}>&#128274;</span>
                  <span style={{ color: "#94a3b8", fontSize: "0.9em" }}>
                    Complete previous island to unlock
                  </span>
                </div>
              )}

              <div style={{
                display: "flex",
                gap: "15px",
                alignItems: "flex-start",
              }}>
                {/* Island Icon */}
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  background: `linear-gradient(135deg, ${island.gradientFrom}, ${island.gradientTo})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5em",
                  boxShadow: `0 8px 25px ${island.color}40`,
                  border: "3px solid rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}>
                  {island.emoji === "brain" && <span>&#129504;</span>}
                  {island.emoji === "purple_heart" && <span>&#128156;</span>}
                  {island.emoji === "robot" && <span>&#129302;</span>}
                  {island.emoji === "coin" && <span>&#129689;</span>}
                </div>

                {/* Island Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "6px",
                  }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: "1.2em",
                      color: "white",
                    }}>
                      {island.name}
                    </h2>
                    {islandComplete && <span style={{ color: "#22c55e" }}>&#9989;</span>}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: "0.85em",
                    color: "#94a3b8",
                    marginBottom: "10px",
                  }}>
                    {island.description}
                  </p>

                  {/* NPC Mini */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "20px",
                    padding: "6px 12px",
                    width: "fit-content",
                  }}>
                    <span style={{ fontSize: "1.2em" }}>
                      {npc?.emoji === "owl" && <span>&#129417;</span>}
                      {npc?.emoji === "fox" && <span>&#129418;</span>}
                      {npc?.emoji === "robot" && <span>&#129302;</span>}
                      {npc?.emoji === "pirate_flag" && <span>&#127988;</span>}
                    </span>
                    <span style={{ color: "#e2e8f0", fontSize: "0.8em" }}>
                      {npc?.name}
                    </span>
                  </div>

                  {/* Progress */}
                  {unlocked && (
                    <div style={{ marginTop: "12px" }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}>
                        <span style={{ color: "#94a3b8", fontSize: "0.8em" }}>
                          {chaptersCompleted}/{totalChapters} chapters
                        </span>
                        <span style={{ color: island.color, fontSize: "0.8em" }}>
                          {Math.round((chaptersCompleted / totalChapters) * 100)}%
                        </span>
                      </div>
                      <div style={{
                        height: "6px",
                        borderRadius: "3px",
                        background: "rgba(0,0,0,0.3)",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${(chaptersCompleted / totalChapters) * 100}%`,
                          height: "100%",
                          background: island.color,
                          borderRadius: "3px",
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                {unlocked && (
                  <div style={{
                    color: island.color,
                    fontSize: "1.5em",
                    alignSelf: "center",
                  }}>
                    &rarr;
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom wave decoration */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "100px",
        background: "linear-gradient(to top, #0ea5e9, transparent)",
        opacity: 0.1,
        pointerEvents: "none",
      }} />
    </div>
  );
}
