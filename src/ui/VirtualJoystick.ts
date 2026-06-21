import Phaser from 'phaser';
import { COLORS, VIEW } from '../config/GameConfig';

const BASE_RADIUS = 92;
const THUMB_RADIUS = 46;
const MAX_TRAVEL = 70;

/**
 * On-screen virtual joystick anchored bottom-center. Drag anywhere in the
 * lower half of the screen to steer; output is a normalized direction vector
 * read by the GameScene each frame. Drawn with scrollFactor 0 so it stays put
 * while the camera follows the player. No tap-to-shoot — movement only.
 */
export class VirtualJoystick {
  /** Normalized direction (length 0..1). Zero when idle. */
  readonly vector = new Phaser.Math.Vector2(0, 0);

  private readonly base: Phaser.GameObjects.Arc;
  private readonly thumb: Phaser.GameObjects.Arc;
  private readonly homeX: number;
  private readonly homeY: number;
  private activePointerId: number | null = null;

  constructor(scene: Phaser.Scene) {
    // Bottom-center, lifted clear of the safe-area / home indicator.
    this.homeX = VIEW.width / 2;
    this.homeY = VIEW.height - 190;

    this.base = scene.add
      .circle(this.homeX, this.homeY, BASE_RADIUS, COLORS.joystickBase, 0.12)
      .setStrokeStyle(3, COLORS.joystickBase, 0.35)
      .setScrollFactor(0)
      .setDepth(1000);

    this.thumb = scene.add
      .circle(this.homeX, this.homeY, THUMB_RADIUS, COLORS.joystickThumb, 0.32)
      .setScrollFactor(0)
      .setDepth(1001);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy(scene));
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.activePointerId !== null) return;
    // Only engage from the lower part of the screen (keeps top HUD free).
    if (pointer.y < VIEW.height * 0.45) return;
    this.activePointerId = pointer.id;
    this.updateFromPointer(pointer);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId) return;
    this.updateFromPointer(pointer);
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId) return;
    this.activePointerId = null;
    this.vector.set(0, 0);
    this.thumb.setPosition(this.homeX, this.homeY);
  }

  private updateFromPointer(pointer: Phaser.Input.Pointer): void {
    // Pointer coords are in screen space; convert relative to the fixed home.
    const dx = pointer.x - this.homeX;
    const dy = pointer.y - this.homeY;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, MAX_TRAVEL);
    const angle = Math.atan2(dy, dx);

    this.thumb.setPosition(
      this.homeX + Math.cos(angle) * clamped,
      this.homeY + Math.sin(angle) * clamped
    );

    // Normalize to 0..1 so movement magnitude scales with thumb travel.
    const mag = clamped / MAX_TRAVEL;
    this.vector.set(Math.cos(angle) * mag, Math.sin(angle) * mag);
  }

  private destroy(scene: Phaser.Scene): void {
    scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    this.base.destroy();
    this.thumb.destroy();
  }
}
