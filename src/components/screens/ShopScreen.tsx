"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Rarity types
type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9CA3AF",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  epic: "#A855F7",
  legendary: "#F59E0B",
  mythic: "#EF4444",
};

const RARITY_GLOW: Record<Rarity, string> = {
  common: "none",
  uncommon: "0 0 10px #22C55E40",
  rare: "0 0 15px #3B82F680",
  epic: "0 0 20px #A855F780",
  legendary: "0 0 25px #F59E0B90, 0 0 50px #F59E0B40",
  mythic: "0 0 30px #EF444490, 0 0 60px #EF444450",
};

interface ShopItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  currency: "diamonds" | "emeralds" | "gold";
  rarity: Rarity;
  description?: string;
  effect?: string;
  bonus?: string;
}

// Massive shop inventory!
const SHOP_ITEMS: Record<string, ShopItem[]> = {
  skins: [
    // Common (Free - 50)
    { id: "steve", name: "Steve", icon: "🧑", price: 0, currency: "diamonds", rarity: "common", description: "The classic adventurer" },
    { id: "alex", name: "Alex", icon: "👧", price: 50, currency: "diamonds", rarity: "common", description: "Ready for adventure!" },
    { id: "villager", name: "Villager", icon: "👨‍🌾", price: 50, currency: "diamonds", rarity: "common", description: "Hmm!" },

    // Uncommon (100-200)
    { id: "knight", name: "Knight", icon: "🦸", price: 100, currency: "diamonds", rarity: "uncommon", description: "Defender of knowledge" },
    { id: "princess", name: "Princess", icon: "👸", price: 100, currency: "diamonds", rarity: "uncommon", description: "Royal learner" },
    { id: "pirate", name: "Pirate", icon: "🏴‍☠️", price: 150, currency: "diamonds", rarity: "uncommon", description: "Arrr! Time to learn!" },
    { id: "cowboy", name: "Cowboy", icon: "🤠", price: 150, currency: "diamonds", rarity: "uncommon", description: "Yeehaw partner!" },
    { id: "astronaut", name: "Astronaut", icon: "👨‍🚀", price: 200, currency: "diamonds", rarity: "uncommon", description: "Learning is out of this world!" },

    // Rare (300-500)
    { id: "wizard", name: "Wizard", icon: "🧙", price: 300, currency: "diamonds", rarity: "rare", description: "Master of spells", effect: "+5% XP" },
    { id: "ninja", name: "Ninja", icon: "🥷", price: 350, currency: "diamonds", rarity: "rare", description: "Silent knowledge seeker", effect: "+5% Stealth" },
    { id: "superhero", name: "Superhero", icon: "🦸‍♂️", price: 400, currency: "diamonds", rarity: "rare", description: "Power of knowledge!", effect: "+5% Streak" },
    { id: "fairy", name: "Fairy", icon: "🧚", price: 450, currency: "diamonds", rarity: "rare", description: "Magical learner", effect: "+1 Hint/day" },
    { id: "vampire", name: "Vampire", icon: "🧛", price: 500, currency: "diamonds", rarity: "rare", description: "Eternal student", effect: "+10% Night XP" },

    // Epic (750-1500)
    { id: "robot", name: "Robot", icon: "🤖", price: 750, currency: "diamonds", rarity: "epic", description: "CALCULATING... LEARNING!", effect: "+10% XP" },
    { id: "alien", name: "Alien", icon: "👽", price: 800, currency: "diamonds", rarity: "epic", description: "Universal knowledge", effect: "+10% XP" },
    { id: "zombie", name: "Zombie", icon: "🧟", price: 900, currency: "diamonds", rarity: "epic", description: "BRAINS... for learning!", effect: "+15% Weekend XP" },
    { id: "mermaid", name: "Mermaid", icon: "🧜‍♀️", price: 1000, currency: "diamonds", rarity: "epic", description: "Deep sea scholar", effect: "+2 Hints/day" },
    { id: "genie", name: "Genie", icon: "🧞", price: 1200, currency: "diamonds", rarity: "epic", description: "3 wishes for wisdom!", effect: "+15% XP" },
    { id: "phoenix_warrior", name: "Phoenix Warrior", icon: "🔥", price: 1500, currency: "diamonds", rarity: "epic", description: "Rise from the ashes!", effect: "Auto-revive streak once/day" },

    // Legendary (2000-5000)
    { id: "dragon_lord", name: "Dragon Lord", icon: "🐲", price: 2000, currency: "diamonds", rarity: "legendary", description: "Master of dragons!", effect: "+20% XP, +2 Gems/level" },
    { id: "time_wizard", name: "Time Wizard", icon: "⏰", price: 2500, currency: "diamonds", rarity: "legendary", description: "Control time itself!", effect: "+30s on timed questions" },
    { id: "shadow_master", name: "Shadow Master", icon: "👤", price: 3000, currency: "diamonds", rarity: "legendary", description: "One with darkness", effect: "+25% XP, Mystery rewards" },
    { id: "crystal_sage", name: "Crystal Sage", icon: "💠", price: 3500, currency: "diamonds", rarity: "legendary", description: "Ancient wisdom keeper", effect: "+3 Gems/level, +20% XP" },
    { id: "thunder_god", name: "Thunder God", icon: "⚡", price: 5000, currency: "diamonds", rarity: "legendary", description: "UNLIMITED POWER!", effect: "+30% XP, Lightning effects" },

    // Mythic (7500-15000)
    { id: "cosmic_emperor", name: "Cosmic Emperor", icon: "🌌", price: 7500, currency: "diamonds", rarity: "mythic", description: "Ruler of galaxies!", effect: "+50% XP, +5 Gems/level, Cosmic aura" },
    { id: "void_walker", name: "Void Walker", icon: "🕳️", price: 10000, currency: "diamonds", rarity: "mythic", description: "Between dimensions", effect: "+40% XP, Skip 1 question/day" },
    { id: "infinity_master", name: "Infinity Master", icon: "♾️", price: 15000, currency: "diamonds", rarity: "mythic", description: "THE ULTIMATE FORM!", effect: "+100% XP Weekends, +10 Gems/level, All effects!" },
  ],

  tools: [
    // Common
    { id: "wood_pick", name: "Wood Pickaxe", icon: "🪓", price: 25, currency: "emeralds", rarity: "common", effect: "+5% Gem chance" },
    { id: "magnifier", name: "Magnifier", icon: "🔍", price: 30, currency: "emeralds", rarity: "common", effect: "+5% hint accuracy" },

    // Uncommon
    { id: "stone_pick", name: "Stone Pickaxe", icon: "⛏️", price: 75, currency: "emeralds", rarity: "uncommon", effect: "+10% Gem chance" },
    { id: "compass", name: "Magic Compass", icon: "🧭", price: 100, currency: "emeralds", rarity: "uncommon", effect: "Shows correct category" },
    { id: "lantern", name: "Lantern", icon: "🏮", price: 125, currency: "emeralds", rarity: "uncommon", effect: "+15% XP at night" },

    // Rare
    { id: "iron_pick", name: "Iron Pickaxe", icon: "🔨", price: 200, currency: "emeralds", rarity: "rare", effect: "+20% Gem chance" },
    { id: "telescope", name: "Telescope", icon: "🔭", price: 250, currency: "emeralds", rarity: "rare", effect: "See question difficulty" },
    { id: "spellbook", name: "Spellbook", icon: "📖", price: 300, currency: "emeralds", rarity: "rare", effect: "+1 free hint/level" },
    { id: "lucky_clover", name: "Lucky Clover", icon: "🍀", price: 350, currency: "emeralds", rarity: "rare", effect: "+15% rare gem chance" },

    // Epic
    { id: "diamond_pick", name: "Diamond Pickaxe", icon: "💎", price: 500, currency: "emeralds", rarity: "epic", effect: "+35% Gem chance" },
    { id: "crystal_ball", name: "Crystal Ball", icon: "🔮", price: 600, currency: "emeralds", rarity: "epic", effect: "Preview next question" },
    { id: "golden_pen", name: "Golden Pen", icon: "🖊️", price: 750, currency: "emeralds", rarity: "epic", effect: "+25% XP on fill-blank" },
    { id: "time_hourglass", name: "Time Hourglass", icon: "⏳", price: 900, currency: "emeralds", rarity: "epic", effect: "+20s on all questions" },

    // Legendary
    { id: "netherite_pick", name: "Netherite Pickaxe", icon: "🌋", price: 1500, currency: "emeralds", rarity: "legendary", effect: "+50% Gem chance, +Legendary gems" },
    { id: "wisdom_crown", name: "Crown of Wisdom", icon: "👑", price: 2000, currency: "emeralds", rarity: "legendary", effect: "+40% XP, Auto-hint on wrong" },
    { id: "infinity_gauntlet", name: "Infinity Gauntlet", icon: "🤜", price: 3000, currency: "emeralds", rarity: "legendary", effect: "All tool bonuses combined!" },
  ],

  pets: [
    // Common
    { id: "cat", name: "Whiskers", icon: "🐱", price: 100, currency: "diamonds", rarity: "common", description: "Purrs when you're correct!", bonus: "+2% XP" },
    { id: "dog", name: "Buddy", icon: "🐶", price: 100, currency: "diamonds", rarity: "common", description: "Your best study friend!", bonus: "+2% XP" },
    { id: "hamster", name: "Nibbles", icon: "🐹", price: 75, currency: "diamonds", rarity: "common", description: "Tiny but mighty!", bonus: "+1% XP" },
    { id: "rabbit", name: "Hoppy", icon: "🐰", price: 75, currency: "diamonds", rarity: "common", description: "Hops with joy!", bonus: "+1% XP" },

    // Uncommon
    { id: "parrot", name: "Echo", icon: "🦜", price: 200, currency: "diamonds", rarity: "uncommon", description: "Repeats correct answers!", bonus: "+5% XP" },
    { id: "fox", name: "Rusty", icon: "🦊", price: 250, currency: "diamonds", rarity: "uncommon", description: "Clever and cunning!", bonus: "+5% XP, +2% luck" },
    { id: "owl", name: "Wisdom", icon: "🦉", price: 300, currency: "diamonds", rarity: "uncommon", description: "The wise one!", bonus: "+1 hint/day" },
    { id: "turtle", name: "Shelly", icon: "🐢", price: 200, currency: "diamonds", rarity: "uncommon", description: "Slow and steady wins!", bonus: "+10s time" },

    // Rare
    { id: "wolf", name: "Shadow", icon: "🐺", price: 500, currency: "diamonds", rarity: "rare", description: "Pack leader!", bonus: "+10% XP, streak protection" },
    { id: "panda", name: "Bamboo", icon: "🐼", price: 600, currency: "diamonds", rarity: "rare", description: "Chill vibes only!", bonus: "+8% XP, +5% gems" },
    { id: "lion", name: "King", icon: "🦁", price: 700, currency: "diamonds", rarity: "rare", description: "Rule the jungle!", bonus: "+12% XP" },
    { id: "penguin", name: "Waddles", icon: "🐧", price: 550, currency: "diamonds", rarity: "rare", description: "Cool as ice!", bonus: "+10% XP, +1 hint" },
    { id: "monkey", name: "Bananas", icon: "🐵", price: 500, currency: "diamonds", rarity: "rare", description: "Go bananas!", bonus: "+8% XP, +5% gold" },

    // Epic
    { id: "unicorn", name: "Sparkle", icon: "🦄", price: 1500, currency: "diamonds", rarity: "epic", description: "Magical companion!", bonus: "+20% XP, rainbow trail" },
    { id: "phoenix", name: "Blaze", icon: "🔥", price: 2000, currency: "diamonds", rarity: "epic", description: "Rise from mistakes!", bonus: "+15% XP, auto-retry" },
    { id: "griffin", name: "Talon", icon: "🦅", price: 1800, currency: "diamonds", rarity: "epic", description: "Majestic guardian!", bonus: "+18% XP, +10% gems" },
    { id: "ice_wolf", name: "Frost", icon: "❄️", price: 2200, currency: "diamonds", rarity: "epic", description: "Frozen fury!", bonus: "+20% XP, freeze timer" },

    // Legendary
    { id: "dragon", name: "Inferno", icon: "🐉", price: 5000, currency: "diamonds", rarity: "legendary", description: "LEGENDARY DRAGON!", bonus: "+35% XP, +25% gems, fire breath effect" },
    { id: "celestial_cat", name: "Cosmos", icon: "🌟", price: 6000, currency: "diamonds", rarity: "legendary", description: "Born from stars!", bonus: "+30% XP, +2 hints/day, star trail" },
    { id: "shadow_dragon", name: "Nightmare", icon: "🖤", price: 7500, currency: "diamonds", rarity: "legendary", description: "From the void!", bonus: "+40% XP, shadow effects" },

    // Mythic
    { id: "cosmic_dragon", name: "Galaxia", icon: "🌌", price: 15000, currency: "diamonds", rarity: "mythic", description: "THE COSMIC DRAGON!", bonus: "+75% XP, +50% gems, all pet bonuses!" },
    { id: "rainbow_serpent", name: "Prisma", icon: "🌈", price: 20000, currency: "diamonds", rarity: "mythic", description: "Ancient deity!", bonus: "+100% Weekend XP, +5 hints/day, rainbow everything!" },
  ],

  boosts: [
    // Consumables - Common
    { id: "hint_1", name: "Hint", icon: "💡", price: 10, currency: "gold", rarity: "common", description: "1 hint for hard questions" },
    { id: "hint_5", name: "Hint Pack", icon: "💡", price: 40, currency: "gold", rarity: "common", description: "5 hints - Save 20%!" },
    { id: "hint_20", name: "Hint Bundle", icon: "💡", price: 140, currency: "gold", rarity: "uncommon", description: "20 hints - Save 30%!" },

    // Time boosts
    { id: "time_15", name: "+15 Seconds", icon: "⏱️", price: 25, currency: "gold", rarity: "common", description: "+15s on next question" },
    { id: "time_30", name: "+30 Seconds", icon: "⏰", price: 45, currency: "gold", rarity: "uncommon", description: "+30s on next question" },
    { id: "time_freeze", name: "Time Freeze", icon: "❄️", price: 100, currency: "gold", rarity: "rare", description: "Pause timer for 1 question!" },

    // XP Boosts
    { id: "xp_2x_1hr", name: "2x XP (1hr)", icon: "⚡", price: 75, currency: "gold", rarity: "uncommon", description: "Double XP for 1 hour!" },
    { id: "xp_2x_day", name: "2x XP (24hr)", icon: "⚡", price: 250, currency: "gold", rarity: "rare", description: "Double XP for 24 hours!" },
    { id: "xp_3x_1hr", name: "3x XP (1hr)", icon: "🔥", price: 150, currency: "gold", rarity: "rare", description: "TRIPLE XP for 1 hour!" },
    { id: "xp_5x_30min", name: "5x XP (30min)", icon: "💥", price: 200, currency: "gold", rarity: "epic", description: "5X XP MEGA BOOST!" },

    // Protection
    { id: "shield_1", name: "Streak Shield", icon: "🛡️", price: 50, currency: "gold", rarity: "uncommon", description: "Protect streak from 1 wrong answer" },
    { id: "shield_3", name: "Triple Shield", icon: "🛡️", price: 125, currency: "gold", rarity: "rare", description: "Protect streak 3 times!" },
    { id: "immortal", name: "Immortal Mode", icon: "💫", price: 300, currency: "gold", rarity: "epic", description: "Unlimited streak protection for 1 hour!" },

    // Gem boosters
    { id: "gem_luck", name: "Gem Luck", icon: "🍀", price: 100, currency: "gold", rarity: "rare", description: "+50% gem drop rate for 1 hour" },
    { id: "gem_magnet", name: "Gem Magnet", icon: "🧲", price: 200, currency: "gold", rarity: "epic", description: "2x gems for 1 hour!" },
    { id: "legendary_luck", name: "Legendary Luck", icon: "🌟", price: 500, currency: "gold", rarity: "legendary", description: "+200% legendary gem chance for 1 hour!" },

    // Special
    { id: "second_chance", name: "Second Chance", icon: "🔄", price: 75, currency: "gold", rarity: "rare", description: "Retry wrong answer once" },
    { id: "skip_ticket", name: "Skip Ticket", icon: "⏭️", price: 100, currency: "gold", rarity: "rare", description: "Skip 1 question without penalty" },
    { id: "answer_reveal", name: "Answer Reveal", icon: "👁️", price: 150, currency: "gold", rarity: "epic", description: "Reveal correct answer (no XP)" },
    { id: "mega_bundle", name: "MEGA BUNDLE", icon: "🎁", price: 999, currency: "gold", rarity: "legendary", description: "5x hints, 3x shields, 2x XP boost, gem luck!" },
  ],
};

