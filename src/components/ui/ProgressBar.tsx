"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "diamond" | "emerald" | "gold" | "xp";
  className?: string;
}

export function ProgressBar({
  value,
  max,
  showText = false,
  size = "md",
  color = "diamond",
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div
      className={cn(
        "bg-[#1B1B1B] border-[#373737] relative",
        {
          "h-2 border-2": size === "sm",
          "h-4 border-3": size === "md",
          "h-6 border-4": size === "lg",
        },
        className
      )}
    >
      <div
        className={cn("h-full transition-all duration-500", {
          "bg-[var(--diamond)]": color === "diamond",
          "bg-[var(--emerald)]": color === "emerald",
          "bg-[var(--gold)]": color === "gold",
          "bg-gradient-to-b from-[#8F8] via-[#5D5] to-[#3B3]": color === "xp",
        })}
        style={{ width: `${percentage}%` }}
      />
      {showText && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-pixel text-[0.4em] text-white text-shadow-dark">
          {value}/{max}
        </div>
      )}
    </div>
  );
}

// XP Progress bar with custom styling
interface XPProgressProps {
  xp: number;
  xpNext: number;
}

export function XPProgress({ xp, xpNext }: XPProgressProps) {
  const percentage = (xp / xpNext) * 100;

  return (
    <div className="bg-[#1B1B1B] border-4 border-black h-[22px] relative">
      <div
        className="h-full bg-gradient-to-b from-[#8F8] via-[#5D5] to-[#3B3] transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-pixel text-[0.4em] text-white text-shadow-dark">
        {xp}/{xpNext} XP
      </div>
    </div>
  );
}
