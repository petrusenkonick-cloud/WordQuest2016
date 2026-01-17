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

interface BudgetBuilderGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
}

type Difficulty = "easy" | "medium" | "hard";

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  minPercent?: number;
  maxPercent?: number;
  recommended?: number;
}

interface Question {
  scenario: string;
  totalBudget: number;
  currency: string;
  categories: BudgetCategory[];
  constraints: string[];
  successCriteria: (allocations: Record<string, number>) => boolean;
  hint: string;
  explanation: string;
}

// EASY questions (ages 6-8) - simple 2-3 category splits
const EASY_QUESTIONS: Question[] = [
  {
    scenario: "You got 100 coins for your birthday! Split them wisely.",
    totalBudget: 100,
    currency: "coins",
    categories: [
      { id: "spend", name: "Spend Now", icon: "🎮", color: "#ef4444", recommended: 50 },
      { id: "save", name: "Save", icon: "🏦", color: "#22c55e", minPercent: 30, recommended: 50 },
    ],
    constraints: ["Save at least 30 coins"],
    successCriteria: (a) => a.save >= 30,
    hint: "Saving money helps you buy bigger things later!",
    explanation: "Saving at least 30% of money you receive is a great habit. The rest you can enjoy spending!",
  },
  {
    scenario: "You have 50 coins for the school fair. Plan your spending!",
    totalBudget: 50,
    currency: "coins",
    categories: [
      { id: "games", name: "Games", icon: "🎯", color: "#3b82f6", recommended: 20 },
      { id: "food", name: "Food", icon: "🍿", color: "#f59e0b", recommended: 20 },
      { id: "save", name: "Keep for later", icon: "💰", color: "#22c55e", minPercent: 10, recommended: 10 },
    ],
    constraints: ["Keep at least 5 coins for later"],
    successCriteria: (a) => a.save >= 5,
    hint: "It's smart to keep some coins just in case!",
    explanation: "Always keep a little money saved, even when having fun. You never know when you might need it!",
  },
  {
    scenario: "Mom gave you 80 coins. You want to buy a toy that costs 40 coins.",
    totalBudget: 80,
    currency: "coins",
    categories: [
      { id: "toy", name: "Toy", icon: "🧸", color: "#ec4899", recommended: 40 },
      { id: "snacks", name: "Snacks", icon: "🍭", color: "#f59e0b", maxPercent: 25, recommended: 15 },
      { id: "save", name: "Save", icon: "🐷", color: "#22c55e", recommended: 25 },
    ],
    constraints: ["Don't spend more than 20 coins on snacks"],
    successCriteria: (a) => a.snacks <= 20,
    hint: "Snacks are yummy but don't last long!",
    explanation: "Spending too much on snacks means less money for things that last longer, like toys or savings!",
  },
  {
    scenario: "You earned 60 coins doing chores! What will you do with them?",
    totalBudget: 60,
    currency: "coins",
    categories: [
      { id: "fun", name: "Fun", icon: "🎪", color: "#8b5cf6", recommended: 30 },
      { id: "gift", name: "Gift for friend", icon: "🎁", color: "#ec4899", recommended: 15 },
      { id: "save", name: "Save", icon: "💰", color: "#22c55e", minPercent: 25, recommended: 15 },
    ],
    constraints: ["Save at least 15 coins"],
    successCriteria: (a) => a.save >= 15,
    hint: "Giving gifts makes friends happy, but save some too!",
    explanation: "It's nice to share with friends! But always save some money first before giving gifts.",
  },
  {
    scenario: "Grandma gave you 100 coins! Plan wisely.",
    totalBudget: 100,
    currency: "coins",
    categories: [
      { id: "spend", name: "Spend", icon: "🛒", color: "#3b82f6", maxPercent: 50, recommended: 40 },
      { id: "save", name: "Save", icon: "🏦", color: "#22c55e", minPercent: 40, recommended: 50 },
      { id: "give", name: "Charity", icon: "❤️", color: "#ef4444", recommended: 10 },
    ],
    constraints: ["Save at least 40 coins", "Don't spend more than 50 coins"],
    successCriteria: (a) => a.save >= 40 && a.spend <= 50,
    hint: "A good rule: Save first, then spend what's left!",
    explanation: "The 50/40/10 rule: Save 40-50%, Spend 40-50%, Give 10%. This helps money grow!",
  },
  {
    scenario: "You have 40 coins and want ice cream (15 coins) and a book (20 coins).",
    totalBudget: 40,
    currency: "coins",
    categories: [
      { id: "icecream", name: "Ice Cream", icon: "🍦", color: "#ec4899", recommended: 15 },
      { id: "book", name: "Book", icon: "📚", color: "#3b82f6", recommended: 20 },
      { id: "save", name: "Save", icon: "💰", color: "#22c55e", recommended: 5 },
    ],
    constraints: ["You need exactly 15 for ice cream and 20 for the book"],
    successCriteria: (a) => a.icecream === 15 && a.book === 20,
    hint: "Add up what you need: 15 + 20 = ?",
    explanation: "15 + 20 = 35 coins needed. You have 40, so you can buy both and save 5 coins!",
  },
  {
    scenario: "Weekly allowance of 70 coins. Make it last!",
    totalBudget: 70,
    currency: "coins",
    categories: [
      { id: "mon_tue", name: "Mon-Tue", icon: "📅", color: "#3b82f6", recommended: 20 },
      { id: "wed_thu", name: "Wed-Thu", icon: "📅", color: "#22c55e", recommended: 20 },
      { id: "fri_sat_sun", name: "Fri-Sun", icon: "📅", color: "#f59e0b", recommended: 30 },
    ],
    constraints: ["Make sure weekends have more (fun days!)"],
    successCriteria: (a) => a.fri_sat_sun >= a.mon_tue && a.fri_sat_sun >= a.wed_thu,
    hint: "Weekends have more days for fun!",
    explanation: "Planning when to spend helps money last. Weekends often need more for activities!",
  },
  {
    scenario: "You found 30 coins! Quick, what do you do?",
    totalBudget: 30,
    currency: "coins",
    categories: [
      { id: "treat", name: "Treat yourself", icon: "🎉", color: "#8b5cf6", maxPercent: 50, recommended: 10 },
      { id: "save", name: "Save most", icon: "🐷", color: "#22c55e", minPercent: 50, recommended: 20 },
    ],
    constraints: ["Save at least half (15 coins)"],
    successCriteria: (a) => a.save >= 15,
    hint: "Unexpected money is great for savings!",
    explanation: "When you find or receive unexpected money, save at least half. It's a bonus!",
  },
  {
    scenario: "Party planning with 90 coins budget.",
    totalBudget: 90,
    currency: "coins",
    categories: [
      { id: "cake", name: "Cake", icon: "🎂", color: "#ec4899", recommended: 30 },
      { id: "decorations", name: "Decorations", icon: "🎈", color: "#3b82f6", recommended: 25 },
      { id: "games", name: "Games & Prizes", icon: "🎁", color: "#22c55e", recommended: 35 },
    ],
    constraints: ["Spend something on each category"],
    successCriteria: (a) => a.cake > 0 && a.decorations > 0 && a.games > 0,
    hint: "A good party needs a bit of everything!",
    explanation: "For events, spread your budget across all important areas. Don't forget any!",
  },
  {
    scenario: "You want to save for a game that costs 200 coins. You have 50 coins now.",
    totalBudget: 50,
    currency: "coins",
    categories: [
      { id: "game_fund", name: "Game Fund", icon: "🎮", color: "#8b5cf6", minPercent: 60, recommended: 35 },
      { id: "spend_now", name: "Spend Now", icon: "🍬", color: "#f59e0b", maxPercent: 40, recommended: 15 },
    ],
    constraints: ["Put at least 30 coins toward the game"],
    successCriteria: (a) => a.game_fund >= 30,
    hint: "To reach big goals, save most of what you get!",
    explanation: "Saving for big purchases takes time. Put most of your money toward the goal!",
  },
];

