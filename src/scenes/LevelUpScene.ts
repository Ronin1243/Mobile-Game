import Phaser from 'phaser';
import { COLORS, VIEW } from '../config/GameConfig';
import type { GameScene } from './GameScene';
import type { UpgradeChoice } from '../types';

interface LevelUpData {
  choices: UpgradeChoice[];
}

/**
 * Modal overlay launched on top of the paused GameScene. Presents three random
 * upgrade cards; tapping one applies it and resumes the run.
 */
export class LevelUpScene extends Phaser.Scene {
  private choices: UpgradeChoice[] = [];

  constructor() {
    super('LevelUp');
  }

  init(data: LevelUpData): void {
    this.choices = data.choices ?? [];
  }

  create(): void {
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

    this.add
      .rectangle(0, 0, VIEW.width, VIEW.height, 0x000000, 0.72)
      .setOrigin(0, 0);

    this.add
      .text(VIEW.width / 2, 220, 'LEVEL UP!', {
        fontFamily: 'monospace',
        fontSize: '52px',
        fontStyle: 'bold',
        color: hex(COLORS.xpBar)
      })
      .setOrigin(0.5);

    this.add
      .text(VIEW.width / 2, 285, 'Choose an upgrade', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: hex(COLORS.text)
      })
      .setOrigin(0.5);

    const cardW = VIEW.width - 120;
    const cardH = 170;
    const gap = 30;
    const startY = 400;

    this.choices.forEach((choice, i) => {
      this.buildCard(choice, VIEW.width / 2, startY + i * (cardH + gap), cardW, cardH);
    });
  }

  private buildCard(
    choice: UpgradeChoice,
    cx: number,
    cy: number,
    w: number,
    h: number
  ): void {
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

    const card = this.add
      .rectangle(cx, cy, w, h, 0x161b2e, 1)
      .setStrokeStyle(3, COLORS.xpBar, 0.9)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(cx, cy - 38, choice.title, {
        fontFamily: 'monospace',
        fontSize: '30px',
        fontStyle: 'bold',
        color: hex(COLORS.text),
        align: 'center',
        wordWrap: { width: w - 40 }
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 30, choice.description, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#b9c2d8',
        align: 'center',
        wordWrap: { width: w - 40 }
      })
      .setOrigin(0.5);

    card.on(Phaser.Input.Events.POINTER_OVER, () =>
      card.setFillStyle(0x1f2742, 1)
    );
    card.on(Phaser.Input.Events.POINTER_OUT, () => card.setFillStyle(0x161b2e, 1));
    card.on(Phaser.Input.Events.POINTER_DOWN, () => this.pick(choice));
  }

  private pick(choice: UpgradeChoice): void {
    const game = this.scene.get('Game') as GameScene;
    game.onUpgradeChosen(choice.kind);
    this.scene.stop();
    this.scene.resume('Game');
  }
}
