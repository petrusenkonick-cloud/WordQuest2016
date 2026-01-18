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
} from "./GameContainer";
import { cn } from "@/lib/utils";

// Questions organized by difficulty - Updated for 2026
const QUESTIONS = {
  easy: [
    { s: "Check if my spelling is correct", a: "ai", h: "Can AI check words?", ex: "AI is great at checking spelling quickly and accurately!" },
    { s: "Decide what game to play with friends", a: "yourself", h: "Who knows what YOU like?", ex: "Personal preferences are YOUR choice - AI doesn't know what's fun for you!" },
    { s: "Find the capital city of France", a: "ai", h: "Is this a fact question?", ex: "AI can quickly find factual information like geography!" },
    { s: "Choose my favorite ice cream flavor", a: "yourself", h: "Who knows your taste buds?", ex: "Only YOU know what YOU like to eat!" },
    { s: "Help me understand a difficult word", a: "ai", h: "Can AI explain things?", ex: "AI is excellent at explaining words and concepts clearly!" },
    { s: "Pick which friend to invite to my party", a: "yourself", h: "Who knows your friendships?", ex: "Relationships are personal - only you understand your friendships!" },
    { s: "Calculate 247 + 589", a: "ai", h: "Is this math?", ex: "AI can do math calculations instantly and accurately!" },
    { s: "Decide if I should forgive my friend", a: "yourself", h: "This is about YOUR feelings...", ex: "Forgiveness is a personal emotional decision only you can make!" },
    { s: "Find when dinosaurs lived", a: "ai", h: "Is this a fact?", ex: "AI can quickly provide historical and scientific facts!" },
    { s: "Choose what to draw in art class", a: "yourself", h: "Whose creativity is it?", ex: "Creative expression should come from YOUR imagination!" },
  ],
  medium: [
    { s: "Write my entire essay for me", a: "yourself", h: "Learning happens when YOU do it!", ex: "Writing yourself helps you learn - AI writing for you skips the learning!" },
    { s: "Get ideas for a science project", a: "ai", h: "Ideas vs. doing the work...", ex: "AI can brainstorm ideas, but you should develop and execute them!" },
    { s: "Summarize a long article I need to read", a: "ai", h: "Is it okay to get the main points?", ex: "AI can help you understand key points when you're short on time!" },
    { s: "Decide if I should try out for the team", a: "yourself", h: "Who knows your goals and fears?", ex: "Life decisions about your future should come from you!" },
    { s: "Check my homework answers", a: "ai", h: "Checking is different from doing...", ex: "Having AI verify your work is fine - just do the work first!" },
    { s: "Form my opinion on a news topic", a: "yourself", h: "Whose opinion should it be?", ex: "Your opinions should come from YOUR thinking, not AI!" },
    { s: "Learn how photosynthesis works", a: "ai", h: "Can AI teach concepts?", ex: "AI can explain scientific concepts clearly and at your level!" },
    { s: "Decide what to say in an apology to my friend", a: "yourself", h: "Does AI know your friendship?", ex: "Apologies need YOUR genuine words and feelings!" },
    { s: "Find examples of metaphors in literature", a: "ai", h: "Is this research?", ex: "AI can quickly find and explain literary examples!" },
    { s: "Choose my classes for next year", a: "yourself", h: "Who knows your interests?", ex: "Education choices should match YOUR goals and interests!" },
  ],
  hard: [
    { s: "Help me practice for a job interview", a: "ai", h: "Practice is different from the real thing...", ex: "AI can help you prepare with mock questions, but bring YOUR authentic self to the interview!" },
    { s: "Make an important decision about my future career", a: "yourself", h: "Whose life is it?", ex: "Major life decisions must come from your own values and dreams!" },
    { s: "Analyze data from my science experiment", a: "ai", h: "Is this calculation or interpretation?", ex: "AI can help analyze data, but you should interpret what it means!" },
    { s: "Decide whether to speak up about something unfair", a: "yourself", h: "Courage comes from within...", ex: "Standing up for what's right requires YOUR moral judgment!" },
    { s: "Generate a first draft to edit and improve", a: "ai", h: "Starting point vs. final product...", ex: "Using AI for drafts is fine if YOU do the critical editing!" },
    { s: "Form my political or social views", a: "yourself", h: "Who shapes your beliefs?", ex: "Your worldview should develop through YOUR thinking and experiences!" },
    { s: "Debug code that isn't working", a: "ai", h: "Can AI find errors?", ex: "AI excels at finding bugs - but learn from WHY it was wrong!" },
    { s: "Choose whether to end a friendship", a: "yourself", h: "Relationships are deeply personal...", ex: "Relationship decisions require YOUR emotional wisdom!" },
    { s: "Research current events for a report", a: "ai", h: "Facts vs. opinions...", ex: "AI can gather facts, but verify from multiple sources and form your own conclusions!" },
    { s: "Decide what values are most important to me", a: "yourself", h: "Values define who YOU are...", ex: "Personal values must come from YOUR own reflection and growth!" },
  ],
};

