"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/hooks/useAudio";
import { GemType, GEM_CONFIG, RARITY_CONFIG, MINING_DEPTHS } from "@/lib/gemTypes";

interface GemDropResult {
  dropped: boolean;
  gemType?: GemType;
  isWhole?: boolean;
  rarity?: string;
}

interface GemFound {
  gemType: GemType;
  isWhole: boolean;
  rarity: string;
}

interface MiningOverlayProps {
  isOpen: boolean;
  onComplete: (gemsFound: GemFound[]) => void;
  currentDepth: number;
  onDepthChange: (depth: number) => void;
  checkGemDrop: () => Promise<GemDropResult | null>;
}

// Get block style based on depth
function getBlockStyle(depth: number) {
  if (depth < 6) {
    return {
      bg: "linear-gradient(180deg, #8B4513 0%, #654321 100%)",
      border: "#5D3A1A",
      name: "Dirt",
      emoji: "🟫",
    };
  } else if (depth < 16) {
    return {
      bg: "linear-gradient(180deg, #808080 0%, #606060 100%)",
      border: "#505050",
      name: "Stone",
      emoji: "🪨",
    };
  } else if (depth < 26) {
    return {
      bg: "linear-gradient(180deg, #404040 0%, #303030 100%)",
      border: "#252525",
      name: "Granite",
      emoji: "⬛",
    };
  } else if (depth < 36) {
    return {
      bg: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)",
      border: "#0a0a12",
      name: "Obsidian",
      emoji: "🖤",
    };
  } else {
    return {
      bg: "linear-gradient(180deg, #2d1b69 0%, #1a0f40 100%)",
      border: "#120a2d",
      name: "Abyss",
      emoji: "💜",
    };
  }
}

// Get mining depth info
function getDepthInfo(depth: number) {
  const depthConfig = MINING_DEPTHS.find(
    (d) => depth >= d.minDepth && depth <= d.maxDepth
  ) || MINING_DEPTHS[0];
  return depthConfig;
}

