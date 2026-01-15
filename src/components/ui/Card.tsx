"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "stone" | "dirt" | "grass" | "wood" | "obsidian" | "chest";
  depth?: "flat" | "shallow" | "deep";
  glow?: "none" | "gold" | "diamond" | "emerald" | "redstone";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "stone", depth = "shallow", glow = "none", children, ...props }, ref) => {
    const baseStyles = "relative overflow-hidden transition-all duration-200";

    const variantStyles = {
      stone: `
        bg-gradient-to-b from-[#A0A0A0] via-[#8A8A8A] to-[#5A5A5A]
        border-[#3A3A3A]
      `,
      dirt: `
        bg-gradient-to-b from-[#9D6B3A] via-[#8B5A2B] to-[#5D3A1A]
        border-[#3D2510]
      `,
      grass: `
        bg-[linear-gradient(180deg,#8BD45A_0%,#7EC850_4%,#5D8C3E_8%,#9D6B3A_8%,#8B5A2B_70%,#5D3A1A_100%)]
        border-[#3D6628]
      `,
      wood: `
        bg-[repeating-linear-gradient(0deg,#D4A574_0px,#BA8C63_3px,#BA8C63_8px,#8B6B4A_10px,#BA8C63_12px)]
        border-[#5D4030]
      `,
      obsidian: `
        bg-gradient-to-b from-[#3D3D5C] via-[#1B1B2F] to-[#0D0D1A]
        border-[#0A0A15]
      `,
      chest: `
        bg-[repeating-linear-gradient(0deg,#8B6914_0px,#A67C00_2px,#A67C00_6px,#705212_8px)]
        border-[#5C4A00]
      `,
    };

    const depthStyles = {
      flat: "border-2 shadow-none",
      shallow: `
        border-4
        shadow-[inset_2px_2px_0_rgba(255,255,255,0.2),inset_-2px_-2px_0_rgba(0,0,0,0.3),3px_3px_0_rgba(0,0,0,0.4),4px_4px_8px_rgba(0,0,0,0.3)]
      `,
      deep: `
        border-4
        shadow-[inset_4px_4px_0_rgba(255,255,255,0.25),inset_-4px_-4px_0_rgba(0,0,0,0.4),6px_6px_0_rgba(0,0,0,0.5),8px_8px_16px_rgba(0,0,0,0.4)]
      `,
    };

    const glowStyles = {
      none: "",
      gold: "shadow-[0_0_20px_rgba(252,219,5,0.4),inset_0_0_20px_rgba(252,219,5,0.1)]",
      diamond: "shadow-[0_0_20px_rgba(74,237,217,0.4),inset_0_0_20px_rgba(74,237,217,0.1)]",
      emerald: "shadow-[0_0_20px_rgba(23,208,73,0.4),inset_0_0_20px_rgba(23,208,73,0.1)]",
      redstone: "shadow-[0_0_15px_rgba(255,26,26,0.5),inset_0_0_15px_rgba(255,26,26,0.1)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          depthStyles[depth],
          glow !== "none" && glowStyles[glow],
          "p-4",
          className
        )}
        {...props}
      >
        {/* Texture overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_25%,rgba(255,255,255,0.1)_1px,transparent_2px),radial-gradient(ellipse_at_75%_75%,rgba(0,0,0,0.15)_1px,transparent_2px)] bg-[length:12px_12px] pointer-events-none" />

        {/* Top highlight */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";

// Stat Card for displaying stats on home screen
interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  color?: "gold" | "diamond" | "emerald" | "default";
}

function StatCard({ icon, value, label, color = "gold" }: StatCardProps) {
  const colorStyles = {
    gold: "text-[#FCDB05]",
    diamond: "text-[#4AEDD9]",
    emerald: "text-[#17D049]",
    default: "text-white",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="relative"
    >
      <Card variant="obsidian" depth="shallow" className="text-center p-3 min-h-[90px]">
        {/* Glowing icon */}
        <div className="text-[1.8em] mb-1.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
          {icon}
        </div>

        {/* Value with glow */}
        <div className={cn(
          "font-pixel text-[0.9em] text-shadow-dark",
          colorStyles[color],
          color === "gold" && "drop-shadow-[0_0_6px_rgba(252,219,5,0.5)]"
        )}>
          {value}
        </div>

        {/* Label */}
        <div className="text-[0.85em] text-[#9090A0] mt-1 uppercase tracking-wide">
          {label}
        </div>
      </Card>
    </motion.div>
  );
}

// Level Card for displaying levels
interface LevelCardProps {
  icon: string;
  name: string;
  desc: string;
  rewards: { diamonds: number; xp: number };
  stars: number;
  completed: boolean;
  locked: boolean;
  onClick: () => void;
}

