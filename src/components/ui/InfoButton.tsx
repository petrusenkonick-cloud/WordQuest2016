"use client";

import { useState } from "react";

interface InfoButtonProps {
  info: string;
}

export function InfoButton({ info }: InfoButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onBlur={() => setTimeout(() => setShowTooltip(false), 150)}
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: "1px solid rgba(139, 92, 246, 0.5)",
          background: "rgba(139, 92, 246, 0.2)",
          color: "#a78bfa",
          fontSize: "0.75em",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(139, 92, 246, 0.4)";
          e.currentTarget.style.borderColor = "#8b5cf6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
          e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
        }}
      >
        ?
      </button>

      {showTooltip && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
            border: "2px solid #8b5cf6",
            borderRadius: "12px",
            padding: "12px 15px",
            minWidth: "200px",
            maxWidth: "280px",
            zIndex: 1000,
            boxShadow: "0 8px 25px rgba(139, 92, 246, 0.4)",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              top: "-6px",
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: "10px",
              height: "10px",
              background: "#1e1b4b",
              borderLeft: "2px solid #8b5cf6",
              borderTop: "2px solid #8b5cf6",
            }}
          />

          {/* Mascot icon */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
          }}>
            <span style={{ fontSize: "1.5em" }}>🧙‍♂️</span>
            <p style={{
              margin: 0,
              color: "#e2e8f0",
              fontSize: "0.85em",
              lineHeight: "1.5",
            }}>
              {info}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
