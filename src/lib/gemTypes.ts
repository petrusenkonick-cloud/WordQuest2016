// Gem System Types and Constants for WordQuest

// ============ RARITY LEVELS ============
export type GemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface RarityConfig {
  name: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  dropChance: number; // Base chance percentage
  shardsNeeded: number; // Shards to make 1 whole gem
  glowColor: string;
}

export const RARITY_CONFIG: Record<GemRarity, RarityConfig> = {
  common: {
    name: "Common",
    color: "#9CA3AF",
    borderColor: "#6B7280",
    bgGradient: "from-gray-400 to-gray-500",
    dropChance: 30,
    shardsNeeded: 4,
    glowColor: "rgba(156, 163, 175, 0.5)",
  },
  uncommon: {
    name: "Uncommon",
    color: "#22C55E",
    borderColor: "#16A34A",
    bgGradient: "from-green-400 to-green-600",
    dropChance: 20,
    shardsNeeded: 4,
    glowColor: "rgba(34, 197, 94, 0.5)",
  },
  rare: {
    name: "Rare",
    color: "#3B82F6",
    borderColor: "#2563EB",
    bgGradient: "from-blue-400 to-blue-600",
    dropChance: 10,
    shardsNeeded: 4,
    glowColor: "rgba(59, 130, 246, 0.5)",
  },
  epic: {
    name: "Epic",
    color: "#A855F7",
    borderColor: "#9333EA",
    bgGradient: "from-purple-400 to-purple-600",
    dropChance: 4,
    shardsNeeded: 6,
    glowColor: "rgba(168, 85, 247, 0.5)",
  },
  legendary: {
    name: "Legendary",
    color: "#F59E0B",
    borderColor: "#D97706",
    bgGradient: "from-yellow-400 to-amber-500",
    dropChance: 1,
    shardsNeeded: 8,
    glowColor: "rgba(245, 158, 11, 0.6)",
  },
};

// ============ GEM TYPES ============
export type GemType =
  | "topaz"
  | "amethyst"
  | "sapphire"
  | "ruby"
  | "emerald_gem"
  | "diamond"
  | "opal"
  | "onyx";

export interface GemConfig {
  id: GemType;
  name: string;
  emoji: string;
  rarity: GemRarity;
  color: string;
  description: string;
  effect: string;
}

export const GEM_CONFIG: Record<GemType, GemConfig> = {
  topaz: {
    id: "topaz",
    name: "Topaz",
    emoji: "💛",
    rarity: "common",
    color: "#FBBF24",
    description: "A warm golden gem that glows with inner light",
    effect: "XP Bonus",
  },
  amethyst: {
    id: "amethyst",
    name: "Amethyst",
    emoji: "💜",
    rarity: "uncommon",
    color: "#A855F7",
    description: "A mystical purple crystal filled with wisdom",
    effect: "Extra Hints",
  },
  sapphire: {
    id: "sapphire",
    name: "Sapphire",
    emoji: "💙",
    rarity: "rare",
    color: "#3B82F6",
    description: "A deep blue stone that attracts fortune",
    effect: "Gem Luck Boost",
  },
  ruby: {
    id: "ruby",
    name: "Ruby",
    emoji: "❤️",
    rarity: "rare",
    color: "#EF4444",
    description: "A fiery red gem that protects its owner",
    effect: "Streak Shield",
  },
  emerald_gem: {
    id: "emerald_gem",
    name: "Emerald",
    emoji: "💚",
    rarity: "epic",
    color: "#10B981",
    description: "A brilliant green crystal of prosperity",
    effect: "Double Rewards",
  },
  diamond: {
    id: "diamond",
    name: "Diamond",
    emoji: "💎",
    rarity: "epic",
    color: "#60A5FA",
    description: "The purest crystal, amplifying all power",
    effect: "Major XP Boost",
  },
  opal: {
    id: "opal",
    name: "Opal",
    emoji: "🤍",
    rarity: "legendary",
    color: "#F0F9FF",
    description: "A rainbow gem that shifts with light",
    effect: "Universal Crafting",
  },
  onyx: {
    id: "onyx",
    name: "Onyx",
    emoji: "🖤",
    rarity: "legendary",
    color: "#1F2937",
    description: "A mysterious black stone of ancient power",
    effect: "Unlock Content",
  },
};

// ============ GEM COLLECTIONS (SETS) ============
export interface GemCollection {
  id: string;
  name: string;
  description: string;
  requiredGems: GemType[];
  reward: {
    luckBonus: number; // Permanent luck increase (percentage)
    title?: string;
    specialReward?: string;
  };
}

