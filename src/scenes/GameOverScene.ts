import Phaser from 'phaser';
import { COLORS, VIEW } from '../config/GameConfig';
import type { RunResult } from '../types';

/** Final screen: shows the run score breakdown and a Retry button. */
export class GameOverScene extends Phaser.Scene {
  private result!: RunResult;

  constructor() {
    super('GameOver');
  }

  init(data: RunResult): void {
    this.result = data;
  }

  create(): void {
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
    const cx = VIEW.width / 2;

    this.add
      .rectangle(0, 0, VIEW.width, VIEW.height, 0x000000, 0.8)
      .setOrigin(0, 0);

    this.add
      .text(cx, 300, 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '64px',
        fontStyle: 'bold',
        color: hex(COLORS.enemy)
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 410, `SCORE  ${this.result.score}`, {
        fontFamily: 'monospace',
        fontSize: '44px',
        fontStyle: 'bold',
        color: hex(COLORS.text)
      })
      .setOrigin(0.5);

    const lines = [
      `Survived   ${this.formatTime(this.result.survivedMs)}`,
      `Kills      ${this.result.kills}`,
      `Level      ${this.result.level}`
    ];
    this.add
      .text(cx, 540, lines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#b9c2d8',
        align: 'left',
        lineSpacing: 14
      })
      .setOrigin(0.5);

    this.buildRetryButton(cx, 760);
  }

  private buildRetryButton(cx: number, cy: number): void {
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
    const w = 320;
    const h = 90;

    const btn = this.add
      .rectangle(cx, cy, w, h, COLORS.xpBar, 1)
      .setStrokeStyle(3, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(cx, cy, 'RETRY', {
        fontFamily: 'monospace',
        fontSize: '40px',
        fontStyle: 'bold',
        color: hex(COLORS.background)
      })
      .setOrigin(0.5);

    btn.on(Phaser.Input.Events.POINTER_OVER, () => btn.setScale(1.04));
    btn.on(Phaser.Input.Events.POINTER_OUT, () => btn.setScale(1));
    btn.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.scene.stop('GameOver');
      this.scene.stop('HUD');
      this.scene.start('Game');
    });
  }

  private formatTime(ms: number): string {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
