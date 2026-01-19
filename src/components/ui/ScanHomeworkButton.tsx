"use client";

import { motion } from "framer-motion";
import { Camera, Sparkles, Zap } from "lucide-react";

interface ScanHomeworkButtonProps {
  onClick: () => void;
  completedCount?: number;
  onViewAnswers?: () => void;
}

export function ScanHomeworkButton({ onClick, completedCount, onViewAnswers }: ScanHomeworkButtonProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative my-6"
    >
      {/* Outer glow container */}
      <div className="absolute inset-0 -m-4 bg-gradient-to-r from-transparent via-[var(--diamond)]/10 to-transparent blur-xl animate-pulse" />

      {/* Main button container */}
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full overflow-hidden cursor-pointer"
      >
        {/* Background with animated gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--diamond)] via-[#5AF5E0] to-[var(--emerald)] opacity-90" />

        {/* Animated shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ["-200%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Block 3D effect border */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: `
              inset 4px 4px 0 rgba(255, 255, 255, 0.4),
              inset -4px -4px 0 rgba(0, 0, 0, 0.3),
              0 6px 0 #1A6B60,
              0 8px 20px rgba(0, 0, 0, 0.4)
            `,
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-6 flex flex-col items-center gap-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white/80 animate-pulse" />
            <span className="font-pixel text-[0.5em] text-white/90 tracking-wider uppercase">
              Scan Homework
            </span>
            <Sparkles className="w-5 h-5 text-white/80 animate-pulse" />
          </div>

          {/* Camera icon with animation */}
          <motion.div
            animate={{
              y: [0, -8, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            {/* Glow behind camera */}
            <div className="absolute inset-0 -m-4 bg-white/30 rounded-full blur-xl" />

            {/* Camera button circle */}
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #E0F7F4 50%, #B0E8E0 100%)",
                boxShadow: `
                  inset 3px 3px 0 rgba(255, 255, 255, 0.8),
                  inset -3px -3px 0 rgba(0, 0, 0, 0.15),
                  0 4px 0 rgba(0, 0, 0, 0.2),
                  0 6px 20px rgba(0, 0, 0, 0.3),
                  0 0 40px rgba(74, 237, 217, 0.5)
                `,
              }}
            >
              <Camera className="w-12 h-12 text-[var(--diamond-dark)] drop-shadow-lg" />
            </div>

            {/* Orbiting particles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 -m-6"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-white/80"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${i * 120}deg) translateX(50px) translateY(-50%)`,
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Subtitle */}
          <div className="flex items-center gap-2 text-white/90">
            <Zap className="w-4 h-4" />
            <span className="text-[1.1em] font-medium">
              Take a photo of your homework
            </span>
            <Zap className="w-4 h-4" />
          </div>

          {/* Hint text */}
          <p className="text-[0.85em] text-white/70">
            AI will turn it into a fun game!
          </p>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-white/40" />
        <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-white/40" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-white/40" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-white/40" />
      </motion.button>

      {/* My Answers Button - Quick access for kids */}
      {completedCount && completedCount > 0 && onViewAnswers && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onViewAnswers();
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            color: "white",
            boxShadow: `
              inset 2px 2px 0 rgba(255, 255, 255, 0.3),
              inset -2px -2px 0 rgba(0, 0, 0, 0.2),
              0 4px 0 #15803d,
              0 6px 15px rgba(34, 197, 94, 0.4)
            `,
            border: "none",
          }}
        >
          <span className="text-2xl">📝</span>
          <span>MY ANSWERS</span>
          <span
            className="ml-1 px-2 py-0.5 rounded-full text-sm"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            {completedCount}
          </span>
        </motion.button>
      )}
    </motion.div>
  );
}
