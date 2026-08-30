/**
 * Pure keg-position generation algorithm.
 *
 * Extracted from GameScene.generateKegXPositions so it can be unit-tested
 * without a Phaser scene instance. The only non-deterministic piece is
 * `randomBetween` — callers (and tests) can inject a custom RNG.
 *
 * @param {object} levelCfg  — the level configuration entry from CONFIG.LEVELS
 * @param {function} [randomBetween] — (min, max) => int, defaults to Math.random
 * @returns {number[]} array of x-coordinates for keg centres
 */
import CONFIG from '../config.js';

export function generateKegXPositions(levelCfg, randomBetween = defaultRandomBetween) {
  const Gen = CONFIG.GEN;
  const K = CONFIG.KEG;
  const G = CONFIG.GAME;
  const F = CONFIG.FINISH;

  const finishLeft = G.worldWidth - F.width;
  const exitKegX = finishLeft - K.width / 2 - Gen.exitKegGap;
  const positions = [];
  const startX = CONFIG.DOCK.width + Gen.firstKegOffset;
  let x = startX;

  while (exitKegX - x > Gen.maxGap) {
    positions.push(x);
    if (levelCfg.equalGaps) {
      x += Gen.equalGap;
    } else {
      const progress = (x - startX) / (exitKegX - startX);
      const extra = (levelCfg.gapGrowth || 0) * progress;
      x += randomBetween(Gen.gapMin + extra, Gen.gapMax + extra);
    }
  }

  if (exitKegX - x < Gen.gapMin) {
    x = exitKegX - randomBetween(Gen.gapMin, Gen.gapMax);
  }
  positions.push(x);
  positions.push(exitKegX);
  return positions;
}

/** Default RNG — pure JS, no Phaser dependency. */
function defaultRandomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
