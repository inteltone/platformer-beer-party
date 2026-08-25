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
