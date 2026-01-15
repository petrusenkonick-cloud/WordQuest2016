"use client";

import { Modal, ModalTitle, ModalRewards, ModalRewardItem } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    name: string;
    icon: string;
    desc: string;
    reward: {
      diamonds?: number;
      emeralds?: number;
      gold?: number;
    };
  } | null;
}

export function AchievementModal({
  isOpen,
  onClose,
  achievement,
}: AchievementModalProps) {
  if (!achievement) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalTitle>🏆 ACHIEVEMENT UNLOCKED!</ModalTitle>

      <div className="text-[3em] my-4 animate-float">{achievement.icon}</div>

      <h3 className="font-pixel text-[0.7em] text-[var(--gold)]">
        {achievement.name}
      </h3>
      <p className="text-[#AAA] my-2.5">{achievement.desc}</p>

      <ModalRewards>
        {achievement.reward.diamonds && (
          <ModalRewardItem icon="💎" amount={achievement.reward.diamonds} />
        )}
        {achievement.reward.emeralds && (
          <ModalRewardItem icon="🟢" amount={achievement.reward.emeralds} />
        )}
        {achievement.reward.gold && (
          <ModalRewardItem icon="🪙" amount={achievement.reward.gold} />
        )}
      </ModalRewards>

      <Button variant="gold" onClick={onClose} className="w-full justify-center mt-4">
        AWESOME!
      </Button>
    </Modal>
  );
}
