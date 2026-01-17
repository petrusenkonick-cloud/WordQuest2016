"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  GameContainer,
  QuestionCard,
  HintBox,
  Feedback,
  LearningBox,
} from "./GameContainer";
import { cn } from "@/lib/utils";

// Questions organized by difficulty
const QUESTIONS = {
  easy: [
    { s: "The sun is hot.", a: "fact", h: "Can we measure it? Yes!", ex: "We can measure temperature - it's 5,500°C!" },
    { s: "Pizza is the best food.", a: "opinion", h: "Everyone thinks differently!", ex: "Some people prefer sushi or tacos!" },
    { s: "Dogs have four legs.", a: "fact", h: "Count them!", ex: "You can count and verify this." },
    { s: "Blue is the prettiest color.", a: "opinion", h: "Do you agree? Not everyone does!", ex: "Colors are personal preferences." },
    { s: "Fish live in water.", a: "fact", h: "Where do you see fish?", ex: "This can be observed and proven." },
    { s: "Homework is boring.", a: "opinion", h: "Some kids like it!", ex: "Different people feel differently about homework." },
    { s: "The moon comes out at night.", a: "fact", h: "Look up tonight!", ex: "We can observe this every night." },
    { s: "Chocolate tastes better than vanilla.", a: "opinion", h: "What's YOUR favorite?", ex: "Taste is personal - not everyone agrees!" },
    { s: "Birds can fly.", a: "fact", h: "Watch them in the sky!", ex: "Most birds can fly - we can see this." },
    { s: "Cats are cuter than dogs.", a: "opinion", h: "Dog lovers disagree!", ex: "Cuteness is in the eye of the beholder!" },
  ],
  medium: [
    { s: "Water boils at 100°C.", a: "fact", h: "Science tells us this!", ex: "This is a measurable scientific fact." },
    { s: "Summer is the best season.", a: "opinion", h: "Winter lovers exist!", ex: "Season preferences vary by person." },
    { s: "Kazakhstan is in Asia.", a: "fact", h: "Check a map!", ex: "Geography can be verified on any map." },
    { s: "Video games are a waste of time.", a: "opinion", h: "Many disagree!", ex: "Value judgments are opinions." },
    { s: "The Earth orbits the Sun.", a: "fact", h: "Astronomy proves this!", ex: "Scientific observation confirms this." },
    { s: "Reading is more fun than watching TV.", a: "opinion", h: "People enjoy different things!", ex: "'More fun' is subjective." },
    { s: "There are 7 continents on Earth.", a: "fact", h: "Can you name them?", ex: "This is verifiable geographic information." },
    { s: "Math is the hardest subject.", a: "opinion", h: "Some find art harder!", ex: "Difficulty is subjective to each person." },
    { s: "Whales are mammals, not fish.", a: "fact", h: "Biology lesson!", ex: "Scientific classification proves this." },
    { s: "Everyone should learn to code.", a: "opinion", h: "'Should' = someone's view!", ex: "This is a recommendation, not a fact." },
  ],
  hard: [
    { s: "Climate change is caused by human activities.", a: "fact", h: "97% of scientists agree!", ex: "Scientific consensus based on evidence." },
    { s: "We should ban single-use plastics.", a: "opinion", h: "'Should' = policy view!", ex: "Policy recommendations are opinions." },
    { s: "The Great Wall of China is visible from space.", a: "opinion", h: "Actually debated!", ex: "This is a myth - astronauts say it's not visible!" },
    { s: "Social media is harmful to teenagers.", a: "opinion", h: "Studies show mixed results!", ex: "Value judgments about harm are opinions." },
    { s: "The human body has 206 bones.", a: "fact", h: "Anatomy textbooks confirm!", ex: "Medical science has counted this." },
    { s: "AI will replace most jobs.", a: "opinion", h: "Predictions aren't facts!", ex: "Future predictions are opinions until proven." },
    { s: "Light travels at 299,792 km per second.", a: "fact", h: "Physics constant!", ex: "Measured and verified by scientists." },
    { s: "Classical music is better than pop music.", a: "opinion", h: "Music taste varies!", ex: "Quality judgments in art are subjective." },
    { s: "The Pacific Ocean is the largest ocean.", a: "fact", h: "Measure it!", ex: "Size can be measured and compared." },
    { s: "Schools should start later in the morning.", a: "opinion", h: "'Should' = someone's belief!", ex: "Policy suggestions are opinions." },
  ],
};

type Difficulty = "easy" | "medium" | "hard";

interface FactFinderGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

