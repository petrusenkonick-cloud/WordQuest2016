"use client";

import { useState, useEffect, useCallback } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const SKINS = ["🧑", "👦", "🧒", "🦸", "🧙", "🥷"];

interface LoginScreenProps {
  onStart: (name: string, skin: string) => void;
  defaultName?: string;
}

export function LoginScreen({ onStart, defaultName = "" }: LoginScreenProps) {
  const [name, setName] = useState(defaultName);
  const [selectedSkin, setSelectedSkin] = useState("🧑");
  const [active, setActive] = useState(true);
  const [mode, setMode] = useState<"choice" | "guest">("choice");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const { isSignedIn } = useAuth();

  // Query to check name availability
  const nameCheck = useQuery(
    api.players.isNameAvailable,
    name.trim().length >= 2 ? { name: name.trim() } : "skip"
  );

  // Update name error based on query result
  useEffect(() => {
    if (name.trim().length === 0) {
      setNameError(null);
      setIsCheckingName(false);
    } else if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      setIsCheckingName(false);
    } else if (name.trim().length > 20) {
      setNameError("Name must be 20 characters or less");
      setIsCheckingName(false);
    } else if (nameCheck === undefined) {
      setIsCheckingName(true);
      setNameError(null);
    } else {
      setIsCheckingName(false);
      if (!nameCheck.available) {
        setNameError(nameCheck.reason || "Name not available");
      } else {
        setNameError(null);
      }
    }
  }, [name, nameCheck]);

  const handleStart = useCallback(() => {
    if (name.trim() && !nameError && !isCheckingName) {
      setActive(false);
      setTimeout(() => onStart(name.trim(), selectedSkin), 500);
    }
  }, [name, nameError, isCheckingName, onStart, selectedSkin]);

  // If signed in with Clerk, go directly to character creation
  useEffect(() => {
    if (isSignedIn && mode === "choice") {
      setMode("guest");
    }
  }, [isSignedIn, mode]);

  const canPlay = name.trim().length >= 2 && !nameError && !isCheckingName;

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
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                className="player-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name..."
                onKeyDown={(e) => e.key === "Enter" && canPlay && handleStart()}
                maxLength={20}
                style={{
                  borderColor: nameError ? "#ef4444" : name.trim() && !isCheckingName && !nameError ? "#22c55e" : undefined,
                }}
              />
              {isCheckingName && (
                <div style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#888",
                  fontSize: "0.9em",
                }}>
                  ...
                </div>
              )}
              {!isCheckingName && name.trim().length >= 2 && !nameError && (
                <div style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#22c55e",
                  fontSize: "1.1em",
                }}>
                  ✓
                </div>
              )}
            </div>

            {nameError && (
              <p style={{
                color: "#ef4444",
                fontSize: "0.85em",
                margin: "8px 0 0",
                textAlign: "left",
              }}>
                ⚠️ {nameError}
              </p>
            )}

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
              disabled={!canPlay}
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: "15px",
                opacity: canPlay ? 1 : 0.5,
                cursor: canPlay ? "pointer" : "not-allowed",
              }}
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
