import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface SimilarQuestionRequest {
  originalQuestion: string;
  originalCorrect: string;
  topic: string;
  subject: string;
  wrongAnswer: string;
  difficulty: "easier" | "same" | "harder";
}

interface SimilarQuestion {
  text: string;
  type: "multiple_choice";
  options: string[];
  correct: string;
  explanation: string;
  hint: string;
  isEasier: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SimilarQuestionRequest = await request.json();
    const { originalQuestion, originalCorrect, topic, subject, wrongAnswer, difficulty = "easier" } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const prompt = `You are an educational AI that generates practice questions for children.
Your task is to create a SIMILAR but EASIER question about the same concept.

The goal is to help the child understand the concept through a simpler example before returning to the harder question.

IMPORTANT RULES:
1. The new question MUST test the SAME concept/topic
2. Make it noticeably EASIER - use simpler words, clearer examples
3. For math: use smaller numbers
4. For English: use more common words
5. Always generate exactly 4 multiple choice options
6. The correct answer should be obviously correct to someone who understands the concept
7. Make distractors reasonable but clearly wrong
8. Keep language age-appropriate for children (ages 6-12)

The child got this question WRONG:
Question: ${originalQuestion}
Correct answer: ${originalCorrect}
Child's wrong answer: ${wrongAnswer}
Topic: ${topic}
Subject: ${subject}

Generate a SIMILAR but ${difficulty.toUpperCase()} question about the same concept.
This should help the child understand the concept through a simpler example.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "text": "The easier question text",
  "type": "multiple_choice",
  "options": ["option1", "option2", "option3", "option4"],
  "correct": "the correct answer (must match one of the options exactly)",
  "explanation": "Brief explanation of why this is correct",
  "hint": "A helpful hint that guides without giving away the answer",
  "isEasier": true
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("No text response from AI");
    }

    // Parse the JSON response - clean up markdown if present
    let text = textContent.trim();
    // Remove markdown code blocks if present
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const similarQuestion: SimilarQuestion = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (!similarQuestion.text || !similarQuestion.correct || !similarQuestion.options?.length) {
      throw new Error("Invalid question format");
    }

    // Ensure correct answer is in options
    if (!similarQuestion.options.includes(similarQuestion.correct)) {
      similarQuestion.options[0] = similarQuestion.correct;
    }

    // Shuffle options
    similarQuestion.options = shuffleArray(similarQuestion.options);

    return NextResponse.json({
      success: true,
      question: similarQuestion,
    });
  } catch (error) {
    console.error("Error generating similar question:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate similar question",
        fallback: true,
      },
      { status: 500 }
    );
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
