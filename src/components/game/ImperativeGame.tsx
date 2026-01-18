"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  GameContainer,
  QuestionCard,
  HintBox,
  Feedback,
  LearningBox,
  OptionButton,
} from "./GameContainer";

const QUESTIONS = [
  { s: "Please clear your desks.", a: "request", h: "'Please' = polite!" },
  { s: "Turn to page 45.", a: "command", h: "Direct order!" },
  { s: "Always say thank you.", a: "command", h: "A rule!" },
  { s: "Pass the ketchup, please.", a: "request", h: "Magic word!" },
  { s: "Put your shoes on.", a: "command", h: "Direct!" },
  { s: "Kindly switch off the lights.", a: "request", h: "'Kindly' = polite" },
  { s: "Be quiet during the test.", a: "command", h: "A rule!" },
  { s: "Take out your homework.", a: "command", h: "Teacher telling!" },
  { s: "Please tidy up.", a: "request", h: "'Please'!" },
  { s: "Listen to instructions.", a: "command", h: "Direct order!" },
];

interface ImperativeGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

export function ImperativeGame({
  onExit,
  onComplete,
  onCorrectAnswer,
  onWrongAnswer,
}: ImperativeGameProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];

  // Advance to next question or complete game
  const advanceToNext = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((i) => i + 1);
      setShowHint(false);
      setFeedback(null);
      setSelectedAnswer(null);
    } else {
      onComplete(correct, mistakes);
    }
  }, [questionIndex, correct, mistakes, onComplete]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const checkAnswer = useCallback(
    (answer: string) => {
      setSelectedAnswer(answer);

      if (answer === currentQuestion.a) {
        setCorrect((c) => c + 1);
        setFeedback({
          type: "success",
          message: `It is a ${currentQuestion.a}!`,
        });
        onCorrectAnswer();

        autoAdvanceTimeoutRef.current = setTimeout(() => {
          if (questionIndex < QUESTIONS.length - 1) {
            setQuestionIndex((i) => i + 1);
            setShowHint(false);
            setFeedback(null);
            setSelectedAnswer(null);
          } else {
            onComplete(correct + 1, mistakes);
          }
          autoAdvanceTimeoutRef.current = null;
        }, 1500);
      } else {
        setMistakes((m) => m + 1);
        setFeedback({
          type: "error",
          message: "Look for polite words!",
        });
        onWrongAnswer();
      }
    },
    [currentQuestion, questionIndex, correct, mistakes, onComplete, onCorrectAnswer, onWrongAnswer]
  );

  const getButtonState = (answer: string) => {
    if (!selectedAnswer) return "default";
    if (answer === currentQuestion.a) return "correct";
    if (answer === selectedAnswer) return "incorrect";
    return "default";
  };

  return (
    <GameContainer
      title="COMMAND SCROLL"
      icon="📜"
      currentQuestion={questionIndex}
      totalQuestions={QUESTIONS.length}
      onExit={onExit}
    >
      <QuestionCard
        questionNumber={questionIndex + 1}
        totalQuestions={QUESTIONS.length}
        label="SCROLL"
      >
        &quot;{currentQuestion.s}&quot;
      </QuestionCard>

      <LearningBox title="📚 KNOWLEDGE:">
        <p>
          <b>Command:</b> Direct order (no &quot;please&quot;)
        </p>
        <p>
          <b>Request:</b> Polite ask (&quot;please&quot;, &quot;kindly&quot;)
        </p>
      </LearningBox>

      <div className="grid grid-cols-2 gap-2.5 my-4 max-[480px]:grid-cols-1">
        <OptionButton
          onClick={() => checkAnswer("command")}
          state={getButtonState("command")}
          disabled={!!selectedAnswer}
        >
          ⚔️ COMMAND
        </OptionButton>
        <OptionButton
          onClick={() => checkAnswer("request")}
          state={getButtonState("request")}
          disabled={!!selectedAnswer}
        >
          🙏 REQUEST
        </OptionButton>
      </div>

      <Button variant="gold" onClick={() => setShowHint(true)}>
        💡 HINT
      </Button>

      <HintBox hint={currentQuestion.h} visible={showHint} />

      <Feedback
        type={feedback?.type || "success"}
        title={feedback?.type === "success" ? "💎 CORRECT!" : "💥 TRY AGAIN!"}
        message={feedback?.message || ""}
        visible={!!feedback}
      />

      {/* Next button - appears after correct answer for mobile users */}
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
