"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// Get device ID for IDOR protection
function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  return localStorage.getItem("wordquest_device_id") || "unknown";
}

interface ParentLinkScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
}

export function ParentLinkScreen({ playerId, onBack }: ParentLinkScreenProps) {
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // SECURITY: Get device ID for ownership verification
  const deviceId = useMemo(() => getDeviceId(), []);

  const generateCode = useMutation(api.parents.generateLinkCode);
  const parentLink = useQuery(
    api.parents.getParentLink,
    playerId ? { playerId } : "skip"
  );
  const unlinkParent = useMutation(api.parents.unlinkParent);

  const handleGenerateCode = async () => {
    if (!playerId) return;
    setIsGenerating(true);
    try {
      const result = await generateCode({ playerId, callerClerkId: deviceId });
      if ('code' in result && 'expiresAt' in result) {
        setLinkCode(result.code);
        setExpiresAt(result.expiresAt);
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (linkCode) {
      navigator.clipboard.writeText(linkCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUnlink = async () => {
    if (!playerId) return;
    if (confirm("Are you sure you want to unlink your parent's account?")) {
      await unlinkParent({ playerId, callerClerkId: deviceId });
    }
  };

  // Format time remaining
  const getTimeRemaining = () => {
    if (!expiresAt) return "";
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return "Expired";
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="screen active" style={{ padding: "20px" }}>
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
          <h1 style={{ margin: 0, fontSize: "1.5em" }}>👨‍👩‍👧 PARENT LINK</h1>
          <p style={{ margin: 0, color: "#AAA", fontSize: "0.9em" }}>
            Connect with your parent on Telegram
          </p>
        </div>
      </div>

      {/* Already linked */}
      {parentLink && (
        <div style={{
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)",
          borderRadius: "15px",
          padding: "20px",
          border: "2px solid #22c55e",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
            <div style={{ fontSize: "3em" }}>✅</div>
            <div>
              <h3 style={{ margin: 0, color: "#22c55e" }}>Parent Connected!</h3>
              <p style={{ margin: 0, color: "#AAA", fontSize: "0.9em" }}>
                {parentLink.telegramUsername
                  ? `@${parentLink.telegramUsername}`
                  : "Via Telegram"}
              </p>
            </div>
          </div>
          <p style={{ color: "#AAA", marginBottom: "15px" }}>
            Your parent receives daily reports about your learning progress.
          </p>
          <button
            className="btn"
            onClick={handleUnlink}
            style={{
              background: "rgba(239, 68, 68, 0.2)",
              border: "2px solid #ef4444",
              color: "#fca5a5",
            }}
          >
            🔗 Unlink Parent
          </button>
        </div>
      )}

      {/* Not linked - Show instructions */}
      {!parentLink && (
        <>
          {/* Instructions */}
          <div style={{
            background: "rgba(59, 130, 246, 0.1)",
            borderRadius: "15px",
            padding: "20px",
            border: "1px solid #3b82f640",
            marginBottom: "20px",
          }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#60a5fa" }}>
              📱 How to connect your parent:
            </h3>
            <ol style={{ margin: 0, paddingLeft: "20px", color: "#AAA", lineHeight: "1.8" }}>
              <li>Generate a link code below</li>
              <li>
                Ask your parent to open Telegram and search for{" "}
                <code style={{ background: "#333", padding: "2px 6px", borderRadius: "3px" }}>
                  @WordQuestBot
                </code>
              </li>
              <li>Parent sends: <code style={{ background: "#333", padding: "2px 6px", borderRadius: "3px" }}>/link [your code]</code></li>
              <li>Done! Parent will receive daily reports 🎉</li>
            </ol>
          </div>

          {/* Generate Code Button */}
          {!linkCode && (
            <button
              className="btn btn-primary"
              onClick={handleGenerateCode}
              disabled={isGenerating || !playerId}
              style={{ width: "100%", justifyContent: "center", padding: "15px" }}
            >
              {isGenerating ? "🔄 Generating..." : "🔐 Generate Link Code"}
            </button>
          )}

          {/* Show Code */}
          {linkCode && (
            <div style={{
              background: "linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(126, 34, 206, 0.2) 100%)",
              borderRadius: "15px",
              padding: "25px",
              border: "2px solid #9333ea",
              textAlign: "center",
            }}>
              <p style={{ color: "#AAA", marginBottom: "10px" }}>Your link code:</p>
              <div style={{
                fontSize: "3em",
                fontWeight: "bold",
                letterSpacing: "10px",
                color: "#fff",
                fontFamily: "monospace",
                marginBottom: "10px",
              }}>
                {linkCode}
              </div>
              <p style={{ color: "#888", fontSize: "0.9em", marginBottom: "15px" }}>
                ⏱ {getTimeRemaining()}
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleCopyCode}
                  style={{ padding: "10px 20px" }}
                >
                  {copied ? "✅ Copied!" : "📋 Copy Code"}
                </button>
                <button
                  className="btn"
                  onClick={handleGenerateCode}
                  style={{
                    padding: "10px 20px",
                    background: "rgba(0,0,0,0.3)",
                    border: "2px solid #555",
                  }}
                >
                  🔄 New Code
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Benefits */}
      <div style={{ marginTop: "30px" }}>
        <h3 style={{ color: "#AAA", marginBottom: "15px" }}>
          ✨ What your parent gets:
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { icon: "📊", text: "Daily progress reports" },
            { icon: "📅", text: "Weekly learning summaries" },
            { icon: "🏆", text: "Achievement notifications" },
            { icon: "⚠️", text: "Alerts for weak topics" },
            { icon: "💪", text: "Encouragement reminders" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 15px",
                background: "rgba(0,0,0,0.2)",
                borderRadius: "8px",
              }}
            >
              <span style={{ fontSize: "1.3em" }}>{item.icon}</span>
              <span style={{ color: "#CCC" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