type ShopCategory = keyof typeof SHOP_ITEMS;

interface ShopScreenProps {
  ownedItems: string[];
  diamonds: number;
  emeralds: number;
  gold: number;
  shopDiscount?: number; // 0-35% discount from tier system
  onPurchase: (
    itemId: string,
    itemType: string,
    price: number,
    currency: string
  ) => void;
}

export function ShopScreen({ ownedItems, diamonds, emeralds, gold, shopDiscount = 0, onPurchase }: ShopScreenProps) {
  const [activeTab, setActiveTab] = useState<ShopCategory>("skins");
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [filterRarity, setFilterRarity] = useState<Rarity | "all">("all");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const getBalance = (currency: string): number => {
    switch (currency) {
      case "diamonds": return diamonds;
      case "emeralds": return emeralds;
      case "gold": return gold;
      default: return 0;
    }
  };

  // Calculate discounted price
  const getDiscountedPrice = (originalPrice: number): number => {
    if (shopDiscount <= 0 || originalPrice === 0) return originalPrice;
    return Math.floor(originalPrice * (1 - shopDiscount / 100));
  };

  const canAfford = (item: ShopItem): boolean => {
    const price = getDiscountedPrice(item.price);
    return getBalance(item.currency) >= price;
  };

  const tabs: { id: ShopCategory; label: string; icon: string }[] = [
    { id: "skins", label: "SKINS", icon: "👤" },
    { id: "tools", label: "TOOLS", icon: "⚒️" },
    { id: "pets", label: "PETS", icon: "🐾" },
    { id: "boosts", label: "BOOSTS", icon: "⚡" },
  ];

  const rarities: { id: Rarity | "all"; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "common", label: "Common" },
    { id: "uncommon", label: "Uncommon" },
    { id: "rare", label: "Rare" },
    { id: "epic", label: "Epic" },
    { id: "legendary", label: "Legendary" },
    { id: "mythic", label: "Mythic" },
  ];

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "diamonds": return "💎";
      case "emeralds": return "🟢";
      case "gold": return "🪙";
      default: return "💎";
    }
  };

  const filteredItems = SHOP_ITEMS[activeTab].filter(
    (item) => filterRarity === "all" || item.rarity === filterRarity
  );

  return (
    <div className="screen active" style={{ padding: "15px", overflow: "auto" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "15px",
        gap: "10px",
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: "2em" }}>🏪</span>
        <h2 style={{
          margin: 0,
          fontSize: "1.8em",
          background: "linear-gradient(135deg, #FFD700, #FFA500)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 2px 10px rgba(255, 215, 0, 0.3)"
        }}>
          VILLAGE SHOP
        </h2>
        {shopDiscount > 0 && (
          <div style={{
            background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
            borderRadius: "12px",
            padding: "4px 12px",
            fontSize: "0.85em",
            fontWeight: "bold",
            color: "white",
            boxShadow: "0 2px 10px rgba(34, 197, 94, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}>
            🏷️ {shopDiscount}% OFF
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "10px",
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.9em",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: activeTab === tab.id
                ? "linear-gradient(135deg, #FFD700, #FFA500)"
                : "rgba(0,0,0,0.4)",
              color: activeTab === tab.id ? "#000" : "#FFF",
              transition: "all 0.2s ease",
              transform: activeTab === tab.id ? "scale(1.05)" : "scale(1)",
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rarity Filter */}
      <div style={{
        display: "flex",
        gap: "5px",
        marginBottom: "15px",
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        {rarities.map((r) => (
          <button
            key={r.id}
            onClick={() => setFilterRarity(r.id)}
            style={{
              padding: "5px 10px",
              borderRadius: "15px",
              border: filterRarity === r.id ? "2px solid #FFF" : "1px solid #555",
              cursor: "pointer",
              fontSize: "0.75em",
              background: r.id === "all"
                ? (filterRarity === "all" ? "#666" : "#333")
                : RARITY_COLORS[r.id as Rarity] + (filterRarity === r.id ? "" : "40"),
              color: "#FFF",
              transition: "all 0.2s ease",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "12px",
        maxHeight: "calc(100vh - 350px)",
        overflow: "auto",
        padding: "5px",
      }}>
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const owned = ownedItems.includes(item.id);
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedItem(item)}
                style={{
                  background: owned
                    ? "linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2))"
                    : "linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3))",
                  borderRadius: "12px",
                  padding: "15px 10px",
                  cursor: "pointer",
                  border: `2px solid ${owned ? "#22C55E" : RARITY_COLORS[item.rarity]}`,
                  boxShadow: RARITY_GLOW[item.rarity],
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Rarity badge */}
                <div style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  fontSize: "0.6em",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  background: RARITY_COLORS[item.rarity],
                  color: "#FFF",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}>
                  {item.rarity}
                </div>

                {/* Icon */}
                <div style={{
                  fontSize: "2.5em",
                  filter: item.rarity === "mythic" ? "drop-shadow(0 0 10px #EF4444)" :
                          item.rarity === "legendary" ? "drop-shadow(0 0 8px #F59E0B)" : "none"
                }}>
                  {item.icon}
                </div>

                {/* Name */}
                <div style={{
                  fontWeight: "bold",
                  fontSize: "0.9em",
                  textAlign: "center",
                  color: RARITY_COLORS[item.rarity]
                }}>
                  {item.name}
                </div>

                {/* Effect/Bonus */}
                {(item.effect || item.bonus) && (
                  <div style={{
                    fontSize: "0.7em",
                    color: "#AAA",
                    textAlign: "center"
                  }}>
                    {item.effect || item.bonus}
                  </div>
                )}

                {/* Price */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "10px",
                  background: owned ? "#22C55E" : "rgba(0,0,0,0.5)",
                  fontSize: "0.85em",
                  fontWeight: "bold",
                }}>
                  {owned ? "✓ OWNED" : (
                    <>
                      {getCurrencyIcon(item.currency)}
                      {shopDiscount > 0 && item.price > 0 ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ textDecoration: "line-through", color: "#888", fontSize: "0.9em" }}>
                            {item.price.toLocaleString()}
                          </span>
                          <span style={{ color: "#22C55E" }}>
                            {getDiscountedPrice(item.price).toLocaleString()}
                          </span>
                        </span>
                      ) : (
                        <span>{item.price.toLocaleString()}</span>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                borderRadius: "20px",
                padding: "25px",
                maxWidth: "350px",
                width: "100%",
                border: `3px solid ${RARITY_COLORS[selectedItem.rarity]}`,
                boxShadow: `${RARITY_GLOW[selectedItem.rarity]}, 0 20px 60px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Rarity Banner */}
              <div style={{
                textAlign: "center",
                marginBottom: "15px",
                padding: "5px 15px",
                background: RARITY_COLORS[selectedItem.rarity],
                borderRadius: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}>
                {selectedItem.rarity}
              </div>

              {/* Icon */}
              <div style={{
                fontSize: "5em",
                textAlign: "center",
                marginBottom: "10px",
                filter: selectedItem.rarity === "mythic" ? "drop-shadow(0 0 20px #EF4444)" :
                        selectedItem.rarity === "legendary" ? "drop-shadow(0 0 15px #F59E0B)" : "none"
              }}>
                {selectedItem.icon}
              </div>

              {/* Name */}
              <h2 style={{
                textAlign: "center",
                margin: "0 0 10px 0",
                color: RARITY_COLORS[selectedItem.rarity],
                fontSize: "1.5em"
              }}>
                {selectedItem.name}
              </h2>

              {/* Description */}
              {selectedItem.description && (
                <p style={{
                  textAlign: "center",
                  color: "#AAA",
                  margin: "0 0 15px 0",
                  fontStyle: "italic"
                }}>
                  "{selectedItem.description}"
                </p>
              )}

              {/* Effect/Bonus */}
              {(selectedItem.effect || selectedItem.bonus) && (
                <div style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: "10px 15px",
                  borderRadius: "10px",
                  marginBottom: "15px",
                  textAlign: "center",
                }}>
                  <div style={{ color: "#888", fontSize: "0.8em", marginBottom: "3px" }}>
                    {activeTab === "pets" ? "BONUS" : "EFFECT"}
                  </div>
                  <div style={{ color: "#22C55E", fontWeight: "bold" }}>
                    {selectedItem.effect || selectedItem.bonus}
                  </div>
                </div>
              )}

              {/* Price & Buy Button */}
              {(() => {
                const discountedPrice = getDiscountedPrice(selectedItem.price);
                const hasDiscount = shopDiscount > 0 && selectedItem.price > 0;

                if (ownedItems.includes(selectedItem.id)) {
                  return (
                    <div style={{
                      textAlign: "center",
                      padding: "15px",
                      background: "linear-gradient(135deg, #22C55E, #16A34A)",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      fontSize: "1.1em",
                    }}>
                      ✓ YOU OWN THIS!
                    </div>
                  );
                }

                if (!canAfford(selectedItem)) {
                  return (
                    <>
                      <div style={{
                        textAlign: "center",
                        padding: "15px",
                        background: "linear-gradient(135deg, #991B1B, #7F1D1D)",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "1em",
                        marginBottom: "10px",
                      }}>
                        ❌ NOT ENOUGH {selectedItem.currency.toUpperCase()}!
                      </div>
                      <div style={{
                        textAlign: "center",
                        padding: "10px",
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: "8px",
                        fontSize: "0.9em",
                      }}>
                        You have: {getCurrencyIcon(selectedItem.currency)} {getBalance(selectedItem.currency).toLocaleString()}
                        <br />
                        Need: {getCurrencyIcon(selectedItem.currency)} {discountedPrice.toLocaleString()}
                        {hasDiscount && (
                          <span style={{ color: "#22C55E", marginLeft: "5px" }}>
                            (was {selectedItem.price.toLocaleString()})
                          </span>
                        )}
                        <br />
                        <span style={{ color: "#EF4444" }}>
                          Missing: {getCurrencyIcon(selectedItem.currency)} {(discountedPrice - getBalance(selectedItem.currency)).toLocaleString()}
                        </span>
                      </div>
                    </>
                  );
                }

                return (
                  <>
                    {purchaseError && (
                      <div style={{
                        textAlign: "center",
                        padding: "10px",
                        background: "linear-gradient(135deg, #991B1B, #7F1D1D)",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "0.9em",
                        marginBottom: "10px",
                      }}>
                        ❌ {purchaseError}
                      </div>
                    )}
                    {hasDiscount && (
                      <div style={{
                        textAlign: "center",
                        marginBottom: "10px",
                        padding: "8px",
                        background: "rgba(34, 197, 94, 0.1)",
                        borderRadius: "8px",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                      }}>
                        <span style={{ color: "#22C55E", fontWeight: "bold" }}>
                          🏷️ {shopDiscount}% discount applied!
                        </span>
                        <span style={{ color: "#888", marginLeft: "8px", textDecoration: "line-through" }}>
                          {selectedItem.price.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setPurchaseError(null);
                        onPurchase(selectedItem.id, activeTab, discountedPrice, selectedItem.currency);
                        setSelectedItem(null);
                      }}
                      style={{
                        width: "100%",
                        padding: "15px",
                        borderRadius: "12px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "1.1em",
                        background: "linear-gradient(135deg, #FFD700, #FFA500)",
                        color: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      BUY FOR {getCurrencyIcon(selectedItem.currency)} {discountedPrice.toLocaleString()}
                    </button>
                  </>
                );
              })()}

              {/* Close hint */}
              <p style={{
                textAlign: "center",
                color: "#666",
                margin: "15px 0 0 0",
                fontSize: "0.8em"
              }}>
                Tap outside to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item count */}
      <div style={{
        textAlign: "center",
        marginTop: "10px",
        color: "#666",
        fontSize: "0.8em"
      }}>
        Showing {filteredItems.length} items • {ownedItems.length} owned
      </div>
    </div>
  );
}
