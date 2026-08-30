import { createMugAnimation } from '../utils/animations.js';

/**
 * First scene — loads only the lightweight loading-screen assets
 * so the loading animation appears instantly.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.image('screenLoading', 'assets/screen-loading.png');
    this.load.spritesheet('mug', 'assets/mug-spritesheet.png', { frameWidth: 285, frameHeight: 440 });
  }

  create() {
    createMugAnimation(this);
    this.scene.start('Loading');
  }
}
