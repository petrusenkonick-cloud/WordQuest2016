"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { GemDisplay, ShardDisplay } from "./GemDisplay";
import {
  GemType,
  GEM_CONFIG,
  RARITY_CONFIG,
  GEM_COLLECTIONS,
} from "@/lib/gemTypes";
import { useState } from "react";

interface GemInventoryProps {
  playerId: Id<"players">;
  onGemClick?: (gemType: GemType) => void;
}

type Tab = "all" | "collections";

export function GemInventory({ playerId, onGemClick }: GemInventoryProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const playerGems = useQuery(api.gems.getPlayerGems, { playerId });
  const collections = useQuery(api.gems.getCollectionProgress, { playerId });

  if (!playerGems) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Create a map for easy lookup
  const gemMap = new Map(playerGems.map((g) => [g.gemType, g]));

  // Group gems by rarity
  const gemsByRarity = Object.values(GEM_CONFIG).reduce(
    (acc, gem) => {
      if (!acc[gem.rarity]) acc[gem.rarity] = [];
      acc[gem.rarity].push(gem.id);
      return acc;
    },
    {} as Record<string, GemType[]>
  );

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "all", label: "All Gems", icon: "💎" },
    { id: "collections", label: "Collections", icon: "📚" },
  ];

  return (
    <div className="bg-gray-900/50 rounded-2xl p-4 border border-purple-500/30">
      {/* Tab navigation */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2 px-4 rounded-xl font-medium transition-all
              ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }
            `}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "all" ? (
          <motion.div
            key="all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {playerGems.reduce((sum, g) => sum + g.wholeGems, 0)}
                </p>
                <p className="text-xs text-gray-400">Total Gems</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {new Set(playerGems.filter((g) => g.wholeGems > 0).map((g) => g.gemType)).size}
                </p>
                <p className="text-xs text-gray-400">Types Found</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {playerGems.reduce((sum, g) => sum + g.totalFound, 0)}
                </p>
                <p className="text-xs text-gray-400">Total Found</p>
              </div>
            </div>

            {/* Gems grid by rarity */}
            {(["legendary", "epic", "rare", "uncommon", "common"] as const).map(
              (rarity) => {
                const gems = gemsByRarity[rarity] || [];
                const rarityConfig = RARITY_CONFIG[rarity];

                return (
                  <div key={rarity}>
                    <h3
                      className="text-sm font-medium mb-2 flex items-center gap-2"
                      style={{ color: rarityConfig.color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: rarityConfig.color }}
                      />
                      {rarityConfig.name}
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {gems.map((gemType) => {
                        const gemData = gemMap.get(gemType);
                        const wholeGems = gemData?.wholeGems || 0;
                        const shards = gemData?.shards || 0;

                        return (
                          <GemDisplay
                            key={gemType}
                            gemType={gemType}
                            count={wholeGems}
                            shards={shards}
                            size="lg"
                            showCount={wholeGems > 0}
                            showShards={shards > 0}
                            showName
                            disabled={wholeGems === 0 && shards === 0}
                            onClick={
                              onGemClick ? () => onGemClick(gemType) : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}

            {/* Shards in progress */}
            {playerGems.some((g) => g.shards > 0) && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-gray-400">
                  Shards in Progress
                </h3>
                <div className="space-y-2">
                  {playerGems
                    .filter((g) => g.shards > 0)
                    .map((g) => (
                      <ShardDisplay
                        key={g.gemType}
                        gemType={g.gemType as GemType}
                        shards={g.shards}
                      />
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="collections"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {GEM_COLLECTIONS.map((collection) => {
              const progress = collections?.find((c) => c.id === collection.id);
              const isComplete = progress?.isComplete || false;
              const bonusClaimed = progress?.bonusClaimed || false;

              return (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  ownedGems={
                    new Set(
                      playerGems.filter((g) => g.wholeGems > 0).map((g) => g.gemType)
                    )
                  }
                  isComplete={isComplete}
                  bonusClaimed={bonusClaimed}
                  playerId={playerId}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Collection card component
function CollectionCard({
  collection,
  ownedGems,
  isComplete,
  bonusClaimed,
  playerId,
}: {
  collection: (typeof GEM_COLLECTIONS)[0];
  ownedGems: Set<string>;
  isComplete: boolean;
  bonusClaimed: boolean;
  playerId: Id<"players">;
}) {
  const progress = collection.requiredGems.filter((g) => ownedGems.has(g)).length;

  return (
    <motion.div
      className={`
        relative p-4 rounded-xl border-2 transition-all
        ${
          isComplete
            ? bonusClaimed
              ? "bg-green-900/20 border-green-500/50"
              : "bg-purple-900/30 border-purple-500"
            : "bg-gray-800/50 border-gray-700"
        }
      `}
      whileHover={{ scale: 1.01 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-bold text-white">{collection.name}</h4>
          <p className="text-xs text-gray-400">{collection.description}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-purple-400">
            {progress}/{collection.requiredGems.length}
          </p>
          <p className="text-xs text-gray-500">collected</p>
        </div>
      </div>

      {/* Required gems */}
      <div className="flex flex-wrap gap-2 mb-3">
        {collection.requiredGems.map((gemType) => {
          const owned = ownedGems.has(gemType);
          return (
            <GemDisplay
              key={gemType}
              gemType={gemType as GemType}
              size="sm"
              disabled={!owned}
              animate={false}
            />
          );
        })}
      </div>

      {/* Reward */}
      <div
        className={`
        flex items-center justify-between p-2 rounded-lg
        ${isComplete ? "bg-green-900/30" : "bg-gray-900/50"}
      `}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🍀</span>
          <span className="text-sm text-gray-300">
            +{collection.reward.luckBonus}% Luck Bonus
          </span>
        </div>
        {isComplete && !bonusClaimed && (
          <motion.button
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Claim!
          </motion.button>
        )}
        {bonusClaimed && (
          <span className="text-green-400 text-sm flex items-center gap-1">
            <span>✓</span> Claimed
          </span>
        )}
      </div>

      {/* Special reward */}
      {collection.reward.specialReward && (
        <div className="mt-2 text-center">
          <span className="text-xs text-yellow-400">
            🌟 {collection.reward.specialReward}
          </span>
        </div>
      )}

      {/* Completion checkmark */}
      {isComplete && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-lg">✓</span>
        </div>
      )}
    </motion.div>
  );
}

// Compact gem counter for HUD
export function GemCounter({ playerId }: { playerId: Id<"players"> }) {
  const playerGems = useQuery(api.gems.getPlayerGems, { playerId });

  const totalGems = playerGems?.reduce((sum, g) => sum + g.wholeGems, 0) || 0;
  const totalShards = playerGems?.reduce((sum, g) => sum + g.shards, 0) || 0;

  return (
    <div className="flex items-center gap-2 bg-gray-900/80 px-3 py-1.5 rounded-full border border-purple-500/30">
      <span className="text-lg">💎</span>
      <span className="font-bold text-purple-400">{totalGems}</span>
      {totalShards > 0 && (
        <span className="text-xs text-gray-500">+{totalShards}✦</span>
      )}
    </div>
  );
}
