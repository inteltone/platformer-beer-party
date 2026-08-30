import Phaser from 'phaser';
import CONFIG from './config.js';
import BootScene from './scenes/BootScene.js';
import LoadingScene from './scenes/LoadingScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

/**
 * Game bootstrap — creates the Phaser.Game instance with
 * arcade physics and a fixed 1280×720 resolution.
 */
const config = {
  type: Phaser.AUTO,
  width: CONFIG.GAME.width,
  height: CONFIG.GAME.height,
  backgroundColor: CONFIG.GAME.backgroundColor,
  parent: 'game-root',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: CONFIG.GAME.gravityY },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    max: { width: 1280, height: 720 },
  },
  scene: [BootScene, LoadingScene, MenuScene, GameScene],
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