function LevelCard({
  icon,
  name,
  desc,
  rewards,
  stars,
  completed,
  locked,
  onClick,
}: LevelCardProps) {
  return (
    <motion.div
      whileHover={locked ? {} : { scale: 1.03, y: -4 }}
      whileTap={locked ? {} : { scale: 0.98 }}
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-200",
        "border-4",
        locked && "cursor-not-allowed"
      )}
      onClick={locked ? undefined : onClick}
    >
      {/* Background based on state */}
      <div className={cn(
        "absolute inset-0",
        completed
          ? "bg-[linear-gradient(180deg,#50FF7F_0%,#17D049_4%,#0C9430_8%,#9D6B3A_8%,#8B5A2B_70%,#5D3A1A_100%)]"
          : locked
            ? "bg-gradient-to-b from-[#6A6A6A] via-[#5A5A5A] to-[#3A3A3A]"
            : "bg-[linear-gradient(180deg,#8BD45A_0%,#7EC850_4%,#5D8C3E_8%,#9D6B3A_8%,#8B5A2B_70%,#5D3A1A_100%)]"
      )} />

      {/* Dirt texture overlay */}
      <div className="absolute inset-0 top-[8%] bg-[radial-gradient(ellipse_at_25%_60%,rgba(157,107,58,0.3)_1px,transparent_2px),radial-gradient(ellipse_at_75%_40%,rgba(93,58,26,0.4)_2px,transparent_3px)] bg-[length:16px_16px] pointer-events-none" />

      {/* 3D Block shadow */}
      <div className={cn(
        "absolute inset-0",
        "shadow-[inset_3px_3px_0_rgba(255,255,255,0.25),inset_-3px_-3px_0_rgba(0,0,0,0.35)]",
        completed && "shadow-[inset_3px_3px_0_rgba(255,255,255,0.35),inset_-3px_-3px_0_rgba(0,0,0,0.25),0_0_20px_rgba(23,208,73,0.3)]",
        !locked && !completed && "hover:shadow-[inset_3px_3px_0_rgba(255,255,255,0.35),inset_-3px_-3px_0_rgba(0,0,0,0.25)]"
      )} style={{
        borderColor: completed ? "#085020" : locked ? "#3A3A3A" : "#3D6628",
        boxShadow: locked ? "none" : undefined,
      }} />

      {/* Content */}
      <div className={cn(
        "relative z-10 p-4",
        locked && "opacity-60 grayscale-[0.5]"
      )}>
        {/* Header row */}
        <div className="flex justify-between items-start mb-2">
          {/* Floating icon */}
          <motion.span
            animate={locked ? {} : { y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-[2.2em] drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
          >
            {icon}
          </motion.span>

          {/* Reward badges */}
          <div className="flex gap-1.5">
            <span className="bg-black/60 backdrop-blur-sm px-2 py-1 text-[0.75em] text-[#4AEDD9] font-pixel rounded-sm border border-[#4AEDD9]/30 shadow-[0_0_8px_rgba(74,237,217,0.2)]">
              💎{rewards.diamonds}
            </span>
            <span className="bg-black/60 backdrop-blur-sm px-2 py-1 text-[0.75em] text-[#7FFF00] font-pixel rounded-sm border border-[#7FFF00]/30 shadow-[0_0_8px_rgba(127,255,0,0.2)]">
              ⭐{rewards.xp}xp
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-pixel text-[0.65em] text-white text-shadow-lg mb-2 leading-relaxed tracking-wide">
          {name}
        </h3>

        {/* Description */}
        <p className="text-[#E0D0C0] text-[0.95em] text-shadow-dark leading-snug">
          {desc}
        </p>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-3">
          {/* XP bar container */}
          <div className="flex-1 h-3 bg-[#1A1A1A] border-2 border-[#333] rounded-sm overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: completed ? "100%" : `${(stars / 3) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "h-full",
                completed
                  ? "bg-gradient-to-r from-[#17D049] to-[#50FF7F] shadow-[0_0_10px_#17D049]"
                  : "bg-gradient-to-r from-[#4AEDD9] to-[#7FFFD4] shadow-[0_0_10px_#4AEDD9]"
              )}
            />
          </div>

          {/* Star display */}
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: i < stars ? 1 : 0.7,
                  rotate: i < stars ? 0 : 0,
                }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className={cn(
                  "text-[1em]",
                  i < stars
                    ? "drop-shadow-[0_0_6px_rgba(252,219,5,0.8)]"
                    : "opacity-30 grayscale"
                )}
              >
                ⭐
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[2.5em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          >
            🔒
          </motion.div>
        </div>
      )}

      {/* Completed sparkle effect */}
      {completed && (
        <div className="absolute top-2 right-2">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="text-[1.2em] drop-shadow-[0_0_8px_rgba(23,208,73,0.8)]"
          >
            ✨
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// Shop Item Card
interface ShopItemCardProps {
  icon: string;
  name: string;
  price: number;
  currency: string;
  owned: boolean;
  effect?: string;
  onClick: () => void;
}

function ShopItemCard({
  icon,
  name,
  price,
  currency,
  owned,
  effect,
  onClick,
}: ShopItemCardProps) {
  const currencyIcon = currency === "diamonds" ? "💎" : currency === "emeralds" ? "🟢" : "🪙";
  const currencyColor = currency === "diamonds" ? "#4AEDD9" : currency === "emeralds" ? "#17D049" : "#FCDB05";

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden cursor-pointer",
        "bg-gradient-to-b from-[#4A4A4A] via-[#3A3A3A] to-[#2A2A2A]",
        "border-4 p-4 text-center",
        "transition-all duration-200",
        owned
          ? "border-[#17D049] shadow-[0_0_15px_rgba(23,208,73,0.3),inset_0_0_20px_rgba(23,208,73,0.1)]"
          : "border-[#2A2A2A] hover:border-[#FCDB05] hover:shadow-[0_0_15px_rgba(252,219,5,0.3)]"
      )}
      onClick={onClick}
    >
      {/* 3D shadow effect */}
      <div className="absolute inset-0 shadow-[inset_3px_3px_0_rgba(255,255,255,0.15),inset_-3px_-3px_0_rgba(0,0,0,0.4)]" />

      {/* Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,0.08)_1px,transparent_2px)] bg-[length:8px_8px]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Item icon with float animation */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-[2.5em] mb-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
        >
          {icon}
        </motion.div>

        {/* Item name */}
        <div className="font-pixel text-[0.5em] text-white text-shadow-dark mb-1.5 uppercase tracking-wider">
          {name}
        </div>

        {/* Effect text */}
        {effect && (
          <div className="text-[0.8em] text-[#17D049] mb-2 drop-shadow-[0_0_4px_rgba(23,208,73,0.5)]">
            {effect}
          </div>
        )}

        {/* Price or owned badge */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 font-pixel text-[0.55em] px-3 py-1",
            owned
              ? "bg-[#17D049]/20 text-[#50FF7F] border border-[#17D049]/50"
              : "bg-black/30 border border-white/10"
          )}
          style={{ color: owned ? "#50FF7F" : currencyColor }}
        >
          {owned ? (
            <>✓ OWNED</>
          ) : (
            <>
              <span>{currencyIcon}</span>
              <span>{price}</span>
            </>
          )}
        </div>
      </div>

      {/* Owned glow effect */}
      {owned && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#17D049]/10 to-transparent pointer-events-none" />
      )}
    </motion.div>
  );
}

