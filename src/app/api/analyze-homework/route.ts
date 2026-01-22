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

    // This prompt extracts EXACT questions from homework with format detection
    const prompt = `You are a homework helper AI. Analyze these ${images.length} images and determine if they contain REAL SCHOOL HOMEWORK.

## STEP 1: VALIDATION - Is this actual homework?

VALID homework includes:
- Worksheets with exercises/problems
- Textbook pages with questions
- Printed or handwritten homework assignments
- Math problems, language exercises, science questions
- Fill-in-the-blank sheets, matching exercises, ordering tasks
- Multiple choice tests/quizzes
- Reading comprehension passages

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

## STEP 2: DETECT QUESTION FORMAT

CRITICAL: Detect the ACTUAL format of each question from the homework image!
DO NOT force all questions into multiple choice format.

Supported question types:

1. **multiple_choice** - ONLY when A, B, C, D options are PRINTED on the homework
   {
     "type": "multiple_choice",
     "text": "Question text",
     "options": ["A option", "B option", "C option", "D option"],
     "correct": "The correct option text"
   }

2. **fill_blank** - Single blank to fill (___), may or may not have word bank
   {
     "type": "fill_blank",
     "text": "Fill in the blank question",
     "sentence": "The cat ___ over the fence.",
     "options": ["jumped", "ran", "flew", "swam"],  // ONLY if word bank shown on page
     "acceptableAnswers": ["jumped", "leaped"],     // Alternative correct spellings
     "correct": "jumped"
   }

3. **writing_short** - Write a word or short phrase answer
   {
     "type": "writing_short",
     "text": "What is the capital of France?",
     "acceptableAnswers": ["Paris", "paris"],
     "correct": "Paris"
   }

4. **true_false** - True/False questions
   {
     "type": "true_false",
     "text": "The Earth is flat.",
     "correctValue": false,
     "correct": "False"
   }

5. **matching** - Connect items from left column to right column
   {
     "type": "matching",
     "text": "Match the word with its definition",
     "leftColumn": [
       { "id": "1", "text": "happy" },
       { "id": "2", "text": "sad" },
       { "id": "3", "text": "angry" }
     ],
     "rightColumn": [
       { "id": "A", "text": "feeling sorrow" },
       { "id": "B", "text": "feeling joy" },
       { "id": "C", "text": "feeling mad" }
     ],
     "correctPairs": [
       { "left": "1", "right": "B" },
       { "left": "2", "right": "A" },
       { "left": "3", "right": "C" }
     ],
     "correct": "1-B, 2-A, 3-C"
   }

6. **ordering** - Put items in correct sequence
   {
     "type": "ordering",
     "text": "Put these events in order",
     "items": ["C. He ate breakfast", "A. He woke up", "D. He went to school", "B. He brushed teeth"],
     "correctOrder": ["A. He woke up", "B. He brushed teeth", "C. He ate breakfast", "D. He went to school"],
     "correct": "A, B, C, D"
   }

7. **reading_comprehension** - Passage with sub-questions
   {
     "type": "reading_comprehension",
     "text": "Read the passage and answer the questions",
     "passage": "Full passage text here...",
     "passageTitle": "The Little Red Hen",
     "subQuestions": [
       { "type": "multiple_choice", "text": "Who helped the hen?", "options": [...], "correct": "..." },
       { "type": "writing_short", "text": "Why didn't the cat help?", "correct": "..." }
     ],
     "correct": "a) No one\\nb) The cat was lazy"
   }

8. **fill_blanks_multi** - Multiple blanks in one sentence/paragraph
   {
     "type": "fill_blanks_multi",
     "text": "Fill in the blanks",
     "sentence": "The ___1___ jumped over the ___2___ moon.",
     "blanks": [
       { "id": "1", "acceptableAnswers": ["cow"] },
       { "id": "2", "acceptableAnswers": ["bright", "full"] }
     ],
     "options": ["cow", "dog", "bright", "full", "moon"],  // ONLY if word bank shown
     "correct": "(1) cow (2) bright"
   }

9. **writing_sentence** - Write complete sentence(s)
   {
     "type": "writing_sentence",
     "text": "Write a sentence using the word 'because'",
     "modelAnswer": "I was late because the bus broke down.",
     "keyElements": ["because"],
     "correct": "I was late because the bus broke down."
   }

10. **correction** - Find and fix errors in text
    {
      "type": "correction",
      "text": "Find and correct the errors",
      "errorText": "She walk to the store yesterday.",
      "correctedText": "She walked to the store yesterday.",
      "errors": [{ "original": "walk", "correction": "walked" }],
      "correct": "walked (not walk)"
    }

11. **categorization** - Sort items into groups
    {
      "type": "categorization",
      "text": "Sort these words into nouns and verbs",
      "items": ["cat", "run", "dog", "jump", "tree", "swim"],
      "categories": [
        { "name": "Nouns", "correctItems": ["cat", "dog", "tree"] },
        { "name": "Verbs", "correctItems": ["run", "jump", "swim"] }
      ],
      "correct": "Nouns: cat, dog, tree | Verbs: run, jump, swim"
    }

## CRITICAL RULES:

1. **DETECT THE REAL FORMAT** - Look at the homework image and identify what type of question it actually is
2. **DO NOT FORCE OPTIONS** - Only include "options" if they are PRINTED on the homework page
3. For fill-in-blank without word bank: use "fill_blank" with NO options field
4. For matching exercises: use "matching" type, NOT multiple choice
5. For ordering/sequencing: use "ordering" type
6. **The "correct" field MUST be paper-ready** - exactly what child writes on paper
7. Extract questions EXACTLY as written on the homework page
8. Keep the SAME order as on the paper
9. Include original question number (1, 2, a, b, etc.)
10. "pageRef" = which photo (1 to ${images.length}) the question is from
11. Extract ALL questions visible on all ${images.length} pages

## RESPONSE FORMAT:

{
  "isValid": true,
  "subject": "English/Math/Science/etc.",
  "grade": "estimated grade level",
  "topics": ["topics covered"],
  "gameName": "HOMEWORK HELPER: [SUBJECT]",
  "gameIcon": "📚",
  "questions": [
    // Array of questions with appropriate type-specific fields
  ],
  "difficulty": {
    "gradeLevel": 5,
    "multiplier": 1.4,
    "topics": ["grammar", "vocabulary"],
    "complexity": "medium"
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

    // Fisher-Yates shuffle function
    function shuffleArray<T>(array: T[]): T[] {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    // Add totalPages and ensure all required fields exist for ordering
    result.totalPages = images.length;
    result.isHomework = true; // Mark as validated homework

    // Process each question based on its type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.questions = result.questions.map((q: any, index: number) => {
      const processedQuestion = {
        ...q,
        pageRef: q.pageRef || Math.floor(index / Math.ceil(result.questions.length / images.length)) + 1,
        // Ensure full answer is preserved for paper writing
        fullAnswer: q.correct,
        answerExplanation: q.explanation,
        // Keep original numbering for matching with paper
        questionNumber: q.originalNumber || `${index + 1}`,
      };

      // Type-specific processing
      switch (q.type) {
        case "multiple_choice":
        case "fill_blank":
        case "fill_blanks_multi":
          // Shuffle options if they exist (for MCQ and word banks)
          if (q.options && Array.isArray(q.options)) {
            processedQuestion.options = shuffleArray(q.options);
          }
          break;

        case "matching":
          // Shuffle right column for matching exercises
          if (q.rightColumn && Array.isArray(q.rightColumn)) {
            processedQuestion.rightColumn = shuffleArray(q.rightColumn);
          }
          break;

        case "ordering":
          // Shuffle items for ordering exercises (they come pre-shuffled from AI but ensure it)
          if (q.items && Array.isArray(q.items)) {
            processedQuestion.items = shuffleArray(q.items);
          }
          break;

        case "categorization":
          // Shuffle items for categorization
          if (q.items && Array.isArray(q.items)) {
            processedQuestion.items = shuffleArray(q.items);
          }
          break;

        case "reading_comprehension":
          // Process sub-questions recursively
          if (q.subQuestions && Array.isArray(q.subQuestions)) {
            processedQuestion.subQuestions = q.subQuestions.map((sq: { type: string; options?: string[] }, sqIndex: number) => {
              const processedSub = { ...sq };
              if (sq.type === "multiple_choice" && sq.options && Array.isArray(sq.options)) {
                processedSub.options = shuffleArray(sq.options);
              }
              return {
                ...processedSub,
                subIndex: sqIndex,
              };
            });
          }
          break;

        default:
          // For text input types (writing_short, writing_sentence, correction, true_false)
          // No shuffling needed
          break;
      }

      return processedQuestion;
    });

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
