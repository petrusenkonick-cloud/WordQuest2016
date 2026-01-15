"use client";

import { useState, useEffect } from "react";

// ============================================
// ТАКОЙ ЖЕ КРАСИВЫЙ КОД КАК В HTML, НО REACT
// ============================================

// Стили как CSS-in-JS объекты (можно и в отдельный CSS файл)
const styles = {
  // Цвета как в твоём HTML
  colors: {
    dirt: "#8B5A2B",
    dirtDark: "#5D3A1A",
    grass: "#5D8C3E",
    grassLight: "#7EC850",
    stone: "#7F7F7F",
    stoneDark: "#4A4A4A",
    diamond: "#4AEDD9",
    gold: "#FCDB05",
    emerald: "#17D049",
    obsidian: "#1B1B2F",
  }
};

// ============================================
// LOADING SCREEN
// ============================================
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("Loading world...");

  useEffect(() => {
    const messages = ["Loading world...", "Generating terrain...", "Spawning mobs...", "Almost ready..."];
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(onComplete, 300);
      }
      setProgress(p);
      setText(messages[Math.min(Math.floor(p / 25), 3)]);
    }, 200);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a0a00] to-[#2d1810] flex flex-col items-center justify-center z-[10000]">
      {/* Logo */}
      <h1
        className="font-game text-4xl text-[#FCDB05] mb-10 animate-bounce"
        style={{ textShadow: "4px 4px 0 #000, 0 0 20px #FCDB05" }}
      >
        ⛏️ WORDCRAFT
      </h1>

      {/* Progress Bar */}
      <div className="w-[300px] h-[30px] bg-[#1B1B1B] border-4 border-[#373737]">
        <div
          className="h-full bg-gradient-to-r from-[#17D049] to-[#7EC850] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Text */}
      <p className="font-game text-xs text-[#888] mt-5">{text}</p>
    </div>
  );
}

