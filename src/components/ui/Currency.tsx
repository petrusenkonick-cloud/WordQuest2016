"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CurrencyDisplayProps {
  diamonds: number;
  emeralds: number;
  gold: number;
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical";
}

export function CurrencyDisplay({
  diamonds,
  emeralds,
  gold,
  size = "md",
  layout = "horizontal",
}: CurrencyDisplayProps) {
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "flex gap-2",
        layout === "vertical" ? "flex-col" : "flex-row flex-wrap"
      )}
    >
      <CurrencySlot type="diamonds" amount={diamonds} size={size} />
      <CurrencySlot type="emeralds" amount={emeralds} size={size} />
      <CurrencySlot type="gold" amount={gold} size={size} />
    </motion.div>
  );
}

interface CurrencySlotProps {
  type: "diamonds" | "emeralds" | "gold";
  amount: number;
  size?: "sm" | "md" | "lg";
}

export function CurrencySlot({ type, amount, size = "md" }: CurrencySlotProps) {
  const icons = {
    diamonds: "💎",
    emeralds: "🟢",
    gold: "🪙",
  };

  const colors = {
    diamonds: {
      border: "#4AEDD9",
      glow: "rgba(74, 237, 217, 0.4)",
      text: "#4AEDD9",
    },
    emeralds: {
      border: "#17D049",
      glow: "rgba(23, 208, 73, 0.4)",
      text: "#17D049",
    },
    gold: {
      border: "#FCDB05",
      glow: "rgba(252, 219, 5, 0.4)",
      text: "#FCDB05",
    },
  };

  const sizeStyles = {
    sm: {
      container: "min-w-[60px] h-[32px] px-2",
      icon: "text-[0.9em]",
      text: "text-[0.4em]",
    },
    md: {
      container: "min-w-[75px] h-[38px] px-2.5",
      icon: "text-[1.1em]",
      text: "text-[0.5em]",
    },
    lg: {
      container: "min-w-[90px] h-[44px] px-3",
      icon: "text-[1.3em]",
      text: "text-[0.55em]",
    },
  };

  const color = colors[type];
  const sizeStyle = sizeStyles[size];

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className={cn(
        "relative flex items-center gap-2 justify-center",
        sizeStyle.container
      )}
      style={{
        background: "linear-gradient(135deg, #4A4A4A 0%, #2A2A2A 100%)",
        border: `3px solid ${color.border}`,
        boxShadow: `
          inset 2px 2px 0 rgba(255, 255, 255, 0.15),
          inset -2px -2px 0 rgba(0, 0, 0, 0.4),
          0 0 12px ${color.glow},
          3px 3px 0 rgba(0, 0, 0, 0.4)
        `,
      }}
    >
      {/* Icon with float animation */}
      <motion.span
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className={cn(sizeStyle.icon, "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]")}
      >
        {icons[type]}
      </motion.span>

      {/* Amount */}
      <span
        className={cn(
          "font-pixel",
          sizeStyle.text
        )}
        style={{
          color: color.text,
          textShadow: `0 0 6px ${color.glow}, 1px 1px 0 #000`,
        }}
      >
        {amount.toLocaleString()}
      </span>

      {/* Inner shine */}
      <div className="absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
    </motion.div>
  );
}

// Legacy CurrencyItem for backwards compatibility
export function CurrencyItem({ type, amount, size = "md" }: CurrencySlotProps) {
  return <CurrencySlot type={type} amount={amount} size={size} />;
}

// Floating currency animation for rewards
interface FloatingCurrencyProps {
  type: "diamonds" | "emeralds" | "gold" | "xp" | "star";
  amount: number;
  x: number;
  y: number;
  onComplete?: () => void;
}

