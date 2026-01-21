"use client";

import { useState, useEffect, useCallback } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Chapter,
  Lesson,
  Question,
  QuizQuestion,
  DragDropQuestion,
  MatchPairsQuestion,
  FillBlankQuestion,
  SortOrderQuestion,
  getIslandByChapter
} from "@/data/lifeSkillsQuestions";
import { NPCS, getRandomMessage } from "@/data/npcDialogues";

interface QuestGameScreenProps {
  playerId: Id<"players"> | null;
  chapter: Chapter;
  lessonIndex: number;
  onComplete: (result: { stars: number; diamonds: number; xp: number; correctCount: number; totalCount: number }) => void;
  onBack: () => void;
  onBossBattle?: () => void;
}

type GamePhase = "intro" | "playing" | "feedback" | "outro" | "complete";

export function QuestGameScreen({
  playerId,
  chapter,
  lessonIndex,
  onComplete,
  onBack,
  onBossBattle,
}: QuestGameScreenProps) {
  const lesson = chapter.lessons[lessonIndex];
  const island = getIslandByChapter(chapter.chapterId);
  const npc = island ? NPCS[island.npcId] : null;

  const [phase, setPhase] = useState<GamePhase>("intro");
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [npcMessage, setNpcMessage] = useState("");

  // Game-specific states
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [dragDropPlacements, setDragDropPlacements] = useState<Record<string, string>>({});
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [selectedLeftIndex, setSelectedLeftIndex] = useState<number | null>(null);
  const [sortedItems, setSortedItems] = useState<string[]>([]);
  const [fillBlankAnswer, setFillBlankAnswer] = useState<string | null>(null);

  const currentGame = lesson?.games[currentGameIndex];
  const totalGames = lesson?.games.length || 0;
  const progress = ((currentGameIndex) / totalGames) * 100;

  // Reset game state when moving to new game
  const resetGameState = useCallback(() => {
    setSelectedAnswer(null);
    setDragDropPlacements({});
    setMatchedPairs(new Set());
    setSelectedLeftIndex(null);
    setFillBlankAnswer(null);
    if (currentGame?.type === "sort_order") {
      setSortedItems([...(currentGame as SortOrderQuestion).items].sort(() => Math.random() - 0.5));
    }
  }, [currentGame]);

  useEffect(() => {
    resetGameState();
  }, [currentGameIndex, resetGameState]);

  // Initialize sorted items for sort_order games
  useEffect(() => {
    if (currentGame?.type === "sort_order") {
      setSortedItems([...(currentGame as SortOrderQuestion).items].sort(() => Math.random() - 0.5));
    }
  }, [currentGame]);

  // Handle quiz answer
  const handleQuizAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    const quiz = currentGame as QuizQuestion;
    const isCorrect = answer === quiz.correct;

    setFeedbackCorrect(isCorrect);
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrectCount(c => c + 1);
      setNpcMessage(getRandomMessage(npc?.correctResponses || ["Correct!"]));
    } else {
      setNpcMessage(getRandomMessage(npc?.wrongResponses || ["Try again!"]));
    }
    setShowFeedback(true);
  };

  // Handle drag drop check
  const handleDragDropCheck = () => {
    const dd = currentGame as DragDropQuestion;
    const correctCount = Object.entries(dd.correctMapping).filter(
      ([itemId, categoryId]) => dragDropPlacements[itemId] === categoryId
    ).length;
    const totalItems = Object.keys(dd.correctMapping).length;
    const isCorrect = correctCount === totalItems;

    setFeedbackCorrect(isCorrect);
    if (isCorrect) {
      setScore(s => s + 15);
      setCorrectCount(c => c + 1);
      setNpcMessage(getRandomMessage(npc?.correctResponses || ["Correct!"]));
    } else {
      setNpcMessage(`${correctCount}/${totalItems} correct. ${getRandomMessage(npc?.wrongResponses || ["Try again!"])}`);
    }
    setShowFeedback(true);
  };

  // Handle match pair selection
  const handleMatchPairSelect = (leftIndex: number, rightIndex: number) => {
    const mp = currentGame as MatchPairsQuestion;
    if (leftIndex === rightIndex) {
      // Correct match
      const newMatched = new Set(matchedPairs);
      newMatched.add(leftIndex);
      setMatchedPairs(newMatched);

      if (newMatched.size === mp.pairs.length) {
        // All matched
        setFeedbackCorrect(true);
        setScore(s => s + 15);
        setCorrectCount(c => c + 1);
        setNpcMessage(getRandomMessage(npc?.correctResponses || ["Correct!"]));
        setShowFeedback(true);
      }
    } else {
      // Wrong match - shake animation could go here
      setSelectedLeftIndex(null);
    }
  };

  // Handle sort order check
  const handleSortOrderCheck = () => {
    const so = currentGame as SortOrderQuestion;
    const isCorrect = sortedItems.every((item, i) => item === so.correctOrder[i]);

    setFeedbackCorrect(isCorrect);
    if (isCorrect) {
      setScore(s => s + 15);
      setCorrectCount(c => c + 1);
      setNpcMessage(getRandomMessage(npc?.correctResponses || ["Correct!"]));
    } else {
      setNpcMessage(getRandomMessage(npc?.wrongResponses || ["Try again!"]));
    }
    setShowFeedback(true);
  };

  // Handle fill blank answer
  const handleFillBlankAnswer = (answer: string) => {
    setFillBlankAnswer(answer);
    const fb = currentGame as FillBlankQuestion;
    const isCorrect = answer === fb.correct;

    setFeedbackCorrect(isCorrect);
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrectCount(c => c + 1);
      setNpcMessage(getRandomMessage(npc?.correctResponses || ["Correct!"]));
    } else {
      setNpcMessage(getRandomMessage(npc?.wrongResponses || ["Try again!"]));
    }
    setShowFeedback(true);
  };

  // Move to next game
  const handleNext = () => {
    setShowFeedback(false);
    if (currentGameIndex < totalGames - 1) {
      setCurrentGameIndex(i => i + 1);
    } else {
      setPhase("outro");
    }
  };

  // Calculate stars
  const calculateStars = (): number => {
    const percentage = (correctCount / totalGames) * 100;
    if (percentage >= 90) return 3;
    if (percentage >= 70) return 2;
    if (percentage >= 50) return 1;
    return 0;
  };

  // Handle completion
  const handleComplete = () => {
    const stars = calculateStars();
    onComplete({
      stars,
      diamonds: lesson.outro.reward.diamonds,
      xp: lesson.outro.reward.xp,
      correctCount,
      totalCount: totalGames,
    });
  };

  // Move item in sort order
  const moveSortItem = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= sortedItems.length) return;

    const newItems = [...sortedItems];
    [newItems[fromIndex], newItems[toIndex]] = [newItems[toIndex], newItems[fromIndex]];
    setSortedItems(newItems);
  };

  if (!lesson) {
    return <div style={{ padding: "20px", color: "white" }}>Lesson not found</div>;
  }

  // Intro Phase
  if (phase === "intro") {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${island?.gradientFrom || '#6366f1'} 0%, #0f172a 100%)`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "30px",
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
          <div>
            <h2 style={{ margin: 0, color: "white", fontSize: "1.1em" }}>{chapter.name}</h2>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85em" }}>Lesson {lessonIndex + 1}: {lesson.name}</p>
          </div>
        </div>

        {/* NPC Intro Panel */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "20px",
        }}>
          {/* NPC Avatar */}
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${npc?.gradientFrom || '#6366f1'}, ${npc?.gradientTo || '#818cf8'})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "4em",
            border: "4px solid white",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            marginBottom: "20px",
          }}>
            {npc?.emoji === "owl" && <span>&#129417;</span>}
            {npc?.emoji === "fox" && <span>&#129418;</span>}
            {npc?.emoji === "robot" && <span>&#129302;</span>}
            {npc?.emoji === "pirate_flag" && <span>&#127988;</span>}
          </div>

          <h3 style={{
            color: island?.color || "#8b5cf6",
            fontSize: "1.1em",
            marginBottom: "5px",
          }}>
            {npc?.name}
          </h3>

          {/* Speech Bubble */}
          <div style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: "20px",
            padding: "25px",
            maxWidth: "400px",
            marginBottom: "30px",
            border: "2px solid rgba(255,255,255,0.1)",
          }}>
            <p style={{
              color: "#e2e8f0",
              fontSize: "1em",
              lineHeight: "1.6",
              margin: 0,
            }}>
              {lesson.intro.npcMessage}
            </p>
            {lesson.intro.scenario && (
              <p style={{
                color: "#94a3b8",
                fontSize: "0.9em",
                fontStyle: "italic",
                marginTop: "15px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: "15px",
              }}>
                {lesson.intro.scenario}
              </p>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={() => setPhase("playing")}
            style={{
              background: `linear-gradient(135deg, ${island?.gradientFrom || '#6366f1'}, ${island?.gradientTo || '#818cf8'})`,
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
            Start Lesson &#9654;
          </button>

          <p style={{
            color: "#64748b",
            fontSize: "0.85em",
            marginTop: "15px",
          }}>
            {totalGames} activities
          </p>
        </div>
      </div>
    );
  }

  // Outro Phase
  if (phase === "outro") {
    const stars = calculateStars();
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${island?.gradientFrom || '#6366f1'} 0%, #0f172a 100%)`,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}>
        {/* Stars */}
        <div style={{
          fontSize: "3em",
          marginBottom: "20px",
        }}>
          {[1, 2, 3].map(s => (
            <span key={s} style={{
              color: s <= stars ? "#fbbf24" : "#475569",
              margin: "0 5px",
            }}>
              &#11088;
            </span>
          ))}
        </div>

        <h1 style={{
          color: "white",
          fontSize: "1.8em",
          marginBottom: "10px",
        }}>
          {stars >= 2 ? "Excellent!" : stars === 1 ? "Good Job!" : "Keep Practicing!"}
        </h1>

        <p style={{
          color: "#94a3b8",
          fontSize: "1em",
          marginBottom: "30px",
        }}>
          {correctCount}/{totalGames} correct
        </p>

        {/* NPC Message */}
        <div style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "16px",
          padding: "20px",
          maxWidth: "350px",
          marginBottom: "25px",
        }}>
          <p style={{
            color: "#e2e8f0",
            fontSize: "0.95em",
            lineHeight: "1.5",
            margin: 0,
          }}>
            {lesson.outro.npcMessage}
          </p>
        </div>

        {/* Rewards */}
        <div style={{
          display: "flex",
          gap: "30px",
          marginBottom: "30px",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2em" }}>&#128142;</div>
            <div style={{ color: "#60a5fa", fontWeight: "bold" }}>+{lesson.outro.reward.diamonds}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2em" }}>&#10024;</div>
            <div style={{ color: "#a78bfa", fontWeight: "bold" }}>+{lesson.outro.reward.xp} XP</div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleComplete}
          style={{
            background: `linear-gradient(135deg, ${island?.gradientFrom || '#6366f1'}, ${island?.gradientTo || '#818cf8'})`,
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
          Continue
        </button>
      </div>
    );
  }

  // Playing Phase
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${island?.gradientFrom || '#6366f1'} 0%, #0f172a 100%)`,
      padding: "20px",
      paddingBottom: "calc(150px + env(safe-area-inset-bottom, 0px))",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "15px",
        marginBottom: "15px",
      }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "none",
            borderRadius: "10px",
            padding: "8px 12px",
            color: "white",
            fontSize: "1em",
            cursor: "pointer",
          }}
        >
          &larr;
        </button>
        <div style={{ flex: 1 }}>
          <div style={{
            height: "8px",
            borderRadius: "4px",
            background: "rgba(0,0,0,0.3)",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: island?.color || "#8b5cf6",
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>
        <span style={{ color: "#94a3b8", fontSize: "0.9em" }}>
          {currentGameIndex + 1}/{totalGames}
        </span>
      </div>

      {/* Score */}
      <div style={{
        textAlign: "center",
        marginBottom: "20px",
        color: "#fbbf24",
        fontSize: "0.9em",
      }}>
        Score: {score} &#10024;
      </div>

      {/* Game Content */}
      {currentGame && (
        <div style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: "20px",
          padding: "25px",
          marginBottom: "20px",
        }}>
          {/* Quiz Game */}
          {currentGame.type === "quiz" && (
            <div>
              <h3 style={{
                color: "white",
                fontSize: "1.1em",
                marginBottom: "25px",
                lineHeight: "1.5",
                textAlign: "center",
              }}>
                {(currentGame as QuizQuestion).text}
              </h3>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}>
                {(currentGame as QuizQuestion).options.map((option, i) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === (currentGame as QuizQuestion).correct;
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
                    borderColor = island?.color || "#8b5cf6";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => !showFeedback && handleQuizAnswer(option)}
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
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: isSelected ? (island?.color || "#8b5cf6") : "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8em",
                        fontWeight: "bold",
                        flexShrink: 0,
                      }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Drag & Drop Game */}
          {currentGame.type === "drag_drop" && (
            <div>
              <h3 style={{
                color: "white",
                fontSize: "1.05em",
                marginBottom: "20px",
                textAlign: "center",
              }}>
                {(currentGame as DragDropQuestion).instruction}
              </h3>

              {/* Categories */}
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${(currentGame as DragDropQuestion).categories.length}, 1fr)`,
                gap: "10px",
                marginBottom: "20px",
              }}>
                {(currentGame as DragDropQuestion).categories.map(cat => (
                  <div
                    key={cat.id}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "12px",
                      padding: "10px",
                      textAlign: "center",
                      minHeight: "100px",
                    }}
                  >
                    <div style={{
                      color: island?.color || "#8b5cf6",
                      fontWeight: "bold",
                      fontSize: "0.85em",
                      marginBottom: "10px",
                    }}>
                      {cat.name}
                    </div>
                    {/* Items placed in this category */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {Object.entries(dragDropPlacements)
                        .filter(([_, catId]) => catId === cat.id)
                        .map(([itemId]) => {
                          const item = (currentGame as DragDropQuestion).items.find(i => i.id === itemId);
                          return item ? (
                            <div
                              key={itemId}
                              onClick={() => {
                                if (!showFeedback) {
                                  const newPlacements = { ...dragDropPlacements };
                                  delete newPlacements[itemId];
                                  setDragDropPlacements(newPlacements);
                                }
                              }}
                              style={{
                                background: "rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                padding: "8px",
                                fontSize: "0.8em",
                                color: "white",
                                cursor: showFeedback ? "default" : "pointer",
                              }}
                            >
                              {item.text}
                            </div>
                          ) : null;
                        })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Unplaced Items */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: "center",
              }}>
                {(currentGame as DragDropQuestion).items
                  .filter(item => !dragDropPlacements[item.id])
                  .map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        borderRadius: "10px",
                        padding: "10px 15px",
                        fontSize: "0.85em",
                        color: "white",
                        cursor: showFeedback ? "default" : "pointer",
                      }}
                    >
                      {item.text}
                      {/* Quick category buttons */}
                      {!showFeedback && (
                        <div style={{ display: "flex", gap: "5px", marginTop: "8px" }}>
                          {(currentGame as DragDropQuestion).categories.map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => setDragDropPlacements(p => ({ ...p, [item.id]: cat.id }))}
                              style={{
                                background: island?.color || "#8b5cf6",
                                border: "none",
                                borderRadius: "5px",
                                padding: "4px 8px",
                                color: "white",
                                fontSize: "0.7em",
                                cursor: "pointer",
                              }}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Check Button */}
              {!showFeedback && Object.keys(dragDropPlacements).length === (currentGame as DragDropQuestion).items.length && (
                <button
                  onClick={handleDragDropCheck}
                  style={{
                    width: "100%",
                    marginTop: "20px",
                    background: island?.color || "#8b5cf6",
                    border: "none",
                    borderRadius: "12px",
                    padding: "15px",
                    color: "white",
                    fontSize: "1em",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Check Answer
                </button>
              )}
            </div>
          )}

          {/* Match Pairs Game */}
          {currentGame.type === "match_pairs" && (
            <div>
              <h3 style={{
                color: "white",
                fontSize: "1.05em",
                marginBottom: "20px",
                textAlign: "center",
              }}>
                {(currentGame as MatchPairsQuestion).instruction}
              </h3>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}>
                {/* Left Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(currentGame as MatchPairsQuestion).pairs.map((pair, i) => (
                    <button
                      key={`left-${i}`}
                      onClick={() => !matchedPairs.has(i) && !showFeedback && setSelectedLeftIndex(i)}
                      disabled={matchedPairs.has(i) || showFeedback}
                      style={{
                        background: matchedPairs.has(i)
                          ? "rgba(34, 197, 94, 0.3)"
                          : selectedLeftIndex === i
                          ? `${island?.color}40`
                          : "rgba(255,255,255,0.1)",
                        border: `2px solid ${matchedPairs.has(i) ? "#22c55e" : selectedLeftIndex === i ? island?.color : "transparent"}`,
                        borderRadius: "10px",
                        padding: "12px",
                        color: "white",
                        fontSize: "0.85em",
                        cursor: matchedPairs.has(i) ? "default" : "pointer",
                        textAlign: "left",
                        opacity: matchedPairs.has(i) ? 0.6 : 1,
                      }}
                    >
                      {pair.left}
                    </button>
                  ))}
                </div>

                {/* Right Column (shuffled) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(currentGame as MatchPairsQuestion).pairs.map((pair, i) => (
                    <button
                      key={`right-${i}`}
                      onClick={() => selectedLeftIndex !== null && !matchedPairs.has(selectedLeftIndex) && handleMatchPairSelect(selectedLeftIndex, i)}
                      disabled={matchedPairs.has(i) || selectedLeftIndex === null || showFeedback}
                      style={{
                        background: matchedPairs.has(i)
                          ? "rgba(34, 197, 94, 0.3)"
                          : "rgba(255,255,255,0.1)",
                        border: `2px solid ${matchedPairs.has(i) ? "#22c55e" : "transparent"}`,
                        borderRadius: "10px",
                        padding: "12px",
                        color: "white",
                        fontSize: "0.85em",
                        cursor: matchedPairs.has(i) || selectedLeftIndex === null ? "default" : "pointer",
                        textAlign: "left",
                        opacity: matchedPairs.has(i) ? 0.6 : 1,
                      }}
                    >
                      {pair.right}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fill Blank Game */}
          {currentGame.type === "fill_blank" && (
            <div>
              <h3 style={{
                color: "white",
                fontSize: "1.1em",
                marginBottom: "15px",
                textAlign: "center",
                lineHeight: "1.5",
              }}>
                {(currentGame as FillBlankQuestion).sentence.replace("___", " _______ ")}
              </h3>

              {(currentGame as FillBlankQuestion).context && (
                <p style={{
                  color: "#94a3b8",
                  fontSize: "0.85em",
                  textAlign: "center",
                  marginBottom: "20px",
                  fontStyle: "italic",
                }}>
                  {(currentGame as FillBlankQuestion).context}
                </p>
              )}

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}>
                {(currentGame as FillBlankQuestion).options.map((option, i) => {
                  const isSelected = fillBlankAnswer === option;
                  const isCorrect = option === (currentGame as FillBlankQuestion).correct;
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
                    borderColor = island?.color || "#8b5cf6";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => !showFeedback && handleFillBlankAnswer(option)}
                      disabled={showFeedback}
                      style={{
                        background: bgColor,
                        border: `2px solid ${borderColor}`,
                        borderRadius: "12px",
                        padding: "15px",
                        color: "white",
                        fontSize: "0.95em",
                        cursor: showFeedback ? "default" : "pointer",
                        fontWeight: isSelected ? "bold" : "normal",
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sort Order Game */}
          {currentGame.type === "sort_order" && (
            <div>
              <h3 style={{
                color: "white",
                fontSize: "1.05em",
                marginBottom: "20px",
                textAlign: "center",
              }}>
                {(currentGame as SortOrderQuestion).instruction}
              </h3>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}>
                {sortedItems.map((item, i) => (
                  <div
                    key={`${item}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      padding: "12px",
                    }}
                  >
                    <span style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: island?.color || "#8b5cf6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.85em",
                      fontWeight: "bold",
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, color: "white", fontSize: "0.9em" }}>
                      {item}
                    </span>
                    {!showFeedback && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <button
                          onClick={() => moveSortItem(i, "up")}
                          disabled={i === 0}
                          style={{
                            background: "rgba(255,255,255,0.2)",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            color: "white",
                            cursor: i === 0 ? "default" : "pointer",
                            opacity: i === 0 ? 0.3 : 1,
                          }}
                        >
                          &#9650;
                        </button>
                        <button
                          onClick={() => moveSortItem(i, "down")}
                          disabled={i === sortedItems.length - 1}
                          style={{
                            background: "rgba(255,255,255,0.2)",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            color: "white",
                            cursor: i === sortedItems.length - 1 ? "default" : "pointer",
                            opacity: i === sortedItems.length - 1 ? 0.3 : 1,
                          }}
                        >
                          &#9660;
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!showFeedback && (
                <button
                  onClick={handleSortOrderCheck}
                  style={{
                    width: "100%",
                    marginTop: "20px",
                    background: island?.color || "#8b5cf6",
                    border: "none",
                    borderRadius: "12px",
                    padding: "15px",
                    color: "white",
                    fontSize: "1em",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Check Order
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feedback Panel - positioned above bottom nav with safe area support */}
      {showFeedback && (
        <div
          className={`life-skills-feedback ${feedbackCorrect ? 'correct' : 'incorrect'}`}
          style={{
            position: "fixed",
            bottom: "calc(120px + env(safe-area-inset-bottom, 0px))",
            left: 0,
            right: 0,
            padding: "20px",
            paddingBottom: "calc(25px + env(safe-area-inset-bottom, 0px))",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
            zIndex: 1000,
            background: feedbackCorrect
              ? "linear-gradient(180deg, rgba(34, 197, 94, 0.98), rgba(22, 163, 74, 0.98))"
              : "linear-gradient(180deg, rgba(239, 68, 68, 0.98), rgba(220, 38, 38, 0.98))",
          }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "15px",
          }}>
            <span style={{ fontSize: "2em" }}>
              {feedbackCorrect ? "✅" : "❌"}
            </span>
            <div>
              <div style={{
                color: "white",
                fontWeight: "bold",
                fontSize: "1.1em",
              }}>
                {feedbackCorrect ? "Correct!" : "Not quite..."}
              </div>
              <div style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.9em",
              }}>
                {npcMessage}
              </div>
            </div>
          </div>

          {/* Show explanation for quiz */}
          {currentGame?.type === "quiz" && (currentGame as QuizQuestion).explanation && (
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
                {(currentGame as QuizQuestion).explanation}
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
            {currentGameIndex < totalGames - 1 ? "Next" : "Finish Lesson"}
          </button>
        </div>
      )}
    </div>
  );
}
