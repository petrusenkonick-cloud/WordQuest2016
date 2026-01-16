import { NextRequest, NextResponse } from "next/server";

// Use Gemini 3 Flash - latest model with best reasoning
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
        { error: "No photos provided. Take at least one photo of your homework!" },
        { status: 400 }
      );
    }

    // Validate photo limit
    if (images.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Too many photos! Maximum is ${MAX_PHOTOS}, you have ${images.length}.` },
        { status: 400 }
      );
    }

    // Check for both environment variable names (GEMINI_API_KEY or GOOGLE_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "API key not configured. Set GEMINI_API_KEY in environment." },
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

    // This prompt extracts EXACT questions from homework to help children solve and write answers on paper
    const prompt = `You are a homework helper AI. Analyze these ${images.length} images and determine if they contain REAL SCHOOL HOMEWORK.

## STEP 1: VALIDATION - Is this actual homework?

VALID homework includes:
- Worksheets with exercises/problems
- Textbook pages with questions
- Printed or handwritten homework assignments
- Math problems, language exercises, science questions
- Fill-in-the-blank sheets
- Multiple choice tests/quizzes

INVALID (NOT homework):
- Random photos (selfies, pets, landscapes, food)
- Black/blank screens or empty pages
- Screenshots of games, apps, social media
- Photos of objects without educational content
- Blurry images where text cannot be read
- Adult content or inappropriate material

If the images are NOT valid homework, return this JSON:
{
  "isValid": false,
  "error": "REJECTION_REASON"
}

Use these REJECTION_REASON values:
- "NOT_HOMEWORK" - Photos don't contain school homework
- "BLANK_IMAGE" - Images are blank, black, or empty
- "UNREADABLE" - Text is too blurry or unclear to read
- "INAPPROPRIATE" - Content is not appropriate for children

## STEP 2: If valid homework, extract the EXACT questions

IMPORTANT: Extract the REAL questions FROM the homework page - do NOT invent new questions!
The child needs to solve THEIR homework, then write answers on paper.

Return this JSON structure:
{
  "isValid": true,
  "subject": "the subject (Math, English, Science, etc.)",
  "grade": "estimated grade level",
  "topics": ["topics covered"],
  "gameName": "HOMEWORK HELPER: [SUBJECT]",
  "gameIcon": "📚",
  "questions": [
    {
      "text": "EXACT question text from the homework page",
      "originalNumber": "1" or "a)" or whatever numbering is on the page,
      "type": "multiple_choice OR fill_blank OR short_answer",
      "options": ["option1", "option2", "option3", "option4"] (if multiple choice on the page),
      "correct": "THE COMPLETE CORRECT ANSWER - child will write this on paper!",
      "explanation": "Step-by-step explanation how to get this answer",
      "hint": "Helpful hint without giving away the answer",
      "pageRef": 1
    }
  ]
}

## CRITICAL RULES FOR QUESTION EXTRACTION:

1. Extract questions EXACTLY as written on the homework page
2. Keep the SAME order as on the paper
3. Include the original question number (1, 2, a, b, etc.)
4. The "correct" field must have the FULL answer the child will write on paper:
   - Math: "56" (the answer)
   - Fill-blank: "running" (the missing word)
   - Sentence: The complete sentence answer
5. "pageRef" = which photo (1 to ${images.length}) the question is from
6. Extract ALL questions visible on all ${images.length} pages
7. For math problems, show the answer AND brief solution steps in explanation
8. Explanations should help the child UNDERSTAND, not just copy

PURPOSE: Child solves homework here → learns the answers → writes them on paper

Return ONLY the JSON, no markdown, no extra text.`;

    console.log("Calling Gemini API with model:", GEMINI_MODEL);
    console.log("Number of images:", images.length);
    console.log("API key configured:", apiKey ? "Yes (length: " + apiKey.length + ")" : "No");

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
          { error: "Taking too long! Try uploading fewer photos or check your internet." },
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
      let userError = "Error analyzing homework";
      if (response.status === 429) {
        userError = "Too many requests! Wait a minute and try again.";
      } else if (response.status === 400) {
        userError = "Cannot read the photo. Try taking a clearer picture.";
      } else if (response.status >= 500) {
        userError = "Server is busy. Try again in a minute!";
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
        { error: "AI could not read the homework. Try taking a clearer photo!" },
        { status: 500 }
      );
    }

    // Parse the JSON response (remove any markdown code blocks if present)
    let jsonStr = textContent.trim();

    // Remove markdown code blocks
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // Try to extract JSON from response if it contains extra text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    // Safe JSON parsing with detailed error
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw response (first 1000 chars):", textContent.substring(0, 1000));
      return NextResponse.json(
        { error: "AI returned an invalid format. Please try again!" },
        { status: 500 }
      );
    }

    // Check if the images were rejected as not being homework
    if (result.isValid === false) {
      console.log("Images rejected as not homework:", result.error);

      // User-friendly error messages in English
      const errorMessages: Record<string, string> = {
        "NOT_HOMEWORK": "🚫 This doesn't look like homework!\n\nOnly upload:\n• Textbook pages with exercises\n• Workbook pages with problems\n• Printed homework sheets\n\nSelfies, games, and random photos won't work!",
        "BLANK_IMAGE": "📷 The photo is blank or black!\n\nMake sure your camera captured a page with homework, not an empty screen.",
        "UNREADABLE": "🔍 Cannot read the text!\n\nTake a clearer photo:\n• Hold the camera steady\n• Make sure there's good lighting\n• Keep the text in focus",
        "INAPPROPRIATE": "⚠️ This content is not appropriate!\n\nOnly upload school homework assignments.",
      };

      const userError = errorMessages[result.error] || "Cannot recognize this as homework. Try taking a clearer photo of a page with exercises!";

      return NextResponse.json(
        { error: userError, rejectionReason: result.error },
        { status: 400 }
      );
    }

    // Validate result has required fields
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      console.error("AI response missing questions:", result);
      return NextResponse.json(
        { error: "🔍 No exercises found in the photo!\n\nMake sure the page has:\n• Questions or problems\n• Exercises to solve\n• Examples or equations" },
        { status: 400 }
      );
    }

    // Add totalPages and ensure all required fields exist for ordering
    result.totalPages = images.length;
    result.isHomework = true; // Mark as validated homework
    result.questions = result.questions.map((q: {
      pageRef?: number;
      text?: string;
      correct?: string;
      explanation?: string;
      originalNumber?: string;
    }, index: number) => ({
      ...q,
      pageRef: q.pageRef || Math.floor(index / Math.ceil(result.questions.length / images.length)) + 1,
      // Ensure full answer is preserved for paper writing
      fullAnswer: q.correct,
      answerExplanation: q.explanation,
      // Keep original numbering for matching with paper
      questionNumber: q.originalNumber || `${index + 1}`,
    }));

    console.log(`Successfully extracted ${result.questions.length} homework questions from ${images.length} pages`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing homework:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Something went wrong: ${errorMessage}. Please try again!` },
      { status: 500 }
    );
  }
}
