"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseTTSOptions {
  language?: string; // "en-US", "en-CA", "ru-RU"
  speed?: "slow" | "normal" | "fast";
  pitch?: number; // 0.8-1.5 (higher = younger sounding)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface UseTTSReturn {
  speak: (text: string, langOverride?: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

// Speed multipliers
const SPEED_RATES: Record<string, number> = {
  slow: 0.7,
  normal: 0.9,
  fast: 1.2,
};

// Voice priorities by language
const VOICE_PRIORITIES: Record<string, string[]> = {
  en: ["en-CA", "en-US", "en-GB", "en-AU", "en"],
  ru: ["ru-RU", "ru"],
  uk: ["uk-UA", "uk"],
};

/**
 * Custom hook for Text-to-Speech functionality
 *
 * Uses Web Speech API (free, works offline)
 * Supports English (US, CA, GB), Russian, Ukrainian
 */
export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const {
    language = "en-US",
    speed = "normal",
    pitch = 1.1, // Slightly higher for kid-friendly
    onStart,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(
    null
  );
  const [isSupported, setIsSupported] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if speech synthesis is supported
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
    }
  }, []);

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Auto-select best voice for current language
      if (availableVoices.length > 0 && !currentVoice) {
        const bestVoice = findBestVoice(language, availableVoices);
        if (bestVoice) {
          setCurrentVoice(bestVoice);
        }
      }
    };

    // Load voices immediately
    loadVoices();

    // Chrome loads voices asynchronously
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported, language, currentVoice]);

  // Find best voice for a language
  const findBestVoice = useCallback(
    (
      lang: string,
      availableVoices: SpeechSynthesisVoice[]
    ): SpeechSynthesisVoice | null => {
      // Get language base (e.g., "en" from "en-US")
      const langBase = lang.split("-")[0];

      // Get priority list for this language
      const priorities = VOICE_PRIORITIES[langBase] || [lang, langBase];

      // Try each priority in order
      for (const priority of priorities) {
        // Prefer local service voices (better quality)
        const localVoice = availableVoices.find(
          (v) => v.lang.startsWith(priority) && v.localService
        );
        if (localVoice) return localVoice;

        // Fall back to any voice with this language
        const anyVoice = availableVoices.find((v) =>
          v.lang.startsWith(priority)
        );
        if (anyVoice) return anyVoice;
      }

      // Last resort: first available voice
      return availableVoices[0] || null;
    },
    []
  );

  // Speak text
  const speak = useCallback(
    (text: string, langOverride?: string) => {
      if (!isSupported) {
        onError?.(new Error("Speech synthesis not supported"));
        return;
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice
      const targetLang = langOverride || language;
      const voice = findBestVoice(targetLang, voices);
      if (voice) {
        utterance.voice = voice;
      }

      // Set rate (speed)
      utterance.rate = SPEED_RATES[speed] || 0.9;

      // Set pitch (higher = younger sounding)
      utterance.pitch = pitch;

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        onEnd?.();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        setIsPaused(false);
        onError?.(new Error(`Speech error: ${event.error}`));
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [
      isSupported,
      language,
      speed,
      pitch,
      voices,
      findBestVoice,
      onStart,
      onEnd,
      onError,
    ]
  );

  // Stop speaking
  const stop = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  // Pause speaking
  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking]);

  // Resume speaking
  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  // Set voice manually
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setCurrentVoice(voice);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    currentVoice,
    setVoice,
  };
}

/**
 * Simplified hook for just speaking text
 */
export function useSpeak(language: string = "en-US") {
  const { speak, stop, isSpeaking, isSupported } = useTTS({ language });
  return { speak, stop, isSpeaking, isSupported };
}

/**
 * Get available voices for a specific language
 */
export function getVoicesForLanguage(
  voices: SpeechSynthesisVoice[],
  language: string
): SpeechSynthesisVoice[] {
  const langBase = language.split("-")[0];
  return voices.filter(
    (v) => v.lang.startsWith(language) || v.lang.startsWith(langBase)
  );
}