type Difficulty = "easy" | "medium" | "hard";

interface AIHelperGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

// Robot vs Brain Visual
function DecisionVisual({
  state,
  isAnimating,
}: {
  state: "idle" | "ai" | "yourself";
  isAnimating: boolean;
}) {
  return (
    <div className="flex justify-center items-center gap-8 my-4">
      {/* AI Robot */}
      <motion.div
        className="flex flex-col items-center"
        animate={{
          scale: state === "ai" ? 1.2 : 1,
          opacity: state === "yourself" ? 0.4 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="text-5xl"
          animate={
            state === "ai" && isAnimating
              ? { rotate: [0, -10, 10, 0], y: [0, -10, 0] }
              : {}
          }
        >
          🤖
        </motion.div>
        {state === "ai" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[#4AEDD9] font-pixel text-[0.5em] mt-2"
          >
            AI HELPS!
          </motion.div>
        )}
      </motion.div>

      {/* VS */}
      <motion.div
        className="text-2xl font-pixel text-white/50"
        animate={{ scale: isAnimating ? [1, 1.2, 1] : 1 }}
      >
        VS
      </motion.div>

      {/* Brain/Human */}
      <motion.div
        className="flex flex-col items-center"
        animate={{
          scale: state === "yourself" ? 1.2 : 1,
          opacity: state === "ai" ? 0.4 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="text-5xl"
          animate={
            state === "yourself" && isAnimating
              ? { rotate: [0, 10, -10, 0], y: [0, -10, 0] }
              : {}
          }
        >
          🧠
        </motion.div>
        {state === "yourself" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[#FFD700] font-pixel text-[0.5em] mt-2"
          >
            YOU DECIDE!
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Difficulty Selector
function DifficultySelector({
  onSelect,
}: {
  onSelect: (difficulty: Difficulty) => void;
}) {
  const difficulties = [
    {
      id: "easy" as Difficulty,
      label: "AI BEGINNER",
      ages: "Ages 6-8",
      icon: "🌱",
      color: "from-[#4CAF50] to-[#2E7D32]",
      borderColor: "#4CAF50",
      description: "Simple choices: facts vs. feelings",
    },
    {
      id: "medium" as Difficulty,
      label: "AI LEARNER",
      ages: "Ages 9-11",
      icon: "🌿",
      color: "from-[#2196F3] to-[#1565C0]",
      borderColor: "#2196F3",
      description: "Trickier: learning vs. shortcuts",
    },
    {
      id: "hard" as Difficulty,
      label: "AI WISE USER",
      ages: "Ages 12+",
      icon: "🌳",
      color: "from-[#9C27B0] to-[#6A1B9A]",
      borderColor: "#9C27B0",
      description: "Complex: ethics and judgment",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <div className="text-center mb-8">
        <motion.div
          className="text-6xl mb-4 flex justify-center gap-2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span>🤖</span>
          <span>❓</span>
          <span>🧠</span>
        </motion.div>
        <h1 className="font-pixel text-[1.1em] text-white mb-2">AI HELPER</h1>
        <p className="text-white/70 text-[1em]">When to use AI vs. do it yourself?</p>
      </div>

      <div className="grid gap-4">
        {difficulties.map((diff, index) => (
          <motion.button
            key={diff.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(diff.id)}
            className={cn(
              "relative overflow-hidden p-4 border-4 text-left transition-all",
              `bg-gradient-to-r ${diff.color}`
            )}
            style={{
              borderColor: diff.borderColor,
              boxShadow: `0 0 20px ${diff.borderColor}40, inset 2px 2px 0 rgba(255,255,255,0.2), 4px 4px 0 rgba(0,0,0,0.4)`,
            }}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{diff.icon}</span>
              <div className="flex-1">
                <div className="font-pixel text-[0.7em] text-white">{diff.label}</div>
                <div className="text-white/80 text-[0.85em]">{diff.ages}</div>
                <div className="text-white/60 text-[0.75em] mt-1">{diff.description}</div>
              </div>
              <motion.span
                className="text-2xl text-white/80"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                →
              </motion.span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Choice Button
function ChoiceButton({
  type,
  onClick,
  state,
  disabled,
}: {
  type: "ai" | "yourself";
  onClick: () => void;
  state: "default" | "correct" | "incorrect";
  disabled: boolean;
}) {
  const isAI = type === "ai";

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05, y: -3 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={state === "incorrect" ? { x: [-5, 5, -5, 5, 0] } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative p-5 border-4 text-white w-full transition-all flex flex-col items-center gap-2",
        state === "correct" &&
          "bg-gradient-to-b from-[#50FF7F] via-[#17D049] to-[#0C9430] border-[#085020] shadow-[0_0_30px_rgba(23,208,73,0.6)]",
        state === "incorrect" &&
          "bg-gradient-to-b from-[#FF6666] via-[#FF1A1A] to-[#AA0000] border-[#550000] shadow-[0_0_30px_rgba(255,26,26,0.6)]",
        state === "default" && isAI &&
          "bg-gradient-to-b from-[#5AFFEF] via-[#4AEDD9] to-[#2BA89D] border-[#1A6B60] shadow-[inset_3px_3px_0_rgba(255,255,255,0.3),4px_4px_0_rgba(0,0,0,0.4)] hover:shadow-[0_0_25px_rgba(74,237,217,0.5)]",
        state === "default" && !isAI &&
          "bg-gradient-to-b from-[#FFD700] via-[#FFA500] to-[#FF8C00] border-[#CC7000] shadow-[inset_3px_3px_0_rgba(255,255,255,0.3),4px_4px_0_rgba(0,0,0,0.4)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)]",
        disabled && state === "default" && "opacity-60 cursor-not-allowed"
      )}
    >
      <motion.span
        className="text-4xl"
        animate={state === "default" && !disabled ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isAI ? "🤖" : "🧠"}
      </motion.span>
      <span className="font-pixel text-[0.6em] tracking-wider">
        {isAI ? "ASK AI" : "DO YOURSELF"}
      </span>
      <span className="text-[0.65em] text-white/80">
        {isAI ? "AI can help with this" : "This needs YOUR judgment"}
      </span>
      {state !== "default" && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute top-2 right-2 text-2xl"
        >
          {state === "correct" ? "✅" : "❌"}
        </motion.div>
      )}
    </motion.button>
  );
}

export function AIHelperGame({
  onExit,
  onComplete,
  onCorrectAnswer,
  onWrongAnswer,
}: AIHelperGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [visualState, setVisualState] = useState<"idle" | "ai" | "yourself">("idle");
  const [isAnimating, setIsAnimating] = useState(false);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const questions = difficulty ? QUESTIONS[difficulty] : [];
  const currentQuestion = questions[questionIndex];

  const advanceToNext = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      setShowHint(false);
      setFeedback(null);
      setSelectedAnswer(null);
      setVisualState("idle");
    } else {
      onComplete(correct, mistakes);
    }
  }, [questionIndex, questions.length, correct, mistakes, onComplete]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const checkAnswer = useCallback(
    (answer: string) => {
      if (selectedAnswer) return;

      setSelectedAnswer(answer);
      setVisualState(answer as "ai" | "yourself");
      setIsAnimating(true);

      setTimeout(() => setIsAnimating(false), 500);

      if (answer === currentQuestion.a) {
        setCorrect((c) => c + 1);
        setFeedback({
          type: "success",
          message: currentQuestion.ex,
        });
        onCorrectAnswer();

        autoAdvanceTimeoutRef.current = setTimeout(() => {
          if (questionIndex < questions.length - 1) {
            setQuestionIndex((i) => i + 1);
            setShowHint(false);
            setFeedback(null);
            setSelectedAnswer(null);
            setVisualState("idle");
          } else {
            onComplete(correct + 1, mistakes);
          }
          autoAdvanceTimeoutRef.current = null;
        }, 2500);
      } else {
        setMistakes((m) => m + 1);
        setFeedback({
          type: "error",
          message: "Think: Does this need human judgment or is it a task AI can handle?",
        });
        onWrongAnswer();
      }
    },
    [currentQuestion, questionIndex, correct, mistakes, questions.length, onComplete, onCorrectAnswer, onWrongAnswer, selectedAnswer]
  );

  const getButtonState = (answer: string) => {
    if (!selectedAnswer) return "default";
    if (answer === currentQuestion.a) return "correct";
    if (answer === selectedAnswer) return "incorrect";
    return "default";
  };

  if (!difficulty) {
    return (
      <div
        className="bg-gradient-to-b from-[#4A3728] via-[#3A2A1A] to-[#2A1A0A] border-6 border-[#5D4030] p-4"
        style={{
          boxShadow: "inset 4px 4px 0 rgba(255,255,255,0.15), inset -4px -4px 0 rgba(0,0,0,0.4), 8px 8px 0 rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex justify-end mb-4">
          <Button variant="stone" size="sm" onClick={onExit}>
            ← EXIT
          </Button>
        </div>
        <DifficultySelector onSelect={setDifficulty} />
      </div>
    );
  }

  const difficultyLabels = {
    easy: { name: "AI BEGINNER", icon: "🌱" },
    medium: { name: "AI LEARNER", icon: "🌿" },
    hard: { name: "AI WISE USER", icon: "🌳" },
  };

  return (
    <GameContainer
      title={`AI HELPER: ${difficultyLabels[difficulty].name}`}
      icon="🤖"
      currentQuestion={questionIndex}
      totalQuestions={questions.length}
      onExit={onExit}
    >
      {/* Decision Visual */}
      <DecisionVisual state={visualState} isAnimating={isAnimating} />

      {/* Task Card */}
      <QuestionCard
        questionNumber={questionIndex + 1}
        totalQuestions={questions.length}
        label="TASK"
      >
        <div className="text-[1.1em] leading-relaxed">
          &quot;{currentQuestion.s}&quot;
        </div>
      </QuestionCard>

      {/* Learning Box */}
      <LearningBox title="💡 THINK:">
        <div className="text-[0.85em] grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span>🤖</span>
            <span>Facts, calculations, research</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🧠</span>
            <span>Feelings, choices, creativity</span>
          </div>
        </div>
      </LearningBox>

      {/* Choice Buttons */}
      <div className="grid grid-cols-2 gap-4 my-4">
        <ChoiceButton
          type="ai"
          onClick={() => checkAnswer("ai")}
          state={getButtonState("ai")}
          disabled={!!selectedAnswer}
        />
        <ChoiceButton
          type="yourself"
          onClick={() => checkAnswer("yourself")}
          state={getButtonState("yourself")}
          disabled={!!selectedAnswer}
        />
      </div>

      {/* Hint */}
      {!showHint && !selectedAnswer && (
        <div className="text-center">
          <Button variant="gold" onClick={() => setShowHint(true)}>
            💡 NEED A HINT?
          </Button>
        </div>
      )}

      <HintBox hint={currentQuestion.h} visible={showHint && !selectedAnswer} />

      <Feedback
        type={feedback?.type || "success"}
        title={feedback?.type === "success" ? "🎯 CORRECT!" : "🤔 TRY AGAIN!"}
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
            {questionIndex < questions.length - 1 ? "NEXT →" : "FINISH ✓"}
          </Button>
        </motion.div>
      )}
    </GameContainer>
  );
}
