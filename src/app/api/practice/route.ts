import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Player context type for personalization
interface PlayerContext {
  playerAge?: number;
  gradeLevel?: number;
  ageGroup?: string;
  nativeLanguage?: string;
  adaptiveDifficulty?: "very_easy" | "easy" | "medium" | "hard" | "very_hard";
  averageAccuracy?: number;
  weakTopics?: Array<{ topic: string; subject: string; accuracy: number }>;
  recentErrors?: Array<{
    topic: string;
    errorType: string;
    question: string;
    wrongAnswer: string;
    correctAnswer: string;
  }>;
  preferredStyle?: string;
}

// Grade level to age mapping
const gradeToAgeRange: Record<number, { min: number; max: number; description: string }> = {
  1: { min: 6, max: 7, description: "1 класс (6-7 лет)" },
  2: { min: 7, max: 8, description: "2 класс (7-8 лет)" },
  3: { min: 8, max: 9, description: "3 класс (8-9 лет)" },
  4: { min: 9, max: 10, description: "4 класс (9-10 лет)" },
  5: { min: 10, max: 11, description: "5 класс (10-11 лет)" },
  6: { min: 11, max: 12, description: "6 класс (11-12 лет)" },
  7: { min: 12, max: 13, description: "7 класс (12-13 лет)" },
  8: { min: 13, max: 14, description: "8 класс (13-14 лет)" },
  9: { min: 14, max: 15, description: "9 класс (14-15 лет)" },
  10: { min: 15, max: 16, description: "10 класс (15-16 лет)" },
  11: { min: 16, max: 17, description: "11 класс (16-17 лет)" },
};

export async function POST(request: NextRequest) {
  try {
    const {
      topic,
      subject,
      difficulty = "medium",
      playerContext,
    }: {
      topic: string;
      subject: string;
      difficulty?: string;
      playerContext?: PlayerContext;
    } = await request.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Determine effective difficulty based on player context
    const effectiveDifficulty = playerContext?.adaptiveDifficulty || difficulty;

    // Get age-appropriate guidance
    const gradeLevel = playerContext?.gradeLevel || 5;
    const playerAge = playerContext?.playerAge || gradeToAgeRange[gradeLevel]?.min || 10;
    const ageInfo = gradeToAgeRange[gradeLevel] || { min: 10, max: 11, description: "5 класс (10-11 лет)" };

    const difficultyGuide: Record<string, string> = {
      very_easy: `ОЧЕНЬ ПРОСТЫЕ вопросы для начинающих. Используй самые базовые слова (не более 5-6 слов в вопросе).
        Примеры должны быть из повседневной жизни ребёнка ${playerAge} лет. Ответы очевидные.`,
      easy: `ПРОСТЫЕ вопросы. Используй простую лексику и понятные примеры для ребёнка ${playerAge} лет.
        Фокус на базовом распознавании и запоминании. Не более 8-10 слов в вопросе.`,
      medium: `СРЕДНИЕ вопросы. Смешай простые и умеренно сложные. Включи вопросы на применение знаний.
        Подходит для ${ageInfo.description}. Можно использовать более длинные предложения.`,
      hard: `СЛОЖНЫЕ вопросы, требующие глубокого понимания и применения.
        Включи задания на анализ и синтез для продвинутых учеников ${ageInfo.description}.`,
      very_hard: `ОЧЕНЬ СЛОЖНЫЕ вопросы для отличников. Нестандартные задачи, требующие творческого мышления.
        Можно включать олимпиадные задания уровня ${gradeLevel} класса и выше.`,
    };

    // Build personalization context
    let personalizationNote = "";

    if (playerContext) {
      personalizationNote = `
ПЕРСОНАЛИЗАЦИЯ ДЛЯ УЧЕНИКА:
- Возраст: ${playerAge} лет (${ageInfo.description})
- Средняя точность ответов: ${playerContext.averageAccuracy || 50}%
- Предпочитаемый стиль: ${playerContext.preferredStyle === "visual" ? "визуальный (картинки, схемы)" :
    playerContext.preferredStyle === "audio" ? "аудиальный" : "текстовый"}
`;

      // Add weak topics to focus on
      if (playerContext.weakTopics && playerContext.weakTopics.length > 0) {
        const weakTopicsList = playerContext.weakTopics
          .slice(0, 3)
          .map(t => `${t.topic} (${t.accuracy}%)`)
          .join(", ");
        personalizationNote += `- Слабые темы (требуют практики): ${weakTopicsList}\n`;
      }

      // Add recent errors to avoid similar mistakes
      if (playerContext.recentErrors && playerContext.recentErrors.length > 0) {
        const errorPatterns = playerContext.recentErrors
          .slice(0, 3)
          .map(e => `"${e.wrongAnswer}" вместо "${e.correctAnswer}"`)
          .join("; ");
        personalizationNote += `- Типичные ошибки: ${errorPatterns}\n`;
        personalizationNote += `  ВАЖНО: Создай вопросы, которые помогут исправить эти ошибки!\n`;
      }
    }

    // Determine language based on subject and native language
    const isEnglishSubject = subject.toLowerCase().includes("english") ||
                            subject.toLowerCase().includes("английск");
    const questionLanguage = isEnglishSubject ? "английском" : "русском";

    const prompt = `Ты создаёшь практические вопросы для ребёнка, изучающего ${subject}, тема: "${topic}".

${personalizationNote}

УРОВЕНЬ СЛОЖНОСТИ: ${effectiveDifficulty.toUpperCase()}
${difficultyGuide[effectiveDifficulty] || difficultyGuide.medium}

Создай РОВНО 5 практических вопросов. Чередуй типы вопросов для вовлечённости.
${isEnglishSubject ? "Вопросы должны быть НА АНГЛИЙСКОМ ЯЗЫКЕ (это урок английского!)." : ""}

Верни ТОЛЬКО валидный JSON в таком формате:
{
  "questions": [
    {
      "text": "текст вопроса - понятный для ребёнка ${playerAge} лет",
      "type": "multiple_choice ИЛИ fill_blank ИЛИ true_false",
      "options": ["вариант1", "вариант2", "вариант3", "вариант4"] (только для multiple_choice/true_false),
      "correct": "правильный ответ",
      "explanation": "краткое, ободряющее объяснение (2-3 предложения максимум)",
      "hint": "подсказка, которая направляет мышление, но не выдаёт ответ"
    }
  ],
  "topicSummary": "Одно предложение о том, что ребёнок должен знать по этой теме",
  "difficultyUsed": "${effectiveDifficulty}"
}

ПРАВИЛА:
1. Вопросы должны быть СТРОГО по теме "${topic}"
2. Язык вопросов: ${questionLanguage} ${isEnglishSubject ? "(английский для изучения английского)" : ""}
3. Вопросы должны быть подходящими для ${ageInfo.description}
4. Для fill_blank ответ должен быть одним словом или короткой фразой
5. Для true_false варианты ДОЛЖНЫ быть ["True", "False"] или ["Правда", "Ложь"]
6. Объяснения должны быть ОБОДРЯЮЩИМИ, никогда не обескураживающими
7. Подсказки направляют мышление, НЕ выдают ответ
8. Разнообразь форматы вопросов

Верни ТОЛЬКО JSON, без markdown или лишнего текста.`;

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

    // Add metadata about personalization
    result.personalized = !!playerContext;
    result.playerAge = playerAge;
    result.gradeLevel = gradeLevel;
    result.effectiveDifficulty = effectiveDifficulty;

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating practice questions:", error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
