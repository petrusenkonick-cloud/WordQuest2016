import { create } from "zustand";
import { GemType } from "./gemTypes";

// Player state (stored in localStorage, can be synced with Convex later)
export interface PlayerState {
  id: string | null;
  name: string;
  skin: string;
  level: number;
  xp: number;
  xpNext: number;
  diamonds: number;
  emeralds: number;
  gold: number;
  streak: number;
  totalStars: number;
  wordsLearned: number;
  questsCompleted: number;
  perfectLevels: number;
  dailyDay: number;
  dailyClaimed: boolean;
}

// Game session state (local)
export interface GameState {
  levelId: string | null;
  questionIndex: number;
  mistakes: number;
  correct: number;
  isPlaying: boolean;
}

// UI state
export type ScreenType =
  | "home"
  | "shop"
  | "inventory"
  | "achievements"
  | "game"
  | "practice"
  | "analytics"
  | "learning-profile"
  | "parent-settings"
  | "quest-map"
  | "spell-book"
  | "profile-setup"
  | "profile-settings"
  | "dashboard"
  | "leaderboard"
  | "gem-hub";

export interface UIState {
  currentScreen: ScreenType;
  isLoading: boolean;
  showDailyReward: boolean;
  showLevelComplete: boolean;
  showAchievement: boolean;
  achievementToShow: {
    id: string;
    name: string;
    icon: string;
    reward: { diamonds?: number; emeralds?: number; gold?: number };
  } | null;
  levelCompleteData: {
    levelId: string;
    stars: number;
    rewards: { diamonds: number; emeralds: number; xp: number };
  } | null;
}

// Floating rewards for animations
export interface FloatingReward {
  id: string;
  type: "diamonds" | "emeralds" | "gold" | "xp";
  amount: number;
  x: number;
  y: number;
}

// Audio state
export interface AudioState {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number; // 0-1
  sfxVolume: number; // 0-1
}

// Gem state for UI
export interface GemDrop {
  id: string;
  gemType: GemType;
  isWhole: boolean;
  rarity: string;
}

export interface GemState {
  pendingDrops: GemDrop[];
  showGemInventory: boolean;
  lastDropTime: number;
  sessionGemsFound: number;
}

// Mining state
export interface MiningState {
  isActive: boolean;
  currentDepth: number;
  digsRemaining: number;
  foundGems: GemDrop[];
}

interface AppStore {
  // Player
  player: PlayerState;
  setPlayer: (player: Partial<PlayerState>) => void;

  // Game
  game: GameState;
  setGame: (game: Partial<GameState>) => void;
  resetGame: () => void;
  nextQuestion: () => void;
  addCorrect: () => void;
  addMistake: () => void;

  // UI
  ui: UIState;
  setScreen: (screen: UIState["currentScreen"]) => void;
  setLoading: (loading: boolean) => void;
  showDailyRewardModal: () => void;
  hideDailyRewardModal: () => void;
  showLevelCompleteModal: (data: UIState["levelCompleteData"]) => void;
  hideLevelCompleteModal: () => void;
  showAchievementModal: (achievement: UIState["achievementToShow"]) => void;
  hideAchievementModal: () => void;

  // Floating rewards
  floatingRewards: FloatingReward[];
  addFloatingReward: (reward: Omit<FloatingReward, "id">) => void;
  removeFloatingReward: (id: string) => void;

  // Particles
  particles: { id: string; emoji: string; x: number; delay: number }[];
  spawnParticles: (emojis: string[]) => void;
  clearParticles: () => void;

  // Audio
  audio: AudioState;
  setAudioSettings: (settings: Partial<AudioState>) => void;

  // Gems
  gems: GemState;
  addGemDrop: (drop: Omit<GemDrop, "id">) => void;
  removeGemDrop: (id: string) => void;
  clearGemDrops: () => void;
  toggleGemInventory: () => void;
  setGemInventoryOpen: (open: boolean) => void;
  incrementSessionGems: () => void;
  resetSessionGems: () => void;

  // Mining
  mining: MiningState;
  startMining: () => void;
  endMining: () => void;
  setMiningDepth: (depth: number) => void;
  addMiningGem: (gem: GemDrop) => void;
  clearMiningGems: () => void;
}

const initialPlayerState: PlayerState = {
  id: null,
  name: "Misha",
  skin: "🧑",
  level: 1,
  xp: 0,
  xpNext: 100,
  diamonds: 0,
  emeralds: 0,
  gold: 0,
  streak: 0,
  totalStars: 0,
  wordsLearned: 0,
  questsCompleted: 0,
  perfectLevels: 0,
  dailyDay: 1,
  dailyClaimed: false,
};

const initialGameState: GameState = {
  levelId: null,
  questionIndex: 0,
  mistakes: 0,
  correct: 0,
  isPlaying: false,
};

const initialUIState: UIState = {
  currentScreen: "home",
  isLoading: true,
  showDailyReward: false,
  showLevelComplete: false,
  showAchievement: false,
  achievementToShow: null,
  levelCompleteData: null,
};

const initialAudioState: AudioState = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.5,
  sfxVolume: 0.7,
};

const initialGemState: GemState = {
  pendingDrops: [],
  showGemInventory: false,
  lastDropTime: 0,
  sessionGemsFound: 0,
};

