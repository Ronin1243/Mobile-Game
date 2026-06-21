import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile, TEX_BOLT, TEX_ORB } from '../entities/Projectile';
import { Pool } from './Pool';

/**
 * Drives auto-firing. Every frame each owned weapon ticks down its cooldown;
 * when ready it locks onto the nearest live enemy and pulls projectiles from
 * the pool. There is no manual aiming or tap-to-shoot.
 */
export class WeaponSystem {
  constructor(
    private readonly player: Player,
    private readonly enemies: Pool<Enemy>,
    private readonly projectiles: Pool<Projectile>
  ) {}

  update(delta: number): void {
    const target = this.findNearestEnemy();

    for (const weapon of this.player.weapons) {
      weapon.cooldown -= delta;
      if (weapon.cooldown > 0) continue;

      // Reset cooldown regardless — keeps cadence steady even with no target.
      weapon.cooldown = weapon.baseInterval * this.player.stats.fireRateMult;
      if (!target) continue;

      const baseAngle = Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        target.x,
        target.y
      );
      const damage = weapon.baseDamage * this.player.stats.damageMult;
      const texture = weapon.id === 'orb' ? TEX_ORB : TEX_BOLT;

      this.fireVolley(weapon.count, baseAngle, weapon.projectileSpeed, damage, texture);
    }
  }

  private fireVolley(
    count: number,
    baseAngle: number,
    speed: number,
    damage: number,
    texture: string
  ): void {
    // Spread shots evenly across a small arc centered on the aim direction.
    const spread = count > 1 ? Phaser.Math.DegToRad(18) : 0;
    const start = baseAngle - (spread * (count - 1)) / 2;

    for (let i = 0; i < count; i++) {
      const proj = this.projectiles.obtain();
      if (!proj) return; // pool exhausted this frame
      const angle = start + spread * i;
      proj.fire(this.player.x, this.player.y, angle, speed, damage, texture);
    }
  }

  private findNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let bestDistSq = Number.POSITIVE_INFINITY;
    const px = this.player.x;
    const py = this.player.y;

    this.enemies.forEachActive((enemy) => {
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const d = dx * dx + dy * dy;
      if (d < bestDistSq) {
        bestDistSq = d;
        nearest = enemy;
      }
    });

    return nearest;
  }
}
