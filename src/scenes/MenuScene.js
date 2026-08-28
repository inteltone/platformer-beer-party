class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.add.image(640, 360, 'screenStart').setDepth(0);

    this.btnStart = this.add.image(640, 666.5, 'btnStart')
      .setDepth(1)
      .setInteractive({ useHandCursor: true });

    this.heartbeat = this.tweens.chain({
      targets: this.btnStart,
      tweens: [
        { scaleX: 1.15, scaleY: 1.15, duration: 250, ease: 'Sine.easeOut' },
        { scaleX: 1, scaleY: 1, duration: 250, ease: 'Sine.easeOut' },
        { scaleX: 1.15, scaleY: 1.15, duration: 250, ease: 'Sine.easeOut' },
        { scaleX: 1, scaleY: 1, duration: 250, ease: 'Sine.easeOut' },
        { alpha: 1, duration: 4000 }
      ],
      loop: -1
    });

    this.btnStart.on('pointerdown', () => {
      CONFIG.GAME.level = CONFIG.GAME.unlockedLevel;
      this.scene.start('Game');
    });

    this.levelButtons = [];
    const levelPositions = [991, 1058];
    const levelY = 637;
    for (let i = 0; i < 2; i++) {
      const isOpen = i + 1 <= CONFIG.GAME.unlockedLevel;
      const key = isOpen ? 'btnLevelOpen' : 'btnLevelClosed';
      const btn = this.add.image(levelPositions[i], levelY, key)
        .setDepth(1)
        .setAlpha(isOpen ? 1 : 0.25);

      const num = this.add.text(levelPositions[i], 623.5, String(i + 1), {
        fontFamily: 'Arial',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#000000'
      }).setOrigin(0.5).setDepth(2).setAlpha(isOpen ? 1 : 0.25);

      if (isOpen) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          CONFIG.GAME.level = i + 1;
          this.scene.start('Game');
        });
      }

      this.levelButtons.push({ btn, num, isOpen });
    }

    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.keyboard.once('keydown', () => {
      SFX.unlock();
      this.sound.unlock();
    });
    this.input.once('pointerdown', () => {
      SFX.unlock();
      this.sound.unlock();
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.scene.start('Game');
    }
  }
}