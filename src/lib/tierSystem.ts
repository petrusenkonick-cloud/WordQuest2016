// Level Tier System for WordQuest
// Defines tiers, visual styles, milestone rewards, and shop discounts

import { CSSProperties } from "react";

// Tier definition interface
export interface Tier {
  tier: number;
  minLevel: number;
  maxLevel: number;
  name: string;
  nameRu: string;
  color: string;
  gradient: string;
  glowColor: string;
}

// All 9 tiers
export const TIERS: Tier[] = [
  {
    tier: 1,
    minLevel: 1,
    maxLevel: 9,
    name: "Apprentice",
    nameRu: "Ученик",
    color: "#9CA3AF",
    gradient: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 50%, #6B7280 100%)",
    glowColor: "rgba(156, 163, 175, 0.4)",
  },
  {
    tier: 2,
    minLevel: 10,
    maxLevel: 19,
    name: "Scholar",
    nameRu: "Знаток",
    color: "#22C55E",
    gradient: "linear-gradient(135deg, #16A34A 0%, #22C55E 50%, #4ADE80 100%)",
    glowColor: "rgba(34, 197, 94, 0.5)",
  },
  {
    tier: 3,
    minLevel: 20,
    maxLevel: 29,
    name: "Wizard",
    nameRu: "Волшебник",
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 50%, #60A5FA 100%)",
    glowColor: "rgba(59, 130, 246, 0.5)",
  },
  {
    tier: 4,
    minLevel: 30,
    maxLevel: 39,
    name: "Sorcerer",
    nameRu: "Чародей",
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 50%, #A78BFA 100%)",
    glowColor: "rgba(139, 92, 246, 0.5)",
  },
  {
    tier: 5,
    minLevel: 40,
    maxLevel: 49,
    name: "Archmage",
    nameRu: "Архимаг",
    color: "#F59E0B",
    gradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)",
    glowColor: "rgba(245, 158, 11, 0.6)",
  },
  {
    tier: 6,
    minLevel: 50,
    maxLevel: 59,
    name: "Grand Master",
    nameRu: "Грандмастер",
    color: "#EF4444",
    gradient: "linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%)",
    glowColor: "rgba(239, 68, 68, 0.6)",
  },
  {
    tier: 7,
    minLevel: 60,
    maxLevel: 74,
    name: "Legendary",
    nameRu: "Легенда",
    color: "#EC4899",
    gradient: "linear-gradient(135deg, #DB2777 0%, #EC4899 50%, #F472B6 100%)",
    glowColor: "rgba(236, 72, 153, 0.6)",
  },
  {
    tier: 8,
    minLevel: 75,
    maxLevel: 99,
    name: "Mythic",
    nameRu: "Мифический",
    color: "#06B6D4",
    gradient: "linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #22D3EE 100%)",
    glowColor: "rgba(6, 182, 212, 0.6)",
  },
  {
    tier: 9,
    minLevel: 100,
    maxLevel: Infinity,
    name: "Immortal",
    nameRu: "Бессмертный",
    color: "#FFD700",
    gradient: "linear-gradient(90deg, #EF4444, #F59E0B, #22C55E, #3B82F6, #8B5CF6, #EC4899, #EF4444)",
    glowColor: "rgba(255, 215, 0, 0.7)",
  },
];

// Title badges for milestone levels
export interface TitleBadge {
  emoji: string;
  title: string;
  titleRu: string;
}

export const TITLE_BADGES: Record<number, TitleBadge> = {
  10: { emoji: "⭐", title: "Rising Star", titleRu: "Восходящая звезда" },
  20: { emoji: "🔮", title: "Word Wizard", titleRu: "Маг слов" },
  30: { emoji: "✨", title: "Spell Master", titleRu: "Мастер заклинаний" },
  40: { emoji: "🎓", title: "Grand Scholar", titleRu: "Великий учёный" },
  50: { emoji: "🔥", title: "Fire Keeper", titleRu: "Хранитель огня" },
  60: { emoji: "💎", title: "Diamond Mind", titleRu: "Алмазный разум" },
  75: { emoji: "🌌", title: "Cosmic Traveler", titleRu: "Космический странник" },
  100: { emoji: "👑", title: "Immortal Legend", titleRu: "Бессмертная легенда" },
};

// Milestone levels
export const MILESTONE_LEVELS = [10, 20, 30, 40, 50, 60, 75, 100];

// Milestone rewards
export interface MilestoneRewards {
  diamonds: number;
  emeralds: number;
  gold: number;
  permanentXpBoost?: number; // Percentage (5, 10, 15, 25)
}

