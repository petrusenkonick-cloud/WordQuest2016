"use client";

import { useTTS } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SpeakButtonProps {
  text: string;
  language?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  variant?: "default" | "minimal" | "pill";
  className?: string;
  disabled?: boolean;
  pitch?: number;
  speed?: "slow" | "normal" | "fast";
}

/**
 * Reusable speak button that uses Web Speech API
 *
 * Features:
 * - Click to speak, click again to stop
 * - Visual feedback when speaking
 * - Supports multiple languages
 * - Child-friendly higher pitch option
 */
export function SpeakButton({
  text,
  language = "en-US",
  size = "md",
  showLabel = false,
  variant = "default",
  className,
  disabled = false,
  pitch = 1.2,
  speed = "normal",
}: SpeakButtonProps) {
  const { speak, stop, isSpeaking, isSupported } = useTTS({
    language,
    pitch,
    speed,
  });

  // Don't render if speech synthesis is not supported
  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  const sizeStyles = {
    sm: "w-8 h-8 text-base",
    md: "w-10 h-10 text-xl",
    lg: "w-12 h-12 text-2xl",
  };

  const variantStyles = {
    default: `
      bg-gradient-to-b from-[#7B68EE] via-[#6A5ACD] to-[#483D8B]
      text-white
      shadow-[inset_2px_2px_0_rgba(255,255,255,0.3),inset_-2px_-2px_0_rgba(0,0,0,0.3),3px_3px_0_#2E2059]
      hover:shadow-[inset_2px_2px_0_rgba(255,255,255,0.4),inset_-2px_-2px_0_rgba(0,0,0,0.25),3px_3px_0_#2E2059,0_0_15px_rgba(106,90,205,0.5)]
      active:shadow-[inset_2px_2px_0_rgba(0,0,0,0.2),1px_1px_0_#2E2059]
      active:translate-x-[1px] active:translate-y-[1px]
    `,
    minimal: `
      bg-transparent
      text-white/80
      hover:text-white
      hover:bg-white/10
    `,
    pill: `
      bg-gradient-to-r from-purple-500 to-pink-500
      text-white
      shadow-lg
      hover:shadow-xl hover:scale-105
      active:scale-95
    `,
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative rounded-lg cursor-pointer select-none",
        "inline-flex items-center justify-center gap-2",
        "transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeStyles[size],
        variantStyles[variant],
        isSpeaking && "animate-pulse ring-2 ring-purple-400 ring-opacity-75",
        className
      )}
      title={isSpeaking ? "Click to stop" : "Click to listen"}
    >
      {/* Speaker icon */}
      <span className="relative z-10">
        {isSpeaking ? (
          // Speaking animation icon
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="animate-bounce"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        ) : (
          // Normal speaker icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
        )}
      </span>

      {/* Optional label */}
      {showLabel && (
        <span className="text-xs font-medium">
          {isSpeaking ? "Stop" : "Listen"}
        </span>
      )}
    </motion.button>
  );
}

/**
 * Inline speak button for embedding in text
 */
export function InlineSpeakButton({
  text,
  language = "en-US",
}: {
  text: string;
  language?: string;
}) {
  return (
    <SpeakButton
      text={text}
      language={language}
      size="sm"
      variant="minimal"
      className="inline-flex align-middle mx-1"
    />
  );
}

/**
 * Auto-speak component that speaks when mounted
 */
export function AutoSpeak({
  text,
  language = "en-US",
  delay = 500,
  enabled = true,
}: {
  text: string;
  language?: string;
  delay?: number;
  enabled?: boolean;
}) {
  const { speak, isSupported } = useTTS({ language });

  // Auto-speak on mount with delay
  if (typeof window !== "undefined" && isSupported && enabled) {
    setTimeout(() => speak(text), delay);
  }

  return null;
}

/**
 * Text with integrated speak button
 */
export function SpeakableText({
  children,
  text,
  language = "en-US",
  className,
}: {
  children: React.ReactNode;
  text?: string;
  language?: string;
  className?: string;
}) {
  const speakText = text || (typeof children === "string" ? children : "");

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span>{children}</span>
      <SpeakButton
        text={speakText}
        language={language}
        size="sm"
        variant="minimal"
      />
    </span>
  );
}
