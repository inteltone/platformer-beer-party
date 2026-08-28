class LoadingScene extends Phaser.Scene {
  constructor() {
    super('Loading');
  }

  create() {
    const { width, height } = CONFIG.GAME;

    const container = this.add.container(width / 2, height / 2);

    const bg = this.add.image(0, 0, 'screenLoading');
    const mug = this.add.sprite(0, 0, 'mug').setOrigin(0.502, 0.518);
    if (this.anims.exists('mugAnim')) {
      mug.play('mugAnim');
    }
    container.add([bg, mug]);

    container.setAlpha(1);

    this.time.delayedCall(3000, () => {
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
