"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface SpellBookScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
}

// Category colors and icons
const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
  noun: { icon: "📦", color: "#22c55e" },
  verb: { icon: "⚡", color: "#f59e0b" },
  adjective: { icon: "🎨", color: "#ec4899" },
  adverb: { icon: "🚀", color: "#8b5cf6" },
  phrase: { icon: "💬", color: "#06b6d4" },
  preposition: { icon: "📍", color: "#84cc16" },
  conjunction: { icon: "🔗", color: "#f43f5e" },
  pronoun: { icon: "👤", color: "#14b8a6" },
};

export function SpellBookScreen({ playerId, onBack }: SpellBookScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<{
    word: string;
    category: string;
    definition: string;
    exampleSentence?: string;
    spellPower: number;
    isRare: boolean;
    masteryLevel: number;
  } | null>(null);

  // Fetch data
  const spellBookStats = useQuery(
    api.quests.getSpellBookStats,
    playerId ? { playerId } : "skip"
  );

  const spells = useQuery(
    api.quests.getSpellBook,
    playerId
      ? selectedCategory
        ? { playerId, category: selectedCategory }
        : { playerId }
      : "skip"
  );

  // Loading state
  if (!spellBookStats) {
    return (
      <div className="screen active" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4em", marginBottom: "20px" }}>📖</div>
          <div style={{ color: "#a5b4fc" }}>Opening Spell Book...</div>
        </div>
      </div>
    );
  }

  // Spell detail modal
  if (selectedSpell) {
    const style = CATEGORY_STYLES[selectedSpell.category] || CATEGORY_STYLES.noun;

    return (
      <div className="screen active" style={{
        padding: "20px",
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Spell Card */}
        <div style={{
          width: "100%",
          maxWidth: "350px",
          background: `linear-gradient(135deg, ${style.color}30 0%, rgba(0,0,0,0.6) 100%)`,
          borderRadius: "20px",
          padding: "25px",
          border: `3px solid ${style.color}`,
          position: "relative",
        }}>
          {/* Rare badge */}
          {selectedSpell.isRare && (
            <div style={{
              position: "absolute",
              top: "-10px",
              right: "-10px",
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              color: "#000",
              padding: "5px 15px",
              borderRadius: "20px",
              fontSize: "0.8em",
              fontWeight: "bold",
              boxShadow: "0 0 15px #fbbf2450",
            }}>
              RARE!
            </div>
          )}

          {/* Category icon */}
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <span style={{ fontSize: "3em" }}>{style.icon}</span>
          </div>

          {/* Word */}
          <h2 style={{
            textAlign: "center",
            margin: "0 0 10px 0",
            fontSize: "1.8em",
            color: "#fff",
            textTransform: "capitalize",
          }}>
            {selectedSpell.word}
          </h2>

          {/* Category */}
          <div style={{
            textAlign: "center",
            color: style.color,
            marginBottom: "20px",
            textTransform: "uppercase",
            fontSize: "0.9em",
            letterSpacing: "2px",
          }}>
            {selectedSpell.category}
          </div>

          {/* Spell power stars */}
          <div style={{
            textAlign: "center",
            marginBottom: "20px",
            color: "#fbbf24",
            fontSize: "1.5em",
          }}>
            {"★".repeat(selectedSpell.spellPower)}{"☆".repeat(5 - selectedSpell.spellPower)}
          </div>

          {/* Definition */}
          <div style={{
            background: "rgba(0,0,0,0.4)",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "15px",
          }}>
            <div style={{ color: "#888", fontSize: "0.8em", marginBottom: "5px" }}>
              Definition:
            </div>
            <div style={{ color: "#fff" }}>{selectedSpell.definition}</div>
          </div>

          {/* Example sentence */}
          {selectedSpell.exampleSentence && (
            <div style={{
              background: "rgba(0,0,0,0.4)",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
            }}>
              <div style={{ color: "#888", fontSize: "0.8em", marginBottom: "5px" }}>
                Example:
              </div>
              <div style={{ color: "#a5b4fc", fontStyle: "italic" }}>
                {selectedSpell.exampleSentence}
              </div>
            </div>
          )}

          {/* Mastery level */}
          <div style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ color: "#888", fontSize: "0.9em" }}>Mastery</span>
              <span style={{ color: style.color }}>{selectedSpell.masteryLevel}%</span>
            </div>
            <div style={{
              background: "rgba(0,0,0,0.5)",
              borderRadius: "5px",
              height: "8px",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${selectedSpell.masteryLevel}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${style.color}, ${style.color}88)`,
              }} />
            </div>
          </div>

          {/* Close button */}
          <button
            className="btn btn-primary"
            onClick={() => setSelectedSpell(null)}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              background: style.color,
              border: "none",
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Get category list with counts
  const categories = Object.entries(spellBookStats.categories || {}).map(([cat, count]) => ({
    name: cat,
    count: count as number,
    ...CATEGORY_STYLES[cat] || CATEGORY_STYLES.noun,
  }));

  return (
    <div className="screen active" style={{
      padding: "20px",
      background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
      overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
        <button
          className="btn"
          onClick={selectedCategory ? () => setSelectedCategory(null) : onBack}
          style={{ padding: "10px 15px", background: "rgba(0,0,0,0.4)" }}
        >
          Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.4em" }}>SPELL BOOK</h1>
          <p style={{ margin: 0, color: "#a5b4fc", fontSize: "0.9em" }}>
            {selectedCategory
              ? `${selectedCategory} spells`
              : `${spellBookStats.totalSpells} words collected`}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {!selectedCategory && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          marginBottom: "25px",
        }}>
          <div style={{
            background: "rgba(139, 92, 246, 0.2)",
            borderRadius: "12px",
            padding: "15px",
            textAlign: "center",
            border: "1px solid #8b5cf640",
          }}>
            <div style={{ fontSize: "1.8em", color: "#8b5cf6" }}>
              {spellBookStats.totalSpells}
            </div>
            <div style={{ color: "#888", fontSize: "0.8em" }}>Total</div>
          </div>
          <div style={{
            background: "rgba(251, 191, 36, 0.2)",
            borderRadius: "12px",
            padding: "15px",
            textAlign: "center",
            border: "1px solid #fbbf2440",
          }}>
            <div style={{ fontSize: "1.8em", color: "#fbbf24" }}>
              {spellBookStats.rareCount}
            </div>
            <div style={{ color: "#888", fontSize: "0.8em" }}>Rare</div>
          </div>
          <div style={{
            background: "rgba(34, 197, 94, 0.2)",
            borderRadius: "12px",
            padding: "15px",
            textAlign: "center",
            border: "1px solid #22c55e40",
          }}>
            <div style={{ fontSize: "1.8em", color: "#22c55e" }}>
              {spellBookStats.averageMastery}%
            </div>
            <div style={{ color: "#888", fontSize: "0.8em" }}>Mastery</div>
          </div>
        </div>
      )}

      {/* Category selection or spell list */}
      {!selectedCategory ? (
        <>
          <h2 style={{ margin: "0 0 15px 0", color: "#c4b5fd", fontSize: "1em" }}>
            CATEGORIES
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {categories.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "40px",
                color: "#888",
              }}>
                <div style={{ fontSize: "3em", marginBottom: "15px" }}>📖</div>
                <p>Your spell book is empty!</p>
                <p style={{ fontSize: "0.9em" }}>Complete quests to learn new words</p>
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  style={{
                    background: `linear-gradient(135deg, ${cat.color}20 0%, rgba(0,0,0,0.4) 100%)`,
                    borderRadius: "12px",
                    padding: "15px",
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    border: `2px solid ${cat.color}40`,
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "2em" }}>{cat.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: 0,
                      textTransform: "capitalize",
                      color: "#fff",
                    }}>
                      {cat.name}s
                    </h3>
                  </div>
                  <div style={{
                    background: cat.color,
                    color: "#000",
                    padding: "5px 15px",
                    borderRadius: "20px",
                    fontWeight: "bold",
                  }}>
                    {cat.count}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Spell list for selected category */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
          }}>
            {spells && spells.length > 0 ? (
              spells.map((spell) => {
                const style = CATEGORY_STYLES[spell.category] || CATEGORY_STYLES.noun;

                return (
                  <div
                    key={spell.word}
                    onClick={() => setSelectedSpell(spell)}
                    style={{
                      background: spell.isRare
                        ? `linear-gradient(135deg, #fbbf2420 0%, rgba(0,0,0,0.4) 100%)`
                        : "rgba(0,0,0,0.4)",
                      borderRadius: "12px",
                      padding: "12px",
                      border: `2px solid ${spell.isRare ? "#fbbf24" : style.color}40`,
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    {/* Rare indicator */}
                    {spell.isRare && (
                      <div style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        background: "#fbbf24",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7em",
                      }}>
                        ★
                      </div>
                    )}

                    <div style={{ fontSize: "1.5em", marginBottom: "5px" }}>
                      {style.icon}
                    </div>
                    <div style={{
                      fontWeight: "bold",
                      textTransform: "capitalize",
                      marginBottom: "5px",
                      fontSize: "0.95em",
                    }}>
                      {spell.word}
                    </div>
                    <div style={{
                      color: "#fbbf24",
                      fontSize: "0.8em",
                    }}>
                      {"★".repeat(spell.spellPower)}{"☆".repeat(5 - spell.spellPower)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "40px",
                color: "#888",
              }}>
                No spells in this category yet
              </div>
            )}
          </div>
        </>
      )}

      {/* Tip */}
      {!selectedCategory && categories.length > 0 && (
        <div style={{
          marginTop: "25px",
          padding: "15px",
          background: "rgba(139, 92, 246, 0.1)",
          borderRadius: "10px",
          border: "1px solid #8b5cf640",
          textAlign: "center",
        }}>
          <span style={{ color: "#c4b5fd" }}>
            Tap a category to see your spells!
          </span>
        </div>
      )}
    </div>
  );
}
