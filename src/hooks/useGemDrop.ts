"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAppStore } from "@/lib/store";
import { GemType } from "@/lib/gemTypes";
import { useCallback } from "react";

interface UseGemDropOptions {
  playerId: Id<"players"> | null;
  enabled?: boolean;
}

interface GemDropResult {
  dropped: boolean;
  gemType?: GemType;
  isWhole?: boolean;
  rarity?: string;
}

export function useGemDrop({ playerId, enabled = true }: UseGemDropOptions) {
  const calculateDrop = useMutation(api.gems.calculateGemDrop);
  const awardLevelGem = useMutation(api.gems.awardLevelCompletionGem);
  const addGemDrop = useAppStore((state) => state.addGemDrop);

  // Trigger a gem drop check after a correct answer
  const checkGemDrop = useCallback(
    async (streak: number, difficulty?: number, levelId?: string) => {
      if (!playerId || !enabled) return null;

      try {
        const result = await calculateDrop({
          playerId,
          streak,
          difficulty,
          levelId,
        });

        if (result.dropped && result.gemType) {
          // Add to UI state for animation
          addGemDrop({
            gemType: result.gemType as GemType,
            isWhole: result.isWhole || false,
            rarity: result.rarity || "common",
          });
        }

        return result as GemDropResult;
      } catch (error) {
        console.error("Error checking gem drop:", error);
        return null;
      }
    },
    [playerId, enabled, calculateDrop, addGemDrop]
  );

  // Award a gem for level completion
  const awardLevelCompletionGem = useCallback(
    async (levelId: string, stars: number) => {
      if (!playerId || !enabled) return null;

      try {
        const result = await awardLevelGem({
          playerId,
          levelId,
          stars,
        });

        // Add to UI state for animation
        addGemDrop({
          gemType: result.gemType as GemType,
          isWhole: result.isWhole,
          rarity: result.rarity,
        });

        return result;
      } catch (error) {
        console.error("Error awarding level gem:", error);
        return null;
      }
    },
    [playerId, enabled, awardLevelGem, addGemDrop]
  );

  return {
    checkGemDrop,
    awardLevelCompletionGem,
  };
}

// Hook to use pending gem drops from the store
export function usePendingGemDrops() {
  const pendingDrops = useAppStore((state) => state.gems.pendingDrops);
  const removeGemDrop = useAppStore((state) => state.removeGemDrop);
  const clearGemDrops = useAppStore((state) => state.clearGemDrops);
  const sessionGemsFound = useAppStore((state) => state.gems.sessionGemsFound);

  return {
    pendingDrops,
    removeGemDrop,
    clearGemDrops,
    sessionGemsFound,
  };
}
