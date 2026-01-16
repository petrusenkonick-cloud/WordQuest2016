import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type ErrorType = "conceptual" | "procedural" | "careless" | "unknown";

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswer, userAnswer, topic, questionType } = await request.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const prompt = `You are an educational error analyst. Analyze why a student got a question wrong and categorize the error type.

Question: ${question}
Question Type: ${questionType}
Topic: ${topic || "general"}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Error Types:
1. CONCEPTUAL - Student doesn't understand the underlying concept. They need the concept re-explained.
   Examples: Wrong vocabulary meaning, misunderstanding grammar rules, not knowing a math formula

2. PROCEDURAL - Student understands the concept but made an error in the process/steps.
   Examples: Correct formula but calculation error, knew the rule but applied it wrong

3. CARELESS - Student knows the material but made a rushed/attention mistake.
   Examples: Typo, clicked wrong option, misread the question, obvious slip

4. UNKNOWN - Cannot determine error type (rare)

Return ONLY a JSON object:
{
  "errorType": "conceptual OR procedural OR careless OR unknown",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this error type (1 sentence)",
  "suggestion": "How to help the student based on error type (1 sentence)"
}

Be accurate - careless errors are common with children (rushing, not reading carefully).
If the answer is completely different from correct, likely conceptual.
If answer shows partial understanding, likely procedural.
If answer is very close (off by one, typo), likely careless.`;

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower temp for more consistent analysis
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      console.error("Gemini API error:", await response.text());
      // Return default on error
      return NextResponse.json({
        errorType: "unknown",
        confidence: 0,
        reasoning: "Could not analyze error",
        suggestion: "Review the material and try again",
      });
    }

    const data = await response.json();
    let textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return NextResponse.json({
        errorType: "unknown",
        confidence: 0,
        reasoning: "No analysis available",
        suggestion: "Review the material and try again",
      });
    }

    // Parse JSON
    let jsonStr = textContent.trim();
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const result = JSON.parse(jsonStr);

    // Validate error type
    const validTypes = ["conceptual", "procedural", "careless", "unknown"];
    if (!validTypes.includes(result.errorType)) {
      result.errorType = "unknown";
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error detecting error type:", error);
    return NextResponse.json({
      errorType: "unknown",
      confidence: 0,
      reasoning: "Analysis failed",
      suggestion: "Review the material and try again",
    });
  }
}
