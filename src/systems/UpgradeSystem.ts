import { Player } from '../entities/Player';
import {
  ORB_WEAPON,
  UPGRADES,
  UPGRADE_VALUES,
  UpgradeDef
} from '../config/GameConfig';
import type { UpgradeChoice, UpgradeKind } from '../types';

/** Rolls level-up choices and applies the player's pick. */
export class UpgradeSystem {
  /** Returns up to 3 distinct upgrade choices valid for the player's state. */
  static rollChoices(player: Player): UpgradeChoice[] {
    const available = UPGRADES.filter((u) => UpgradeSystem.isAvailable(u, player));
    const picks: UpgradeDef[] = [];
    const bag = [...available];

    while (picks.length < 3 && bag.length > 0) {
      const idx = Math.floor(Math.random() * bag.length);
      picks.push(bag.splice(idx, 1)[0]);
    }

    // If everything unique is exhausted, pad with repeatable stat upgrades so
    // the player is always offered three options.
    const repeatable = UPGRADES.filter((u) => !u.unique);
    while (picks.length < 3 && repeatable.length > 0) {
      picks.push(repeatable[Math.floor(Math.random() * repeatable.length)]);
    }

    return picks.map((u) => ({
      kind: u.kind,
      title: u.title,
      description: u.description
    }));
  }

  private static isAvailable(u: UpgradeDef, player: Player): boolean {
    if (u.kind === 'weaponOrb') return !player.hasWeapon('orb');
    return true;
  }

  static apply(player: Player, kind: UpgradeKind): void {
    switch (kind) {
      case 'damage':
        player.stats.damageMult += UPGRADE_VALUES.damageMult;
        break;
      case 'fireRate':
        // Lower multiplier = faster firing. Clamp so it never hits zero.
        player.stats.fireRateMult = Math.max(
          0.2,
          player.stats.fireRateMult - UPGRADE_VALUES.fireRateMult
        );
        break;
      case 'moveSpeed':
        player.stats.moveSpeed *= 1 + UPGRADE_VALUES.moveSpeedMult;
        break;
      case 'maxHp':
        player.stats.maxHp += UPGRADE_VALUES.maxHpFlat;
        player.heal(UPGRADE_VALUES.maxHpHeal);
        break;
      case 'pickup':
        player.stats.pickupRadius *= 1 + UPGRADE_VALUES.pickupMult;
        break;
      case 'weaponOrb':
        player.addWeapon(ORB_WEAPON);
        break;
    }
  }
}
