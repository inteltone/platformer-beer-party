const config = {
  type: Phaser.AUTO,
  width: CONFIG.GAME.width,
  height: CONFIG.GAME.height,
  backgroundColor: CONFIG.GAME.backgroundColor,
  parent: document.body,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: CONFIG.GAME.gravityY },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    max: { width: 1280, height: 720 }
  },
  scene: [BootScene, MenuScene, GameScene, VictoryScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
