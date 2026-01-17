"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameContainer,
  QuestionCard,
  HintBox,
  Feedback,
  LearningBox,
} from "./GameContainer";

interface PromptCraftGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
}

type Difficulty = "easy" | "medium" | "hard";

interface Question {
  task: string;
  options: {
    text: string;
    quality: "bad" | "okay" | "good" | "best";
    explanation: string;
  }[];
  hint: string;
  principle: string;
}

// EASY questions (ages 6-8) - basic prompt improvements
const EASY_QUESTIONS: Question[] = [
  {
    task: "You want to learn about dinosaurs",
    options: [
      { text: "dinosaurs", quality: "bad", explanation: "Too short! AI doesn't know what you want to learn." },
      { text: "Tell me about dinosaurs", quality: "okay", explanation: "Better, but still very general." },
      { text: "Tell me 3 fun facts about T-Rex for kids", quality: "best", explanation: "Specific, age-appropriate, clear request!" },
      { text: "I like dinosaurs", quality: "bad", explanation: "This just states your feeling, not what you want to know." },
    ],
    hint: "Good prompts tell AI exactly what you want!",
    principle: "Be Specific: Tell AI exactly what you want to know.",
  },
  {
    task: "You need help with a math problem: 15 + 27",
    options: [
      { text: "math", quality: "bad", explanation: "AI doesn't know which math problem!" },
      { text: "What is 15 + 27?", quality: "best", explanation: "Clear and specific question!" },
      { text: "Help me", quality: "bad", explanation: "Help with what? AI can't read your mind." },
      { text: "I have math homework", quality: "okay", explanation: "You told AI you have homework, but not the problem." },
    ],
    hint: "Include the actual problem you need help with!",
    principle: "Include Details: Give AI all the information it needs.",
  },
  {
    task: "You want a story about a brave cat",
    options: [
      { text: "story", quality: "bad", explanation: "What kind of story? About what?" },
      { text: "Write a story", quality: "bad", explanation: "Too vague - AI doesn't know the topic!" },
      { text: "Write a short story about a brave cat who saves a kitten", quality: "best", explanation: "Clear topic, character, and what happens!" },
      { text: "Cat story please", quality: "okay", explanation: "Better, but could say more about what kind of story." },
    ],
    hint: "Tell AI about the character and what should happen!",
    principle: "Give Context: Describe what you want in the story.",
  },
  {
    task: "You want to know what dogs eat",
    options: [
      { text: "dogs", quality: "bad", explanation: "What about dogs? AI needs more info." },
      { text: "What do dogs eat?", quality: "best", explanation: "Simple and clear question!" },
      { text: "food", quality: "bad", explanation: "AI doesn't know you're asking about dog food." },
      { text: "Tell me everything about dogs", quality: "okay", explanation: "Too broad - you just want to know about food." },
    ],
    hint: "Ask a clear question about what you want to know!",
    principle: "Ask Clear Questions: Say exactly what you're curious about.",
  },
  {
    task: "You want to draw a house but need ideas",
    options: [
      { text: "draw", quality: "bad", explanation: "Draw what? AI needs to know the subject." },
      { text: "Give me 5 ideas for drawing a cool house", quality: "best", explanation: "Clear subject, number of ideas, and what kind!" },
      { text: "house", quality: "bad", explanation: "This is just a word, not a request." },
      { text: "Help me draw", quality: "okay", explanation: "Better, but doesn't say what to draw." },
    ],
    hint: "Ask for a specific number of ideas!",
    principle: "Use Numbers: Asking for '3 ideas' or '5 facts' helps AI give the right amount.",
  },
  {
    task: "You want to learn a new word every day",
    options: [
      { text: "words", quality: "bad", explanation: "What about words? Too vague!" },
      { text: "Teach me a new English word with its meaning and an example", quality: "best", explanation: "Says what you want: word, meaning, AND an example!" },
      { text: "Tell me a word", quality: "okay", explanation: "AI will give a word, but you might not understand it." },
      { text: "vocabulary", quality: "bad", explanation: "Not a question or request!" },
    ],
    hint: "Ask for the word AND how to use it!",
    principle: "Ask for Examples: Examples help you understand better.",
  },
  {
    task: "You want a joke to tell your friend",
    options: [
      { text: "joke", quality: "bad", explanation: "Just a word - not a request!" },
      { text: "Tell me a funny joke for kids that's not too long", quality: "best", explanation: "Says who it's for and how long - perfect!" },
      { text: "Say something funny", quality: "okay", explanation: "AI might say something you don't understand." },
      { text: "Make me laugh", quality: "okay", explanation: "AI will try, but a clear request works better." },
    ],
    hint: "Say who the joke is for!",
    principle: "Know Your Audience: Tell AI who will read/hear the answer.",
  },
  {
    task: "You want to learn how birds fly",
    options: [
      { text: "birds", quality: "bad", explanation: "What about birds? Be more specific!" },
      { text: "Explain how birds fly in a simple way for a 7-year-old", quality: "best", explanation: "Topic, how to explain, and who it's for!" },
      { text: "How do birds fly?", quality: "good", explanation: "Good question! Could add 'explain simply'." },
      { text: "flying", quality: "bad", explanation: "Flying what? Planes? Birds? Insects?" },
    ],
    hint: "Ask for a simple explanation!",
    principle: "Request Simple Language: Ask AI to explain things in a way you'll understand.",
  },
  {
    task: "You want help spelling 'beautiful'",
    options: [
      { text: "spell", quality: "bad", explanation: "Spell what? AI needs the word!" },
      { text: "How do you spell 'beautiful'?", quality: "best", explanation: "Clear question with the word you need help with!" },
      { text: "spelling", quality: "bad", explanation: "Not a question!" },
      { text: "Is this right: butiful", quality: "good", explanation: "Good! You showed your attempt." },
    ],
    hint: "Include the word you're trying to spell!",
    principle: "Show Your Work: If you tried something, show AI so it can help fix it.",
  },
  {
    task: "You want a bedtime story",
    options: [
      { text: "bedtime", quality: "bad", explanation: "What about bedtime? Not clear!" },
      { text: "Write a short, calming bedtime story about a sleepy bunny", quality: "best", explanation: "Length, mood, and character - perfect!" },
      { text: "Story time", quality: "bad", explanation: "Not a request, just words." },
      { text: "Tell me a story", quality: "okay", explanation: "AI will tell a story, but it might be too long or exciting for bedtime." },
    ],
    hint: "Say it should be calming and short for bedtime!",
    principle: "Set the Mood: Tell AI what feeling you want (calming, exciting, funny).",
  },
];

