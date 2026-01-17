"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface LeaderboardPodiumProps {
  playerId?: Id<"players"> | null;
  onViewFull?: () => void;
}

// Skin emoji mapping for legacy text values
const SKIN_EMOJI_MAP: Record<string, string> = {
  boy: "👦",
  girl: "👧",
  steve: "🧑",
  alex: "👧",
  knight: "🦸",
  wizard: "🧙",
  ninja: "🥷",
  robot: "🤖",
  elf: "🧝",
  prince: "🤴",
  princess: "👸",
  warrior: "⚔️",
  mage: "🔮",
};

const getSkinEmoji = (skin: string | undefined): string => {
  if (!skin) return "🧙";
  // If it's already an emoji (starts with emoji-like character), return as is
  if (skin.length <= 2 && !/^[a-zA-Z]/.test(skin)) return skin;
  // Otherwise, look up in mapping
  return SKIN_EMOJI_MAP[skin.toLowerCase()] || "🧙";
};

// Crown SVG components with animations
const GoldCrown = () => (
  <motion.svg
    viewBox="0 0 32 24"
    className="w-8 h-6"
    initial={{ scale: 0, rotate: -15 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
  >
    {/* Crown base */}
    <motion.path
      d="M2 20 L6 8 L10 14 L16 4 L22 14 L26 8 L30 20 Z"
      fill="url(#goldGradient)"
      stroke="#B8860B"
      strokeWidth="1.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    />
    {/* Gems */}
    <circle cx="16" cy="12" r="2.5" fill="#FF4444" />
    <circle cx="8" cy="14" r="2" fill="#4488FF" />
    <circle cx="24" cy="14" r="2" fill="#44FF88" />
    {/* Shine */}
    <motion.ellipse
      cx="10"
      cy="10"
      rx="1.5"
      ry="0.8"
      fill="rgba(255,255,255,0.6)"
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFE566" />
        <stop offset="50%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#CC9900" />
      </linearGradient>
    </defs>
  </motion.svg>
);

const SilverCrown = () => (
  <motion.svg
    viewBox="0 0 28 20"
    className="w-6 h-5"
    initial={{ scale: 0, rotate: 15 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
  >
    <motion.path
      d="M2 17 L5 7 L9 12 L14 3 L19 12 L23 7 L26 17 Z"
      fill="url(#silverGradient)"
      stroke="#708090"
      strokeWidth="1.2"
    />
    <circle cx="14" cy="10" r="2" fill="#6699CC" />
    <defs>
      <linearGradient id="silverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E8E8E8" />
        <stop offset="50%" stopColor="#C0C0C0" />
        <stop offset="100%" stopColor="#909090" />
      </linearGradient>
    </defs>
  </motion.svg>
);

const BronzeCrown = () => (
  <motion.svg
    viewBox="0 0 24 18"
    className="w-5 h-4"
    initial={{ scale: 0, rotate: -15 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
  >
    <motion.path
      d="M2 15 L4 6 L8 10 L12 2 L16 10 L20 6 L22 15 Z"
      fill="url(#bronzeGradient)"
      stroke="#8B4513"
      strokeWidth="1"
    />
    <circle cx="12" cy="9" r="1.8" fill="#CC6633" />
    <defs>
      <linearGradient id="bronzeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#DDA15E" />
        <stop offset="50%" stopColor="#CD7F32" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>
    </defs>
  </motion.svg>
);

// Animated sparkle effect
const Sparkle = ({ delay = 0, x = 0, y = 0 }: { delay?: number; x?: number; y?: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      rotate: [0, 180],
    }}
    transition={{
      duration: 1.5,
      delay,
      repeat: Infinity,
      repeatDelay: 2,
    }}
  >
    <span className="text-yellow-300 text-xs">✦</span>
  </motion.div>
);

export function LeaderboardPodium({ playerId, onViewFull }: LeaderboardPodiumProps) {
  // Fetch weekly leaderboard top 3
  const leaderboard = useQuery(api.leaderboards.getLeaderboard, {
    type: "weekly",
    limit: 3,
  });

  // Get current player's rank
  const playerRank = useQuery(
    api.leaderboards.getPlayerRank,
    playerId ? { playerId, type: "weekly" } : "skip"
  );

  const topPlayers = leaderboard?.entries || [];

  // Define player type for display
  type DisplayPlayer = {
    displayName: string;
    skin?: string;
    normalizedScore: number;
    streak?: number;
    rank: number;
  };

  // Fill empty spots with placeholder if less than 3 players
  // Cast to any to access skin field (added to API but types not regenerated)
  const filledPlayers: DisplayPlayer[] = topPlayers.map(p => ({
    displayName: p.displayName,
    skin: (p as { skin?: string }).skin,
    normalizedScore: p.normalizedScore,
    streak: p.streak,
    rank: p.rank,
  }));

  while (filledPlayers.length < 3) {
    filledPlayers.push({
      displayName: "???",
      skin: "❓",
      normalizedScore: 0,
      streak: 0,
      rank: filledPlayers.length + 1,
    });
  }

  const displayPlayers = filledPlayers.slice(0, 3);

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = displayPlayers.length >= 3
    ? [displayPlayers[1], displayPlayers[0], displayPlayers[2]]
    : displayPlayers;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={onViewFull}
      className="relative overflow-hidden cursor-pointer select-none"
      style={{
        background: "linear-gradient(180deg, rgba(30, 20, 50, 0.95) 0%, rgba(45, 25, 70, 0.9) 50%, rgba(25, 15, 45, 0.95) 100%)",
        borderRadius: "16px",
        padding: "14px 16px 12px",
        marginBottom: "15px",
        border: "3px solid transparent",
        backgroundClip: "padding-box",
        position: "relative",
      }}
    >
      {/* Animated border glow */}
      <div
        style={{
          position: "absolute",
          inset: "-3px",
          borderRadius: "19px",
          background: "linear-gradient(135deg, #FFD700 0%, #FF6B35 25%, #FFD700 50%, #FFA500 75%, #FFD700 100%)",
          backgroundSize: "300% 300%",
          animation: "borderGlow 4s ease infinite",
          zIndex: -1,
        }}
      />

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: "14px" }}>
        {/* Pixel grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage: `
              linear-gradient(rgba(255,215,0,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,215,0,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "8px 8px",
          }}
        />

        {/* Floating particles */}
        <Sparkle delay={0} x={10} y={20} />
        <Sparkle delay={0.5} x={85} y={15} />
        <Sparkle delay={1} x={50} y={5} />
        <Sparkle delay={1.5} x={25} y={35} />
        <Sparkle delay={2} x={75} y={40} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-2xl"
            animate={{
              rotate: [0, -10, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            🏆
          </motion.span>
          <div>
            <h3 style={{
              fontSize: "0.95em",
              fontWeight: "bold",
              color: "#FFD700",
              textShadow: "0 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(255,215,0,0.3)",
              margin: 0,
              letterSpacing: "0.5px",
            }}>
              TOP WIZARDS
            </h3>
            <span style={{
              fontSize: "0.7em",
              color: "#A78BFA",
              textTransform: "uppercase",
            }}>
              This Week
            </span>
          </div>
        </div>

        {/* View all button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)",
            borderRadius: "8px",
            padding: "6px 10px",
            fontSize: "0.75em",
            color: "#C4B5FD",
            border: "1px solid rgba(139, 92, 246, 0.4)",
          }}
        >
          View All →
        </motion.div>
      </div>

      {/* Podium Container */}
      <div className="flex items-end justify-center gap-2" style={{ minHeight: "100px" }}>
        {podiumOrder.map((player, index) => {
          // Determine actual rank position (0=2nd, 1=1st, 2=3rd)
          const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
          const isFirst = actualRank === 1;
          const isSecond = actualRank === 2;
          const isThird = actualRank === 3;

          // Podium heights
          const podiumHeight = isFirst ? 60 : isSecond ? 45 : 35;

          // Colors for each rank
          const podiumColors = isFirst
            ? { top: "#FFD700", mid: "#DAA520", bottom: "#B8860B", glow: "rgba(255,215,0,0.4)" }
            : isSecond
            ? { top: "#C0C0C0", mid: "#A8A8A8", bottom: "#808080", glow: "rgba(192,192,192,0.3)" }
            : { top: "#CD7F32", mid: "#B87333", bottom: "#8B4513", glow: "rgba(205,127,50,0.3)" };

          return (
            <motion.div
              key={actualRank}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.15, duration: 0.4 }}
              className="flex flex-col items-center"
              style={{ flex: isFirst ? 1.2 : 1, maxWidth: isFirst ? "120px" : "100px" }}
            >
              {/* Crown */}
              <div className="relative mb-1">
                {isFirst && <GoldCrown />}
                {isSecond && <SilverCrown />}
                {isThird && <BronzeCrown />}
              </div>

              {/* Avatar/Name Card */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  background: `linear-gradient(180deg, ${podiumColors.top}22 0%, ${podiumColors.mid}33 100%)`,
                  borderRadius: "10px",
                  padding: "8px 6px",
                  width: "100%",
                  textAlign: "center",
                  border: `2px solid ${podiumColors.top}66`,
                  marginBottom: "-1px",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {/* Player avatar/skin */}
                <motion.div
                  animate={isFirst ? {
                    y: [0, -3, 0],
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    fontSize: isFirst ? "1.6em" : "1.3em",
                    marginBottom: "4px",
                  }}
                >
                  {getSkinEmoji(player?.skin)}
                </motion.div>

                {/* Name */}
                <div style={{
                  fontSize: isFirst ? "0.75em" : "0.68em",
                  fontWeight: "bold",
                  color: podiumColors.top,
                  textShadow: `0 1px 2px rgba(0,0,0,0.5)`,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {player?.displayName || "???"}
                </div>

                {/* Score */}
                <div style={{
                  fontSize: "0.65em",
                  color: "#A78BFA",
                  marginTop: "2px",
                }}>
                  ⭐ {player?.normalizedScore?.toLocaleString() || 0}
                </div>
              </motion.div>

              {/* Podium Block - Minecraft style */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: podiumHeight }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5, type: "spring" }}
                style={{
                  width: "100%",
                  background: `linear-gradient(180deg, ${podiumColors.top} 0%, ${podiumColors.mid} 40%, ${podiumColors.bottom} 100%)`,
                  borderRadius: "0 0 6px 6px",
                  position: "relative",
                  boxShadow: `
                    inset 3px 0 0 rgba(255,255,255,0.2),
                    inset -3px 0 0 rgba(0,0,0,0.3),
                    0 4px 8px rgba(0,0,0,0.4),
                    0 0 20px ${podiumColors.glow}
                  `,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Rank number */}
                <span style={{
                  fontSize: isFirst ? "1.4em" : "1.1em",
                  fontWeight: "bold",
                  color: "rgba(0,0,0,0.4)",
                  textShadow: "0 1px 0 rgba(255,255,255,0.3)",
                }}>
                  {actualRank}
                </span>

                {/* Pixel texture overlay */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.1,
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: "4px 4px",
                  borderRadius: "0 0 6px 6px",
                }}
              />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Current player rank (if not in top 3) */}
      <AnimatePresence>
        {playerRank && playerRank.rank > 3 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: "10px",
              paddingTop: "10px",
              borderTop: "1px solid rgba(139, 92, 246, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "#A78BFA", fontSize: "0.8em" }}>Your Rank:</span>
            <span style={{
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              borderRadius: "8px",
              padding: "4px 12px",
              fontSize: "0.85em",
              fontWeight: "bold",
              color: "white",
            }}>
              #{playerRank.rank}
            </span>
            <span style={{ color: "#888", fontSize: "0.75em" }}>
              of {playerRank.total}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
