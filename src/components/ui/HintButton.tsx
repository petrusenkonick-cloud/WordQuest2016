"use client";

import { useState } from "react";

interface HintButtonProps {
  hint?: string;
  diamondCost?: number;
  playerDiamonds: number;
  onUseHint: () => void;
  disabled?: boolean;
}

export function HintButton({
  hint,
  diamondCost = 10,
  playerDiamonds,
  onUseHint,
  disabled = false,
}: HintButtonProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const canAfford = playerDiamonds >= diamondCost;

  const handleClick = () => {
    if (isRevealed) return;
    if (!canAfford) return;
    setShowConfirm(true);
  };

  const confirmUseHint = () => {
    setIsRevealed(true);
    setShowConfirm(false);
    onUseHint();
  };

  if (!hint) return null;

  return (
    <div style={{ position: "relative" }}>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            borderRadius: "15px",
            padding: "25px",
            maxWidth: "300px",
            textAlign: "center",
            border: "3px solid #60a5fa",
            boxShadow: "0 0 30px rgba(96, 165, 250, 0.3)",
          }}>
            <div style={{ fontSize: "3em", marginBottom: "15px" }}>💎</div>
            <h3 style={{ margin: "0 0 10px 0", color: "#fff" }}>Use a Hint?</h3>
            <p style={{ color: "#AAA", marginBottom: "20px" }}>
              This will cost <span style={{ color: "#60a5fa", fontWeight: "bold" }}>
                {diamondCost} 💎
              </span>
            </p>
            <p style={{ color: "#888", fontSize: "0.9em", marginBottom: "20px" }}>
              You have {playerDiamonds} 💎
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                className="btn"
                onClick={() => setShowConfirm(false)}
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "2px solid #555",
                  color: "#AAA",
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmUseHint}
              >
                💡 Get Hint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hint Button or Revealed Hint */}
      {isRevealed ? (
        <div style={{
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)",
          borderRadius: "10px",
          padding: "15px",
          border: "2px solid #f59e0b",
          marginTop: "15px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.5em" }}>💡</span>
            <span style={{ color: "#f59e0b", fontWeight: "bold" }}>HINT</span>
          </div>
          <p style={{ margin: 0, color: "#fcd34d", fontSize: "1.1em" }}>{hint}</p>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={disabled || !canAfford}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: canAfford
              ? "linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.3) 100%)"
              : "rgba(0,0,0,0.3)",
            border: `2px solid ${canAfford ? "#f59e0b" : "#555"}`,
            borderRadius: "8px",
            color: canAfford ? "#fcd34d" : "#666",
            cursor: canAfford && !disabled ? "pointer" : "not-allowed",
            fontSize: "1em",
            fontWeight: "bold",
            transition: "all 0.2s ease",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: "1.2em" }}>💡</span>
          <span>Hint</span>
          <span style={{
            background: canAfford ? "rgba(96, 165, 250, 0.3)" : "rgba(0,0,0,0.3)",
            padding: "2px 8px",
            borderRadius: "5px",
            fontSize: "0.9em",
          }}>
            -{diamondCost} 💎
          </span>
        </button>
      )}

      {/* Can't afford message */}
      {!canAfford && !isRevealed && (
        <div style={{
          fontSize: "0.8em",
          color: "#ef4444",
          marginTop: "5px",
        }}>
          Need {diamondCost - playerDiamonds} more 💎
        </div>
      )}
    </div>
  );
}
