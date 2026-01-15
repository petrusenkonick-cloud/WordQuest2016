"use client";

import { Button } from "@/components/ui/Button";
import {
  GameContainer,
  WordBank,
  LearningBox,
} from "./GameContainer";

const WORD_BANK = [
  "MIRROR", "REQUIRE", "FURNISH", "STAINLESS", "PURE",
  "WHIRL", "CURRENT", "NURTURE", "IRRITATE", "MIRACLE"
];

interface CrosswordGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
}

export function CrosswordGame({
  onExit,
  onComplete,
}: CrosswordGameProps) {
  return (
    <GameContainer
      title="WORD MAP"
      icon="🗺️"
      currentQuestion={5}
      totalQuestions={10}
      onExit={onExit}
    >
      <LearningBox title="🗺️ VOCABULARY MAP">
        <p>Match clues to words!</p>
      </LearningBox>

      <WordBank words={WORD_BANK} onWordClick={() => {}} />

      <div className="grid grid-cols-2 gap-3 my-3 max-[480px]:grid-cols-1">
        <LearningBox title="→ ACROSS:">
          <p>5. Reflective surface (6)</p>
          <p>6. To need something (7)</p>
          <p>7. Provide furniture (7)</p>
          <p>9. Without marks (9)</p>
          <p>10. Clean, pure (4)</p>
        </LearningBox>

        <LearningBox title="↓ DOWN:">
          <p>1. Spinning movement (5)</p>
          <p>2. Flow of water (7)</p>
          <p>3. Care for growth (7)</p>
          <p>4. To annoy (8)</p>
          <p>8. Extraordinary event (7)</p>
        </LearningBox>
      </div>

      <p className="text-white text-center my-3">
        Write answers on paper, then click below!
      </p>

      <div className="text-center">
        <Button variant="primary" onClick={() => onComplete(10, 0)}>
          ✅ DONE!
        </Button>
      </div>
    </GameContainer>
  );
}
