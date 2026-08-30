import Phaser from 'phaser';
import CONFIG from '../config.js';
import { KegState } from '../enums.js';

/**
 * Base keg — a static-platform buoy that gently rocks in place.
 * When the player leans too far it tips and sinks.
 */
export default class Keg extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, baseY) {
    super(scene, x, baseY, 'keg');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const K = CONFIG.KEG;
    this.setDisplaySize(K.width, K.height);
    this.body.setSize(K.width, K.height);
    this.body.setOffset((this.width - K.width) / 2, 0);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    this.baseY = baseY;
    this.tiltPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.tiltSpeed = Phaser.Math.FloatBetween(K.tiltSpeedMin, K.tiltSpeedMax);
    this.tiltAmp = K.tiltAmplitude;
    this.warningLean = 0;
    this.warningMaxLean = K.warningMaxLean;

    this.state = KegState.FLOATING;
    this.scored = false;
    this.graceUntil = 0;
  }

  update(time) {
    if (this.state === KegState.FLOATING) {
      const K = CONFIG.KEG;
      const rock = Math.sin(time * 0.001 * this.tiltSpeed + this.tiltPhase) * this.tiltAmp;
      this.setRotation(rock + this.warningLean * this.warningMaxLean);
    }
  }

  setWarningLean(value) {
    this.warningLean = value;
  }

  isInGrace(now) {
    return now < this.graceUntil;
  }

  grantGrace(duration) {
    this.graceUntil = this.scene.time.now + duration;
  }

  /** Tilt the keg in a direction and start the tipping animation. */
  tipKeg(direction) {
    if (this.state !== KegState.FLOATING) return;
    this.state = KegState.TIPPING;
    this.body.enable = false;

    this.scene.tweens.add({
      targets: this,
      rotation: direction * (Math.PI / 2),
      duration: CONFIG.TIP.duration,
      onComplete: () => {
        this.state = KegState.TIPPED;
        this.scene.tweens.add({
          targets: this,
          y: this.y + 140,
          alpha: 0,
          duration: CONFIG.TIP.sinkDuration,
        });
      },
    });
  }

  /** Restore keg to a floating state for player rescue. */
  restoreForRescue() {
    this.scene.tweens.killTweensOf(this);
    this.state = KegState.FLOATING;
    this.body.enable = true;
    this.setRotation(0);
    this.grantGrace(CONFIG.RESCUE.graceDuration);

    this.scene.tweens.add({
      targets: this,
      y: this.baseY,
      alpha: 1,
      duration: CONFIG.RESCUE.riseDuration,
      ease: 'Sine.easeOut',
    });
  }
}

/**
 * Drifting keg — floats sideways with bob/sway/tilt variation.
 *
 * Design note on LSP: the parent's tipKeg() sinks the keg permanently,
 * while the drifter's tipKeg() just wobbles and recovers. We keep the
 * same method name for Phaser's update-collider symmetry but the behavior
 * contract differs, so this is intentional duck-typing rather than
 * true polymorphism. If you need to branch on sinking behavior, check
 * `this instanceof DriftingKeg`.
 */
export class DriftingKeg extends Keg {
  constructor(scene, x, baseY) {
    super(scene, x, baseY);
    this.randomize();
  }

  randomize() {
    const D = CONFIG.DRIFT;
    this.driftSpeed = D.speed;
    this.bobAmp = Phaser.Math.FloatBetween(D.bobAmpMin, D.bobAmpMax);
    this.bobFreq = Phaser.Math.FloatBetween(D.bobFreqMin, D.bobFreqMax);
    this.bobPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.swayAmp = Phaser.Math.FloatBetween(D.swayAmpMin, D.swayAmpMax);
    this.swayFreq = Phaser.Math.FloatBetween(D.swayFreqMin, D.swayFreqMax);
    this.swayPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.driftTiltAmp = Phaser.Math.FloatBetween(D.tiltAmpMin, D.tiltAmpMax);
    this.driftTiltFreq = Phaser.Math.FloatBetween(D.tiltFreqMin, D.tiltFreqMax);
    this.driftTiltPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  recycle() {
    this.scene.tweens.killTweensOf(this);
    this.state = KegState.FLOATING;
    this.body.enable = true;
    this.scored = false;
    this.graceUntil = 0;
    this.setRotation(0);
    this.setAlpha(1);
    this.y = this.baseY;
    this.randomize();
  }

  update(time) {
    if (this.state !== KegState.FLOATING) return;

    const t = time * 0.001;
    const D = CONFIG.DRIFT;

    const swayVx = Math.cos(t * this.swayFreq + this.swayPhase) * this.swayAmp;
    this.body.velocity.x = -this.driftSpeed + swayVx;

    const bobVy = Math.cos(t * this.bobFreq + this.bobPhase) * this.bobAmp * this.bobFreq;
    this.body.velocity.y = bobVy;

    this.setRotation(Math.sin(t * this.driftTiltFreq + this.driftTiltPhase) * this.driftTiltAmp);
  }

  /**
   * Drifter version of tipKeg — wobble and recover instead of
   * permanently sinking. The parent's tipKeg has a fundamentally
   * different contract (permanent sink), violating LSP. We keep the
   * same name so GameScene's collision callback works uniformly, but
   * document the behavioral divergence above.
   */
  tipKeg(direction) {
    if (this.state !== KegState.FLOATING) return;
    this.state = KegState.TIPPING;

    this.scene.tweens.add({
      targets: this,
      rotation: direction * (Math.PI / 4),
      duration: CONFIG.TIP.duration,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          rotation: 0,
          duration: 300,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.state = KegState.FLOATING;
            this.grantGrace(CONFIG.TIP.graceAfterLanding);
          },
        });
      },
    });
  }

  restoreForRescue() {
    this.scene.tweens.killTweensOf(this);
    this.state = KegState.FLOATING;
    this.body.enable = true;
    this.setRotation(0);
    this.y = this.baseY;
    this.alpha = 1;
    this.grantGrace(CONFIG.RESCUE.graceDuration);
  }
}
