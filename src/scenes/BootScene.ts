import Phaser from 'phaser';
import { COLORS, ENEMIES, GEM, PLAYER, PROJECTILE } from '../config/GameConfig';
import { TEX_PLAYER } from '../entities/Player';
import { ENEMY_TEXTURES } from '../entities/Enemy';
import { TEX_BOLT, TEX_ORB } from '../entities/Projectile';
import { TEX_GEM } from '../entities/Gem';

/**
 * Generates every sprite as a simple colored shape at boot, so the project
 * ships with zero binary art assets. Swap these out for real artwork later
 * without touching gameplay code (texture keys stay the same).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.makeCircle(TEX_PLAYER, PLAYER.radius, COLORS.player, true);

    this.makeCircle(ENEMY_TEXTURES.grunt, ENEMIES.grunt.radius, ENEMIES.grunt.color);
    this.makeCircle(ENEMY_TEXTURES.fast, ENEMIES.fast.radius, ENEMIES.fast.color);
    this.makeCircle(ENEMY_TEXTURES.tank, ENEMIES.tank.radius, ENEMIES.tank.color);

    this.makeCircle(TEX_BOLT, PROJECTILE.radius, COLORS.projectile);
    this.makeCircle(TEX_ORB, PROJECTILE.radius + 2, COLORS.projectileOrb);

    this.makeGem(TEX_GEM, GEM.radius, COLORS.gem);

    this.scene.start('Home');
  }

  /** Draw a filled circle (optionally with a bright ring) into a texture. */
  private makeCircle(key: string, radius: number, color: number, ring = false): void {
    const size = radius * 2;
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(radius, radius, radius);
    if (ring) {
      g.lineStyle(4, 0xffffff, 0.85);
      g.strokeCircle(radius, radius, radius - 2);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }

  /** Draw a diamond/gem shape into a texture. */
  private makeGem(key: string, radius: number, color: number): void {
    const size = radius * 2;
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(radius, 0);
    g.lineTo(size, radius);
    g.lineTo(radius, size);
    g.lineTo(0, radius);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0xffffff, 0.7);
    g.strokePath();
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
