class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  init(data) {
    this.points = data && data.points ? data.points : 0;
    this.level = data && data.level ? data.level : 1;
  }

  create() {
    const { width, height } = CONFIG.GAME;

    const nextLevel = Math.min(this.level + 1, 2);
    if (nextLevel > CONFIG.GAME.unlockedLevel) {
      CONFIG.GAME.unlockedLevel = nextLevel;
    }

    this.add.text(width / 2, 200, 'ПОБЕДА!', {
      fontFamily: 'Arial',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#3fbf6e'
    }).setOrigin(0.5);

    this.add.text(width / 2, 290, 'Дверь открылась, и пиво вынесло тебя наружу.', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#222222'
    }).setOrigin(0.5);

    this.add.text(width / 2, 350, `Набрано баллов: ${this.points}`, {
      fontFamily: 'Arial',
      fontSize: '26px',
      color: '#ffd166'
    }).setOrigin(0.5);

    const hint = this.add.text(width / 2, height - 100, 'Нажми Enter, чтобы вернуться в меню', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#555555'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.scene.start('Menu');
    }
  }
}