export function FloatingCurrency({ type, amount, x, y, onComplete }: FloatingCurrencyProps) {
  const config = {
    diamonds: { icon: "💎", color: "#4AEDD9", glow: "rgba(74, 237, 217, 0.6)" },
    emeralds: { icon: "🟢", color: "#17D049", glow: "rgba(23, 208, 73, 0.6)" },
    gold: { icon: "🪙", color: "#FCDB05", glow: "rgba(252, 219, 5, 0.6)" },
    xp: { icon: "⭐", color: "#7FFF00", glow: "rgba(127, 255, 0, 0.6)" },
    star: { icon: "⭐", color: "#FCDB05", glow: "rgba(252, 219, 5, 0.6)" },
  };

  const { icon, color, glow } = config[type];

  return (
    <motion.div
      initial={{ opacity: 1, scale: 1, y: 0 }}
      animate={{
        opacity: [1, 1, 0],
        scale: [1, 1.3, 0.8],
        y: -100,
      }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: x,
        top: y,
      }}
    >
      <div
        className="font-pixel text-[1em] flex items-center gap-1"
        style={{
          color: color,
          textShadow: `0 0 8px ${glow}, 2px 2px 0 #000`,
        }}
      >
        <motion.span
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.span>
        <span>+{amount}</span>
      </div>
    </motion.div>
  );
}

// Reward burst animation - multiple floating items
interface RewardBurstProps {
  rewards: Array<{
    type: "diamonds" | "emeralds" | "gold" | "xp" | "star";
    amount: number;
  }>;
  x: number;
  y: number;
  onComplete?: () => void;
}

export function RewardBurst({ rewards, x, y, onComplete }: RewardBurstProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {rewards.map((reward, index) => (
        <motion.div
          key={`${reward.type}-${index}`}
          initial={{ opacity: 1, scale: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.8],
            x: (index - rewards.length / 2) * 40,
            y: -80 - index * 20,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.2,
            delay: index * 0.15,
            ease: "easeOut",
          }}
          className="fixed pointer-events-none z-[9999]"
          style={{ left: x, top: y }}
        >
          <FloatingCurrency
            type={reward.type}
            amount={reward.amount}
            x={0}
            y={0}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

// Inventory-style currency grid
interface CurrencyInventoryProps {
  diamonds: number;
  emeralds: number;
  gold: number;
}

export function CurrencyInventory({ diamonds, emeralds, gold }: CurrencyInventoryProps) {
  return (
    <div
      className="inline-flex gap-1 p-2"
      style={{
        background: "rgba(0, 0, 0, 0.75)",
        border: "3px solid #444",
        boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Diamond slot */}
      <InventorySlot type="diamonds" amount={diamonds} />
      {/* Emerald slot */}
      <InventorySlot type="emeralds" amount={emeralds} />
      {/* Gold slot */}
      <InventorySlot type="gold" amount={gold} />
    </div>
  );
}

interface InventorySlotProps {
  type: "diamonds" | "emeralds" | "gold";
  amount: number;
  selected?: boolean;
}

function InventorySlot({ type, amount, selected = false }: InventorySlotProps) {
  const icons = {
    diamonds: "💎",
    emeralds: "🟢",
    gold: "🪙",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        "relative w-[48px] h-[48px] flex items-center justify-center",
        "cursor-pointer"
      )}
      style={{
        background: "linear-gradient(135deg, #555 0%, #333 100%)",
        border: selected ? "2px solid white" : "2px solid #222",
        boxShadow: selected
          ? "inset 2px 2px 0 #666, inset -2px -2px 0 #333, 0 0 15px rgba(255, 255, 255, 0.5)"
          : "inset 2px 2px 0 #444, inset -2px -2px 0 #222",
      }}
    >
      <motion.span
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-[1.5em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
      >
        {icons[type]}
      </motion.span>

      {/* Amount badge */}
      <div
        className="absolute bottom-0 right-0 px-1 font-pixel text-[0.4em] text-white"
        style={{
          background: "rgba(0, 0, 0, 0.7)",
          textShadow: "1px 1px 0 #000",
        }}
      >
        {amount > 999 ? "999+" : amount}
      </div>
    </motion.div>
  );
}
