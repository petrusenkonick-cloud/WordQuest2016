"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface LearningProfileScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
}

export function LearningProfileScreen({ playerId, onBack }: LearningProfileScreenProps) {
  const profile = useQuery(
    api.learning.getLearningProfile,
    playerId ? { playerId } : "skip"
  );

  const updateProfile = useMutation(api.learning.updateLearningProfile);

  const [preferredStyle, setPreferredStyle] = useState<string>("visual");
  const [explanationPref, setExplanationPref] = useState<string>("examples");
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load profile data
  useEffect(() => {
    if (profile) {
      setPreferredStyle(profile.preferredStyle || "visual");
      setExplanationPref(profile.explanationPreference || "examples");
      setHintsEnabled(profile.hintsEnabled);
      setVoiceEnabled(profile.voiceEnabled);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!playerId) return;
    setIsSaving(true);

    try {
      await updateProfile({
        playerId,
        preferredStyle,
        explanationPreference: explanationPref,
        hintsEnabled,
        voiceEnabled,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const learningStyles = [
    { id: "visual", icon: "👁️", name: "Visual", desc: "Learn best with pictures and diagrams" },
    { id: "audio", icon: "👂", name: "Audio", desc: "Learn best by listening" },
    { id: "reading", icon: "📖", name: "Reading", desc: "Learn best by reading text" },
    { id: "kinesthetic", icon: "✋", name: "Hands-on", desc: "Learn best by doing" },
  ];

  const explanationStyles = [
    { id: "short", icon: "⚡", name: "Quick & Short", desc: "Brief explanations" },
    { id: "examples", icon: "📋", name: "With Examples", desc: "Real-world examples" },
    { id: "detailed", icon: "📚", name: "Step-by-Step", desc: "Detailed breakdowns" },
    { id: "stories", icon: "📖", name: "Stories", desc: "Fun story format" },
  ];

  return (
    <div className="screen active" style={{ padding: "20px", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px" }}>
        <button
          className="btn"
          onClick={onBack}
          style={{ padding: "10px 15px", background: "rgba(0,0,0,0.3)" }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5em" }}>🧠 LEARNING PROFILE</h1>
          <p style={{ margin: 0, color: "#AAA", fontSize: "0.9em" }}>
            Customize how you learn
          </p>
        </div>
      </div>

      {/* Learning Style */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#AAA", marginBottom: "15px" }}>
          How do you learn best?
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          {learningStyles.map((style) => (
            <div
              key={style.id}
              onClick={() => setPreferredStyle(style.id)}
              style={{
                background: preferredStyle === style.id
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%)"
                  : "rgba(0,0,0,0.3)",
                borderRadius: "12px",
                padding: "15px",
                border: `2px solid ${preferredStyle === style.id ? "#3b82f6" : "#333"}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "2em", marginBottom: "8px" }}>{style.icon}</div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{style.name}</div>
              <div style={{ fontSize: "0.8em", color: "#888" }}>{style.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation Preference */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#AAA", marginBottom: "15px" }}>
          How should I explain things?
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          {explanationStyles.map((style) => (
            <div
              key={style.id}
              onClick={() => setExplanationPref(style.id)}
              style={{
                background: explanationPref === style.id
                  ? "linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(126, 34, 206, 0.3) 100%)"
                  : "rgba(0,0,0,0.3)",
                borderRadius: "12px",
                padding: "15px",
                border: `2px solid ${explanationPref === style.id ? "#9333ea" : "#333"}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "2em", marginBottom: "8px" }}>{style.icon}</div>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{style.name}</div>
              <div style={{ fontSize: "0.8em", color: "#888" }}>{style.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle Settings */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#AAA", marginBottom: "15px" }}>Features</h3>

        {/* Hints Toggle */}
        <div
          onClick={() => setHintsEnabled(!hintsEnabled)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "12px",
            padding: "15px",
            marginBottom: "10px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.5em" }}>💡</span>
            <div>
              <div style={{ fontWeight: "bold" }}>Hints Available</div>
              <div style={{ fontSize: "0.8em", color: "#888" }}>
                Show hint button during questions (costs 💎)
              </div>
            </div>
          </div>
          <div style={{
            width: "50px",
            height: "28px",
            borderRadius: "14px",
            background: hintsEnabled ? "#22c55e" : "#555",
            position: "relative",
            transition: "background 0.2s ease",
          }}>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "12px",
              background: "#fff",
              position: "absolute",
              top: "2px",
              left: hintsEnabled ? "24px" : "2px",
              transition: "left 0.2s ease",
            }} />
          </div>
        </div>

        {/* Voice Toggle */}
        <div
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "12px",
            padding: "15px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.5em" }}>🔊</span>
            <div>
              <div style={{ fontWeight: "bold" }}>Voice Explanations</div>
              <div style={{ fontSize: "0.8em", color: "#888" }}>
                Read explanations aloud
              </div>
            </div>
          </div>
          <div style={{
            width: "50px",
            height: "28px",
            borderRadius: "14px",
            background: voiceEnabled ? "#22c55e" : "#555",
            position: "relative",
            transition: "background 0.2s ease",
          }}>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "12px",
              background: "#fff",
              position: "absolute",
              top: "2px",
              left: voiceEnabled ? "24px" : "2px",
              transition: "left 0.2s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={isSaving}
        style={{
          width: "100%",
          justifyContent: "center",
          padding: "15px",
          fontSize: "1.1em",
        }}
      >
        {isSaving ? "🔄 Saving..." : saved ? "✅ Saved!" : "💾 Save Profile"}
      </button>

      {/* Info */}
      <div style={{
        marginTop: "20px",
        padding: "15px",
        background: "rgba(59, 130, 246, 0.1)",
        borderRadius: "10px",
        border: "1px solid #3b82f640",
      }}>
        <p style={{ margin: 0, color: "#AAA", fontSize: "0.9em" }}>
          💡 Your learning profile helps the app adapt to your style.
          The more you practice, the better it understands how you learn!
        </p>
      </div>
    </div>
  );
}
