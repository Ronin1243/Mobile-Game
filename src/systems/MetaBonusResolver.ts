import {
  CHARACTERS,
  GREED_MULT_PER_LEVEL,
  PLAYER,
  SECOND_WIND_REVIVE_FRACS,
  SKILL_MULT_DELTA,
  SKILL_STAT_DELTA,
  SKILLS
} from '../config/GameConfig';
import type { SaveData } from '../save/SaveTypes';
import type { PlayerStats, RunConfig, SkillId } from '../types';

/**
 * Pure function: reads the current save and produces a RunConfig that the
 * GameScene passes to Player at the start of each run.
 * No mutation — safe to call multiple times.
 */
export function resolveRunConfig(save: SaveData): RunConfig {
  const charDef = CHARACTERS[save.profile.equippedCharacter];
  const levels: Record<SkillId, number> = save.upgrades;

  // Start from global defaults.
  const stats: PlayerStats = { ...PLAYER };

  // Apply flat skill-tree bonuses.
  for (const id of Object.keys(SKILLS) as SkillId[]) {
    const level = levels[id] ?? 0;
    if (level <= 0) continue;

    const flat = SKILL_STAT_DELTA[id];
    for (const [key, delta] of Object.entries(flat) as [keyof PlayerStats, number][]) {
      (stats[key] as number) += delta * level;
    }
  }

  // Apply multiplicative skill bonuses.
  for (const [id, mult] of Object.entries(SKILL_MULT_DELTA)) {
    if (!mult) continue;
    const level = levels[id as keyof typeof levels] ?? 0;
    if (level <= 0) continue;
    const base = stats[mult.stat] as number;
    (stats[mult.stat] as number) = base * Math.pow(1 + mult.rate, level);
  }

  // Apply character passive (flat deltas, positive or negative).
  const passive = charDef.passive;
  for (const [key, delta] of Object.entries(passive) as [keyof PlayerStats, number][]) {
    (stats[key] as number) += delta;
  }

  // Clamp sanity floors.
  stats.maxHp = Math.max(1, Math.round(stats.maxHp));
  stats.moveSpeed = Math.max(10, stats.moveSpeed);
  stats.damageMult = Math.max(0.1, stats.damageMult);
  stats.fireRateMult = Math.max(0.1, stats.fireRateMult);
  stats.pickupRadius = Math.max(20, stats.pickupRadius);

  // Head Start: each level gives +1 starting in-run level.
  const startLevel = 1 + (levels.headStart ?? 0);

  // Second Wind revive fraction (null if skill not purchased).
  const swLevel = levels.secondWind ?? 0;
  const secondWindReviveFrac =
    swLevel > 0 ? SECOND_WIND_REVIVE_FRACS[swLevel - 1] : null;

  // Greed multiplier.
  const greedMult = 1 + GREED_MULT_PER_LEVEL * (levels.greed ?? 0);

  return {
    baseStats: stats,
    startingWeapon: { ...charDef.startingWeapon, cooldown: 0 },
    startLevel,
    secondWindReviveFrac,
    greedMult
  };
}