// MEDIUM questions (ages 9-11) - 4 categories, percentages
const MEDIUM_QUESTIONS: Question[] = [
  {
    scenario: "Monthly allowance of 200 coins. Plan your month!",
    totalBudget: 200,
    currency: "coins",
    categories: [
      { id: "savings", name: "Savings", icon: "🏦", color: "#22c55e", minPercent: 20, recommended: 50 },
      { id: "education", name: "Books/Supplies", icon: "📚", color: "#3b82f6", recommended: 40 },
      { id: "fun", name: "Fun", icon: "🎮", color: "#8b5cf6", maxPercent: 30, recommended: 60 },
      { id: "sharing", name: "Sharing/Gifts", icon: "❤️", color: "#ef4444", recommended: 50 },
    ],
    constraints: ["Save at least 20%", "Fun no more than 30%"],
    successCriteria: (a) => a.savings >= 40 && a.fun <= 60,
    hint: "20% of 200 is 40 coins. 30% is 60 coins.",
    explanation: "Using percentages helps no matter how much money you have. 20% savings is a great start!",
  },
  {
    scenario: "You're selling lemonade! Budget 150 coins for your stand.",
    totalBudget: 150,
    currency: "coins",
    categories: [
      { id: "supplies", name: "Lemons & Sugar", icon: "🍋", color: "#fbbf24", recommended: 60 },
      { id: "cups", name: "Cups", icon: "🥤", color: "#3b82f6", recommended: 30 },
      { id: "sign", name: "Sign & Table", icon: "🪧", color: "#22c55e", recommended: 40 },
      { id: "emergency", name: "Emergency Fund", icon: "💰", color: "#ef4444", minPercent: 10, recommended: 20 },
    ],
    constraints: ["Keep at least 10% for emergencies"],
    successCriteria: (a) => a.emergency >= 15,
    hint: "What if you run out of supplies mid-day?",
    explanation: "Businesses keep emergency funds for unexpected costs. Always have backup money!",
  },
  {
    scenario: "Summer vacation savings: You have 500 coins for a 2-week trip.",
    totalBudget: 500,
    currency: "coins",
    categories: [
      { id: "transport", name: "Transport", icon: "🚌", color: "#3b82f6", recommended: 100 },
      { id: "food", name: "Food", icon: "🍽️", color: "#f59e0b", recommended: 150 },
      { id: "activities", name: "Activities", icon: "🎢", color: "#8b5cf6", recommended: 150 },
      { id: "souvenirs", name: "Souvenirs", icon: "🎁", color: "#ec4899", maxPercent: 15, recommended: 50 },
      { id: "emergency", name: "Emergency", icon: "🆘", color: "#ef4444", minPercent: 10, recommended: 50 },
    ],
    constraints: ["Souvenirs max 15%", "Emergency at least 10%"],
    successCriteria: (a) => a.souvenirs <= 75 && a.emergency >= 50,
    hint: "Souvenirs are nice but memories are free!",
    explanation: "On trips, experiences matter more than things. Keep emergency money for unexpected situations!",
  },
  {
    scenario: "School year budget: 300 coins for supplies and activities.",
    totalBudget: 300,
    currency: "coins",
    categories: [
      { id: "supplies", name: "School Supplies", icon: "✏️", color: "#3b82f6", minPercent: 30, recommended: 100 },
      { id: "books", name: "Extra Books", icon: "📖", color: "#22c55e", recommended: 60 },
      { id: "clubs", name: "Clubs/Sports", icon: "⚽", color: "#f59e0b", recommended: 80 },
      { id: "savings", name: "Savings", icon: "💰", color: "#8b5cf6", minPercent: 15, recommended: 60 },
    ],
    constraints: ["Supplies need at least 30%", "Save at least 15%"],
    successCriteria: (a) => a.supplies >= 90 && a.savings >= 45,
    hint: "Education comes first, then activities!",
    explanation: "Prioritize needs (supplies) over wants (extras). Still save for future needs!",
  },
  {
    scenario: "Birthday party for 10 friends. Budget: 250 coins.",
    totalBudget: 250,
    currency: "coins",
    categories: [
      { id: "food", name: "Food & Cake", icon: "🎂", color: "#ec4899", recommended: 100 },
      { id: "decorations", name: "Decorations", icon: "🎈", color: "#3b82f6", maxPercent: 20, recommended: 40 },
      { id: "activities", name: "Games & Activities", icon: "🎯", color: "#22c55e", recommended: 60 },
      { id: "favors", name: "Party Favors", icon: "🎁", color: "#f59e0b", recommended: 50 },
    ],
    constraints: ["Decorations max 20%", "Party favors need 5 coins per friend (50 total)"],
    successCriteria: (a) => a.decorations <= 50 && a.favors >= 50,
    hint: "10 friends × 5 coins = 50 coins for favors",
    explanation: "Calculate per-person costs and set limits on less important items like decorations!",
  },
  {
    scenario: "You earn 100 coins/week. Plan for a 400 coin bike in 1 month.",
    totalBudget: 100,
    currency: "coins",
    categories: [
      { id: "bike_fund", name: "Bike Fund", icon: "🚲", color: "#22c55e", minPercent: 70, recommended: 75 },
      { id: "weekly_fun", name: "Weekly Fun", icon: "🎮", color: "#8b5cf6", maxPercent: 20, recommended: 15 },
      { id: "emergency", name: "Emergency", icon: "💰", color: "#f59e0b", recommended: 10 },
    ],
    constraints: ["Bike fund needs at least 70%", "Fun max 20%"],
    successCriteria: (a) => a.bike_fund >= 70 && a.weekly_fun <= 20,
    hint: "4 weeks × 70+ coins = 280+ coins (more with interest!)",
    explanation: "To reach big goals, you need to save most of your income. Small sacrifices now = big rewards later!",
  },
  {
    scenario: "Charity fundraiser: Raised 400 coins. How to use them?",
    totalBudget: 400,
    currency: "coins",
    categories: [
      { id: "cause", name: "Main Cause", icon: "❤️", color: "#ef4444", minPercent: 70, recommended: 300 },
      { id: "admin", name: "Admin Costs", icon: "📋", color: "#78716c", maxPercent: 10, recommended: 30 },
      { id: "awareness", name: "Awareness", icon: "📢", color: "#3b82f6", recommended: 40 },
      { id: "future", name: "Future Fund", icon: "🌱", color: "#22c55e", recommended: 30 },
    ],
    constraints: ["Main cause gets at least 70%", "Admin costs max 10%"],
    successCriteria: (a) => a.cause >= 280 && a.admin <= 40,
    hint: "People donated for the cause, not admin!",
    explanation: "Charities should spend most money on their mission. Low admin costs = efficient charity!",
  },
  {
    scenario: "Pet care monthly budget: 180 coins for your dog.",
    totalBudget: 180,
    currency: "coins",
    categories: [
      { id: "food", name: "Food", icon: "🦴", color: "#f59e0b", minPercent: 40, recommended: 80 },
      { id: "health", name: "Health/Vet", icon: "💊", color: "#ef4444", minPercent: 20, recommended: 40 },
      { id: "toys", name: "Toys/Treats", icon: "🧸", color: "#8b5cf6", maxPercent: 20, recommended: 30 },
      { id: "grooming", name: "Grooming", icon: "🛁", color: "#3b82f6", recommended: 30 },
    ],
    constraints: ["Food at least 40%", "Health at least 20%", "Toys max 20%"],
    successCriteria: (a) => a.food >= 72 && a.health >= 36 && a.toys <= 36,
    hint: "Needs (food, health) before wants (toys)!",
    explanation: "Pets depend on us for their needs. Budget for essentials first, then extras!",
  },
  {
    scenario: "You won 350 coins in a competition! What now?",
    totalBudget: 350,
    currency: "coins",
    categories: [
      { id: "long_term", name: "Long-term Savings", icon: "🏦", color: "#22c55e", minPercent: 40, recommended: 150 },
      { id: "celebration", name: "Celebrate!", icon: "🎉", color: "#ec4899", maxPercent: 25, recommended: 70 },
      { id: "reinvest", name: "Learn More", icon: "📚", color: "#3b82f6", recommended: 80 },
      { id: "share", name: "Share with Family", icon: "👨‍👩‍👧", color: "#f59e0b", recommended: 50 },
    ],
    constraints: ["Save at least 40%", "Celebration max 25%"],
    successCriteria: (a) => a.long_term >= 140 && a.celebration <= 87.5,
    hint: "Windfalls are great for building savings!",
    explanation: "Unexpected money should mostly be saved or invested. Celebrate a little, but grow your wealth!",
  },
  {
    scenario: "Tech fund: 500 coins for new gadgets.",
    totalBudget: 500,
    currency: "coins",
    categories: [
      { id: "main_device", name: "Main Device", icon: "📱", color: "#3b82f6", minPercent: 50, recommended: 300 },
      { id: "accessories", name: "Accessories", icon: "🎧", color: "#8b5cf6", maxPercent: 20, recommended: 80 },
      { id: "protection", name: "Case/Protection", icon: "🛡️", color: "#22c55e", recommended: 60 },
      { id: "apps", name: "Apps/Games", icon: "🎮", color: "#f59e0b", maxPercent: 15, recommended: 60 },
    ],
    constraints: ["Main device at least 50%", "Accessories max 20%", "Apps max 15%"],
    successCriteria: (a) => a.main_device >= 250 && a.accessories <= 100 && a.apps <= 75,
    hint: "Get quality for the main item, save on extras!",
    explanation: "Invest in quality for important items. Accessories and apps can wait or be found cheaper!",
  },
];

