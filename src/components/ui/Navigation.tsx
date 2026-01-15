"use client";

import { cn } from "@/lib/utils";

export type Screen = "home" | "shop" | "inventory" | "achievements" | "game";

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const NAV_ITEMS = [
  { id: "home" as const, icon: "🏠", label: "HOME" },
  { id: "shop" as const, icon: "🏪", label: "SHOP" },
  { id: "inventory" as const, icon: "🎒", label: "BAG" },
  { id: "achievements" as const, icon: "🏆", label: "AWARDS" },
];

export function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  // Don't show navigation on game screen
  if (currentScreen === "game") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-[#2D2D2D] to-[#1B1B1B] border-t-4 border-[#373737] p-1.5 flex justify-center gap-1.5 z-[100]">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={cn(
            "stone-button border-[3px] border-[#2D2D2D] px-4 py-1.5 cursor-pointer transition-all duration-200 flex flex-col items-center gap-0.5",
            currentScreen === item.id &&
              "bg-gradient-to-b from-[var(--gold)] to-[#D4A800] border-[#8B7000]"
          )}
        >
          <span className="text-[1.2em]">{item.icon}</span>
          <span className="font-pixel text-[0.3em] text-white">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
