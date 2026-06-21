import Phaser from 'phaser';
import type { EnemyDef } from '../config/GameConfig';

export const ENEMY_TEXTURES: Record<string, string> = {
  grunt: 'enemy_grunt',
  fast: 'enemy_fast',
  tank: 'enemy_tank'
};

/**
 * Poolable enemy. Walks straight toward the player every frame. Difficulty
 * multipliers (HP/speed) are baked in at spawn time by the Spawner.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp = 1;
  maxHp = 1;
  speed = 0;
  contactDamage = 0;
  xpValue = 0;

  /** The point this enemy walks toward — set to the player on spawn. */
  target: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ENEMY_TEXTURES.grunt);
    this.setDepth(5);
  }

  spawn(
    x: number,
    y: number,
    def: EnemyDef,
    hpMult: number,
    speedMult: number,
    target: Phaser.Math.Vector2
  ): void {
    this.setTexture(ENEMY_TEXTURES[def.kind]);
    this.maxHp = Math.round(def.baseHp * hpMult);
    this.hp = this.maxHp;
    this.speed = def.baseSpeed * speedMult;
    this.contactDamage = def.contactDamage;
    this.xpValue = def.xp;
    this.target = target;

    this.enableBody(true, x, y, true, true);
    this.setCircle(def.radius);
    this.clearTint();
  }

  /** @returns true if this hit killed the enemy. */
  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) return true;
    // quick hit flash
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });
    return false;
  }

  deactivate(): void {
    this.disableBody(true, true);
  }

  update(): void {
    if (!this.active) return;
    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      this.target.x,
      this.target.y
    );
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }
}
