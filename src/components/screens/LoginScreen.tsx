"use client";

import { useState } from "react";

const SKINS = ["🧑", "👦", "🧒", "🦸", "🧙", "🥷"];

interface LoginScreenProps {
  onStart: (name: string, skin: string) => void;
  defaultName?: string;
}

export function LoginScreen({ onStart, defaultName = "Misha" }: LoginScreenProps) {
  const [name, setName] = useState(defaultName);
  const [selectedSkin, setSelectedSkin] = useState("🧑");
  const [active, setActive] = useState(true);

  const handleStart = () => {
    if (name.trim()) {
      setActive(false);
      setTimeout(() => onStart(name.trim(), selectedSkin), 500);
    }
  };

  return (
    <div className={`login-screen ${active ? "active" : ""}`}>
      <div className="login-box">
        <h1>⛏️ WORDCRAFT</h1>
        <h2>English Learning Adventure</h2>

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
      </div>
    </div>
  );
}
