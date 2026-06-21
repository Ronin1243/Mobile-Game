import Phaser from 'phaser';
import { COLORS, VIEW } from '../config/GameConfig';
import type { GameScene, HudState } from './GameScene';

const MARGIN = 24;
const TOP = 54; // clear of the safe-area / status bar
const BAR_W = VIEW.width - MARGIN * 2;

/** Static overlay: timer, level, XP bar, HP bar and kill count along the top. */
export class HUDScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private bars!: Phaser.GameObjects.Graphics;
  private state: HudState | null = null;

  constructor() {
    super('HUD');
  }

  create(): void {
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
    const base = { fontFamily: 'monospace', color: hex(COLORS.text) };

    this.levelText = this.add
      .text(MARGIN, TOP, 'LV 1', { ...base, fontSize: '30px', fontStyle: 'bold' })
      .setOrigin(0, 0);

    this.timerText = this.add
      .text(VIEW.width / 2, TOP, '00:00', { ...base, fontSize: '40px', fontStyle: 'bold' })
      .setOrigin(0.5, 0);

    this.killsText = this.add
      .text(VIEW.width - MARGIN, TOP, '☠ 0', { ...base, fontSize: '30px', fontStyle: 'bold' })
      .setOrigin(1, 0);

    this.hpText = this.add
      .text(MARGIN, TOP + 120, '', { ...base, fontSize: '22px' })
      .setOrigin(0, 0.5);

    this.bars = this.add.graphics();

    const game = this.scene.get('Game') as GameScene;
    game.events.on('hud', this.onHud, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      game.events.off('hud', this.onHud, this);
    });
  }

  private onHud(state: HudState): void {
    this.state = state;
  }

  update(): void {
    if (!this.state) return;
    const s = this.state;

    this.timerText.setText(this.formatTime(s.timeMs));
    this.levelText.setText(`LV ${s.level}`);
    this.killsText.setText(`☠ ${s.kills}`);
    this.hpText.setText(`HP ${Math.ceil(s.hp)} / ${s.maxHp}`);

    this.bars.clear();

    // XP bar (just under the top row).
    const xpY = TOP + 56;
    const xpFrac = Phaser.Math.Clamp(s.xp / s.xpToNext, 0, 1);
    this.drawBar(MARGIN, xpY, BAR_W, 16, xpFrac, COLORS.xpBarBg, COLORS.xpBar);

    // HP bar (below the XP bar).
    const hpY = TOP + 108;
    const hpFrac = Phaser.Math.Clamp(s.hp / s.maxHp, 0, 1);
    this.drawBar(MARGIN, hpY, BAR_W, 22, hpFrac, COLORS.hpBarBg, COLORS.hpBar);
  }

  private drawBar(
    x: number,
    y: number,
    w: number,
    h: number,
    frac: number,
    bg: number,
    fg: number
  ): void {
    this.bars.fillStyle(bg, 1).fillRoundedRect(x, y, w, h, h / 2);
    if (frac > 0) {
      this.bars.fillStyle(fg, 1).fillRoundedRect(x, y, Math.max(h, w * frac), h, h / 2);
    }
    this.bars.lineStyle(2, 0xffffff, 0.25).strokeRoundedRect(x, y, w, h, h / 2);
  }

  private formatTime(ms: number): string {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const sec = (total % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }
}
