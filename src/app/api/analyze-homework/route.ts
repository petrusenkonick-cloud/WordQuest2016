import { NextRequest, NextResponse } from "next/server";

// Use Gemini 3 Flash - newest model (Nov 2025), 3x faster than 2.5 Pro
const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY is not set");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Prepare image parts for Gemini
    const imageParts = images.map((imageBase64: string) => {
      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      return {
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Data,
        },
      };
    });

    const prompt = `You are analyzing homework pages for a children's educational game. Analyze these homework images and create an educational quiz game.

IMPORTANT: Return ONLY valid JSON, no markdown, no extra text.

Analyze the homework and return this exact JSON structure:
{
  "subject": "the subject (Math, English, Science, Geography, History, etc.)",
  "grade": "estimated grade level (e.g., Grade 2-3)",
  "topics": ["list", "of", "topics", "covered"],
  "gameName": "creative game name in UPPERCASE (like WORD FOREST, MATH MOUNTAIN, SCIENCE LAB)",
  "gameIcon": "single emoji for the game",
  "questions": [
    {
      "text": "question text - make it child-friendly",
      "type": "multiple_choice OR fill_blank OR true_false",
      "options": ["option1", "option2", "option3", "option4"] (only for multiple_choice and true_false),
      "correct": "the correct answer",
      "explanation": "brief kid-friendly explanation why this is correct",
      "hint": "helpful hint for the student",
      "pageRef": 1
    }
  ]
}

Rules:
1. Create exactly 5-7 questions based on the homework content
2. Mix question types (multiple_choice, fill_blank, true_false)
3. Make questions appropriate for the grade level
4. Questions should be fun and engaging for children
5. For fill_blank, the answer should be a single word or short phrase
6. For true_false, options must be ["True", "False"]
7. Include helpful hints that guide without giving away the answer
8. Explanations should be encouraging and educational

Return ONLY the JSON, nothing else.`;

    console.log("Calling Gemini API with model:", GEMINI_MODEL);
    console.log("Number of images:", images.length);

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }, ...imageParts],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error status:", response.status);
      console.error("Gemini API error response:", errorText);
      return NextResponse.json(
        { error: `Failed to analyze homework: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response (remove any markdown code blocks if present)
    let jsonStr = textContent.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const result = JSON.parse(jsonStr);

    // Add totalPages
    result.totalPages = images.length;

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing homework:", error);
    return NextResponse.json(
      { error: "Failed to process homework" },
      { status: 500 }
    );
  }
}
