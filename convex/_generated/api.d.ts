/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as gems from "../gems.js";
import type * as leaderboards from "../leaderboards.js";
import type * as learning from "../learning.js";
import type * as levels from "../levels.js";
import type * as notifications from "../notifications.js";
import type * as parents from "../parents.js";
import type * as players from "../players.js";
import type * as profile from "../profile.js";
import type * as quests from "../quests.js";
import type * as scoring from "../scoring.js";
import type * as shop from "../shop.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  crons: typeof crons;
  dashboard: typeof dashboard;
  gems: typeof gems;
  leaderboards: typeof leaderboards;
  learning: typeof learning;
  levels: typeof levels;
  notifications: typeof notifications;
  parents: typeof parents;
  players: typeof players;
  profile: typeof profile;
  quests: typeof quests;
  scoring: typeof scoring;
  shop: typeof shop;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
