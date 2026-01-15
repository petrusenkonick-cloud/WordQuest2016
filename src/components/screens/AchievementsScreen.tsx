"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AchievementCard } from "@/components/ui/Card";
import { getEmoji } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  reward: { diamonds?: number; emeralds?: number; gold?: number };
  unlocked: boolean;
  progress: number;
  target: number;
}

// Static achievements for fallback when Convex is not available
const STATIC_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first",
    name: "First Steps",
    desc: "Complete 1 quest",
    icon: "baby",
    reward: { diamonds: 50 },
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "streak3",
    name: "Hot Streak",
    desc: "3 day streak",
    icon: "flame",
    reward: { diamonds: 100 },
    unlocked: false,
    progress: 0,
    target: 3,
  },
  {
    id: "streak7",
    name: "Weekly Warrior",
    desc: "7 day streak",
    icon: "swords",
    reward: { diamonds: 250, emeralds: 100 },
    unlocked: false,
    progress: 0,
    target: 7,
  },
  {
    id: "words50",
    name: "Word Collector",
    desc: "Learn 50 words",
    icon: "book-open",
    reward: { diamonds: 150 },
    unlocked: false,
    progress: 0,
    target: 50,
  },
  {
    id: "perfect",
    name: "Perfect Score",
    desc: "Complete level with no mistakes",
    icon: "target",
    reward: { emeralds: 100 },
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "champion",
    name: "Champion",
    desc: "Complete all levels",
    icon: "trophy",
    reward: { diamonds: 500, emeralds: 250 },
    unlocked: false,
    progress: 0,
    target: 6,
  },
  {
    id: "words100",
    name: "Vocabulary Master",
    desc: "Learn 100 words",
    icon: "graduation-cap",
    reward: { diamonds: 300, gold: 100 },
    unlocked: false,
    progress: 0,
    target: 100,
  },
  {
    id: "streak30",
    name: "Monthly Master",
    desc: "30 day streak",
    icon: "crown",
    reward: { diamonds: 1000, emeralds: 500, gold: 250 },
    unlocked: false,
    progress: 0,
    target: 30,
  },
];

export function AchievementsScreen() {
  const player = useAppStore((s) => s.player);
  const playerId = player.id as Id<"players"> | null;

  // Query achievements from Convex
  const convexAchievements = useQuery(
    api.achievements.getAchievements,
    playerId ? { playerId } : "skip"
  );

  // Use Convex data if available, otherwise use static with player progress
  const achievements: Achievement[] = convexAchievements
    ? convexAchievements.map((a) => ({
        id: a.id,
        name: a.name,
        desc: a.desc,
        icon: a.icon,
        reward: a.reward,
        unlocked: a.unlocked,
        progress: a.progress,
        target: a.target,
      }))
    : STATIC_ACHIEVEMENTS.map((a) => {
        // Calculate progress from local player state
        let progress = 0;
        switch (a.id) {
          case "first":
          case "champion":
            progress = player.questsCompleted;
            break;
          case "streak3":
          case "streak7":
          case "streak30":
            progress = player.streak;
            break;
          case "words50":
          case "words100":
            progress = player.wordsLearned;
            break;
          case "perfect":
            progress = player.perfectLevels;
            break;
        }
        return {
          ...a,
          progress,
          unlocked: progress >= a.target,
        };
      });

  const formatReward = (reward: Achievement["reward"]) => {
    const parts = [];
    if (reward.diamonds) parts.push(`💎${reward.diamonds}`);
    if (reward.emeralds) parts.push(`🟢${reward.emeralds}`);
    if (reward.gold) parts.push(`🪙${reward.gold}`);
    return parts.join(" ");
  };

  return (
    <div className="animate-screen-in">
      <h2 className="font-pixel text-[0.9em] text-white text-shadow-lg mb-4">
        🏆 ACHIEVEMENTS
      </h2>

      <div className="space-y-2.5">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            icon={getEmoji(achievement.icon)}
            name={achievement.name}
            desc={achievement.desc}
            reward={formatReward(achievement.reward)}
            unlocked={achievement.unlocked}
            progress={achievement.progress}
            target={achievement.target}
          />
        ))}
      </div>
    </div>
  );
}
