import Phaser from 'phaser';
import { GEM } from '../config/GameConfig';

export const TEX_GEM = 'gem';

/**
 * Poolable XP gem dropped by dead enemies. Sits still until the player comes
 * within pickup range, then magnetises toward the player and is collected on
 * contact. Collection is reported back to the GameScene via a callback set on
 * spawn (keeps the Gem decoupled from the scene type).
 */
export class Gem extends Phaser.Physics.Arcade.Sprite {
  xpValue = 0;

  private playerPos!: Phaser.Math.Vector2;
  private pickupRadiusRef!: () => number;
  private onCollect!: (gem: Gem) => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX_GEM);
    this.setDepth(3);
  }

  spawn(
    x: number,
    y: number,
    xp: number,
    playerPos: Phaser.Math.Vector2,
    pickupRadiusRef: () => number,
    onCollect: (gem: Gem) => void
  ): void {
    this.xpValue = xp;
    this.playerPos = playerPos;
    this.pickupRadiusRef = pickupRadiusRef;
    this.onCollect = onCollect;

    this.enableBody(true, x, y, true, true);
    this.setCircle(GEM.radius);
    this.setVelocity(0, 0);
  }

  deactivate(): void {
    this.disableBody(true, true);
  }

  update(): void {
    if (!this.active) return;
    const dist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.playerPos.x,
      this.playerPos.y
    );

    if (dist <= GEM.collectDistance) {
      this.onCollect(this);
      return;
    }

    if (dist <= this.pickupRadiusRef()) {
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        this.playerPos.x,
        this.playerPos.y
      );
      this.setVelocity(
        Math.cos(angle) * GEM.magnetSpeed,
        Math.sin(angle) * GEM.magnetSpeed
      );
    } else {
      this.setVelocity(0, 0);
    }
  }
}