export const GEM_COLLECTIONS: GemCollection[] = [
  {
    id: "starter",
    name: "Starter Set",
    description: "Begin your gem collection journey",
    requiredGems: ["topaz", "amethyst"],
    reward: {
      luckBonus: 5,
      title: "Gem Apprentice",
    },
  },
  {
    id: "elements",
    name: "Elemental Trio",
    description: "Master the elements of fire, water, and earth",
    requiredGems: ["ruby", "sapphire", "emerald_gem"],
    reward: {
      luckBonus: 10,
      title: "Elemental Master",
    },
  },
  {
    id: "rainbow",
    name: "Rainbow Collection",
    description: "Collect every type of gem",
    requiredGems: [
      "topaz",
      "amethyst",
      "sapphire",
      "ruby",
      "emerald_gem",
      "diamond",
      "opal",
      "onyx",
    ],
    reward: {
      luckBonus: 25,
      title: "Gem Master",
      specialReward: "Exclusive Rainbow Aura Effect",
    },
  },
];

// ============ CRAFTING RECIPES ============
export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: { gemType: GemType; amount: number }[];
  result: {
    type: "boost" | "cosmetic" | "consumable";
    boostType?: string;
    multiplier?: number;
    duration?: number; // In minutes, undefined for permanent/single-use
    uses?: number; // For single-use items
    cosmeticId?: string;
  };
  icon: string;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: "xp_elixir",
    name: "XP Elixir",
    description: "Doubles all XP earned for 30 minutes",
    ingredients: [
      { gemType: "topaz", amount: 2 },
      { gemType: "emerald_gem", amount: 1 },
    ],
    result: {
      type: "boost",
      boostType: "xp_multiplier",
      multiplier: 2,
      duration: 30,
    },
    icon: "🧪",
  },
  {
    id: "gem_magnet",
    name: "Gem Magnet",
    description: "Increases gem drop rate by 50% for 1 hour",
    ingredients: [
      { gemType: "sapphire", amount: 2 },
      { gemType: "amethyst", amount: 3 },
    ],
    result: {
      type: "boost",
      boostType: "gem_luck",
      multiplier: 1.5,
      duration: 60,
    },
    icon: "🧲",
  },
  {
    id: "streak_shield",
    name: "Streak Shield",
    description: "Protects your streak from being lost (1 use)",
    ingredients: [
      { gemType: "ruby", amount: 3 },
      { gemType: "onyx", amount: 1 },
    ],
    result: {
      type: "consumable",
      boostType: "streak_shield",
      uses: 1,
    },
    icon: "🛡️",
  },
  {
    id: "crystal_crown",
    name: "Crystal Crown",
    description: "A majestic crown made of pure crystals",
    ingredients: [
      { gemType: "diamond", amount: 2 },
      { gemType: "opal", amount: 1 },
      { gemType: "topaz", amount: 4 },
    ],
    result: {
      type: "cosmetic",
      cosmeticId: "crown_crystal",
    },
    icon: "👑",
  },
  {
    id: "rainbow_aura",
    name: "Rainbow Aura",
    description: "Surround yourself with a beautiful particle effect",
    ingredients: [
      { gemType: "topaz", amount: 1 },
      { gemType: "amethyst", amount: 1 },
      { gemType: "sapphire", amount: 1 },
      { gemType: "ruby", amount: 1 },
      { gemType: "emerald_gem", amount: 1 },
      { gemType: "diamond", amount: 1 },
      { gemType: "opal", amount: 1 },
      { gemType: "onyx", amount: 1 },
    ],
    result: {
      type: "cosmetic",
      cosmeticId: "aura_rainbow",
    },
    icon: "🌈",
  },
  {
    id: "hint_potion",
    name: "Hint Potion",
    description: "Grants 5 free hints",
    ingredients: [
      { gemType: "amethyst", amount: 2 },
      { gemType: "topaz", amount: 1 },
    ],
    result: {
      type: "consumable",
      boostType: "free_hints",
      uses: 5,
    },
    icon: "💡",
  },
  {
    id: "fortune_charm",
    name: "Fortune Charm",
    description: "Double rewards from the next 10 correct answers",
    ingredients: [
      { gemType: "emerald_gem", amount: 2 },
      { gemType: "sapphire", amount: 1 },
    ],
    result: {
      type: "consumable",
      boostType: "double_rewards",
      multiplier: 2,
      uses: 10,
    },
    icon: "🍀",
  },
];

