"use client";

import { useEffect, useState } from "react";

interface StartHereIndicatorProps {
  children: React.ReactNode;
  active?: boolean;
  label?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export function StartHereIndicator({
  children,
  active = true,
  label = "START HERE!",
  position = "top-right",
}: StartHereIndicatorProps) {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (active) {
      const interval = setInterval(() => {
        setPulse((prev) => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [active]);

  if (!active) {
    return <>{children}</>;
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    "top-right": { top: "-10px", right: "-10px" },
    "top-left": { top: "-10px", left: "-10px" },
    "bottom-right": { bottom: "-10px", right: "-10px" },
    "bottom-left": { bottom: "-10px", left: "-10px" },
  };

  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
      {children}

      {/* Pulsing indicator */}
      <div
        style={{
          position: "absolute",
          ...positionStyles[position],
          zIndex: 10,
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: pulse ? "80px" : "60px",
            height: pulse ? "80px" : "60px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)",
            transition: "all 0.5s ease",
            pointerEvents: "none",
          }}
        />

        {/* Badge */}
        <div
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            color: "#000",
            borderRadius: "10px",
            padding: "6px 12px",
            fontSize: "0.7em",
            fontWeight: "bold",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 15px rgba(251, 191, 36, 0.5)",
            transform: pulse ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ fontSize: "1.2em" }}>⭐</span>
          {label}
        </div>
      </div>

      {/* Highlight border */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: "inherit",
          border: `3px solid ${pulse ? "#fbbf24" : "rgba(251, 191, 36, 0.5)"}`,
          transition: "border-color 0.3s ease",
          pointerEvents: "none",
          animation: "pulse-border 2s infinite",
        }}
      />

      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(251, 191, 36, 0); }
        }
      `}</style>
    </div>
  );
}