// HARD questions (ages 12+) - complex scenarios with multiple constraints
const HARD_QUESTIONS: Question[] = [
  {
    scenario: "Startup budget: 1000 coins to launch your app idea.",
    totalBudget: 1000,
    currency: "coins",
    categories: [
      { id: "development", name: "Development", icon: "💻", color: "#3b82f6", minPercent: 30, recommended: 350 },
      { id: "marketing", name: "Marketing", icon: "📢", color: "#8b5cf6", recommended: 200 },
      { id: "operations", name: "Operations", icon: "⚙️", color: "#f59e0b", maxPercent: 15, recommended: 150 },
      { id: "reserve", name: "Reserve Fund", icon: "💰", color: "#22c55e", minPercent: 20, recommended: 200 },
      { id: "legal", name: "Legal/Admin", icon: "📋", color: "#78716c", recommended: 100 },
    ],
    constraints: ["Development at least 30%", "Operations max 15%", "Reserve at least 20%"],
    successCriteria: (a) => a.development >= 300 && a.operations <= 150 && a.reserve >= 200,
    hint: "A startup needs to build AND survive!",
    explanation: "Startups need working capital (reserve) to survive. Development is core, but don't overspend on operations!",
  },
  {
    scenario: "College savings: 800 coins monthly to prepare for university.",
    totalBudget: 800,
    currency: "coins",
    categories: [
      { id: "tuition", name: "Tuition Fund", icon: "🎓", color: "#3b82f6", minPercent: 40, recommended: 350 },
      { id: "books", name: "Books Fund", icon: "📚", color: "#22c55e", minPercent: 10, recommended: 100 },
      { id: "living", name: "Living Expenses", icon: "🏠", color: "#f59e0b", recommended: 200 },
      { id: "emergency", name: "Emergency", icon: "🆘", color: "#ef4444", minPercent: 10, recommended: 100 },
      { id: "personal", name: "Personal", icon: "🎮", color: "#8b5cf6", maxPercent: 10, recommended: 50 },
    ],
    constraints: ["Tuition at least 40%", "Books at least 10%", "Emergency at least 10%", "Personal max 10%"],
    successCriteria: (a) => a.tuition >= 320 && a.books >= 80 && a.emergency >= 80 && a.personal <= 80,
    hint: "Education is an investment in yourself!",
    explanation: "Future planning requires discipline. Prioritize education costs and always have emergency funds!",
  },
  {
    scenario: "Household budget: 2000 coins monthly for a family of 4.",
    totalBudget: 2000,
    currency: "coins",
    categories: [
      { id: "housing", name: "Housing", icon: "🏠", color: "#3b82f6", minPercent: 25, maxPercent: 35, recommended: 600 },
      { id: "food", name: "Food", icon: "🍽️", color: "#22c55e", minPercent: 15, recommended: 400 },
      { id: "utilities", name: "Utilities", icon: "💡", color: "#f59e0b", recommended: 200 },
      { id: "transport", name: "Transport", icon: "🚗", color: "#8b5cf6", maxPercent: 15, recommended: 250 },
      { id: "savings", name: "Savings", icon: "💰", color: "#22c55e", minPercent: 15, recommended: 350 },
      { id: "other", name: "Other", icon: "📦", color: "#78716c", recommended: 200 },
    ],
    constraints: ["Housing 25-35%", "Food at least 15%", "Transport max 15%", "Savings at least 15%"],
    successCriteria: (a) => a.housing >= 500 && a.housing <= 700 && a.food >= 300 && a.transport <= 300 && a.savings >= 300,
    hint: "The 50/30/20 rule: Needs 50%, Wants 30%, Savings 20%",
    explanation: "Household budgeting balances needs, wants, and future security. Housing shouldn't exceed 35% of income!",
  },
  {
    scenario: "Investment portfolio: 5000 coins to invest for 5 years.",
    totalBudget: 5000,
    currency: "coins",
    categories: [
      { id: "stocks", name: "Stocks (Higher Risk)", icon: "📈", color: "#ef4444", maxPercent: 40, recommended: 1500 },
      { id: "bonds", name: "Bonds (Lower Risk)", icon: "📊", color: "#3b82f6", minPercent: 20, recommended: 1500 },
      { id: "savings", name: "High-Yield Savings", icon: "🏦", color: "#22c55e", minPercent: 20, recommended: 1000 },
      { id: "learning", name: "Financial Education", icon: "📚", color: "#8b5cf6", recommended: 500 },
      { id: "emergency", name: "Emergency Cash", icon: "💵", color: "#f59e0b", minPercent: 10, recommended: 500 },
    ],
    constraints: ["Stocks max 40%", "Bonds at least 20%", "Savings at least 20%", "Emergency at least 10%"],
    successCriteria: (a) => a.stocks <= 2000 && a.bonds >= 1000 && a.savings >= 1000 && a.emergency >= 500,
    hint: "Don't put all eggs in one basket!",
    explanation: "Diversification reduces risk. Balance growth (stocks) with stability (bonds, savings). Always keep emergency funds liquid!",
  },
  {
    scenario: "Wedding budget: 3000 coins for your celebration.",
    totalBudget: 3000,
    currency: "coins",
    categories: [
      { id: "venue", name: "Venue & Food", icon: "🏰", color: "#ec4899", minPercent: 40, recommended: 1400 },
      { id: "attire", name: "Attire & Beauty", icon: "👗", color: "#8b5cf6", maxPercent: 15, recommended: 400 },
      { id: "photography", name: "Photography", icon: "📸", color: "#3b82f6", recommended: 400 },
      { id: "decor", name: "Decorations", icon: "💐", color: "#22c55e", maxPercent: 15, recommended: 350 },
      { id: "music", name: "Entertainment", icon: "🎵", color: "#f59e0b", recommended: 300 },
      { id: "buffer", name: "Buffer/Tips", icon: "💰", color: "#78716c", minPercent: 5, recommended: 150 },
    ],
    constraints: ["Venue at least 40%", "Attire max 15%", "Decor max 15%", "Buffer at least 5%"],
    successCriteria: (a) => a.venue >= 1200 && a.attire <= 450 && a.decor <= 450 && a.buffer >= 150,
    hint: "Guests remember food and fun, not decorations!",
    explanation: "Focus on guest experience (venue, food, entertainment). Decorations and attire matter less for memories!",
  },
  {
    scenario: "Small business: 1500 coins monthly operating budget.",
    totalBudget: 1500,
    currency: "coins",
    categories: [
      { id: "inventory", name: "Inventory", icon: "📦", color: "#3b82f6", minPercent: 30, recommended: 500 },
      { id: "rent", name: "Rent", icon: "🏪", color: "#f59e0b", maxPercent: 25, recommended: 350 },
      { id: "salary", name: "Salary (You)", icon: "💵", color: "#22c55e", recommended: 300 },
      { id: "marketing", name: "Marketing", icon: "📢", color: "#8b5cf6", minPercent: 10, recommended: 200 },
      { id: "reserve", name: "Reserve", icon: "💰", color: "#ef4444", minPercent: 10, recommended: 150 },
    ],
    constraints: ["Inventory at least 30%", "Rent max 25%", "Marketing at least 10%", "Reserve at least 10%"],
    successCriteria: (a) => a.inventory >= 450 && a.rent <= 375 && a.marketing >= 150 && a.reserve >= 150,
    hint: "Can't sell what you don't have!",
    explanation: "Product-based businesses need inventory. Keep rent low, invest in marketing to grow, and maintain reserves!",
  },
  {
    scenario: "Retirement planning: 600 coins monthly from age 25.",
    totalBudget: 600,
    currency: "coins",
    categories: [
      { id: "retirement", name: "Retirement Fund", icon: "🏖️", color: "#22c55e", minPercent: 50, recommended: 320 },
      { id: "investment", name: "Growth Investments", icon: "📈", color: "#3b82f6", recommended: 120 },
      { id: "insurance", name: "Insurance", icon: "🛡️", color: "#f59e0b", minPercent: 10, recommended: 80 },
      { id: "shortterm", name: "Short-term Goals", icon: "🎯", color: "#8b5cf6", maxPercent: 15, recommended: 80 },
    ],
    constraints: ["Retirement at least 50%", "Insurance at least 10%", "Short-term max 15%"],
    successCriteria: (a) => a.retirement >= 300 && a.insurance >= 60 && a.shortterm <= 90,
    hint: "Time is your greatest asset at 25!",
    explanation: "Starting early with 50%+ to retirement lets compound interest work magic. Insurance protects your future!",
  },
  {
    scenario: "Emergency fund building: 400 coins monthly to build safety net.",
    totalBudget: 400,
    currency: "coins",
    categories: [
      { id: "emergency", name: "Emergency Savings", icon: "🆘", color: "#ef4444", minPercent: 60, recommended: 260 },
      { id: "insurance", name: "Insurance", icon: "🛡️", color: "#3b82f6", minPercent: 15, recommended: 70 },
      { id: "health", name: "Health Fund", icon: "💊", color: "#22c55e", recommended: 40 },
      { id: "flexible", name: "Flexible Use", icon: "🔄", color: "#78716c", maxPercent: 10, recommended: 30 },
    ],
    constraints: ["Emergency at least 60%", "Insurance at least 15%", "Flexible max 10%"],
    successCriteria: (a) => a.emergency >= 240 && a.insurance >= 60 && a.flexible <= 40,
    hint: "Goal: 3-6 months of expenses saved!",
    explanation: "Emergency funds should be prioritized until you have 3-6 months of living expenses saved. This protects against job loss or unexpected costs!",
  },
  {
    scenario: "Content creator budget: 700 coins monthly for your channel.",
    totalBudget: 700,
    currency: "coins",
    categories: [
      { id: "equipment", name: "Equipment", icon: "🎥", color: "#3b82f6", recommended: 200 },
      { id: "software", name: "Software/Tools", icon: "💻", color: "#8b5cf6", maxPercent: 20, recommended: 100 },
      { id: "content", name: "Content Creation", icon: "🎬", color: "#22c55e", minPercent: 25, recommended: 200 },
      { id: "promotion", name: "Promotion", icon: "📢", color: "#f59e0b", minPercent: 15, recommended: 120 },
      { id: "reinvest", name: "Reinvest/Save", icon: "💰", color: "#ef4444", minPercent: 10, recommended: 80 },
    ],
    constraints: ["Software max 20%", "Content at least 25%", "Promotion at least 15%", "Reinvest at least 10%"],
    successCriteria: (a) => a.software <= 140 && a.content >= 175 && a.promotion >= 105 && a.reinvest >= 70,
    hint: "Content is king, but promotion helps people find it!",
    explanation: "Balance quality content creation with promotion to grow your audience. Always reinvest some profits!",
  },
  {
    scenario: "Gap year travel: 4000 coins for 6 months across 3 countries.",
    totalBudget: 4000,
    currency: "coins",
    categories: [
      { id: "transport", name: "Flights/Transport", icon: "✈️", color: "#3b82f6", minPercent: 20, maxPercent: 30, recommended: 1000 },
      { id: "accommodation", name: "Accommodation", icon: "🏨", color: "#f59e0b", minPercent: 25, recommended: 1100 },
      { id: "food", name: "Food", icon: "🍜", color: "#22c55e", minPercent: 20, recommended: 900 },
      { id: "activities", name: "Activities", icon: "🎭", color: "#8b5cf6", maxPercent: 15, recommended: 500 },
      { id: "emergency", name: "Emergency", icon: "🆘", color: "#ef4444", minPercent: 10, recommended: 500 },
    ],
    constraints: ["Transport 20-30%", "Accommodation at least 25%", "Food at least 20%", "Activities max 15%", "Emergency at least 10%"],
    successCriteria: (a) => a.transport >= 800 && a.transport <= 1200 && a.accommodation >= 1000 && a.food >= 800 && a.activities <= 600 && a.emergency >= 400,
    hint: "Plan for needs first, experiences second!",
    explanation: "Long-term travel requires careful planning. Prioritize safety (accommodation, emergency) over activities. You can find free experiences!",
  },
];

