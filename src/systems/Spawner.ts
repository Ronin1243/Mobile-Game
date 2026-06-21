import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Pool } from './Pool';
import { ENEMIES, EnemyDef, EnemyKind, SPAWN, VIEW, WORLD } from '../config/GameConfig';

/**
 * Releases waves of enemies just outside the camera view and ramps difficulty
 * every `rampIntervalSec` seconds: faster spawn cadence, bigger batches, and
 * tougher/faster enemies.
 */
export class Spawner {
  private timer = 0;
  /** Distance from the player at which enemies appear (always off-screen). */
  private readonly spawnRadius =
    Math.hypot(VIEW.width, VIEW.height) / 2 + SPAWN.offscreenMargin;

  constructor(
    private readonly enemies: Pool<Enemy>,
    private readonly playerPos: Phaser.Math.Vector2
  ) {}

  /** Current difficulty bracket (0-based). */
  private minute(elapsedMs: number): number {
    return Math.floor(elapsedMs / 1000 / SPAWN.rampIntervalSec);
  }

  update(delta: number, elapsedMs: number): void {
    if (this.enemies.countActive() >= SPAWN.maxAlive) return;

    const minute = this.minute(elapsedMs);
    const interval = Math.max(
      SPAWN.minIntervalMs,
      SPAWN.baseIntervalMs * Math.pow(SPAWN.intervalDecayPerMinute, minute)
    );

    this.timer += delta;
    if (this.timer < interval) return;
    this.timer = 0;

    const batch = Math.min(
      SPAWN.maxBatch,
      SPAWN.baseBatch + SPAWN.batchGrowthPerMinute * minute
    );
    const hpMult = Math.pow(1 + SPAWN.hpGrowthPerMinute, minute);
    const speedMult = Math.pow(1 + SPAWN.speedGrowthPerMinute, minute);

    for (let i = 0; i < batch; i++) {
      this.spawnOne(minute, hpMult, speedMult);
    }
  }

  private spawnOne(minute: number, hpMult: number, speedMult: number): void {
    const enemy = this.enemies.obtain();
    if (!enemy) return; // pool exhausted

    const def = this.pickEnemy(minute);
    const angle = Math.random() * Math.PI * 2;
    const x = Phaser.Math.Clamp(
      this.playerPos.x + Math.cos(angle) * this.spawnRadius,
      def.radius,
      WORLD.width - def.radius
    );
    const y = Phaser.Math.Clamp(
      this.playerPos.y + Math.sin(angle) * this.spawnRadius,
      def.radius,
      WORLD.height - def.radius
    );

    enemy.spawn(x, y, def, hpMult, speedMult, this.playerPos);
  }

  /** Weighted random pick among enemy kinds unlocked at the current minute. */
  private pickEnemy(minute: number): EnemyDef {
    const pool = (Object.keys(ENEMIES) as EnemyKind[])
      .map((k) => ENEMIES[k])
      .filter((d) => minute >= d.minMinute);

    const total = pool.reduce((sum, d) => sum + d.weight, 0);
    let roll = Math.random() * total;
    for (const def of pool) {
      roll -= def.weight;
      if (roll <= 0) return def;
    }
    return pool[0];
  }
}
