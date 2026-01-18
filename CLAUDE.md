# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start both Next.js and Convex dev servers
npm run dev

# Start servers separately
npm run dev:next    # Next.js on localhost:3000
npm run dev:convex  # Convex backend

# Build for production
npm run build

# Lint
npm run lint
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Convex (real-time serverless database)
- **Auth**: Clerk
- **State**: Zustand with localStorage persistence
- **Animation**: Framer Motion

## Architecture

### Frontend (`/src`)

**Screen-based navigation**: All views are components in `/src/components/screens/` (28 screens). The `currentScreen` state in Zustand controls navigation.

**Game components** (`/src/components/game/`): 16 mini-games wrapped in `GameContainer` which handles UI chrome, animations, and particles.

**Provider stack** (in order):
```
ClerkProviderWrapper → ConvexClientProvider → ConvexSyncProvider → AudioProvider → GlobalEffects
```

**State management** (`/src/lib/store.ts`): Zustand store with slices for Player, Game, UI, Audio states. Offline-first design with Convex sync.

### Backend (`/convex`)

40+ tables organized by feature:
- **Core**: `players`, `inventory`, `completedLevels`, `playerAchievements`
- **Learning**: `topicProgress`, `learningProfile`, `spacedRepetition`, `spellBook`
- **Progression**: `questChapters`, `quests`, `lifeSkillsProgress`, `wizardProfile`
- **Gems**: `playerGems`, `gemCollections`, `craftingHistory`, `miningSessions`
- **Competition**: `leaderboards`, `weeklyChampion`, `challenges`
- **Parent**: `parentLinks`, `parentNotifications`

Schema defined in `convex/schema.ts`. Auto-generated types in `convex/_generated/`.

### API Routes (`/src/app/api/`)

Claude AI integration endpoints:
- `analyze-homework/` - AI homework image analysis
- `explain/` - AI explanations
- `practice/` - Practice question generation
- `telegram/` - Parent notification webhooks

## Key Patterns

**Convex sync**: `useConvexSync()` hook in `/src/lib/useConvexSync.ts` bridges local Zustand store with Convex. Falls back to localStorage if Convex unavailable.

**Game data**: Level configurations and question banks in `/src/lib/gameData.ts`.

**Gem system**: 8 gem types with rarity, collections, crafting, and mining mechanics.

**Two learning academies**:
- Word Wizard Academy: 12 chapters, vocabulary/grammar
- Life Skills Academy: 4 islands (Critical Thinking, Emotional, AI, Financial), 12 chapters total

## Environment Variables

Required in `.env.local`:
- `CONVEX_DEPLOYMENT` - Convex deployment URL
- `NEXT_PUBLIC_CONVEX_URL` - Public Convex URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk auth
- `CLERK_SECRET_KEY` - Clerk server key
- `ANTHROPIC_API_KEY` - Claude API for homework analysis

## PWA

Service worker in `public/sw.js`. Bump `CACHE_NAME` version when deploying significant changes.
