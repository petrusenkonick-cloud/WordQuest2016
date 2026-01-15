"use client";

import { useAppStore } from "@/lib/store";

const NAV_ITEMS = [
  { id: "home", icon: "🏠", label: "HOME" },
  { id: "shop", icon: "🏪", label: "SHOP" },
  { id: "inventory", icon: "🎒", label: "BAG" },
  { id: "achievements", icon: "🏆", label: "AWARDS" },
] as const;

export function BottomNav() {
  const currentScreen = useAppStore((state) => state.ui.currentScreen);
  const setScreen = useAppStore((state) => state.setScreen);

  return (
    <div className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <div
          key={item.id}
          className={`nav-btn ${currentScreen === item.id ? "active" : ""}`}
          onClick={() => setScreen(item.id as typeof currentScreen)}
        >
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
