"use client";

import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Floating particles for atmosphere
function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    type: "gold" | "diamond" | "emerald" | "xp";
    delay: number;
    duration: number;
    size: number;
  }>>([]);

  useEffect(() => {
    const particleCount = 12;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      type: ["gold", "diamond", "emerald", "xp"][Math.floor(Math.random() * 4)] as "gold" | "diamond" | "emerald" | "xp",
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 3,
      size: 3 + Math.random() * 4,
    }));
    setParticles(newParticles);
  }, []);

  const particleColors = {
    gold: { bg: "#FCDB05", glow: "rgba(252, 219, 5, 0.6)" },
    diamond: { bg: "#4AEDD9", glow: "rgba(74, 237, 217, 0.6)" },
    emerald: { bg: "#17D049", glow: "rgba(23, 208, 73, 0.6)" },
    xp: { bg: "#7FFF00", glow: "rgba(127, 255, 0, 0.6)" },
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particleColors[particle.type].bg,
            boxShadow: `0 0 ${particle.size * 2}px ${particleColors[particle.type].glow}`,
            borderRadius: particle.type === "xp" ? "50%" : "0",
          }}
          initial={{ bottom: -20, opacity: 0 }}
          animate={{
            bottom: "110%",
            opacity: [0, 1, 1, 0],
            x: [0, Math.sin(particle.id) * 20, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// Torch component with flickering flame
function Torch({ side }: { side: "left" | "right" }) {
  return (
    <div className={cn(
      "absolute top-4 z-10",
      side === "left" ? "left-4" : "right-4"
    )}>
      {/* Torch stick */}
      <div className="w-2 h-8 bg-gradient-to-b from-[#8B4513] to-[#5D3A1A] mx-auto" />

      {/* Flame */}
      <motion.div
        className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-6"
        animate={{ scale: [1, 1.1, 0.95, 1.05, 1] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      >
        <div className="w-full h-full bg-gradient-to-t from-[#FF6600] via-[#FF9933] to-[#FFCC00] rounded-full blur-[2px]" />
      </motion.div>

      {/* Glow */}
      <div
        className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(255, 153, 51, 0.4) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

interface GameContainerProps {
  title: string;
  icon: string;
  currentQuestion: number;
  totalQuestions: number;
  onExit: () => void;
  children: ReactNode;
  theme?: "cave" | "forest" | "nether";
}

export function GameContainer({
  title,
  icon,
  currentQuestion,
  totalQuestions,
  onExit,
  children,
  theme = "cave",
}: GameContainerProps) {
  const themeStyles = {
    cave: `
      bg-gradient-to-b from-[#4A3728] via-[#3A2A1A] to-[#2A1A0A]
      border-[#5D4030]
    `,
    forest: `
      bg-gradient-to-b from-[#2E5A1C] via-[#1E4A12] to-[#0E3A08]
      border-[#3D6628]
    `,
    nether: `
      bg-gradient-to-b from-[#4A1A1A] via-[#3A0A0A] to-[#2A0000]
      border-[#550000]
    `,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative overflow-hidden",
        "border-[6px] p-6",
        "shadow-[inset_4px_4px_0_rgba(255,255,255,0.15),inset_-4px_-4px_0_rgba(0,0,0,0.4),8px_8px_0_rgba(0,0,0,0.5),12px_12px_24px_rgba(0,0,0,0.4)]",
        themeStyles[theme]
      )}
    >
      {/* Wood texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 8px,
              rgba(0,0,0,0.1) 8px,
              rgba(0,0,0,0.1) 10px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 30px,
              rgba(0,0,0,0.1) 30px,
              rgba(0,0,0,0.1) 32px
            )
          `,
        }}
      />

      {/* Ambient torch lighting */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 10% 20%, rgba(255, 153, 51, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 90% 20%, rgba(255, 153, 51, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 80%, rgba(255, 100, 50, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Torches */}
      <Torch side="left" />
      <Torch side="right" />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 pb-4 border-b-4 border-black/30 flex-wrap gap-3">
          <motion.h2
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="font-pixel text-[0.85em] text-white text-shadow-lg flex items-center gap-2"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[1.3em]"
            >
              {icon}
            </motion.span>
            <span className="bg-gradient-to-r from-white to-[#E0D0C0] bg-clip-text text-transparent">
              {title}
            </span>
          </motion.h2>

          <Button variant="stone" size="sm" onClick={onExit}>
            ← EXIT
          </Button>
        </div>

        {/* Progress bar */}
        <ProgressBar
          value={currentQuestion}
          max={totalQuestions}
          showText
          size="lg"
          color="xp"
          className="mb-5"
        />

        {/* Game Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Question Card with parchment style
interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  label?: string;
  children: ReactNode;
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  label = "BLOCK",
  children,
}: QuestionCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden"
    >
      {/* Parchment background */}
      <div
        className="bg-gradient-to-b from-[#E8D5B7] via-[#D4B896] to-[#C4A882] border-[5px] border-[#8B5E3C] p-5 mb-4"
        style={{
          boxShadow: `
            inset 3px 3px 0 rgba(255, 255, 255, 0.3),
            inset -3px -3px 0 rgba(0, 0, 0, 0.2),
            4px 4px 0 rgba(0, 0, 0, 0.3),
            6px 6px 12px rgba(0, 0, 0, 0.2)
          `,
        }}
      >
        {/* Paper lines overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 24px,
                rgba(139, 90, 43, 0.3) 24px,
                rgba(139, 90, 43, 0.3) 25px
              )
            `,
          }}
        />

        {/* Question number badge */}
        <div className="inline-block bg-[#5D3A1A] px-3 py-1 mb-3 border-2 border-[#3D2510]">
          <span className="font-pixel text-[0.5em] text-[#D4A574] tracking-wider">
            {label} {questionNumber} OF {totalQuestions}
          </span>
        </div>

        {/* Question text */}
        <div className="text-[1.4em] text-[#2D1810] leading-relaxed font-game">
          {children}
        </div>

        {/* Decorative corners */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#8B5E3C]/40" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#8B5E3C]/40" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#8B5E3C]/40" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#8B5E3C]/40" />
      </div>
    </motion.div>
  );
}

// Word Bank - Chest style
interface WordBankProps {
  words: string[];
  onWordClick: (word: string) => void;
  usedWords?: string[];
}

export function WordBank({ words, onWordClick, usedWords = [] }: WordBankProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative overflow-hidden my-4"
    >
      {/* Chest container */}
      <div
        className="bg-gradient-to-b from-[#A67C00] via-[#8B6914] to-[#705212] border-[5px] border-[#5C4A00] p-4"
        style={{
          boxShadow: `
            inset 3px 3px 0 rgba(255, 255, 255, 0.25),
            inset -3px -3px 0 rgba(0, 0, 0, 0.35),
            5px 5px 0 rgba(0, 0, 0, 0.4),
            7px 7px 14px rgba(0, 0, 0, 0.3)
          `,
        }}
      >
        {/* Chest lock decoration */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-4 bg-[#333] border-2 border-[#555] rounded-sm" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-[#5C4A00]">
          <motion.span
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[1.4em]"
          >
            🗃️
          </motion.span>
          <span className="font-pixel text-[0.55em] text-[#FFE866] text-shadow-dark tracking-wider">
            WORD CHEST:
          </span>
        </div>

        {/* Word buttons */}
        <div className="flex flex-wrap gap-2">
          {words.map((word, index) => {
            const isUsed = usedWords.includes(word);
            return (
              <motion.button
                key={word}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={isUsed ? {} : { scale: 1.08, y: -2 }}
                whileTap={isUsed ? {} : { scale: 0.95 }}
                onClick={() => !isUsed && onWordClick(word)}
                disabled={isUsed}
                className={cn(
                  "px-4 py-2.5 font-game text-[1.15em] border-3 transition-all duration-100",
                  isUsed
                    ? "bg-gradient-to-b from-[#4A4A4A] to-[#3A3A3A] border-[#2A2A2A] text-[#6A6A6A] cursor-not-allowed opacity-50"
                    : `
                      bg-gradient-to-b from-[#9A9A9A] to-[#6A6A6A] border-[#4A4A4A] text-white
                      hover:from-[#4AEDD9] hover:to-[#2BA89D] hover:border-[#1A6B60]
                      hover:shadow-[0_0_12px_rgba(74,237,217,0.5)]
                      cursor-pointer
                    `
                )}
                style={{
                  boxShadow: isUsed ? "none" : `
                    inset 2px 2px 0 rgba(255, 255, 255, 0.2),
                    inset -2px -2px 0 rgba(0, 0, 0, 0.3),
                    2px 2px 0 rgba(0, 0, 0, 0.3)
                  `,
                }}
              >
                {word}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// Hint Box - Enchanted style
interface HintBoxProps {
  hint: string;
  extraInfo?: string;
  visible: boolean;
}

export function HintBox({ hint, extraInfo, visible }: HintBoxProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          className="relative overflow-hidden my-4"
        >
          <div
            className="bg-gradient-to-br from-[rgba(75,0,130,0.95)] to-[rgba(30,0,60,0.95)] border-4 border-[#6B238E] p-5"
            style={{
              boxShadow: `
                0 0 20px rgba(155, 95, 192, 0.4),
                inset 0 0 30px rgba(155, 95, 192, 0.2),
                4px 4px 0 rgba(0, 0, 0, 0.4)
              `,
            }}
          >
            {/* Enchantment shimmer effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                background: [
                  "linear-gradient(45deg, transparent 40%, rgba(155, 95, 192, 0.3) 50%, transparent 60%)",
                  "linear-gradient(45deg, transparent 40%, rgba(155, 95, 192, 0.3) 50%, transparent 60%)",
                ],
                backgroundPosition: ["-200% 0", "200% 0"],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 100%" }}
            />

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <motion.span
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[1.3em]"
              >
                ✨
              </motion.span>
              <h4 className="font-pixel text-[0.6em] text-[#DDA0DD] tracking-wider">
                ENCHANTED HINT:
              </h4>
            </div>

            {/* Hint text */}
            <p className="text-[#E6E6FA] text-[1.15em] leading-relaxed font-game">
              {hint}
            </p>

            {extraInfo && (
              <p className="text-[#C8A8E8] text-[1em] mt-2 opacity-85 italic">
                {extraInfo}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Learning Box - Emerald style
interface LearningBoxProps {
  title: string;
  children: ReactNode;
}

export function LearningBox({ title, children }: LearningBoxProps) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="relative overflow-hidden my-4"
    >
      <div
        className="bg-gradient-to-b from-[#2E5A1C] to-[#1A4010] border-4 border-[#17D049] p-5"
        style={{
          boxShadow: `
            0 0 15px rgba(23, 208, 73, 0.3),
            inset 0 0 20px rgba(23, 208, 73, 0.1),
            4px 4px 0 rgba(0, 0, 0, 0.4)
          `,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[1.2em]">📖</span>
          <h4 className="font-pixel text-[0.55em] text-[#50FF7F] tracking-wider">
            {title}
          </h4>
        </div>

        {/* Content */}
        <div className="text-[#C8FFC8] text-[1.1em] leading-relaxed font-game">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

// Feedback - Success/Error
interface FeedbackProps {
  type: "success" | "error";
  title: string;
  message: string;
  visible: boolean;
}

export function Feedback({ type, title, message, visible }: FeedbackProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="my-5"
        >
          <div
            className={cn(
              "relative overflow-hidden p-5 border-[5px]",
              type === "success"
                ? "bg-gradient-to-b from-[#2E5A1C] to-[#1A4010] border-[#17D049]"
                : "bg-gradient-to-b from-[#5A1A1A] to-[#3A0A0A] border-[#FF1A1A]"
            )}
            style={{
              boxShadow: type === "success"
                ? "0 0 20px rgba(23, 208, 73, 0.4), inset 0 0 30px rgba(23, 208, 73, 0.15)"
                : "0 0 20px rgba(255, 26, 26, 0.4), inset 0 0 30px rgba(255, 26, 26, 0.15)",
            }}
          >
            {/* Icon and title */}
            <div className="flex items-center gap-3 mb-2">
              <motion.span
                animate={type === "success"
                  ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                  : { x: [-3, 3, -3, 3, 0] }
                }
                transition={{ duration: 0.5 }}
                className="text-[1.5em]"
              >
                {type === "success" ? "✅" : "❌"}
              </motion.span>
              <h4 className={cn(
                "font-pixel text-[0.75em] text-shadow-dark",
                type === "success" ? "text-[#50FF7F]" : "text-[#FF6666]"
              )}>
                {title}
              </h4>
            </div>

            {/* Message */}
            <p className="text-[#EEE] text-[1.15em] font-game leading-relaxed">
              {message}
            </p>

            {/* Particle effect for success */}
            {type === "success" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-2 right-2 text-[1em]"
              >
                <motion.span
                  animate={{ y: [-5, 5, -5], rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⭐
                </motion.span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Option Button - Stone block style
interface OptionButtonProps {
  children: ReactNode;
  onClick: () => void;
  state?: "default" | "correct" | "incorrect";
  disabled?: boolean;
}

export function OptionButton({
  children,
  onClick,
  state = "default",
  disabled,
}: OptionButtonProps) {
  return (
    <motion.button
      whileHover={disabled || state !== "default" ? {} : { scale: 1.03, y: -2 }}
      whileTap={disabled || state !== "default" ? {} : { scale: 0.98 }}
      animate={state === "incorrect" ? { x: [-5, 5, -5, 5, 0] } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative p-4 text-[1.2em] font-game border-4 text-white w-full text-left transition-all duration-150",
        state === "correct" && `
          bg-gradient-to-b from-[#50FF7F] via-[#17D049] to-[#0C9430]
          border-[#085020]
          shadow-[0_0_20px_rgba(23,208,73,0.5),inset_3px_3px_0_rgba(255,255,255,0.3),inset_-3px_-3px_0_rgba(0,0,0,0.2)]
        `,
        state === "incorrect" && `
          bg-gradient-to-b from-[#FF6666] via-[#FF1A1A] to-[#AA0000]
          border-[#550000]
          shadow-[0_0_20px_rgba(255,26,26,0.5),inset_3px_3px_0_rgba(255,255,255,0.2),inset_-3px_-3px_0_rgba(0,0,0,0.3)]
        `,
        state === "default" && `
          bg-gradient-to-b from-[#9A9A9A] via-[#7A7A7A] to-[#5A5A5A]
          border-[#3A3A3A]
          shadow-[inset_3px_3px_0_rgba(255,255,255,0.2),inset_-3px_-3px_0_rgba(0,0,0,0.35),3px_3px_0_rgba(0,0,0,0.4)]
          hover:from-[#AAAAAA] hover:via-[#8A8A8A] hover:to-[#6A6A6A]
          hover:shadow-[inset_3px_3px_0_rgba(255,255,255,0.3),inset_-3px_-3px_0_rgba(0,0,0,0.3),3px_3px_0_rgba(0,0,0,0.4),0_0_10px_rgba(255,255,255,0.1)]
        `,
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Inner highlight */}
      <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {children}

      {/* Success/Error icon */}
      {state !== "default" && (
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[1.2em]"
        >
          {state === "correct" ? "✅" : "❌"}
        </motion.span>
      )}
    </motion.button>
  );
}
