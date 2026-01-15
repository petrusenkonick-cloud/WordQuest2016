"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

// Global ambient particles for the game world
export function AmbientParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    if (!mounted) return [];

    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 2 + Math.random() * 4,
      type: ["gold", "diamond", "emerald", "xp"][Math.floor(Math.random() * 4)] as
        | "gold"
        | "diamond"
        | "emerald"
        | "xp",
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 4,
    }));
  }, [mounted]);

  if (!mounted) return null;

  const colors = {
    gold: { bg: "#FCDB05", glow: "rgba(252, 219, 5, 0.6)" },
    diamond: { bg: "#4AEDD9", glow: "rgba(74, 237, 217, 0.6)" },
    emerald: { bg: "#17D049", glow: "rgba(23, 208, 73, 0.6)" },
    xp: { bg: "#7FFF00", glow: "rgba(127, 255, 0, 0.6)" },
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: colors[particle.type].bg,
            boxShadow: `0 0 ${particle.size * 2}px ${colors[particle.type].glow}`,
            borderRadius: particle.type === "xp" ? "50%" : "0",
          }}
          initial={{ bottom: -20, opacity: 0, scale: 0 }}
          animate={{
            bottom: ["0%", "100%"],
            opacity: [0, 0.8, 0.8, 0],
            scale: [0, 1, 1, 0.5],
            x: [0, Math.sin(particle.id) * 30, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// Sparkle effect for special moments
interface SparkleProps {
  count?: number;
  colors?: string[];
  size?: number;
  duration?: number;
}

export function Sparkles({
  count = 12,
  colors = ["#FCDB05", "#4AEDD9", "#17D049", "#FF9933"],
  size = 4,
  duration = 1,
}: SparkleProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360;
        const color = colors[i % colors.length];
        const distance = 50 + Math.random() * 50;

        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 0,
            }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              opacity: [1, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}

// XP orb collection effect
interface XPOrbsProps {
  count?: number;
  targetX?: number;
  targetY?: number;
  onComplete?: () => void;
}

export function XPOrbs({
  count = 8,
  targetX = 0,
  targetY = 0,
  onComplete,
}: XPOrbsProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[999]">
      {Array.from({ length: count }, (_, i) => {
        const startX = Math.random() * 200 - 100;
        const startY = Math.random() * 100 + 50;

        return (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              backgroundColor: "#7FFF00",
              boxShadow: "0 0 8px #7FFF00, 0 0 16px rgba(127, 255, 0, 0.5)",
              left: "50%",
              top: "50%",
            }}
            initial={{
              x: startX,
              y: startY,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x: [startX, startX * 0.5, targetX],
              y: [startY, startY * 0.3, targetY],
              scale: [0, 1.2, 0.5],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 1,
              delay: i * 0.05,
              ease: "easeInOut",
            }}
            onAnimationComplete={i === count - 1 ? onComplete : undefined}
          />
        );
      })}
    </div>
  );
}

// Block breaking particles
interface BlockBreakProps {
  color?: string;
  x: number;
  y: number;
  onComplete?: () => void;
}

export function BlockBreakParticles({
  color = "#8B5A2B",
  x,
  y,
  onComplete,
}: BlockBreakProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i / 12) * 360 + Math.random() * 30,
        distance: 30 + Math.random() * 40,
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="fixed pointer-events-none z-[999]" style={{ left: x, top: y }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            boxShadow: `inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.3)`,
          }}
          initial={{
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: Math.cos((particle.angle * Math.PI) / 180) * particle.distance,
            y: [
              0,
              Math.sin((particle.angle * Math.PI) / 180) * particle.distance - 20,
              Math.sin((particle.angle * Math.PI) / 180) * particle.distance + 50,
            ],
            rotate: particle.rotation + 720,
            scale: [1, 0.8, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          onAnimationComplete={particle.id === 0 ? onComplete : undefined}
        />
      ))}
    </div>
  );
}

// Confetti for celebrations
interface ConfettiProps {
  count?: number;
  duration?: number;
}

export function Confetti({ count = 50, duration = 3 }: ConfettiProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pieces = useMemo(() => {
    if (!mounted) return [];

    const colors = ["#FCDB05", "#4AEDD9", "#17D049", "#FF1A1A", "#9B5FC0", "#FF9933"];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.5,
      rotation: Math.random() * 720,
      drift: (Math.random() - 0.5) * 200,
    }));
  }, [mounted, count]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: -20,
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
            boxShadow: `0 0 4px ${piece.color}`,
          }}
          initial={{
            y: 0,
            x: 0,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: "100vh",
            x: piece.drift,
            rotate: piece.rotation,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration,
            delay: piece.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

// Torch glow effect
interface TorchGlowProps {
  intensity?: "low" | "medium" | "high";
}

export function TorchGlow({ intensity = "medium" }: TorchGlowProps) {
  const opacities = {
    low: 0.1,
    medium: 0.2,
    high: 0.3,
  };

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0"
      animate={{
        opacity: [opacities[intensity], opacities[intensity] * 1.2, opacities[intensity]],
      }}
      transition={{
        duration: 0.3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        background: `
          radial-gradient(ellipse at 10% 20%, rgba(255, 153, 51, ${opacities[intensity]}) 0%, transparent 40%),
          radial-gradient(ellipse at 90% 20%, rgba(255, 153, 51, ${opacities[intensity]}) 0%, transparent 40%),
          radial-gradient(ellipse at 50% 80%, rgba(255, 100, 50, ${opacities[intensity] * 0.7}) 0%, transparent 50%)
        `,
      }}
    />
  );
}

// Star burst for achievements/rewards
interface StarBurstProps {
  x: number;
  y: number;
  count?: number;
  onComplete?: () => void;
}

export function StarBurst({ x, y, count = 8, onComplete }: StarBurstProps) {
  return (
    <div className="fixed pointer-events-none z-[9999]" style={{ left: x, top: y }}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360;
        const distance = 60 + Math.random() * 40;

        return (
          <motion.div
            key={i}
            className="absolute text-[1.5em]"
            style={{
              filter: "drop-shadow(0 0 8px rgba(252, 219, 5, 0.8))",
            }}
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0],
              rotate: 360,
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.03,
              ease: "easeOut",
            }}
            onAnimationComplete={i === 0 ? onComplete : undefined}
          >
            ⭐
          </motion.div>
        );
      })}
    </div>
  );
}
