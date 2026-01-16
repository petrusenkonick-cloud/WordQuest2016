"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useAppStore } from "@/lib/store";

// Generate or retrieve a unique device ID (fallback when not logged in via Clerk)
function getDeviceId(): string {
  if (typeof window === "undefined") return "server";

  let deviceId = localStorage.getItem("wordquest_device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("wordquest_device_id", deviceId);
  }
  return deviceId;
}

interface ConvexSyncContextType {
  isLoading: boolean;
  isLoggedIn: boolean;
  isSignedIn: boolean; // Clerk authentication status
  playerId: Id<"players"> | null;
  levelProgress: Record<string, { stars: number; done: boolean }>;
  inventory: Array<{ itemId: string; itemType: string; equipped: boolean }>;
  ownedItems: string[];

  // Actions
  initializePlayer: (name: string, skin: string) => Promise<Id<"players"> | null>;
  awardXP: (amount: number) => Promise<void>;
  awardCurrency: (currency: "diamonds" | "emeralds" | "gold", amount: number) => Promise<void>;
  claimDailyReward: () => Promise<{ diamonds: number; emeralds: number; gold: number } | null>;
  completeLevelSync: (
    levelId: string,
    stars: number,
    score: number,
    rewards: { diamonds: number; emeralds: number; xp: number }
  ) => Promise<unknown[] | undefined>;
  purchaseItemSync: (
    itemId: string,
    itemType: string,
    price: number,
    currency: string
  ) => Promise<{ success: boolean; reason?: string }>;
  equipItemSync: (itemId: string, itemType: string) => Promise<void>;
  addWordsLearned: (count: number) => Promise<void>;
}

const ConvexSyncContext = createContext<ConvexSyncContextType | null>(null);

export function useConvexSync() {
  const ctx = useContext(ConvexSyncContext);
  if (!ctx) {
    // Return mock for when Convex is not available
    return {
      isLoading: false,
      isLoggedIn: false,
      isSignedIn: false,
      playerId: null,
      levelProgress: {},
      inventory: [],
      ownedItems: ["steve"],
      initializePlayer: async () => null,
      awardXP: async () => {},
      awardCurrency: async () => {},
      claimDailyReward: async () => null,
      completeLevelSync: async () => undefined,
      purchaseItemSync: async () => ({ success: false }),
      equipItemSync: async () => {},
      addWordsLearned: async () => {},
    };
  }
  return ctx;
}

