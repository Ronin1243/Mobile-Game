import Phaser from 'phaser';
import { PROJECTILE } from '../config/GameConfig';

export const TEX_BOLT = 'proj_bolt';
export const TEX_ORB = 'proj_orb';

/**
 * Poolable projectile. Travels in a straight line at a constant velocity and
 * deactivates itself after its lifespan elapses or on impact.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage = 0;
  private life = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX_BOLT);
    this.setDepth(8);
  }

  fire(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    texture: string
  ): void {
    this.setTexture(texture);
    this.damage = damage;
    this.life = PROJECTILE.lifespanMs;

    this.enableBody(true, x, y, true, true);
    this.setCircle(PROJECTILE.radius);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.setRotation(angle);
  }

  deactivate(): void {
    this.disableBody(true, true);
  }

  update(_time: number, delta: number): void {
    if (!this.active) return;
    this.life -= delta;
    if (this.life <= 0) this.deactivate();
  }
}
