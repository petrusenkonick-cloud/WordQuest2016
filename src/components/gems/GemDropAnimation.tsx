"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GemType, GEM_CONFIG, RARITY_CONFIG } from "@/lib/gemTypes";
import { useEffect, useState } from "react";

interface GemDropAnimationProps {
  gemType: GemType;
  isWhole: boolean;
  onComplete?: () => void;
  startPosition?: { x: number; y: number };
}

export function GemDropAnimation({
  gemType,
  isWhole,
  onComplete,
  startPosition,
}: GemDropAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const gem = GEM_CONFIG[gemType];
  const rarity = RARITY_CONFIG[gem.rarity];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const startX = startPosition?.x || typeof window !== "undefined" ? window.innerWidth / 2 : 200;
  const startY = startPosition?.y || typeof window !== "undefined" ? window.innerHeight / 2 : 300;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed pointer-events-none z-50"
          initial={{
            x: startX,
            y: startY,
            scale: 0,
            rotate: -180
          }}
          animate={{
            x: startX,
            y: [startY, startY - 100, startY - 80],
            scale: [0, 1.5, 1],
            rotate: [180, 0, 0],
          }}
          exit={{
            y: startY - 200,
            opacity: 0,
            scale: 0.5,
          }}
          transition={{
            duration: 1.5,
            times: [0, 0.4, 1],
            ease: "easeOut",
          }}
          style={{ translateX: "-50%", translateY: "-50%" }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full blur-xl"
            style={{ backgroundColor: rarity.glowColor }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              repeat: 3,
              duration: 0.5,
            }}
          />

          {/* Main gem */}
          <motion.div
            className="relative flex items-center justify-center w-20 h-20 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${rarity.color}40, ${rarity.color}80)`,
              border: `3px solid ${rarity.borderColor}`,
              boxShadow: `0 0 30px ${rarity.glowColor}`,
            }}
            animate={{
              boxShadow: [
                `0 0 30px ${rarity.glowColor}`,
                `0 0 50px ${rarity.glowColor}`,
                `0 0 30px ${rarity.glowColor}`,
              ],
            }}
            transition={{
              repeat: 3,
              duration: 0.5,
            }}
          >
            <span className="text-5xl drop-shadow-lg">{gem.emoji}</span>

            {/* Shard indicator */}
            {!isWhole && (
              <div className="absolute -bottom-1 -right-1 bg-gray-900 px-1.5 py-0.5 rounded-full border border-gray-600">
                <span className="text-xs text-gray-300">✦</span>
              </div>
            )}
          </motion.div>

          {/* Label */}
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p
              className="text-sm font-bold"
              style={{ color: rarity.color, textShadow: `0 0 10px ${rarity.glowColor}` }}
            >
              {isWhole ? gem.name : `${gem.name} Shard`}
            </p>
            <p className="text-xs text-center text-gray-400">{rarity.name}</p>
          </motion.div>

          {/* Sparkle particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: "50%",
                top: "50%",
              }}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((i * Math.PI * 2) / 8) * 60,
                y: Math.sin((i * Math.PI * 2) / 8) * 60,
                opacity: [1, 1, 0],
              }}
              transition={{
                delay: 0.2 + i * 0.05,
                duration: 0.8,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Queue-based gem drop manager
interface QueuedDrop {
  id: string;
  gemType: GemType;
  isWhole: boolean;
}

export function GemDropQueue({
  drops,
  onDropComplete,
}: {
  drops: QueuedDrop[];
  onDropComplete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {drops.map((drop, index) => (
          <motion.div
            key={drop.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: index * 0.3 }}
          >
            <GemDropAnimation
              gemType={drop.gemType}
              isWhole={drop.isWhole}
              onComplete={() => onDropComplete(drop.id)}
              startPosition={{
                x: typeof window !== "undefined" ? window.innerWidth / 2 + (index - drops.length / 2) * 100 : 200,
                y: typeof window !== "undefined" ? window.innerHeight / 2 : 300,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Mini notification for gem drop (less intrusive)
export function GemDropNotification({
  gemType,
  isWhole,
  onDismiss,
}: {
  gemType: GemType;
  isWhole: boolean;
  onDismiss: () => void;
}) {
  const gem = GEM_CONFIG[gemType];
  const rarity = RARITY_CONFIG[gem.rarity];

  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed top-20 left-1/2 z-50 pointer-events-auto"
      initial={{ x: "-50%", y: -100, opacity: 0 }}
      animate={{ x: "-50%", y: 0, opacity: 1 }}
      exit={{ x: "-50%", y: -50, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${rarity.color}30, ${rarity.color}10)`,
          border: `2px solid ${rarity.borderColor}`,
          boxShadow: `0 0 20px ${rarity.glowColor}`,
        }}
      >
        <motion.span
          className="text-3xl"
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
        >
          {gem.emoji}
        </motion.span>
        <div>
          <p className="font-bold text-white">
            {isWhole ? "Gem Found!" : "Shard Found!"}
          </p>
          <p className="text-sm" style={{ color: rarity.color }}>
            {gem.name} ({rarity.name})
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="ml-2 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

// Floating gem reward animation (for level complete)
export function FloatingGemReward({
  gemType,
  isWhole,
  index = 0,
}: {
  gemType: GemType;
  isWhole: boolean;
  index?: number;
}) {
  const gem = GEM_CONFIG[gemType];
  const rarity = RARITY_CONFIG[gem.rarity];

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{
        delay: index * 0.15,
        type: "spring",
        stiffness: 300,
        damping: 15,
      }}
    >
      <motion.div
        className="relative w-16 h-16 rounded-xl flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${rarity.color}30, ${rarity.color}50)`,
          border: `2px solid ${rarity.borderColor}`,
          boxShadow: `0 0 15px ${rarity.glowColor}`,
        }}
        animate={{
          boxShadow: [
            `0 0 15px ${rarity.glowColor}`,
            `0 0 25px ${rarity.glowColor}`,
            `0 0 15px ${rarity.glowColor}`,
          ],
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <span className="text-3xl">{gem.emoji}</span>
        {!isWhole && (
          <div className="absolute -bottom-1 -right-1 bg-gray-900 px-1 rounded text-xs">
            ✦
          </div>
        )}
      </motion.div>
      <p className="text-xs mt-1" style={{ color: rarity.color }}>
        {isWhole ? gem.name : "Shard"}
      </p>
    </motion.div>
  );
}
