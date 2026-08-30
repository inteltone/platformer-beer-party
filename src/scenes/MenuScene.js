import Phaser from 'phaser';
import CONFIG from '../config.js';
import GameState from '../gameState.js';
import { SFX } from '../objects/Sfx.js';
import { SceneKey } from '../enums.js';

/**
 * Main menu — start button, level selection, heartbeat animation.
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.add.image(640, 360, 'screenStart').setDepth(0);

    this._createStartButton();
    this._createLevelButtons();
    this._bindInput();
  }

  _createStartButton() {
    this.btnStart = this.add.image(640, 666.5, 'btnStart')
      .setDepth(1)
      .setInteractive({ useHandCursor: true });

    this.heartbeat = this.tweens.chain({
      targets: this.btnStart,
      tweens: [
        { scaleX: 1.15, scaleY: 1.15, duration: 250, ease: 'Sine.easeOut' },
        { scaleX: 1, scaleY: 1, duration: 250, ease: 'Sine.easeOut' },
        { scaleX: 1.15, scaleY: 1.15, duration: 250, ease: 'Sine.easeOut' },
        { scaleX: 1, scaleY: 1, duration: 250, ease: 'Sine.easeOut' },
        { alpha: 1, duration: 4000 },
      ],
      loop: -1,
    });

    this.btnStart.on('pointerdown', () => {
      GameState.level = GameState.unlockedLevel;
      this.goToGame();
    });
  }

  _createLevelButtons() {
    this.levelButtons = [];
    const levelY = 637;
    const baseX = 991;
    const stepX = 67;

    for (let i = 0; i < CONFIG.GAME.totalLevels; i++) {
      const isOpen = i + 1 <= GameState.unlockedLevel;
      const key = isOpen ? 'btnLevelOpen' : 'btnLevelClosed';
      const x = baseX + stepX * i;

      const btn = this.add.image(x, levelY, key)
        .setDepth(1)
        .setAlpha(isOpen ? 1 : 0.25);

      const num = this.add.text(x, 623.5, String(i + 1), {
        fontFamily: 'Arial',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#000000',
      }).setOrigin(0.5).setDepth(2).setAlpha(isOpen ? 1 : 0.25);

      if (isOpen) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          GameState.level = i + 1;
          this.goToGame();
        });
      }

      this.levelButtons.push({ btn, num, isOpen });
    }
  }

  _bindInput() {
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    const unlock = () => {
      SFX.unlock();
      this.sound.unlock();
    };
    this.input.keyboard.once('keydown', unlock);
    this.input.once('pointerdown', unlock);
  }

  goToGame() {
    this.scene.start(SceneKey.GAME);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.goToGame();
    }
  }
}