export const MILESTONE_REWARDS: Record<number, MilestoneRewards> = {
  10: { diamonds: 200, emeralds: 100, gold: 150 },
  20: { diamonds: 400, emeralds: 200, gold: 300 },
  30: { diamonds: 750, emeralds: 350, gold: 500, permanentXpBoost: 5 },
  40: { diamonds: 1000, emeralds: 500, gold: 750 },
  50: { diamonds: 1500, emeralds: 750, gold: 1000, permanentXpBoost: 10 },
  60: { diamonds: 2500, emeralds: 1250, gold: 1500 },
  75: { diamonds: 5000, emeralds: 2500, gold: 3000, permanentXpBoost: 15 },
  100: { diamonds: 10000, emeralds: 5000, gold: 7500, permanentXpBoost: 25 },
};

// Shop discounts by level
export const SHOP_DISCOUNTS: Record<number, number> = {
  10: 5,   // 5% off
  30: 10,  // 10% off
  50: 20,  // 20% off
  100: 35, // 35% off
};

// Get tier for a given level
export function getTierForLevel(level: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (level >= TIERS[i].minLevel) {
      return TIERS[i];
    }
  }
  return TIERS[0]; // Default to Apprentice
}

// Get avatar frame style for a tier
export function getFrameStyle(tier: number, size: number = 100): CSSProperties {
  const tierData = TIERS.find((t) => t.tier === tier) || TIERS[0];

  const baseStyle: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };

  switch (tier) {
    case 1: // Apprentice - Simple gray border
      return {
        ...baseStyle,
        border: `2px solid ${tierData.color}`,
        background: "linear-gradient(135deg, #374151 0%, #4B5563 100%)",
      };

    case 2: // Scholar - Green border with inner glow
      return {
        ...baseStyle,
        border: `3px solid ${tierData.color}`,
        background: "linear-gradient(135deg, #166534 0%, #22C55E 100%)",
        boxShadow: `inset 0 0 15px ${tierData.glowColor}, 0 0 10px ${tierData.glowColor}`,
      };

    case 3: // Wizard - Animated pulse blue border
      return {
        ...baseStyle,
        border: `4px solid ${tierData.color}`,
        background: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)",
        boxShadow: `0 0 20px ${tierData.glowColor}, 0 0 40px rgba(59, 130, 246, 0.3)`,
        animation: "pulse-blue 2s ease-in-out infinite",
      };

    case 4: // Sorcerer - Animated gradient purple border
      return {
        ...baseStyle,
        border: `4px solid transparent`,
        background: `linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%) padding-box, ${tierData.gradient} border-box`,
        boxShadow: `0 0 25px ${tierData.glowColor}, 0 0 50px rgba(139, 92, 246, 0.3)`,
        animation: "glow-purple 3s ease-in-out infinite",
      };

    case 5: // Archmage - Golden ornate frame
      return {
        ...baseStyle,
        border: `5px solid ${tierData.color}`,
        background: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)",
        boxShadow: `0 0 30px rgba(245, 158, 11, 0.6), 0 0 60px rgba(245, 158, 11, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.3)`,
      };

    case 6: // Grand Master - Fiery red animated frame
      return {
        ...baseStyle,
        border: `5px solid ${tierData.color}`,
        background: "linear-gradient(135deg, #B91C1C 0%, #EF4444 100%)",
        boxShadow: `0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3)`,
        animation: "fire-glow 1.5s ease-in-out infinite",
      };

    case 7: // Legendary - Diamond crystalline effect
      return {
        ...baseStyle,
        border: `5px solid ${tierData.color}`,
        background: "linear-gradient(135deg, #BE185D 0%, #EC4899 50%, #F9A8D4 100%)",
        boxShadow: `0 0 35px ${tierData.glowColor}, 0 0 70px rgba(236, 72, 153, 0.4)`,
        animation: "shimmer 2s linear infinite",
      };

    case 8: // Mythic - Cosmic swirl with stars
      return {
        ...baseStyle,
        border: `5px solid ${tierData.color}`,
        background: "linear-gradient(135deg, #0E7490 0%, #06B6D4 50%, #67E8F9 100%)",
        boxShadow: `0 0 40px ${tierData.glowColor}, 0 0 80px rgba(6, 182, 212, 0.4)`,
        animation: "cosmic-pulse 4s ease-in-out infinite",
      };

    case 9: // Immortal - Rainbow holographic shimmer
      return {
        ...baseStyle,
        border: `6px solid transparent`,
        background: `linear-gradient(135deg, #1F2937 0%, #374151 100%) padding-box, ${tierData.gradient} border-box`,
        backgroundSize: "400% 400%",
        boxShadow: `0 0 50px rgba(255, 215, 0, 0.5), 0 0 100px rgba(255, 215, 0, 0.3)`,
        animation: "rainbow-shift 3s linear infinite, holographic 2s ease-in-out infinite",
      };

    default:
      return baseStyle;
  }
}

