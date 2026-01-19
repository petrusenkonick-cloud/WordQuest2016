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

// Preferred voice names (high quality, native English speakers)
const PREFERRED_ENGLISH_VOICES = [
  // Google voices (Chrome/Android) - native speakers MUST have "English" in name
  "Google US English",
  "Google UK English Female",
  "Google UK English Male",
  "en-US-Wavenet",
  "en-US-Standard",
  "en-GB-Wavenet",
  "en-CA-Wavenet",
  // Microsoft voices (Edge/Windows) - native speakers
  "Microsoft Mark",
  "Microsoft David",
  "Microsoft Zira",
  "Microsoft Jenny",
  "Microsoft Aria",
  "Microsoft Guy",
  "Microsoft Libby", // UK
  "Microsoft Ryan", // UK
  "Microsoft Sonia", // UK
  // Apple voices (macOS/iOS) - native speakers
  "Samantha",
  "Alex",
  "Karen", // Australian
  "Daniel", // UK
  "Moira", // Irish
  "Tessa", // South African
  "Fiona", // Scottish
  "Tom", // US
  "Allison", // US
  "Ava", // US
  // Samsung voices
  "Samsung English",
  // Generic patterns
  "English (Canada)",
  "English (United States)",
  "English United States",
  "English Canada",
  "American English",
  "British English",
  "Canadian English",
];

// Voice patterns to AVOID for English (often have accents or wrong language)
const AVOID_FOR_ENGLISH = [
  /multilingual/i,
  /^Google\s+\w+$/i, // Just "Google X" without language specification (e.g., "Google русский")
  /русский/i, // Russian
  /россия/i, // Russia
  /ukrainian/i,
  /український/i,
  /hindi/i,
  /spanish/i,
  /français/i,
  /deutsch/i,
  /italiano/i,
  /português/i,
  /中文/i, // Chinese
  /日本語/i, // Japanese
  /한국어/i, // Korean
  /العربية/i, // Arabic
  // Non-native English voice patterns
  /\bru\b/i,
  /\bde\b/i,
  /\bfr\b/i,
  /\bes\b/i,
  /\bit\b/i,
  /\bpt\b/i,
  /\bpl\b/i,
  /\bnl\b/i,
];

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

      // For English: STRICTLY select only native English voices
      if (langBase === "en") {
        // Filter to ONLY voices with English lang code (strict check)
        const englishVoices = availableVoices.filter(
          (v) => v.lang.startsWith("en-") || v.lang === "en"
        );

        // Filter out voices to avoid (accented, multilingual, other languages)
        const goodVoices = englishVoices.filter((v) => {
          // Check if name matches any avoid pattern
          const shouldAvoid = AVOID_FOR_ENGLISH.some((pattern) => pattern.test(v.name));
          if (shouldAvoid) {
            console.log("TTS: Avoiding voice:", v.name, v.lang);
            return false;
          }
          return true;
        });

        console.log("TTS: Available English voices:", goodVoices.map(v => `${v.name} (${v.lang})`));

        // First priority: preferred voice names (known good quality)
        for (const preferredName of PREFERRED_ENGLISH_VOICES) {
          const voice = goodVoices.find(
            (v) => v.name.toLowerCase().includes(preferredName.toLowerCase())
          );
          if (voice) {
            console.log("TTS: ✓ Selected preferred voice:", voice.name, voice.lang);
            return voice;
          }
        }

        // Second priority: any en-CA or en-US local voice (better quality offline)
        for (const priority of ["en-CA", "en-US", "en-GB"]) {
          const localVoice = goodVoices.find(
            (v) => v.lang === priority && v.localService
          );
          if (localVoice) {
            console.log("TTS: ✓ Selected local voice:", localVoice.name, localVoice.lang);
            return localVoice;
          }
        }

        // Third priority: any en-CA, en-US, en-GB, en-AU voice
        for (const priority of ["en-CA", "en-US", "en-GB", "en-AU", "en-NZ", "en-IE"]) {
          const voice = goodVoices.find((v) => v.lang === priority);
          if (voice) {
            console.log("TTS: ✓ Selected by exact lang:", voice.name, voice.lang);
            return voice;
          }
        }

        // Fourth: any voice whose lang starts with "en"
        const anyEnglishVoice = goodVoices.find((v) => v.lang.startsWith("en"));
        if (anyEnglishVoice) {
          console.log("TTS: ✓ Selected any English:", anyEnglishVoice.name, anyEnglishVoice.lang);
          return anyEnglishVoice;
        }

        // If NO good English voice found, try original English voices without the "good" filter
        // but still require en-* lang code
        const anyEnglishUnfiltered = englishVoices.find((v) => v.lang.startsWith("en"));
        if (anyEnglishUnfiltered) {
          console.log("TTS: ⚠️ Using unfiltered English voice:", anyEnglishUnfiltered.name, anyEnglishUnfiltered.lang);
          return anyEnglishUnfiltered;
        }

        // STRICT: For English, do NOT fall back to non-English voices
        // Return null and let the caller handle it
        console.log("TTS: ❌ No English voice found! Available voices:",
          availableVoices.map(v => `${v.name} (${v.lang})`).join(", "));
        return null;
      }

      // Non-English: use original logic
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
        console.log(`TTS Speaking: "${text.substring(0, 30)}..." with voice: ${voice.name} (${voice.lang})`);
      } else {
        console.warn("TTS: No suitable voice found, using browser default");
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
