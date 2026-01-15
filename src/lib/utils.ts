import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Emoji icons mapping for the game
export const EMOJI_ICONS: Record<string, string> = {
  // Characters
  boy: "🧑",
  girl: "👩",
  knight: "🦸",
  wizard: "🧙",
  ninja: "🥷",
  robot: "🤖",
  baby: "👶",

  // Pets
  cat: "🐱",
  dog: "🐕",
  bird: "🦜",
  fox: "🦊",
  dragon: "🐉",

  // Tools
  axe: "🪓",
  pickaxe: "⛏️",
  hammer: "🔨",
  gem: "💎",

  // Items
  lightbulb: "💡",
  shield: "🛡️",
  zap: "⚡",

  // Level icons
  stone: "🪨",
  scroll: "📜",
  question: "❓",
  map: "🗺️",
  crafting: "📦",
  book: "📖",

  // Achievement icons
  flame: "🔥",
  swords: "⚔️",
  "book-open": "📚",
  target: "💯",
  trophy: "🏆",
  "graduation-cap": "🎓",
  crown: "👑",

  // Currency
  diamond: "💎",
  emerald: "🟢",
  gold: "🪙",

  // UI
  star: "⭐",
  lock: "🔒",
  gift: "🎁",
  package: "📦",
  home: "🏠",
  shop: "🏪",
  bag: "🎒",
  awards: "🏆",
};

export function getEmoji(icon: string): string {
  return EMOJI_ICONS[icon] || icon;
}
