"use client";

import React, { useState, useCallback } from "react";
import type {
  HomeworkQuestion,
  MultipleChoiceQuestion,
  FillBlankQuestion,
  WritingShortQuestion,
  TrueFalseQuestion,
  MatchingQuestion,
  OrderingQuestion,
  ReadingComprehensionQuestion,
  FillBlanksMultiQuestion,
  WritingSentenceQuestion,
  CorrectionQuestion,
  CategorizationQuestion,
  AnswerValue,
} from "@/types/homework";

// Common styles
const styles = {
  textInput: {
    width: "100%",
    padding: "16px",
    fontSize: "1.1em",
    borderRadius: "12px",
    border: "2px solid rgba(139, 92, 246, 0.4)",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    outline: "none",
  },
  checkButton: {
    padding: "14px 32px",
    fontSize: "1.1em",
    fontWeight: "bold" as const,
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
  },
  optionButton: {
    padding: "16px 20px",
    fontSize: "1em",
    borderRadius: "12px",
    border: "2px solid rgba(139, 92, 246, 0.4)",
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)",
    color: "#e2e8f0",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left" as const,
  },
  selectedOption: {
    border: "2px solid #8b5cf6",
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(99, 102, 241, 0.4) 100%)",
    transform: "scale(1.02)",
  },
  correctOption: {
    border: "2px solid #22c55e",
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%)",
  },
  wrongOption: {
    border: "2px solid #ef4444",
    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)",
  },
  passageBox: {
    background: "rgba(30, 41, 59, 0.8)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    maxHeight: "250px",
    overflowY: "auto" as const,
  },
  sentenceWithBlank: {
    fontSize: "1.1em",
    lineHeight: 1.8,
    color: "#e2e8f0",
    marginBottom: "16px",
  },
  blankUnderline: {
    display: "inline-block",
    minWidth: "80px",
    borderBottom: "2px solid #8b5cf6",
    margin: "0 4px",
    padding: "2px 8px",
    textAlign: "center" as const,
  },
  categoryBox: {
    background: "rgba(30, 41, 59, 0.6)",
    borderRadius: "12px",
    padding: "16px",
    minHeight: "120px",
    border: "2px dashed rgba(139, 92, 246, 0.4)",
  },
  draggableItem: {
    padding: "10px 16px",
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)",
    borderRadius: "8px",
    border: "1px solid rgba(139, 92, 246, 0.4)",
    cursor: "grab",
    marginBottom: "8px",
  },
};

interface RendererProps {
  question: HomeworkQuestion;
  onAnswer: (answer: AnswerValue) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  isCorrect?: boolean;
  selectedAnswer?: AnswerValue | null;
}

/**
 * Multiple Choice Renderer
 */