const initialMiningState: MiningState = {
  isActive: false,
  currentDepth: 0,
  digsRemaining: 3,
  foundGems: [],
};

export const useAppStore = create<AppStore>((set, get) => ({
  // Player
  player: initialPlayerState,
  setPlayer: (player) =>
    set((state) => ({ player: { ...state.player, ...player } })),

  // Game
  game: initialGameState,
  setGame: (game) => set((state) => ({ game: { ...state.game, ...game } })),
  resetGame: () => set({ game: initialGameState }),
  nextQuestion: () =>
    set((state) => ({
      game: { ...state.game, questionIndex: state.game.questionIndex + 1 },
    })),
  addCorrect: () =>
    set((state) => ({
      game: { ...state.game, correct: state.game.correct + 1 },
    })),
  addMistake: () =>
    set((state) => ({
      game: { ...state.game, mistakes: state.game.mistakes + 1 },
    })),

  // UI
  ui: initialUIState,
  setScreen: (screen) =>
    set((state) => ({ ui: { ...state.ui, currentScreen: screen } })),
  setLoading: (loading) =>
    set((state) => ({ ui: { ...state.ui, isLoading: loading } })),
  showDailyRewardModal: () =>
    set((state) => ({ ui: { ...state.ui, showDailyReward: true } })),
  hideDailyRewardModal: () =>
    set((state) => ({ ui: { ...state.ui, showDailyReward: false } })),
  showLevelCompleteModal: (data) =>
    set((state) => ({
      ui: { ...state.ui, showLevelComplete: true, levelCompleteData: data },
    })),
  hideLevelCompleteModal: () =>
    set((state) => ({
      ui: { ...state.ui, showLevelComplete: false, levelCompleteData: null },
    })),
  showAchievementModal: (achievement) =>
    set((state) => ({
      ui: { ...state.ui, showAchievement: true, achievementToShow: achievement },
    })),
  hideAchievementModal: () =>
    set((state) => ({
      ui: { ...state.ui, showAchievement: false, achievementToShow: null },
    })),

  // Floating rewards
  floatingRewards: [],
  addFloatingReward: (reward) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      floatingRewards: [...state.floatingRewards, { ...reward, id }],
    }));
    // Auto-remove after animation
    setTimeout(() => get().removeFloatingReward(id), 2000);
  },
  removeFloatingReward: (id) =>
    set((state) => ({
      floatingRewards: state.floatingRewards.filter((r) => r.id !== id),
    })),

  // Particles
  particles: [],
  spawnParticles: (emojis) => {
    if (typeof window === "undefined") return;
    const newParticles = emojis.flatMap((emoji) =>
      Array.from({ length: 5 }).map(() => ({
        id: Math.random().toString(36).substring(7),
        emoji,
        x: Math.random() * window.innerWidth,
        delay: Math.random() * 0.5,
      }))
    );
    set({ particles: newParticles });
    // Auto-clear after animation
    setTimeout(() => get().clearParticles(), 2500);
  },
  clearParticles: () => set({ particles: [] }),

  // Audio
  audio: initialAudioState,
  setAudioSettings: (settings) =>
    set((state) => ({ audio: { ...state.audio, ...settings } })),

  // Gems
  gems: initialGemState,
  addGemDrop: (drop) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      gems: {
        ...state.gems,
        pendingDrops: [...state.gems.pendingDrops, { ...drop, id }],
        lastDropTime: Date.now(),
        sessionGemsFound: state.gems.sessionGemsFound + 1,
      },
    }));
  },
  removeGemDrop: (id) =>
    set((state) => ({
      gems: {
        ...state.gems,
        pendingDrops: state.gems.pendingDrops.filter((d) => d.id !== id),
      },
    })),
  clearGemDrops: () =>
    set((state) => ({
      gems: { ...state.gems, pendingDrops: [] },
    })),
  toggleGemInventory: () =>
    set((state) => ({
      gems: { ...state.gems, showGemInventory: !state.gems.showGemInventory },
    })),
  setGemInventoryOpen: (open) =>
    set((state) => ({
      gems: { ...state.gems, showGemInventory: open },
    })),
  incrementSessionGems: () =>
    set((state) => ({
      gems: { ...state.gems, sessionGemsFound: state.gems.sessionGemsFound + 1 },
    })),
  resetSessionGems: () =>
    set((state) => ({
      gems: { ...state.gems, sessionGemsFound: 0 },
    })),

  // Mining
  mining: initialMiningState,
  startMining: () =>
    set((state) => ({
      mining: { ...initialMiningState, isActive: true, currentDepth: state.mining.currentDepth },
    })),
  endMining: () =>
    set((state) => ({
      mining: { ...state.mining, isActive: false, digsRemaining: 3, foundGems: [] },
    })),
  setMiningDepth: (depth) =>
    set((state) => ({
      mining: { ...state.mining, currentDepth: depth },
    })),
  addMiningGem: (gem) =>
    set((state) => ({
      mining: { ...state.mining, foundGems: [...state.mining.foundGems, gem] },
    })),
  clearMiningGems: () =>
    set((state) => ({
      mining: { ...state.mining, foundGems: [] },
    })),
}));
