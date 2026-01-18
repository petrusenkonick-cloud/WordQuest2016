"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  GameContainer,
  QuestionCard,
  HintBox,
  Feedback,
  LearningBox,
} from "./GameContainer";

const QUESTIONS = [
  { a: "I have two cats.", h: "How many...", ex: "How many cats do you have?" },
  { a: "My favorite colour is blue.", h: "What is your...", ex: "What is your favorite colour?" },
  { a: "I play soccer on Saturdays.", h: "When do you...", ex: "When do you play soccer?" },
  { a: "By bus.", h: "How do you...", ex: "How do you get there?" },
  { a: "In the morning.", h: "When...", ex: "When do you wake up?" },
  { a: "At the library.", h: "Where...", ex: "Where do you study?" },
  { a: "Because it's fun!", h: "Why...", ex: "Why do you like it?" },
];

const QUESTION_WORDS = ["who", "what", "when", "where", "why", "how", "did", "do", "does", "is", "are", "can"];

interface InterrogativeGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

export function InterrogativeGame({
  onExit,
  onComplete,
  onCorrectAnswer,
  onWrongAnswer,
}: InterrogativeGameProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];

  const advanceToNext = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((i) => i + 1);
      setAnswer("");
      setShowHint(false);
      setFeedback(null);
    } else {
      onComplete(correct, mistakes);
    }
  }, [questionIndex, correct, mistakes, onComplete]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const checkAnswer = useCallback(() => {
    const userAnswer = answer.trim();
    const isQuestion = userAnswer.endsWith("?");
    const hasQuestionWord = QUESTION_WORDS.some((w) =>
      userAnswer.toLowerCase().startsWith(w)
    );
    const isLongEnough = userAnswer.length > 5;

    if (isQuestion && hasQuestionWord && isLongEnough) {
      setCorrect((c) => c + 1);
      setFeedback({
        type: "success",
        message: `"${userAnswer}"`,
      });
      onCorrectAnswer();

      autoAdvanceTimeoutRef.current = setTimeout(() => {
        if (questionIndex < QUESTIONS.length - 1) {
          setQuestionIndex((i) => i + 1);
          setAnswer("");
          setShowHint(false);
          setFeedback(null);
        } else {
          onComplete(correct + 1, mistakes);
        }
        autoAdvanceTimeoutRef.current = null;
      }, 1800);
    } else {
      setMistakes((m) => m + 1);
      let errorMsg = "Try again!";
      if (!isQuestion) errorMsg = "Add ? at the end!";
      else if (!hasQuestionWord) errorMsg = "Start with a question word!";
      else if (!isLongEnough) errorMsg = "Make it longer!";

      setFeedback({
        type: "error",
        message: errorMsg,
      });
      onWrongAnswer();
    }
  }, [answer, questionIndex, correct, mistakes, onComplete, onCorrectAnswer, onWrongAnswer]);

  return (
    <GameContainer
      title="QUESTION FORGE"
      icon="❓"
      currentQuestion={questionIndex}
      totalQuestions={QUESTIONS.length}
      onExit={onExit}
    >
      <QuestionCard
        questionNumber={questionIndex + 1}
        totalQuestions={QUESTIONS.length}
        label="FORGE"
      >
        <div>Create a question for:</div>
        <div className="bg-[#2D1810] text-[var(--emerald)] p-2.5 mt-2.5 border-[3px] border-[#1a0f08] text-[1.15em]">
          &quot;{currentQuestion.a}&quot;
        </div>
      </QuestionCard>

      <LearningBox title="🔧 QUESTION WORDS:">
        <p>Who? What? When? Where? Why? How?</p>
      </LearningBox>

      <Input
        variant="game"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your question..."
        onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
        className="mb-3"
      />

      <div className="flex gap-2.5 flex-wrap">
        <Button variant="gold" onClick={() => setShowHint(true)}>
          💡 HINT
        </Button>
        <Button variant="primary" onClick={checkAnswer}>
          🔨 FORGE!
        </Button>
      </div>

      <HintBox
        hint={`Try: "${currentQuestion.h}"`}
        extraInfo={`Example: "${currentQuestion.ex}"`}
        visible={showHint}
      />

      <Feedback
        type={feedback?.type || "success"}
        title={feedback?.type === "success" ? "💎 GREAT!" : "💥 TRY AGAIN!"}
        message={feedback?.message || ""}
        visible={!!feedback}
      />

      {feedback?.type === "success" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Button
            variant="emerald"
            size="lg"
            onClick={advanceToNext}
            className="w-full text-[1.1em]"
          >
            {questionIndex < QUESTIONS.length - 1 ? "NEXT →" : "FINISH ✓"}
          </Button>
        </motion.div>
      )}
    </GameContainer>
  );
}
