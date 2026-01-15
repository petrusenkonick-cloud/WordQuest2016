// Game Data - All levels, shop items, and achievements
// This file contains the static game data that can be used without Convex

export const LEVELS = [
  {
    id: "suffix",
    name: "SUFFIX MINE",
    icon: "stone",
    desc: 'Learn "-less" words',
    rewards: { diamonds: 50, emeralds: 20, xp: 100 },
    questions: [
      { s: "Without any end, the road seemed", a: "endless", h: "Goes on forever!" },
      { s: "She felt no hope, she was", a: "hopeless", h: "No hope = hope+less" },
      { s: "Without a care, she was", a: "careless", h: "No cares!" },
      { s: "The broken toy was", a: "useless", h: "Can't use it!" },
      { s: "No water, the land was", a: "waterless", h: "Without water" },
      { s: "No colour, the picture was", a: "colourless", h: "Without colour" },
      { s: "The stray dog was", a: "ownerless", h: "No owner" },
      { s: "Clear sky, it was", a: "cloudless", h: "No clouds!" },
      { s: "Worth nothing, it was", a: "valueless", h: "No value" },
      { s: "Never gets tired, he was", a: "tireless", h: "Never tired!" },
    ],
    wordBank: [
      "endless", "hopeless", "careless", "useless", "waterless",
      "colourless", "ownerless", "cloudless", "valueless", "tireless", "fearless"
    ],
  },
  {
    id: "imperative",
    name: "COMMAND SCROLL",
    icon: "scroll",
    desc: "Command or Request?",
    rewards: { diamonds: 50, emeralds: 25, xp: 120 },
    questions: [
      { s: "Please clear your desks.", a: "request", h: "'Please' = polite!" },
      { s: "Turn to page 45.", a: "command", h: "Direct order!" },
      { s: "Always say thank you.", a: "command", h: "A rule!" },
      { s: "Pass the ketchup, please.", a: "request", h: "Magic word!" },
      { s: "Put your shoes on.", a: "command", h: "Direct!" },
      { s: "Kindly switch off the lights.", a: "request", h: "'Kindly' = polite" },
      { s: "Be quiet during the test.", a: "command", h: "A rule!" },
      { s: "Take out your homework.", a: "command", h: "Teacher telling!" },
      { s: "Please tidy up.", a: "request", h: "'Please'!" },
      { s: "Listen to instructions.", a: "command", h: "Direct order!" },
    ],
  },
  {
    id: "interrogative",
    name: "QUESTION FORGE",
    icon: "question",
    desc: "Create questions",
    rewards: { diamonds: 60, emeralds: 30, xp: 150 },
    questions: [
      { a: "I have two cats.", h: "How many...", ex: "How many cats do you have?" },
      { a: "My favorite colour is blue.", h: "What is your...", ex: "What is your favorite colour?" },
      { a: "I play soccer on Saturdays.", h: "When do you...", ex: "When do you play soccer?" },
      { a: "By bus.", h: "How do you...", ex: "How do you get there?" },
      { a: "In the morning.", h: "When...", ex: "When do you wake up?" },
      { a: "At the library.", h: "Where...", ex: "Where do you study?" },
      { a: "Because it's fun!", h: "Why...", ex: "Why do you like it?" },
    ],
  },
  {
    id: "crossword",
    name: "WORD MAP",
    icon: "map",
    desc: "Vocabulary puzzle",
    rewards: { diamonds: 80, emeralds: 40, xp: 200 },
    wordBank: [
      "MIRROR", "REQUIRE", "FURNISH", "STAINLESS", "PURE",
      "WHIRL", "CURRENT", "NURTURE", "IRRITATE", "MIRACLE"
    ],
  },
  {
    id: "vocabulary",
    name: "CRAFTING TABLE",
    icon: "crafting",
    desc: "Build sentences",
    rewards: { diamonds: 70, emeralds: 35, xp: 180 },
    wordPairs: [
      ["Helpless", "Speechless"],
      ["Merciless", "Fruitless"],
      ["Tireless", "Stainless"],
      ["Shameless", "Countless"],
      ["Mirror", "Circumstance"],
      ["Irritate", "Require"],
      ["Whirl", "Miracle"],
      ["Furnish", "Nurture"],
      ["Pure", "Curve"],
      ["Current", "Obscure"],
    ],
  },
  {
    id: "story",
    name: "STORY QUEST",
    icon: "book",
    desc: "Be a detective!",
    rewards: { diamonds: 100, emeralds: 50, xp: 250 },
    story:
      "Lucy wandered around the park, searching for her lost puppy, Max. Everywhere she looked, there was no sign of him. As the sun began to set, she heard a whimper near the lake. Racing over, Lucy found Max, tangled in some bushes. Tears of joy filled her eyes as she hugged him tightly, promising never to let him out of her sight again.",
    questions: [
      { q: "Who was Lucy looking for?", a: "Max", options: ["Max", "Her cat", "Her friend", "Her mom"] },
      { q: "Where did Lucy hear a whimper?", a: "near the lake", options: ["near the lake", "in a tree", "at home", "on the road"] },
      { q: "What was Max tangled in?", a: "bushes", options: ["bushes", "ropes", "wires", "grass"] },
      { q: "How did Lucy feel when she found Max?", a: "joyful", options: ["joyful", "angry", "scared", "confused"] },
      { q: "What did Lucy promise?", a: "never let Max out of sight", options: ["never let Max out of sight", "buy Max a collar", "give Max treats", "take Max to the vet"] },
    ],
  },
];

