"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// Time options for daily reports (UTC hours displayed as local approximation)
const DAILY_REPORT_TIMES = [
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
];

// Days of week for weekly reports
const WEEKLY_REPORT_DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

interface ParentSettingsScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
}

export function ParentSettingsScreen({ playerId, onBack }: ParentSettingsScreenProps) {
  const [telegramChatId, setTelegramChatId] = useState("");
  const [dailyReportTime, setDailyReportTime] = useState("18:00");
  const [weeklyReportDay, setWeeklyReportDay] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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
  const updateSettings = useMutation(api.parents.updateNotificationSettings);

  useEffect(() => {
    if (parentLink) {
      if (parentLink.telegramChatId) {
        setTelegramChatId(parentLink.telegramChatId);
      }
      if (parentLink.dailyReportTime) {
        setDailyReportTime(parentLink.dailyReportTime);
      }
      if (parentLink.weeklyReportDay !== undefined) {
        setWeeklyReportDay(parentLink.weeklyReportDay);
      }
      setNotificationsEnabled(parentLink.notificationsEnabled ?? true);
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

  const handleUpdateSettings = async (
    newTime?: string,
    newDay?: number,
    newEnabled?: boolean
  ) => {
    if (!parentLink?.telegramChatId) return;

    try {
      await updateSettings({
        telegramChatId: parentLink.telegramChatId,
        ...(newTime !== undefined && { dailyReportTime: newTime }),
        ...(newDay !== undefined && { weeklyReportDay: newDay }),
        ...(newEnabled !== undefined && { notificationsEnabled: newEnabled }),
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
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

      {/* Notification Settings - Only show when connected */}
      {parentLink && (
        <div style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(30, 27, 75, 0.4) 100%)",
          borderRadius: "15px",
          padding: "20px",
          border: "1px solid #8b5cf640",
          marginBottom: "20px",
        }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#c4b5fd" }}>
            Automatic Reports
          </h3>

          {/* Notifications Toggle */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "15px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "10px",
            marginBottom: "15px",
          }}>
            <div>
              <div style={{ fontWeight: "bold" }}>Enable Notifications</div>
              <div style={{ color: "#888", fontSize: "0.85em" }}>Receive automatic reports</div>
            </div>
            <button
              onClick={() => {
                const newValue = !notificationsEnabled;
                setNotificationsEnabled(newValue);
                handleUpdateSettings(undefined, undefined, newValue);
              }}
              style={{
                width: "60px",
                height: "32px",
                borderRadius: "16px",
                border: "none",
                cursor: "pointer",
                background: notificationsEnabled
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "#444",
                position: "relative",
                transition: "background 0.3s ease",
              }}
            >
              <div style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "#fff",
                position: "absolute",
                top: "3px",
                left: notificationsEnabled ? "31px" : "3px",
                transition: "left 0.3s ease",
              }} />
            </button>
          </div>

          {/* Daily Report Time */}
          <div style={{
            padding: "15px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "10px",
            marginBottom: "15px",
            opacity: notificationsEnabled ? 1 : 0.5,
          }}>
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontWeight: "bold" }}>Daily Report Time</div>
              <div style={{ color: "#888", fontSize: "0.85em" }}>When to send daily progress</div>
            </div>
            <select
              value={dailyReportTime}
              onChange={(e) => {
                setDailyReportTime(e.target.value);
                handleUpdateSettings(e.target.value, undefined, undefined);
              }}
              disabled={!notificationsEnabled}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "1em",
                background: "rgba(0,0,0,0.4)",
                border: "2px solid #555",
                borderRadius: "8px",
                color: "#fff",
                cursor: notificationsEnabled ? "pointer" : "not-allowed",
              }}
            >
              {DAILY_REPORT_TIMES.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>

          {/* Weekly Report Day */}
          <div style={{
            padding: "15px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "10px",
            opacity: notificationsEnabled ? 1 : 0.5,
          }}>
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontWeight: "bold" }}>Weekly Summary Day</div>
              <div style={{ color: "#888", fontSize: "0.85em" }}>When to send weekly report</div>
            </div>
            <select
              value={weeklyReportDay}
              onChange={(e) => {
                const newDay = parseInt(e.target.value);
                setWeeklyReportDay(newDay);
                handleUpdateSettings(undefined, newDay, undefined);
              }}
              disabled={!notificationsEnabled}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "1em",
                background: "rgba(0,0,0,0.4)",
                border: "2px solid #555",
                borderRadius: "8px",
                color: "#fff",
                cursor: notificationsEnabled ? "pointer" : "not-allowed",
              }}
            >
              {WEEKLY_REPORT_DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          {/* Info note */}
          <div style={{
            marginTop: "15px",
            padding: "12px",
            background: "rgba(59, 130, 246, 0.1)",
            borderRadius: "8px",
            border: "1px solid #3b82f640",
            fontSize: "0.85em",
            color: "#93c5fd",
          }}>
            Reports are sent automatically at the selected times. Times shown are approximate (UTC-based).
          </div>
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
