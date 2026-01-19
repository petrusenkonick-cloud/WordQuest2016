"use client";

import { useAppStore } from "@/lib/store";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AudioControls } from "./AudioControls";

interface HUDProps {
  playerId?: Id<"players"> | null;
  onProfileSettings?: () => void;
  onLevelClick?: () => void;
}

export function HUD({ playerId, onProfileSettings, onLevelClick }: HUDProps = {}) {
  const player = useAppStore((state) => state.player);
  const toggleGemInventory = useAppStore((state) => state.toggleGemInventory);
  const xpPercent = (player.xp / player.xpNext) * 100;

  // Fetch gem count if playerId is provided
  const playerGems = useQuery(
    api.gems.getPlayerGems,
    playerId ? { playerId } : "skip"
  );

  // Fetch player profile to get normalizedScore
  const playerProfile = useQuery(
    api.profile.getPlayerProfile,
    playerId ? { playerId } : "skip"
  );

  const totalGems = playerGems?.reduce((sum, g) => sum + g.wholeGems, 0) || 0;

  // Use normalizedScore if available, otherwise fallback to simple formula
  const displayScore = playerProfile?.normalizedScore && playerProfile.normalizedScore > 0
    ? playerProfile.normalizedScore
    : (player.totalStars || 0) * 100 + (player.xp || 0);

  return (
    <div className="hud">
      <div className="hud-top">
        {/* Player Info - Clickable for settings */}
        <div
          className="player-info"
          onClick={onProfileSettings}
          style={{ cursor: onProfileSettings ? "pointer" : "default" }}
        >
          <div className="player-avatar">{player.skin}</div>
          <div className="player-details">
            <h3>{player.name}</h3>
            <div
              className="player-level"
              onClick={(e) => {
                if (onLevelClick) {
                  e.stopPropagation();
                  onLevelClick();
                }
              }}
              style={{ cursor: onLevelClick ? "pointer" : "default" }}
              title={onLevelClick ? "View Milestones" : undefined}
            >
              <span className="level-badge">
                LVL <span>{player.level}</span>
              </span>
              <div className="xp-bar-mini">
                <div className="xp-bar-mini-fill" style={{ width: `${xpPercent}%` }} />
              </div>
              <span className="score-badge" style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                color: "#000",
                padding: "4px 10px",
                borderRadius: "10px",
                fontSize: "0.85em",
                fontWeight: "bold",
                marginLeft: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 2px 6px rgba(251, 191, 36, 0.4)",
              }}>
                ⭐ {displayScore.toLocaleString()}
              </span>
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
          {/* Gems - only show if player has gems */}
          {playerId && (
            <div
              className="currency-item"
              style={{
                background: "linear-gradient(135deg, #A855F720, #A855F740)",
                border: "2px solid #A855F7",
                cursor: "pointer",
              }}
              onClick={toggleGemInventory}
              title="Open Gem Inventory"
            >
              <span className="icon">💠</span>
              <span className="amount" style={{ color: "#A855F7" }}>
                {totalGems}
              </span>
            </div>
          )}
          {/* Audio Controls */}
          <AudioControls compact />
        </div>
      </div>
    </div>
  );
}

// Mini HUD for in-game display
export function MiniHUD() {
  const player = useAppStore((state) => state.player);
  const sessionGemsFound = useAppStore((state) => state.gems.sessionGemsFound);

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

      {/* Session gems found */}
      {sessionGemsFound > 0 && (
        <div
          className="currency-item"
          style={{
            background: "linear-gradient(135deg, #A855F720, #A855F740)",
            border: "2px solid #A855F7",
            animation: "pulse 2s infinite",
          }}
        >
          <span className="icon">💠</span>
          <span className="amount" style={{ color: "#A855F7" }}>
            +{sessionGemsFound}
          </span>
        </div>
      )}
    </div>
  );
}
