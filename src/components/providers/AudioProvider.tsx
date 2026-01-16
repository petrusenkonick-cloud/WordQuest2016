"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAudio, MusicTrack } from "@/hooks/useAudio";
import { useAppStore } from "@/lib/store";

interface AudioContextType {
  playSound: (effect: Parameters<ReturnType<typeof useAudio>["playSound"]>[0]) => void;
  playMusic: (track: MusicTrack) => void;
  stopMusic: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  fadeMusic: (duration?: number) => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  setMusicVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudioContext must be used within AudioProvider");
  }
  return context;
}

// Map screens to music tracks
const SCREEN_MUSIC: Record<string, MusicTrack | null> = {
  home: "menu",
  shop: "menu",
  inventory: "menu",
  achievements: "menu",
  game: "game",
  practice: "game",
  analytics: "menu",
  "learning-profile": "menu",
  "parent-settings": null, // No music in settings
  "quest-map": "menu",
  "spell-book": "menu",
  "profile-setup": "menu",
  dashboard: "menu",
  leaderboard: "menu",
};

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const audio = useAudio();
  const currentScreen = useAppStore((state) => state.ui.currentScreen);
  const showLevelComplete = useAppStore((state) => state.ui.showLevelComplete);

  // Auto-switch music based on screen
  useEffect(() => {
    const targetMusic = SCREEN_MUSIC[currentScreen];

    if (targetMusic === null) {
      // Pause music for screens that shouldn't have it
      audio.pauseMusic();
    } else if (targetMusic) {
      audio.playMusic(targetMusic);
    }
  }, [currentScreen, audio]);

  // Play victory music on level complete
  useEffect(() => {
    if (showLevelComplete) {
      audio.playMusic("victory");
    }
  }, [showLevelComplete, audio]);

  return (
    <AudioContext.Provider value={audio}>
      {children}
    </AudioContext.Provider>
  );
}
