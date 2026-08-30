import Phaser from 'phaser';
import CONFIG from '../config.js';
import { SFX } from '../objects/Sfx.js';
import { createPlayerAnimations } from '../utils/animations.js';
import { createPlaceholderTextures } from '../utils/textures.js';
import { IMAGE_ASSETS, SPRITESHEET_ASSETS, AUDIO_ASSETS } from '../utils/assetManifest.js';
import { SoundKey } from '../enums.js';

/**
 * Loading screen — loads all asset files then transitions to the menu.
 *
 * Provides a mug animation while assets load, and creates placeholder
 * fallback textures + player sprite-sheet animations on complete.
 */
export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super('Loading');
  }

  create() {
    const { width, height } = CONFIG.GAME;

    this._bindUnlock();

    const container = this.add.container(width / 2, height / 2);

    const bg = this.add.image(0, 0, 'screenLoading');

    let mug;
    try {
      if (this.anims.exists('mugAnim')) {
        mug = this.add.sprite(0, 0, 'mug').setOrigin(0.502, 0.518);
        mug.play('mugAnim');
      } else {
        mug = this.add.sprite(0, 0, 'mug').setOrigin(0.502, 0.518);
      }
    } catch (err) {
      console.warn('Failed to create mug sprite, continuing without it:', err);
    }

    if (mug) container.add([bg, mug]);
    else container.add([bg]);

    this.loadImageAssets();
    this.loadAudioAssets();
    this.loadPlayerSpritesheet();

    this.load.once('complete', () => {
      createPlaceholderTextures(this);
      createPlayerAnimations(this);
      this._addSounds();
      this.finishLoading(container);
    });

    this.load.start();
  }

  _bindUnlock() {
    const unlock = () => {
      SFX.unlock();
      this.sound.unlock();
    };
    if (!window.__musicUnlockBound) {
      window.__musicUnlockBound = true;
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
    this.input.once('pointerdown', unlock);
    this.input.keyboard.once('keydown', unlock);
  }

  _addSounds() {
    [SoundKey.KEG, SoundKey.PEOPLE, SoundKey.FANFARY, SoundKey.FALL, SoundKey.OH, SoundKey.CRY].forEach((key) => {
      if (this.cache.audio.exists(key)) {
        this.sound.add(key);
      }
    });
  }

  loadImageAssets() {
    for (const [key, url] of Object.entries(IMAGE_ASSETS)) {
      this.load.image(key, url);
    }
  }

  loadPlayerSpritesheet() {
    try {
      const sheet = SPRITESHEET_ASSETS.playerKon;
      this.load.spritesheet('playerKon', sheet.url, { frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight });
    } catch (err) {
      console.warn('playerKon spritesheet not available, will use placeholder:', err);
    }
  }

  loadAudioAssets() {
    for (const [key, url] of Object.entries(AUDIO_ASSETS)) {
      this.load.audio(key, url);
    }
  }

  finishLoading(container) {
    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        duration: 600,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.scene.start('Menu');
        },
      });
    });
  }
}
