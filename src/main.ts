import Phaser from 'phaser';
import { COLORS, VIEW } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { HomeScene } from './scenes/HomeScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { GameOverScene } from './scenes/GameOverScene';
import { SkillTreeScene } from './scenes/SkillTreeScene';
import { CharactersScene } from './scenes/CharactersScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIEW.width,
    height: VIEW.height
  },
  render: {
    antialias: true,
    pixelArt: false
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 }
    }
  },
  scene: [
    BootScene,
    HomeScene,
    GameScene,
    HUDScene,
    LevelUpScene,
    GameOverScene,
    SkillTreeScene,
    CharactersScene
  ]
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