// MEDIUM questions (ages 9-11) - more complex prompts
const MEDIUM_QUESTIONS: Question[] = [
  {
    task: "You need help writing a book report about 'Charlotte's Web'",
    options: [
      { text: "book report", quality: "bad", explanation: "Which book? What should be in the report?" },
      { text: "Help me write a 3-paragraph book report about Charlotte's Web. Include the main characters, plot summary, and my opinion.", quality: "best", explanation: "Book name, length, structure - everything AI needs!" },
      { text: "Charlotte's Web report", quality: "okay", explanation: "AI knows the book but not what kind of report." },
      { text: "Write my book report for me", quality: "bad", explanation: "AI can help, but shouldn't write it entirely for you!" },
    ],
    hint: "Tell AI what sections your report needs!",
    principle: "Structure Your Request: Tell AI how to organize the answer.",
  },
  {
    task: "You want to learn about the solar system for a science project",
    options: [
      { text: "solar system", quality: "bad", explanation: "Not a question - just a topic." },
      { text: "List the 8 planets in order from the sun, with one interesting fact about each", quality: "best", explanation: "Specific request with clear format!" },
      { text: "Tell me about space", quality: "okay", explanation: "Too broad - space is huge!" },
      { text: "What is the solar system?", quality: "good", explanation: "Clear question, but could be more specific about what you need for your project." },
    ],
    hint: "Ask for specific information you need for your project!",
    principle: "Format Requests: Ask for lists, tables, or specific formats when helpful.",
  },
  {
    task: "You want to practice Spanish vocabulary",
    options: [
      { text: "Spanish", quality: "bad", explanation: "What about Spanish? Too vague!" },
      { text: "Give me 10 Spanish words about food with English translations and how to pronounce them", quality: "best", explanation: "Number, topic, translations, AND pronunciation!" },
      { text: "Teach me Spanish words", quality: "okay", explanation: "Which words? How many? What topic?" },
      { text: "Hola", quality: "bad", explanation: "Just a Spanish word - not a request!" },
    ],
    hint: "Specify the topic and what information you need!",
    principle: "Be Complete: Include all the parts you need in your answer.",
  },
  {
    task: "You want ideas for a creative writing story",
    options: [
      { text: "story ideas", quality: "bad", explanation: "What genre? How many ideas?" },
      { text: "Give me 3 creative story ideas for a mystery story set in a school, suitable for 10-year-old writers", quality: "best", explanation: "Number, genre, setting, and audience - complete!" },
      { text: "Help me write a story", quality: "okay", explanation: "What kind? AI doesn't know your preferences." },
      { text: "I need to write something", quality: "bad", explanation: "Write what? Story? Essay? Poem?" },
    ],
    hint: "Say the genre and setting you want!",
    principle: "Give Constraints: Limits (genre, setting, length) help AI give better ideas.",
  },
  {
    task: "You want to understand how electricity works",
    options: [
      { text: "electricity", quality: "bad", explanation: "What about electricity? Be more specific!" },
      { text: "Explain how electricity works in simple terms, like I'm 10 years old. Use an example with a light bulb.", quality: "best", explanation: "Topic, language level, and a specific example!" },
      { text: "How does electricity work?", quality: "good", explanation: "Good question! Could add 'explain simply'." },
      { text: "Science stuff", quality: "bad", explanation: "Way too vague!" },
    ],
    hint: "Ask for a specific example to help understand!",
    principle: "Request Analogies: Ask AI to use examples you can relate to.",
  },
  {
    task: "You want to create a quiz about animals for your friends",
    options: [
      { text: "animal quiz", quality: "bad", explanation: "How many questions? What kind?" },
      { text: "Create a 5-question multiple choice quiz about interesting animal facts. Include the answers at the end.", quality: "best", explanation: "Number, format, topic, and where to put answers!" },
      { text: "Quiz me about animals", quality: "okay", explanation: "You want to create a quiz, not take one!" },
      { text: "questions", quality: "bad", explanation: "Questions about what? For what?" },
    ],
    hint: "Specify the format (multiple choice, true/false, etc.)!",
    principle: "Specify Output Format: Tell AI exactly how you want the answer organized.",
  },
  {
    task: "You want to improve your drawing of a dragon",
    options: [
      { text: "dragon", quality: "bad", explanation: "What about a dragon? Not a request!" },
      { text: "Give me 5 tips to make my dragon drawing look more realistic, focusing on scales and wings", quality: "best", explanation: "Number of tips, goal (realistic), and specific areas (scales, wings)!" },
      { text: "How do I draw better?", quality: "okay", explanation: "Draw what better? Be specific!" },
      { text: "Drawing help", quality: "bad", explanation: "Too vague - help with what?" },
    ],
    hint: "Focus on specific parts you want to improve!",
    principle: "Focus on Specifics: Narrow down to exact areas you need help with.",
  },
  {
    task: "You want to learn multiplication tables faster",
    options: [
      { text: "math", quality: "bad", explanation: "Which part of math? Too broad!" },
      { text: "Give me 3 memory tricks to learn the 7 times table, with examples", quality: "best", explanation: "Number of tricks, specific table, and examples!" },
      { text: "Help with multiplication", quality: "okay", explanation: "Which tables? What kind of help?" },
      { text: "7 x 7", quality: "bad", explanation: "This is just a problem, not a request for learning help!" },
    ],
    hint: "Ask for memory tricks or learning strategies!",
    principle: "Ask for Strategies: Request tips, tricks, or methods, not just answers.",
  },
  {
    task: "You want to write a thank-you letter to your teacher",
    options: [
      { text: "letter", quality: "bad", explanation: "What kind? To whom? About what?" },
      { text: "Help me write a short thank-you letter to my teacher, Mrs. Johnson, for helping me with math. Keep it polite and warm.", quality: "best", explanation: "Type, recipient, reason, and tone - complete!" },
      { text: "Thank you letter", quality: "okay", explanation: "AI needs more details to help!" },
      { text: "Write to teacher", quality: "bad", explanation: "Write what? About what?" },
    ],
    hint: "Include who the letter is for and why you're thankful!",
    principle: "Include Context: Give background information for personalized help.",
  },
  {
    task: "You want to make a presentation about recycling",
    options: [
      { text: "recycling", quality: "bad", explanation: "What about recycling? Not a request!" },
      { text: "Give me 4 main points for a 5-minute presentation about why recycling is important, with one fact for each point", quality: "best", explanation: "Number of points, length, topic, and what to include!" },
      { text: "Presentation about recycling", quality: "okay", explanation: "How long? How many slides? What to focus on?" },
      { text: "Help with my project", quality: "bad", explanation: "What project? AI can't guess!" },
    ],
    hint: "Say how long your presentation should be!",
    principle: "Set Time/Length Limits: Tell AI how long or how much you need.",
  },
];

