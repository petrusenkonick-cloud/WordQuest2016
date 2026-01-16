import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(request: NextRequest) {
  try {
    const { topic, subject, difficulty = "medium" } = await request.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const difficultyGuide = {
      easy: "Use simple vocabulary and straightforward questions. Focus on basic recognition and recall.",
      medium: "Mix simple and moderate complexity. Include some application questions.",
      hard: "Include challenging questions that require deeper understanding and application.",
    };

    const prompt = `You are creating practice questions for a child learning ${subject}, specifically the topic: "${topic}".

Difficulty: ${difficulty}
${difficultyGuide[difficulty as keyof typeof difficultyGuide]}

Create exactly 5 practice questions. Mix question types for engagement.

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "text": "question text - clear and child-friendly",
      "type": "multiple_choice OR fill_blank OR true_false",
      "options": ["option1", "option2", "option3", "option4"] (only for multiple_choice/true_false),
      "correct": "the correct answer",
      "explanation": "brief, encouraging explanation (2-3 sentences max)",
      "hint": "helpful hint that guides without giving away the answer"
    }
  ],
  "topicSummary": "One sentence summary of what the child should know about this topic"
}

Rules:
1. Questions should directly target the topic "${topic}"
2. Make questions engaging and age-appropriate (grades 2-5)
3. For fill_blank, answer should be a single word or short phrase
4. For true_false, options must be ["True", "False"]
5. Explanations should be encouraging, never discouraging
6. Hints should guide thinking, not give away answers
7. Include variety in question formats

Return ONLY the JSON, no markdown or extra text.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      console.error("Gemini API error:", await response.text());
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
    }

    const data = await response.json();
    let textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Parse JSON
    let jsonStr = textContent.trim();
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating practice questions:", error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