export function MultipleChoiceRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
  isCorrect,
  selectedAnswer,
}: RendererProps) {
  const q = question as MultipleChoiceQuestion;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      {q.options?.map((option) => {
        const isSelected = selectedAnswer === option;
        const optionStyle = {
          ...styles.optionButton,
          ...(isSelected && !showFeedback ? styles.selectedOption : {}),
          ...(showFeedback && isSelected && isCorrect ? styles.correctOption : {}),
          ...(showFeedback && isSelected && !isCorrect ? styles.wrongOption : {}),
          opacity: disabled && !isSelected ? 0.5 : 1,
        };

        return (
          <button
            key={option}
            onClick={() => !disabled && onAnswer(option)}
            disabled={disabled}
            style={optionStyle}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Fill Blank Renderer (with or without word bank)
 */
export function FillBlankRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
  isCorrect,
  selectedAnswer,
}: RendererProps) {
  const q = question as FillBlankQuestion;
  const [inputValue, setInputValue] = useState("");
  const hasWordBank = q.options && q.options.length > 0;

  // Render sentence with blank highlighted
  const renderSentence = () => {
    if (!q.sentence) return null;
    const parts = q.sentence.split("___");
    return (
      <div style={styles.sentenceWithBlank}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span style={styles.blankUnderline}>
                {typeof selectedAnswer === 'string' ? selectedAnswer : "______"}
              </span>
            )}
          </span>
        ))}
      </div>
    );
  };

  if (hasWordBank) {
    // Word bank mode - show buttons
    return (
      <div>
        {renderSentence()}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "10px" }}>
          {q.options!.map((option) => {
            const isSelected = selectedAnswer === option;
            const optionStyle = {
              ...styles.optionButton,
              ...(isSelected && !showFeedback ? styles.selectedOption : {}),
              ...(showFeedback && isSelected && isCorrect ? styles.correctOption : {}),
              ...(showFeedback && isSelected && !isCorrect ? styles.wrongOption : {}),
              opacity: disabled && !isSelected ? 0.5 : 1,
              textAlign: "center" as const,
            };

            return (
              <button
                key={option}
                onClick={() => !disabled && onAnswer(option)}
                disabled={disabled}
                style={optionStyle}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Text input mode
  return (
    <div>
      {renderSentence()}
      <div style={{ display: "flex", gap: "12px" }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && onAnswer(inputValue)}
          placeholder="Type your answer..."
          disabled={disabled}
          style={{
            ...styles.textInput,
            flex: 1,
            ...(showFeedback && isCorrect ? { borderColor: "#22c55e" } : {}),
            ...(showFeedback && !isCorrect ? { borderColor: "#ef4444" } : {}),
          }}
        />
        <button
          onClick={() => onAnswer(inputValue)}
          disabled={disabled || !inputValue.trim()}
          style={{
            ...styles.checkButton,
            opacity: disabled || !inputValue.trim() ? 0.5 : 1,
          }}
        >
          CHECK
        </button>
      </div>
    </div>
  );
}

/**
 * Writing Short Renderer
 */
export function WritingShortRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
  isCorrect,
}: RendererProps) {
  const q = question as WritingShortQuestion;
  const [inputValue, setInputValue] = useState("");

  return (
    <div>
      {q.maxWords && (
        <p style={{ color: "#94a3b8", fontSize: "0.85em", marginBottom: "8px" }}>
          Maximum {q.maxWords} words
        </p>
      )}
      <div style={{ display: "flex", gap: "12px" }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && onAnswer(inputValue)}
          placeholder="Type your answer..."
          disabled={disabled}
          style={{
            ...styles.textInput,
            flex: 1,
            ...(showFeedback && isCorrect ? { borderColor: "#22c55e" } : {}),
            ...(showFeedback && !isCorrect ? { borderColor: "#ef4444" } : {}),
          }}
        />
        <button
          onClick={() => onAnswer(inputValue)}
          disabled={disabled || !inputValue.trim()}
          style={{
            ...styles.checkButton,
            opacity: disabled || !inputValue.trim() ? 0.5 : 1,
          }}
        >
          CHECK
        </button>
      </div>
    </div>
  );
}

/**
 * True/False Renderer
 */
export function TrueFalseRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
  isCorrect,
  selectedAnswer,
}: RendererProps) {
  const q = question as TrueFalseQuestion;

  const renderButton = (value: boolean, label: string, emoji: string) => {
    const isSelected = selectedAnswer === String(value);
    const isThisCorrect = q.correctValue === value;

    return (
      <button
        onClick={() => !disabled && onAnswer(String(value))}
        disabled={disabled}
        style={{
          flex: 1,
          padding: "24px",
          fontSize: "1.3em",
          fontWeight: "bold",
          borderRadius: "16px",
          border: isSelected ? "3px solid" : "2px solid",
          borderColor: showFeedback && isSelected
            ? (isCorrect ? "#22c55e" : "#ef4444")
            : isSelected
              ? "#8b5cf6"
              : "rgba(139, 92, 246, 0.4)",
          background: showFeedback && isSelected
            ? (isCorrect ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)")
            : isSelected
              ? "rgba(139, 92, 246, 0.3)"
              : "rgba(139, 92, 246, 0.1)",
          color: "#e2e8f0",
          cursor: disabled ? "default" : "pointer",
          transition: "all 0.2s ease",
          opacity: disabled && !isSelected ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: "1.5em", display: "block", marginBottom: "8px" }}>{emoji}</span>
        {label}
        {showFeedback && isThisCorrect && !isSelected && (
          <span style={{ fontSize: "0.7em", display: "block", marginTop: "4px", color: "#22c55e" }}>
            (Correct answer)
          </span>
        )}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", gap: "16px" }}>
      {renderButton(true, "TRUE", "✓")}
      {renderButton(false, "FALSE", "✗")}
    </div>
  );
}

/**
 * Matching Renderer
 */
export function MatchingRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
}: RendererProps) {
  const q = question as MatchingQuestion;
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});

  // Safety check - if question doesn't have required properties, show error
  if (!q.leftColumn || !q.rightColumn || !q.correctPairs) {
    console.error("MatchingRenderer: Invalid question format", q);
    return (
      <div style={{ color: "#ef4444", padding: "20px", textAlign: "center" }}>
        <p>Invalid matching question format</p>
        <p style={{ fontSize: "0.8em", color: "#888" }}>Missing required columns. Please try a different question.</p>
      </div>
    );
  }

  const handleLeftClick = (id: string) => {
    if (disabled) return;
    setSelectedLeft(selectedLeft === id ? null : id);
  };

  const handleRightClick = (id: string) => {
    if (disabled || !selectedLeft) return;

    const newPairs = { ...pairs, [selectedLeft]: id };
    setPairs(newPairs);
    setSelectedLeft(null);

    // Check if all pairs are matched
    if (Object.keys(newPairs).length === q.leftColumn.length) {
      onAnswer(newPairs);
    }
  };

  const getLeftStatus = (id: string) => {
    if (pairs[id]) return "matched";
    if (selectedLeft === id) return "selected";
    return "default";
  };

  const getRightStatus = (id: string) => {
    const matchedBy = Object.entries(pairs).find(([, right]) => right === id);
    if (matchedBy) return "matched";
    return "default";
  };

  const isCorrectPair = (leftId: string, rightId: string) => {
    return q.correctPairs.some(p => p.left === leftId && p.right === rightId);
  };

  return (
    <div>
      <p style={{ color: "#a5b4fc", fontSize: "0.9em", marginBottom: "16px" }}>
        Tap a word on the left, then tap its match on the right
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {q.leftColumn.map((item) => {
            const status = getLeftStatus(item.id);
            const pairedRight = pairs[item.id];
            const isPairCorrect = pairedRight ? isCorrectPair(item.id, pairedRight) : false;

            return (
              <button
                key={item.id}
                onClick={() => handleLeftClick(item.id)}
                disabled={disabled}
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: "2px solid",
                  borderColor: status === "selected"
                    ? "#fbbf24"
                    : status === "matched" && showFeedback
                      ? (isPairCorrect ? "#22c55e" : "#ef4444")
                      : status === "matched"
                        ? "#8b5cf6"
                        : "rgba(139, 92, 246, 0.4)",
                  background: status === "selected"
                    ? "rgba(251, 191, 36, 0.2)"
                    : status === "matched"
                      ? "rgba(139, 92, 246, 0.2)"
                      : "rgba(30, 41, 59, 0.6)",
                  color: "#e2e8f0",
                  cursor: disabled ? "default" : "pointer",
                  fontSize: "1em",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{
                  background: "rgba(139, 92, 246, 0.3)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "0.85em",
                }}>
                  {item.id}
                </span>
                {item.text}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {q.rightColumn.map((item) => {
            const status = getRightStatus(item.id);
            const matchedByLeft = Object.entries(pairs).find(([, right]) => right === item.id)?.[0];
            const isPairCorrect = matchedByLeft ? isCorrectPair(matchedByLeft, item.id) : false;

            return (
              <button
                key={item.id}
                onClick={() => handleRightClick(item.id)}
                disabled={disabled || status === "matched"}
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: "2px solid",
                  borderColor: status === "matched" && showFeedback
                    ? (isPairCorrect ? "#22c55e" : "#ef4444")
                    : status === "matched"
                      ? "#8b5cf6"
                      : selectedLeft
                        ? "rgba(251, 191, 36, 0.6)"
                        : "rgba(139, 92, 246, 0.4)",
                  background: status === "matched"
                    ? "rgba(139, 92, 246, 0.2)"
                    : selectedLeft
                      ? "rgba(251, 191, 36, 0.1)"
                      : "rgba(30, 41, 59, 0.6)",
                  color: "#e2e8f0",
                  cursor: disabled || status === "matched" ? "default" : "pointer",
                  fontSize: "1em",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: status === "matched" && !selectedLeft ? 0.7 : 1,
                }}
              >
                <span style={{
                  background: "rgba(96, 165, 250, 0.3)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "0.85em",
                }}>
                  {item.id}
                </span>
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Show current pairs */}
      {Object.keys(pairs).length > 0 && (
        <div style={{
          marginTop: "16px",
          padding: "12px",
          background: "rgba(139, 92, 246, 0.1)",
          borderRadius: "8px",
        }}>
          <p style={{ color: "#a5b4fc", fontSize: "0.85em", margin: "0 0 8px 0" }}>
            Your matches:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {Object.entries(pairs).map(([left, right]) => (
              <span
                key={left}
                style={{
                  padding: "4px 10px",
                  background: showFeedback
                    ? (isCorrectPair(left, right) ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)")
                    : "rgba(139, 92, 246, 0.3)",
                  borderRadius: "6px",
                  fontSize: "0.9em",
                  color: "#e2e8f0",
                }}
              >
                {left} → {right}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Ordering Renderer
 */
export function OrderingRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
}: RendererProps) {
  const q = question as OrderingQuestion;
  const [orderedItems, setOrderedItems] = useState<string[]>([...q.items]);

  const moveItem = useCallback((index: number, direction: "up" | "down") => {
    if (disabled) return;
    const newOrder = [...orderedItems];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;

    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setOrderedItems(newOrder);
  }, [orderedItems, disabled]);

  const submitOrder = () => {
    onAnswer(orderedItems);
  };

  const isItemCorrect = (item: string, index: number) => {
    return q.correctOrder[index] === item;
  };

  return (
    <div>
      <p style={{ color: "#a5b4fc", fontSize: "0.9em", marginBottom: "16px" }}>
        Use the arrows to put items in the correct order, then click CHECK
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        {orderedItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              background: showFeedback
                ? (isItemCorrect(item, index) ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)")
                : "rgba(139, 92, 246, 0.15)",
              borderRadius: "10px",
              border: showFeedback
                ? (isItemCorrect(item, index) ? "2px solid #22c55e" : "2px solid #ef4444")
                : "2px solid rgba(139, 92, 246, 0.3)",
            }}
          >
            {/* Position number */}
            <span style={{
              background: showFeedback
                ? (isItemCorrect(item, index) ? "#22c55e" : "#ef4444")
                : "#8b5cf6",
              color: "white",
              padding: "4px 10px",
              borderRadius: "6px",
              fontWeight: "bold",
              minWidth: "30px",
              textAlign: "center",
            }}>
              {index + 1}
            </span>

            {/* Item text */}
            <span style={{ flex: 1, color: "#e2e8f0", fontSize: "1em" }}>
              {item}
            </span>

            {/* Move buttons */}
            {!disabled && (
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  style={{
                    padding: "6px 10px",
                    background: index === 0 ? "rgba(100, 100, 100, 0.3)" : "rgba(139, 92, 246, 0.3)",
                    border: "none",
                    borderRadius: "6px",
                    color: "white",
                    cursor: index === 0 ? "default" : "pointer",
                    opacity: index === 0 ? 0.4 : 1,
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveItem(index, "down")}
                  disabled={index === orderedItems.length - 1}
                  style={{
                    padding: "6px 10px",
                    background: index === orderedItems.length - 1 ? "rgba(100, 100, 100, 0.3)" : "rgba(139, 92, 246, 0.3)",
                    border: "none",
                    borderRadius: "6px",
                    color: "white",
                    cursor: index === orderedItems.length - 1 ? "default" : "pointer",
                    opacity: index === orderedItems.length - 1 ? 0.4 : 1,
                  }}
                >
                  ↓
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <button onClick={submitOrder} style={styles.checkButton}>
          CHECK ORDER
        </button>
      )}
    </div>
  );
}

/**
 * Reading Comprehension Renderer
 */
export function ReadingComprehensionRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
}: RendererProps) {
  const q = question as ReadingComprehensionQuestion;
  const [currentSubIndex, setCurrentSubIndex] = useState(0);
  const [subAnswers, setSubAnswers] = useState<Record<number, string>>({});

  const currentSub = q.subQuestions[currentSubIndex];
  const isLastSub = currentSubIndex === q.subQuestions.length - 1;

  const handleSubAnswer = (answer: string | string[] | Record<string, string> | Record<string, string[]> | boolean) => {
    const newAnswers = { ...subAnswers, [currentSubIndex]: String(answer) };
    setSubAnswers(newAnswers);

    if (isLastSub) {
      // Format all answers for submission
      const formattedAnswer = q.subQuestions
        .map((_, i) => `${String.fromCharCode(97 + i)}) ${newAnswers[i] || ""}`)
        .join("\n");
      onAnswer(formattedAnswer);
    } else {
      // Move to next sub-question
      setTimeout(() => setCurrentSubIndex(currentSubIndex + 1), 500);
    }
  };

  return (
    <div>
      {/* Passage */}
      <div style={styles.passageBox}>
        {q.passageTitle && (
          <h4 style={{ color: "#a5b4fc", marginTop: 0, marginBottom: "12px" }}>
            {q.passageTitle}
          </h4>
        )}
        <p style={{ color: "#cbd5e1", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
          {q.passage}
        </p>
      </div>

      {/* Progress */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "16px",
      }}>
        {q.subQuestions.map((_, i) => (
          <div
            key={i}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: i < currentSubIndex
                ? "#22c55e"
                : i === currentSubIndex
                  ? "#8b5cf6"
                  : "rgba(139, 92, 246, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75em",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {i < currentSubIndex ? "✓" : String.fromCharCode(97 + i)}
          </div>
        ))}
      </div>

      {/* Current sub-question */}
      {currentSub && (
        <div>
          <p style={{ color: "#e2e8f0", fontSize: "1.1em", marginBottom: "16px" }}>
            <span style={{ color: "#a5b4fc", fontWeight: "bold" }}>
              {String.fromCharCode(97 + currentSubIndex)})
            </span>{" "}
            {currentSub.text}
          </p>

          {/* Render appropriate input based on sub-question type */}
          {currentSub.type === "multiple_choice" && currentSub.options && (
            <MultipleChoiceRenderer
              question={currentSub as unknown as HomeworkQuestion}
              onAnswer={handleSubAnswer}
              disabled={disabled}
              showFeedback={showFeedback}
              selectedAnswer={subAnswers[currentSubIndex]}
            />
          )}
          {(currentSub.type === "writing_short" || currentSub.type === "fill_blank") && (
            <WritingShortRenderer
              question={currentSub as unknown as HomeworkQuestion}
              onAnswer={handleSubAnswer}
              disabled={disabled}
              showFeedback={showFeedback}
            />
          )}
          {currentSub.type === "true_false" && (
            <TrueFalseRenderer
              question={currentSub as unknown as HomeworkQuestion}
              onAnswer={handleSubAnswer}
              disabled={disabled}
              showFeedback={showFeedback}
              selectedAnswer={subAnswers[currentSubIndex]}
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Fill Blanks Multi Renderer
 */
export function FillBlanksMultiRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
}: RendererProps) {
  const q = question as FillBlanksMultiQuestion;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeBlank, setActiveBlank] = useState<string | null>(q.blanks[0]?.id || null);

  const hasWordBank = q.options && q.options.length > 0;

  const handleInput = (blankId: string, value: string) => {
    const newAnswers = { ...answers, [blankId]: value };
    setAnswers(newAnswers);

    // Auto-advance to next blank
    const currentIndex = q.blanks.findIndex(b => b.id === blankId);
    if (currentIndex < q.blanks.length - 1) {
      setActiveBlank(q.blanks[currentIndex + 1].id);
    }
  };

  const handleWordBankClick = (word: string) => {
    if (!activeBlank || disabled) return;
    handleInput(activeBlank, word);
  };

  const handleSubmit = () => {
    onAnswer(answers);
  };

  // Render sentence with blanks
  const renderSentence = () => {
    const result: React.ReactElement[] = [];
    let remaining = q.sentence;

    q.blanks.forEach((blank) => {
      const marker = `___${blank.id}___`;
      const parts = remaining.split(marker);
      if (parts.length > 1) {
        result.push(<span key={`text-${blank.id}`}>{parts[0]}</span>);
        result.push(
          <span
            key={`blank-${blank.id}`}
            onClick={() => !disabled && setActiveBlank(blank.id)}
            style={{
              ...styles.blankUnderline,
              cursor: disabled ? "default" : "pointer",
              borderColor: activeBlank === blank.id ? "#fbbf24" : "#8b5cf6",
              background: activeBlank === blank.id ? "rgba(251, 191, 36, 0.2)" : "transparent",
              minWidth: "60px",
            }}
          >
            {answers[blank.id] || `(${blank.id})`}
          </span>
        );
        remaining = parts.slice(1).join(marker);
      }
    });
    result.push(<span key="remaining">{remaining}</span>);

    return <div style={styles.sentenceWithBlank}>{result}</div>;
  };

  const allFilled = q.blanks.every(b => answers[b.id]?.trim());

  return (
    <div>
      {renderSentence()}

      {hasWordBank ? (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "16px",
        }}>
          {q.options!.map((word) => {
            const isUsed = Object.values(answers).includes(word);
            return (
              <button
                key={word}
                onClick={() => handleWordBankClick(word)}
                disabled={disabled || isUsed}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "2px solid rgba(139, 92, 246, 0.4)",
                  background: isUsed
                    ? "rgba(100, 100, 100, 0.2)"
                    : "rgba(139, 92, 246, 0.15)",
                  color: isUsed ? "#64748b" : "#e2e8f0",
                  cursor: disabled || isUsed ? "default" : "pointer",
                  opacity: isUsed ? 0.5 : 1,
                  textDecoration: isUsed ? "line-through" : "none",
                }}
              >
                {word}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ marginBottom: "16px" }}>
          {q.blanks.map((blank) => (
            <div key={blank.id} style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#a5b4fc", fontWeight: "bold", minWidth: "30px" }}>
                ({blank.id})
              </span>
              <input
                type="text"
                value={answers[blank.id] || ""}
                onChange={(e) => handleInput(blank.id, e.target.value)}
                disabled={disabled}
                placeholder={`Answer for blank ${blank.id}`}
                style={{
                  ...styles.textInput,
                  flex: 1,
                  padding: "10px 14px",
                }}
              />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled || !allFilled}
        style={{
          ...styles.checkButton,
          opacity: disabled || !allFilled ? 0.5 : 1,
        }}
      >
        CHECK ANSWERS
      </button>
    </div>
  );
}

/**
 * Writing Sentence Renderer
 */
export function WritingSentenceRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
  isCorrect,
}: RendererProps) {
  const q = question as WritingSentenceQuestion;
  const [inputValue, setInputValue] = useState("");

  const wordCount = inputValue.trim().split(/\s+/).filter(w => w).length;

  return (
    <div>
      {q.keyElements && q.keyElements.length > 0 && (
        <p style={{ color: "#a5b4fc", fontSize: "0.9em", marginBottom: "8px" }}>
          Include: {q.keyElements.join(", ")}
        </p>
      )}
      {(q.minWords || q.maxWords) && (
        <p style={{
          color: wordCount < (q.minWords || 0) || wordCount > (q.maxWords || 999)
            ? "#fbbf24"
            : "#94a3b8",
          fontSize: "0.85em",
          marginBottom: "8px",
        }}>
          Words: {wordCount}
          {q.minWords && ` (min: ${q.minWords})`}
          {q.maxWords && ` (max: ${q.maxWords})`}
        </p>
      )}
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
        placeholder="Write your sentence here..."
        rows={3}
        style={{
          ...styles.textInput,
          width: "100%",
          resize: "vertical",
          marginBottom: "12px",
          ...(showFeedback && isCorrect ? { borderColor: "#22c55e" } : {}),
          ...(showFeedback && !isCorrect ? { borderColor: "#ef4444" } : {}),
        }}
      />
      <button
        onClick={() => onAnswer(inputValue)}
        disabled={disabled || !inputValue.trim()}
        style={{
          ...styles.checkButton,
          opacity: disabled || !inputValue.trim() ? 0.5 : 1,
        }}
      >
        CHECK
      </button>

      {showFeedback && q.modelAnswer && (
        <div style={{
          marginTop: "16px",
          padding: "12px",
          background: "rgba(96, 165, 250, 0.1)",
          borderRadius: "8px",
          borderLeft: "3px solid #60a5fa",
        }}>
          <p style={{ color: "#93c5fd", fontSize: "0.85em", margin: "0 0 4px 0" }}>Model answer:</p>
          <p style={{ color: "#e2e8f0", margin: 0 }}>{q.modelAnswer}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Correction Renderer
 */
export function CorrectionRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
  isCorrect,
}: RendererProps) {
  const q = question as CorrectionQuestion;
  const [inputValue, setInputValue] = useState(q.errorText);

  return (
    <div>
      <div style={{
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "16px",
      }}>
        <p style={{ color: "#fca5a5", fontSize: "0.85em", margin: "0 0 4px 0" }}>
          Text with errors:
        </p>
        <p style={{ color: "#e2e8f0", margin: 0, fontStyle: "italic" }}>
          {q.errorText}
        </p>
      </div>

      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
        placeholder="Type the corrected text here..."
        rows={3}
        style={{
          ...styles.textInput,
          width: "100%",
          resize: "vertical",
          marginBottom: "12px",
          ...(showFeedback && isCorrect ? { borderColor: "#22c55e" } : {}),
          ...(showFeedback && !isCorrect ? { borderColor: "#ef4444" } : {}),
        }}
      />

      <button
        onClick={() => onAnswer(inputValue)}
        disabled={disabled || inputValue === q.errorText}
        style={{
          ...styles.checkButton,
          opacity: disabled || inputValue === q.errorText ? 0.5 : 1,
        }}
      >
        CHECK CORRECTIONS
      </button>

      {showFeedback && (
        <div style={{
          marginTop: "16px",
          padding: "12px",
          background: "rgba(34, 197, 94, 0.1)",
          borderRadius: "8px",
          borderLeft: "3px solid #22c55e",
        }}>
          <p style={{ color: "#86efac", fontSize: "0.85em", margin: "0 0 4px 0" }}>Correct version:</p>
          <p style={{ color: "#e2e8f0", margin: 0 }}>{q.correctedText}</p>
          {q.errors.length > 0 && (
            <p style={{ color: "#94a3b8", fontSize: "0.8em", marginTop: "8px", marginBottom: 0 }}>
              Errors: {q.errors.map(e => `"${e.original}" → "${e.correction}"`).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Categorization Renderer
 */
export function CategorizationRenderer({
  question,
  onAnswer,
  disabled,
  showFeedback,
}: RendererProps) {
  const q = question as CategorizationQuestion;
  const [categorized, setCategorized] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    q.categories.forEach(c => initial[c.name] = []);
    return initial;
  });
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const uncategorized = q.items.filter(
    item => !Object.values(categorized).flat().includes(item)
  );

  const handleItemClick = (item: string) => {
    if (disabled) return;
    setSelectedItem(selectedItem === item ? null : item);
  };

  const handleCategoryClick = (categoryName: string) => {
    if (!selectedItem || disabled) return;

    // Remove from other categories first
    const newCategorized = { ...categorized };
    Object.keys(newCategorized).forEach(cat => {
      newCategorized[cat] = newCategorized[cat].filter(i => i !== selectedItem);
    });

    // Add to selected category
    newCategorized[categoryName] = [...newCategorized[categoryName], selectedItem];
    setCategorized(newCategorized);
    setSelectedItem(null);
  };

  const handleSubmit = () => {
    onAnswer(categorized);
  };

  const isItemCorrect = (item: string, categoryName: string) => {
    const category = q.categories.find(c => c.name === categoryName);
    return category?.correctItems.includes(item) || false;
  };

  const allCategorized = uncategorized.length === 0;

  return (
    <div>
      {/* Uncategorized items */}
      {uncategorized.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#a5b4fc", fontSize: "0.9em", marginBottom: "10px" }}>
            Tap an item, then tap the category it belongs to:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {uncategorized.map((item) => (
              <button
                key={item}
                onClick={() => handleItemClick(item)}
                style={{
                  ...styles.draggableItem,
                  borderColor: selectedItem === item ? "#fbbf24" : "rgba(139, 92, 246, 0.4)",
                  background: selectedItem === item
                    ? "rgba(251, 191, 36, 0.2)"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)",
                  cursor: disabled ? "default" : "pointer",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(q.categories.length, 3)}, 1fr)`,
        gap: "16px",
        marginBottom: "16px",
      }}>
        {q.categories.map((category) => (
          <div key={category.name}>
            <button
              onClick={() => handleCategoryClick(category.name)}
              disabled={disabled || !selectedItem}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "8px",
                background: selectedItem
                  ? "rgba(251, 191, 36, 0.2)"
                  : "rgba(139, 92, 246, 0.2)",
                border: selectedItem
                  ? "2px solid rgba(251, 191, 36, 0.6)"
                  : "2px solid rgba(139, 92, 246, 0.4)",
                borderRadius: "8px",
                color: "#e2e8f0",
                fontWeight: "bold",
                cursor: disabled || !selectedItem ? "default" : "pointer",
              }}
            >
              {category.name}
            </button>
            <div style={styles.categoryBox}>
              {categorized[category.name].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: "6px 10px",
                    background: showFeedback
                      ? (isItemCorrect(item, category.name) ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)")
                      : "rgba(139, 92, 246, 0.2)",
                    borderRadius: "6px",
                    marginBottom: "4px",
                    fontSize: "0.9em",
                    color: "#e2e8f0",
                    border: showFeedback
                      ? (isItemCorrect(item, category.name) ? "1px solid #22c55e" : "1px solid #ef4444")
                      : "1px solid rgba(139, 92, 246, 0.3)",
                  }}
                >
                  {item}
                </div>
              ))}
              {categorized[category.name].length === 0 && (
                <p style={{ color: "#64748b", fontSize: "0.85em", textAlign: "center", margin: "20px 0" }}>
                  Drop items here
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || !allCategorized}
        style={{
          ...styles.checkButton,
          opacity: disabled || !allCategorized ? 0.5 : 1,
        }}
      >
        CHECK CATEGORIES
      </button>
    </div>
  );
}

/**
 * Main Question Renderer - dispatches to appropriate renderer
 */
export function QuestionRenderer(props: RendererProps) {
  const { question } = props;

  switch (question.type) {
    case "multiple_choice":
      return <MultipleChoiceRenderer {...props} />;
    case "fill_blank":
      return <FillBlankRenderer {...props} />;
    case "writing_short":
      return <WritingShortRenderer {...props} />;
    case "true_false":
      return <TrueFalseRenderer {...props} />;
    case "matching": {
      // Validate matching question has required properties
      const matchQ = question as MatchingQuestion;
      if (!matchQ.leftColumn || !matchQ.rightColumn || !matchQ.correctPairs) {
        console.error("QuestionRenderer: Invalid matching question", matchQ);
        return (
          <div style={{ color: "#ef4444", padding: "20px", textAlign: "center" }}>
            <p>Invalid matching question format</p>
            <p style={{ fontSize: "0.8em", color: "#888" }}>This question is corrupted. Please skip it.</p>
          </div>
        );
      }
      return <MatchingRenderer {...props} />;
    }
    case "ordering":
      return <OrderingRenderer {...props} />;
    case "reading_comprehension":
      return <ReadingComprehensionRenderer {...props} />;
    case "fill_blanks_multi":
      return <FillBlanksMultiRenderer {...props} />;
    case "writing_sentence":
      return <WritingSentenceRenderer {...props} />;
    case "correction":
      return <CorrectionRenderer {...props} />;
    case "categorization":
      return <CategorizationRenderer {...props} />;
    default:
      // Fallback to multiple choice for unknown types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyQuestion = question as any;
      if (anyQuestion.options && Array.isArray(anyQuestion.options)) {
        return <MultipleChoiceRenderer {...props} />;
      }
      // Or text input for questions without options
      return <WritingShortRenderer {...props} />;
  }
}
