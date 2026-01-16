"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { GemInventory } from "@/components/gems";
import { GemDisplay } from "@/components/gems";
import {
  GemType,
  GEM_CONFIG,
  RARITY_CONFIG,
  CRAFTING_RECIPES,
  CraftingRecipe,
} from "@/lib/gemTypes";

interface GemHubScreenProps {
  playerId: Id<"players">;
  onBack: () => void;
}

type Tab = "inventory" | "crafting" | "boosts";

export function GemHubScreen({ playerId, onBack }: GemHubScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(
    null
  );
  const [craftingResult, setCraftingResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const playerGems = useQuery(api.gems.getPlayerGems, { playerId });
  const activeBoosts = useQuery(api.gems.getActiveBoosts, { playerId });
  const craftItem = useMutation(api.gems.craftItem);

  const gemMap = new Map(playerGems?.map((g) => [g.gemType, g]) || []);

  const canCraft = (recipe: CraftingRecipe): boolean => {
    return recipe.ingredients.every((ing) => {
      const gem = gemMap.get(ing.gemType);
      return gem && gem.wholeGems >= ing.amount;
    });
  };

  const handleCraft = async (recipe: CraftingRecipe) => {
    try {
      const result = await craftItem({ playerId, recipeId: recipe.id });
      if (result.success) {
        setCraftingResult({
          success: true,
          message: `Created ${result.itemName}!`,
        });
      } else {
        setCraftingResult({
          success: false,
          message: result.error || "Crafting failed",
        });
      }
      setTimeout(() => setCraftingResult(null), 3000);
    } catch (error) {
      setCraftingResult({ success: false, message: "Crafting failed" });
      setTimeout(() => setCraftingResult(null), 3000);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "inventory", label: "Gems", icon: "💎" },
    { id: "crafting", label: "Craft", icon: "⚗️" },
    { id: "boosts", label: "Boosts", icon: "✨" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
          <span>💠</span>
          Gem Workshop
        </h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2
              ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }
            `}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "inventory" && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GemInventory playerId={playerId} />
          </motion.div>
        )}

        {activeTab === "crafting" && (
          <motion.div
            key="crafting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Crafting Result Toast */}
            <AnimatePresence>
              {craftingResult && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`
                    fixed top-4 left-1/2 -translate-x-1/2 z-50
                    px-6 py-3 rounded-xl shadow-lg
                    ${
                      craftingResult.success
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }
                  `}
                >
                  {craftingResult.success ? "✨ " : "❌ "}
                  {craftingResult.message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recipe Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CRAFTING_RECIPES.map((recipe) => {
                const craftable = canCraft(recipe);
                return (
                  <motion.div
                    key={recipe.id}
                    className={`
                      p-4 rounded-xl border-2 transition-all cursor-pointer
                      ${
                        craftable
                          ? "bg-gray-800/80 border-purple-500/50 hover:border-purple-400"
                          : "bg-gray-900/50 border-gray-700 opacity-60"
                      }
                    `}
                    whileHover={craftable ? { scale: 1.02 } : {}}
                    onClick={() => craftable && setSelectedRecipe(recipe)}
                  >
                    {/* Recipe Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{recipe.icon}</span>
                      <div>
                        <h3 className="font-bold text-white">{recipe.name}</h3>
                        <p className="text-xs text-gray-400">
                          {recipe.description}
                        </p>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {recipe.ingredients.map((ing, idx) => {
                        const gem = gemMap.get(ing.gemType);
                        const hasEnough = gem && gem.wholeGems >= ing.amount;
                        return (
                          <div
                            key={idx}
                            className={`
                              flex items-center gap-1 px-2 py-1 rounded-lg
                              ${hasEnough ? "bg-green-900/30" : "bg-red-900/30"}
                            `}
                          >
                            <GemDisplay
                              gemType={ing.gemType as GemType}
                              size="sm"
                              animate={false}
                            />
                            <span
                              className={`text-sm ${hasEnough ? "text-green-400" : "text-red-400"}`}
                            >
                              {gem?.wholeGems || 0}/{ing.amount}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Craft Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (craftable) handleCraft(recipe);
                      }}
                      disabled={!craftable}
                      className={`
                        w-full py-2 rounded-lg font-medium transition-all
                        ${
                          craftable
                            ? "bg-purple-600 hover:bg-purple-500 text-white"
                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                        }
                      `}
                    >
                      {craftable ? "⚗️ Craft" : "Missing Gems"}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === "boosts" && (
          <motion.div
            key="boosts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-gray-900/50 rounded-2xl p-4 border border-purple-500/30">
              <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                <span>✨</span>
                Active Boosts
              </h3>

              {!activeBoosts || activeBoosts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-4xl block mb-2">💤</span>
                  <p>No active boosts</p>
                  <p className="text-sm">Craft items to activate boosts!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeBoosts.map((boost) => {
                    const expiresAt = new Date(boost.expiresAt);
                    const now = new Date();
                    const remainingMs = expiresAt.getTime() - now.getTime();
                    const remainingMins = Math.max(
                      0,
                      Math.floor(remainingMs / 60000)
                    );

                    return (
                      <div
                        key={boost._id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-xl border border-purple-500/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {boost.boostType === "xp_multiplier"
                              ? "⭐"
                              : boost.boostType === "gem_luck"
                                ? "🍀"
                                : boost.boostType === "streak_shield"
                                  ? "🛡️"
                                  : "✨"}
                          </span>
                          <div>
                            <p className="font-medium text-white">
                              {boost.boostName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {boost.multiplier > 1
                                ? `${boost.multiplier}x multiplier`
                                : "Active"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {boost.usesRemaining !== undefined ? (
                            <p className="text-sm text-purple-400">
                              {boost.usesRemaining} uses left
                            </p>
                          ) : remainingMins > 0 ? (
                            <p className="text-sm text-purple-400">
                              {remainingMins} min left
                            </p>
                          ) : (
                            <p className="text-sm text-red-400">Expired</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Boost Effects Info */}
            <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-3">
                Boost Types
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>⭐</span>
                  <span className="text-gray-300">XP Multiplier</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🍀</span>
                  <span className="text-gray-300">Gem Luck</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span className="text-gray-300">Streak Shield</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💡</span>
                  <span className="text-gray-300">Free Hints</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRecipe(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border-2 border-purple-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <span className="text-6xl">{selectedRecipe.icon}</span>
                <h2 className="text-2xl font-bold text-white mt-3">
                  {selectedRecipe.name}
                </h2>
                <p className="text-gray-400 mt-1">
                  {selectedRecipe.description}
                </p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 mb-6">
                <h4 className="text-sm text-gray-400 mb-3">Required Gems:</h4>
                <div className="flex flex-wrap justify-center gap-4">
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    const gem = gemMap.get(ing.gemType);
                    const hasEnough = gem && gem.wholeGems >= ing.amount;
                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <GemDisplay
                          gemType={ing.gemType as GemType}
                          size="lg"
                          showName
                          animate={false}
                        />
                        <span
                          className={`mt-1 text-sm font-bold ${hasEnough ? "text-green-400" : "text-red-400"}`}
                        >
                          {gem?.wholeGems || 0}/{ing.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleCraft(selectedRecipe);
                    setSelectedRecipe(null);
                  }}
                  disabled={!canCraft(selectedRecipe)}
                  className={`
                    flex-1 py-3 rounded-xl font-medium
                    ${
                      canCraft(selectedRecipe)
                        ? "bg-purple-600 hover:bg-purple-500 text-white"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }
                  `}
                >
                  ⚗️ Craft Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
