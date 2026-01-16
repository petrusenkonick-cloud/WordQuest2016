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

  // Load existing chat ID
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
          message: "🎮 Тестовое сообщение от WordQuest!\n\nЕсли вы видите это сообщение, настройка прошла успешно! ✅",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({ success: true, message: "✅ Сообщение отправлено! Проверьте Telegram." });
      } else {
        setTestResult({ success: false, message: `❌ Ошибка: ${data.error || "Не удалось отправить"}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: "❌ Ошибка сети" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleUnlink = async () => {
    if (!playerId) return;
    if (confirm("Отключить уведомления родителям?")) {
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
          ← Назад
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.4em" }}>👨‍👩‍👧 УВЕДОМЛЕНИЯ РОДИТЕЛЯМ</h1>
          <p style={{ margin: 0, color: "#AAA", fontSize: "0.9em" }}>
            Настройка Telegram уведомлений
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
          📱 Как подключить:
        </h3>
        <ol style={{ margin: 0, paddingLeft: "20px", color: "#CCC", lineHeight: "2" }}>
          <li>
            Родитель открывает Telegram и находит бота{" "}
            <code style={{ background: "#333", padding: "3px 8px", borderRadius: "4px", color: "#60a5fa" }}>
              @useaborinfo_bot
            </code>
          </li>
          <li>Нажимает <b>START</b> или пишет <code style={{ background: "#333", padding: "2px 6px", borderRadius: "4px" }}>/start</code></li>
          <li>Бот пришлёт <b>Chat ID</b> - число вида <code style={{ background: "#333", padding: "2px 6px", borderRadius: "4px" }}>123456789</code></li>
          <li>Введите этот Chat ID ниже</li>
        </ol>
      </div>

      {/* Chat ID Input */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", color: "#AAA", marginBottom: "8px" }}>
          Telegram Chat ID родителя:
        </label>
        <input
          type="text"
          value={telegramChatId}
          onChange={(e) => setTelegramChatId(e.target.value.replace(/\D/g, ""))}
          placeholder="Например: 123456789"
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
          {isTesting ? "📤 Отправка..." : "📤 Тест"}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!telegramChatId.trim() || isSaving}
          style={{ flex: 2, justifyContent: "center", padding: "12px" }}
        >
          {isSaving ? "💾 Сохранение..." : saved ? "✅ Сохранено!" : "💾 Сохранить"}
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
            <span style={{ fontSize: "2em" }}>✅</span>
            <div>
              <div style={{ fontWeight: "bold", color: "#22c55e" }}>Подключено!</div>
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
            🔗 Отключить
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
          📬 Родитель будет получать:
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { icon: "📊", text: "Ежедневный отчёт о прогрессе" },
            { icon: "🏆", text: "Уведомления о достижениях" },
            { icon: "⚠️", text: "Предупреждения о слабых темах" },
            { icon: "🔥", text: "Напоминания о серии дней" },
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
              <span style={{ fontSize: "1.3em" }}>{item.icon}</span>
              <span style={{ color: "#CCC" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
