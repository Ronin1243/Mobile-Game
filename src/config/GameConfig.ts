// ---------------------------------------------------------------------------
// Single source of truth for all tuning values.
// Designers should only ever need to touch this file to balance the game.
// ---------------------------------------------------------------------------

import type { PlayerStats, UpgradeKind, Weapon } from '../types';

/** Logical render resolution (portrait). Scale.FIT letterboxes to fit. */
export const VIEW = {
  width: 720,
  height: 1280
} as const;

/** The arena is larger than the view so the camera has room to follow. */
export const WORLD = {
  width: 2400,
  height: 2400
} as const;

export const COLORS = {
  background: 0x0b0e1a,
  grid: 0x161b2e,
  player: 0x4cd5ff,
  projectile: 0xfff27a,
  projectileOrb: 0xff7ad5,
  enemy: 0xff5a6e,
  enemyFast: 0xff9d3d,
  enemyTank: 0xb15aff,
  gem: 0x6cff8f,
  joystickBase: 0xffffff,
  joystickThumb: 0xffffff,
  hpBar: 0xff5a6e,
  hpBarBg: 0x3a0d14,
  xpBar: 0x4cd5ff,
  xpBarBg: 0x10243a,
  text: 0xffffff
} as const;

export const PLAYER: PlayerStats & { radius: number; hitCooldown: number } = {
  maxHp: 100,
  moveSpeed: 230, // px / sec
  damageMult: 1,
  fireRateMult: 1,
  pickupRadius: 90,
  radius: 22,
  // Invulnerability window (ms) after taking a contact hit, so touching an
  // enemy doesn't drain the whole bar in a single frame.
  hitCooldown: 600
};

/** The weapon the player starts every run with. */
export const STARTING_WEAPON: Weapon = {
  id: 'bolt',
  baseInterval: 650,
  baseDamage: 18,
  projectileSpeed: 620,
  count: 1,
  cooldown: 0
};

/** Definition for the unlockable second weapon (granted via upgrade). */
export const ORB_WEAPON: Weapon = {
  id: 'orb',
  baseInterval: 1100,
  baseDamage: 26,
  projectileSpeed: 460,
  count: 3, // fires a small spread
  cooldown: 0
};

export const PROJECTILE = {
  radius: 8,
  lifespanMs: 1400,
  /** Hard caps for pools — sized for "hundreds on screen". */
  poolMax: 400
} as const;

// --- Enemies -------------------------------------------------------------
export type EnemyKind = 'grunt' | 'fast' | 'tank';

export interface EnemyDef {
  kind: EnemyKind;
  color: number;
  radius: number;
  baseHp: number;
  baseSpeed: number;
  contactDamage: number;
  xp: number;
  /** Relative spawn weight; higher = more common. */
  weight: number;
  /** Difficulty minute at which this enemy starts appearing. */
  minMinute: number;
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  grunt: {
    kind: 'grunt',
    color: COLORS.enemy,
    radius: 20,
    baseHp: 30,
    baseSpeed: 70,
    contactDamage: 8,
    xp: 1,
    weight: 70,
    minMinute: 0
  },
  fast: {
    kind: 'fast',
    color: COLORS.enemyFast,
    radius: 16,
    baseHp: 20,
    baseSpeed: 120,
    contactDamage: 6,
    xp: 2,
    weight: 25,
    minMinute: 1
  },
  tank: {
    kind: 'tank',
    color: COLORS.enemyTank,
    radius: 30,
    baseHp: 120,
    baseSpeed: 48,
    contactDamage: 16,
    xp: 5,
    weight: 12,
    minMinute: 2
  }
};

export const ENEMY_POOL_MAX = 600;

// --- Spawner & difficulty ramp ------------------------------------------
export const SPAWN = {
  /** Seconds per difficulty "minute" bracket (the brief says ramp every 60s). */
  rampIntervalSec: 60,
  /** ms between spawn ticks at minute 0. Shrinks as difficulty climbs. */
  baseIntervalMs: 900,
  /** Each minute multiplies the spawn interval by this (faster spawns). */
  intervalDecayPerMinute: 0.82,
  minIntervalMs: 140,
  /** Enemies released per spawn tick at minute 0. */
  baseBatch: 2,
  /** Extra enemies per batch added each minute. */
  batchGrowthPerMinute: 1,
  maxBatch: 18,
  /** Per-minute stat multipliers applied to spawned enemies. */
  hpGrowthPerMinute: 0.18, // +18% HP each minute (compounding)
  speedGrowthPerMinute: 0.06, // +6% speed each minute (compounding)
  /** Distance beyond the camera edge at which enemies appear. */
  offscreenMargin: 80,
  /** Safety cap so we never blow past the pool. */
  maxAlive: 500
} as const;

// --- Gems / XP -----------------------------------------------------------
export const GEM = {
  radius: 9,
  poolMax: 600,
  /** Speed gems fly at the player once inside the pickup radius. */
  magnetSpeed: 520,
  /** Distance at which a magnetised gem counts as collected. */
  collectDistance: 18
} as const;

export const XP = {
  /** XP needed to reach level 2. */
  baseRequirement: 5,
  /** Each level multiplies the previous requirement by this. */
  growth: 1.35,
  /** Flat XP added to the requirement each level (on top of growth). */
  flatPerLevel: 2
} as const;

/** XP required to advance FROM the given level (level 1 -> 2, etc.). */
export function xpForLevel(level: number): number {
  return Math.round(
    XP.baseRequirement * Math.pow(XP.growth, level - 1) +
      XP.flatPerLevel * (level - 1)
  );
}

// --- Upgrades ------------------------------------------------------------
export interface UpgradeDef {
  kind: UpgradeKind;
  title: string;
  description: string;
  /** If true, only offered when the player does NOT already own it. */
  unique?: boolean;
}

export const UPGRADES: UpgradeDef[] = [
  {
    kind: 'damage',
    title: '+25% Damage',
    description: 'All weapons hit harder.'
  },
  {
    kind: 'fireRate',
    title: '+15% Fire Rate',
    description: 'Weapons fire more often.'
  },
  {
    kind: 'moveSpeed',
    title: '+12% Move Speed',
    description: 'Dodge faster.'
  },
  {
    kind: 'maxHp',
    title: '+20 Max HP',
    description: 'Raise max HP and heal a little.'
  },
  {
    kind: 'pickup',
    title: '+30% Pickup Range',
    description: 'Vacuum gems from farther away.'
  },
  {
    kind: 'weaponOrb',
    title: 'New Weapon: Orbs',
    description: 'Launch a spread of homing orbs.',
    unique: true
  }
];

/** Magnitudes applied when an upgrade is chosen. */
export const UPGRADE_VALUES = {
  damageMult: 0.25,
  fireRateMult: 0.15,
  moveSpeedMult: 0.12,
  maxHpFlat: 20,
  maxHpHeal: 15,
  pickupMult: 0.3
} as const;

// --- Scoring -------------------------------------------------------------
export const SCORE = {
  perSecond: 10,
  perKill: 12,
  perLevel: 100
} as const;

export function computeScore(survivedMs: number, kills: number, level: number) {
  return Math.floor(
    (survivedMs / 1000) * SCORE.perSecond +
      kills * SCORE.perKill +
      level * SCORE.perLevel
  );
}
