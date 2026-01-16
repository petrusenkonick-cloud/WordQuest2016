"use client";

import { motion } from "framer-motion";
import {
  GemType,
  GEM_CONFIG,
  RARITY_CONFIG,
  formatShardProgress,
} from "@/lib/gemTypes";

interface GemDisplayProps {
  gemType: GemType;
  count?: number;
  shards?: number;
  size?: "sm" | "md" | "lg" | "xl";
  showCount?: boolean;
  showShards?: boolean;
  showName?: boolean;
  showRarity?: boolean;
  animate?: boolean;
  onClick?: () => void;
  isNew?: boolean;
  disabled?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 text-lg",
  md: "w-12 h-12 text-2xl",
  lg: "w-16 h-16 text-3xl",
  xl: "w-24 h-24 text-5xl",
};

const badgeSizes = {
  sm: "text-[10px] -top-1 -right-1 min-w-[14px] h-[14px]",
  md: "text-xs -top-1 -right-1 min-w-[18px] h-[18px]",
  lg: "text-sm -top-2 -right-2 min-w-[22px] h-[22px]",
  xl: "text-base -top-2 -right-2 min-w-[28px] h-[28px]",
};

export function GemDisplay({
  gemType,
  count = 0,
  shards = 0,
  size = "md",
  showCount = false,
  showShards = false,
  showName = false,
  showRarity = false,
  animate = true,
  onClick,
  isNew = false,
  disabled = false,
}: GemDisplayProps) {
  const gem = GEM_CONFIG[gemType];
  const rarity = RARITY_CONFIG[gem.rarity];
  const shardProgress = formatShardProgress(shards, gemType);

  return (
    <div className="flex flex-col items-center gap-1">
      {animate ? (
        <motion.div
          whileHover={onClick && !disabled ? { scale: 1.05 } : {}}
          whileTap={onClick && !disabled ? { scale: 0.95 } : {}}
          initial={isNew ? { scale: 0, rotate: -180 } : {}}
          animate={isNew ? { scale: 1, rotate: 0 } : {}}
          transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
          className={`
            relative flex items-center justify-center rounded-xl
            ${sizeClasses[size]}
            ${onClick && !disabled ? "cursor-pointer" : ""}
            ${disabled ? "opacity-50 grayscale" : ""}
          `}
          style={{
            background: `linear-gradient(135deg, ${rarity.color}20, ${rarity.color}40)`,
            border: `2px solid ${rarity.borderColor}`,
            boxShadow: isNew
              ? `0 0 20px ${rarity.glowColor}, 0 0 40px ${rarity.glowColor}`
              : `0 0 10px ${rarity.glowColor}`,
          }}
          onClick={onClick}
        >
        {/* Gem emoji */}
        <span
          className="drop-shadow-lg select-none"
          style={{
            filter: `drop-shadow(0 0 4px ${gem.color})`,
          }}
        >
          {gem.emoji}
        </span>

        {/* Count badge */}
        {showCount && count > 0 && (
          <span
            className={`
              absolute flex items-center justify-center
              bg-gray-900 text-white font-bold rounded-full
              border-2 border-white shadow-lg
              ${badgeSizes[size]}
            `}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}

        {/* New indicator */}
        {isNew && (
          <motion.div
            className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}

        {/* Legendary shimmer effect */}
        {gem.rarity === "legendary" && (
          <motion.div
            className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(45deg, transparent 30%, ${rarity.color}60 50%, transparent 70%)`,
                transform: "translateX(-100%)",
                animation: "shimmer 2s infinite",
              }}
            />
          </motion.div>
        )}
      </motion.div>
      ) : (
        <div
          className={`
            relative flex items-center justify-center rounded-xl
            ${sizeClasses[size]}
            ${onClick && !disabled ? "cursor-pointer" : ""}
            ${disabled ? "opacity-50 grayscale" : ""}
          `}
          style={{
            background: `linear-gradient(135deg, ${rarity.color}20, ${rarity.color}40)`,
            border: `2px solid ${rarity.borderColor}`,
            boxShadow: isNew
              ? `0 0 20px ${rarity.glowColor}, 0 0 40px ${rarity.glowColor}`
              : `0 0 10px ${rarity.glowColor}`,
          }}
          onClick={onClick}
        >
          <span
            className="drop-shadow-lg select-none"
            style={{
              filter: `drop-shadow(0 0 4px ${gem.color})`,
            }}
          >
            {gem.emoji}
          </span>

          {showCount && count > 0 && (
            <span
              className={`
                absolute flex items-center justify-center
                bg-gray-900 text-white font-bold rounded-full
                border-2 border-white shadow-lg
                ${badgeSizes[size]}
              `}
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </div>
      )}

      {/* Shard progress bar */}
      {showShards && shards > 0 && count === 0 && (
        <div className="w-full max-w-[80px] mt-1">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: rarity.color }}
              initial={{ width: 0 }}
              animate={{ width: `${shardProgress.percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-0.5">
            {shardProgress.current}/{shardProgress.needed}
          </p>
        </div>
      )}

      {/* Name and rarity labels */}
      {(showName || showRarity) && (
        <div className="text-center">
          {showName && (
            <p
              className="text-sm font-medium"
              style={{ color: rarity.color }}
            >
              {gem.name}
            </p>
          )}
          {showRarity && (
            <p className="text-xs text-gray-400">{rarity.name}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Compact inline gem display for HUD
export function GemInline({
  gemType,
  count,
}: {
  gemType: GemType;
  count: number;
}) {
  const gem = GEM_CONFIG[gemType];

  return (
    <span className="inline-flex items-center gap-0.5">
      <span>{gem.emoji}</span>
      <span className="text-sm font-medium">{count}</span>
    </span>
  );
}

// Shard display for inventory
export function ShardDisplay({
  gemType,
  shards,
  size = "md",
}: {
  gemType: GemType;
  shards: number;
  size?: "sm" | "md" | "lg";
}) {
  const gem = GEM_CONFIG[gemType];
  const rarity = RARITY_CONFIG[gem.rarity];
  const progress = formatShardProgress(shards, gemType);

  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`${sizes[size]} opacity-60`}>{gem.emoji}</span>
      <div className="flex-1">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: rarity.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-400">
        {progress.current}/{progress.needed}
      </span>
    </div>
  );
}
