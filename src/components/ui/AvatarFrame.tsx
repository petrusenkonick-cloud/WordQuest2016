"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { TIERS, getTierForLevel } from "@/lib/tierSystem";

interface AvatarFrameProps {
  level: number;
  size?: number;
  children: ReactNode;
  showTierName?: boolean;
}

export function AvatarFrame({ level, size = 100, children, showTierName = false }: AvatarFrameProps) {
  const tier = getTierForLevel(level);
  const tierNumber = tier.tier;

  // Get tier-specific styles
  const getFrameClassName = () => {
    switch (tierNumber) {
      case 3: return "animate-pulse-blue";
      case 4: return "animate-glow-purple";
      case 6: return "animate-fire-glow";
      case 7: return "animate-shimmer";
      case 8: return "animate-cosmic-pulse";
      case 9: return "animate-rainbow";
      default: return "";
    }
  };

  // Tier 1: Apprentice - Simple gray border
  if (tierNumber === 1) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            border: `2px solid ${tier.color}`,
            background: "linear-gradient(135deg, #374151 0%, #4B5563 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${size * 0.5}px`,
          }}
        >
          {children}
        </div>
        {showTierName && <TierLabel tier={tier} />}
      </div>
    );
  }

  // Tier 2: Scholar - Green border with inner glow
  if (tierNumber === 2) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            border: `3px solid ${tier.color}`,
            background: "linear-gradient(135deg, #166534 0%, #22C55E 100%)",
            boxShadow: `inset 0 0 15px ${tier.glowColor}, 0 0 10px ${tier.glowColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${size * 0.5}px`,
          }}
        >
          {children}
        </div>
        {showTierName && <TierLabel tier={tier} />}
      </div>
    );
  }

  // Tier 3: Wizard - Animated pulse blue border
  if (tierNumber === 3) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <motion.div
          animate={{
            boxShadow: [
              "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
              "0 0 30px rgba(59, 130, 246, 0.7), 0 0 60px rgba(59, 130, 246, 0.5)",
              "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            border: `4px solid ${tier.color}`,
            background: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${size * 0.5}px`,
          }}
        >
          {children}
        </motion.div>
        {showTierName && <TierLabel tier={tier} />}
      </div>
    );
  }

  // Tier 4: Sorcerer - Animated gradient purple border
  if (tierNumber === 4) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <motion.div
          animate={{
            boxShadow: [
              "0 0 25px rgba(139, 92, 246, 0.5), 0 0 50px rgba(139, 92, 246, 0.3)",
              "0 0 35px rgba(139, 92, 246, 0.7), 0 0 70px rgba(139, 92, 246, 0.5)",
              "0 0 25px rgba(139, 92, 246, 0.5), 0 0 50px rgba(139, 92, 246, 0.3)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            border: `4px solid transparent`,
            background: `linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%) padding-box, ${tier.gradient} border-box`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${size * 0.5}px`,
          }}
        >
          {children}
        </motion.div>
        {showTierName && <TierLabel tier={tier} />}
      </div>
    );
  }

  // Tier 5: Archmage - Golden ornate frame
  if (tierNumber === 5) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            border: `5px solid ${tier.color}`,
            background: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)",
            boxShadow: `0 0 30px rgba(245, 158, 11, 0.6), 0 0 60px rgba(245, 158, 11, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.3)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${size * 0.5}px`,
            position: "relative",
          }}
        >
          {children}
          {/* Corner ornaments */}
          <span style={{ position: "absolute", top: "-8px", left: "50%", transform: "translateX(-50%)", fontSize: `${size * 0.15}px` }}>👑</span>
        </div>
        {showTierName && <TierLabel tier={tier} />}
      </div>
    );
  }

  // Tier 6: Grand Master - Fiery red animated frame
  if (tierNumber === 6) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <motion.div
          animate={{
            boxShadow: [
              "0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3)",
              "0 0 40px rgba(239, 68, 68, 0.8), 0 0 80px rgba(239, 68, 68, 0.5)",
              "0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3)",
            ],
            filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            border: `5px solid ${tier.color}`,
            background: "linear-gradient(135deg, #B91C1C 0%, #EF4444 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${size * 0.5}px`,
          }}
        >
          {children}
        </motion.div>
        {showTierName && <TierLabel tier={tier} />}
      </div>
    );
  }

  // Tier 7: Legendary - Diamond crystalline effect
  if (tierNumber === 7) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <motion.div
          animate={{
            filter: [
              "brightness(1) hue-rotate(0deg)",
              "brightness(1.2) hue-rotate(5deg)",
              "brightness(1) hue-rotate(0deg)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            border: `5px solid ${tier.color}`,
            background: "linear-gradient(135deg, #BE185D 0%, #EC4899 50%, #F9A8D4 100%)",
            boxShadow: `0 0 35px ${tier.glowColor}, 0 0 70px rgba(236, 72, 153, 0.4)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${size * 0.5}px`,
          }}
        >
          {children}
        </motion.div>
        {showTierName && <TierLabel tier={tier} />}
      </div>
    );
  }

  // Tier 8: Mythic - Cosmic swirl with stars
  if (tierNumber === 8) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <motion.div
          animate={{
            boxShadow: [
              "0 0 40px rgba(6, 182, 212, 0.5), 0 0 80px rgba(6, 182, 212, 0.3)",
              "0 0 50px rgba(6, 182, 212, 0.7), 0 0 100px rgba(6, 182, 212, 0.5)",
              "0 0 40px rgba(6, 182, 212, 0.5), 0 0 80px rgba(6, 182, 212, 0.3)",
            ],
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            border: `5px solid ${tier.color}`,
            background: "linear-gradient(135deg, #0E7490 0%, #06B6D4 50%, #67E8F9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${size * 0.5}px`,
            position: "relative",
          }}
        >
          {children}
        </motion.div>
        {/* Floating stars */}
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            pointerEvents: "none",
          }}
        >
          <span style={{ position: "absolute", top: "-5px", left: "20%", fontSize: `${size * 0.12}px` }}>✨</span>
          <span style={{ position: "absolute", top: "20%", right: "-5px", fontSize: `${size * 0.1}px` }}>⭐</span>
          <span style={{ position: "absolute", bottom: "10%", left: "-5px", fontSize: `${size * 0.1}px` }}>✨</span>
        </motion.span>
        {showTierName && <TierLabel tier={tier} />}
      </div>
    );
  }

  // Tier 9: Immortal - Rainbow holographic shimmer
  if (tierNumber === 9) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <motion.div
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            filter: [
              "brightness(1) saturate(1)",
              "brightness(1.2) saturate(1.3)",
              "brightness(1) saturate(1)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            border: `6px solid transparent`,
            background: `linear-gradient(135deg, #1F2937 0%, #374151 100%) padding-box,
              linear-gradient(90deg, #EF4444, #F59E0B, #22C55E, #3B82F6, #8B5CF6, #EC4899, #EF4444) border-box`,
            backgroundSize: "400% 400%",
            boxShadow: `0 0 50px rgba(255, 215, 0, 0.5), 0 0 100px rgba(255, 215, 0, 0.3)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${size * 0.5}px`,
            position: "relative",
          }}
        >
          {children}
        </motion.div>
        {/* Crown on top */}
        <motion.span
          animate={{ y: [-2, 2, -2], rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-15px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: `${size * 0.25}px`,
          }}
        >
          👑
        </motion.span>
        {showTierName && <TierLabel tier={tier} />}
      </div>
    );
  }

  // Fallback
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: `2px solid #666`,
        background: "linear-gradient(135deg, #333 0%, #555 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${size * 0.5}px`,
      }}
    >
      {children}
    </div>
  );
}

// Tier label component
function TierLabel({ tier }: { tier: typeof TIERS[number] }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "-25px",
        left: "50%",
        transform: "translateX(-50%)",
        background: tier.gradient,
        padding: "2px 10px",
        borderRadius: "10px",
        fontSize: "0.75em",
        fontWeight: "bold",
        whiteSpace: "nowrap",
        boxShadow: `0 2px 8px ${tier.glowColor}`,
      }}
    >
      {tier.name}
    </div>
  );
}