// Achievement Card
interface AchievementCardProps {
  icon: string;
  name: string;
  desc: string;
  reward: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

function AchievementCard({
  icon,
  name,
  desc,
  reward,
  unlocked,
  progress,
  target,
}: AchievementCardProps) {
  const progressPercent = Math.min((progress / target) * 100, 100);

  return (
    <motion.div
      whileHover={unlocked ? { scale: 1.02 } : {}}
      className={cn(
        "relative overflow-hidden mb-3",
        unlocked && "cursor-pointer"
      )}
    >
      <Card
        variant="obsidian"
        depth="shallow"
        glow={unlocked ? "gold" : "none"}
        className={cn(
          "flex items-center gap-4",
          !unlocked && "opacity-70"
        )}
      >
        {/* Icon container */}
        <div className={cn(
          "relative w-[65px] h-[65px] flex items-center justify-center rounded-sm",
          "bg-gradient-to-b from-[#3A3A3A] to-[#2A2A2A]",
          "border-2",
          unlocked ? "border-[#FCDB05]" : "border-[#4A4A4A]"
        )}>
          <motion.span
            animate={unlocked ? { rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
            className={cn(
              "text-[2em]",
              unlocked
                ? "drop-shadow-[0_0_12px_rgba(252,219,5,0.6)]"
                : "grayscale opacity-60"
            )}
          >
            {icon}
          </motion.span>

          {/* Unlocked badge */}
          {unlocked && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FCDB05] rounded-full flex items-center justify-center text-[0.6em] shadow-[0_0_8px_rgba(252,219,5,0.6)]">
              ✓
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Title */}
          <h3 className={cn(
            "font-pixel text-[0.6em] text-shadow-dark mb-1",
            unlocked ? "text-[#FCDB05]" : "text-[#808090]"
          )}>
            {name}
          </h3>

          {/* Description */}
          <p className="text-[#9090A0] text-[0.9em] leading-snug mb-2">
            {desc}
          </p>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#1A1A1A] border border-[#333] rounded-sm overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "h-full",
                  unlocked
                    ? "bg-gradient-to-r from-[#FCDB05] to-[#FFE866]"
                    : "bg-gradient-to-r from-[#6A6A6A] to-[#8A8A8A]"
                )}
              />
            </div>
            <span className={cn(
              "text-[0.75em] font-pixel",
              unlocked ? "text-[#FCDB05]" : "text-[#6A6A6A]"
            )}>
              {progress}/{target}
            </span>
          </div>
        </div>

        {/* Reward */}
        <div className={cn(
          "text-right font-pixel text-[0.55em] px-3 py-2",
          "bg-black/30 rounded-sm border",
          unlocked
            ? "text-[#50FF7F] border-[#17D049]/30"
            : "text-[#6A6A6A] border-[#3A3A3A]"
        )}>
          {reward}
        </div>
      </Card>
    </motion.div>
  );
}

export { Card, StatCard, LevelCard, ShopItemCard, AchievementCard };
