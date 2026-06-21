import Phaser from 'phaser';
import { PLAYER, STARTING_WEAPON } from '../config/GameConfig';
import type { PlayerStats, RunConfig, Weapon } from '../types';

export const TEX_PLAYER = 'player';

/**
 * The player avatar. Only one exists per run, so it is not pooled. Holds the
 * mutable stat block that upgrades modify, plus the owned weapons.
 *
 * Accepts an optional RunConfig (from MetaBonusResolver) so meta-progression
 * bonuses are baked into the initial stat block. Falls back to bare config
 * defaults when no config is provided (e.g. if Boot goes straight to Game).
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  stats: PlayerStats;
  hp: number;
  weapons: Weapon[] = [];

  /** Set to true once Second Wind has triggered this run. */
  secondWindUsed = false;
  /** Fraction of maxHp to restore on second wind; null = skill not owned. */
  secondWindReviveFrac: number | null;

  private invulnUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, runConfig?: RunConfig) {
    super(scene, x, y, TEX_PLAYER);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(PLAYER.radius);
    this.setCollideWorldBounds(true);
    this.setDepth(10);

    if (runConfig) {
      this.stats = { ...runConfig.baseStats };
      this.weapons = [{ ...runConfig.startingWeapon }];
      this.secondWindReviveFrac = runConfig.secondWindReviveFrac;
    } else {
      this.stats = { ...PLAYER };
      this.weapons = [{ ...STARTING_WEAPON }];
      this.secondWindReviveFrac = null;
    }

    this.hp = this.stats.maxHp;
  }

  move(dirX: number, dirY: number): void {
    this.setVelocity(dirX * this.stats.moveSpeed, dirY * this.stats.moveSpeed);
  }

  /**
   * Apply contact damage if not currently invulnerable.
   * Handles Second Wind: if the hit would kill and Second Wind is available,
   * revive instead.
   * @returns true if the hit was registered (for feedback).
   */
  takeDamage(amount: number, now: number): boolean {
    if (now < this.invulnUntil) return false;

    this.hp = Math.max(0, this.hp - amount);

    if (this.hp <= 0 && this.secondWindReviveFrac !== null && !this.secondWindUsed) {
      this.secondWindUsed = true;
      this.hp = Math.ceil(this.stats.maxHp * this.secondWindReviveFrac);
      // Longer invuln window after revive so the player can react.
      this.invulnUntil = now + PLAYER.hitCooldown * 4;
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(200, () => this.clearTint());
      return true;
    }

    this.invulnUntil = now + PLAYER.hitCooldown;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => this.clearTint());
    return true;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  hasWeapon(id: Weapon['id']): boolean {
    return this.weapons.some((w) => w.id === id);
  }

  addWeapon(weapon: Weapon): void {
    if (!this.hasWeapon(weapon.id)) this.weapons.push({ ...weapon });
  }
}
