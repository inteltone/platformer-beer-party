class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.svg('partyText', 'assets/party-text.svg');
    this.load.image('keg', 'assets/keg.png');
  }

  create() {
    createPlaceholderTextures(this);
    this.scene.start('Menu');
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

  g.fillStyle(CONFIG.DOCK.color, 1);
  g.fillRect(0, 0, 32, 32);
  g.generateTexture('platform', 32, 32);
  g.clear();

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