const QUESTIONS: Record<Difficulty, Question[]> = {
  easy: EASY_QUESTIONS,
  medium: MEDIUM_QUESTIONS,
  hard: HARD_QUESTIONS,
};

const DIFFICULTY_CONFIG = {
  easy: { label: "SAVER", age: "6-8", color: "#4ade80" },
  medium: { label: "PLANNER", age: "9-11", color: "#fbbf24" },
  hard: { label: "MASTER", age: "12+", color: "#f87171" },
};

// Piggy bank component
function PiggyBank({ fillPercent }: { fillPercent: number }) {
  return (
    <motion.div className="relative w-16 h-16">
      <svg viewBox="0 0 64 64" fill="none">
        {/* Piggy body */}
        <ellipse cx="32" cy="36" rx="22" ry="18" fill="#ec4899" />
        {/* Piggy head */}
        <circle cx="48" cy="30" r="10" fill="#ec4899" />
        {/* Snout */}
        <ellipse cx="54" cy="32" rx="5" ry="4" fill="#f9a8d4" />
        {/* Nostrils */}
        <circle cx="52" cy="31" r="1" fill="#be185d" />
        <circle cx="56" cy="31" r="1" fill="#be185d" />
        {/* Eye */}
        <circle cx="46" cy="27" r="2" fill="#1f2937" />
        {/* Ears */}
        <ellipse cx="44" cy="20" rx="4" ry="5" fill="#ec4899" />
        <ellipse cx="52" cy="22" rx="3" ry="4" fill="#ec4899" />
        {/* Legs */}
        <rect x="18" y="48" width="6" height="8" rx="2" fill="#be185d" />
        <rect x="28" y="48" width="6" height="8" rx="2" fill="#be185d" />
        <rect x="38" y="48" width="6" height="8" rx="2" fill="#be185d" />
        {/* Tail */}
        <path d="M10 36 Q6 30 10 28" stroke="#be185d" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Coin slot */}
        <rect x="28" y="22" width="8" height="3" rx="1" fill="#1f2937" />
        {/* Fill indicator */}
        <motion.rect
          x="14"
          y={54 - fillPercent * 0.3}
          width="36"
          height={fillPercent * 0.3}
          fill="#fbbf24"
          initial={{ height: 0 }}
          animate={{ height: fillPercent * 0.3 }}
        />
      </svg>
    </motion.div>
  );
}

