import Phaser from 'phaser';
import { COLORS, SKILLS, VIEW, skillCost } from '../config/GameConfig';
import { saveService } from '../save/SaveService';
import type { SkillId } from '../types';

const CARD_W = 620;
const CARD_H = 148;
const CARD_GAP = 18;
const LIST_TOP = 230;

/**
 * Scrollable list of the 7 meta-skills. Each card shows current / max level,
 * the next-level effect, cost, and a Buy button that deducts coins live.
 */
export class SkillTreeScene extends Phaser.Scene {
  private coinsBadge!: Phaser.GameObjects.Text;
  /** Card refresh callbacks keyed by skill id, called after a purchase. */
  private readonly cardUpdaters = new Map<SkillId, () => void>();

  constructor() {
    super('SkillTree');
  }

  create(): void {
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
    const cx = VIEW.width / 2;

    this.add.rectangle(0, 0, VIEW.width, VIEW.height, COLORS.background, 1).setOrigin(0, 0);
    this.add.rectangle(0, 0, VIEW.width, 6, COLORS.xpBar, 1).setOrigin(0, 0);

    this.add
      .text(cx, 70, 'SKILL TREE', {
        fontFamily: 'monospace',
        fontSize: '48px',
        fontStyle: 'bold',
        color: hex(COLORS.text)
      })
      .setOrigin(0.5);

    // Coins display (live-updated after purchases).
    const coinsX = VIEW.width - 50;
    this.add
      .text(coinsX, 140, '', { fontFamily: 'monospace', fontSize: '28px', color: hex(COLORS.coin) })
      .setOrigin(1, 0.5);
    this.coinsBadge = this.add
      .text(coinsX, 140, this.coinsLabel(), {
        fontFamily: 'monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: hex(COLORS.coin)
      })
      .setOrigin(1, 0.5);

    // Build one card per skill.
    const skillIds = Object.keys(SKILLS) as SkillId[];
    skillIds.forEach((id, i) => {
      const y = LIST_TOP + i * (CARD_H + CARD_GAP) + CARD_H / 2;
      this.buildSkillCard(id, VIEW.width / 2, y, hex);
    });

    // Back button.
    this.buildBackButton(hex);
  }

  private buildSkillCard(
    id: SkillId,
    cx: number,
    cy: number,
    hex: (c: number) => string
  ): void {
    const def = SKILLS[id];

    const bg = this.add
      .rectangle(cx, cy, CARD_W, CARD_H, COLORS.panel, 1)
      .setStrokeStyle(2, COLORS.panelBorder, 1);

    // Title + level display (refreshable).
    const titleText = this.add
      .text(cx - CARD_W / 2 + 20, cy - 44, '', {
        fontFamily: 'monospace',
        fontSize: '26px',
        fontStyle: 'bold',
        color: hex(COLORS.text)
      })
      .setOrigin(0, 0.5);

    const effectText = this.add
      .text(cx - CARD_W / 2 + 20, cy - 4, def.effectLabel, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: hex(COLORS.textMuted),
        wordWrap: { width: CARD_W - 190 }
      })
      .setOrigin(0, 0.5);

    const costText = this.add
      .text(cx - CARD_W / 2 + 20, cy + 42, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: hex(COLORS.coin)
      })
      .setOrigin(0, 0.5);

    // Buy button (right side of card).
    const btnX = cx + CARD_W / 2 - 80;
    const buyBtn = this.add
      .rectangle(btnX, cy, 130, 60, COLORS.xpBar, 1)
      .setInteractive({ useHandCursor: true });

    const buyLabel = this.add
      .text(btnX, cy, 'BUY', {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        color: hex(COLORS.background)
      })
      .setOrigin(0.5);

    const refresh = (): void => {
      const save = saveService.get();
      const level = save.upgrades[id];
      const atMax = level >= def.maxLevel;

      titleText.setText(`${def.title}  ${level} / ${def.maxLevel}`);
      void effectText;

      if (atMax) {
        costText.setText('MAX LEVEL');
        costText.setColor(hex(COLORS.textMuted));
        buyBtn.setFillStyle(COLORS.panelBorder, 1).disableInteractive();
        buyLabel.setText('MAX').setColor(hex(COLORS.textMuted));
        bg.setStrokeStyle(2, COLORS.xpBar, 0.6);
      } else {
        const cost = skillCost(level);
        const canAfford = save.profile.coins >= cost;
        costText.setText(`Cost: ${cost} coins`);
        costText.setColor(canAfford ? hex(COLORS.coin) : '#ff5a6e');
        buyBtn
          .setFillStyle(canAfford ? COLORS.xpBar : COLORS.panelBorder, 1)
          .setInteractive({ useHandCursor: true });
        buyLabel
          .setText('BUY')
          .setColor(canAfford ? hex(COLORS.background) : hex(COLORS.textMuted));
      }
    };

    this.cardUpdaters.set(id, refresh);
    refresh();

    buyBtn.on(Phaser.Input.Events.POINTER_OVER, () => {
      const save = saveService.get();
      const level = save.upgrades[id];
      if (level < def.maxLevel) buyBtn.setAlpha(0.8);
    });
    buyBtn.on(Phaser.Input.Events.POINTER_OUT, () => buyBtn.setAlpha(1));
    buyBtn.on(Phaser.Input.Events.POINTER_DOWN, () => {
      const save = saveService.get();
      const level = save.upgrades[id];
      if (level >= def.maxLevel) return;
      const cost = skillCost(level);
      const ok = saveService.spendCoins(cost);
      if (!ok) return;
      saveService.setSkillLevel(id, level + 1);
      this.coinsBadge.setText(this.coinsLabel());
      // Refresh this card and all others (affordability may change).
      this.cardUpdaters.forEach((fn) => fn());
    });
  }

  private buildBackButton(hex: (c: number) => string): void {
    const cx = VIEW.width / 2;
    const skillCount = Object.keys(SKILLS).length;
    const totalH = skillCount * (CARD_H + CARD_GAP) - CARD_GAP;
    const btnY = LIST_TOP + totalH + 60;

    const btn = this.add
      .rectangle(cx, btnY, 260, 80, COLORS.panel, 1)
      .setStrokeStyle(2, COLORS.panelBorder, 1)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(cx, btnY, '← BACK', {
        fontFamily: 'monospace',
        fontSize: '26px',
        fontStyle: 'bold',
        color: hex(COLORS.text)
      })
      .setOrigin(0.5);

    btn.on(Phaser.Input.Events.POINTER_OVER, () => btn.setFillStyle(COLORS.panelBorder, 1));
    btn.on(Phaser.Input.Events.POINTER_OUT, () => btn.setFillStyle(COLORS.panel, 1));
    btn.on(Phaser.Input.Events.POINTER_DOWN, () => this.scene.start('Home'));
  }

  private coinsLabel(): string {
    return `⬡ ${saveService.get().profile.coins}`;
  }
}