// Truth Crystal Component - glows based on selection
function TruthCrystal({
  state,
  isAnimating
}: {
  state: "idle" | "fact" | "opinion";
  isAnimating: boolean;
}) {
  return (
    <motion.div
      className="relative flex justify-center my-6"
      animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      {/* Crystal base */}
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 blur-xl"
          animate={{
            backgroundColor: state === "fact"
              ? "rgba(74, 237, 217, 0.6)"
              : state === "opinion"
                ? "rgba(180, 120, 255, 0.6)"
                : "rgba(150, 150, 150, 0.3)",
            scale: isAnimating ? [1, 1.5, 1] : 1,
          }}
          transition={{ duration: 0.5 }}
          style={{ width: 80, height: 100, borderRadius: "50%" }}
        />

        {/* Crystal shape */}
        <motion.div
          className="relative z-10"
          style={{
            width: 0,
            height: 0,
            borderLeft: "40px solid transparent",
            borderRight: "40px solid transparent",
            borderBottom: state === "fact"
              ? "80px solid #4AEDD9"
              : state === "opinion"
                ? "80px solid #B478FF"
                : "80px solid #888",
            filter: "drop-shadow(0 0 10px currentColor)",
          }}
          animate={{
            rotate: isAnimating ? [0, 5, -5, 0] : 0,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Inner shine */}
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 w-4 h-8 bg-white/40 blur-sm"
          style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
        />

        {/* Floating particles around crystal */}
        {isAnimating && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: state === "fact" ? "#4AEDD9" : "#B478FF",
                  left: "50%",
                  top: "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * 60 * Math.PI) / 180) * 60,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 60 - 20,
                  opacity: 0,
                  scale: [1, 0],
                }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            ))}
          </>
        )}
      </div>

      {/* Label under crystal */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-pixel text-[0.5em] tracking-wider"
        animate={{
          color: state === "fact"
            ? "#4AEDD9"
            : state === "opinion"
              ? "#B478FF"
              : "#888",
        }}
      >
        {state === "idle" ? "TRUTH CRYSTAL" : state === "fact" ? "✓ FACT" : "✧ OPINION"}
      </motion.div>
    </motion.div>
  );
}

