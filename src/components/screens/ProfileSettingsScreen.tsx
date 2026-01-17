"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useAppStore } from "@/lib/store";
import { UserButton, useAuth } from "@clerk/nextjs";

// Available skins - can be expanded with shop purchases
const AVAILABLE_SKINS = [
  { id: "🧑", name: "Steve", unlocked: true },
  { id: "👦", name: "Boy", unlocked: true },
  { id: "👧", name: "Girl", unlocked: true },
  { id: "🦸", name: "Hero", unlocked: true },
  { id: "🧙", name: "Wizard", unlocked: true },
  { id: "🥷", name: "Ninja", unlocked: true },
  { id: "🧝", name: "Elf", unlocked: true },
  { id: "🤴", name: "Prince", unlocked: true },
  { id: "👸", name: "Princess", unlocked: true },
  { id: "🤖", name: "Robot", unlocked: true },
  { id: "🦊", name: "Fox", unlocked: true },
  { id: "🐺", name: "Wolf", unlocked: true },
  { id: "🦁", name: "Lion", unlocked: true },
  { id: "🐉", name: "Dragon", unlocked: true },
  { id: "🦄", name: "Unicorn", unlocked: true },
  { id: "👻", name: "Ghost", unlocked: true },
];

// Age groups
const AGE_GROUPS = [
  { id: "5-6", label: "5-6 years", sublabel: "Grade 1", emoji: "🐣", color: "#FFE066" },
  { id: "7-8", label: "7-8 years", sublabel: "Grade 2-3", emoji: "🐥", color: "#4ECDC4" },
  { id: "9-10", label: "9-10 years", sublabel: "Grade 4-5", emoji: "🦊", color: "#FF6B6B" },
  { id: "11-12", label: "11-12 years", sublabel: "Grade 6-7", emoji: "🦁", color: "#45B7D1" },
  { id: "13+", label: "13+ years", sublabel: "Grade 8+", emoji: "🐺", color: "#96CEB4" },
];

interface ProfileSettingsScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
  onLogout?: () => void;
}

