---
name: WordQuest Visual Designer
description: Create stunning, modern React components for WordQuest with beautiful graphics, animations, and visual effects. Use for building visually impressive UI with charts, data visualizations, SVG graphics, 3D effects, and modern design aesthetics specifically for the WordQuest project.
version: 1.0.0
---

# WordQuest Visual Designer

This skill creates visually stunning React components specifically optimized for the WordQuest project with emphasis on graphics, animations, and modern design patterns.

## When to Use This Skill

Activate when user requests:
- Beautiful/modern React components for WordQuest
- Data visualizations and progress charts
- Interactive word game graphics
- Hero sections with visual effects
- Dashboard components for user stats
- Game interface elements
- 3D effects or animated backgrounds
- SVG-based graphics and illustrations

## Design Philosophy for WordQuest

**ALWAYS CREATE VISUALLY IMPRESSIVE COMPONENTS**

Never create plain, boring React components. Every WordQuest component should:
- Use playful, engaging design (word game aesthetic)
- Include smooth animations and transitions
- Have visual depth (3D transforms, parallax, layering)
- Feature rich graphics (SVG, Canvas, or libraries)
- Use vibrant colors that match word game theme
- Feel interactive and rewarding

## Core Principles

### 1. **Visual Hierarchy**
- Use size, color, and motion to guide attention
- Layer elements for depth
- Create focal points with contrast
- Make important game elements stand out

### 2. **Animation & Motion**
- Animate word reveals, score updates
- Use easing functions for smooth feel
- Reward animations for achievements
- Performance-first (CSS transforms)

### 3. **WordQuest Aesthetics**
- Playful gradients (purple, blue, green tones)
- Card-based layouts with depth
- Letter tile animations
- Progress bars with gradients
- Celebration effects (confetti, sparkles)

### 4. **Interactive Graphics**
- Use Recharts for progress/stats
- Lucide React for icons
- Framer Motion for game animations
- Custom SVG for letter tiles

## Available Libraries (Pre-installed)

```javascript
import { LineChart, BarChart, RadarChart, ... } from "recharts"
import { Trophy, Star, Zap, BookOpen, ... } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as d3 from "d3"
```

## WordQuest Component Templates

### 1. Letter Tile Component
```jsx
// Animated letter tile with flip effect
- 3D flip animation on reveal
- Gradient background
- Shadow and glow effects
- Bounce animation on correct guess
- Shake animation on wrong guess
```

### 2. Progress Dashboard Card
```jsx
// Glassmorphic stats card
- Blur background effect
- Animated progress charts
- Achievement badges
- Streak counter with fire animation
- Leaderboard position indicator
```

### 3. Word Game Board
```jsx
// Interactive game grid
- Letter tiles with stagger animation
- Color-coded feedback (correct/partial/wrong)
- Row completion celebration
- Keyboard with visual feedback
```

### 4. Achievement Pop-up
```jsx
// Celebration modal
- Confetti/particle effects
- Trophy/badge animation
- Score counter with counting up
- Share buttons with hover effects
```

## Code Structure Pattern for WordQuest

```jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap } from 'lucide-react';

export default function WordQuestComponent() {
  const [isVisible, setIsVisible] = useState(false);
  const [score, setScore] = useState(0);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            animate={{
              y: [0, -1000],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: '100%',
            }}
          />
        ))}
      </div>

      {/* Main game content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 container mx-auto px-4 py-8"
      >
        {/* WordQuest component content */}
      </motion.div>
    </div>
  );
}
```

## Essential WordQuest Patterns

### Letter Tile with Flip
```jsx
<motion.div
  className="relative w-16 h-16 cursor-pointer"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  <motion.div
    className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg flex items-center justify-center"
    animate={{ rotateY: isRevealed ? 180 : 0 }}
    transition={{ duration: 0.6 }}
  >
    <span className="text-2xl font-bold text-white">
      {letter}
    </span>
  </motion.div>
</motion.div>
```

### Progress Ring (Circular)
```jsx
const ProgressRing = ({ progress, total }) => {
  const percentage = (progress / total) * 100;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <svg className="w-32 h-32 transform -rotate-90">
      <circle
        cx="64"
        cy="64"
        r="45"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="8"
        fill="none"
      />
      <circle
        cx="64"
        cy="64"
        r="45"
        stroke="url(#gradient)"
        strokeWidth="8"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
};
```

