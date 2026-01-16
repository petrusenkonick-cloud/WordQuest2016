"use client";

import { AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { GemDropNotification } from "./GemDropAnimation";
import { GemType } from "@/lib/gemTypes";

export function GemDropProvider({ children }: { children: React.ReactNode }) {
  const pendingDrops = useAppStore((state) => state.gems.pendingDrops);
  const removeGemDrop = useAppStore((state) => state.removeGemDrop);

  // Only show the most recent drop as a notification
  const latestDrop = pendingDrops[pendingDrops.length - 1];

  return (
    <>
      {children}

      {/* Gem Drop Notifications */}
      <AnimatePresence>
        {latestDrop && (
          <GemDropNotification
            key={latestDrop.id}
            gemType={latestDrop.gemType as GemType}
            isWhole={latestDrop.isWhole}
            onDismiss={() => removeGemDrop(latestDrop.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
