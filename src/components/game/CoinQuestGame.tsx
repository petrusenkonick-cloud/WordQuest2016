"use client";

import { useState, useCallback } from "react";
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
      situation: "You have 100 coins. You want a toy (60 coins) and ice cream (30 coins). Can you buy both?",
      options: [
        { text: "Yes! I'll have 10 coins left", answer: true, emoji: "✅" },
        { text: "No, not enough money", answer: false, emoji: "❌" },
      ],
      correct: 0,
      hint: "Add up 60 + 30 and compare to 100!",
      explanation: "60 + 30 = 90 coins. You have 100, so yes! You'll even have 10 coins left to save!",
      calculation: "60 + 30 = 90 < 100 ✓",
    },
    {
      situation: "You have 50 coins. A game costs 75 coins. Can you buy it?",
      options: [
        { text: "Yes, I have enough", answer: false, emoji: "✅" },
        { text: "No, I need 25 more coins", answer: true, emoji: "❌" },
      ],
      correct: 1,
      hint: "Compare: 50 vs 75",
      explanation: "50 is less than 75. You need 75 - 50 = 25 more coins!",
      calculation: "75 - 50 = 25 coins needed",
    },
    {
      situation: "You get 10 coins allowance every week. How many coins will you have after 3 weeks?",
      options: [
        { text: "30 coins", answer: true, emoji: "💰" },
        { text: "13 coins", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "10 + 10 + 10 = ?",
      explanation: "10 coins × 3 weeks = 30 coins! Saving weekly adds up!",
      calculation: "10 × 3 = 30 coins",
    },
    {
      situation: "You have 20 coins and want to share equally with your friend. How many does each person get?",
      options: [
        { text: "10 coins each", answer: true, emoji: "🤝" },
        { text: "15 coins each", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "Divide by 2 (you and friend)",
      explanation: "20 ÷ 2 = 10 coins each! Sharing means splitting evenly.",
      calculation: "20 ÷ 2 = 10 coins each",
    },
    {
      situation: "A toy costs 40 coins. You have 25 coins. Your grandma gives you 20 coins. Can you buy it now?",
      options: [
        { text: "Yes! And I'll have 5 left", answer: true, emoji: "🎁" },
        { text: "No, still not enough", answer: false, emoji: "😞" },
      ],
      correct: 0,
      hint: "Add what you have: 25 + 20",
      explanation: "25 + 20 = 45 coins. The toy costs 40, so YES! You'll have 45 - 40 = 5 coins left!",
      calculation: "25 + 20 = 45 > 40 ✓",
    },
    {
      situation: "You found 5 coins on Monday, 3 coins on Tuesday, and 7 coins on Wednesday. How many total?",
      options: [
        { text: "15 coins", answer: true, emoji: "🪙" },
        { text: "12 coins", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "Add all three days!",
      explanation: "5 + 3 + 7 = 15 coins! Keep track of what you find and earn!",
      calculation: "5 + 3 + 7 = 15 coins",
    },
    {
      situation: "Ice cream costs 8 coins. You want to buy ice cream for you and 2 friends (3 total). How much do you need?",
      options: [
        { text: "16 coins", answer: false, emoji: "🤔" },
        { text: "24 coins", answer: true, emoji: "🍦" },
      ],
      correct: 1,
      hint: "8 coins × 3 people = ?",
      explanation: "8 × 3 = 24 coins! When buying for multiple people, multiply!",
      calculation: "8 × 3 = 24 coins",
    },
    {
      situation: "You have 100 coins. You spend 35 on books and 25 on snacks. How much is left?",
      options: [
        { text: "40 coins", answer: true, emoji: "💰" },
        { text: "60 coins", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "Subtract both purchases from 100",
      explanation: "100 - 35 - 25 = 40 coins left! Track your spending!",
      calculation: "100 - 35 - 25 = 40 coins",
    },
    {
      situation: "A pack of stickers costs 12 coins. You have 50 coins. How many packs can you buy?",
      options: [
        { text: "4 packs (and 2 coins left)", answer: true, emoji: "🎨" },
        { text: "5 packs", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "How many 12s fit in 50?",
      explanation: "50 ÷ 12 = 4 packs with 2 coins left! (4 × 12 = 48)",
      calculation: "50 ÷ 12 = 4 remainder 2",
    },
    {
      situation: "You save 5 coins every day for a week (7 days). How much will you have?",
      options: [
        { text: "35 coins", answer: true, emoji: "📅" },
        { text: "12 coins", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "7 days × 5 coins = ?",
      explanation: "5 × 7 = 35 coins! Daily saving really adds up over a week!",
      calculation: "5 × 7 = 35 coins",
    },
  ],
  medium: [
    {
      situation: "You get 50 coins allowance each week. You want a game that costs 180 coins. How many weeks to save?",
      options: [
        { text: "3 weeks", answer: false, emoji: "📅" },
        { text: "4 weeks", answer: true, emoji: "⏰" },
      ],
      correct: 1,
      hint: "180 ÷ 50 = ? (round UP!)",
      explanation: "180 ÷ 50 = 3.6 weeks. Since you can't do half weeks, you need 4 full weeks!",
      calculation: "180 ÷ 50 = 3.6 → 4 weeks",
    },
    {
      situation: "A toy is on sale: 25% off the original 80 coins. What's the sale price?",
      options: [
        { text: "60 coins", answer: true, emoji: "🏷️" },
        { text: "55 coins", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "25% of 80 = 20. Now subtract!",
      explanation: "25% of 80 = 20 coins discount. 80 - 20 = 60 coins! Sales save money!",
      calculation: "80 × 0.25 = 20 off → 80 - 20 = 60",
    },
    {
      situation: "You want to buy 3 items: 45 coins, 30 coins, 25 coins. You have 100 coins. What should you NOT buy to stay in budget?",
      options: [
        { text: "Skip the 45-coin item", answer: true, emoji: "🎯" },
        { text: "Skip the 25-coin item", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "Add 30 + 25. Is it under 100?",
      explanation: "30 + 25 = 55 (under budget!). But 45 + 30 = 75 or 45 + 25 = 70 both leave you with less. Smart budgeting means making choices!",
      calculation: "Total = 100. Skip 45 → buy 30+25=55 ✓",
    },
    {
      situation: "You earn 15 coins for each chore. You did 6 chores. Your brother did 4 chores. How much more did you earn?",
      options: [
        { text: "30 coins more", answer: true, emoji: "🧹" },
        { text: "2 chores more", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "You: 6×15, Brother: 4×15, then subtract",
      explanation: "You: 6 × 15 = 90 coins. Brother: 4 × 15 = 60 coins. Difference: 90 - 60 = 30 more coins!",
      calculation: "(6-4) × 15 = 2 × 15 = 30 coins",
    },
    {
      situation: "A movie ticket costs 35 coins. Popcorn costs 15 coins. You have 60 coins. Can you afford both and have money left?",
      options: [
        { text: "Yes, 10 coins left", answer: true, emoji: "🎬" },
        { text: "No, exactly enough", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "35 + 15 = ?",
      explanation: "35 + 15 = 50 coins total. 60 - 50 = 10 coins left! Always good to have savings!",
      calculation: "35 + 15 = 50. 60 - 50 = 10 left",
    },
    {
      situation: "You're saving for a 200-coin bike. You have 75 coins saved. Grandpa gives you half of what you still need. How much do you have now?",
      options: [
        { text: "137.5 coins (still need 62.5)", answer: true, emoji: "🚲" },
        { text: "175 coins", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "Need: 200-75=125. Half of that?",
      explanation: "Still need: 200 - 75 = 125. Grandpa gives half: 125 ÷ 2 = 62.5 coins. Total: 75 + 62.5 = 137.5!",
      calculation: "75 + (200-75)/2 = 75 + 62.5 = 137.5",
    },
    {
      situation: "Which is a better deal? A) 3 apples for 12 coins, or B) 5 apples for 15 coins?",
      options: [
        { text: "A) 3 for 12 (4 coins each)", answer: false, emoji: "🍎" },
        { text: "B) 5 for 15 (3 coins each)", answer: true, emoji: "🍎" },
      ],
      correct: 1,
      hint: "Calculate price per apple for each!",
      explanation: "A: 12÷3 = 4 coins each. B: 15÷5 = 3 coins each. Option B is cheaper per apple!",
      calculation: "A: 12÷3=4 per apple. B: 15÷5=3 per apple",
    },
    {
      situation: "You have 150 coins. You want to save 40% for later. How much can you spend now?",
      options: [
        { text: "90 coins", answer: true, emoji: "💰" },
        { text: "60 coins", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "If saving 40%, spending 60%",
      explanation: "Save 40% means spend 60%. 150 × 0.60 = 90 coins to spend! Saving first is smart!",
      calculation: "150 × 60% = 150 × 0.6 = 90",
    },
    {
      situation: "A book normally costs 50 coins. It's 20% off today but will be 30% off next week. How much more do you save by waiting?",
      options: [
        { text: "5 coins more", answer: true, emoji: "📚" },
        { text: "10 coins more", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "Calculate both sale prices!",
      explanation: "Today: 50 × 0.20 = 10 off → 40 coins. Next week: 50 × 0.30 = 15 off → 35 coins. Save 5 more by waiting!",
      calculation: "Today: 50-10=40. Next week: 50-15=35. Diff: 5",
    },
    {
      situation: "You buy a drink for 8 coins with a 50-coin note. The shop gives you 40 coins back. Is this correct?",
      options: [
        { text: "No! Should get 42 coins", answer: true, emoji: "🧾" },
        { text: "Yes, that's right", answer: false, emoji: "✅" },
      ],
      correct: 0,
      hint: "50 - 8 = ?",
      explanation: "50 - 8 = 42, not 40! Always check your change! The shop owes you 2 more coins.",
      calculation: "50 - 8 = 42 (not 40!)",
    },
  ],
  hard: [
    {
      situation: "You have 200 coins. Option A: Buy a toy now (150 coins). Option B: Save for 2 weeks (earn 40/week) and buy a better toy (250 coins). Which gives you more left over?",
      options: [
        { text: "A: 50 coins left now", answer: false, emoji: "🎮" },
        { text: "B: 30 coins left later", answer: true, emoji: "⏰" },
      ],
      correct: 1,
      hint: "Calculate total coins for option B!",
      explanation: "A: 200-150 = 50 left. B: 200 + (40×2) = 280, then 280-250 = 30 left. BUT you get a BETTER toy with B! Sometimes waiting is worth it.",
      calculation: "A: 200-150=50. B: 200+80-250=30 (but better item!)",
    },
    {
      situation: "You put 100 coins in a savings account that gives 10% bonus each month. After 2 months, how much do you have?",
      options: [
        { text: "120 coins", answer: false, emoji: "🏦" },
        { text: "121 coins", answer: true, emoji: "📈" },
      ],
      correct: 1,
      hint: "Month 1: 100 + 10%. Month 2: that amount + 10%",
      explanation: "Month 1: 100 + 10% = 110. Month 2: 110 + 10% = 121! This is compound interest - your bonus earns bonus!",
      calculation: "100 → 110 → 121 (compound growth!)",
    },
    {
      situation: "You're saving for 3 things: Bike (1000, need in 6 months), Game (200, want soon), Gift for mom (150, need in 2 months). You save 100/month. What should you prioritize?",
      options: [
        { text: "Gift for mom first (deadline!)", answer: true, emoji: "🎁" },
        { text: "Game first (want it now)", answer: false, emoji: "🎮" },
      ],
      correct: 0,
      hint: "Which has the closest deadline?",
      explanation: "Mom's gift is needed in 2 months (150 needed, you'll have 200). Prioritize by NEED, not WANT. You can get the game after!",
      calculation: "Month 2: 200 coins. Gift=150 ✓ Then game!",
    },
    {
      situation: "A subscription costs 30 coins/month or 300 coins/year. If you use it all year, which is better?",
      options: [
        { text: "Monthly (30 × 12 = 360/year)", answer: false, emoji: "📅" },
        { text: "Yearly (300, save 60!)", answer: true, emoji: "📆" },
      ],
      correct: 1,
      hint: "Calculate monthly cost for a full year",
      explanation: "Monthly: 30 × 12 = 360/year. Yearly: 300. Save 60 coins by paying yearly! Annual plans often have discounts.",
      calculation: "30×12=360 vs 300. Save 60!",
    },
    {
      situation: "You find a rare card that cost you 20 coins. Someone offers to buy it for 50 coins, or you can trade it for a card worth 75 coins (but you can't sell that one). What's the best profit move?",
      options: [
        { text: "Sell for 50 (30 profit in coins)", answer: true, emoji: "💰" },
        { text: "Trade for 75 value card", answer: false, emoji: "🔄" },
      ],
      correct: 0,
      hint: "Which gives you money you can use?",
      explanation: "Selling = 50 - 20 = 30 coins profit you can spend. Trading gives 75 in value BUT no coins. If you need coins, sell! If you want the card, trade.",
      calculation: "Cash profit: 50-20=30 coins (spendable!)",
    },
    {
      situation: "You can work 2 hours at 15 coins/hour OR 3 hours at 12 coins/hour. Which earns more?",
      options: [
        { text: "2 hours × 15 = 30 coins", answer: false, emoji: "⏱️" },
        { text: "3 hours × 12 = 36 coins", answer: true, emoji: "⏰" },
      ],
      correct: 1,
      hint: "Calculate total earnings for each option",
      explanation: "Option 1: 2 × 15 = 30 coins. Option 2: 3 × 12 = 36 coins. More hours can mean more money, even at lower rate!",
      calculation: "2×15=30 vs 3×12=36. 36 wins!",
    },
    {
      situation: "You want to give 20% of your earnings to charity. If you earned 85 coins, how much do you donate?",
      options: [
        { text: "17 coins", answer: true, emoji: "❤️" },
        { text: "20 coins", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "20% = 0.20 × amount",
      explanation: "85 × 0.20 = 17 coins to charity! Giving back is part of responsible money management.",
      calculation: "85 × 20% = 85 × 0.2 = 17",
    },
    {
      situation: "You borrowed 50 coins from a friend. You can pay back 50 coins now OR 55 coins next week. What's the 'interest' cost?",
      options: [
        { text: "5 coins (10% interest)", answer: true, emoji: "💳" },
        { text: "No cost, same thing", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "What's the difference between the two options?",
      explanation: "55 - 50 = 5 extra coins = 10% interest! Borrowing often costs extra. Pay back quickly to avoid interest!",
      calculation: "55-50=5 interest. 5/50=10%",
    },
    {
      situation: "Budget challenge! You have 500 coins for the month. Rent: 200, Food: 150, Fun: ?, Savings: at least 50. What's MAX you can spend on fun?",
      options: [
        { text: "100 coins max", answer: true, emoji: "🎉" },
        { text: "150 coins max", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "500 - 200 - 150 - 50 = ?",
      explanation: "Must-have: 200 + 150 + 50 = 400 coins. 500 - 400 = 100 max for fun! Budget = needs first, wants with what's left.",
      calculation: "500 - 200 - 150 - 50 = 100 max fun",
    },
    {
      situation: "Inflation! A snack cost 10 coins last year. This year it costs 12 coins. What's the inflation rate?",
      options: [
        { text: "20% inflation", answer: true, emoji: "📈" },
        { text: "2% inflation", answer: false, emoji: "🤔" },
      ],
      correct: 0,
      hint: "Increase ÷ Original × 100 = %",
      explanation: "Increase: 12 - 10 = 2 coins. Rate: 2 ÷ 10 = 0.20 = 20%! Prices going up means your coins buy less over time.",
      calculation: "(12-10)/10 = 2/10 = 20%",
    },
  ],
};

type Difficulty = "easy" | "medium" | "hard";

interface CoinQuestGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
}

// Coin Animation Component
function CoinStack({ count, isAnimating }: { count: number; isAnimating: boolean }) {
  return (
    <div className="flex justify-center items-end gap-1 my-4 h-20">
      {[...Array(Math.min(count, 10))].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -50, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            rotate: isAnimating ? [0, 10, -10, 0] : 0,
          }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="text-3xl"
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        >
          🪙
        </motion.div>
      ))}
      {count > 10 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-yellow-400 font-pixel text-sm ml-2"
        >
          +{count - 10}
        </motion.span>
      )}
    </div>
  );
}

// Difficulty Selector
function DifficultySelector({
  onSelect,
}: {
  onSelect: (difficulty: Difficulty) => void;
}) {
  const difficulties = [
    {
      id: "easy" as Difficulty,
      label: "COIN COUNTER",
      ages: "Ages 6-8",
      icon: "🪙",
      color: "from-[#FFD700] to-[#CC9900]",
      borderColor: "#FFD700",
      description: "Adding, subtracting, and basic money",
    },
    {
      id: "medium" as Difficulty,
      label: "MONEY MANAGER",
      ages: "Ages 9-11",
      icon: "💰",
      color: "from-[#4CAF50] to-[#2E7D32]",
      borderColor: "#4CAF50",
      description: "Percentages, discounts, and budgeting",
    },
    {
      id: "hard" as Difficulty,
      label: "FINANCE WIZARD",
      ages: "Ages 12+",
      icon: "📈",
      color: "from-[#2196F3] to-[#1565C0]",
      borderColor: "#2196F3",
      description: "Compound interest, budgets, and decisions",
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
          className="text-6xl mb-4 flex justify-center gap-1"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span>💰</span>
          <span>🪙</span>
          <span>💎</span>
        </motion.div>
        <h1 className="font-pixel text-[1.1em] text-white mb-2">COIN QUEST</h1>
        <p className="text-white/70 text-[1em]">Master money and make smart choices!</p>
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
              boxShadow: `0 0 20px ${diff.borderColor}40, inset 2px 2px 0 rgba(255,255,255,0.2), 4px 4px 0 rgba(0,0,0,0.4)`,
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
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Answer Option Button
function AnswerOption({
  option,
  index,
  onClick,
  state,
  disabled,
}: {
  option: { text: string; answer: boolean; emoji: string };
  index: number;
  onClick: () => void;
  state: "default" | "correct" | "incorrect";
  disabled: boolean;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={disabled ? {} : { scale: 1.03, x: 5 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full p-4 border-4 text-left transition-all flex items-center gap-3",
        state === "correct" &&
          "bg-gradient-to-r from-[#50FF7F] via-[#17D049] to-[#0C9430] border-[#085020] shadow-[0_0_20px_rgba(23,208,73,0.5)]",
        state === "incorrect" &&
          "bg-gradient-to-r from-[#FF6666] via-[#FF1A1A] to-[#AA0000] border-[#550000] shadow-[0_0_20px_rgba(255,26,26,0.5)]",
        state === "default" &&
          "bg-gradient-to-r from-[#4A3728] to-[#3A2A1A] border-[#5D4030] hover:border-[#FFD700]",
        disabled && state === "default" && "opacity-50"
      )}
      style={{
        boxShadow:
          state === "default"
            ? "inset 2px 2px 0 rgba(255,255,255,0.1), 3px 3px 0 rgba(0,0,0,0.4)"
            : undefined,
      }}
    >
      <span className="text-3xl">{option.emoji}</span>
      <span className="text-white text-[1em] flex-1">{option.text}</span>
      {state !== "default" && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-2xl"
        >
          {state === "correct" ? "✅" : "❌"}
        </motion.span>
      )}
    </motion.button>
  );
}

export function CoinQuestGame({
  onExit,
  onComplete,
  onCorrectAnswer,
  onWrongAnswer,
}: CoinQuestGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    calculation?: string;
  } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const questions = difficulty ? QUESTIONS[difficulty] : [];
  const currentQuestion = questions[questionIndex];

  const checkAnswer = useCallback(
    (answerIndex: number) => {
      if (selectedAnswer !== null) return;

      setSelectedAnswer(answerIndex);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);

      if (answerIndex === currentQuestion.correct) {
        setCorrect((c) => c + 1);
        setFeedback({
          type: "success",
          message: currentQuestion.explanation,
          calculation: currentQuestion.calculation,
        });
        onCorrectAnswer();

        setTimeout(() => {
          if (questionIndex < questions.length - 1) {
            setQuestionIndex((i) => i + 1);
            setShowHint(false);
            setFeedback(null);
            setSelectedAnswer(null);
          } else {
            onComplete(correct + 1, mistakes);
          }
        }, 3000);
      } else {
        setMistakes((m) => m + 1);
        setFeedback({
          type: "error",
          message: "Let's think about this more carefully...",
        });
        onWrongAnswer();
      }
    },
    [currentQuestion, questionIndex, correct, mistakes, questions.length, onComplete, onCorrectAnswer, onWrongAnswer, selectedAnswer]
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
          boxShadow: "inset 4px 4px 0 rgba(255,255,255,0.15), inset -4px -4px 0 rgba(0,0,0,0.4), 8px 8px 0 rgba(0,0,0,0.5)",
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
    easy: { name: "COIN COUNTER", icon: "🪙" },
    medium: { name: "MONEY MANAGER", icon: "💰" },
    hard: { name: "FINANCE WIZARD", icon: "📈" },
  };

  return (
    <GameContainer
      title={`COIN QUEST: ${difficultyLabels[difficulty].name}`}
      icon="💰"
      currentQuestion={questionIndex}
      totalQuestions={questions.length}
      onExit={onExit}
    >
      {/* Coin Animation */}
      <CoinStack count={correct * 3 + 5} isAnimating={isAnimating} />

      {/* Question Card */}
      <QuestionCard
        questionNumber={questionIndex + 1}
        totalQuestions={questions.length}
        label="MONEY PUZZLE"
      >
        <div className="text-[1em] leading-relaxed">
          {currentQuestion.situation}
        </div>
      </QuestionCard>

      {/* Learning Box */}
      <LearningBox title="💡 MONEY TIP:">
        <div className="text-[0.85em] text-center">
          Think step by step. Write down the numbers if it helps!
        </div>
      </LearningBox>

      {/* Answer Options */}
      <div className="space-y-3 my-4">
        {currentQuestion.options.map((option, index) => (
          <AnswerOption
            key={index}
            option={option}
            index={index}
            onClick={() => checkAnswer(index)}
            state={getOptionState(index)}
            disabled={selectedAnswer !== null}
          />
        ))}
      </div>

      {/* Hint */}
      {!showHint && selectedAnswer === null && (
        <div className="text-center">
          <Button variant="gold" onClick={() => setShowHint(true)}>
            💡 NEED A HINT?
          </Button>
        </div>
      )}

      <HintBox hint={currentQuestion.hint} visible={showHint && selectedAnswer === null} />

      {/* Feedback with calculation */}
      {feedback && (
        <Feedback
          type={feedback.type}
          title={feedback.type === "success" ? "🪙 CORRECT!" : "🤔 TRY AGAIN!"}
          message={
            feedback.calculation
              ? `${feedback.calculation}\n\n${feedback.message}`
              : feedback.message
          }
          visible={true}
        />
      )}
    </GameContainer>
  );
}
