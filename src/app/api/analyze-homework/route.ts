import { NextRequest, NextResponse } from "next/server";

// Use Gemini 3 Flash - newest model (Nov 2025), 3x faster than 2.5 Pro
const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Maximum photos allowed (must match frontend)
const MAX_PHOTOS = 50;
// Timeout for API call (2 minutes for large uploads)
const API_TIMEOUT_MS = 120000;

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Нет фотографий. Сделай хотя бы одно фото домашки!" },
        { status: 400 }
      );
    }

    // Validate photo limit
    if (images.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Слишком много фото! Максимум ${MAX_PHOTOS}, а у тебя ${images.length}.` },
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

    // Calculate how many questions to generate based on number of pages
    const questionsPerPage = 3; // Generate ~3 questions per page
    const minQuestions = 5;
    const maxQuestions = 30; // Cap at 30 for performance
    const targetQuestions = Math.min(maxQuestions, Math.max(minQuestions, images.length * questionsPerPage));

    const prompt = `You are analyzing homework pages for a children's educational game. Analyze these ${images.length} homework images and create an educational quiz game.

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
      "correct": "THE COMPLETE CORRECT ANSWER - must be full and complete so child can write it on paper",
      "explanation": "brief kid-friendly explanation why this is correct",
      "hint": "helpful hint for the student",
      "pageRef": 1
    }
  ]
}

CRITICAL RULES:
1. Create ${targetQuestions} questions covering ALL content from ALL ${images.length} pages
2. The "correct" field MUST contain the FULL, COMPLETE answer - not abbreviated!
   - For math: show full solution (e.g., "24" not just the operation)
   - For fill-blank: complete word/phrase
   - For essay questions: full sentence answer
3. "pageRef" MUST indicate which page (1-${images.length}) the question is from - this is used to order answers for paper
4. Mix question types (multiple_choice, fill_blank, true_false)
5. Make questions appropriate for the grade level
6. Questions should be fun and engaging for children
7. For fill_blank, the answer should be a single word or short phrase
8. For true_false, options must be ["True", "False"]
9. Include helpful hints that guide without giving away the answer
10. Explanations should be encouraging and educational
11. Questions should be in the same ORDER as they appear in the homework pages

The child will use the answers to write on paper in order, so pageRef and complete answers are ESSENTIAL!

Return ONLY the JSON, nothing else.`;

    console.log("Calling Gemini API with model:", GEMINI_MODEL);
    console.log("Number of images:", images.length);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(GEMINI_API_URL, {
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
            maxOutputTokens: 8192, // Increased for more questions
          },
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("Gemini API timeout after", API_TIMEOUT_MS, "ms");
        return NextResponse.json(
          { error: "Слишком долго! Попробуй загрузить меньше фото или проверь интернет." },
          { status: 504 }
        );
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error status:", response.status);
      console.error("Gemini API error response:", errorText);

      // User-friendly error messages based on status
      let userError = "Ошибка при анализе домашки";
      if (response.status === 429) {
        userError = "Слишком много запросов! Подожди минутку и попробуй снова.";
      } else if (response.status === 400) {
        userError = "Не могу прочитать фото. Попробуй сделать более чёткое фото.";
      } else if (response.status >= 500) {
        userError = "Сервер занят. Попробуй через минуту!";
      }

      return NextResponse.json(
        { error: userError },
        { status: 500 }
      );
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error("No text content in Gemini response:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: "AI не смогла прочитать домашку. Попробуй сделать более чёткое фото!" },
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

    // Safe JSON parsing with detailed error
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw response:", jsonStr.substring(0, 500));
      return NextResponse.json(
        { error: "AI выдала неправильный формат. Попробуй снова!" },
        { status: 500 }
      );
    }

    // Validate result has required fields
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      console.error("AI response missing questions:", result);
      return NextResponse.json(
        { error: "AI не нашла вопросов в домашке. Убедись, что на фото есть задания!" },
        { status: 500 }
      );
    }

    // Add totalPages and ensure pageRef exists for ordering
    result.totalPages = images.length;
    result.questions = result.questions.map((q: { pageRef?: number; text?: string; correct?: string; explanation?: string }, index: number) => ({
      ...q,
      pageRef: q.pageRef || Math.floor(index / Math.ceil(result.questions.length / images.length)) + 1,
      // Ensure full answer is preserved
      fullAnswer: q.correct,
      answerExplanation: q.explanation,
    }));

    console.log(`Successfully generated ${result.questions.length} questions from ${images.length} pages`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing homework:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Что-то пошло не так: ${errorMessage}. Попробуй ещё раз!` },
      { status: 500 }
    );
  }
}
