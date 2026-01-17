"use client";

import { useState, useEffect, useCallback } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const SKINS = ["🧑", "👦", "👧", "🦸", "🧙", "🥷", "🧝", "🤴"];

// Age groups with fun animal mascots
const AGE_GROUPS = [
  { id: "5-6", label: "5-6 years", sublabel: "Grade 1", emoji: "🐣", color: "#FFE066" },
  { id: "7-8", label: "7-8 years", sublabel: "Grade 2-3", emoji: "🐥", color: "#4ECDC4" },
  { id: "9-10", label: "9-10 years", sublabel: "Grade 4-5", emoji: "🦊", color: "#FF6B6B" },
  { id: "11-12", label: "11-12 years", sublabel: "Grade 6-7", emoji: "🦁", color: "#45B7D1" },
  { id: "13+", label: "13+ years", sublabel: "Grade 8+", emoji: "🐺", color: "#96CEB4" },
];

// Map to grade ranges for backend
const ageGroupToGradeRange: Record<string, { minGrade: number; maxGrade: number; ageGroup: string }> = {
  "5-6": { minGrade: 1, maxGrade: 1, ageGroup: "6-8" },
  "7-8": { minGrade: 2, maxGrade: 3, ageGroup: "6-8" },
  "9-10": { minGrade: 4, maxGrade: 5, ageGroup: "9-11" },
  "11-12": { minGrade: 6, maxGrade: 7, ageGroup: "9-11" },
  "13+": { minGrade: 8, maxGrade: 11, ageGroup: "12+" },
};

interface LoginScreenProps {
  onStart: (name: string, skin: string, ageData?: { ageGroup: string; gradeLevel: number }) => void;
  defaultName?: string;
}

export function LoginScreen({ onStart, defaultName = "" }: LoginScreenProps) {
  const [name, setName] = useState(defaultName);
  const [selectedSkin, setSelectedSkin] = useState("🧑");
  const [active, setActive] = useState(true);
  const [mode, setMode] = useState<"choice" | "age-select" | "guest">("choice");
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
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
    if (name.trim() && !nameError && !isCheckingName && selectedAge) {
      setActive(false);
      const ageMapping = ageGroupToGradeRange[selectedAge];
      const ageData = {
        ageGroup: ageMapping.ageGroup,
        gradeLevel: Math.floor((ageMapping.minGrade + ageMapping.maxGrade) / 2), // Use middle grade
      };
      setTimeout(() => onStart(name.trim(), selectedSkin, ageData), 500);
    }
  }, [name, nameError, isCheckingName, onStart, selectedSkin, selectedAge]);

  const handleAgeSelect = (ageId: string) => {
    setSelectedAge(ageId);
  };

  const handleContinueToCharacter = () => {
    if (selectedAge) {
      setMode("guest");
    }
  };

  // If signed in with Clerk, go directly to age selection (not character creation)
  useEffect(() => {
    if (isSignedIn && mode === "choice") {
      setMode("age-select");
    }
  }, [isSignedIn, mode]);

  const canPlay = name.trim().length >= 2 && !nameError && !isCheckingName && selectedAge;

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
              onClick={() => setMode("age-select")}
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

        {mode === "age-select" && (
          <>
            <p style={{ color: "#4ECDC4", margin: "15px 0 10px", fontSize: "1.1em", fontWeight: "bold" }}>
              How old are you?
            </p>
            <p style={{ color: "#AAA", margin: "0 0 15px", fontSize: "0.9em" }}>
              We&apos;ll customize quests just for you!
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px",
              marginBottom: "15px",
            }}>
              {AGE_GROUPS.map((age) => (
                <button
                  key={age.id}
                  onClick={() => handleAgeSelect(age.id)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: "12px",
                    border: selectedAge === age.id ? `3px solid ${age.color}` : "2px solid #444",
                    background: selectedAge === age.id ? `${age.color}22` : "rgba(0,0,0,0.3)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "2em" }}>{age.emoji}</span>
                  <span style={{
                    color: selectedAge === age.id ? age.color : "#FFF",
                    fontWeight: "bold",
                    fontSize: "0.9em"
                  }}>
                    {age.label}
                  </span>
                  <span style={{ color: "#888", fontSize: "0.75em" }}>
                    {age.sublabel}
                  </span>
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleContinueToCharacter}
              disabled={!selectedAge}
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: "10px",
                opacity: selectedAge ? 1 : 0.5,
                cursor: selectedAge ? "pointer" : "not-allowed",
              }}
            >
              Next →
            </button>

            {!isSignedIn && (
              <button
                className="btn"
                onClick={() => { setMode("choice"); setSelectedAge(null); }}
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
                ← Back
              </button>
            )}
          </>
        )}

        {mode === "guest" && (
          <>
            {/* Show selected age */}
            {selectedAge && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "rgba(78, 205, 196, 0.15)",
                borderRadius: "8px",
                marginBottom: "15px",
              }}>
                <span style={{ fontSize: "1.5em" }}>
                  {AGE_GROUPS.find(a => a.id === selectedAge)?.emoji}
                </span>
                <span style={{ color: "#4ECDC4", fontSize: "0.9em" }}>
                  {AGE_GROUPS.find(a => a.id === selectedAge)?.label}
                </span>
                <button
                  onClick={() => setMode("age-select")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    padding: "2px 6px",
                    fontSize: "0.8em",
                  }}
                >
                  change
                </button>
              </div>
            )}

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
              Choose your character:
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

            <button
              className="btn"
              onClick={() => setMode("age-select")}
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
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