export function ConvexSyncProvider({ children }: { children: ReactNode }) {
  const [deviceId] = useState(getDeviceId);
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Clerk authentication
  const { userId: clerkUserId, isLoaded: isClerkLoaded, isSignedIn } = useAuth();

  // Use Clerk userId if signed in, otherwise fall back to device ID (guest mode)
  const effectiveUserId = isSignedIn && clerkUserId ? clerkUserId : deviceId;

  // Store
  const player = useAppStore((s) => s.player);
  const setPlayer = useAppStore((s) => s.setPlayer);

  // Convex queries - use effectiveUserId for player lookup
  const convexPlayer = useQuery(
    api.players.getPlayer,
    isClerkLoaded ? { clerkId: effectiveUserId } : "skip"
  );

  // Convex mutations
  const createPlayerMutation = useMutation(api.players.createPlayer);
  const addXPMutation = useMutation(api.players.addXP);
  const addCurrencyMutation = useMutation(api.players.addCurrency);
  const claimDailyRewardMutation = useMutation(api.players.claimDailyReward);
  const checkDailyLoginMutation = useMutation(api.players.checkDailyLogin);
  const updateQuestsCompletedMutation = useMutation(api.players.updateQuestsCompleted);
  const updateWordsLearnedMutation = useMutation(api.players.updateWordsLearned);
  const updateTotalStarsMutation = useMutation(api.players.updateTotalStars);
  const completeLevelMutation = useMutation(api.levels.completeLevel);
  const purchaseItemMutation = useMutation(api.shop.purchaseItem);
  const equipItemMutation = useMutation(api.shop.equipItem);
  const checkAchievementsMutation = useMutation(api.achievements.checkAchievements);

  // Additional queries
  const levelProgressQuery = useQuery(
    api.levels.getPlayerProgress,
    playerId ? { playerId } : "skip"
  );
  const inventoryQuery = useQuery(
    api.shop.getPlayerInventory,
    playerId ? { playerId } : "skip"
  );

  // Initialize player from Convex
  useEffect(() => {
    if (convexPlayer && !isInitialized) {
      setPlayerId(convexPlayer._id);
      setIsInitialized(true);

      // Sync Convex data to local store
      setPlayer({
        id: convexPlayer._id,
        name: convexPlayer.name,
        skin: convexPlayer.skin,
        level: convexPlayer.level,
        xp: convexPlayer.xp,
        xpNext: convexPlayer.xpNext,
        diamonds: convexPlayer.diamonds,
        emeralds: convexPlayer.emeralds,
        gold: convexPlayer.gold,
        streak: convexPlayer.streak,
        totalStars: convexPlayer.totalStars,
        wordsLearned: convexPlayer.wordsLearned,
        questsCompleted: convexPlayer.questsCompleted,
        perfectLevels: convexPlayer.perfectLevels,
        dailyDay: convexPlayer.dailyDay,
        dailyClaimed: convexPlayer.dailyClaimed,
      });

      // Check daily login
      checkDailyLoginMutation({ playerId: convexPlayer._id });
    }
  }, [convexPlayer, isInitialized, setPlayer, checkDailyLoginMutation]);

  // Create player
  const initializePlayer = async (name: string, skin: string): Promise<Id<"players"> | null> => {
    try {
      const newPlayerId = await createPlayerMutation({
        clerkId: effectiveUserId,
        name,
        skin,
      });

      if (newPlayerId) {
        setPlayerId(newPlayerId);
        setPlayer({
          id: newPlayerId as string,
          name,
          skin,
        });
        return newPlayerId;
      }
      return null;
    } catch (error) {
      console.error("Failed to create player:", error);
      return null;
    }
  };

  // Award XP
  const awardXP = async (amount: number) => {
    if (!playerId) return;

    // Optimistic update
    let newXP = player.xp + amount;
    let newLevel = player.level;
    let newXpNext = player.xpNext;

    while (newXP >= newXpNext) {
      newXP -= newXpNext;
      newLevel += 1;
      newXpNext = Math.floor(newXpNext * 1.5);
    }

    setPlayer({ xp: newXP, level: newLevel, xpNext: newXpNext });

    // Sync to Convex
    await addXPMutation({ playerId, amount });
  };

  // Award currency
  const awardCurrency = async (currency: "diamonds" | "emeralds" | "gold", amount: number) => {
    if (!playerId) return;

    setPlayer({ [currency]: player[currency] + amount });
    await addCurrencyMutation({ playerId, currency, amount });
  };

  // Claim daily reward
  const claimDailyReward = async () => {
    if (!playerId) return null;

    const result = await claimDailyRewardMutation({ playerId });

    if (result?.success && result.reward) {
      setPlayer({
        diamonds: player.diamonds + result.reward.diamonds,
        emeralds: player.emeralds + result.reward.emeralds,
        gold: player.gold + result.reward.gold,
        dailyClaimed: true,
        dailyDay: player.dailyDay >= 7 ? 1 : player.dailyDay + 1,
      });
      return result.reward;
    }

    return null;
  };

  // Complete level
  const completeLevelSync = async (
    levelId: string,
    stars: number,
    score: number,
    rewards: { diamonds: number; emeralds: number; xp: number }
  ) => {
    if (!playerId) return;

    // Optimistic update
    setPlayer({
      diamonds: player.diamonds + rewards.diamonds,
      emeralds: player.emeralds + rewards.emeralds,
      totalStars: player.totalStars + stars,
      questsCompleted: player.questsCompleted + 1,
      perfectLevels: stars === 3 ? player.perfectLevels + 1 : player.perfectLevels,
    });

    // Sync to Convex
    await completeLevelMutation({ playerId, levelId, stars, score });
    await addXPMutation({ playerId, amount: rewards.xp });
    await addCurrencyMutation({ playerId, currency: "diamonds", amount: rewards.diamonds });
    await addCurrencyMutation({ playerId, currency: "emeralds", amount: rewards.emeralds });
    await updateQuestsCompletedMutation({ playerId });
    await updateTotalStarsMutation({ playerId, stars });

    // Check achievements
    return await checkAchievementsMutation({ playerId });
  };

  // Purchase item
  const purchaseItemSync = async (
    itemId: string,
    itemType: string,
    price: number,
    currency: string
  ) => {
    if (!playerId) return { success: false };

    const currencyKey = currency as "diamonds" | "emeralds" | "gold";

    if (player[currencyKey] < price) {
      return { success: false, reason: "Insufficient funds" };
    }

    // Optimistic update
    setPlayer({ [currencyKey]: player[currencyKey] - price });

    const result = await purchaseItemMutation({
      playerId,
      itemId,
      itemType,
      price,
      currency,
    });

    if (!result?.success) {
      // Revert
      setPlayer({ [currencyKey]: player[currencyKey] });
    }

    return result || { success: false };
  };

  // Equip item
  const equipItemSync = async (itemId: string, itemType: string) => {
    if (!playerId) return;

    await equipItemMutation({ playerId, itemId, itemType });

    if (itemType === "skin") {
      const skinEmojis: Record<string, string> = {
        steve: "🧑",
        alex: "👧",
        knight: "🦸",
        wizard: "🧙",
        ninja: "🥷",
        robot: "🤖",
      };
      setPlayer({ skin: skinEmojis[itemId] || "🧑" });
    }
  };

  // Add words learned
  const addWordsLearned = async (count: number) => {
    if (!playerId) return;

    setPlayer({ wordsLearned: player.wordsLearned + count });
    await updateWordsLearnedMutation({ playerId, count });
  };

  // Compute owned items from inventory
  const ownedItems = inventoryQuery?.map((item) => item.itemId) || ["steve"];

  const value: ConvexSyncContextType = {
    isLoading: !isClerkLoaded || convexPlayer === undefined,
    isLoggedIn: !!convexPlayer,
    isSignedIn: !!isSignedIn,
    playerId,
    levelProgress: levelProgressQuery || {},
    inventory: inventoryQuery || [],
    ownedItems,

    initializePlayer,
    awardXP,
    awardCurrency,
    claimDailyReward,
    completeLevelSync,
    purchaseItemSync,
    equipItemSync,
    addWordsLearned,
  };

  return (
    <ConvexSyncContext.Provider value={value}>{children}</ConvexSyncContext.Provider>
  );
}
