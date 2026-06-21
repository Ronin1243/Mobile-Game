import Phaser from 'phaser';
import { PLAYER, STARTING_WEAPON } from '../config/GameConfig';
import type { PlayerStats, Weapon } from '../types';

export const TEX_PLAYER = 'player';

/**
 * The player avatar. Only one exists per run, so it is not pooled. Holds the
 * mutable stat block that upgrades modify, plus the owned weapons.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  stats: PlayerStats;
  hp: number;
  weapons: Weapon[] = [];

  /** Timestamp (scene time, ms) until which contact damage is ignored. */
  private invulnUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX_PLAYER);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(PLAYER.radius);
    this.setCollideWorldBounds(true);
    this.setDepth(10);

    // Deep-clone the config defaults so a run never mutates the source values.
    this.stats = { ...PLAYER };
    this.hp = this.stats.maxHp;
    this.weapons = [{ ...STARTING_WEAPON }];
  }

  /** Set velocity from a normalized direction vector (joystick output). */
  move(dirX: number, dirY: number): void {
    this.setVelocity(dirX * this.stats.moveSpeed, dirY * this.stats.moveSpeed);
  }

  /**
   * Apply contact damage if not currently invulnerable.
   * @returns true if the hit was applied (used to trigger feedback).
   */
  takeDamage(amount: number, now: number): boolean {
    if (now < this.invulnUntil) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnUntil = now + PLAYER.hitCooldown;
    // brief flash
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
