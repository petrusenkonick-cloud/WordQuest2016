"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface ParentSettingsScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
}

export function ParentSettingsScreen({ playerId, onBack }: ParentSettingsScreenProps) {
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const parentLink = useQuery(
    api.parents.getParentLink,
    playerId ? { playerId } : "skip"
  );

  const saveTelegramId = useMutation(api.parents.saveTelegramChatId);
  const unlinkParent = useMutation(api.parents.unlinkParent);

  useEffect(() => {
    if (parentLink?.telegramChatId) {
      setTelegramChatId(parentLink.telegramChatId);
    }
  }, [parentLink]);

  const handleSave = async () => {
    if (!playerId || !telegramChatId.trim()) return;
    setIsSaving(true);
    setTestResult(null);

    try {
      await saveTelegramId({
        playerId,
        telegramChatId: telegramChatId.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestMessage = async () => {
    if (!telegramChatId.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: telegramChatId.trim(),
          message: "WordQuest - Test Message\n\nBot connected successfully!\n\nYou will receive:\n- Daily progress reports\n- Achievement notifications\n- Weak topic alerts\n- Streak reminders",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({ success: true, message: "Message sent! Check Telegram." });
      } else {
        setTestResult({ success: false, message: `Error: ${data.error || "Failed to send"}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: "Network error" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleUnlink = async () => {
    if (!playerId) return;
    if (confirm("Disconnect parent notifications?")) {
      await unlinkParent({ playerId });
      setTelegramChatId("");
    }
  };

  return (
    <div className="screen active" style={{ padding: "20px", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px" }}>
        <button
          className="btn"
          onClick={onBack}
          style={{ padding: "10px 15px", background: "rgba(0,0,0,0.3)" }}
        >
          Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.4em" }}>PARENT NOTIFICATIONS</h1>
          <p style={{ margin: 0, color: "#AAA", fontSize: "0.9em" }}>
            Telegram notification settings
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)",
        borderRadius: "15px",
        padding: "20px",
        border: "1px solid #3b82f640",
        marginBottom: "20px",
      }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#60a5fa" }}>
          How to connect:
        </h3>
        <ol style={{ margin: 0, paddingLeft: "20px", color: "#CCC", lineHeight: "2" }}>
          <li>
            Parent opens Telegram and finds{" "}
            <code style={{ background: "#333", padding: "3px 8px", borderRadius: "4px", color: "#60a5fa" }}>
              @wordquest_notify_bot
            </code>
          </li>
          <li>Press <b>START</b> or type <code style={{ background: "#333", padding: "2px 6px", borderRadius: "4px" }}>/start</code></li>
          <li>Bot will send your <b>Chat ID</b> - a number like <code style={{ background: "#333", padding: "2px 6px", borderRadius: "4px" }}>123456789</code></li>
          <li>Enter that Chat ID below</li>
        </ol>
      </div>

      {/* Chat ID Input */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", color: "#AAA", marginBottom: "8px" }}>
          Parent Telegram Chat ID:
        </label>
        <input
          type="text"
          value={telegramChatId}
          onChange={(e) => setTelegramChatId(e.target.value.replace(/\D/g, ""))}
          placeholder="Example: 123456789"
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "1.2em",
            background: "rgba(0,0,0,0.4)",
            border: "2px solid #555",
            borderRadius: "10px",
            color: "#fff",
            fontFamily: "monospace",
            letterSpacing: "2px",
          }}
        />
      </div>

      {/* Test Result */}
      {testResult && (
        <div style={{
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "15px",
          background: testResult.success ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
          border: `2px solid ${testResult.success ? "#22c55e" : "#ef4444"}`,
          color: testResult.success ? "#86efac" : "#fca5a5",
        }}>
          {testResult.message}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          className="btn btn-secondary"
          onClick={handleTestMessage}
          disabled={!telegramChatId.trim() || isTesting}
          style={{ flex: 1, justifyContent: "center", padding: "12px" }}
        >
          {isTesting ? "Sending..." : "Test"}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!telegramChatId.trim() || isSaving}
          style={{ flex: 2, justifyContent: "center", padding: "12px" }}
        >
          {isSaving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>

      {/* Current Status */}
      {parentLink && (
        <div style={{
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)",
          borderRadius: "15px",
          padding: "20px",
          border: "2px solid #22c55e",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <span style={{ fontSize: "2em" }}>OK</span>
            <div>
              <div style={{ fontWeight: "bold", color: "#22c55e" }}>Connected!</div>
              <div style={{ color: "#AAA", fontSize: "0.9em" }}>
                Chat ID: {parentLink.telegramChatId}
              </div>
            </div>
          </div>
          <button
            className="btn"
            onClick={handleUnlink}
            style={{
              width: "100%",
              justifyContent: "center",
              background: "rgba(239, 68, 68, 0.2)",
              border: "2px solid #ef4444",
              color: "#fca5a5",
            }}
          >
            Disconnect
          </button>
        </div>
      )}

      {/* What parent receives */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        borderRadius: "15px",
        padding: "20px",
      }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#AAA" }}>
          Parent will receive:
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { icon: "[=]", text: "Daily progress reports" },
            { icon: "[*]", text: "Achievement notifications" },
            { icon: "[!]", text: "Weak topic alerts" },
            { icon: "[~]", text: "Streak reminders" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
              }}
            >
              <span style={{ fontSize: "1.3em", fontFamily: "monospace" }}>{item.icon}</span>
              <span style={{ color: "#CCC" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
