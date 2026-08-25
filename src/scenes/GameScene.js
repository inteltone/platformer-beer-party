class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const G = CONFIG.GAME;
    const B = CONFIG.BEER;
    const P = CONFIG.PLAYER;
    const D = CONFIG.DOCK;

    this.beerY = Math.round(G.height * B.surfaceRatio);
    this.points = 0;
    this.falls = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.playerState = 'alive';
    this.groundedKeg = null;
    this.lastKeg = null;
    this.fallenFromKeg = null;
    this.fallMessageIndex = 0;
    this.levelCfg = CONFIG.LEVELS[CONFIG.GAME.level - 1] || CONFIG.LEVELS[0];

    this.physics.world.setBounds(0, 0, G.worldWidth, G.height);

    this.add.tileSprite(G.worldWidth / 2, G.height / 2, G.worldWidth, G.height, 'bgtexture').setDepth(-0.5);

    if (this.textures.exists('truby')) {
      this.add.image(G.worldWidth / 2, G.height / 2, 'truby').setDepth(0);
    }

    if (this.textures.exists('header')) {
      const hH = this.textures.get('header').get(0).height;
      this.add.image(G.width / 2, hH / 2, 'header').setDepth(30).setScrollFactor(0);
    }
    this.drawBeer();
    this.drawBeerBubbles();
    this.makePlatforms();
    this.makePlayer();
    this.makeDoor();

    this.kegs = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });
    this.makeKegs();

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.kegs, this.handleKegContact, null, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.rescueKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    const mono = 'Courier New, monospace';

    this.levelText = this.add.text(308, 25.5, '1', {
      fontFamily: mono,
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

    this.pointsText = this.add.text(453.5, 34, '0', {
      fontFamily: mono,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#00ff42'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

    this.rescuesText = this.add.text(590.5, 34, '0', {
      fontFamily: mono,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#00ff42'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

    this.fallsText = this.add.text(713, 34, '0', {
      fontFamily: mono,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ff0000'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

    this.timerText = this.add.text(1184, 35, '00:60', {
      fontFamily: mono,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#00ff42'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

    this.timeUp = false;
    this.timeUpText = this.add.text(G.width / 2, G.height * 0.35, 'Время истекло', {
      fontFamily: 'Arial',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ff0000',
      backgroundColor: 'rgba(0,0,0,0.75)',
      padding: { x: 32, y: 18 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(25).setVisible(false);

    this.timerEnd = this.time.now + this.levelCfg.time * 1000;
    this.updateHUD();
    this.updateTimerText();

    this.splashEmitter = this.add.particles(0, 0, 'circle', {
      speed: { min: 80, max: 220 },
      angle: { min: 200, max: 340 },
      gravityY: 350,
      lifespan: 1100,
      scale: { start: 0.58, end: 0.29 },
      tint: CONFIG.BEER.foamColor,
      emitting: false
    }).setDepth(5);

    this.rescueBanner = this.add.image(G.width / 2, G.height * 0.42, 'plashka')
      .setScrollFactor(0).setDepth(20).setVisible(false);
    this.rescueMessage = this.add.text(G.width / 2, G.height * 0.42 - 50, '', {
      fontFamily: 'Arial',
      fontSize: '26px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21).setVisible(false);
  }

  drawBeer() {
    const G = CONFIG.GAME;
    const B = CONFIG.BEER;
    const y = this.beerY;

    const body = this.add.graphics().setDepth(-1);
    body.fillStyle(B.color, B.bodyAlpha);
    body.fillRect(0, y, G.worldWidth, G.height - y);

    this.beerOverlay = this.add.graphics().setDepth(6);
    this.beerOverlay.fillStyle(B.color, B.overlayAlpha);
    this.beerOverlay.fillRect(0, y, G.worldWidth, G.height - y);

    this.drawFoam();
  }

  drawFoam() {
    const G = CONFIG.GAME;
    const B = CONFIG.BEER;
    const surfY = this.beerY + B.foamSink;
    const maxSize = Math.max(3, Math.floor(B.foamMaxSize));
    const H = 2 * maxSize + 2;

    const g = this.make.graphics({ add: false });

    g.fillStyle(B.foamColor, 1);
    g.fillRect(0, H - 5, G.worldWidth, 5);

    const elements = [];
    let x = 20;
    let prevRx = Phaser.Math.Between(3, maxSize);
    while (x < G.worldWidth - 20) {
      const s = Phaser.Math.Between(3, maxSize);
      const isEllipse = Math.random() < 0.5;
      const rx = isEllipse ? s * Phaser.Math.FloatBetween(1.8, 3) : s;
      const cy = H - s;

      g.fillStyle(B.foamColor, 1);
      if (isEllipse) {
        g.fillEllipse(x, cy, rx * 2, s * 2);
      } else {
        g.fillCircle(x, cy, s);
      }
      elements.push({ x, cy: surfY - s, rx, ry: s });

      x += (rx + prevRx) * 0.5;
      prevRx = rx;
    }

    g.generateTexture('foam', G.worldWidth, H);

    this.add.image(G.worldWidth / 2, surfY - H / 2, 'foam').setDepth(7);

    const copy = this.add.image(G.worldWidth / 2, surfY, 'foam').setDepth(7);
    copy.setFlipX(true);
    copy.setFlipY(true);

    const bubbles = [];
    const isInside = (bx, by, br) => {
      if (bx < br + 1 || bx > G.worldWidth - br - 1) return false;
      for (const el of elements) {
        const dx = (bx - el.x) / el.rx;
        const dy = (by - el.cy) / el.ry;
        const t = 1 - (br + 1) / el.ry;
        if (dx * dx + dy * dy <= t * t) return true;
      }
      return false;
    };
    const intersects = (bx, by, br) => {
      for (const b of bubbles) {
        const dx = b.x - bx;
        const dy = b.y - by;
        const min = b.r + br + 1;
        if (dx * dx + dy * dy < min * min) return true;
      }
      return false;
    };

    let placedGroups = 0;
    let attempts = 0;
    while (placedGroups < 80 && attempts < 4000) {
      attempts++;
      const el = elements[Phaser.Math.Between(0, elements.length - 1)];
      const br = Phaser.Math.Between(2, 4);
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const t = Phaser.Math.FloatBetween(0, Math.max(0, 1 - (br + 1) / el.ry));
      const bx = el.x + Math.cos(a) * t * el.rx;
      const by = el.cy + Math.sin(a) * t * el.ry;

      if (intersects(bx, by, br)) continue;

      const group = [{ x: bx, y: by, r: br }];

      if (Math.random() < 0.5) {
        const br2 = Phaser.Math.Between(2, 4);
        const a2 = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = br + br2 + 2;
        const bx2 = bx + Math.cos(a2) * dist;
        const by2 = by + Math.sin(a2) * dist;
        if (isInside(bx2, by2, br2) && !intersects(bx2, by2, br2)) {
          group.push({ x: bx2, y: by2, r: br2 });
        }
      }

      for (const b of group) bubbles.push(b);
      placedGroups++;
    }

    const bg = this.add.graphics().setDepth(7.5);
    bg.lineStyle(1, B.color, 0.85);
    for (const b of bubbles) {
      bg.strokeCircle(b.x, b.y, b.r);
    }
  }

  drawBeerBubbles() {
    const G = CONFIG.GAME;
    const B = CONFIG.BEER;
    const g = this.add.graphics().setDepth(1.5);
    const maxR = Math.floor(9 * 0.8);

    const placed = [];
    let attempts = 0;
    while (placed.length < B.bubbleCount && attempts < B.bubbleCount * 40) {
      attempts++;
      const medium = Math.random() < 0.3;
      const r = medium ? Phaser.Math.Between(5, maxR) : Phaser.Math.Between(2, 4);
      const x = Phaser.Math.Between(20, G.worldWidth - 20);
      const y = Phaser.Math.Between(this.beerY + 18, G.height - 12);

      let ok = true;
      for (const p of placed) {
        const dx = p.x - x;
        const dy = p.y - y;
        const minDist = p.r + r + 2;
        if (dx * dx + dy * dy < minDist * minDist) {
          ok = false;
          break;
        }
      }

      if (ok) {
        placed.push({ x, y, r, medium });
      }
    }

    for (const p of placed) {
      g.lineStyle(p.medium ? 1 : 0.75, B.bubbleColor, p.medium ? 0.7 : 0.55);
      g.strokeCircle(p.x, p.y, p.r);
    }
  }

  makePlatforms() {
    const D = CONFIG.DOCK;

    this.platforms = this.physics.add.staticGroup();

    const pierX = D.width / 2;
    const pierY = D.topY + D.height / 2;

    const bg = this.add.rectangle(pierX, pierY, D.width, D.height, D.color);
    this.physics.add.existing(bg, true);
    this.platforms.add(bg);

    this.add.tileSprite(pierX, pierY, D.width, D.height, 'brick');

    const outline = this.add.graphics().setDepth(0);
    outline.lineStyle(3, 0x333333, 1);
    outline.beginPath();
    outline.moveTo(0, D.topY);
    outline.lineTo(D.width, D.topY);
    outline.lineTo(D.width, D.topY + D.height);
    outline.strokePath();

    if (this.textures.exists('nameplate')) {
      const npH = this.textures.get('nameplate').get(0).height;
      const npY = D.topY + D.height - 20 - npH / 2;
      this.add.image(D.width / 2, npY, 'nameplate').setDepth(0);
    }
  }

  generateKegXPositions() {
    const K = CONFIG.KEG;
    const G = CONFIG.GEN;
    const L = this.levelCfg;
    const doorLeft = CONFIG.DOOR.x - CONFIG.DOOR.width / 2;
    const exitKegX = doorLeft - K.width / 2 - G.exitKegGap;
    const positions = [];
    const startX = CONFIG.DOCK.width + G.firstKegOffset;
    let x = startX;

    while (exitKegX - x > G.maxGap) {
      positions.push(x);
      if (L.equalGaps) {
        x += G.equalGap;
      } else {
        const progress = (x - startX) / (exitKegX - startX);
        const extra = L.gapGrowth * progress;
        x += Phaser.Math.Between(G.gapMin + extra, G.gapMax + extra);
      }
    }

    if (exitKegX - x < G.gapMin) {
      x = exitKegX - Phaser.Math.Between(G.gapMin, G.gapMax);
    }
    positions.push(x);
    positions.push(exitKegX);
    return positions;
  }

  makeKegs() {
    const positions = this.generateKegXPositions();
    const K = CONFIG.KEG;
    this.exitKeg = null;
    positions.forEach((x, i) => {
      const topOffset = this.levelCfg.variedProtrusion
        ? Phaser.Math.Between(K.topOffsetFromSurface, K.topOffsetMax)
        : Math.round((K.topOffsetFromSurface + K.topOffsetMax) / 2);
      const baseY = (this.beerY - topOffset) + K.height / 2;
      const keg = new Keg(this, x, baseY);
      const progress = positions.length > 1 ? i / (positions.length - 1) : 0;
      keg.tiltAmp = this.levelCfg.rockKegs ? K.tiltAmplitude * (1 + K.tiltAmpGrowth * progress) : 0;
      if (i === positions.length - 1) {
        keg.isExitKeg = true;
        this.exitKeg = keg;
      }
      this.kegs.add(keg);
    });
    this.kegList = this.kegs.getChildren();
  }

  regenerateLevel() {
    this.kegs.clear(true, true);
    this.kegList = [];
    this.makeKegs();
  }

makePlayer() {
    const D = CONFIG.DOCK;

    this.player = this.physics.add.sprite(260, D.topY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.4);
    this.player.body.setSize(120, 205, false);
    this.player.body.setOffset(68, 22);

    const bodyOffsetY = this.player.body.offset.y * this.player.scaleY;
    const bodyH = this.player.body.height * this.player.scaleY;
    const spriteH = 256 * this.player.scaleY;
    this.playerBodyBottom = bodyOffsetY + bodyH - spriteH * 0.5;
    this.player.y = D.topY - this.playerBodyBottom;
  }

  makeDoor() {
    const D = CONFIG.DOOR;
    const doorY = this.beerY + D.submerged - D.height / 2;
    this.door = this.add.image(D.x, doorY, 'door');
  }

  startVictorySequence() {
    this.playerState = 'victory';
    this.hideRescuePrompt();
    SFX.door();

    this.time.delayedCall(0, () => {
      this.tweens.killTweensOf(this.player);

      const keg = this.groundedKeg || this.lastKeg;
      const D = CONFIG.DOOR;
      const exitX = D.x + 60;

      this.player.body.enable = false;
      this.player.setVelocity(0, 0);

      this.tweens.add({
        targets: this.door,
        y: this.door.y - 90,
        duration: 600,
        ease: 'Sine.easeInOut'
      });

      if (keg) {
        this.tweens.add({
          targets: keg,
          x: exitX,
          duration: 1600,
          ease: 'Sine.easeInOut'
        });
      }

      this.tweens.add({
        targets: this.player,
        x: exitX,
        duration: 1600,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.scene.start('Victory', { points: this.points });
        }
      });
    });
  }

  handleKegContact(player, keg) {
    if (this.playerState !== 'alive') return;
    if (keg.state !== 'floating') return;

    if (!player.body.touching.down) {
      if (this.groundedKeg === keg) {
        this.groundedKeg = null;
        keg.setWarningLean(0);
      }
      return;
    }

    const dx = player.body.center.x - keg.x;
    const threshold = CONFIG.KEG.width * (this.levelCfg.safeZoneRatio / 2);

    if (this.groundedKeg !== keg) {
      if (keg.isInGrace(this.time.now)) {
        this.groundedKeg = keg;
        this.lastKeg = keg;
        keg.setWarningLean(0);
        return;
      }

      if (Math.abs(dx) <= threshold) {
        this.groundedKeg = keg;
        this.lastKeg = keg;
        keg.grantGrace(CONFIG.TIP.graceAfterLanding);
        if (!keg.scored) {
          keg.scored = true;
          this.addPoint();
        }
        if (keg.isExitKeg) {
          this.startVictorySequence();
        }
      } else {
        this.tipKegUnder(player, keg, dx);
      }
    } else {
      if (keg.isInGrace(this.time.now)) {
        return;
      }
      if (Math.abs(dx) > threshold) {
        this.tipKegUnder(player, keg, dx);
      }
    }
  }

  tipKegUnder(player, keg, dx) {
    this.groundedKeg = null;
    this.lastKeg = keg;
    this.fallenFromKeg = keg;
    keg.tipKeg(dx >= 0 ? 1 : -1);
    SFX.tip();
  }

  addPoint() {
    this.points++;
    this.updateHUD();
    SFX.point();
  }

  updateHUD() {
    this.levelText.setText(String(CONFIG.GAME.level));
    this.pointsText.setText(String(this.points));
    this.rescuesText.setText(String(Math.floor(this.points / CONFIG.RESCUE.cost)));
    this.fallsText.setText(String(this.falls));
  }

  updateTimerText() {
    const remaining = Math.max(0, this.timerEnd - this.time.now);
    const secs = Math.ceil(remaining / 1000);
    const mm = Math.floor(secs / 60);
    const ss = secs % 60;
    this.timerText.setText(
      String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0')
    );
    if (remaining <= 0 && !this.timeUp) {
      this.timeUp = true;
      this.timeUpText.setVisible(true);
      this.hideRescuePrompt();
    }
  }

  handleInput(delta) {
    if (this.playerState !== 'alive') return;
    const P = CONFIG.PLAYER;
    const p = this.player;
    const onGround = p.body.blocked.down || p.body.touching.down;

    if (onGround) {
      this.coyoteTimer = CONFIG.JUMP.coyoteMs;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.jumpBufferTimer = CONFIG.JUMP.bufferMs;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    if (this.cursors.left.isDown) {
      p.setVelocityX(-P.speed);
    } else if (this.cursors.right.isDown) {
      p.setVelocityX(P.speed);
    } else {
      p.setVelocityX(0);
    }

    if ((onGround || this.coyoteTimer > 0) && this.jumpBufferTimer > 0) {
      p.setVelocityY(P.jumpVelocity);
      this.jumpBufferTimer = 0;
      SFX.jump();
    }
  }

  update(time, delta) {
    this.handleInput(delta);
    this.updateKegs(time);
    this.checkFall();
    this.updateCamera();
    this.handleRescuePrompt();
    this.updateTimerText();
  }

  updateKegs(time) {
    this.kegList.forEach((keg) => keg.update(time));
  }

  checkFall() {
    if (this.playerState !== 'alive') return;
    if (this.player.y > this.beerY) {
      this.fallToBeer();
    }
  }

  fallToBeer() {
    this.playerState = 'fallen';
    this.groundedKeg = null;
    this.falls++;
    this.fallenFromKeg = this.fallenFromKeg || this.lastKeg;
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);
    this.updateHUD();
    this.showRescuePrompt();

    this.splashEmitter.x = this.player.x;
    this.splashEmitter.y = this.beerY;
    this.splashEmitter.explode(36);
    SFX.splash();

    this.tweens.add({
      targets: this.player,
      y: this.beerY + 26,
      alpha: 0,
      duration: 500
    });
  }

  showRescuePrompt() {
    const msg = CONFIG.FALL_MESSAGES[this.fallMessageIndex % CONFIG.FALL_MESSAGES.length];
    this.fallMessageIndex++;

    this.rescueBanner.setVisible(true);
    this.rescueMessage.setText(msg).setVisible(true);
  }

  handleRescuePrompt() {
    if (this.playerState !== 'fallen' || !this.rescueBanner.visible) return;

    const canRescue = this.points >= CONFIG.RESCUE.cost && this.fallenFromKeg;
    if (canRescue && Phaser.Input.Keyboard.JustDown(this.rescueKey)) {
      this.doRescue();
    } else if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.returnToStart();
    }
  }

  hideRescuePrompt() {
    this.rescueBanner.setVisible(false);
    this.rescueMessage.setVisible(false);
  }

  doRescue() {
    this.points -= CONFIG.RESCUE.cost;
    this.updateHUD();
    this.hideRescuePrompt();
    this.tweens.killTweensOf(this.player);

    const keg = this.fallenFromKeg;
    this.fallenFromKeg = null;
    this.groundedKeg = null;

    if (!keg) {
      this.resetPlayer();
      return;
    }

    this.playerState = 'rescuing';
    keg.restoreForRescue();

    const P = CONFIG.PLAYER;
    const K = CONFIG.KEG;
    const targetY = keg.baseY - K.height / 2 - this.playerBodyBottom;

    this.player.body.enable = false;
    this.tweens.add({
      targets: this.player,
      x: keg.x,
      y: targetY,
      alpha: 1,
      duration: CONFIG.RESCUE.riseDuration,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.player.body.enable = true;
        this.player.body.setAllowGravity(true);
        this.player.setVelocity(0, 0);
        this.playerState = 'alive';
        this.groundedKeg = keg;
        this.lastKeg = keg;
        if (keg.isExitKeg) {
          this.startVictorySequence();
        }
      }
    });
  }

  returnToStart() {
    this.hideRescuePrompt();
    this.fallenFromKeg = null;
    this.groundedKeg = null;
    this.lastKeg = null;
    this.regenerateLevel();
    this.resetPlayer();
  }

  resetPlayer() {
    const D = CONFIG.DOCK;
    const cam = this.cameras.main;

    this.tweens.killTweensOf(this.player);
    this.playerState = 'resetting';
    this.player.body.setAllowGravity(false);
    this.player.setAlpha(0);

    cam.fadeOut(250, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.player.setPosition(260, D.topY - this.playerBodyBottom);
      this.player.setVelocity(0, 0);
      this.player.body.setAllowGravity(true);
      this.player.setAlpha(1);
      this.playerState = 'alive';
      cam.fadeIn(250);
    });
  }

  updateCamera() {
    const G = CONFIG.GAME;
    const cam = this.cameras.main;
    const targetX = this.player.x - G.width * 0.35;
    const maxX = G.worldWidth - G.width;
    cam.scrollX = Phaser.Math.Linear(cam.scrollX, Phaser.Math.Clamp(targetX, 0, maxX), 0.08);
    cam.scrollY = 0;
  }
}
