import { NextRequest, NextResponse } from "next/server";

// Use Gemini 3 Flash Preview - latest multimodal model (2026)
const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Maximum photos allowed (must match frontend)
const MAX_PHOTOS = 10;
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

## MANDATORY: ALWAYS PROVIDE 4 OPTIONS FOR EVERY QUESTION!

CRITICAL: Every question MUST have exactly 4 "options" - realistic answers that could confuse a student:

- "opposite of X" → [correct opposite, word with different prefix, similar word, related word]
  Example: "opposite of unload" → ["load", "reload", "upload", "download"]

- "fill in blank" → [correct word, similar grammar form, common mistake, related word]
  Example: "She ___ to school" → ["walks", "walk", "walking", "walked"]

- "math problem" → [correct answer, common calculation error, off-by-one, reversed digits]
  Example: "7 × 8 = ?" → ["56", "54", "48", "65"]

NEVER use generic options like "None of the above", "All of the above", "Cannot be determined"!
Options must be REALISTIC wrong answers that test the child's knowledge.

## DIFFICULTY ANALYSIS (REQUIRED):

You MUST include a "difficulty" object in your response:
{
  "difficulty": {
    "gradeLevel": 5,           // Estimated grade level 1-11 based on content complexity
    "multiplier": 1.3,         // Score multiplier: Grade 1-2 = 1.0, Grade 3-4 = 1.2, Grade 5-6 = 1.4, Grade 7-8 = 1.6, Grade 9-11 = 1.8-2.0
    "topics": ["fractions", "word problems"],  // Main topics detected
    "complexity": "medium"     // "easy", "medium", "hard" based on cognitive demands
  }
}

Difficulty multiplier rules:
- Grade 1-2: multiplier = 1.0
- Grade 3-4: multiplier = 1.2
- Grade 5-6: multiplier = 1.4
- Grade 7-8: multiplier = 1.6
- Grade 9-11: multiplier = 1.8-2.0

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
            temperature: 0.3, // Lower temperature for more consistent JSON
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            // Note: responseMimeType requires responseSchema for Gemini 3
            // Relying on prompt for JSON output
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

      // Parse error for more details
      let errorDetails = "";
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error?.message || errorJson.message || "";
      } catch {
        errorDetails = errorText.substring(0, 200);
      }

      // User-friendly error messages based on status
      let userError = "Error analyzing homework";
      if (response.status === 429) {
        userError = "Too many requests! Wait a minute and try again.";
      } else if (response.status === 400) {
        // Show more details for 400 errors
        userError = `API Error: ${errorDetails || "Cannot read the photo. Try taking a clearer picture."}`;
      } else if (response.status === 404) {
        userError = `Model not found: ${GEMINI_MODEL}. API says: ${errorDetails}`;
      } else if (response.status >= 500) {
        userError = "Server is busy. Try again in a minute!";
      } else {
        userError = `API Error (${response.status}): ${errorDetails || "Unknown error"}`;
      }

      return NextResponse.json(
        { error: userError, debug: { status: response.status, model: GEMINI_MODEL } },
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

    // Clean up common JSON issues
    // Remove control characters (except newlines and tabs)
    jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Try to fix incomplete JSON (common when response is truncated)
    const openBraces = (jsonStr.match(/\{/g) || []).length;
    const closeBraces = (jsonStr.match(/\}/g) || []).length;
    const openBrackets = (jsonStr.match(/\[/g) || []).length;
    const closeBrackets = (jsonStr.match(/\]/g) || []).length;

    // If JSON is incomplete, try to close it
    if (openBraces > closeBraces || openBrackets > closeBrackets) {
      console.log("Attempting to repair incomplete JSON...");
      // Remove trailing incomplete content after last complete value
      jsonStr = jsonStr.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/, '');
      // Close remaining brackets and braces
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        jsonStr += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        jsonStr += '}';
      }
    }

    // Safe JSON parsing with detailed error
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw response (first 500 chars):", textContent.substring(0, 500));
      console.error("Processed jsonStr (first 500 chars):", jsonStr.substring(0, 500));

      // Try one more time with aggressive cleaning
      try {
        // Remove any trailing commas before closing brackets/braces
        const cleanedJson = jsonStr
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/([{,]\s*)"([^"]+)":\s*,/g, '$1"$2": null,');
        result = JSON.parse(cleanedJson);
        console.log("JSON parsed after aggressive cleaning");
      } catch {
        // Show partial response for debugging
        const preview = textContent.substring(0, 150).replace(/\n/g, " ");
        return NextResponse.json(
          {
            error: `AI returned invalid format. Preview: "${preview}..."`,
            debug: { rawLength: textContent.length, jsonStrLength: jsonStr.length }
          },
          { status: 500 }
        );
      }
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