// Difficulty Selector Component
function DifficultySelector({
  onSelect
}: {
  onSelect: (difficulty: Difficulty) => void;
}) {
  const difficulties = [
    {
      id: "easy" as Difficulty,
      label: "APPRENTICE",
      ages: "Ages 6-8",
      icon: "🌟",
      color: "from-[#4CAF50] to-[#2E7D32]",
      borderColor: "#4CAF50",
      description: "Simple facts about everyday things"
    },
    {
      id: "medium" as Difficulty,
      label: "SCHOLAR",
      ages: "Ages 9-11",
      icon: "📚",
      color: "from-[#FF9800] to-[#E65100]",
      borderColor: "#FF9800",
      description: "Science, geography, and more"
    },
    {
      id: "hard" as Difficulty,
      label: "TRUTH MASTER",
      ages: "Ages 12+",
      icon: "🔮",
      color: "from-[#9C27B0] to-[#6A1B9A]",
      borderColor: "#9C27B0",
      description: "Tricky statements that challenge you"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      {/* Title */}
      <div className="text-center mb-8">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🔍
        </motion.div>
        <h1 className="font-pixel text-[1.1em] text-white mb-2">FACT FINDER</h1>
        <p className="text-white/70 text-[1em]">Choose your challenge level</p>
      </div>

      {/* Difficulty cards */}
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
              boxShadow: `
                0 0 20px ${diff.borderColor}40,
                inset 2px 2px 0 rgba(255,255,255,0.2),
                inset -2px -2px 0 rgba(0,0,0,0.3),
                4px 4px 0 rgba(0,0,0,0.4)
              `,
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

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Custom Option Button for Fact/Opinion
function FactOpinionButton({
  type,
  onClick,
  state,
  disabled,
}: {
  type: "fact" | "opinion";
  onClick: () => void;
  state: "default" | "correct" | "incorrect";
  disabled: boolean;
}) {
  const isFact = type === "fact";

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05, y: -3 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={state === "incorrect" ? { x: [-5, 5, -5, 5, 0] } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative p-5 text-[1.3em] font-game border-4 text-white w-full transition-all duration-150",
        "flex flex-col items-center gap-2",
        state === "correct" && `
          bg-gradient-to-b from-[#50FF7F] via-[#17D049] to-[#0C9430]
          border-[#085020]
          shadow-[0_0_30px_rgba(23,208,73,0.6)]
        `,
        state === "incorrect" && `
          bg-gradient-to-b from-[#FF6666] via-[#FF1A1A] to-[#AA0000]
          border-[#550000]
          shadow-[0_0_30px_rgba(255,26,26,0.6)]
        `,
        state === "default" && isFact && `
          bg-gradient-to-b from-[#5AFFEF] via-[#4AEDD9] to-[#2BA89D]
          border-[#1A6B60]
          shadow-[inset_3px_3px_0_rgba(255,255,255,0.3),inset_-3px_-3px_0_rgba(0,0,0,0.2),4px_4px_0_rgba(0,0,0,0.4)]
          hover:shadow-[0_0_25px_rgba(74,237,217,0.5),inset_3px_3px_0_rgba(255,255,255,0.3),4px_4px_0_rgba(0,0,0,0.4)]
        `,
        state === "default" && !isFact && `
          bg-gradient-to-b from-[#D4A0FF] via-[#B478FF] to-[#8B4FC9]
          border-[#5A2D8A]
          shadow-[inset_3px_3px_0_rgba(255,255,255,0.3),inset_-3px_-3px_0_rgba(0,0,0,0.2),4px_4px_0_rgba(0,0,0,0.4)]
          hover:shadow-[0_0_25px_rgba(180,120,255,0.5),inset_3px_3px_0_rgba(255,255,255,0.3),4px_4px_0_rgba(0,0,0,0.4)]
        `,
        disabled && state === "default" && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Icon */}
      <motion.span
        className="text-4xl"
        animate={state === "default" && !disabled ? {
          rotate: isFact ? [0, -10, 10, 0] : [0, 10, -10, 0],
          scale: [1, 1.1, 1]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isFact ? "📊" : "💭"}
      </motion.span>

      {/* Label */}
      <span className="font-pixel text-[0.6em] tracking-wider">
        {isFact ? "FACT" : "OPINION"}
      </span>

      {/* Subtitle */}
      <span className="text-[0.65em] text-white/80">
        {isFact ? "Can be proven" : "Personal view"}
      </span>

      {/* Success/Error icon overlay */}
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

export function FactFinderGame({
  onExit,
  onComplete,
  onCorrectAnswer,
  onWrongAnswer,
}: FactFinderGameProps) {
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
  const [crystalState, setCrystalState] = useState<"idle" | "fact" | "opinion">("idle");
  const [isAnimating, setIsAnimating] = useState(false);

  const questions = difficulty ? QUESTIONS[difficulty] : [];
  const currentQuestion = questions[questionIndex];

  const checkAnswer = useCallback(
    (answer: string) => {
      if (selectedAnswer) return;

      setSelectedAnswer(answer);
      setCrystalState(answer as "fact" | "opinion");
      setIsAnimating(true);

      setTimeout(() => {
        setIsAnimating(false);
      }, 500);

      if (answer === currentQuestion.a) {
        setCorrect((c) => c + 1);
        setFeedback({
          type: "success",
          message: currentQuestion.ex,
        });
        onCorrectAnswer();

        setTimeout(() => {
          if (questionIndex < questions.length - 1) {
            setQuestionIndex((i) => i + 1);
            setShowHint(false);
            setFeedback(null);
            setSelectedAnswer(null);
            setCrystalState("idle");
          } else {
            onComplete(correct + 1, mistakes);
          }
        }, 2500);
      } else {
        setMistakes((m) => m + 1);
        setFeedback({
          type: "error",
          message: "Think: Can this be PROVEN or is it a BELIEF?",
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

  // Difficulty selection screen
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
    easy: { name: "APPRENTICE", icon: "🌟" },
    medium: { name: "SCHOLAR", icon: "📚" },
    hard: { name: "TRUTH MASTER", icon: "🔮" },
  };

  return (
    <GameContainer
      title={`FACT FINDER: ${difficultyLabels[difficulty].name}`}
      icon="🔍"
      currentQuestion={questionIndex}
      totalQuestions={questions.length}
      onExit={onExit}
    >
      {/* Truth Crystal */}
      <TruthCrystal state={crystalState} isAnimating={isAnimating} />

      {/* Question Card */}
      <QuestionCard
        questionNumber={questionIndex + 1}
        totalQuestions={questions.length}
        label="STATEMENT"
      >
        &quot;{currentQuestion.s}&quot;
      </QuestionCard>

      {/* Learning Box */}
      <LearningBox title="🧠 REMEMBER:">
        <div className="grid grid-cols-2 gap-3 text-[0.9em]">
          <div className="flex items-center gap-2">
            <span className="text-[#4AEDD9]">📊</span>
            <span><b>FACT</b> = Can be proven true/false</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#B478FF]">💭</span>
            <span><b>OPINION</b> = Personal belief/feeling</span>
          </div>
        </div>
      </LearningBox>

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-4 my-5">
        <FactOpinionButton
          type="fact"
          onClick={() => checkAnswer("fact")}
          state={getButtonState("fact")}
          disabled={!!selectedAnswer}
        />
        <FactOpinionButton
          type="opinion"
          onClick={() => checkAnswer("opinion")}
          state={getButtonState("opinion")}
          disabled={!!selectedAnswer}
        />
      </div>

      {/* Hint Button */}
      {!showHint && !selectedAnswer && (
        <div className="text-center">
          <Button variant="gold" onClick={() => setShowHint(true)}>
            💡 NEED A HINT?
          </Button>
        </div>
      )}

      {/* Hint Box */}
      <HintBox hint={currentQuestion.h} visible={showHint && !selectedAnswer} />

      {/* Feedback */}
      <Feedback
        type={feedback?.type || "success"}
        title={feedback?.type === "success" ? "💎 TRUTH REVEALED!" : "💥 NOT QUITE!"}
        message={feedback?.message || ""}
        visible={!!feedback}
      />
    </GameContainer>
  );
}
