class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = CONFIG.GAME;

    this.add.text(width / 2, 120, 'ПИВНОЙ ПОБЕГ', {
      fontFamily: 'Arial',
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#ffd166'
    }).setOrigin(0.5);

    this.add.text(width / 2, 180, 'Прыжки по плавающим кегам', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#444444'
    }).setOrigin(0.5);

    const rules = [
      'ПРАВИЛА:',
      '',
      '•  Управление — стрелки: ← → движение, ↑ прыжок.',
      '•  Склад затоплен пивом. Прыгай по плавающим кегам',
      '   до выходной двери.',
      '•  Середина кега (40% ширины) держит тебя.',
      '   Попадание на край (по 30% слева и справа)',
      '   переворачивает кег — ты падаешь в пиво.',
      '•  За каждый удачный прыжок — 1 балл.',
      '   Спасение после падения стоит 2 балла:',
      '   нажми R — и снова окажешься на кеге',
      '   вместо возврата к старту.',
      '•  Доберись до последнего кега у двери,',
      '   приземлись на него — и пиво вынесет тебя наружу.'
    ];

    this.add.text(width / 2, 250, rules.join('\n'), {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#222222',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5, 0);

    const hint = this.add.text(width / 2, height - 90, 'Нажми Enter, чтобы начать', {
      fontFamily: 'Arial',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#4d8df0'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.keyboard.once('keydown', () => SFX.unlock());
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.scene.start('Game');
    }
  }
}
