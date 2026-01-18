"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  GameContainer,
  QuestionCard,
  HintBox,
  Feedback,
  LearningBox,
} from "./GameContainer";
import { cn } from "@/lib/utils";

// Questions organized by difficulty
const QUESTIONS = {
  easy: [
    {
      situation: "Your friend says: \"I fell and hurt my knee!\"",
      options: [
        { text: "Be more careful next time!", type: "dismissive", emoji: "😑" },
        { text: "Are you okay? Let me help!", type: "correct", emoji: "🤗" },
        { text: "That's funny!", type: "hurtful", emoji: "😂" },
      ],
      correct: 1,
      hint: "What would make YOUR knee feel better?",
      explanation: "When someone is hurt, they need comfort and help first!",
    },
    {
      situation: "Your classmate says: \"I got a gold star on my test!\"",
      options: [
        { text: "So what? I got two stars before.", type: "dismissive", emoji: "🙄" },
        { text: "Wow, that's amazing! Good job!", type: "correct", emoji: "🎉" },
        { text: "The test was easy anyway.", type: "hurtful", emoji: "😒" },
      ],
      correct: 1,
      hint: "How do YOU like people to react to your success?",
      explanation: "Celebrating others' achievements makes them feel valued!",
    },
    {
      situation: "Your sibling says: \"I'm scared of the dark.\"",
      options: [
        { text: "That's silly, there's nothing there!", type: "dismissive", emoji: "🙄" },
        { text: "Ha ha, you're such a baby!", type: "hurtful", emoji: "😝" },
        { text: "I understand. Want a nightlight?", type: "correct", emoji: "💡" },
      ],
      correct: 2,
      hint: "Fear is real, even if the danger isn't...",
      explanation: "Offering solutions shows you care about their feelings!",
    },
    {
      situation: "Your friend says: \"I miss my grandma who moved away.\"",
      options: [
        { text: "At least she's not gone forever!", type: "dismissive", emoji: "🤷" },
        { text: "I'm sorry. Missing people is hard.", type: "correct", emoji: "💕" },
        { text: "Just video call her, duh.", type: "hurtful", emoji: "📱" },
      ],
      correct: 1,
      hint: "Sometimes people just need to be heard...",
      explanation: "Acknowledging feelings is more helpful than fixing!",
    },
    {
      situation: "A new kid at school says: \"I don't have any friends here yet.\"",
      options: [
        { text: "That's because you're new.", type: "dismissive", emoji: "🤷" },
        { text: "Want to sit with me at lunch?", type: "correct", emoji: "😊" },
        { text: "Making friends is easy, just try harder.", type: "hurtful", emoji: "💪" },
      ],
      correct: 1,
      hint: "What would help YOU in a new place?",
      explanation: "Including others is the best way to help them feel welcome!",
    },
    {
      situation: "Your friend says: \"I dropped my ice cream cone!\"",
      options: [
        { text: "You should have been more careful.", type: "dismissive", emoji: "👆" },
        { text: "Oh no! That's so sad. Want to share mine?", type: "correct", emoji: "🍦" },
        { text: "Ha! Now you have no ice cream!", type: "hurtful", emoji: "😆" },
      ],
      correct: 1,
      hint: "What would cheer YOU up?",
      explanation: "Showing kindness and sharing helps friends feel better!",
    },
    {
      situation: "Your teammate says: \"I missed the goal and we lost.\"",
      options: [
        { text: "Yeah, you really messed up.", type: "hurtful", emoji: "😤" },
        { text: "It's okay! We all miss sometimes. You'll get it next time!", type: "correct", emoji: "⚽" },
        { text: "It doesn't matter, it's just a game.", type: "dismissive", emoji: "🤷" },
      ],
      correct: 1,
      hint: "How would YOU want someone to treat YOUR mistake?",
      explanation: "Encouragement helps people try again with confidence!",
    },
    {
      situation: "Your friend says: \"My pet fish died today.\"",
      options: [
        { text: "It's just a fish, you can get another one.", type: "dismissive", emoji: "🐟" },
        { text: "I'm so sorry. Losing a pet is really sad.", type: "correct", emoji: "💔" },
        { text: "Fish don't live very long anyway.", type: "hurtful", emoji: "🤷" },
      ],
      correct: 1,
      hint: "The size of the pet doesn't change the size of the love...",
      explanation: "All losses deserve compassion, no matter how small!",
    },
    {
      situation: "Your cousin says: \"I'm nervous about my piano recital.\"",
      options: [
        { text: "You'll probably mess up, you always do.", type: "hurtful", emoji: "😏" },
        { text: "Don't be nervous, it's no big deal.", type: "dismissive", emoji: "🤷" },
        { text: "I believe in you! You've practiced so hard!", type: "correct", emoji: "🎹" },
      ],
      correct: 2,
      hint: "What helps YOU when you're nervous?",
      explanation: "Encouragement and belief in someone boosts their confidence!",
    },
    {
      situation: "Your friend says: \"I got a haircut and I don't like it.\"",
      options: [
        { text: "Yeah, it does look kind of weird.", type: "hurtful", emoji: "😬" },
        { text: "It'll grow back, don't worry!", type: "dismissive", emoji: "💇" },
        { text: "I think it looks nice! But I understand how you feel.", type: "correct", emoji: "😊" },
      ],
      correct: 2,
      hint: "Be honest but kind...",
      explanation: "Validating feelings while being supportive shows true friendship!",
    },
  ],
  medium: [
    {
      situation: "Your friend says: \"I didn't get invited to Sarah's party...\"",
      options: [
        { text: "Their loss! You're way better than them!", type: "dismissive", emoji: "😤" },
        { text: "That must hurt. Do you want to talk about it?", type: "correct", emoji: "💭" },
        { text: "Maybe they just forgot. Did you ask them?", type: "excusing", emoji: "🤔" },
      ],
      correct: 1,
      hint: "Sometimes people need to feel heard, not fixed...",
      explanation: "Acknowledging pain before problem-solving shows true empathy!",
    },
    {
      situation: "Your classmate says: \"I studied so hard but still failed the test.\"",
      options: [
        { text: "Maybe you need to study differently next time.", type: "dismissive", emoji: "📚" },
        { text: "That must be really frustrating. Failing after trying hard is the worst.", type: "correct", emoji: "😔" },
        { text: "At least you tried! That's what matters.", type: "excusing", emoji: "👍" },
      ],
      correct: 1,
      hint: "Effort without results can feel terrible...",
      explanation: "Naming the specific feeling shows you truly understand!",
    },
    {
      situation: "Your friend says: \"My parents fight a lot lately.\"",
      options: [
        { text: "All parents fight, it's normal.", type: "dismissive", emoji: "🤷" },
        { text: "That sounds really stressful. I'm here if you need to talk.", type: "correct", emoji: "🤝" },
        { text: "Maybe they'll stop soon! Try to ignore it.", type: "excusing", emoji: "🙉" },
      ],
      correct: 1,
      hint: "Home problems affect everything...",
      explanation: "Offering support without minimizing shows you care!",
    },
    {
      situation: "Your teammate says: \"Coach never picks me to play in important games.\"",
      options: [
        { text: "Have you tried practicing more?", type: "dismissive", emoji: "🏃" },
        { text: "That's unfair! Coach is wrong!", type: "reactive", emoji: "😠" },
        { text: "That must feel discouraging. You work so hard in practice.", type: "correct", emoji: "💪" },
      ],
      correct: 2,
      hint: "Validate the feeling before offering solutions...",
      explanation: "Acknowledging effort shows you see their hard work!",
    },
    {
      situation: "Your sibling says: \"Everyone at school has more friends than me.\"",
      options: [
        { text: "That's not true, stop exaggerating!", type: "dismissive", emoji: "🙄" },
        { text: "Quality matters more than quantity. You have ME!", type: "excusing", emoji: "💁" },
        { text: "Feeling lonely is hard. What makes you feel that way?", type: "correct", emoji: "💙" },
      ],
      correct: 2,
      hint: "Asking questions shows you want to understand...",
      explanation: "Curiosity about feelings deepens connection!",
    },
    {
      situation: "Your friend says: \"I have to move to a new city next month.\"",
      options: [
        { text: "Wow, that's exciting! New adventures!", type: "dismissive", emoji: "🎉" },
        { text: "Oh no! I'll miss you SO much, this is terrible!", type: "reactive", emoji: "😭" },
        { text: "That's big news. How are you feeling about it?", type: "correct", emoji: "🏠" },
      ],
      correct: 2,
      hint: "Let THEM decide how they feel first...",
      explanation: "Asking about their feelings respects their experience!",
    },
    {
      situation: "Your classmate says: \"I never understand math, I'm just stupid.\"",
      options: [
        { text: "You're not stupid! Math is just hard for some people.", type: "excusing", emoji: "🤷" },
        { text: "If you studied more, you'd get it.", type: "dismissive", emoji: "📖" },
        { text: "You're not stupid. Math can be confusing. Want to work on it together?", type: "correct", emoji: "🧮" },
      ],
      correct: 2,
      hint: "Challenge negative self-talk while offering help...",
      explanation: "Correcting AND offering support shows real friendship!",
    },
    {
      situation: "Your friend says: \"I'm jealous that my sister gets more attention.\"",
      options: [
        { text: "You shouldn't be jealous, that's bad.", type: "dismissive", emoji: "👆" },
        { text: "Your parents love you both equally!", type: "excusing", emoji: "❤️" },
        { text: "It makes sense to feel that way. That sounds hard.", type: "correct", emoji: "💭" },
      ],
      correct: 2,
      hint: "Jealousy is a normal feeling...",
      explanation: "Normalizing feelings helps people feel less ashamed!",
    },
    {
      situation: "Your cousin says: \"I'm worried I won't make the team this year.\"",
      options: [
        { text: "Don't worry, you'll definitely make it!", type: "excusing", emoji: "👍" },
        { text: "If you don't, there's always next year.", type: "dismissive", emoji: "📅" },
        { text: "Tryouts are stressful. What part worries you most?", type: "correct", emoji: "🎯" },
      ],
      correct: 2,
      hint: "Dig deeper into the worry...",
      explanation: "Specific questions show genuine interest in their feelings!",
    },
    {
      situation: "Your friend says: \"I said something mean and now everyone's mad at me.\"",
      options: [
        { text: "What did you say? That was dumb.", type: "hurtful", emoji: "🤦" },
        { text: "They'll forget about it soon.", type: "dismissive", emoji: "⏰" },
        { text: "That's a tough situation. Do you want help figuring out how to fix it?", type: "correct", emoji: "🔧" },
      ],
      correct: 2,
      hint: "Help them move forward without judging...",
      explanation: "Offering to help without blame shows mature support!",
    },
  ],
  hard: [
    {
      situation: "Your friend says: \"My parents are getting divorced.\"",
      options: [
        { text: "At least you'll get two Christmases!", type: "dismissive", emoji: "🎄" },
        { text: "That sounds really hard. I'm here for you no matter what.", type: "correct", emoji: "🤗" },
        { text: "My parents fought last week too, I totally understand.", type: "self-focused", emoji: "👆" },
      ],
      correct: 1,
      hint: "This is about THEM, not you...",
      explanation: "Being present without comparing shows true support!",
    },
    {
      situation: "Your classmate says: \"I don't think anyone actually likes me.\"",
      options: [
        { text: "That's not true! I like you!", type: "reactive", emoji: "❤️" },
        { text: "Why would you think that? You're great!", type: "dismissive", emoji: "😊" },
        { text: "It sounds like you're feeling really alone. That's painful.", type: "correct", emoji: "💙" },
      ],
      correct: 2,
      hint: "Sometimes the deeper feeling needs to be named...",
      explanation: "Naming the root feeling shows deep understanding!",
    },
    {
      situation: "Your friend says: \"I got into a fight with my best friend and I don't know if we can fix it.\"",
      options: [
        { text: "Just apologize and it'll be fine.", type: "dismissive", emoji: "🤝" },
        { text: "What did THEY do wrong?", type: "reactive", emoji: "😤" },
        { text: "That must be scary. What do you think you need to feel better?", type: "correct", emoji: "💭" },
      ],
      correct: 2,
      hint: "Help them find their own answers...",
      explanation: "Empowering self-reflection helps more than giving answers!",
    },
    {
      situation: "Your sibling says: \"I feel like I'm not good at anything.\"",
      options: [
        { text: "That's ridiculous! You're good at so many things!", type: "dismissive", emoji: "🙄" },
        { text: "Everyone feels that way sometimes. It'll pass.", type: "minimizing", emoji: "🤷" },
        { text: "That feeling is really heavy. What's making you feel this way lately?", type: "correct", emoji: "🌧️" },
      ],
      correct: 2,
      hint: "Explore what triggered this feeling...",
      explanation: "Understanding the source helps address the real problem!",
    },
    {
      situation: "Your friend says: \"I told someone a secret and now I regret it.\"",
      options: [
        { text: "Why would you do that? That was a mistake.", type: "hurtful", emoji: "🤦" },
        { text: "It'll be okay, secrets always come out anyway.", type: "dismissive", emoji: "🤷" },
        { text: "Regret is a hard feeling. What are you most worried about now?", type: "correct", emoji: "💭" },
      ],
      correct: 2,
      hint: "Focus on the present feeling, not the past action...",
      explanation: "Looking forward helps more than dwelling on mistakes!",
    },
    {
      situation: "Your teammate says: \"Sometimes I wonder if I should just quit the team.\"",
      options: [
        { text: "Don't quit! We need you!", type: "self-focused", emoji: "🙏" },
        { text: "Maybe you should if you're not enjoying it.", type: "dismissive", emoji: "🚪" },
        { text: "Sounds like something's been bothering you. Want to talk about it?", type: "correct", emoji: "🗣️" },
      ],
      correct: 2,
      hint: "There's usually more underneath...",
      explanation: "Exploring the deeper issue helps them make better decisions!",
    },
    {
      situation: "Your friend who usually smiles says: \"I'm fine\" but looks sad.",
      options: [
        { text: "Great! Let's go play then!", type: "oblivious", emoji: "🏃" },
        { text: "You don't look fine. Tell me what's wrong.", type: "pushing", emoji: "👁️" },
        { text: "I'm here if you want to talk. No pressure.", type: "correct", emoji: "💕" },
      ],
      correct: 2,
      hint: "Respect their space while showing you care...",
      explanation: "Offering support without forcing opens doors!",
    },
    {
      situation: "Your classmate says: \"I hate how I look in photos.\"",
      options: [
        { text: "You look fine, stop being dramatic.", type: "dismissive", emoji: "🙄" },
        { text: "Everyone hates photos of themselves!", type: "minimizing", emoji: "📸" },
        { text: "I'm sorry you feel that way. What specifically bothers you?", type: "correct", emoji: "💭" },
      ],
      correct: 2,
      hint: "Body image struggles are real...",
      explanation: "Taking concerns seriously builds trust!",
    },
    {
      situation: "Your friend says: \"I think I made everyone uncomfortable at the party.\"",
      options: [
        { text: "You probably did, you were being weird.", type: "hurtful", emoji: "😬" },
        { text: "No one noticed, you're overthinking!", type: "dismissive", emoji: "🤷" },
        { text: "Social anxiety can make us feel that way. What happened?", type: "correct", emoji: "🎭" },
      ],
      correct: 2,
      hint: "Validate the experience, then explore...",
      explanation: "Naming anxiety normalizes it and opens conversation!",
    },
    {
      situation: "Your friend says: \"I don't want to talk about it\" after seeming upset all day.",
      options: [
        { text: "Fine, whatever.", type: "defensive", emoji: "😤" },
        { text: "You HAVE to tell me, I'm your friend!", type: "pushing", emoji: "👆" },
        { text: "That's okay. I'm here whenever you're ready. Want to just hang out?", type: "correct", emoji: "🤝" },
      ],
      correct: 2,
      hint: "Respect + presence = support...",
      explanation: "Being there without pressure is sometimes the best support!",
    },
  ],
};

