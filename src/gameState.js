/**
 * Mutable game-state singleton.
 *
 * Previously `CONFIG.GAME.level` and `CONFIG.GAME.unlockedLevel` were mutated
 * during play, conflating immutable configuration with runtime state.
 * This module restores that separation: CONFIG stays read-only settings,
 * while GameState holds everything that changes between levels / plays.
 */

import CONFIG from './config.js';

let state = {
  level: 1,
  unlockedLevel: 1,
};

export const GameState = {
  get level() {
    return state.level;
  },

  set level(value) {
    state.level = Math.max(1, Math.min(value, CONFIG.GAME.totalLevels));
  },

  get unlockedLevel() {
    return state.unlockedLevel;
  },

  set unlockedLevel(value) {
    state.unlockedLevel = Math.max(1, Math.min(value, CONFIG.GAME.totalLevels));
  },

  /** Unlock the next level after a victory. */
  unlockNext() {
    const next = Math.min(this.level + 1, CONFIG.GAME.totalLevels);
    if (next > this.unlockedLevel) {
      this.unlockedLevel = next;
    }
  },

  /** Reset to the initial state (used on fresh start). */
  reset() {
    state = {
      level: 1,
      unlockedLevel: 1,
    };
  },

  /** Return a shallow clone for serialization. */
  toJSON() {
    return { ...state };
  },
};

export default GameState;
