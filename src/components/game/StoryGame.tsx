"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  GameContainer,
  QuestionCard,
  Feedback,
  OptionButton,
} from "./GameContainer";

const STORY = `Lucy wandered around the park, searching for her lost puppy, Max. Everywhere she looked, there was no sign of him. As the sun began to set, she heard a whimper near the lake. Racing over, Lucy found Max, tangled in some bushes. Tears of joy filled her eyes as she hugged him tightly, promising never to let him out of her sight again.`;

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const QUESTIONS = [
  {
    q: "Who was Lucy looking for?",
    a: "Max",
    options: ["Max", "Her cat", "Her friend", "Her mom"],
  },
  {
    q: "Where did Lucy hear a whimper?",
    a: "near the lake",
    options: ["near the lake", "in a tree", "at home", "on the road"],
  },
  {
    q: "What was Max tangled in?",
    a: "bushes",
    options: ["bushes", "ropes", "wires", "grass"],
  },
  {
    q: "How did Lucy feel when she found Max?",
    a: "joyful",
    options: ["joyful", "angry", "scared", "confused"],
  },
  {
    q: "What did Lucy promise?",
    a: "never let Max out of sight",
    options: [
      "never let Max out of sight",
      "buy Max a collar",
      "give Max treats",
      "take Max to the vet",
    ],
  },
];

interface StoryGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

export function StoryGame({
  onExit,
  onComplete,
  onCorrectAnswer,
  onWrongAnswer,
}: StoryGameProps) {
  const [phase, setPhase] = useState<"reading" | "questions">("reading");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];

  // Shuffle options once per question to prevent first-answer-always-correct bug
  const shuffledOptions = useMemo(() => {
    return shuffleArray(currentQuestion.options);
  }, [currentQuestion]);

  const advanceToNext = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((i) => i + 1);
      setFeedback(null);
      setSelectedAnswer(null);
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

  const checkAnswer = useCallback(
    (answer: string) => {
      setSelectedAnswer(answer);
      const isCorrect = answer.toLowerCase() === currentQuestion.a.toLowerCase();

      if (isCorrect) {
        setCorrect((c) => c + 1);
        setFeedback({
          type: "success",
          message: `Correct! "${answer}"`,
        });
        onCorrectAnswer();

        autoAdvanceTimeoutRef.current = setTimeout(() => {
          if (questionIndex < QUESTIONS.length - 1) {
            setQuestionIndex((i) => i + 1);
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
          message: "Read the story again!",
        });
        onWrongAnswer();
      }
    },
    [currentQuestion, questionIndex, correct, mistakes, onComplete, onCorrectAnswer, onWrongAnswer]
  );

  const getButtonState = (answer: string) => {
    if (!selectedAnswer) return "default";
    if (answer.toLowerCase() === currentQuestion.a.toLowerCase()) return "correct";
    if (answer === selectedAnswer) return "incorrect";
    return "default";
  };

  if (phase === "reading") {
    return (
      <GameContainer
        title="STORY QUEST"
        icon="📖"
        currentQuestion={0}
        totalQuestions={QUESTIONS.length}
        onExit={onExit}
      >
        <QuestionCard
          questionNumber={1}
          totalQuestions={1}
          label="📖 READ THE STORY"
        >
          <div className="text-[1.15em] leading-relaxed">{STORY}</div>
        </QuestionCard>

        <div className="text-center mt-4">
          <Button variant="primary" size="lg" onClick={() => setPhase("questions")}>
            📝 START QUESTIONS
          </Button>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="STORY QUEST"
      icon="📖"
      currentQuestion={questionIndex}
      totalQuestions={QUESTIONS.length}
      onExit={onExit}
    >
      <QuestionCard
        questionNumber={questionIndex + 1}
        totalQuestions={QUESTIONS.length}
        label="QUESTION"
      >
        {currentQuestion.q}
      </QuestionCard>

      <div className="grid grid-cols-2 gap-2.5 my-4 max-[480px]:grid-cols-1">
        {shuffledOptions.map((option) => (
          <OptionButton
            key={option}
            onClick={() => checkAnswer(option)}
            state={getButtonState(option)}
            disabled={!!selectedAnswer}
          >
            {option}
          </OptionButton>
        ))}
      </div>

      <Feedback
        type={feedback?.type || "success"}
        title={feedback?.type === "success" ? "💎 CORRECT!" : "💥 TRY AGAIN!"}
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
