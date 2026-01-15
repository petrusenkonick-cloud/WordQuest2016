"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  GameContainer,
  QuestionCard,
  WordBank,
  HintBox,
  Feedback,
} from "./GameContainer";

const QUESTIONS = [
  { s: "Without any end, the road seemed", a: "endless", h: "Goes on forever!" },
  { s: "She felt no hope, she was", a: "hopeless", h: "No hope = hope+less" },
  { s: "Without a care, she was", a: "careless", h: "No cares!" },
  { s: "The broken toy was", a: "useless", h: "Can't use it!" },
  { s: "No water, the land was", a: "waterless", h: "Without water" },
  { s: "No colour, the picture was", a: "colourless", h: "Without colour" },
  { s: "The stray dog was", a: "ownerless", h: "No owner" },
  { s: "Clear sky, it was", a: "cloudless", h: "No clouds!" },
  { s: "Worth nothing, it was", a: "valueless", h: "No value" },
  { s: "Never gets tired, he was", a: "tireless", h: "Never tired!" },
];

const WORD_BANK = [
  "endless", "hopeless", "careless", "useless", "waterless",
  "colourless", "ownerless", "cloudless", "valueless", "tireless", "fearless"
];

interface SuffixGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

export function SuffixGame({
  onExit,
  onComplete,
  onCorrectAnswer,
  onWrongAnswer,
}: SuffixGameProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const currentQuestion = QUESTIONS[questionIndex];

  const checkAnswer = useCallback(() => {
    const userAnswer = answer.toLowerCase().trim();

    if (userAnswer === currentQuestion.a) {
      setCorrect((c) => c + 1);
      setFeedback({
        type: "success",
        message: `"${currentQuestion.a}" = without ${currentQuestion.a.replace("less", "")}!`,
      });
      onCorrectAnswer();

      setTimeout(() => {
        if (questionIndex < QUESTIONS.length - 1) {
          setQuestionIndex((i) => i + 1);
          setAnswer("");
          setShowHint(false);
          setFeedback(null);
        } else {
          onComplete(correct + 1, mistakes);
        }
      }, 1500);
    } else {
      setMistakes((m) => m + 1);
      setFeedback({
        type: "error",
        message: '"-less" = without. Try again!',
      });
      onWrongAnswer();
    }
  }, [answer, currentQuestion, questionIndex, correct, mistakes, onComplete, onCorrectAnswer, onWrongAnswer]);

  return (
    <GameContainer
      title="SUFFIX MINE"
      icon="🪨"
      currentQuestion={questionIndex}
      totalQuestions={QUESTIONS.length}
      onExit={onExit}
    >
      <QuestionCard
        questionNumber={questionIndex + 1}
        totalQuestions={QUESTIONS.length}
      >
        {currentQuestion.s} <span className="text-[var(--diamond)] font-bold">_________</span>
      </QuestionCard>

      <WordBank words={WORD_BANK} onWordClick={(word) => setAnswer(word)} />

      <Input
        variant="game"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type or click answer..."
        onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
        className="mb-3"
      />

      <div className="flex gap-2.5 flex-wrap">
        <Button variant="gold" onClick={() => setShowHint(true)}>
          💡 HINT
        </Button>
        <Button variant="primary" onClick={checkAnswer}>
          ⛏️ MINE!
        </Button>
      </div>

      <HintBox
        hint={currentQuestion.h}
        extraInfo='"-less" = without!'
        visible={showHint}
      />

      <Feedback
        type={feedback?.type || "success"}
        title={feedback?.type === "success" ? "💎 DIAMOND!" : "💥 MISS!"}
        message={feedback?.message || ""}
        visible={!!feedback}
      />
    </GameContainer>
  );
}
