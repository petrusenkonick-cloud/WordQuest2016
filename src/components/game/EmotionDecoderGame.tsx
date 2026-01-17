"use client";

import { useState, useCallback } from "react";
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
    { s: "Tom's ice cream fell on the ground.", a: "sad", h: "How would YOU feel?", ex: "Losing something you were enjoying makes us sad.", emotions: ["sad", "angry", "scared", "happy"] },
    { s: "Emma got a new puppy for her birthday!", a: "happy", h: "New puppy = ?", ex: "Getting something wonderful makes us happy!", emotions: ["sad", "happy", "scared", "confused"] },
    { s: "Max heard a loud thunder outside.", a: "scared", h: "Loud noises can be...", ex: "Sudden loud sounds can make us feel scared.", emotions: ["happy", "angry", "scared", "sad"] },
    { s: "Someone took Lucy's favorite toy without asking.", a: "angry", h: "When people take our things...", ex: "It's normal to feel angry when someone takes what's ours.", emotions: ["sad", "angry", "happy", "confused"] },
    { s: "Jake doesn't know where his mom went.", a: "confused", h: "Not knowing makes us...", ex: "When we don't understand something, we feel confused.", emotions: ["happy", "confused", "angry", "sad"] },
    { s: "Mia's grandma gave her a big warm hug.", a: "happy", h: "Hugs from loved ones...", ex: "Love and warmth from family makes us happy!", emotions: ["scared", "sad", "happy", "angry"] },
    { s: "Leo's balloon flew away into the sky.", a: "sad", h: "Watching something go away...", ex: "Losing something we liked makes us feel sad.", emotions: ["angry", "sad", "happy", "confused"] },
    { s: "A big dog ran towards Sophie barking loudly.", a: "scared", h: "Big unknown animals can be...", ex: "Unknown situations can make us feel scared.", emotions: ["happy", "scared", "angry", "sad"] },
    { s: "Ben's friend broke his favorite crayon on purpose.", a: "angry", h: "When someone hurts us on purpose...", ex: "It's okay to feel angry when someone does something mean.", emotions: ["sad", "angry", "happy", "confused"] },
    { s: "Amy got a gold star on her homework.", a: "happy", h: "Getting praise for good work...", ex: "Recognition for our efforts makes us happy and proud!", emotions: ["scared", "happy", "sad", "angry"] },
  ],
  medium: [
    { s: "Sara studied all week but still got a bad grade.", a: "frustrated", h: "Trying hard but not succeeding...", ex: "Frustration comes when effort doesn't match results.", emotions: ["sad", "frustrated", "angry", "confused"] },
    { s: "Mike's team lost the game in the last second.", a: "disappointed", h: "Almost winning but losing...", ex: "When expectations aren't met, we feel disappointed.", emotions: ["angry", "disappointed", "scared", "happy"] },
    { s: "Lily has to give a speech in front of the whole school.", a: "nervous", h: "Before doing something big...", ex: "Anticipation of a challenge makes us nervous.", emotions: ["happy", "nervous", "angry", "sad"] },
    { s: "Jack's best friend is playing with someone else today.", a: "jealous", h: "When friends spend time with others...", ex: "Jealousy is natural when we want attention.", emotions: ["jealous", "happy", "scared", "angry"] },
    { s: "Emma helped her little brother learn to ride a bike.", a: "proud", h: "Helping others succeed...", ex: "Pride comes from making a positive difference!", emotions: ["sad", "proud", "nervous", "angry"] },
    { s: "Noah's parents said they might move to a new city.", a: "worried", h: "Uncertain changes ahead...", ex: "Unknown futures can make us feel worried.", emotions: ["happy", "angry", "worried", "proud"] },
    { s: "Zoe's friend said sorry after being mean yesterday.", a: "relieved", h: "When problems get solved...", ex: "Relief comes when tensions are resolved.", emotions: ["relieved", "angry", "nervous", "sad"] },
    { s: "Tom waited all day but his package never arrived.", a: "disappointed", h: "Waiting and not getting...", ex: "Unmet expectations lead to disappointment.", emotions: ["happy", "disappointed", "scared", "proud"] },
    { s: "Maya's art was chosen to be displayed at school.", a: "proud", h: "Being recognized for talent...", ex: "Achievement recognition brings pride and joy!", emotions: ["nervous", "angry", "proud", "disappointed"] },
    { s: "Ryan doesn't understand the new math lesson at all.", a: "frustrated", h: "When learning feels impossible...", ex: "Struggling to understand causes frustration.", emotions: ["happy", "frustrated", "proud", "relieved"] },
  ],
  hard: [
    { s: "Alex's best friend is moving to another city next month.", a: "bittersweet", h: "Happy for them but sad for yourself...", ex: "Bittersweet means feeling two emotions at once - joy and sadness.", emotions: ["angry", "bittersweet", "scared", "frustrated"] },
    { s: "Kim won the race but her friend came last and is crying.", a: "conflicted", h: "Good for you, bad for someone you care about...", ex: "Conflicted means mixed feelings - happy but also concerned.", emotions: ["happy", "conflicted", "proud", "jealous"] },
    { s: "Sam's grandfather passed away but lived a long happy life.", a: "bittersweet", h: "Sadness mixed with gratitude...", ex: "We can feel sad about loss while grateful for good memories.", emotions: ["angry", "bittersweet", "scared", "relieved"] },
    { s: "Mia finally finished a very difficult book she almost gave up on.", a: "accomplished", h: "Completing something hard...", ex: "Accomplishment is deep satisfaction from overcoming challenges.", emotions: ["tired", "accomplished", "frustrated", "nervous"] },
    { s: "Tyler has to choose between two birthday parties on the same day.", a: "torn", h: "When you can't have both...", ex: "Being torn means struggling with a difficult choice.", emotions: ["happy", "torn", "scared", "proud"] },
    { s: "Jordan found out their science project idea was already done by someone else.", a: "discouraged", h: "When your original idea isn't unique...", ex: "Feeling discouraged is losing motivation after a setback.", emotions: ["angry", "discouraged", "proud", "relieved"] },
    { s: "Casey apologized for something but doesn't really mean it.", a: "insincere", h: "Saying sorry without feeling it...", ex: "Sometimes we say things we don't truly feel - that's being insincere.", emotions: ["happy", "insincere", "scared", "proud"] },
    { s: "Pat is happy to graduate but will miss their school friends.", a: "nostalgic", h: "Happy about change but missing the past...", ex: "Nostalgia is fondly remembering what we're leaving behind.", emotions: ["angry", "nostalgic", "nervous", "jealous"] },
    { s: "Quinn's team won but only because the other team had an injured player.", a: "ambivalent", h: "Winning doesn't feel right...", ex: "Ambivalent means having mixed, uncertain feelings.", emotions: ["proud", "ambivalent", "scared", "happy"] },
    { s: "Robin's painting got second place - better than expected but wanted first.", a: "content", h: "Good but not perfect...", ex: "Content means satisfied, even if it's not exactly what you wanted.", emotions: ["angry", "content", "disappointed", "scared"] },
  ],
};