// HARD questions (ages 12+) - advanced prompting
const HARD_QUESTIONS: Question[] = [
  {
    task: "You're researching climate change for a debate and need balanced arguments",
    options: [
      { text: "climate change arguments", quality: "bad", explanation: "For or against? What aspect?" },
      { text: "Give me 3 arguments supporting action on climate change and 2 common counterarguments, with evidence for each. Keep it factual and cite recent data.", quality: "best", explanation: "Balanced, specific number, asks for evidence, requests recent data!" },
      { text: "Tell me about climate change", quality: "okay", explanation: "Too general for debate prep." },
      { text: "Is climate change real?", quality: "okay", explanation: "Yes/no question won't help with debate arguments." },
    ],
    hint: "Ask for both sides of the argument with evidence!",
    principle: "Request Multiple Perspectives: For complex topics, ask for different viewpoints.",
  },
  {
    task: "You want AI to help you debug a coding problem",
    options: [
      { text: "code help", quality: "bad", explanation: "What code? What problem?" },
      { text: "My Python code should print numbers 1-10 but it shows 0-9. Here's my code: 'for i in range(10): print(i)'. What's wrong and how do I fix it?", quality: "best", explanation: "Expected output, actual output, code provided, clear questions!" },
      { text: "Why doesn't my code work?", quality: "bad", explanation: "AI can't see your code or know what 'work' means to you!" },
      { text: "Fix this: for i in range(10): print(i)", quality: "good", explanation: "Code is there, but expected behavior isn't clear." },
    ],
    hint: "Show your code AND explain what should happen!",
    principle: "Show Expected vs Actual: When debugging, explain what should happen and what actually happens.",
  },
  {
    task: "You want to understand a complex historical event for an essay",
    options: [
      { text: "history essay", quality: "bad", explanation: "Which event? What angle?" },
      { text: "Explain the causes and effects of the French Revolution in 4-5 paragraphs. Focus on economic, social, and political factors. Use language suitable for a high school essay.", quality: "best", explanation: "Event, length, structure (cause/effect), categories, and audience level!" },
      { text: "What was the French Revolution?", quality: "okay", explanation: "Basic question won't give essay-ready content." },
      { text: "French Revolution facts", quality: "okay", explanation: "Facts won't explain causes and effects." },
    ],
    hint: "Ask for causes, effects, and organize by categories!",
    principle: "Use Analytical Frameworks: Ask for causes/effects, pros/cons, or other structures.",
  },
  {
    task: "You want feedback on your creative writing piece",
    options: [
      { text: "Is this good?", quality: "bad", explanation: "'Good' is subjective - be specific about what feedback you want!" },
      { text: "Review my short story opening (pasted below). Give me specific feedback on: 1) Is the hook engaging? 2) Is the character introduction clear? 3) Any grammar issues? Be constructive but honest.", quality: "best", explanation: "Specific areas, numbered format, requests constructive feedback!" },
      { text: "Check my story", quality: "okay", explanation: "Check for what? Grammar? Plot? Characters?" },
      { text: "Rate this 1-10", quality: "bad", explanation: "A number won't help you improve!" },
    ],
    hint: "List specific aspects you want feedback on!",
    principle: "Request Structured Feedback: Ask for feedback on specific elements, not just overall opinions.",
  },
  {
    task: "You want to learn a new skill (origami) step by step",
    options: [
      { text: "origami", quality: "bad", explanation: "What about origami? Make what?" },
      { text: "Teach me how to make an origami crane step by step. Number each step, keep instructions simple, and warn me about tricky parts.", quality: "best", explanation: "Specific project, format (numbered), level (simple), and anticipates challenges!" },
      { text: "How do you do origami?", quality: "okay", explanation: "Origami is huge - which project?" },
      { text: "Make me an origami", quality: "bad", explanation: "AI can't physically make origami! Ask for instructions." },
    ],
    hint: "Ask for numbered steps and warnings about hard parts!",
    principle: "Request Step-by-Step: For processes, ask for numbered, sequential instructions.",
  },
  {
    task: "You want AI to help brainstorm a science fair project",
    options: [
      { text: "science fair ideas", quality: "okay", explanation: "What topic areas? What resources do you have?" },
      { text: "Suggest 5 science fair project ideas about plants that I can do at home in 2 weeks with basic supplies. For each, include the question, hypothesis, and materials needed.", quality: "best", explanation: "Topic, constraints (home, 2 weeks, basic supplies), number, and format!" },
      { text: "Science fair", quality: "bad", explanation: "What about it? Not a request!" },
      { text: "What should I do for science fair?", quality: "okay", explanation: "AI doesn't know your interests, time, or resources!" },
    ],
    hint: "Include your time limit and available resources!",
    principle: "State Your Constraints: Tell AI your time, budget, tools, and other limits.",
  },
  {
    task: "You want to compare two career paths",
    options: [
      { text: "careers", quality: "bad", explanation: "Which careers? What to compare?" },
      { text: "Compare being a veterinarian vs marine biologist. Include: education required, average salary, daily work activities, pros and cons of each. Present as a comparison table.", quality: "best", explanation: "Two specific options, comparison criteria, and requested format (table)!" },
      { text: "What job should I have?", quality: "bad", explanation: "AI doesn't know your interests, skills, or goals!" },
      { text: "Tell me about veterinarians", quality: "okay", explanation: "Only covers one option, not a comparison." },
    ],
    hint: "List what aspects you want to compare!",
    principle: "Define Comparison Criteria: When comparing, specify what dimensions matter to you.",
  },
  {
    task: "You want help preparing for a job interview",
    options: [
      { text: "interview help", quality: "bad", explanation: "What kind of job? What help specifically?" },
      { text: "I'm interviewing for a part-time library assistant position. Give me 5 common interview questions for this role with sample answers. Also suggest 2 questions I should ask them.", quality: "best", explanation: "Specific job, number of questions, sample answers, AND reverse questions!" },
      { text: "What questions will they ask?", quality: "okay", explanation: "For what job? At what company type?" },
      { text: "Job interview", quality: "bad", explanation: "Not a request, just words!" },
    ],
    hint: "Mention the specific job you're applying for!",
    principle: "Provide Role/Situation Context: The more AI knows about your situation, the better it can help.",
  },
  {
    task: "You want to fact-check information you read online",
    options: [
      { text: "Is this true?", quality: "bad", explanation: "Is what true? Include the claim!" },
      { text: "I read that 'humans only use 10% of their brain.' Is this scientifically accurate? If not, what's the truth, and why might this myth exist?", quality: "best", explanation: "Includes the claim, asks for accuracy, truth, AND myth origin!" },
      { text: "fact check", quality: "bad", explanation: "Check what fact?" },
      { text: "Brain facts", quality: "okay", explanation: "You want to verify a specific claim, not learn random facts." },
    ],
    hint: "Include the exact claim you want to verify!",
    principle: "Quote Claims Exactly: When fact-checking, include the exact statement to verify.",
  },
  {
    task: "You want AI to act as a practice partner for an oral exam",
    options: [
      { text: "quiz me", quality: "bad", explanation: "On what topic? What style?" },
      { text: "Act as my Spanish teacher testing me for an oral exam. Ask me 5 questions in Spanish about daily routines (present tense). Wait for my answer, then correct any mistakes and explain why.", quality: "best", explanation: "Role, language, topic, grammar focus, number of questions, interaction style!" },
      { text: "Practice Spanish with me", quality: "okay", explanation: "What level? What topic? What kind of practice?" },
      { text: "Spanish exam", quality: "bad", explanation: "What about it? Not a request!" },
    ],
    hint: "Tell AI what role to play and how to interact!",
    principle: "Assign Roles: Tell AI to act as a teacher, interviewer, or practice partner for realistic practice.",
  },
];