// Get profile background style for a tier
export function getProfileBackgroundStyle(tier: number): CSSProperties {
  const tierData = TIERS.find((t) => t.tier === tier) || TIERS[0];

  if (tier === 9) {
    // Immortal - Rainbow animated background
    return {
      background: `linear-gradient(135deg,
        rgba(239, 68, 68, 0.3) 0%,
        rgba(245, 158, 11, 0.3) 20%,
        rgba(34, 197, 94, 0.3) 40%,
        rgba(59, 130, 246, 0.3) 60%,
        rgba(139, 92, 246, 0.3) 80%,
        rgba(236, 72, 153, 0.3) 100%)`,
      backgroundSize: "400% 400%",
      animation: "rainbow-shift 5s linear infinite",
      border: `3px solid rgba(255, 215, 0, 0.5)`,
      boxShadow: `0 8px 32px rgba(255, 215, 0, 0.3)`,
    };
  }

  return {
    background: `linear-gradient(135deg, ${tierData.color}20 0%, ${tierData.color}40 100%)`,
    border: `3px solid ${tierData.color}50`,
    boxShadow: `0 8px 32px ${tierData.glowColor}`,
  };
}

// Get milestone rewards for a specific level
export function getMilestoneRewards(level: number): MilestoneRewards | null {
  return MILESTONE_REWARDS[level] || null;
}

// Get shop discount for a given level
export function getShopDiscount(level: number): number {
  let discount = 0;
  for (const [minLevel, discountPercent] of Object.entries(SHOP_DISCOUNTS)) {
    if (level >= parseInt(minLevel)) {
      discount = discountPercent;
    }
  }
  return discount;
}

// Get title badge for a given level (returns highest earned badge)
export function getTitleBadge(level: number): TitleBadge | null {
  let badge: TitleBadge | null = null;
  for (const [minLevel, titleBadge] of Object.entries(TITLE_BADGES)) {
    if (level >= parseInt(minLevel)) {
      badge = titleBadge;
    }
  }
  return badge;
}

// Check if a level is a milestone level
export function isMilestoneLevel(level: number): boolean {
  return MILESTONE_LEVELS.includes(level);
}

// Calculate cumulative permanent XP boost from milestones claimed
export function calculatePermanentXpBoost(milestonesClaimed: number[]): number {
  let totalBoost = 0;
  for (const milestone of milestonesClaimed) {
    const rewards = MILESTONE_REWARDS[milestone];
    if (rewards?.permanentXpBoost) {
      totalBoost = rewards.permanentXpBoost; // Use the highest (they stack as replacement, not addition)
    }
  }
  return totalBoost;
}

// Get CSS keyframes for tier animations (to be injected into global styles)
export const TIER_ANIMATIONS_CSS = `
@keyframes pulse-blue {
  0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.7), 0 0 60px rgba(59, 130, 246, 0.5); }
}

@keyframes glow-purple {
  0%, 100% { box-shadow: 0 0 25px rgba(139, 92, 246, 0.5), 0 0 50px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 35px rgba(139, 92, 246, 0.7), 0 0 70px rgba(139, 92, 246, 0.5); }
}

@keyframes fire-glow {
  0%, 100% {
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3);
    filter: brightness(1);
  }
  50% {
    box-shadow: 0 0 40px rgba(239, 68, 68, 0.8), 0 0 80px rgba(239, 68, 68, 0.5);
    filter: brightness(1.1);
  }
}

@keyframes shimmer {
  0% { filter: brightness(1) hue-rotate(0deg); }
  50% { filter: brightness(1.2) hue-rotate(5deg); }
  100% { filter: brightness(1) hue-rotate(0deg); }
}

@keyframes cosmic-pulse {
  0%, 100% {
    box-shadow: 0 0 40px rgba(6, 182, 212, 0.5), 0 0 80px rgba(6, 182, 212, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 50px rgba(6, 182, 212, 0.7), 0 0 100px rgba(6, 182, 212, 0.5);
    transform: scale(1.02);
  }
}

@keyframes rainbow-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes holographic {
  0%, 100% { filter: brightness(1) saturate(1); }
  50% { filter: brightness(1.2) saturate(1.3); }
}
`;