// Emotion emoji mapping
const EMOTION_EMOJIS: Record<string, string> = {
  // Basic emotions
  happy: "😊",
  sad: "😢",
  angry: "😠",
  scared: "😨",
  confused: "😕",
  // Medium emotions
  frustrated: "😤",
  disappointed: "😞",
  nervous: "😰",
  jealous: "😒",
  proud: "🥹",
  worried: "😟",
  relieved: "😌",
  // Complex emotions
  bittersweet: "🥲",
  conflicted: "😐",
  accomplished: "🏆",
  torn: "💔",
  discouraged: "😔",
  insincere: "😏",
  nostalgic: "🥺",
  ambivalent: "🤔",
  content: "😊",
  tired: "😴",
};

type Difficulty = "easy" | "medium" | "hard";

interface EmotionDecoderGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

// Emotion Heart Component - pulses and changes color based on emotion
function EmotionHeart({
  emotion,
  isAnimating,
}: {
  emotion: string | null;
  isAnimating: boolean;
}) {
  const getEmotionColor = () => {
    if (!emotion) return { bg: "#888", glow: "rgba(136, 136, 136, 0.4)" };

    const colors: Record<string, { bg: string; glow: string }> = {
      happy: { bg: "#FFD700", glow: "rgba(255, 215, 0, 0.6)" },
      sad: { bg: "#6495ED", glow: "rgba(100, 149, 237, 0.6)" },
      angry: { bg: "#FF4444", glow: "rgba(255, 68, 68, 0.6)" },
      scared: { bg: "#9370DB", glow: "rgba(147, 112, 219, 0.6)" },
      confused: { bg: "#FFA500", glow: "rgba(255, 165, 0, 0.6)" },
      frustrated: { bg: "#FF6B6B", glow: "rgba(255, 107, 107, 0.6)" },
      disappointed: { bg: "#778899", glow: "rgba(119, 136, 153, 0.6)" },
      nervous: { bg: "#98FB98", glow: "rgba(152, 251, 152, 0.6)" },
      jealous: { bg: "#20B2AA", glow: "rgba(32, 178, 170, 0.6)" },
      proud: { bg: "#FFD700", glow: "rgba(255, 215, 0, 0.6)" },
      worried: { bg: "#DDA0DD", glow: "rgba(221, 160, 221, 0.6)" },
      relieved: { bg: "#90EE90", glow: "rgba(144, 238, 144, 0.6)" },
      bittersweet: { bg: "#DEB887", glow: "rgba(222, 184, 135, 0.6)" },
      conflicted: { bg: "#BC8F8F", glow: "rgba(188, 143, 143, 0.6)" },
      accomplished: { bg: "#FFD700", glow: "rgba(255, 215, 0, 0.6)" },
      torn: { bg: "#FF69B4", glow: "rgba(255, 105, 180, 0.6)" },
      discouraged: { bg: "#708090", glow: "rgba(112, 128, 144, 0.6)" },
      insincere: { bg: "#D3D3D3", glow: "rgba(211, 211, 211, 0.6)" },
      nostalgic: { bg: "#DDA0DD", glow: "rgba(221, 160, 221, 0.6)" },
      ambivalent: { bg: "#A9A9A9", glow: "rgba(169, 169, 169, 0.6)" },
      content: { bg: "#98FB98", glow: "rgba(152, 251, 152, 0.6)" },
    };

    return colors[emotion] || { bg: "#888", glow: "rgba(136, 136, 136, 0.4)" };
  };

  const { bg, glow } = getEmotionColor();

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center my-4"
      animate={isAnimating ? { scale: [1, 1.2, 1] } : { scale: [1, 1.05, 1] }}
      transition={{ duration: isAnimating ? 0.5 : 2, repeat: isAnimating ? 0 : Infinity }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute blur-2xl rounded-full"
        animate={{ backgroundColor: glow, scale: isAnimating ? [1, 1.5, 1] : 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: 120, height: 120 }}
      />

      {/* Heart shape */}
      <motion.div
        className="relative z-10 text-7xl"
        animate={{
          color: bg,
          rotate: isAnimating ? [0, -10, 10, 0] : 0,
        }}
        transition={{ duration: 0.3 }}
        style={{ filter: `drop-shadow(0 0 20px ${glow})` }}
      >
        {emotion ? EMOTION_EMOJIS[emotion] || "❤️" : "❤️"}
      </motion.div>

      {/* Label */}
      <motion.div
        className="mt-2 font-pixel text-[0.6em] tracking-wider uppercase"
        animate={{ color: bg }}
      >
        {emotion ? emotion.replace("_", " ") : "EMOTION DECODER"}
      </motion.div>

      {/* Floating hearts when animating */}
      {isAnimating && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              style={{ color: bg }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((i * 45 * Math.PI) / 180) * 80,
                y: Math.sin((i * 45 * Math.PI) / 180) * 80 - 20,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
            >
              {EMOTION_EMOJIS[emotion || "happy"]}
            </motion.div>
          ))}
        </>
      )}
    </motion.div>
  );
}

