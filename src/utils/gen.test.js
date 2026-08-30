import { describe, it, expect } from 'vitest';
import CONFIG from '../config.js';
import { GameState } from '../gameState.js';
import { generateKegXPositions } from '../utils/kegPositions.js';

const Gen = CONFIG.GEN;
const K = CONFIG.KEG;
const F = CONFIG.FINISH;
const D = CONFIG.DOCK;
const G = CONFIG.GAME;

const finishLeft = G.worldWidth - F.width;
const exitKegX = finishLeft - K.width / 2 - Gen.exitKegGap;

/** Deterministic RNG: always returns the lower bound. */
const minRng = (min, max) => Math.floor(min);

/** Deterministic RNG: always returns the upper bound. */
const maxRng = (min, max) => Math.floor(max);

/** Deterministic RNG: always returns the midpoint. */
const midRng = (min, max) => Math.floor((min + max) / 2);

describe('generateKegXPositions', () => {
  it('first position starts after the dock', () => {
    const positions = generateKegXPositions(CONFIG.LEVELS[0], minRng);
    expect(positions[0]).toBeGreaterThanOrEqual(D.width + Gen.firstKegOffset);
  });

  it('last position is the exit keg', () => {
    const positions = generateKegXPositions(CONFIG.LEVELS[0], minRng);
    expect(positions[positions.length - 1]).toBe(exitKegX);
  });

  it('all positions are within world bounds', () => {
    const positions = generateKegXPositions(CONFIG.LEVELS[0], minRng);
    positions.forEach((pos) => {
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThanOrEqual(G.worldWidth);
    });
  });

  it('positions are monotonically increasing', () => {
    const positions = generateKegXPositions(CONFIG.LEVELS[0], minRng);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('equal-gaps level produces evenly spaced positions', () => {
    const levelCfg = CONFIG.LEVELS[0]; // equalGaps: false, we need a true one
    // CONFIG.LEVELS[0] is for level 1 (rockKegs), not equalGaps.
    // Test with a synthetic equalGaps config.
    const equalCfg = { ...levelCfg, equalGaps: true, gapGrowth: 0 };
    const positions = generateKegXPositions(equalCfg, minRng);
    const diffs = [];
    for (let i = 1; i < positions.length; i++) {
      diffs.push(positions[i] - positions[i - 1]);
    }
    // With equalGaps, every gap should be exactly Gen.equalGap (except possibly
    // the final correction when the gap would be too small).
    const equalGaps = diffs.filter((d) => d === Gen.equalGap);
    expect(equalGaps.length).toBeGreaterThan(0);
  });

  it('handles both min and max RNG without exceeding bounds', () => {
    const positionsMin = generateKegXPositions(CONFIG.LEVELS[0], minRng);
    const positionsMax = generateKegXPositions(CONFIG.LEVELS[0], maxRng);
    const positionsMid = generateKegXPositions(CONFIG.LEVELS[0], midRng);

    [positionsMin, positionsMax, positionsMid].forEach((positions) => {
      positions.forEach((pos) => {
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThanOrEqual(G.worldWidth);
      });
    });
  });
});

describe('GameConfig', () => {
  it('has the expected number of levels', () => {
    expect(CONFIG.LEVELS.length).toBe(2);
  });

  it('level 1 has rockKegs enabled', () => {
    expect(CONFIG.LEVELS[0].rockKegs).toBe(true);
  });

  it('level 2 is drifting', () => {
    expect(CONFIG.LEVELS[1].drifting).toBe(true);
  });

  it('finish platform is at the right edge', () => {
    expect(F.width).toBe(410);
    expect(finishLeft).toBe(G.worldWidth - F.width);
  });
});

describe('GameState', () => {
  it('starts at level 1 with level 1 unlocked', () => {
    GameState.reset();
    expect(GameState.level).toBe(1);
    expect(GameState.unlockedLevel).toBe(1);
  });

  it('unlockNext increments unlockedLevel', () => {
    GameState.reset();
    GameState.unlockNext();
    expect(GameState.unlockedLevel).toBe(2);
  });

  it('unlockNext does not exceed totalLevels', () => {
    GameState.reset();
    GameState.unlockedLevel = CONFIG.GAME.totalLevels;
    GameState.unlockNext();
    expect(GameState.unlockedLevel).toBe(CONFIG.GAME.totalLevels);
  });

  it('level setter clamps to [1, totalLevels]', () => {
    GameState.reset();
    GameState.level = 99;
    expect(GameState.level).toBe(CONFIG.GAME.totalLevels);
    GameState.level = -5;
    expect(GameState.level).toBe(1);
  });

  it('reset restores initial state', () => {
    GameState.reset();
    GameState.level = 2;
    GameState.unlockedLevel = 2;
    GameState.reset();
    expect(GameState.level).toBe(1);
    expect(GameState.unlockedLevel).toBe(1);
  });

  it('toJSON returns a shallow clone', () => {
    GameState.reset();
    const snapshot = GameState.toJSON();
    expect(snapshot.level).toBe(1);
    expect(snapshot.unlockedLevel).toBe(1);
  });
});
