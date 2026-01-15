"use client";

import { useAppStore } from "@/lib/store";

export function HUD() {
  const player = useAppStore((state) => state.player);
  const xpPercent = (player.xp / player.xpNext) * 100;

  return (
    <div className="hud">
      <div className="hud-top">
        {/* Player Info */}
        <div className="player-info">
          <div className="player-avatar">{player.skin}</div>
          <div className="player-details">
            <h3>{player.name}</h3>
            <div className="player-level">
              <span className="level-badge">
                LVL <span>{player.level}</span>
              </span>
              <div className="xp-bar-mini">
                <div className="xp-bar-mini-fill" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Currencies */}
        <div className="currencies">
          <div className="currency-item diamonds">
            <span className="icon">💎</span>
            <span className="amount">{player.diamonds}</span>
          </div>
          <div className="currency-item emeralds">
            <span className="icon">🟢</span>
            <span className="amount">{player.emeralds}</span>
          </div>
          <div className="currency-item gold">
            <span className="icon">🪙</span>
            <span className="amount">{player.gold}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini HUD for in-game display
export function MiniHUD() {
  const player = useAppStore((state) => state.player);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
      {/* Hearts display (streak as lives) */}
      <div style={{ display: "flex", gap: "4px" }}>
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: "1.2em",
              opacity: i < Math.min(player.streak, 3) ? 1 : 0.3,
              filter: i >= Math.min(player.streak, 3) ? "grayscale(1)" : "none",
            }}
          >
            ❤️
          </span>
        ))}
      </div>

      {/* Compact currency */}
      <div className="currency-item diamonds">
        <span className="icon">💎</span>
        <span className="amount">{player.diamonds}</span>
      </div>
    </div>
  );
}
