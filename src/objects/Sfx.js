/**
 * Lightweight audio-context manager.
 *
 * On most browsers the AudioContext starts suspended and must be resumed
 * inside a user gesture (click / keydown). We expose a single `unlock`
 * method that scenes call on first interaction.
 */

export default class Sfx {
  constructor() {
    this.ctx = null;
  }

  unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
}

export const SFX = new Sfx();