export const SHOP_ITEMS = {
  skins: [
    { id: "steve", name: "Steve", icon: "boy", price: 0, currency: "diamonds" },
    { id: "alex", name: "Alex", icon: "girl", price: 100, currency: "diamonds" },
    { id: "knight", name: "Knight", icon: "knight", price: 200, currency: "diamonds" },
    { id: "wizard", name: "Wizard", icon: "wizard", price: 300, currency: "diamonds" },
    { id: "ninja", name: "Ninja", icon: "ninja", price: 500, currency: "diamonds" },
    { id: "robot", name: "Robot", icon: "robot", price: 1000, currency: "diamonds" },
  ],
  tools: [
    { id: "wood_pick", name: "Wood Pick", icon: "axe", price: 50, currency: "emeralds", effect: "+5% XP" },
    { id: "stone_pick", name: "Stone Pick", icon: "pickaxe", price: 100, currency: "emeralds", effect: "+10% XP" },
    { id: "iron_pick", name: "Iron Pick", icon: "hammer", price: 200, currency: "emeralds", effect: "+15% XP" },
    { id: "diamond_pick", name: "Diamond Pick", icon: "gem", price: 500, currency: "emeralds", effect: "+25% XP" },
  ],
  pets: [
    { id: "cat", name: "Cat", icon: "cat", price: 150, currency: "diamonds" },
    { id: "dog", name: "Dog", icon: "dog", price: 150, currency: "diamonds" },
    { id: "parrot", name: "Parrot", icon: "bird", price: 200, currency: "diamonds" },
    { id: "fox", name: "Fox", icon: "fox", price: 300, currency: "diamonds" },
    { id: "dragon", name: "Dragon", icon: "dragon", price: 1000, currency: "diamonds" },
  ],
  boosts: [
    { id: "hints", name: "Hints x5", icon: "lightbulb", price: 25, currency: "gold" },
    { id: "shield", name: "Shield", icon: "shield", price: 50, currency: "gold" },
    { id: "2xp", name: "2X XP", icon: "zap", price: 100, currency: "gold" },
  ],
};

export const ACHIEVEMENTS = [
  {
    id: "first",
    name: "First Steps",
    desc: "Complete 1 quest",
    icon: "baby",
    reward: { diamonds: 50 },
    condition: { type: "quests", value: 1 },
  },
  {
    id: "streak3",
    name: "Hot Streak",
    desc: "3 day streak",
    icon: "flame",
    reward: { diamonds: 100 },
    condition: { type: "streak", value: 3 },
  },
  {
    id: "streak7",
    name: "Weekly Warrior",
    desc: "7 day streak",
    icon: "swords",
    reward: { diamonds: 250, emeralds: 100 },
    condition: { type: "streak", value: 7 },
  },
  {
    id: "words50",
    name: "Word Collector",
    desc: "Learn 50 words",
    icon: "book-open",
    reward: { diamonds: 150 },
    condition: { type: "words", value: 50 },
  },
  {
    id: "perfect",
    name: "Perfect Score",
    desc: "Complete level with no mistakes",
    icon: "target",
    reward: { emeralds: 100 },
    condition: { type: "perfect", value: 1 },
  },
  {
    id: "champion",
    name: "Champion",
    desc: "Complete all levels",
    icon: "trophy",
    reward: { diamonds: 500, emeralds: 250 },
    condition: { type: "allLevels", value: 6 },
  },
  {
    id: "words100",
    name: "Vocabulary Master",
    desc: "Learn 100 words",
    icon: "graduation-cap",
    reward: { diamonds: 300, gold: 100 },
    condition: { type: "words", value: 100 },
  },
  {
    id: "streak30",
    name: "Monthly Master",
    desc: "30 day streak",
    icon: "crown",
    reward: { diamonds: 1000, emeralds: 500, gold: 250 },
    condition: { type: "streak", value: 30 },
  },
];

export const DAILY_REWARDS = [
  { diamonds: 10, emeralds: 5, gold: 20 },
  { diamonds: 15, emeralds: 8, gold: 30 },
  { diamonds: 20, emeralds: 10, gold: 40 },
  { diamonds: 30, emeralds: 15, gold: 50 },
  { diamonds: 40, emeralds: 20, gold: 60 },
  { diamonds: 50, emeralds: 25, gold: 80 },
  { diamonds: 100, emeralds: 50, gold: 150 }, // Day 7 bonus!
];

export type Level = typeof LEVELS[number];
export type ShopItem = typeof SHOP_ITEMS.skins[number];
export type Achievement = typeof ACHIEVEMENTS[number];
