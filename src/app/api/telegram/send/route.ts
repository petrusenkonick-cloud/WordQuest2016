import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json();

    if (!chatId || !message) {
      return NextResponse.json(
        { success: false, error: "chatId and message required" },
        { status: 400 }
      );
    }

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Telegram bot not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json();

    if (data.ok) {
      return NextResponse.json({ success: true });
    } else {
      console.error("Telegram API error:", data);
      return NextResponse.json({
        success: false,
        error: data.description || "Failed to send message",
      });
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return NextResponse.json(
      { success: false, error: "Network error" },
      { status: 500 }
    );
  }
}
