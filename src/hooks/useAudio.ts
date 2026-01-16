"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

// Sound effect types
export type SoundEffect =
  | "click"
  | "correct"
  | "wrong"
  | "levelComplete"
  | "achievement"
  | "reward"
  | "dailyReward"
  | "hint"
  | "transition"
  | "countdown";

// Background music tracks
export type MusicTrack = "menu" | "game" | "boss" | "victory";

// Audio file paths
const SFX_PATHS: Record<SoundEffect, string> = {
  click: "/audio/sfx/click.mp3",
  correct: "/audio/sfx/correct.mp3",
  wrong: "/audio/sfx/wrong.mp3",
  levelComplete: "/audio/sfx/level-complete.mp3",
  achievement: "/audio/sfx/achievement.mp3",
  reward: "/audio/sfx/reward.mp3",
  dailyReward: "/audio/sfx/daily-reward.mp3",
  hint: "/audio/sfx/hint.mp3",
  transition: "/audio/sfx/transition.mp3",
  countdown: "/audio/sfx/countdown.mp3",
};

const MUSIC_PATHS: Record<MusicTrack, string> = {
  menu: "/audio/music/menu-theme.mp3",
  game: "/audio/music/game-loop.mp3",
  boss: "/audio/music/boss-battle.mp3",
  victory: "/audio/music/victory.mp3",
};

// Singleton audio manager class
class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sfxBuffers: Map<SoundEffect, AudioBuffer> = new Map();
  private musicElement: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private isUnlocked = false;
  private pendingLoads: Promise<void>[] = [];

  private constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async init() {
    // Create audio context (suspended until user interaction)
    this.audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create music element
    this.musicElement = new Audio();
    this.musicElement.loop = true;

    // Unlock audio on first user interaction
    const unlock = async () => {
      if (this.isUnlocked) return;

      if (this.audioContext?.state === "suspended") {
        await this.audioContext.resume();
      }

      // Play silent sound to unlock
      if (this.musicElement) {
        this.musicElement.muted = true;
        try {
          await this.musicElement.play();
          this.musicElement.pause();
        } catch {
          // Ignore errors
        }
        this.musicElement.muted = false;
      }

      this.isUnlocked = true;
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };

    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    // Preload sound effects
    this.preloadSounds();
  }

  private async preloadSounds() {
    const loadPromises = Object.entries(SFX_PATHS).map(async ([effect, path]) => {
      try {
        const response = await fetch(path);
        if (!response.ok) return; // Silently fail if file doesn't exist

        const arrayBuffer = await response.arrayBuffer();
        if (this.audioContext) {
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.sfxBuffers.set(effect as SoundEffect, audioBuffer);
        }
      } catch {
        // Silently fail - sound files may not exist yet
      }
    });

    this.pendingLoads = loadPromises;
    await Promise.all(loadPromises);
  }

  async playSound(effect: SoundEffect, volume: number = 1): Promise<void> {
    if (!this.audioContext || !this.isUnlocked) return;

    const buffer = this.sfxBuffers.get(effect);
    if (!buffer) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);
    } catch {
      // Ignore playback errors
    }
  }

  async playMusic(track: MusicTrack, volume: number = 0.5): Promise<void> {
    if (!this.musicElement) return;

    // Don't restart if same track
    if (this.currentTrack === track && !this.musicElement.paused) {
      this.musicElement.volume = volume;
      return;
    }

    this.musicElement.src = MUSIC_PATHS[track];
    this.musicElement.volume = volume;
    this.currentTrack = track;

    try {
      await this.musicElement.play();
    } catch {
      // Autoplay may be blocked - will play after user interaction
    }
  }

  stopMusic(): void {
    if (this.musicElement) {
      this.musicElement.pause();
      this.musicElement.currentTime = 0;
      this.currentTrack = null;
    }
  }

  pauseMusic(): void {
    if (this.musicElement) {
      this.musicElement.pause();
    }
  }

  resumeMusic(): void {
    if (this.musicElement && this.currentTrack) {
      this.musicElement.play().catch(() => {});
    }
  }

  async fadeMusic(duration: number = 1000): Promise<void> {
    if (!this.musicElement) return;

    const startVolume = this.musicElement.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;

    for (let i = 0; i < steps; i++) {
      await new Promise((r) => setTimeout(r, stepDuration));
      this.musicElement!.volume = Math.max(0, startVolume - volumeStep * (i + 1));
    }

    this.stopMusic();
    this.musicElement.volume = startVolume;
  }

  setMusicVolume(volume: number): void {
    if (this.musicElement) {
      this.musicElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  isAudioUnlocked(): boolean {
    return this.isUnlocked;
  }
}

// React hook for audio
export function useAudio() {
  const managerRef = useRef<AudioManager | null>(null);
  const { audio, setAudioSettings } = useAppStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      managerRef.current = AudioManager.getInstance();
    }
  }, []);

  const playSound = useCallback(
    (effect: SoundEffect) => {
      if (!audio.sfxEnabled || !managerRef.current) return;
      managerRef.current.playSound(effect, audio.sfxVolume);
    },
    [audio.sfxEnabled, audio.sfxVolume]
  );

  const playMusic = useCallback(
    (track: MusicTrack) => {
      if (!audio.musicEnabled || !managerRef.current) return;
      managerRef.current.playMusic(track, audio.musicVolume);
    },
    [audio.musicEnabled, audio.musicVolume]
  );

  const stopMusic = useCallback(() => {
    managerRef.current?.stopMusic();
  }, []);

  const pauseMusic = useCallback(() => {
    managerRef.current?.pauseMusic();
  }, []);

  const resumeMusic = useCallback(() => {
    if (!audio.musicEnabled || !managerRef.current) return;
    managerRef.current.resumeMusic();
  }, [audio.musicEnabled]);

  const fadeMusic = useCallback((duration?: number) => {
    managerRef.current?.fadeMusic(duration);
  }, []);

  const setMusicVolume = useCallback(
    (volume: number) => {
      setAudioSettings({ musicVolume: volume });
      managerRef.current?.setMusicVolume(volume);
    },
    [setAudioSettings]
  );

  const setSfxVolume = useCallback(
    (volume: number) => {
      setAudioSettings({ sfxVolume: volume });
    },
    [setAudioSettings]
  );

  const toggleMusic = useCallback(() => {
    const newEnabled = !audio.musicEnabled;
    setAudioSettings({ musicEnabled: newEnabled });
    if (!newEnabled) {
      managerRef.current?.stopMusic();
    }
  }, [audio.musicEnabled, setAudioSettings]);

  const toggleSfx = useCallback(() => {
    setAudioSettings({ sfxEnabled: !audio.sfxEnabled });
  }, [audio.sfxEnabled, setAudioSettings]);

  return {
    playSound,
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    fadeMusic,
    setMusicVolume,
    setSfxVolume,
    toggleMusic,
    toggleSfx,
    musicEnabled: audio.musicEnabled,
    sfxEnabled: audio.sfxEnabled,
    musicVolume: audio.musicVolume,
    sfxVolume: audio.sfxVolume,
  };
}
