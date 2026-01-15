"use client";

import { useState } from "react";

// Shop data
const SHOP_ITEMS = {
  skins: [
    { id: "steve", name: "Steve", icon: "🧑", price: 0, currency: "diamonds" },
    { id: "alex", name: "Alex", icon: "👧", price: 100, currency: "diamonds" },
    { id: "knight", name: "Knight", icon: "🦸", price: 200, currency: "diamonds" },
    { id: "wizard", name: "Wizard", icon: "🧙", price: 300, currency: "diamonds" },
    { id: "ninja", name: "Ninja", icon: "🥷", price: 500, currency: "diamonds" },
    { id: "robot", name: "Robot", icon: "🤖", price: 1000, currency: "diamonds" },
  ],
  tools: [
    { id: "wood_pick", name: "Wood Pick", icon: "🪓", price: 50, currency: "emeralds", effect: "+5% XP" },
    { id: "stone_pick", name: "Stone Pick", icon: "⛏️", price: 100, currency: "emeralds", effect: "+10% XP" },
    { id: "iron_pick", name: "Iron Pick", icon: "🔨", price: 200, currency: "emeralds", effect: "+15% XP" },
    { id: "diamond_pick", name: "Diamond Pick", icon: "💎", price: 500, currency: "emeralds", effect: "+25% XP" },
  ],
  pets: [
    { id: "cat", name: "Cat", icon: "🐱", price: 150, currency: "diamonds" },
    { id: "dog", name: "Dog", icon: "🐶", price: 150, currency: "diamonds" },
    { id: "parrot", name: "Parrot", icon: "🦜", price: 200, currency: "diamonds" },
    { id: "fox", name: "Fox", icon: "🦊", price: 300, currency: "diamonds" },
    { id: "dragon", name: "Dragon", icon: "🐉", price: 1000, currency: "diamonds" },
  ],
  boosts: [
    { id: "hints", name: "Hints x5", icon: "💡", price: 25, currency: "gold" },
    { id: "shield", name: "Shield", icon: "🛡️", price: 50, currency: "gold" },
    { id: "2xp", name: "2X XP", icon: "⚡", price: 100, currency: "gold" },
  ],
};

type ShopCategory = keyof typeof SHOP_ITEMS;

interface ShopScreenProps {
  ownedItems: string[];
  onPurchase: (
    itemId: string,
    itemType: string,
    price: number,
    currency: string
  ) => void;
}

export function ShopScreen({ ownedItems, onPurchase }: ShopScreenProps) {
  const [activeTab, setActiveTab] = useState<ShopCategory>("skins");

  const tabs: { id: ShopCategory; label: string }[] = [
    { id: "skins", label: "SKINS" },
    { id: "tools", label: "TOOLS" },
    { id: "pets", label: "PETS" },
    { id: "boosts", label: "BOOSTS" },
  ];

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "diamonds": return "💎";
      case "emeralds": return "🟢";
      case "gold": return "🪙";
      default: return "💎";
    }
  };

  return (
    <div className="screen active">
      <h2 className="section-title">🏪 VILLAGE SHOP</h2>

      {/* Tabs */}
      <div className="shop-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`shop-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Items Grid */}
      <div className="shop-grid">
        {SHOP_ITEMS[activeTab].map((item) => {
          const owned = ownedItems.includes(item.id);
          return (
            <div
              key={item.id}
              className={`shop-item ${owned ? "owned" : ""}`}
              onClick={() =>
                !owned && onPurchase(item.id, activeTab, item.price, item.currency)
              }
            >
              <div className="shop-item-icon">{item.icon}</div>
              <div className="shop-item-name">{item.name}</div>
              {"effect" in item && (
                <div style={{ color: "#AAA", fontSize: "0.85em", marginBottom: "8px" }}>
                  {item.effect}
                </div>
              )}
              <div className="shop-item-price">
                {owned ? "✓ OWNED" : `${getCurrencyIcon(item.currency)} ${item.price}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