type Difficulty = "easy" | "medium" | "hard";

interface ResponseCraftGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

// Speech Bubble Component
function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative bg-white text-gray-800 rounded-2xl p-4 mb-4 shadow-lg"
      style={{
        boxShadow: "0 4px 15px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.5)",
      }}
    >
      {children}
      {/* Speech bubble tail */}
      <div
        className="absolute -bottom-3 left-8 w-6 h-6 bg-white"
        style={{
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      />
    </motion.div>
  );
}

// Difficulty Selector Component
function DifficultySelector({
  onSelect,
}: {
  onSelect: (difficulty: Difficulty) => void;
}) {
  const difficulties = [
    {
      id: "easy" as Difficulty,
      label: "KIND HEART",
      ages: "Ages 6-8",
      icon: "💚",
      color: "from-[#4CAF50] to-[#2E7D32]",
      borderColor: "#4CAF50",
      description: "Simple situations with clear best responses",
    },
    {
      id: "medium" as Difficulty,
      label: "WISE FRIEND",
      ages: "Ages 9-11",
      icon: "💙",
      color: "from-[#2196F3] to-[#1565C0]",
      borderColor: "#2196F3",
      description: "Trickier situations, subtle differences",
    },
    {
      id: "hard" as Difficulty,
      label: "EMPATHY MASTER",
      ages: "Ages 12+",
      icon: "💜",
      color: "from-[#9C27B0] to-[#6A1B9A]",
      borderColor: "#9C27B0",
      description: "Complex feelings, nuanced responses",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <div className="text-center mb-8">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🤝
        </motion.div>
        <h1 className="font-pixel text-[1.1em] text-white mb-2">RESPONSE CRAFT</h1>
        <p className="text-white/70 text-[1em]">Choose the best way to respond</p>
      </div>

      <div className="grid gap-4">
        {difficulties.map((diff, index) => (
          <motion.button
            key={diff.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(diff.id)}
            className={cn(
              "relative overflow-hidden p-4 border-4 text-left transition-all",
              `bg-gradient-to-r ${diff.color}`
            )}
            style={{
              borderColor: diff.borderColor,
              boxShadow: `
                0 0 20px ${diff.borderColor}40,
                inset 2px 2px 0 rgba(255,255,255,0.2),
                inset -2px -2px 0 rgba(0,0,0,0.3),
                4px 4px 0 rgba(0,0,0,0.4)
              `,
            }}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{diff.icon}</span>
              <div className="flex-1">
                <div className="font-pixel text-[0.7em] text-white">{diff.label}</div>
                <div className="text-white/80 text-[0.85em]">{diff.ages}</div>
                <div className="text-white/60 text-[0.75em] mt-1">{diff.description}</div>
              </div>
              <motion.span
                className="text-2xl text-white/80"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                →
              </motion.span>
            </div>

            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Response Option Button
function ResponseOption({
  option,
  index,
  onClick,
  state,
  disabled,
}: {
  option: { text: string; type: string; emoji: string };
  index: number;
  onClick: () => void;
  state: "default" | "correct" | "incorrect";
  disabled: boolean;
}) {
  const letters = ["A", "B", "C"];

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={disabled ? {} : { scale: 1.02, x: 5 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full p-4 border-4 text-left transition-all flex items-start gap-3",
        state === "correct" &&
          "bg-gradient-to-r from-[#50FF7F] via-[#17D049] to-[#0C9430] border-[#085020]",
        state === "incorrect" &&
          "bg-gradient-to-r from-[#FF6666] via-[#FF1A1A] to-[#AA0000] border-[#550000]",
        state === "default" &&
          "bg-gradient-to-r from-[#4A3728] to-[#3A2A1A] border-[#5D4030] hover:border-[#8B6914]",
        disabled && state === "default" && "opacity-50"
      )}
      style={{
        boxShadow:
          state === "default"
            ? "inset 2px 2px 0 rgba(255,255,255,0.1), 3px 3px 0 rgba(0,0,0,0.4)"
            : state === "correct"
            ? "0 0 20px rgba(23,208,73,0.5)"
            : "0 0 20px rgba(255,26,26,0.5)",
      }}
    >
      {/* Letter badge */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-pixel text-sm shrink-0",
          state === "correct" && "bg-white/30",
          state === "incorrect" && "bg-white/30",
          state === "default" && "bg-[#8B6914]"
        )}
      >
        {letters[index]}
      </div>

      {/* Response text */}
      <div className="flex-1">
        <span className="text-white text-[0.95em]">{option.text}</span>
      </div>

      {/* Emoji */}
      <span className="text-2xl shrink-0">{option.emoji}</span>

      {/* Result indicator */}
      {state !== "default" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-2 -top-2 text-2xl"
        >
          {state === "correct" ? "✅" : "❌"}
        </motion.div>
      )}
    </motion.button>
  );
}

export function ResponseCraftGame({
  onExit,
  onComplete,
  onCorrectAnswer,
  onWrongAnswer,
}: ResponseCraftGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const questions = difficulty ? QUESTIONS[difficulty] : [];
  const currentQuestion = questions[questionIndex];

  const advanceToNext = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      setShowHint(false);
      setFeedback(null);
      setSelectedAnswer(null);
    } else {
      onComplete(correct, mistakes);
    }
  }, [questionIndex, questions.length, correct, mistakes, onComplete]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const checkAnswer = useCallback(
    (answerIndex: number) => {
      if (selectedAnswer !== null) return;

      setSelectedAnswer(answerIndex);

      if (answerIndex === currentQuestion.correct) {
        setCorrect((c) => c + 1);
        setFeedback({
          type: "success",
          message: currentQuestion.explanation,
        });
        onCorrectAnswer();

        autoAdvanceTimeoutRef.current = setTimeout(() => {
          if (questionIndex < questions.length - 1) {
            setQuestionIndex((i) => i + 1);
            setShowHint(false);
            setFeedback(null);
            setSelectedAnswer(null);
          } else {
            onComplete(correct + 1, mistakes);
          }
          autoAdvanceTimeoutRef.current = null;
        }, 2500);
      } else {
        setMistakes((m) => m + 1);
        setFeedback({
          type: "error",
          message: "Think about how this would make THEM feel...",
        });
        onWrongAnswer();
      }
    },
    [
      currentQuestion,
      questionIndex,
      correct,
      mistakes,
      questions.length,
      onComplete,
      onCorrectAnswer,
      onWrongAnswer,
      selectedAnswer,
    ]
  );

  const getOptionState = (index: number) => {
    if (selectedAnswer === null) return "default";
    if (index === currentQuestion.correct) return "correct";
    if (index === selectedAnswer) return "incorrect";
    return "default";
  };

  if (!difficulty) {
    return (
      <div
        className="bg-gradient-to-b from-[#4A3728] via-[#3A2A1A] to-[#2A1A0A] border-6 border-[#5D4030] p-4"
        style={{
          boxShadow:
            "inset 4px 4px 0 rgba(255,255,255,0.15), inset -4px -4px 0 rgba(0,0,0,0.4), 8px 8px 0 rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex justify-end mb-4">
          <Button variant="stone" size="sm" onClick={onExit}>
            ← EXIT
          </Button>
        </div>
        <DifficultySelector onSelect={setDifficulty} />
      </div>
    );
  }

  const difficultyLabels = {
    easy: { name: "KIND HEART", icon: "💚" },
    medium: { name: "WISE FRIEND", icon: "💙" },
    hard: { name: "EMPATHY MASTER", icon: "💜" },
  };

  return (
    <GameContainer
      title={`RESPONSE CRAFT: ${difficultyLabels[difficulty].name}`}
      icon="🤝"
      currentQuestion={questionIndex}
      totalQuestions={questions.length}
      onExit={onExit}
    >
      {/* Friend Avatar */}
      <div className="flex items-center gap-3 mb-2">
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl"
        >
          👤
        </motion.div>
        <span className="text-white/60 text-sm">Your friend says...</span>
      </div>

      {/* Speech Bubble with Situation */}
      <SpeechBubble>
        <p className="text-[1.1em] text-gray-700 leading-relaxed">
          {currentQuestion.situation.replace('Your friend says: "', "").replace('"', "")}
        </p>
      </SpeechBubble>

      {/* Learning Box */}
      <LearningBox title="💡 THINK:">
        <div className="text-[0.9em] text-center">
          What response would make them feel <b>heard</b> and <b>supported</b>?
        </div>
      </LearningBox>

      {/* Response Options */}
      <div className="space-y-3 my-4">
        {currentQuestion.options.map((option, index) => (
          <ResponseOption
            key={index}
            option={option}
            index={index}
            onClick={() => checkAnswer(index)}
            state={getOptionState(index)}
            disabled={selectedAnswer !== null}
          />
        ))}
      </div>

      {/* Hint Button */}
      {!showHint && selectedAnswer === null && (
        <div className="text-center">
          <Button variant="gold" onClick={() => setShowHint(true)}>
            💡 NEED A HINT?
          </Button>
        </div>
      )}

      {/* Hint Box */}
      <HintBox hint={currentQuestion.hint} visible={showHint && selectedAnswer === null} />

      {/* Feedback */}
      <Feedback
        type={feedback?.type || "success"}
        title={feedback?.type === "success" ? "🤝 PERFECT RESPONSE!" : "💭 TRY AGAIN!"}
        message={feedback?.message || ""}
        visible={!!feedback}
      />

      {feedback?.type === "success" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Button
            variant="emerald"
            size="lg"
            onClick={advanceToNext}
            className="w-full text-[1.1em]"
          >
            {questionIndex < questions.length - 1 ? "NEXT →" : "FINISH ✓"}
          </Button>
        </motion.div>
      )}
    </GameContainer>
  );
}