export function ProfileSettingsScreen({ playerId, onBack, onLogout }: ProfileSettingsScreenProps) {
  const player = useAppStore((state) => state.player);
  const setPlayer = useAppStore((state) => state.setPlayer);
  const { isSignedIn } = useAuth();

  const [selectedSkin, setSelectedSkin] = useState(player.skin || "🧙");
  const [name, setName] = useState(player.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"skin" | "profile">("skin");

  const updatePlayer = useMutation(api.players.updatePlayer);

  // Sync with player data
  useEffect(() => {
    setSelectedSkin(player.skin || "🧙");
    setName(player.name || "");
  }, [player.skin, player.name]);

  const handleSkinSelect = async (skinId: string) => {
    setSelectedSkin(skinId);

    // Auto-save skin change
    if (playerId) {
      setIsSaving(true);
      try {
        await updatePlayer({
          playerId,
          updates: { skin: skinId },
        });
        setPlayer({ skin: skinId });
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (error) {
        console.error("Failed to update skin:", error);
      }
      setIsSaving(false);
    } else {
      // Guest mode - update local store only
      setPlayer({ skin: skinId });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  const handleNameSave = async () => {
    if (!name.trim() || name.trim().length < 2) return;

    if (playerId) {
      setIsSaving(true);
      try {
        await updatePlayer({
          playerId,
          updates: { name: name.trim() },
        });
        setPlayer({ name: name.trim() });
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (error) {
        console.error("Failed to update name:", error);
      }
      setIsSaving(false);
    } else {
      setPlayer({ name: name.trim() });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  return (
    <div className="screen active" style={{ paddingBottom: "100px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "15px",
        marginBottom: "20px",
      }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "2px solid #444",
            borderRadius: "10px",
            padding: "10px 15px",
            color: "white",
            cursor: "pointer",
            fontSize: "1.2em",
          }}
        >
          ←
        </button>
        <h1 style={{
          fontSize: "1.3em",
          color: "#FFD700",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          margin: 0,
        }}>
          ⚙️ Profile Settings
        </h1>
      </div>

      {/* Current Profile Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.4) 100%)",
          borderRadius: "20px",
          padding: "25px",
          marginBottom: "20px",
          border: "3px solid rgba(139, 92, 246, 0.5)",
          boxShadow: "0 8px 32px rgba(139, 92, 246, 0.3)",
          textAlign: "center",
        }}
      >
        {/* Avatar */}
        <motion.div
          key={selectedSkin}
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "3em",
            margin: "0 auto 15px",
            border: "4px solid #c4b5fd",
            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)",
          }}
        >
          {selectedSkin}
        </motion.div>

        {/* Name */}
        <div style={{
          fontSize: "1.4em",
          fontWeight: "bold",
          color: "white",
          marginBottom: "5px",
        }}>
          {name || "Player"}
        </div>

        {/* Level */}
        <div style={{
          fontSize: "0.95em",
          color: "#c4b5fd",
        }}>
          Level {player.level || 1} • {player.totalStars || 0} ⭐
        </div>
      </motion.div>

      {/* Saved Notification */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              borderRadius: "12px",
              padding: "12px 24px",
              color: "white",
              fontWeight: "bold",
              boxShadow: "0 4px 20px rgba(34, 197, 94, 0.5)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ✓ Saved!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
      }}>
        <button
          onClick={() => setActiveTab("skin")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "12px",
            border: activeTab === "skin" ? "3px solid #FFD700" : "2px solid #444",
            background: activeTab === "skin"
              ? "linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 165, 0, 0.2) 100%)"
              : "rgba(0,0,0,0.3)",
            color: activeTab === "skin" ? "#FFD700" : "#888",
            cursor: "pointer",
            fontSize: "1em",
            fontWeight: "bold",
            transition: "all 0.2s ease",
          }}
        >
          🎭 Character
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "12px",
            border: activeTab === "profile" ? "3px solid #8b5cf6" : "2px solid #444",
            background: activeTab === "profile"
              ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.2) 100%)"
              : "rgba(0,0,0,0.3)",
            color: activeTab === "profile" ? "#c4b5fd" : "#888",
            cursor: "pointer",
            fontSize: "1em",
            fontWeight: "bold",
            transition: "all 0.2s ease",
          }}
        >
          ✏️ Name
        </button>
      </div>

      {/* Skin Selection Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "skin" && (
          <motion.div
            key="skin"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: "16px",
              padding: "20px",
              border: "2px solid #333",
            }}>
              <h3 style={{
                color: "#FFD700",
                marginBottom: "15px",
                fontSize: "1.1em",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                🎭 Choose Your Character
              </h3>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
              }}>
                {AVAILABLE_SKINS.map((skin) => (
                  <motion.button
                    key={skin.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSkinSelect(skin.id)}
                    disabled={isSaving}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "12px",
                      border: selectedSkin === skin.id
                        ? "3px solid #FFD700"
                        : "2px solid #444",
                      background: selectedSkin === skin.id
                        ? "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)"
                        : "rgba(0,0,0,0.4)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      transition: "all 0.2s ease",
                      boxShadow: selectedSkin === skin.id
                        ? "0 0 20px rgba(255, 215, 0, 0.4)"
                        : "none",
                      opacity: isSaving ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontSize: "2em" }}>{skin.id}</span>
                    <span style={{
                      fontSize: "0.65em",
                      color: selectedSkin === skin.id ? "#FFD700" : "#888",
                    }}>
                      {skin.name}
                    </span>
                    {selectedSkin === skin.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: "absolute",
                          top: "-5px",
                          right: "-5px",
                          background: "#FFD700",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7em",
                        }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Coming Soon Section */}
              <div style={{
                marginTop: "20px",
                padding: "15px",
                background: "rgba(139, 92, 246, 0.1)",
                borderRadius: "12px",
                border: "1px dashed #8b5cf6",
              }}>
                <div style={{
                  color: "#c4b5fd",
                  fontSize: "0.9em",
                  textAlign: "center",
                }}>
                  🔒 More characters in the <span style={{ color: "#FFD700" }}>Shop</span>!
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: "16px",
              padding: "20px",
              border: "2px solid #333",
            }}>
              <h3 style={{
                color: "#c4b5fd",
                marginBottom: "15px",
                fontSize: "1.1em",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                ✏️ Edit Name
              </h3>

              <div style={{ marginBottom: "20px" }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name..."
                  maxLength={20}
                  style={{
                    width: "100%",
                    padding: "15px 20px",
                    borderRadius: "12px",
                    border: "2px solid #444",
                    background: "rgba(0,0,0,0.4)",
                    color: "white",
                    fontSize: "1.1em",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
                  onBlur={(e) => e.target.style.borderColor = "#444"}
                />
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "8px",
                  fontSize: "0.85em",
                  color: "#888",
                }}>
                  <span>Min 2 characters</span>
                  <span>{name.length}/20</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNameSave}
                disabled={isSaving || name.trim().length < 2 || name.trim() === player.name}
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "none",
                  background: name.trim().length >= 2 && name.trim() !== player.name
                    ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                    : "rgba(100,100,100,0.3)",
                  color: "white",
                  fontSize: "1.1em",
                  fontWeight: "bold",
                  cursor: name.trim().length >= 2 && name.trim() !== player.name ? "pointer" : "not-allowed",
                  opacity: isSaving ? 0.5 : 1,
                }}
              >
                {isSaving ? "Saving..." : "Save Name"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Section */}
      <div style={{
        marginTop: "20px",
        background: "rgba(0,0,0,0.3)",
        borderRadius: "16px",
        padding: "20px",
        border: "2px solid #333",
      }}>
        <h3 style={{
          color: "#888",
          marginBottom: "15px",
          fontSize: "1em",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          👤 Account
        </h3>

        {isSignedIn ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 15px",
            background: "rgba(34, 197, 94, 0.1)",
            borderRadius: "12px",
            border: "1px solid rgba(34, 197, 94, 0.3)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#22c55e" }}>✓ Signed in</span>
              <span style={{ color: "#888", fontSize: "0.85em" }}>Progress saved</span>
            </div>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: {
                    width: "36px",
                    height: "36px",
                  },
                },
              }}
            />
          </div>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            <div style={{
              padding: "10px 15px",
              background: "rgba(234, 179, 8, 0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(234, 179, 8, 0.3)",
              color: "#fde047",
              fontSize: "0.9em",
              textAlign: "center",
            }}>
              ⚠️ Guest mode - progress not saved
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  padding: "12px",
                  background: "rgba(239, 68, 68, 0.2)",
                  borderRadius: "12px",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  cursor: "pointer",
                  fontSize: "1em",
                }}
              >
                🚪 Exit Guest Mode
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