// ============ MINING DEPTHS ============
export interface MiningDepth {
  minDepth: number;
  maxDepth: number;
  name: string;
  color: string;
  bgColor: string;
  availableRarities: GemRarity[];
  description: string;
}

export const MINING_DEPTHS: MiningDepth[] = [
  {
    minDepth: 0,
    maxDepth: 5,
    name: "Surface Soil",
    color: "#8B4513",
    bgColor: "from-amber-700 to-amber-900",
    availableRarities: ["common"],
    description: "Soft earth with common gems",
  },
  {
    minDepth: 6,
    maxDepth: 15,
    name: "Stone Layer",
    color: "#6B7280",
    bgColor: "from-gray-600 to-gray-800",
    availableRarities: ["common", "uncommon"],
    description: "Harder stone with better gems",
  },
  {
    minDepth: 16,
    maxDepth: 25,
    name: "Granite Depths",
    color: "#9CA3AF",
    bgColor: "from-slate-500 to-slate-700",
    availableRarities: ["uncommon", "rare"],
    description: "Dense granite hiding rare treasures",
  },
  {
    minDepth: 26,
    maxDepth: 35,
    name: "Obsidian Zone",
    color: "#1F2937",
    bgColor: "from-gray-800 to-black",
    availableRarities: ["rare", "epic"],
    description: "Dark volcanic rock with epic gems",
  },
  {
    minDepth: 36,
    maxDepth: 999,
    name: "The Abyss",
    color: "#581C87",
    bgColor: "from-purple-900 to-black",
    availableRarities: ["epic", "legendary"],
    description: "Mysterious depths with legendary gems",
  },
];

// ============ DROP CALCULATION HELPERS ============
export function getDepthConfig(depth: number): MiningDepth {
  return (
    MINING_DEPTHS.find((d) => depth >= d.minDepth && depth <= d.maxDepth) ||
    MINING_DEPTHS[MINING_DEPTHS.length - 1]
  );
}

export function getGemsByRarity(rarity: GemRarity): GemConfig[] {
  return Object.values(GEM_CONFIG).filter((gem) => gem.rarity === rarity);
}

export function calculateBaseDropChance(
  streak: number,
  luckBonus: number = 0
): number {
  // Base 35% chance, +1% per streak (max +20%), plus any luck bonuses
  const streakBonus = Math.min(streak * 1, 20);
  return 35 + streakBonus + luckBonus;
}

export function selectGemForDrop(
  availableRarities: GemRarity[],
  luckMultiplier: number = 1
): { gemType: GemType; isWhole: boolean } | null {
  // Roll for rarity based on chances
  const roll = Math.random() * 100;
  let cumulative = 0;

  // Sort rarities by drop chance (common first)
  const sortedRarities = availableRarities.sort(
    (a, b) => RARITY_CONFIG[b].dropChance - RARITY_CONFIG[a].dropChance
  );

  let selectedRarity: GemRarity | null = null;
  for (const rarity of sortedRarities) {
    cumulative += RARITY_CONFIG[rarity].dropChance * luckMultiplier;
    if (roll < cumulative) {
      selectedRarity = rarity;
      break;
    }
  }

  if (!selectedRarity) {
    // Default to most common available rarity
    selectedRarity = sortedRarities[0];
  }

  // Get gems of selected rarity
  const gemsOfRarity = getGemsByRarity(selectedRarity);
  if (gemsOfRarity.length === 0) return null;

  // Random gem from selected rarity
  const gem = gemsOfRarity[Math.floor(Math.random() * gemsOfRarity.length)];

  // 20% chance for whole gem, 80% for shard (better rarities have slightly higher whole chance)
  const wholeChance =
    selectedRarity === "legendary"
      ? 0.3
      : selectedRarity === "epic"
        ? 0.25
        : 0.2;
  const isWhole = Math.random() < wholeChance;

  return { gemType: gem.id, isWhole };
}

// ============ UI HELPERS ============
export function getGemDisplay(gemType: GemType): {
  emoji: string;
  name: string;
  color: string;
  rarity: RarityConfig;
} {
  const gem = GEM_CONFIG[gemType];
  return {
    emoji: gem.emoji,
    name: gem.name,
    color: gem.color,
    rarity: RARITY_CONFIG[gem.rarity],
  };
}

export function formatShardProgress(
  shards: number,
  gemType: GemType
): { current: number; needed: number; percentage: number } {
  const rarity = GEM_CONFIG[gemType].rarity;
  const needed = RARITY_CONFIG[rarity].shardsNeeded;
  return {
    current: shards,
    needed,
    percentage: Math.min((shards / needed) * 100, 100),
  };
}
