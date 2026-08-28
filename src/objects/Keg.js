class Keg extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, baseY) {
    super(scene, x, baseY, 'keg');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(CONFIG.KEG.width, CONFIG.KEG.height);
    this.body.setSize(CONFIG.KEG.width, CONFIG.KEG.height);
    this.body.setOffset((this.width - CONFIG.KEG.width) / 2, 0);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    const K = CONFIG.KEG;
    this.baseY = baseY;
    this.tiltPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.tiltSpeed = Phaser.Math.FloatBetween(K.tiltSpeedMin, K.tiltSpeedMax);
    this.tiltAmp = K.tiltAmplitude;
    this.warningLean = 0;
    this.warningMaxLean = K.warningMaxLean;

    this.state = 'floating';
    this.scored = false;
    this.graceUntil = 0;
  }

  update(time) {
    if (this.state === 'floating') {
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

  tipKeg(direction) {
    if (this.state !== 'floating') return;
    this.state = 'tipping';
    this.body.enable = false;

    this.scene.tweens.add({
      targets: this,
      rotation: direction * (Math.PI / 2),
      duration: CONFIG.TIP.duration,
      onComplete: () => {
        this.state = 'tipped';
        this.scene.tweens.add({
          targets: this,
          y: this.y + 140,
          alpha: 0,
          duration: CONFIG.TIP.sinkDuration
        });
      }
    });
  }

  restoreForRescue() {
    this.scene.tweens.killTweensOf(this);
    this.state = 'floating';
    this.body.enable = true;
    this.setRotation(0);
    this.grantGrace(CONFIG.RESCUE.graceDuration);

    this.scene.tweens.add({
      targets: this,
      y: this.baseY,
      alpha: 1,
      duration: CONFIG.RESCUE.riseDuration,
      ease: 'Sine.easeOut'
    });
  }
}

class DriftingKeg extends Keg {
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
    this.state = 'floating';
    this.body.enable = true;
    this.scored = false;
    this.graceUntil = 0;
    this.setRotation(0);
    this.setAlpha(1);
    this.y = this.baseY;
    this.randomize();
  }

  update(time) {
    if (this.state !== 'floating') return;

    const t = time * 0.001;

    const swayVx = Math.cos(t * this.swayFreq + this.swayPhase) * this.swayAmp;
    this.body.velocity.x = -this.driftSpeed + swayVx;

    const bobVy = Math.cos(t * this.bobFreq + this.bobPhase) * this.bobAmp * this.bobFreq;
    this.body.velocity.y = bobVy;

    this.setRotation(Math.sin(t * this.driftTiltFreq + this.driftTiltPhase) * this.driftTiltAmp);
  }

  tipKeg(direction) {
    if (this.state !== 'floating') return;
    this.state = 'tipping';

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
            this.state = 'floating';
            this.grantGrace(CONFIG.TIP.graceAfterLanding);
          }
        });
      }
    });
  }

  restoreForRescue() {
    this.scene.tweens.killTweensOf(this);
    this.state = 'floating';
    this.body.enable = true;
    this.setRotation(0);
    this.y = this.baseY;
    this.alpha = 1;
    this.grantGrace(CONFIG.RESCUE.graceDuration);
  }
}