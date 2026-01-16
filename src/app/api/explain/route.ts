import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Different explanation styles
const EXPLANATION_STYLES = {
  short: "Give a very brief, 1-sentence explanation that's easy for a child to understand.",
  example: "Explain using a real-world example or analogy that a child can relate to. Use everyday objects or situations.",
  step_by_step: "Break down the explanation into numbered steps. Explain each step simply, like teaching a friend.",
  visual: "Describe a visual way to remember this. Use imagery, colors, or a simple diagram description that a child can picture in their mind.",
  story: "Explain using a short, fun mini-story or scenario that makes the concept memorable.",
  compare: "Explain by comparing to something the child already knows. Use 'It's like...' comparisons.",
};

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswer, userAnswer, topic, previousStyle, errorType } = await request.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Determine which style to use next
    const styleOrder = ["short", "example", "step_by_step", "visual", "story", "compare"];
    let nextStyle = "short";

    if (previousStyle) {
      const currentIndex = styleOrder.indexOf(previousStyle);
      if (currentIndex >= 0 && currentIndex < styleOrder.length - 1) {
        nextStyle = styleOrder[currentIndex + 1];
      } else {
        // Cycle back with a different approach
        nextStyle = styleOrder[0];
      }
    }

    // Build error-type specific guidance
    let errorGuidance = "";
    if (errorType === "conceptual") {
      errorGuidance = "The student doesn't understand the core concept. Focus on explaining the fundamental idea.";
    } else if (errorType === "procedural") {
      errorGuidance = "The student understands the concept but made a process error. Focus on the correct steps/procedure.";
    } else if (errorType === "careless") {
      errorGuidance = "This might be a careless mistake. Gently point out what to watch for next time.";
    }

    const styleInstruction = EXPLANATION_STYLES[nextStyle as keyof typeof EXPLANATION_STYLES];

    const prompt = `You are a friendly, encouraging teacher helping a child understand why they got a question wrong.

Question: ${question}
Child's answer: ${userAnswer}
Correct answer: ${correctAnswer}
Topic: ${topic || "general"}
${errorGuidance}

${styleInstruction}

Rules:
1. Be warm and encouraging - never make the child feel bad
2. Use simple words (grade 2-5 level)
3. Keep it under 100 words
4. End with an encouraging phrase
5. If relevant, mention a memory trick

Return ONLY a JSON object:
{
  "explanation": "your explanation here",
  "memoryTrick": "optional short tip to remember (or null)",
  "encouragement": "short encouraging phrase",
  "style": "${nextStyle}"
}`;

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      console.error("Gemini API error:", await response.text());
      return NextResponse.json(
        { error: "Failed to generate explanation" },
        { status: 500 }
      );
    }

    const data = await response.json();
    let textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse JSON
    let jsonStr = textContent.trim();
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const result = JSON.parse(jsonStr);
    result.style = nextStyle;
    result.nextStyle = styleOrder[(styleOrder.indexOf(nextStyle) + 1) % styleOrder.length];

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating explanation:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
