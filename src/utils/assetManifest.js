/**
 * Single source of truth for externally loaded game assets.
 *
 * Scenes iterate over these maps to register Phaser loads, and the Vite
 * build copies exactly these files into dist/ (see vite.config.mjs) —
 * anything not listed here (design sources, unused files) stays out of the build.
 */

import { SoundKey } from '../enums.js';

export const IMAGE_ASSETS = Object.freeze({
  screenLoading: 'assets/screen-loading.png',
  keg: 'assets/keg.png',
  player: 'assets/player.png',
  brick: 'assets/texture-brick.png',
  bgtexture: 'assets/texture-bg.png',
  truby: 'assets/truby.png',
  nameplate: 'assets/nameplate.png',
  header: 'assets/header.png',
  plashka: 'assets/plashka.png',
  plashkaLevelSuccess: 'assets/plashka-level-success.png',
  screenVictory: 'assets/screen-victory.png',
  screenStart: 'assets/screen-start.png',
  btnStart: 'assets/btn-start.png',
  btnLevelOpen: 'assets/btn-level-open.png',
  btnLevelClosed: 'assets/btn-level-closed.png',
  btnHome: 'assets/btn-home.png',
  cup: 'assets/cup.png',
  cupLuchi: 'assets/cup-luchi.png',
  lamp: 'assets/lamp.png',
});

export const SPRITESHEET_ASSETS = Object.freeze({
  mug: Object.freeze({ url: 'assets/mug-spritesheet.png', frameWidth: 285, frameHeight: 440 }),
  playerKon: Object.freeze({ url: 'assets/player-kon-sprite.png', frameWidth: 256, frameHeight: 256 }),
});

export const AUDIO_ASSETS = Object.freeze({
  [SoundKey.PEOPLE]: 'assets/sounds/people.mp3',
  [SoundKey.KEG]: 'assets/sounds/keg.mp3',
  [SoundKey.FANFARY]: 'assets/sounds/fanfary.mp3',
  [SoundKey.FALL]: 'assets/sounds/fall.mp3',
  [SoundKey.OH]: 'assets/sounds/oh.mp3',
  [SoundKey.CRY]: 'assets/sounds/cry.mp3',
});

/** Flat list of every asset URL — consumed by the build to copy files. */
export const ALL_ASSET_URLS = Object.freeze([
  ...Object.values(IMAGE_ASSETS),
  ...Object.values(SPRITESHEET_ASSETS).map((sheet) => sheet.url),
  ...Object.values(AUDIO_ASSETS),
]);