const QUESTIONS: Record<Difficulty, Question[]> = {
  easy: EASY_QUESTIONS,
  medium: MEDIUM_QUESTIONS,
  hard: HARD_QUESTIONS,
};

const DIFFICULTY_CONFIG = {
  easy: { label: "BEGINNER", age: "6-8", color: "#4ade80" },
  medium: { label: "APPRENTICE", age: "9-11", color: "#fbbf24" },
  hard: { label: "MASTER", age: "12+", color: "#f87171" },
};

// Magic wand component for prompt crafting theme
function MagicWand({ isAnimating }: { isAnimating: boolean }) {
  return (
    <motion.div
      className="relative"
      animate={isAnimating ? {
        rotate: [0, -15, 15, -10, 0],
        scale: [1, 1.1, 1]
      } : {}}
      transition={{ duration: 0.5 }}
    >
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        {/* Wand body */}
        <rect
          x="8"
          y="32"
          width="32"
          height="6"
          rx="2"
          fill="#8B4513"
          transform="rotate(-45 8 32)"
        />
        {/* Wand tip */}
        <circle cx="38" cy="14" r="6" fill="#fbbf24" />
        {/* Sparkles */}
        <motion.g
          animate={isAnimating ? { opacity: [0, 1, 0] } : { opacity: 0.7 }}
          transition={{ duration: 0.5, repeat: isAnimating ? 2 : 0 }}
        >
          <path d="M42 8 L44 4 L42 6 L40 4 Z" fill="#fef08a" />
          <path d="M48 12 L52 10 L50 12 L52 14 Z" fill="#fef08a" />
          <path d="M44 20 L48 22 L46 20 L48 18 Z" fill="#fef08a" />
          <circle cx="34" cy="8" r="2" fill="#fef08a" />
          <circle cx="46" cy="6" r="1.5" fill="#fef08a" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

// Prompt quality indicator
function PromptQuality({ quality }: { quality: "bad" | "okay" | "good" | "best" }) {
  const config = {
    bad: { label: "Weak", stars: 1, color: "#ef4444" },
    okay: { label: "Basic", stars: 2, color: "#f59e0b" },
    good: { label: "Good", stars: 3, color: "#22c55e" },
    best: { label: "Perfect!", stars: 4, color: "#8b5cf6" },
  };

  const c = config[quality];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-2 px-3 py-1 rounded-full"
      style={{ background: `${c.color}33`, border: `2px solid ${c.color}` }}
    >
      <span style={{ color: c.color }} className="font-bold text-sm">{c.label}</span>
      <span>
        {[...Array(c.stars)].map((_, i) => "⭐")}
        {[...Array(4 - c.stars)].map((_, i) => "☆")}
      </span>
    </motion.div>
  );
}

// Option button for prompt choices
function PromptOption({
  option,
  index,
  isSelected,
  showResult,
  onClick
}: {
  option: { text: string; quality: "bad" | "okay" | "good" | "best"; explanation: string };
  index: number;
  isSelected: boolean;
  showResult: boolean;
  onClick: () => void;
}) {
  const isBest = option.quality === "best";

  const getBorder = () => {
    if (showResult) {
      if (isBest) return "3px solid #8b5cf6";
      if (isSelected) return "3px solid #ef4444";
      return "3px solid #44403c";
    }
    if (isSelected) return "3px solid #fef08a";
    return "3px solid #44403c";
  };

  const getBackground = () => {
    if (showResult) {
      if (isBest) return "linear-gradient(180deg, #8b5cf6, #7c3aed)";
      if (isSelected) return "linear-gradient(180deg, #ef4444, #dc2626)";
      return "linear-gradient(180deg, #78716c, #57534e)";
    }
    if (isSelected) return "linear-gradient(180deg, #fbbf24, #d97706)";
    return "linear-gradient(180deg, #78716c, #57534e)";
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={showResult}
      className="w-full p-4 rounded-lg text-left relative"
      style={{
        background: getBackground(),
        border: getBorder(),
        boxShadow: "2px 2px 0 rgba(0,0,0,0.5)",
      }}
      whileHover={!showResult ? { scale: 1.02 } : {}}
      whileTap={!showResult ? { scale: 0.98 } : {}}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">
          {showResult ? (
            isBest ? "✨" : (isSelected ? "❌" : "💭")
          ) : (
            isSelected ? "✓" : `${index + 1}.`
          )}
        </span>
        <div className="flex-1">
          <p className="text-white text-sm leading-relaxed">"{option.text}"</p>
          {showResult && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-2"
            >
              <PromptQuality quality={option.quality} />
              <p className="text-xs text-amber-200/80 mt-2">{option.explanation}</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// Difficulty selector
function DifficultySelector({ onSelect, onExit }: { onSelect: (d: Difficulty) => void; onExit: () => void }) {
  return (
    <div
      className="bg-gradient-to-b from-[#4A3728] via-[#3A2A1A] to-[#2A1A0A] border-6 border-[#5D4030] p-4 min-h-[400px]"
      style={{
        boxShadow: "inset 4px 4px 0 rgba(255,255,255,0.15), inset -4px -4px 0 rgba(0,0,0,0.4), 8px 8px 0 rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex justify-end mb-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-amber-100"
          style={{
            background: "linear-gradient(180deg, #78716c, #57534e)",
            border: "3px solid #44403c",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← EXIT
        </motion.button>
      </div>
      <motion.div
        className="flex flex-col items-center justify-center gap-6 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <MagicWand isAnimating={false} />
          <div>
            <h2 className="text-3xl font-bold text-amber-100 drop-shadow-lg">
              ✨ PROMPT CRAFT
            </h2>
            <p className="text-amber-200/80 text-sm">Learn to talk to AI!</p>
          </div>
        </div>

        <p className="text-amber-100 text-center mb-4">
          Choose your skill level:
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => (
            <motion.button
              key={diff}
              onClick={() => onSelect(diff)}
              className="px-6 py-4 rounded-xl font-bold text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${DIFFICULTY_CONFIG[diff].color}, ${DIFFICULTY_CONFIG[diff].color}dd)`,
                border: "4px solid rgba(0,0,0,0.3)",
                boxShadow: "0 4px 0 rgba(0,0,0,0.5)",
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 2 }}
            >
              <span className="text-lg">{DIFFICULTY_CONFIG[diff].label}</span>
              <span className="block text-sm opacity-80">
                Ages {DIFFICULTY_CONFIG[diff].age}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function PromptCraftGame({ onExit, onComplete, onCorrectAnswer, onWrongAnswer }: PromptCraftGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, mistakes: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  if (!difficulty) {
    return <DifficultySelector onSelect={setDifficulty} onExit={onExit} />;
  }

  const questions = QUESTIONS[difficulty];
  const currentQuestion = questions[currentIndex];
  const config = DIFFICULTY_CONFIG[difficulty];

  const checkAnswer = useCallback(() => {
    if (selectedOption === null) return;

    setIsAnimating(true);
    setShowResult(true);

    const selectedQuality = currentQuestion.options[selectedOption].quality;
    const isCorrect = selectedQuality === "best";

    if (isCorrect) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
      onCorrectAnswer?.();
    } else {
      setScore((prev) => ({ ...prev, mistakes: prev.mistakes + 1 }));
      onWrongAnswer?.();
    }

    setTimeout(() => setIsAnimating(false), 500);
  }, [selectedOption, currentQuestion, onCorrectAnswer, onWrongAnswer]);

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
      setShowHint(false);
    } else {
      onComplete(score.correct, score.mistakes);
    }
  };

  return (
    <GameContainer
      title={`PROMPT CRAFT: ${config.label}`}
      icon="✨"
      currentQuestion={currentIndex}
      totalQuestions={questions.length}
      onExit={onExit}
    >
      {/* Magic wand animation */}
      <div className="flex items-center justify-center mb-4">
        <MagicWand isAnimating={isAnimating} />
      </div>

      {/* Score */}
      <div className="flex justify-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1 text-green-400">
          ✅ {score.correct}
        </div>
        <div className="flex items-center gap-1 text-red-400">
          ❌ {score.mistakes}
        </div>
      </div>

      {/* Task */}
      <QuestionCard
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        label="TASK"
      >
        <p className="text-amber-200/80 text-sm mb-2">Your goal:</p>
        <p className="text-white font-bold text-lg">{currentQuestion.task}</p>
        <p className="text-amber-200/80 text-sm mt-3">
          Which prompt would work BEST for AI?
        </p>
      </QuestionCard>

      {/* Hint */}
      <HintBox
        hint={currentQuestion.hint}
        visible={showHint && !showResult}
      />

      {/* Options */}
      <div className="space-y-3 my-4">
        {currentQuestion.options.map((option, index) => (
          <PromptOption
            key={index}
            option={option}
            index={index}
            isSelected={selectedOption === index}
            showResult={showResult}
            onClick={() => !showResult && setSelectedOption(index)}
          />
        ))}
      </div>

      {/* Feedback */}
      <Feedback
        type={selectedOption !== null && currentQuestion.options[selectedOption]?.quality === "best" ? "success" : "error"}
        title={selectedOption !== null && currentQuestion.options[selectedOption]?.quality === "best" ? "Perfect Prompt!" : "Keep Learning!"}
        message={selectedOption !== null && currentQuestion.options[selectedOption]?.quality === "best"
          ? "✨ You found the best way to ask AI!"
          : "📝 Check the explanations to see why."}
        visible={showResult}
      />

      {/* Learning principle */}
      {showResult && (
        <LearningBox title="🔮 Prompt Principle:">
          <p>{currentQuestion.principle}</p>
        </LearningBox>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        {!showResult ? (
          <>
            <motion.button
              onClick={() => setShowHint(true)}
              disabled={showHint}
              className="flex-1 py-3 rounded-lg font-bold text-white"
              style={{
                background: showHint
                  ? "rgba(120, 113, 108, 0.5)"
                  : "linear-gradient(180deg, #a855f7, #7c3aed)",
                opacity: showHint ? 0.5 : 1,
              }}
              whileHover={!showHint ? { scale: 1.02 } : {}}
              whileTap={!showHint ? { scale: 0.98 } : {}}
            >
              💡 Hint
            </motion.button>
            <motion.button
              onClick={checkAnswer}
              disabled={selectedOption === null}
              className="flex-1 py-3 rounded-lg font-bold text-white"
              style={{
                background: selectedOption === null
                  ? "rgba(120, 113, 108, 0.5)"
                  : "linear-gradient(180deg, #22c55e, #16a34a)",
                opacity: selectedOption === null ? 0.5 : 1,
              }}
              whileHover={selectedOption !== null ? { scale: 1.02 } : {}}
              whileTap={selectedOption !== null ? { scale: 0.98 } : {}}
            >
              ✨ Check
            </motion.button>
          </>
        ) : (
          <motion.button
            onClick={nextQuestion}
            className="w-full py-3 rounded-lg font-bold text-white"
            style={{
              background: "linear-gradient(180deg, #3b82f6, #2563eb)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {currentIndex < questions.length - 1 ? "Next Prompt →" : "🏆 See Results"}
          </motion.button>
        )}
      </div>
    </GameContainer>
  );
}