### Celebration Confetti Effect
```jsx
const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            backgroundColor: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 4)],
          }}
          animate={{
            y: [0, window.innerHeight + 100],
            x: [0, (Math.random() - 0.5) * 200],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            opacity: [1, 0],
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};
```

### Streak Counter with Fire
```jsx
<div className="flex items-center gap-2 p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
  <motion.div
    animate={{
      scale: [1, 1.2, 1],
      rotate: [0, 5, -5, 0],
    }}
    transition={{
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 1,
    }}
  >
    <Zap className="w-8 h-8 text-white fill-white" />
  </motion.div>
  <div>
    <div className="text-2xl font-bold text-white">{streak}</div>
    <div className="text-xs text-white/80">Day Streak</div>
  </div>
</div>
```

## WordQuest Color Palettes

### Primary (Game Theme)
- Background: `from-indigo-900 via-purple-900 to-pink-900`
- Cards: `from-purple-500/20 to-pink-500/20`
- Accent: `purple-500`, `pink-500`, `indigo-500`
- Success: `green-500`, `emerald-500`
- Warning: `orange-500`, `amber-500`

### Letter States
- Correct: `bg-green-500` with glow
- Present: `bg-yellow-500` with glow  
- Absent: `bg-gray-700`
- Empty: `bg-white/10` with border

## Game UI Components

### 1. Word Input Row
```jsx
<div className="flex gap-2">
  {letters.map((letter, i) => (
    <motion.div
      key={i}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: i * 0.1 }}
      className={`w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg
        ${getLetterColor(letter.state)}
        shadow-lg`}
    >
      {letter.char}
    </motion.div>
  ))}
</div>
```

### 2. Stats Card
```jsx
<div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-bold text-white">Your Stats</h3>
    <Trophy className="w-6 h-6 text-yellow-400" />
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    <StatItem label="Games Played" value={gamesPlayed} icon={<Gamepad2 />} />
    <StatItem label="Win Rate" value={`${winRate}%`} icon={<TrendingUp />} />
    <StatItem label="Current Streak" value={streak} icon={<Zap />} />
    <StatItem label="Best Streak" value={bestStreak} icon={<Star />} />
  </div>
</div>
```

### 3. Achievement Badge
```jsx
<motion.div
  whileHover={{ scale: 1.1, rotate: 5 }}
  className="relative group"
>
  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
    <Trophy className="w-10 h-10 text-white" />
  </div>
  <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
</motion.div>
```

## Animation Sequences

### Word Reveal Animation
```jsx
const revealWord = async () => {
  for (let i = 0; i < word.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Flip tile at index i
  }
};
```

### Score Update with Celebration
```jsx
<AnimatePresence>
  {scoreChanged && (
    <motion.div
      initial={{ scale: 0, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
    >
      <div className="text-6xl font-bold text-white">
        +{points}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

## Performance Tips for WordQuest

1. **Memoize letter tiles** with React.memo()
2. **Debounce keyboard input** for smooth typing
3. **Use CSS transforms** for tile animations
4. **Lazy load achievement animations**
5. **Optimize particle count** based on device

## Common WordQuest Components

"Create an animated word game board with flip animations"

"Build a stats dashboard with progress charts"

"Make a celebration screen with confetti effect"

"Design achievement badges with unlock animations"

"Create a leaderboard with animated rankings"

## Remember for WordQuest

- **Fun and playful** is the priority
- Every interaction should feel rewarding
- Use lots of micro-animations
- Make success moments celebratory
- Keep it colorful and energetic
- Mobile-first responsive design
- Smooth 60fps animations

## Quick WordQuest Checklist

- [ ] Vibrant purple/pink/indigo palette
- [ ] Letter tile animations
- [ ] Progress/stats visualizations
- [ ] Achievement celebrations
- [ ] Glassmorphic UI cards
- [ ] Icon integration (Lucide)
- [ ] Responsive grid layouts
- [ ] Sound-ready (can add later)
