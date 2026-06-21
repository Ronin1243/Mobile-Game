import Phaser from 'phaser';

/**
 * Thin, typed wrapper around a Phaser Arcade physics group used as an object
 * pool. Sprites are reused via `obtain()` (which returns an inactive member or
 * creates a new one up to `maxSize`) rather than being created/destroyed every
 * time — essential when hundreds of enemies/projectiles/gems are on screen.
 *
 * Each pooled entity is responsible for activating itself in its own
 * `spawn(...)` method and deactivating in `deactivate()`.
 */
export class Pool<T extends Phaser.Physics.Arcade.Sprite> {
  readonly group: Phaser.Physics.Arcade.Group;

  constructor(
    scene: Phaser.Scene,
    classType: new (scene: Phaser.Scene, x: number, y: number) => T,
    maxSize: number
  ) {
    this.group = scene.physics.add.group({
      classType: classType as unknown as Phaser.Types.Physics.Arcade.PhysicsGroupConfig['classType'],
      maxSize,
      runChildUpdate: true
    });
  }

  /**
   * Returns a pooled instance to be configured by the caller, or `null` if the
   * pool is exhausted (all members active and at maxSize).
   */
  obtain(): T | null {
    return (this.group.get() as T) ?? null;
  }

  countActive(): number {
    return this.group.countActive(true);
  }

  /** Iterate only the active members. */
  forEachActive(cb: (member: T) => void): void {
    (this.group.getChildren() as T[]).forEach((m) => {
      if (m.active) cb(m);
    });
  }
}
