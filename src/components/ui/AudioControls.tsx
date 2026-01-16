"use client";

import { useState } from "react";
import { useAudio } from "@/hooks/useAudio";

interface AudioControlsProps {
  compact?: boolean;
  className?: string;
}

export function AudioControls({ compact = true, className = "" }: AudioControlsProps) {
  const {
    musicEnabled,
    sfxEnabled,
    toggleMusic,
    toggleSfx,
    playSound,
  } = useAudio();

  const handleToggleMusic = () => {
    playSound("click");
    toggleMusic();
  };

  const handleToggleSfx = () => {
    if (sfxEnabled) {
      // Play click before disabling
      playSound("click");
    }
    toggleSfx();
    if (!sfxEnabled) {
      // Play click after enabling
      setTimeout(() => playSound("click"), 50);
    }
  };

  if (compact) {
    return (
      <div className={`audio-controls-compact ${className}`}>
        <button
          onClick={handleToggleMusic}
          className="audio-btn"
          title={musicEnabled ? "Mute Music" : "Unmute Music"}
        >
          {musicEnabled ? "🎵" : "🔇"}
        </button>
        <button
          onClick={handleToggleSfx}
          className="audio-btn"
          title={sfxEnabled ? "Mute Sounds" : "Unmute Sounds"}
        >
          {sfxEnabled ? "🔊" : "🔈"}
        </button>

        <style jsx>{`
          .audio-controls-compact {
            display: flex;
            gap: 4px;
          }
          .audio-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          .audio-btn:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: scale(1.1);
          }
          .audio-btn:active {
            transform: scale(0.95);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`audio-controls ${className}`}>
      <div className="audio-row">
        <span className="audio-label">Music</span>
        <button
          onClick={handleToggleMusic}
          className={`audio-toggle ${musicEnabled ? "on" : "off"}`}
        >
          <span className="toggle-slider" />
        </button>
      </div>
      <div className="audio-row">
        <span className="audio-label">Sound Effects</span>
        <button
          onClick={handleToggleSfx}
          className={`audio-toggle ${sfxEnabled ? "on" : "off"}`}
        >
          <span className="toggle-slider" />
        </button>
      </div>

      <style jsx>{`
        .audio-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .audio-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }
        .audio-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }
        .audio-toggle {
          width: 48px;
          height: 28px;
          border-radius: 14px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
        }
        .audio-toggle.on {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease;
        }
        .audio-toggle.on .toggle-slider {
          transform: translateX(20px);
        }
      `}</style>
    </div>
  );
}

// Audio settings panel for Parent Settings
export function AudioSettingsPanel() {
  const {
    musicEnabled,
    sfxEnabled,
    musicVolume,
    sfxVolume,
    toggleMusic,
    toggleSfx,
    setMusicVolume,
    setSfxVolume,
    playSound,
  } = useAudio();

  const [localMusicVol, setLocalMusicVol] = useState(musicVolume * 100);
  const [localSfxVol, setLocalSfxVol] = useState(sfxVolume * 100);

  const handleMusicVolumeChange = (value: number) => {
    setLocalMusicVol(value);
    setMusicVolume(value / 100);
  };

  const handleSfxVolumeChange = (value: number) => {
    setLocalSfxVol(value);
    setSfxVolume(value / 100);
  };

  const handleTestSound = () => {
    playSound("correct");
  };

  return (
    <div className="audio-settings-panel">
      <h3 className="panel-title">Audio Settings</h3>

      <div className="setting-row">
        <div className="setting-header">
          <span className="setting-icon">🎵</span>
          <span className="setting-label">Background Music</span>
        </div>
        <button
          onClick={() => {
            playSound("click");
            toggleMusic();
          }}
          className={`toggle-btn ${musicEnabled ? "on" : "off"}`}
        >
          <span className="toggle-slider" />
        </button>
      </div>

      {musicEnabled && (
        <div className="volume-row">
          <span className="volume-label">Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            value={localMusicVol}
            onChange={(e) => handleMusicVolumeChange(Number(e.target.value))}
            className="volume-slider"
          />
          <span className="volume-value">{Math.round(localMusicVol)}%</span>
        </div>
      )}

      <div className="setting-row">
        <div className="setting-header">
          <span className="setting-icon">🔊</span>
          <span className="setting-label">Sound Effects</span>
        </div>
        <button
          onClick={() => {
            if (sfxEnabled) playSound("click");
            toggleSfx();
          }}
          className={`toggle-btn ${sfxEnabled ? "on" : "off"}`}
        >
          <span className="toggle-slider" />
        </button>
      </div>

      {sfxEnabled && (
        <>
          <div className="volume-row">
            <span className="volume-label">Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              value={localSfxVol}
              onChange={(e) => handleSfxVolumeChange(Number(e.target.value))}
              className="volume-slider"
            />
            <span className="volume-value">{Math.round(localSfxVol)}%</span>
          </div>
          <button onClick={handleTestSound} className="test-btn">
            Test Sound
          </button>
        </>
      )}

      <style jsx>{`
        .audio-settings-panel {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .panel-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: white;
        }
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .setting-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .setting-icon {
          font-size: 20px;
        }
        .setting-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }
        .toggle-btn {
          width: 48px;
          height: 28px;
          border-radius: 14px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
        }
        .toggle-btn.on {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease;
        }
        .toggle-btn.on .toggle-slider {
          transform: translateX(20px);
        }
        .volume-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 8px 0 16px 28px;
        }
        .volume-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          min-width: 50px;
        }
        .volume-slider {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          outline: none;
        }
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .volume-value {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          min-width: 35px;
          text-align: right;
        }
        .test-btn {
          width: 100%;
          padding: 10px;
          margin-top: 8px;
          border: none;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .test-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .test-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
