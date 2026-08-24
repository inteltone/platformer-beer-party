class Sfx {
  constructor() {
    this.ctx = null;
  }

  unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, duration, type, volume, slideTo, delay) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration);
    }
    gain.gain.setValueAtTime(volume || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  noise(duration, volume, filterFreq, delay) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const buffer = this.ctx.createBuffer(1, Math.max(1, Math.floor(this.ctx.sampleRate * duration)), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t0);
  }

  jump() {
    this.tone(320, 0.14, 'square', 0.07, 640);
  }

  point() {
    this.tone(940, 0.1, 'sine', 0.1);
  }

  splash() {
    this.noise(0.35, 0.22, 600);
    this.tone(220, 0.4, 'sine', 0.07, 70);
  }

  tip() {
    this.tone(180, 0.25, 'sawtooth', 0.1, 70);
    this.noise(0.15, 0.1, 400, 0.05);
  }

  door() {
    this.tone(240, 0.6, 'sawtooth', 0.09, 90);
    this.noise(0.3, 0.06, 500, 0.05);
  }

  victory() {
    this.tone(523, 0.18, 'square', 0.1);
    this.tone(659, 0.18, 'square', 0.1, undefined, 0.18);
    this.tone(784, 0.35, 'square', 0.1, undefined, 0.36);
  }
}

const SFX = new Sfx();
