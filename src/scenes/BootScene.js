import Phaser from 'phaser';
import { createMugAnimation } from '../utils/animations.js';
import { IMAGE_ASSETS, SPRITESHEET_ASSETS } from '../utils/assetManifest.js';

/**
 * First scene — loads only the lightweight loading-screen assets
 * so the loading animation appears instantly.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.image('screenLoading', IMAGE_ASSETS.screenLoading);
    const mug = SPRITESHEET_ASSETS.mug;
    this.load.spritesheet('mug', mug.url, { frameWidth: mug.frameWidth, frameHeight: mug.frameHeight });
  }

  create() {
    createMugAnimation(this);
    this.scene.start('Loading');
  }
}
