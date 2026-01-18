"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

// Snowflake component
const Snowflake = ({ delay, duration, left, size }: {
  delay: number;
  duration: number;
  left: number;
  size: number;
}) => (
  <motion.div
    initial={{ y: -20, opacity: 0 }}
    animate={{
      y: "100vh",
      opacity: [0, 1, 1, 0],
      x: [0, 10, -10, 5, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "linear",
    }}
    style={{
      position: "absolute",
      left: `${left}%`,
      fontSize: `${size}px`,
      filter: "blur(0.5px)",
      textShadow: "0 0 5px rgba(255,255,255,0.5)",
      pointerEvents: "none",
      zIndex: 50,
    }}
  >
    *
  </motion.div>
);

// Generate random snowflakes
const generateSnowflakes = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 12,
    left: Math.random() * 100,
    size: 8 + Math.random() * 16,
  }));
};

// Time periods for day/night
type TimePeriod = "dawn" | "morning" | "noon" | "afternoon" | "dusk" | "night";

const getTimePeriod = (hour: number): TimePeriod => {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 14) return "noon";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
};

// Background gradients for each time period
const timeGradients: Record<TimePeriod, string> = {
  dawn: "linear-gradient(180deg, #1e3a5f 0%, #ff9a56 30%, #ffd89b 60%, #1e3a5f 100%)",
  morning: "linear-gradient(180deg, #87ceeb 0%, #b4d4e7 50%, #2d5a7b 100%)",
  noon: "linear-gradient(180deg, #4a90c2 0%, #87ceeb 30%, #2d5a7b 100%)",
  afternoon: "linear-gradient(180deg, #5a8fba 0%, #f4a460 40%, #2d5a7b 100%)",
  dusk: "linear-gradient(180deg, #1e3a5f 0%, #ff6b6b 30%, #c44569 50%, #1e3a5f 100%)",
  night: "linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 30%, #2d2d5a 60%, #0a0a1a 100%)",
};

// Overlay colors for blending with existing UI
const timeOverlays: Record<TimePeriod, string> = {
  dawn: "rgba(255, 180, 100, 0.1)",
  morning: "rgba(135, 206, 235, 0.05)",
  noon: "rgba(255, 255, 200, 0.05)",
  afternoon: "rgba(255, 200, 100, 0.08)",
  dusk: "rgba(255, 100, 100, 0.1)",
  night: "rgba(30, 30, 80, 0.15)",
};

// Stars for night sky
const Star = ({ top, left, delay, size }: {
  top: number;
  left: number;
  delay: number;
  size: number;
}) => (
  <motion.div
    animate={{
      opacity: [0.3, 1, 0.3],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 2 + Math.random() * 2,
      delay,
      repeat: Infinity,
    }}
    style={{
      position: "absolute",
      top: `${top}%`,
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      backgroundColor: "#fff",
      boxShadow: `0 0 ${size * 2}px rgba(255,255,255,0.8)`,
      pointerEvents: "none",
    }}
  />
);

// Generate stars
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: Math.random() * 60,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    size: 1 + Math.random() * 2,
  }));
};

interface AmbientEffectsProps {
  enableSnow?: boolean;
  enableDayNight?: boolean;
  snowIntensity?: "light" | "medium" | "heavy";
}

export function AmbientEffects({
  enableSnow = true,
  enableDayNight = true,
  snowIntensity = "medium",
}: AmbientEffectsProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("night");
  const [mounted, setMounted] = useState(false);

  // Snow count based on intensity
  const snowCount = {
    light: 15,
    medium: 30,
    heavy: 50,
  }[snowIntensity];

  // Generate snowflakes and stars once
  const snowflakes = useMemo(() => generateSnowflakes(snowCount), [snowCount]);
  const stars = useMemo(() => generateStars(40), []);

  // Update time period based on real time
  useEffect(() => {
    setMounted(true);

    const updateTime = () => {
      const hour = new Date().getHours();
      setTimePeriod(getTimePeriod(hour));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const isNight = timePeriod === "night" || timePeriod === "dusk" || timePeriod === "dawn";

  return (
    <>
      {/* Day/Night overlay */}
      {enableDayNight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: timeOverlays[timePeriod],
            pointerEvents: "none",
            zIndex: 40,
          }}
        />
      )}

      {/* Stars (only at night/dusk/dawn) */}
      {enableDayNight && isNight && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "60%",
            pointerEvents: "none",
            zIndex: 45,
            overflow: "hidden",
          }}
        >
          {stars.map((star) => (
            <Star key={star.id} {...star} />
          ))}
        </div>
      )}

      {/* Snow particles */}
      {enableSnow && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {snowflakes.map((flake) => (
            <Snowflake key={flake.id} {...flake} />
          ))}
        </div>
      )}

      {/* Moon (at night) */}
      {enableDayNight && timePeriod === "night" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2 }}
          style={{
            position: "fixed",
            top: "8%",
            right: "10%",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f5f5dc 0%, #e8e8d0 50%, #d4d4aa 100%)",
            boxShadow: "0 0 30px rgba(255, 255, 200, 0.5), 0 0 60px rgba(255, 255, 200, 0.3)",
            pointerEvents: "none",
            zIndex: 45,
          }}
        >
          {/* Moon craters */}
          <div style={{
            position: "absolute",
            top: "20%",
            left: "30%",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.1)",
          }} />
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.08)",
          }} />
          <div style={{
            position: "absolute",
            top: "60%",
            left: "25%",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.07)",
          }} />
        </motion.div>
      )}

      {/* Sun (during day) */}
      {enableDayNight && (timePeriod === "morning" || timePeriod === "noon" || timePeriod === "afternoon") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: [
              "0 0 40px rgba(255, 200, 50, 0.6)",
              "0 0 60px rgba(255, 200, 50, 0.8)",
              "0 0 40px rgba(255, 200, 50, 0.6)",
            ],
          }}
          transition={{
            duration: 2,
            boxShadow: { duration: 3, repeat: Infinity },
          }}
          style={{
            position: "fixed",
            top: timePeriod === "noon" ? "5%" : "15%",
            right: timePeriod === "morning" ? "30%" : timePeriod === "afternoon" ? "10%" : "20%",
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ffd700 0%, #ffb347 100%)",
            pointerEvents: "none",
            zIndex: 45,
          }}
        />
      )}

      {/* Time indicator (small, subtle) */}
      {enableDayNight && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "10px",
            padding: "4px 8px",
            borderRadius: "12px",
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(5px)",
            fontSize: "0.7em",
            color: "#fff",
            opacity: 0.6,
            pointerEvents: "none",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {timePeriod === "night" && "🌙"}
          {timePeriod === "dawn" && "🌅"}
          {timePeriod === "morning" && "🌤️"}
          {timePeriod === "noon" && "☀️"}
          {timePeriod === "afternoon" && "🌤️"}
          {timePeriod === "dusk" && "🌆"}
          <span style={{ textTransform: "capitalize" }}>{timePeriod}</span>
        </div>
      )}
    </>
  );
}
