"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface QuestMapScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
  onStartQuest: (questId: string, chapterId: number) => void;
}

// Chapter icons and colors
const CHAPTER_STYLES: Record<number, { icon: string; color: string; bgGradient: string }> = {
  1: { icon: "📖", color: "#60a5fa", bgGradient: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" },
  2: { icon: "📚", color: "#22c55e", bgGradient: "linear-gradient(135deg, #14532d 0%, #0f172a 100%)" },
  3: { icon: "⚡", color: "#f59e0b", bgGradient: "linear-gradient(135deg, #78350f 0%, #0f172a 100%)" },
  4: { icon: "🎨", color: "#ec4899", bgGradient: "linear-gradient(135deg, #831843 0%, #0f172a 100%)" },
  5: { icon: "🚀", color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #4c1d95 0%, #0f172a 100%)" },
  6: { icon: "👤", color: "#06b6d4", bgGradient: "linear-gradient(135deg, #164e63 0%, #0f172a 100%)" },
  7: { icon: "🏔️", color: "#84cc16", bgGradient: "linear-gradient(135deg, #365314 0%, #0f172a 100%)" },
  8: { icon: "🏰", color: "#f43f5e", bgGradient: "linear-gradient(135deg, #881337 0%, #0f172a 100%)" },
  9: { icon: "🏛️", color: "#14b8a6", bgGradient: "linear-gradient(135deg, #134e4a 0%, #0f172a 100%)" },
  10: { icon: "⏰", color: "#eab308", bgGradient: "linear-gradient(135deg, #713f12 0%, #0f172a 100%)" },
  11: { icon: "💎", color: "#a855f7", bgGradient: "linear-gradient(135deg, #581c87 0%, #0f172a 100%)" },
  12: { icon: "👑", color: "#fbbf24", bgGradient: "linear-gradient(135deg, #92400e 0%, #0f172a 100%)" },
};

export function QuestMapScreen({ playerId, onBack, onStartQuest }: QuestMapScreenProps) {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  // Initialize wizard profile if needed
  const initWizard = useMutation(api.quests.initializeWizardProfile);

  // Fetch data
  const wizardProfile = useQuery(
    api.quests.getWizardProfile,
    playerId ? { playerId } : "skip"
  );

  const chapters = useQuery(
    api.quests.getChapters,
    playerId ? { playerId } : "skip"
  );

  const chapterQuests = useQuery(
    api.quests.getChapterQuests,
    playerId && selectedChapter
      ? { playerId, chapterId: selectedChapter }
      : "skip"
  );

  // Initialize wizard on first load
  useEffect(() => {
    if (playerId && wizardProfile === null) {
      initWizard({ playerId });
    }
  }, [playerId, wizardProfile, initWizard]);

  // Render loading
  if (!chapters || wizardProfile === undefined) {
    return (
      <div className="screen active" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4em", marginBottom: "20px" }}>🔮</div>
          <div style={{ color: "#a5b4fc" }}>Loading Academy Map...</div>
        </div>
      </div>
    );
  }

  // Render chapter detail view
  if (selectedChapter && chapterQuests) {
    const chapter = chapters.find((c) => c.id === selectedChapter);
    const style = CHAPTER_STYLES[selectedChapter] || CHAPTER_STYLES[1];

    return (
      <div className="screen active" style={{
        padding: "20px",
        background: style.bgGradient,
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px" }}>
          <button
            className="btn"
            onClick={() => setSelectedChapter(null)}
            style={{ padding: "10px 15px", background: "rgba(0,0,0,0.4)" }}
          >
            Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "1.3em", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>{style.icon}</span>
              <span>Chapter {selectedChapter}</span>
            </h1>
            <p style={{ margin: 0, color: style.color, fontSize: "1.1em" }}>
              {chapter?.name}
            </p>
          </div>
          <div style={{
            background: `${style.color}30`,
            padding: "8px 15px",
            borderRadius: "10px",
            border: `2px solid ${style.color}`,
          }}>
            <div style={{ fontSize: "0.8em", color: "#AAA" }}>Stars</div>
            <div style={{ fontWeight: "bold", color: style.color }}>
              {chapter?.starsEarned || 0} / {(chapter?.lessons || 5) * 3}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          background: "rgba(0,0,0,0.4)",
          borderRadius: "10px",
          padding: "15px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#AAA" }}>Progress</span>
            <span style={{ color: style.color }}>
              {chapter?.lessonsCompleted || 0} / {chapter?.lessons || 5} Lessons
            </span>
          </div>
          <div style={{
            background: "rgba(0,0,0,0.5)",
            borderRadius: "5px",
            height: "10px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${((chapter?.lessonsCompleted || 0) / (chapter?.lessons || 5)) * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${style.color}, ${style.color}88)`,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>

        {/* Quest list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {chapterQuests.map((quest, index) => {
            const isLocked = !quest.isUnlocked;
            const isBoss = quest.questType === "boss";

            return (
              <div
                key={quest.questId}
                onClick={() => !isLocked && onStartQuest(quest.questId, selectedChapter)}
                style={{
                  background: isLocked
                    ? "rgba(0,0,0,0.3)"
                    : isBoss
                    ? `linear-gradient(135deg, ${style.color}30 0%, rgba(0,0,0,0.3) 100%)`
                    : "rgba(0,0,0,0.4)",
                  borderRadius: "12px",
                  padding: "15px",
                  border: `2px solid ${isLocked ? "#333" : quest.isCompleted ? "#22c55e" : style.color}`,
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.5 : 1,
                  transition: "transform 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  {/* Quest icon */}
                  <div style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "10px",
                    background: isLocked ? "#333" : `${style.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5em",
                  }}>
                    {isLocked ? "🔒" : isBoss ? "👹" : quest.isCompleted ? "✅" : "📝"}
                  </div>

                  {/* Quest info */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: "0 0 5px 0",
                      fontSize: "1em",
                      color: isLocked ? "#666" : "#fff",
                    }}>
                      {quest.questName}
                    </h3>
                    <p style={{ margin: 0, color: "#888", fontSize: "0.9em" }}>
                      {isBoss ? "Defeat the boss to complete chapter" : `Topic: ${quest.topic}`}
                    </p>
                  </div>

                  {/* Stars */}
                  <div style={{ textAlign: "right" }}>
                    {quest.isCompleted ? (
                      <div style={{ color: "#fbbf24" }}>
                        {"★".repeat(quest.starsEarned)}{"☆".repeat(3 - quest.starsEarned)}
                      </div>
                    ) : (
                      <div style={{ color: "#555" }}>☆☆☆</div>
                    )}
                    {quest.attempts > 0 && (
                      <div style={{ fontSize: "0.8em", color: "#666" }}>
                        {quest.attempts} attempts
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render main map view
  return (
    <div className="screen active" style={{
      padding: "20px",
      background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
      overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
        <button
          className="btn"
          onClick={onBack}
          style={{ padding: "10px 15px", background: "rgba(0,0,0,0.4)" }}
        >
          Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.4em" }}>WORD WIZARD ACADEMY</h1>
          <p style={{ margin: 0, color: "#a5b4fc", fontSize: "0.9em" }}>
            Journey through the halls of knowledge
          </p>
        </div>
      </div>

      {/* Wizard Profile Card */}
      {wizardProfile && (
        <div style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(30, 27, 75, 0.9) 100%)",
          borderRadius: "15px",
          padding: "20px",
          border: "2px solid #8b5cf6",
          marginBottom: "25px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5em",
              border: "3px solid #a5b4fc",
            }}>
              🧙
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#c4b5fd", fontSize: "0.9em" }}>
                {wizardProfile.wizardTitle}
              </div>
              <div style={{ fontSize: "1.3em", fontWeight: "bold", marginBottom: "5px" }}>
                Academy Level {wizardProfile.academyLevel}
              </div>
              <div style={{ display: "flex", gap: "15px", color: "#a5b4fc", fontSize: "0.9em" }}>
                <span>📖 Chapter {wizardProfile.currentChapter}</span>
                <span>✨ {wizardProfile.totalSpellsLearned} Spells</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Map */}
      <h2 style={{ margin: "0 0 15px 0", color: "#c4b5fd", fontSize: "1.1em" }}>
        ACADEMY CHAPTERS
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "15px",
      }}>
        {chapters.map((chapter) => {
          const style = CHAPTER_STYLES[chapter.id] || CHAPTER_STYLES[1];
          const isLocked = !chapter.isUnlocked;
          const progress = chapter.lessons > 0
            ? (chapter.lessonsCompleted / chapter.lessons) * 100
            : 0;

          return (
            <div
              key={chapter.id}
              onClick={() => !isLocked && setSelectedChapter(chapter.id)}
              style={{
                background: isLocked
                  ? "rgba(0,0,0,0.3)"
                  : `linear-gradient(135deg, ${style.color}20 0%, rgba(0,0,0,0.4) 100%)`,
                borderRadius: "15px",
                padding: "15px",
                border: `2px solid ${isLocked ? "#333" : chapter.isCompleted ? "#22c55e" : style.color}`,
                cursor: isLocked ? "not-allowed" : "pointer",
                opacity: isLocked ? 0.5 : 1,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Lock overlay */}
              {isLocked && (
                <div style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  fontSize: "1.5em",
                }}>
                  🔒
                </div>
              )}

              {/* Completed badge */}
              {chapter.isCompleted && (
                <div style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "#22c55e",
                  color: "#000",
                  padding: "3px 8px",
                  borderRadius: "5px",
                  fontSize: "0.7em",
                  fontWeight: "bold",
                }}>
                  DONE
                </div>
              )}

              {/* Icon and number */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "2em" }}>{style.icon}</span>
                <span style={{
                  background: style.color,
                  color: "#000",
                  padding: "3px 10px",
                  borderRadius: "5px",
                  fontSize: "0.8em",
                  fontWeight: "bold",
                }}>
                  CH {chapter.id}
                </span>
              </div>

              {/* Name */}
              <h3 style={{
                margin: "0 0 8px 0",
                fontSize: "0.95em",
                color: isLocked ? "#666" : "#fff",
              }}>
                {chapter.name}
              </h3>

              {/* Progress bar */}
              {!isLocked && (
                <>
                  <div style={{
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: "5px",
                    height: "6px",
                    overflow: "hidden",
                    marginBottom: "8px",
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: "100%",
                      background: chapter.isCompleted ? "#22c55e" : style.color,
                      transition: "width 0.5s ease",
                    }} />
                  </div>

                  {/* Stars */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8em",
                    color: "#888",
                  }}>
                    <span>{chapter.lessonsCompleted}/{chapter.lessons}</span>
                    <span style={{ color: "#fbbf24" }}>
                      ★ {chapter.starsEarned}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Tip at bottom */}
      <div style={{
        marginTop: "25px",
        padding: "15px",
        background: "rgba(139, 92, 246, 0.1)",
        borderRadius: "10px",
        border: "1px solid #8b5cf640",
        textAlign: "center",
      }}>
        <span style={{ color: "#c4b5fd" }}>
          Complete chapters to unlock new magical abilities!
        </span>
      </div>
    </div>
  );
}