// Difficulty Selector Component
function DifficultySelector({
  onSelect,
}: {
  onSelect: (difficulty: Difficulty) => void;
}) {
  const difficulties = [
    {
      id: "easy" as Difficulty,
      label: "LITTLE HEART",
      ages: "Ages 6-8",
      icon: "💗",
      color: "from-[#FF69B4] to-[#FF1493]",
      borderColor: "#FF69B4",
      description: "Basic emotions: happy, sad, angry, scared",
    },
    {
      id: "medium" as Difficulty,
      label: "GROWING HEART",
      ages: "Ages 9-11",
      icon: "💖",
      color: "from-[#DA70D6] to-[#9932CC]",
      borderColor: "#DA70D6",
      description: "More emotions: frustrated, nervous, proud",
    },
    {
      id: "hard" as Difficulty,
      label: "WISE HEART",
      ages: "Ages 12+",
      icon: "💝",
      color: "from-[#8B008B] to-[#4B0082]",
      borderColor: "#8B008B",
      description: "Complex emotions: bittersweet, conflicted",
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
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          💭
        </motion.div>
        <h1 className="font-pixel text-[1.1em] text-white mb-2">EMOTION DECODER</h1>
        <p className="text-white/70 text-[1em]">Read the situation, feel the emotion</p>
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

// Emotion Button Component
function EmotionButton({
  emotion,
  onClick,
  state,
  disabled,
}: {
  emotion: string;
  onClick: () => void;
  state: "default" | "correct" | "incorrect";
  disabled: boolean;
}) {
  const emoji = EMOTION_EMOJIS[emotion] || "❓";
  const label = emotion.charAt(0).toUpperCase() + emotion.slice(1);

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.08, y: -3 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      animate={state === "incorrect" ? { x: [-5, 5, -5, 5, 0] } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative p-4 border-4 text-white transition-all duration-150 flex flex-col items-center gap-1",
        state === "correct" &&
          "bg-gradient-to-b from-[#50FF7F] via-[#17D049] to-[#0C9430] border-[#085020] shadow-[0_0_25px_rgba(23,208,73,0.6)]",
        state === "incorrect" &&
          "bg-gradient-to-b from-[#FF6666] via-[#FF1A1A] to-[#AA0000] border-[#550000] shadow-[0_0_25px_rgba(255,26,26,0.6)]",
        state === "default" &&
          "bg-gradient-to-b from-[#6B5B95] via-[#5B4B85] to-[#4B3B75] border-[#3B2B65] shadow-[inset_2px_2px_0_rgba(255,255,255,0.2),inset_-2px_-2px_0_rgba(0,0,0,0.3),3px_3px_0_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(107,91,149,0.5),3px_3px_0_rgba(0,0,0,0.4)]",
        disabled && state === "default" && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Emoji */}
      <motion.span
        className="text-3xl"
        animate={
          state === "default" && !disabled
            ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity, delay: Math.random() }}
      >
        {emoji}
      </motion.span>

      {/* Label */}
      <span className="font-pixel text-[0.5em] tracking-wider">{label}</span>

      {/* Result overlay */}
      {state !== "default" && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-1 -right-1 text-xl"
        >
          {state === "correct" ? "✅" : "❌"}
        </motion.div>
      )}
    </motion.button>
  );
}