// ============================================
// LOGIN SCREEN
// ============================================
function LoginScreen({ onLogin }: { onLogin: (name: string, skin: string) => void }) {
  const [name, setName] = useState("Misha");
  const [skin, setSkin] = useState("🧑");
  const skins = ["🧑", "👦", "🧒", "🦸", "🧙", "🥷"];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9000]"
      style={{
        background: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="%231a1a2e" width="64" height="64"/><rect fill="%2316162a" width="32" height="32"/><rect fill="%2316162a" x="32" y="32" width="32" height="32"/></svg>')`
      }}
    >
      <div
        className="bg-gradient-to-b from-[#7F7F7F] to-[#4A4A4A] border-8 border-[#1B1B2F] p-10 text-center animate-[boxAppear_0.5s_ease-out]"
        style={{ boxShadow: "inset 4px 4px 0 rgba(255,255,255,0.2), 0 0 50px rgba(0,0,0,0.8)" }}
      >
        <h1
          className="font-game text-2xl text-[#FCDB05] mb-2"
          style={{ textShadow: "3px 3px 0 #000" }}
        >
          ⛏️ WORDCRAFT
        </h1>
        <h2
          className="font-game text-xs text-[#4AEDD9] mb-8"
          style={{ textShadow: "2px 2px 0 #000" }}
        >
          English Learning Adventure
        </h2>

        {/* Input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name..."
          className="w-full bg-gradient-to-b from-[#2D2D2D] to-[#1B1B1B] border-4 border-[#373737] p-4 font-game text-2xl text-white text-center focus:outline-none focus:border-[#4AEDD9] focus:shadow-[0_0_20px_#4AEDD9]"
        />

        {/* Skin Select */}
        <p className="text-[#AAA] my-4 text-lg">Choose character:</p>
        <div className="flex justify-center gap-2 mb-6">
          {skins.map((s) => (
            <button
              key={s}
              onClick={() => setSkin(s)}
              className={`w-14 h-14 bg-[#7F7F7F] border-4 text-3xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:border-[#FCDB05] ${
                skin === s ? "border-[#17D049] shadow-[0_0_15px_#17D049]" : "border-[#373737]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Play Button */}
        <button
          onClick={() => onLogin(name, skin)}
          className="w-full py-4 font-game text-sm bg-gradient-to-b from-[#5A5] to-[#383] border-4 border-[#252] text-white cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0.5"
          style={{ textShadow: "2px 2px 0 #000" }}
        >
          ▶️ PLAY
        </button>
      </div>
    </div>
  );
}

// ============================================
// HUD (верхняя панель)
// ============================================
function HUD({ player }: { player: { name: string; skin: string; level: number; xp: number; diamonds: number; emeralds: number; gold: number } }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/70 to-transparent">
      <div className="flex justify-between items-start flex-wrap gap-4">
        {/* Player Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#7F7F7F] border-3 border-[#1B1B2F] flex items-center justify-center text-3xl">
            {player.skin}
          </div>
          <div>
            <h3 className="font-game text-sm text-white" style={{ textShadow: "2px 2px 0 #000" }}>
              {player.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-[#FCDB05] text-black px-2 py-0.5 font-game text-[10px]">
                LVL {player.level}
              </span>
              <div className="w-24 h-2 bg-[#1B1B1B] border-2 border-[#373737]">
                <div className="h-full bg-[#17D049] transition-all" style={{ width: `${player.xp}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Currencies */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-black/60 px-4 py-2 border-3 border-[#4AEDD9]">
            <span className="text-xl">💎</span>
            <span className="font-game text-xs text-white" style={{ textShadow: "2px 2px 0 #000" }}>
              {player.diamonds}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/60 px-4 py-2 border-3 border-[#17D049]">
            <span className="text-xl">🟢</span>
            <span className="font-game text-xs text-white" style={{ textShadow: "2px 2px 0 #000" }}>
              {player.emeralds}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/60 px-4 py-2 border-3 border-[#FCDB05]">
            <span className="text-xl">🪙</span>
            <span className="font-game text-xs text-white" style={{ textShadow: "2px 2px 0 #000" }}>
              {player.gold}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LEVEL CARD
// ============================================
function LevelCard({
  icon,
  name,
  desc,
  diamonds,
  xp,
  locked = false,
  completed = false,
  onClick
}: {
  icon: string;
  name: string;
  desc: string;
  diamonds: number;
  xp: number;
  locked?: boolean;
  completed?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={locked ? undefined : onClick}
      className={`
        relative overflow-hidden p-5 cursor-pointer transition-all
        ${locked ? "grayscale-[0.8] cursor-not-allowed" : "hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]"}
        ${completed
          ? "bg-gradient-to-b from-[#17D049] from-0% via-[#0fa83a] via-[8%] to-[#8B5A2B]"
          : "bg-gradient-to-b from-[#7EC850] from-0% via-[#5D8C3E] via-[8%] to-[#8B5A2B]"
        }
        border-6 border-[#5D3A1A]
      `}
    >
      {/* Shine effect */}
      <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-500 hover:left-full" />

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-4xl animate-[float_3s_ease-in-out_infinite]">{icon}</span>
        <div className="flex gap-1">
          <span className="bg-black/50 px-2 py-1 text-sm text-white">💎{diamonds}</span>
          <span className="bg-black/50 px-2 py-1 text-sm text-white">⭐{xp}xp</span>
        </div>
      </div>

      {/* Title */}
      <h3
        className="font-game text-xs text-white mb-2 leading-relaxed"
        style={{ textShadow: "2px 2px 0 #000" }}
      >
        {name}
      </h3>
      <p className="text-[#CCC] text-base" style={{ textShadow: "1px 1px 0 #000" }}>
        {desc}
      </p>

      {/* Stars */}
      <div className="flex gap-1 mt-3">
        <span className={completed ? "text-yellow-400" : "text-gray-600"}>⭐</span>
        <span className={completed ? "text-yellow-400" : "text-gray-600"}>⭐</span>
        <span className={completed ? "text-yellow-400" : "text-gray-600"}>⭐</span>
      </div>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-5xl">🔒</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// STAT CARD
// ============================================
function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="bg-gradient-to-b from-[#7F7F7F] to-[#4A4A4A] border-4 border-[#1B1B2F] p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-game text-sm text-[#FCDB05]" style={{ textShadow: "2px 2px 0 #000" }}>
        {value}
      </div>
      <div className="text-[#AAA] text-sm mt-1">{label}</div>
    </div>
  );
}

// ============================================
// DAILY BANNER
// ============================================
function DailyBanner({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-[#9966CC] to-[#7B4BB8] border-6 border-[#5E3A8C] p-5 mb-6 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] animate-[bannerGlow_2s_ease-in-out_infinite]"
      style={{ boxShadow: "0 0 20px #9966CC" }}
    >
      <div>
        <h3 className="font-game text-sm text-white" style={{ textShadow: "2px 2px 0 #000" }}>
          🎁 DAILY REWARD!
        </h3>
        <p className="text-[#DDD] text-lg mt-1">Claim free rewards!</p>
      </div>
      <div className="text-5xl animate-[float_2s_ease-in-out_infinite]">📦</div>
    </div>
  );
}

// ============================================
// BOTTOM NAV
// ============================================
function BottomNav({ active, onChange }: { active: string; onChange: (screen: string) => void }) {
  const items = [
    { id: "home", icon: "🏠", label: "HOME" },
    { id: "shop", icon: "🏪", label: "SHOP" },
    { id: "bag", icon: "🎒", label: "BAG" },
    { id: "awards", icon: "🏆", label: "AWARDS" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-[#2D2D2D] to-[#1B1B1B] border-t-4 border-[#373737] p-2 flex justify-center gap-2 z-50">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`px-5 py-2 flex flex-col items-center gap-1 border-3 transition-all cursor-pointer ${
            active === item.id
              ? "bg-gradient-to-b from-[#FCDB05] to-[#D4A800] border-[#8B7000]"
              : "bg-gradient-to-b from-[#5A5A5A] to-[#3D3D3D] border-[#2D2D2D] hover:bg-gradient-to-b hover:from-[#FCDB05] hover:to-[#D4A800]"
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="font-game text-[8px] text-white">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================
// CLOUDS
// ============================================
function Clouds() {
  return (
    <div className="fixed top-0 left-0 w-full h-36 overflow-hidden pointer-events-none z-[1]">
      {[30, 70, 50].map((top, i) => (
        <div
          key={i}
          className="absolute bg-white/90 w-4 h-4"
          style={{
            top: `${top}px`,
            animation: `cloudFloat ${80 + i * 10}s linear infinite`,
            animationDelay: `${-i * 30}s`,
            boxShadow: `
              20px 0 0 rgba(255,255,255,0.9),
              40px 0 0 rgba(255,255,255,0.9),
              60px 0 0 rgba(255,255,255,0.9),
              10px -15px 0 rgba(255,255,255,0.9),
              30px -15px 0 rgba(255,255,255,0.9),
              50px -15px 0 rgba(255,255,255,0.9),
              20px -30px 0 rgba(255,255,255,0.9),
              40px -30px 0 rgba(255,255,255,0.9)
            `
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// SUN
// ============================================
function Sun() {
  return (
    <div
      className="fixed top-10 right-20 w-16 h-16 rounded-full z-0 animate-[sunPulse_4s_ease-in-out_infinite]"
      style={{
        background: "radial-gradient(circle, #FFF9C4, #FFEB3B 50%, #FF9800)",
        boxShadow: "0 0 50px #FFEB3B, 0 0 100px #FF9800"
      }}
    />
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function DemoCSSPage() {
  const [screen, setScreen] = useState<"loading" | "login" | "game">("loading");
  const [activeTab, setActiveTab] = useState("home");
  const [player, setPlayer] = useState({
    name: "Misha",
    skin: "🧑",
    level: 1,
    xp: 35,
    diamonds: 150,
    emeralds: 80,
    gold: 45,
    streak: 5,
    stars: 23,
    words: 47,
    quests: 12,
  });

  const levels = [
    { id: 1, icon: "🪨", name: "SUFFIX MINE", desc: 'Learn "-less" words', diamonds: 50, xp: 100 },
    { id: 2, icon: "📜", name: "COMMAND SCROLL", desc: "Command or Request?", diamonds: 50, xp: 120, locked: true },
    { id: 3, icon: "❓", name: "QUESTION FORGE", desc: "Create questions", diamonds: 60, xp: 150, locked: true },
    { id: 4, icon: "🗺️", name: "WORD MAP", desc: "Vocabulary puzzle", diamonds: 80, xp: 200, locked: true },
    { id: 5, icon: "📦", name: "CRAFTING TABLE", desc: "Build sentences", diamonds: 70, xp: 180, locked: true },
    { id: 6, icon: "📖", name: "STORY QUEST", desc: "Be a detective!", diamonds: 100, xp: 250, locked: true },
  ];

  if (screen === "loading") {
    return <LoadingScreen onComplete={() => setScreen("login")} />;
  }

  if (screen === "login") {
    return (
      <LoginScreen
        onLogin={(name, skin) => {
          setPlayer({ ...player, name, skin });
          setScreen("game");
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg,
          #87CEEB 0%, #87CEEB 50%,
          #7EC850 50%, #5D8C3E 52%,
          #8B5A2B 52%, #8B5A2B 70%,
          #7F7F7F 70%, #4A4A4A 100%)`
      }}
    >
      <Clouds />
      <Sun />
      <HUD player={player} />

      <div className="relative z-10 max-w-4xl mx-auto px-5 pt-24 pb-20">
        <DailyBanner onClick={() => alert("Daily reward!")} />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard icon="🔥" value={player.streak} label="Day Streak" />
          <StatCard icon="⭐" value={player.stars} label="Stars" />
          <StatCard icon="📚" value={player.words} label="Words" />
          <StatCard icon="🏆" value={player.quests} label="Quests" />
        </div>

        {/* Section Title */}
        <h2
          className="font-game text-base text-white mb-5 flex items-center gap-4"
          style={{ textShadow: "3px 3px 0 #000" }}
        >
          📜 WEEKLY QUESTS - Week 12
        </h2>

        {/* Level Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => (
            <LevelCard
              key={level.id}
              icon={level.icon}
              name={level.name}
              desc={level.desc}
              diamonds={level.diamonds}
              xp={level.xp}
              locked={level.locked}
              onClick={() => alert(`Starting ${level.name}!`)}
            />
          ))}
        </div>
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes cloudFloat {
          from { transform: translateX(-150px); }
          to { transform: translateX(calc(100vw + 150px)); }
        }
        @keyframes sunPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes bannerGlow {
          0%, 100% { box-shadow: 0 0 20px #9966CC; }
          50% { box-shadow: 0 0 40px #9966CC; }
        }
        @keyframes boxAppear {
          from { transform: scale(0.8) rotateX(20deg); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