// Single mining block component
function MiningBlock({
  depth,
  isBreaking,
  gemFound,
  onBreakComplete,
}: {
  depth: number;
  isBreaking: boolean;
  gemFound: GemFound | null;
  onBreakComplete: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "shaking" | "breaking" | "reveal">("idle");
  const blockStyle = getBlockStyle(depth);

  useEffect(() => {
    if (isBreaking) {
      setPhase("shaking");
      const t1 = setTimeout(() => setPhase("breaking"), 300);
      const t2 = setTimeout(() => {
        setPhase("reveal");
        onBreakComplete();
      }, 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isBreaking, onBreakComplete]);

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {phase !== "reveal" ? (
          <motion.div
            key="block"
            className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shadow-lg"
            style={{
              background: blockStyle.bg,
              border: `3px solid ${blockStyle.border}`,
            }}
            animate={
              phase === "shaking"
                ? { x: [-3, 3, -3, 3, 0], rotate: [-2, 2, -2, 2, 0] }
                : phase === "breaking"
                ? { scale: [1, 1.1, 0], opacity: [1, 1, 0], rotate: [0, 10, 45] }
                : {}
            }
            transition={{ duration: phase === "shaking" ? 0.3 : 0.3 }}
          >
            {blockStyle.emoji}
          </motion.div>
        ) : gemFound ? (
          <motion.div
            key="gem"
            className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10 }}
            style={{
              background: RARITY_CONFIG[gemFound.rarity as keyof typeof RARITY_CONFIG]?.bgGradient || "rgba(100,100,100,0.3)",
              boxShadow: `0 0 20px ${RARITY_CONFIG[gemFound.rarity as keyof typeof RARITY_CONFIG]?.glowColor || "#888"}`,
            }}
          >
            {GEM_CONFIG[gemFound.gemType]?.emoji || "💎"}
            {!gemFound.isWhole && (
              <span className="absolute -bottom-1 -right-1 text-xs bg-gray-800 px-1 rounded">✦</span>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="w-14 h-14 rounded-lg flex items-center justify-center text-xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            💨
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breaking particles */}
      {phase === "breaking" && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded"
              style={{ background: blockStyle.border }}
              initial={{ x: 0, y: 0, scale: 1 }}
              animate={{
                x: Math.cos((i * Math.PI * 2) / 8) * 40,
                y: Math.sin((i * Math.PI * 2) / 8) * 40 + 20,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// Pickaxe animation component
function Pickaxe({ isSwinging }: { isSwinging: boolean }) {
  return (
    <motion.div
      className="text-4xl"
      animate={
        isSwinging
          ? { rotate: [0, -45, 0], y: [0, -10, 5, 0] }
          : {}
      }
      transition={{ duration: 0.3 }}
    >
      ⛏️
    </motion.div>
  );
}

export function MiningOverlay({
  isOpen,
  onComplete,
  currentDepth,
  onDepthChange,
  checkGemDrop,
}: MiningOverlayProps) {
  const { playSound } = useAudio();
  const [digsRemaining, setDigsRemaining] = useState(3);
  const [isDigging, setIsDigging] = useState(false);
  const [currentGem, setCurrentGem] = useState<GemFound | null>(null);
  const [gemsFound, setGemsFound] = useState<GemFound[]>([]);
  const [breakingBlock, setBreakingBlock] = useState<number | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  const depthInfo = getDepthInfo(currentDepth);

  // Reset state when overlay opens
  useEffect(() => {
    if (isOpen) {
      setDigsRemaining(3);
      setGemsFound([]);
      setCurrentGem(null);
      setBreakingBlock(null);
      setShowComplete(false);
      setIsDigging(false);
    }
  }, [isOpen]);

  const handleDig = useCallback(async () => {
    if (isDigging || digsRemaining <= 0) return;

    setIsDigging(true);
    setCurrentGem(null);
    playSound("click"); // Will be replaced with dig sound

    // Start breaking animation
    setBreakingBlock(currentDepth);

    // Fallback timeout to ensure isDigging is reset even if something goes wrong
    const fallbackTimeout = setTimeout(() => {
      setIsDigging(false);
    }, 2000);

    try {
      // Check for gem drop
      const result = await checkGemDrop();

      // Convert GemDropResult to GemFound if a gem was dropped
      if (result?.dropped && result.gemType) {
        const foundGem: GemFound = {
          gemType: result.gemType,
          isWhole: result.isWhole ?? false,
          rarity: result.rarity ?? "common",
        };
        setCurrentGem(foundGem);
        setGemsFound((prev) => [...prev, foundGem]);
        // Play gem found sound after a delay
        setTimeout(() => playSound("reward"), 400);
      }
    } catch (error) {
      console.error("Error checking gem drop:", error);
    } finally {
      // Clear the fallback timeout since animation will handle it
      clearTimeout(fallbackTimeout);
    }
  }, [isDigging, digsRemaining, currentDepth, checkGemDrop, playSound]);

  const handleBreakComplete = useCallback(() => {
    // Safety: always reset isDigging first
    setIsDigging(false);
    setBreakingBlock(null);

    onDepthChange(currentDepth + 1);
    setDigsRemaining((d) => {
      const newDigs = d - 1;
      // Check if all digs used (inside the setter for accurate value)
      if (newDigs <= 0) {
        setTimeout(() => setShowComplete(true), 500);
      }
      return newDigs;
    });
  }, [currentDepth, onDepthChange]);

  const handleFinish = useCallback(() => {
    onComplete(gemsFound);
  }, [gemsFound, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Mining Modal */}
        <motion.div
          className="relative z-10 w-[340px] max-w-[95vw]"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <div
            className="rounded-2xl p-5 overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #1a1a2e 0%, #0f0a1e 100%)",
              border: "3px solid #8b5cf6",
              boxShadow: "0 0 40px rgba(139, 92, 246, 0.4)",
            }}
          >
            {/* Header */}
            <div className="text-center mb-4">
              <motion.div
                className="text-3xl mb-2"
                animate={{ rotate: isDigging ? [-10, 10, -10] : 0 }}
                transition={{ duration: 0.2, repeat: isDigging ? 3 : 0 }}
              >
                ⛏️
              </motion.div>
              <h2
                className="text-lg font-bold text-white"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "0.8em" }}
              >
                DIG FOR TREASURE!
              </h2>
            </div>

            {/* Depth Info */}
            <div
              className="mb-4 py-2 px-3 rounded-lg text-center"
              style={{
                background: depthInfo.bgColor ? `linear-gradient(90deg, ${depthInfo.bgColor.replace('from-', '').replace(' to-', ', ')})` : "rgba(100,100,100,0.3)",
                border: `1px solid ${depthInfo.color}`,
              }}
            >
              <div className="text-sm text-gray-300">
                Depth: <span className="text-white font-bold">{currentDepth}</span> blocks
              </div>
              <div className="text-xs text-gray-400">{depthInfo.name}</div>
              <div className="text-xs text-gray-500 mt-1">{depthInfo.description}</div>
            </div>

            {/* Mining Grid - Show 3 blocks to dig */}
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2].map((i) => {
                const blockDepth = currentDepth + i;
                const isDug = i < 3 - digsRemaining;
                const isCurrentlyBreaking = breakingBlock === blockDepth;

                return (
                  <div key={i} className="relative">
                    {isDug ? (
                      <div className="w-16 h-16 flex items-center justify-center">
                        {gemsFound[i] ? (
                          <motion.div
                            className="text-3xl"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            {GEM_CONFIG[gemsFound[i].gemType]?.emoji || "💎"}
                          </motion.div>
                        ) : (
                          <span className="text-2xl opacity-50">💨</span>
                        )}
                      </div>
                    ) : (
                      <MiningBlock
                        depth={blockDepth}
                        isBreaking={isCurrentlyBreaking}
                        gemFound={isCurrentlyBreaking ? currentGem : null}
                        onBreakComplete={handleBreakComplete}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Digs Remaining */}
            <div className="text-center mb-4">
              <span className="text-gray-400 text-sm">Digs remaining: </span>
              <span className="text-yellow-400 font-bold">{digsRemaining}</span>
            </div>

            {/* Found Gems Display */}
            {gemsFound.length > 0 && (
              <motion.div
                className="mb-4 py-2 px-3 rounded-lg"
                style={{ background: "rgba(139, 92, 246, 0.2)", border: "1px solid rgba(139, 92, 246, 0.4)" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div className="text-center text-sm text-gray-300 mb-2">Found:</div>
                <div className="flex justify-center gap-3">
                  {gemsFound.map((gem, i) => (
                    <motion.div
                      key={i}
                      className="flex flex-col items-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <span className="text-2xl">{GEM_CONFIG[gem.gemType]?.emoji}</span>
                      <span className="text-xs text-gray-400">
                        {gem.isWhole ? "Whole" : "Shard"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Dig Button or Complete */}
            {!showComplete ? (
              <motion.button
                className="w-full py-3 px-6 rounded-xl font-bold text-lg disabled:opacity-50"
                style={{
                  background: "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)",
                  color: "#000",
                  boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
                }}
                onClick={handleDig}
                disabled={isDigging || digsRemaining <= 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isDigging ? (
                  <span className="flex items-center justify-center gap-2">
                    <Pickaxe isSwinging={true} />
                    DIGGING...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    ⛏️ DIG! ({digsRemaining} left)
                  </span>
                )}
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <div className="text-center mb-3">
                  <span className="text-yellow-400 text-lg">
                    {gemsFound.length > 0
                      ? `Found ${gemsFound.length} gem${gemsFound.length > 1 ? "s" : ""}!`
                      : "Nothing this time..."}
                  </span>
                </div>
                <motion.button
                  className="w-full py-3 px-6 rounded-xl font-bold text-lg"
                  style={{
                    background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.4)",
                  }}
                  onClick={handleFinish}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  CONTINUE →
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
