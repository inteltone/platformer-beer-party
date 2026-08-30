import CONFIG from '../config.js';
import { SFX } from '../objects/Sfx.js';
import { createPlayerAnimations } from '../utils/animations.js';
import { createPlaceholderTextures } from '../utils/textures.js';
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
    this.load.image('keg', 'assets/keg.png');
    this.load.image('player', 'assets/player.png');
    this.load.image('brick', 'assets/texture-brick.png');
    this.load.image('bgtexture', 'assets/texture-bg.png');
    this.load.image('truby', 'assets/truby.png');
    this.load.image('nameplate', 'assets/nameplate.png');
    this.load.image('header', 'assets/header.png');
    this.load.image('plashka', 'assets/plashka.png');
    this.load.image('plashkaLevelSuccess', 'assets/plashka-level-success.png');
    this.load.image('screenVictory', 'assets/screen-victory.png');
    this.load.image('screenStart', 'assets/screen-start.png');
    this.load.image('btnStart', 'assets/btn-start.png');
    this.load.image('btnLevelOpen', 'assets/btn-level-open.png');
    this.load.image('btnLevelClosed', 'assets/btn-level-closed.png');
    this.load.image('btnHome', 'assets/btn-home.png');
    this.load.image('cup', 'assets/cup.png');
    this.load.image('cupLuchi', 'assets/cup-luchi.png');
    this.load.image('lamp', 'assets/lamp.png');
  }

  loadPlayerSpritesheet() {
    try {
      this.load.spritesheet('playerKon', 'assets/player-kon-sprite.png', { frameWidth: 256, frameHeight: 256 });
    } catch (err) {
      console.warn('playerKon spritesheet not available, will use placeholder:', err);
    }
  }

  loadAudioAssets() {
    this.load.audio(SoundKey.PEOPLE, 'assets/sounds/people.mp3');
    this.load.audio(SoundKey.KEG, 'assets/sounds/keg.mp3');
    this.load.audio(SoundKey.FANFARY, 'assets/sounds/fanfary.mp3');
    this.load.audio(SoundKey.FALL, 'assets/sounds/fall.mp3');
    this.load.audio(SoundKey.OH, 'assets/sounds/oh.mp3');
    this.load.audio(SoundKey.CRY, 'assets/sounds/cry.mp3');
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
