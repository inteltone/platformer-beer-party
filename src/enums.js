/**
 * Centralized state enums to avoid fragile string literals scattered
 * across the codebase. Using constants here gives us:
 * - autocomplete / IDE support
 * - a single source of truth
 * - safe comparisons without typos
 */

export const PlayerState = Object.freeze({
  ALIVE: 'alive',
  FALLEN: 'fallen',
  RESCUING: 'rescuing',
  RESETTING: 'resetting',
});

export const KegState = Object.freeze({
  FLOATING: 'floating',
  TIPPING: 'tipping',
  TIPPED: 'tipped',
  SINKING: 'sinking',
});

export const SceneKey = Object.freeze({
  BOOT: 'Boot',
  LOADING: 'Loading',
  MENU: 'Menu',
  GAME: 'Game',
});

export const SoundKey = Object.freeze({
  KEG: 'keg',
  PEOPLE: 'people',
  FANFARY: 'fanfary',
  FALL: 'fall',
  OH: 'oh',
  CRY: 'cry',
});
