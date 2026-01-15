"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  GameContainer,
  QuestionCard,
  Feedback,
  LearningBox,
} from "./GameContainer";

const WORD_PAIRS = [
  ["Helpless", "Speechless"],
  ["Merciless", "Fruitless"],
  ["Tireless", "Stainless"],
  ["Shameless", "Countless"],
  ["Mirror", "Circumstance"],
  ["Irritate", "Require"],
  ["Whirl", "Miracle"],
  ["Furnish", "Nurture"],
  ["Pure", "Curve"],
  ["Current", "Obscure"],
];

interface VocabularyGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

export function VocabularyGame({
  onExit,
  onComplete,
  onCorrectAnswer,
  onWrongAnswer,
}: VocabularyGameProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const currentPair = WORD_PAIRS[questionIndex];

  const checkAnswer = useCallback(() => {
    const userAnswer = answer.trim().toLowerCase();
    const hasWord1 = userAnswer.includes(currentPair[0].toLowerCase());
    const hasWord2 = userAnswer.includes(currentPair[1].toLowerCase());
    const isLongEnough = answer.split(" ").length >= 5;

    if (hasWord1 && hasWord2 && isLongEnough) {
      setCorrect((c) => c + 1);
      setFeedback({
        type: "success",
        message: "Great sentence!",
      });
      onCorrectAnswer();

      setTimeout(() => {
        if (questionIndex < WORD_PAIRS.length - 1) {
          setQuestionIndex((i) => i + 1);
          setAnswer("");
          setFeedback(null);
        } else {
          onComplete(correct + 1, mistakes);
        }
      }, 1500);
    } else {
      setMistakes((m) => m + 1);
      let errorMsg = "Try again!";
      if (!hasWord1) errorMsg = `Include "${currentPair[0]}"!`;
      else if (!hasWord2) errorMsg = `Include "${currentPair[1]}"!`;
      else if (!isLongEnough) errorMsg = "Make it longer!";

      setFeedback({
        type: "error",
        message: errorMsg,
      });
      onWrongAnswer();
    }
  }, [answer, currentPair, questionIndex, correct, mistakes, onComplete, onCorrectAnswer, onWrongAnswer]);

  return (
    <GameContainer
      title="CRAFTING TABLE"
      icon="📦"
      currentQuestion={questionIndex}
      totalQuestions={WORD_PAIRS.length}
      onExit={onExit}
    >
      <QuestionCard
        questionNumber={questionIndex + 1}
        totalQuestions={WORD_PAIRS.length}
        label="CRAFT"
      >
        <div>Build sentence with BOTH:</div>
        <div className="flex gap-2.5 mt-2.5 justify-center flex-wrap">
          <span className="bg-[var(--diamond)] text-black px-4 py-2 border-4 border-[#2AC] font-pixel text-[0.5em]">
            {currentPair[0]}
          </span>
          <span className="bg-[var(--gold)] text-black px-4 py-2 border-4 border-[#D4A800] font-pixel text-[0.5em]">
            {currentPair[1]}
          </span>
        </div>
      </QuestionCard>

      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write sentence..."
        className="mb-3"
      />

      <LearningBox title="⚒️ TIPS:">
        <p>• Use BOTH words • Make sense • 5+ words</p>
      </LearningBox>

      <Button variant="primary" onClick={checkAnswer}>
        ⚒️ CRAFT!
      </Button>

      <Feedback
        type={feedback?.type || "success"}
        title={feedback?.type === "success" ? "💎 CRAFTED!" : "💥 TRY AGAIN!"}
        message={feedback?.message || ""}
        visible={!!feedback}
      />
    </GameContainer>
  );
}
