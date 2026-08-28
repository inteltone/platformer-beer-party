class LoadingScene extends Phaser.Scene {
  constructor() {
    super('Loading');
  }

  create() {
    const { width, height } = CONFIG.GAME;

    const unlock = () => {
      SFX.unlock();
      this.sound.unlock();
    };
    if (!window.__musicUnlockBound) {
      window.__musicUnlockBound = true;
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
    this.input.once('pointerdown', unlock);
    this.input.keyboard.once('keydown', unlock);

    const container = this.add.container(width / 2, height / 2);

    const bg = this.add.image(0, 0, 'screenLoading');
    const mug = this.add.sprite(0, 0, 'mug').setOrigin(0.502, 0.518);
    if (this.anims.exists('mugAnim')) {
      mug.play('mugAnim');
    }
    container.add([bg, mug]);

    this.loadImageAssets();
    this.loadAudioAssets();
    this.loadPlayerSpritesheet();

    this.load.once('complete', () => {
      createPlaceholderTextures(this);
      createPlayerAnimations(this);
      ['keg', 'people', 'fanfary', 'fall', 'oh', 'cry'].forEach((key) => {
        if (this.cache.audio.exists(key)) {
          this.sound.add(key);
        }
      });
      this.finishLoading(container);
    });

    this.load.start();
  }

  loadImageAssets() {
    this.load.image('keg', 'assets/keg.png');
    this.load.image('player', 'assets/player.png');
    this.load.image('brick', 'assets/texture-brick.png');
    this.load.image('bgtexture', 'assets/texture-bg.png');
    this.load.image('truby', 'assets/truby.png');
    this.load.image('nameplate', 'assets/nameplate.png');
    this.load.image('header', 'assets/header.png');
    this.load.image('plashka', 'assets/plashka.png');
    this.load.image('plashkaLevelSuccess', 'assets/plashka-level-success.png');
    this.load.image('screenVictory', 'assets/screen-victory.png');
    this.load.image('screenStart', 'assets/screen-start.png');
    this.load.image('btnStart', 'assets/btn-start.png');
    this.load.image('btnLevelOpen', 'assets/btn-level-open.png');
    this.load.image('btnLevelClosed', 'assets/btn-level-closed.png');
    this.load.image('btnHome', 'assets/btn-home.png');
    this.load.image('cup', 'assets/cup.png');
    this.load.image('cupLuchi', 'assets/cup-luchi.png');
    this.load.image('lamp', 'assets/lamp.png');
  }

  loadPlayerSpritesheet() {
    this.load.spritesheet('playerKon', 'assets/player-kon-sprite.png', { frameWidth: 256, frameHeight: 256 });
  }

  loadAudioAssets() {
    this.load.audio('people', 'assets/sounds/people.mp3');
    this.load.audio('keg', 'assets/sounds/keg.mp3');
    this.load.audio('fanfary', 'assets/sounds/fanfary.mp3');
    this.load.audio('fall', 'assets/sounds/fall.mp3');
    this.load.audio('oh', 'assets/sounds/oh.mp3');
    this.load.audio('cry', 'assets/sounds/cry.mp3');
  }

  finishLoading(container) {
    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        duration: 600,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.scene.start('Menu');
        }
      });
    });
  }
}
