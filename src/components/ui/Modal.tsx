"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 z-[5000] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            className={cn(
              "stone-gradient border-[7px] border-[var(--obsidian)] p-6 max-w-[420px] w-full text-center",
              "shadow-[inset_4px_4px_0_rgba(255,255,255,0.2),0_0_50px_rgba(0,0,0,0.8)]",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-pixel text-[0.9em] text-[var(--gold)] text-shadow-lg mb-4">
      {children}
    </h2>
  );
}

export function ModalRewards({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center gap-4 my-5">{children}</div>
  );
}

export function ModalRewardItem({
  icon,
  amount,
}: {
  icon: string;
  amount: number | string;
}) {
  return (
    <div className="text-center">
      <div className="text-[2.2em] animate-float">{icon}</div>
      <div className="font-pixel text-[0.6em] text-white mt-1">+{amount}</div>
    </div>
  );
}