export function EmotionDecoderGame({
  onExit,
  onComplete,
  onCorrectAnswer,
  onWrongAnswer,
}: EmotionDecoderGameProps) {
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
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const questions = difficulty ? QUESTIONS[difficulty] : [];
  const currentQuestion = questions[questionIndex];

  const checkAnswer = useCallback(
    (answer: string) => {
      if (selectedAnswer) return;

      setSelectedAnswer(answer);
      setDetectedEmotion(answer);
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
            setDetectedEmotion(null);
          } else {
            onComplete(correct + 1, mistakes);
          }
        }, 2500);
      } else {
        setMistakes((m) => m + 1);
        setFeedback({
          type: "error",
          message: `Think about how YOU would feel in this situation...`,
        });
        onWrongAnswer();
      }
    },
    [
      currentQuestion,
      questionIndex,
      correct,
      mistakes,
      questions.length,
      onComplete,
      onCorrectAnswer,
      onWrongAnswer,
      selectedAnswer,
    ]
  );

  const getButtonState = (emotion: string) => {
    if (!selectedAnswer) return "default";
    if (emotion === currentQuestion.a) return "correct";
    if (emotion === selectedAnswer) return "incorrect";
    return "default";
  };

  // Difficulty selection screen
  if (!difficulty) {
    return (
      <div
        className="bg-gradient-to-b from-[#4A3728] via-[#3A2A1A] to-[#2A1A0A] border-6 border-[#5D4030] p-4"
        style={{
          boxShadow:
            "inset 4px 4px 0 rgba(255,255,255,0.15), inset -4px -4px 0 rgba(0,0,0,0.4), 8px 8px 0 rgba(0,0,0,0.5)",
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
    easy: { name: "LITTLE HEART", icon: "💗" },
    medium: { name: "GROWING HEART", icon: "💖" },
    hard: { name: "WISE HEART", icon: "💝" },
  };

  return (
    <GameContainer
      title={`EMOTION DECODER: ${difficultyLabels[difficulty].name}`}
      icon="💭"
      currentQuestion={questionIndex}
      totalQuestions={questions.length}
      onExit={onExit}
    >
      {/* Emotion Heart */}
      <EmotionHeart emotion={detectedEmotion} isAnimating={isAnimating} />

      {/* Question Card - Situation */}
      <QuestionCard
        questionNumber={questionIndex + 1}
        totalQuestions={questions.length}
        label="SITUATION"
      >
        <div className="text-[1.1em] leading-relaxed italic">
          &quot;{currentQuestion.s}&quot;
        </div>
      </QuestionCard>

      {/* Learning Box */}
      <LearningBox title="💡 ASK YOURSELF:">
        <div className="text-[0.9em] text-center">
          How would <b>YOU</b> feel if this happened to you?
        </div>
      </LearningBox>

      {/* Emotion Buttons */}
      <div className="grid grid-cols-2 gap-3 my-4">
        {currentQuestion.emotions.map((emotion) => (
          <EmotionButton
            key={emotion}
            emotion={emotion}
            onClick={() => checkAnswer(emotion)}
            state={getButtonState(emotion)}
            disabled={!!selectedAnswer}
          />
        ))}
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
        title={
          feedback?.type === "success"
            ? `💖 ${currentQuestion.a.toUpperCase()}!`
            : "💔 TRY AGAIN!"
        }
        message={feedback?.message || ""}
        visible={!!feedback}
      />
    </GameContainer>
  );
}
