"use client";

import { useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAppStore, PlayerState } from "./store";

// Generate or retrieve a unique device ID (temporary until Clerk is set up)
function getDeviceId(): string {
  if (typeof window === "undefined") return "server";

  let deviceId = localStorage.getItem("wordquest_device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("wordquest_device_id", deviceId);
  }
  return deviceId;
}

export function useConvexSync() {
  const deviceId = getDeviceId();
  const playerIdRef = useRef<Id<"players"> | null>(null);
  const isInitializedRef = useRef(false);

  // Store
  const player = useAppStore((s) => s.player);
  const setPlayer = useAppStore((s) => s.setPlayer);

  // Convex queries
  const convexPlayer = useQuery(api.players.getPlayer, { clerkId: deviceId });

  // Convex mutations
  const createPlayer = useMutation(api.players.createPlayer);
  const addXP = useMutation(api.players.addXP);
  const addCurrency = useMutation(api.players.addCurrency);
  const claimDailyRewardMutation = useMutation(api.players.claimDailyReward);
  const checkDailyLogin = useMutation(api.players.checkDailyLogin);
  const updateQuestsCompleted = useMutation(api.players.updateQuestsCompleted);
  const updateWordsLearned = useMutation(api.players.updateWordsLearned);
  const updateTotalStars = useMutation(api.players.updateTotalStars);

  // Level mutations
  const completeLevel = useMutation(api.levels.completeLevel);

  // Shop mutations
  const purchaseItem = useMutation(api.shop.purchaseItem);
  const equipItem = useMutation(api.shop.equipItem);

  // Achievement mutations
  const checkAchievements = useMutation(api.achievements.checkAchievements);

  // Queries for additional data
  const levelProgress = useQuery(
    api.levels.getPlayerProgress,
    playerIdRef.current ? { playerId: playerIdRef.current } : "skip"
  );
  const inventory = useQuery(
    api.shop.getPlayerInventory,
    playerIdRef.current ? { playerId: playerIdRef.current } : "skip"
  );
  const achievements = useQuery(
    api.achievements.getAchievements,
    playerIdRef.current ? { playerId: playerIdRef.current } : "skip"
  );

  // Initialize player from Convex
  useEffect(() => {
    if (convexPlayer && !isInitializedRef.current) {
      playerIdRef.current = convexPlayer._id;
      isInitializedRef.current = true;

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
      checkDailyLogin({ playerId: convexPlayer._id });
    }
  }, [convexPlayer, setPlayer, checkDailyLogin]);

  // Create player if doesn't exist
  const initializePlayer = useCallback(
    async (name: string, skin: string) => {
      try {
        const playerId = await createPlayer({
          clerkId: deviceId,
          name,
          skin,
        });

        if (playerId) {
          playerIdRef.current = playerId as Id<"players">;
          setPlayer({
            id: playerId as string,
            name,
            skin,
          });
        }

        return playerId;
      } catch (error) {
        console.error("Failed to create player:", error);
        return null;
      }
    },
    [createPlayer, deviceId, setPlayer]
  );

  // Award XP with Convex sync
  const awardXP = useCallback(
    async (amount: number) => {
      if (!playerIdRef.current) return;

      // Optimistic update
      const newXP = player.xp + amount;
      let newLevel = player.level;
      let newXpNext = player.xpNext;

      if (newXP >= player.xpNext) {
        newLevel += 1;
        newXpNext = Math.floor(player.xpNext * 1.5);
      }

      setPlayer({
        xp: newXP >= player.xpNext ? newXP - player.xpNext : newXP,
        level: newLevel,
        xpNext: newXpNext,
      });

      // Sync to Convex
      await addXP({ playerId: playerIdRef.current, amount });
    },
    [player.xp, player.xpNext, player.level, setPlayer, addXP]
  );

  // Award currency with Convex sync
  const awardCurrency = useCallback(
    async (currency: "diamonds" | "emeralds" | "gold", amount: number) => {
      if (!playerIdRef.current) return;

      // Optimistic update
      setPlayer({ [currency]: player[currency] + amount });

      // Sync to Convex
      await addCurrency({ playerId: playerIdRef.current, currency, amount });
    },
    [player, setPlayer, addCurrency]
  );

  // Claim daily reward with Convex sync
  const claimDailyReward = useCallback(async () => {
    if (!playerIdRef.current) return null;

    const result = await claimDailyRewardMutation({ playerId: playerIdRef.current });

    if (result?.success && result.reward) {
      // Update local state
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
  }, [player, setPlayer, claimDailyRewardMutation]);

  // Complete level with Convex sync
  const completeLevelSync = useCallback(
    async (levelId: string, stars: number, score: number, rewards: { diamonds: number; emeralds: number; xp: number }) => {
      if (!playerIdRef.current) return;

      // Optimistic update
      setPlayer({
        diamonds: player.diamonds + rewards.diamonds,
        emeralds: player.emeralds + rewards.emeralds,
        xp: player.xp + rewards.xp,
        totalStars: player.totalStars + stars,
        questsCompleted: player.questsCompleted + 1,
        perfectLevels: stars === 3 ? player.perfectLevels + 1 : player.perfectLevels,
      });

      // Sync to Convex
      await completeLevel({
        playerId: playerIdRef.current,
        levelId,
        stars,
        score,
      });

      // Add XP
      await addXP({ playerId: playerIdRef.current, amount: rewards.xp });

      // Add currencies
      await addCurrency({ playerId: playerIdRef.current, currency: "diamonds", amount: rewards.diamonds });
      await addCurrency({ playerId: playerIdRef.current, currency: "emeralds", amount: rewards.emeralds });

      // Update stats
      await updateQuestsCompleted({ playerId: playerIdRef.current });
      await updateTotalStars({ playerId: playerIdRef.current, stars });

      // Check achievements
      const newAchievements = await checkAchievements({ playerId: playerIdRef.current });
      return newAchievements;
    },
    [
      player,
      setPlayer,
      completeLevel,
      addXP,
      addCurrency,
      updateQuestsCompleted,
      updateTotalStars,
      checkAchievements,
    ]
  );

  // Purchase item with Convex sync
  const purchaseItemSync = useCallback(
    async (itemId: string, itemType: string, price: number, currency: string) => {
      if (!playerIdRef.current) return { success: false };

      const currencyKey = currency as "diamonds" | "emeralds" | "gold";

      if (player[currencyKey] < price) {
        return { success: false, reason: "Insufficient funds" };
      }

      // Optimistic update
      setPlayer({ [currencyKey]: player[currencyKey] - price });

      // Sync to Convex
      const result = await purchaseItem({
        playerId: playerIdRef.current,
        itemId,
        itemType,
        price,
        currency,
      });

      if (!result?.success) {
        // Revert optimistic update
        setPlayer({ [currencyKey]: player[currencyKey] });
      }

      return result || { success: false };
    },
    [player, setPlayer, purchaseItem]
  );

  // Equip item with Convex sync
  const equipItemSync = useCallback(
    async (itemId: string, itemType: string) => {
      if (!playerIdRef.current) return;

      await equipItem({
        playerId: playerIdRef.current,
        itemId,
        itemType,
      });

      // Update skin in local state if it's a skin
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
    },
    [setPlayer, equipItem]
  );

  // Update words learned with Convex sync
  const addWordsLearned = useCallback(
    async (count: number) => {
      if (!playerIdRef.current) return;

      setPlayer({ wordsLearned: player.wordsLearned + count });
      await updateWordsLearned({ playerId: playerIdRef.current, count });
    },
    [player.wordsLearned, setPlayer, updateWordsLearned]
  );

  return {
    // State
    isLoading: convexPlayer === undefined,
    isLoggedIn: !!convexPlayer,
    playerId: playerIdRef.current,
    levelProgress: levelProgress || {},
    inventory: inventory || [],
    achievements: achievements || [],

    // Actions
    initializePlayer,
    awardXP,
    awardCurrency,
    claimDailyReward,
    completeLevelSync,
    purchaseItemSync,
    equipItemSync,
    addWordsLearned,
  };
}
