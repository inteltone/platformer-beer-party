class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
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
    this.load.image('screenLoading', 'assets/screen-loading.png');
    this.load.spritesheet('mug', 'assets/mug-spritesheet.png', { frameWidth: 285, frameHeight: 440 });
    this.load.image('screenStart', 'assets/screen-start.png');
    this.load.image('btnStart', 'assets/btn-start.png');
    this.load.image('btnLevelOpen', 'assets/btn-level-open.png');
    this.load.image('btnLevelClosed', 'assets/btn-level-closed.png');
    this.load.image('btnHome', 'assets/btn-home.png');
    this.load.image('cup', 'assets/cup.png');
    this.load.image('cupLuchi', 'assets/cup-luchi.png');
    this.load.image('lamp', 'assets/lamp.png');
    this.load.spritesheet('playerKon', 'assets/player-kon-sprite.png', { frameWidth: 256, frameHeight: 256 });
    this.load.audio('people', 'assets/sounds/people.mp3');
    this.load.audio('keg', 'assets/sounds/keg.mp3');
    this.load.audio('fanfary', 'assets/sounds/fanfary.mp3');
    this.load.audio('fall', 'assets/sounds/fall.mp3');
    this.load.audio('oh', 'assets/sounds/oh.mp3');
    this.load.audio('cry', 'assets/sounds/cry.mp3');
  }

  create() {
    createPlaceholderTextures(this);
    createPlayerAnimations(this);
    if (this.anims.exists('mugAnim') === false && this.textures.exists('mug')) {
      this.anims.create({
        key: 'mugAnim',
        frames: this.anims.generateFrameNumbers('mug', { start: 0, end: 24 }),
        frameRate: 24,
        repeat: -1
      });
    }
    ['keg', 'people', 'fanfary', 'fall', 'oh', 'cry'].forEach((key) => {
      if (this.cache.audio.exists(key)) {
        this.sound.add(key);
      }
    });
    this.scene.start('Loading');
  }
}

function createPlayerAnimations(scene) {
  if (!scene.anims.exists('playerIdle')) {
    scene.anims.create({
      key: 'playerIdle',
      frames: scene.anims.generateFrameNumbers('playerKon', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });
  }
  if (!scene.anims.exists('playerRun')) {
    scene.anims.create({
      key: 'playerRun',
      frames: scene.anims.generateFrameNumbers('playerKon', { start: 4, end: 12 }),
      frameRate: 12,
      repeat: -1
    });
  }
  if (!scene.anims.exists('playerJump')) {
    scene.anims.create({
      key: 'playerJump',
      frames: scene.anims.generateFrameNumbers('playerKon', { start: 13, end: 15 }),
      frameRate: 10,
      repeat: 0
    });
  }
  if (!scene.anims.exists('playerFall')) {
    scene.anims.create({
      key: 'playerFall',
      frames: scene.anims.generateFrameNumbers('playerKon', { start: 16, end: 17 }),
      frameRate: 8,
      repeat: 0
    });
  }
}

function createPlaceholderTextures(scene) {
  const P = CONFIG.PLAYER;
  const K = CONFIG.KEG;
  const D = CONFIG.DOOR;

  const g = scene.make.graphics({ x: 0, y: 0 }, { add: false });

  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 2, 2);
  g.generateTexture('pixel', 2, 2);
  g.clear();

  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, 8, 8);
  g.generateTexture('circle', 16, 16);
  g.clear();

  g.fillStyle(CONFIG.DOCK.color, 1);
  g.fillRect(0, 0, 32, 32);
  g.generateTexture('platform', 32, 32);
  g.clear();

  if (!scene.textures.exists('player')) {
    g.fillStyle(P.color, 1);
    g.fillRoundedRect(6, 20, 32, 38, 6);
    g.fillStyle(0x2f3b52, 1);
    g.fillRect(10, 52, 10, 10);
    g.fillRect(24, 52, 10, 10);
    g.fillStyle(P.color, 1);
    g.fillRect(2, 28, 6, 18);
    g.fillRect(36, 28, 6, 18);
    g.fillStyle(P.skin, 1);
    g.fillCircle(22, 12, 9);
    g.fillStyle(P.accent, 1);
    g.fillRect(13, 3, 18, 6);
    g.generateTexture('player', P.width, P.height);
    g.clear();
  }

  if (!scene.textures.exists('keg')) {
    g.fillStyle(K.bodyColor, 1);
    fillGradientRoundedRect(g, 2, 0, K.width - 4, K.height - 2, 3, K.gradientStops, K.width);
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(16, 2, 4, K.height - 4);
    g.fillRect(74, 2, 3, K.height - 4);
    g.generateTexture('keg', K.width, K.height);
    g.clear();
  }

  g.fillStyle(D.color, 1);
  g.fillRect(0, 0, D.width, D.height);
  g.fillStyle(D.frameColor, 1);
  g.fillRect(4, 4, D.width - 8, 12);
  g.fillRect(4, 4, 12, D.height - 8);
  g.fillRect(D.width - 16, 4, 12, D.height - 8);
  g.fillStyle(D.signColor, 1);
  g.fillRect(20, 60, 56, 40);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(30, 80, 42, 70, 42, 90);
  g.fillRect(42, 76, 30, 8);
  g.generateTexture('door', D.width, D.height);
  g.destroy();
}

function gradientColor(stops, f) {
  if (f <= stops[0].p) return stops[0].c;
  for (let i = 1; i < stops.length; i++) {
    if (f <= stops[i].p) {
      const a = stops[i - 1];
      const b = stops[i];
      const t = (f - a.p) / (b.p - a.p);
      const ar = (a.c >> 16) & 255, ag = (a.c >> 8) & 255, ab = a.c & 255;
      const br = (b.c >> 16) & 255, bg = (b.c >> 8) & 255, bb = b.c & 255;
      const r = Math.round(ar + (br - ar) * t);
      const g2 = Math.round(ag + (bg - ag) * t);
      const bl = Math.round(ab + (bb - ab) * t);
      return (r << 16) | (g2 << 8) | bl;
    }
  }
  return stops[stops.length - 1].c;
}

function cornerOffset(d, r) {
  if (d >= r) return 0;
  return r - Math.sqrt(Math.max(0, r * r - (r - d) * (r - d)));
}

function fillGradientRoundedRect(g, x0, y0, w, h, r, stops, totalW) {
  for (let i = 0; i < w; i++) {
    const dx = i;
    const dxr = w - 1 - i;
    const off = Math.max(cornerOffset(dx, r), cornerOffset(dxr, r));
    g.fillStyle(gradientColor(stops, (x0 + i) / totalW), 1);
    g.fillRect(x0 + i, y0 + off, 1, Math.max(0, h - off * 2));
  }
}
