"use client";

interface InventoryItem {
  itemId: string;
  itemType: string;
  equipped: boolean;
}

interface InventoryScreenProps {
  inventory: InventoryItem[];
  onEquip: (itemId: string, itemType: string) => void;
}

// Item details mapping
const ITEM_DETAILS: Record<string, { name: string; icon: string }> = {
  // Skins
  steve: { name: "Steve", icon: "🧑" },
  alex: { name: "Alex", icon: "👧" },
  knight: { name: "Knight", icon: "🦸" },
  wizard: { name: "Wizard", icon: "🧙" },
  ninja: { name: "Ninja", icon: "🥷" },
  robot: { name: "Robot", icon: "🤖" },
  // Tools
  wood_pick: { name: "Wood Pick", icon: "🪓" },
  stone_pick: { name: "Stone Pick", icon: "⛏️" },
  iron_pick: { name: "Iron Pick", icon: "🔨" },
  diamond_pick: { name: "Diamond Pick", icon: "💎" },
  // Pets
  cat: { name: "Cat", icon: "🐱" },
  dog: { name: "Dog", icon: "🐶" },
  parrot: { name: "Parrot", icon: "🦜" },
  fox: { name: "Fox", icon: "🦊" },
  dragon: { name: "Dragon", icon: "🐉" },
  // Boosts
  hints: { name: "Hints", icon: "💡" },
  shield: { name: "Shield", icon: "🛡️" },
  "2xp": { name: "2X XP", icon: "⚡" },
};

export function InventoryScreen({ inventory, onEquip }: InventoryScreenProps) {
  // Create a 9x3 grid (27 slots)
  const slots = Array.from({ length: 27 }).map((_, i) => {
    const item = inventory[i];
    return item || null;
  });

  return (
    <div className="screen active">
      <h2 className="section-title">🎒 INVENTORY</h2>

      <div className="inventory-grid">
        {slots.map((item, index) => {
          const details = item ? ITEM_DETAILS[item.itemId] : null;

          return (
            <div
              key={index}
              className={`inventory-slot ${item?.equipped ? "equipped" : ""}`}
              onClick={() => item && onEquip(item.itemId, item.itemType)}
            >
              {details && details.icon}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          fontSize: "0.9em",
          color: "#AAA",
        }}
      >
        <span>
          <span
            style={{
              display: "inline-block",
              width: "12px",
              height: "12px",
              border: "2px solid var(--diamond)",
              marginRight: "4px",
            }}
          />
          Equipped
        </span>
        <span>Click to equip/unequip</span>
      </div>
    </div>
  );
}
