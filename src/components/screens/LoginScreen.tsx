"use client";

import { useState, useEffect } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

const SKINS = ["🧑", "👦", "🧒", "🦸", "🧙", "🥷"];

interface LoginScreenProps {
  onStart: (name: string, skin: string) => void;
  defaultName?: string;
}

export function LoginScreen({ onStart, defaultName = "Misha" }: LoginScreenProps) {
  const [name, setName] = useState(defaultName);
  const [selectedSkin, setSelectedSkin] = useState("🧑");
  const [active, setActive] = useState(true);
  const [mode, setMode] = useState<"choice" | "guest">("choice");
  const { isSignedIn } = useAuth();

  const handleStart = () => {
    if (name.trim()) {
      setActive(false);
      setTimeout(() => onStart(name.trim(), selectedSkin), 500);
    }
  };

  // If signed in with Clerk, go directly to character creation
  useEffect(() => {
    if (isSignedIn && mode === "choice") {
      setMode("guest");
    }
  }, [isSignedIn, mode]);

  return (
    <div className={`login-screen ${active ? "active" : ""}`}>
      <div className="login-box">
        <h1>⛏️ WORDCRAFT</h1>
        <h2>English Learning Adventure</h2>

        {mode === "choice" && (
          <>
            <p style={{ color: "#AAA", margin: "20px 0 15px", fontSize: "1em" }}>
              Sign in to save your progress across devices
            </p>

            <SignInButton mode="modal">
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
              >
                🔐 SIGN IN
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
              >
                ✨ CREATE ACCOUNT
              </button>
            </SignUpButton>

            <div style={{ margin: "20px 0", color: "#666", fontSize: "0.9em" }}>
              ─── or ───
            </div>

            <button
              className="btn"
              onClick={() => setMode("guest")}
              style={{
                width: "100%",
                justifyContent: "center",
                background: "rgba(0,0,0,0.3)",
                border: "2px solid #555",
                color: "#AAA",
              }}
            >
              👤 PLAY AS GUEST
            </button>
          </>
        )}

        {mode === "guest" && (
          <>
            <input
              type="text"
              className="player-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name..."
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />

            <p style={{ color: "#AAA", margin: "15px 0 10px", fontSize: "1.1em" }}>
              Choose character:
            </p>

            <div className="skin-select">
              {SKINS.map((skin) => (
                <div
                  key={skin}
                  className={`skin-option ${selectedSkin === skin ? "selected" : ""}`}
                  onClick={() => setSelectedSkin(skin)}
                  data-skin={skin}
                >
                  {skin}
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleStart}
              style={{ width: "100%", justifyContent: "center", marginTop: "15px" }}
            >
              ▶️ PLAY
            </button>

            {!isSignedIn && (
              <button
                className="btn"
                onClick={() => setMode("choice")}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "10px",
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  fontSize: "0.9em",
                }}
              >
                ← Back to sign in options
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