// Budget slider component
function BudgetSlider({
  category,
  value,
  maxValue,
  onChange,
  disabled,
}: {
  category: BudgetCategory;
  value: number;
  maxValue: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  const percent = (value / maxValue) * 100;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.icon}</span>
          <span className="text-amber-100 font-medium text-sm">{category.name}</span>
        </div>
        <span className="text-amber-200 font-bold">{value} ({percent.toFixed(0)}%)</span>
      </div>
      <div className="relative">
        <div
          className="w-full h-4 rounded-full overflow-hidden"
          style={{ background: "#44403c" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: category.color }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={maxValue}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
      {(category.minPercent || category.maxPercent) && (
        <div className="text-xs text-amber-200/60 mt-1">
          {category.minPercent && `Min: ${category.minPercent}%`}
          {category.minPercent && category.maxPercent && " | "}
          {category.maxPercent && `Max: ${category.maxPercent}%`}
        </div>
      )}
    </div>
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
          <PiggyBank fillPercent={70} />
          <div>
            <h2 className="text-3xl font-bold text-amber-100 drop-shadow-lg">
              📊 BUDGET BUILDER
            </h2>
            <p className="text-amber-200/80 text-sm">Learn to manage money!</p>
          </div>
        </div>

        <p className="text-amber-100 text-center mb-4">
          Choose your financial level:
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

export function BudgetBuilderGame({ onExit, onComplete, onCorrectAnswer, onWrongAnswer }: BudgetBuilderGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, mistakes: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize allocations when question changes
  const initAllocations = useCallback((question: Question) => {
    const initial: Record<string, number> = {};
    const perCategory = Math.floor(question.totalBudget / question.categories.length);
    question.categories.forEach((cat) => {
      initial[cat.id] = cat.recommended || perCategory;
    });
    setAllocations(initial);
  }, []);

  if (!difficulty) {
    return <DifficultySelector onSelect={(d) => {
      setDifficulty(d);
      initAllocations(QUESTIONS[d][0]);
    }} onExit={onExit} />;
  }

  const questions = QUESTIONS[difficulty];
  const currentQuestion = questions[currentIndex];
  const config = DIFFICULTY_CONFIG[difficulty];

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const remaining = currentQuestion.totalBudget - totalAllocated;

  const handleAllocationChange = (categoryId: string, newValue: number) => {
    const other = Object.entries(allocations)
      .filter(([id]) => id !== categoryId)
      .reduce((sum, [, val]) => sum + val, 0);

    const maxForThis = currentQuestion.totalBudget - other;
    const clampedValue = Math.min(Math.max(0, newValue), maxForThis);

    setAllocations((prev) => ({
      ...prev,
      [categoryId]: clampedValue,
    }));
  };

  const checkBudget = () => {
    if (Math.abs(remaining) > 0.01) return; // Must allocate all

    setIsAnimating(true);
    setShowResult(true);

    const isCorrect = currentQuestion.successCriteria(allocations);

    if (isCorrect) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
      onCorrectAnswer?.();
    } else {
      setScore((prev) => ({ ...prev, mistakes: prev.mistakes + 1 }));
      onWrongAnswer?.();
    }

    setTimeout(() => setIsAnimating(false), 500);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      initAllocations(nextQ);
      setShowResult(false);
      setShowHint(false);
    } else {
      onComplete(score.correct, score.mistakes);
    }
  };

  const isSuccess = showResult && currentQuestion.successCriteria(allocations);

  return (
    <GameContainer
      title={`BUDGET BUILDER: ${config.label}`}
      icon="📊"
      currentQuestion={currentIndex}
      totalQuestions={questions.length}
      onExit={onExit}
    >
      {/* Piggy bank */}
      <div className="flex items-center justify-center mb-4">
        <motion.div
          animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <PiggyBank fillPercent={((currentQuestion.totalBudget - remaining) / currentQuestion.totalBudget) * 100} />
        </motion.div>
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

      {/* Scenario */}
      <QuestionCard
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        label="SCENARIO"
      >
        <p className="text-white font-bold">{currentQuestion.scenario}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-amber-200">Total Budget:</span>
          <span className="text-xl font-bold text-amber-100">
            {currentQuestion.totalBudget} {currentQuestion.currency}
          </span>
        </div>
      </QuestionCard>

      {/* Constraints */}
      <div className="bg-amber-900/30 rounded-lg p-3 mb-4">
        <p className="text-amber-200/80 text-xs font-bold mb-1">📋 RULES:</p>
        <ul className="text-amber-200/70 text-xs space-y-1">
          {currentQuestion.constraints.map((c, i) => (
            <li key={i}>• {c}</li>
          ))}
        </ul>
      </div>

      {/* Hint */}
      <HintBox
        hint={currentQuestion.hint}
        visible={showHint && !showResult}
      />

      {/* Budget sliders */}
      <div className="my-4">
        {currentQuestion.categories.map((category) => (
          <BudgetSlider
            key={category.id}
            category={category}
            value={allocations[category.id] || 0}
            maxValue={currentQuestion.totalBudget}
            onChange={(val) => handleAllocationChange(category.id, val)}
            disabled={showResult}
          />
        ))}
      </div>

      {/* Remaining indicator */}
      <div className={`text-center p-2 rounded-lg ${
        Math.abs(remaining) < 0.01
          ? "bg-green-900/30 text-green-400"
          : "bg-red-900/30 text-red-400"
      }`}>
        {Math.abs(remaining) < 0.01
          ? "✅ Budget balanced!"
          : remaining > 0
            ? `⚠️ ${remaining} ${currentQuestion.currency} left to allocate`
            : `⚠️ Over budget by ${Math.abs(remaining)} ${currentQuestion.currency}`
        }
      </div>

      {/* Feedback */}
      <Feedback
        type={isSuccess ? "success" : "error"}
        title={isSuccess ? "Great Budget!" : "Try Again!"}
        message={isSuccess
          ? "💰 Your budget meets all the requirements!"
          : "📊 Check the constraints and adjust."}
        visible={showResult}
      />

      {/* Explanation */}
      {showResult && (
        <LearningBox title="💡 Financial Tip:">
          <p>{currentQuestion.explanation}</p>
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
              onClick={checkBudget}
              disabled={Math.abs(remaining) > 0.01}
              className="flex-1 py-3 rounded-lg font-bold text-white"
              style={{
                background: Math.abs(remaining) > 0.01
                  ? "rgba(120, 113, 108, 0.5)"
                  : "linear-gradient(180deg, #22c55e, #16a34a)",
                opacity: Math.abs(remaining) > 0.01 ? 0.5 : 1,
              }}
              whileHover={Math.abs(remaining) < 0.01 ? { scale: 1.02 } : {}}
              whileTap={Math.abs(remaining) < 0.01 ? { scale: 0.98 } : {}}
            >
              📊 Submit Budget
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
            {currentIndex < questions.length - 1 ? "Next Budget →" : "🏆 See Results"}
          </motion.button>
        )}
      </div>
    </GameContainer>
  );
}
