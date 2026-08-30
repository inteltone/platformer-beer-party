/**
 * Animation factory functions.
 * Extracted from BootScene to improve testability and separation of concerns.
 */

import CONFIG from '../config.js';

export function createMugAnimation(scene) {
  if (!scene.anims.exists('mugAnim') && scene.textures.exists('mug')) {
    scene.anims.create({
      key: 'mugAnim',
      frames: scene.anims.generateFrameNumbers('mug', { start: 0, end: 24 }),
      frameRate: 24,
      repeat: -1,
    });
  }
}

export function createPlayerAnimations(scene) {
  if (!scene.anims.exists('playerIdle')) {
    scene.anims.create({
      key: 'playerIdle',
      frames: scene.anims.generateFrameNumbers('playerKon', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
  }
  if (!scene.anims.exists('playerRun')) {
    scene.anims.create({
      key: 'playerRun',
      frames: scene.anims.generateFrameNumbers('playerKon', { start: 4, end: 12 }),
      frameRate: 12,
      repeat: -1,
    });
  }
  if (!scene.anims.exists('playerJump')) {
    scene.anims.create({
      key: 'playerJump',
      frames: scene.anims.generateFrameNumbers('playerKon', { start: 13, end: 15 }),
      frameRate: 10,
      repeat: 0,
    });
  }
  if (!scene.anims.exists('playerFall')) {
    scene.anims.create({
      key: 'playerFall',
      frames: scene.anims.generateFrameNumbers('playerKon', { start: 16, end: 16 }),
      frameRate: 8,
      repeat: 0,
    });
  }
}
