"use client";

import { ReactNode } from "react";
import { useAppStore } from "@/lib/store";
import { HUD } from "./HUD";
import { BottomNav } from "./BottomNav";
import { Id } from "../../../convex/_generated/dataModel";

interface GameWorldProps {
  children: ReactNode;
  playerId?: Id<"players"> | null;
}

export function GameWorld({ children, playerId }: GameWorldProps) {
  const particles = useAppStore((state) => state.particles);
  const floatingRewards = useAppStore((state) => state.floatingRewards);

  return (
    <div className="game-world active">
      {/* Clouds */}
      <div className="clouds-container">
        <div className="cloud" style={{ top: "30px", animationDuration: "80s" }} />
        <div
          className="cloud"
          style={{ top: "70px", animationDuration: "100s", animationDelay: "-30s" }}
        />
        <div
          className="cloud"
          style={{ top: "50px", animationDuration: "90s", animationDelay: "-60s" }}
        />
      </div>

      {/* Sun */}
      <div className="sun" />

      {/* HUD */}
      <HUD playerId={playerId} />

      {/* Main Content */}
      <div className="main-container">{children}</div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Particles */}
      <div className="particles" id="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}px`,
              top: "-50px",
              animationDelay: `${particle.delay}s`,
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      {/* Floating XP */}
      {floatingRewards
        .filter((r) => r.type === "xp")
        .map((reward) => (
          <div
            key={reward.id}
            className="xp-float"
            style={{ left: `${reward.x}%`, top: `${reward.y}px` }}
          >
            +{reward.amount} XP
          </div>
        ))}

      {/* Floating Currency */}
      {floatingRewards
        .filter((r) => r.type !== "xp")
        .map((reward) => (
          <div
            key={reward.id}
            className="currency-float"
            style={{
              left: `${reward.x}%`,
              top: `${reward.y}px`,
              color:
                reward.type === "diamonds"
                  ? "var(--diamond)"
                  : reward.type === "emeralds"
                    ? "var(--emerald)"
                    : "var(--gold)",
            }}
          >
            {reward.type === "diamonds"
              ? "💎"
              : reward.type === "emeralds"
                ? "🟢"
                : "🪙"}{" "}
            +{reward.amount}
          </div>
        ))}
    </div>
  );
}
