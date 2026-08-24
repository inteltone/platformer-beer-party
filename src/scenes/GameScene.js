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

    this.physics.world.setBounds(0, 0, G.worldWidth, G.height);

    this.drawBeer();
    this.drawBeerBubbles();
    if (this.textures.exists('partyText')) {
      this.add.image(640, CONFIG.GAME.height * 0.3, 'partyText').setDepth(-2).setScrollFactor(0).setTint(0x3a3a3a);
    }
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

    this.hudText = this.add.text(G.width / 2, 14, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: CONFIG.HUD.color
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
    this.updateHUD();

    this.add.text(G.width / 2, 42, '← → движение, ↑ прыжок', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#555555'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);

    this.splashEmitter = this.add.particles(0, 0, 'pixel', {
      speed: { min: 80, max: 220 },
      angle: { min: 200, max: 340 },
      gravityY: 700,
      lifespan: 700,
      scale: { start: 3.5, end: 0.5 },
      tint: CONFIG.BEER.foamColor,
      emitting: false
    }).setDepth(5);

    this.rescueText = this.add.text(G.width / 2, G.height * 0.4, '', {
      fontFamily: 'Arial',
      fontSize: '26px',
      color: '#ffd166',
      backgroundColor: 'rgba(0,0,0,0.6)',
      align: 'center',
      padding: { x: 24, y: 16 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setVisible(false);
  }

  drawBeer() {
    const G = CONFIG.GAME;
    const B = CONFIG.BEER;
    const y = this.beerY;

    const body = this.add.graphics().setDepth(-1);
    body.fillStyle(B.color, B.bodyAlpha);
    body.fillRect(0, y, G.worldWidth, G.height - y);

    this.beerOverlay = this.add.graphics().setDepth(1);
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
      elements.push({ x, cy, rx, ry: s });

      x += (rx + prevRx) * 0.5;
      prevRx = rx;
    }

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

    g.lineStyle(1, B.color, 0.85);
    for (const b of bubbles) {
      g.strokeCircle(b.x, b.y, b.r);
    }

    g.generateTexture('foam', G.worldWidth, H);

    this.add.image(G.worldWidth / 2, surfY - H / 2, 'foam').setDepth(2);

    const copy = this.add.image(G.worldWidth / 2, surfY, 'foam').setDepth(2);
    copy.setFlipX(true);
    copy.setFlipY(true);
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
    const G = CONFIG.GAME;
    const D = CONFIG.DOCK;

    this.platforms = this.physics.add.staticGroup();

    const pierH = G.height - D.topY;
    this.makePlatform(D.width / 2, D.topY + pierH / 2, D.width, pierH);
  }

  makePlatform(x, y, w, h) {
    const p = this.platforms.create(x, y, 'platform');
    p.setDisplaySize(w, h);
    p.body.setSize(w, h);
    p.refreshBody();
    return p;
  }

  generateKegXPositions() {
    const K = CONFIG.KEG;
    const G = CONFIG.GEN;
    const doorLeft = CONFIG.DOOR.x - CONFIG.DOOR.width / 2;
    const exitKegX = doorLeft - K.width / 2 - G.exitKegGap;
    const positions = [];
    const startX = CONFIG.DOCK.width + G.firstKegOffset;
    let x = startX;

    while (exitKegX - x > G.maxGap) {
      positions.push(x);
      const progress = (x - startX) / (exitKegX - startX);
      const extra = G.gapGrowth * progress;
      x += Phaser.Math.Between(G.gapMin + extra, G.gapMax + extra);
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
      const topOffset = Phaser.Math.Between(K.topOffsetFromSurface, K.topOffsetMax);
      const baseY = (this.beerY - topOffset) + K.height / 2;
      const keg = new Keg(this, x, baseY);
      const progress = positions.length > 1 ? i / (positions.length - 1) : 0;
      keg.tiltAmp = K.tiltAmplitude * (1 + K.tiltAmpGrowth * progress);
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
    const P = CONFIG.PLAYER;
    const D = CONFIG.DOCK;

    this.player = this.physics.add.sprite(90, D.topY - P.height / 2, 'player');
    this.player.setCollideWorldBounds(true);
  }

  makeDoor() {
    const D = CONFIG.DOOR;
    const doorY = this.beerY + D.submerged - D.height / 2;
    this.door = this.add.image(D.x, doorY, 'door');
  }

  startVictorySequence() {
    this.playerState = 'victory';
    this.hideRescuePrompt();
    this.tweens.killTweensOf(this.player);
    SFX.door();

    const keg = this.groundedKeg || this.lastKeg;
    const D = CONFIG.DOOR;
    const P = CONFIG.PLAYER;
    const K = CONFIG.KEG;
    const exitX = D.x + 60;
    const rideY = keg
      ? keg.baseY - K.height / 2 - P.height / 2
      : this.beerY - 20;

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
      y: rideY,
      duration: 1600,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.scene.start('Victory', { points: this.points });
      }
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
    const threshold = CONFIG.KEG.width * (CONFIG.KEG.safeZoneRatio / 2);

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
        keg.setWarningLean(0);
        return;
      }
      if (Math.abs(dx) > threshold) {
        this.tipKegUnder(player, keg, dx);
      } else {
        this.updateWarning(keg, dx, threshold);
      }
    }
  }

  updateWarning(keg, dx, threshold) {
    const ratio = Math.abs(dx) / threshold;
    let lean = 0;
    if (ratio > CONFIG.KEG.warningStartRatio) {
      const t = (ratio - CONFIG.KEG.warningStartRatio) / (1 - CONFIG.KEG.warningStartRatio);
      lean = t * (dx >= 0 ? 1 : -1);
    }
    keg.setWarningLean(lean);
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
    this.hudText.setText(
      `Баллы: ${this.points}    Спасений: ${Math.floor(this.points / CONFIG.RESCUE.cost)}    Падений: ${this.falls}`
    );
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
    this.splashEmitter.explode(12);
    SFX.splash();

    this.tweens.add({
      targets: this.player,
      y: this.beerY + 26,
      alpha: 0,
      duration: 500
    });
  }

  showRescuePrompt() {
    const canRescue = this.points >= CONFIG.RESCUE.cost && this.fallenFromKeg;
    const lines = ['Ты упал в пиво!'];
    if (canRescue) lines.push('[R] — спастись (2 балла)');
    lines.push('[Enter] — вернуться к старту');
    this.rescueText.setText(lines.join('\n')).setVisible(true);
  }

  handleRescuePrompt() {
    if (this.playerState !== 'fallen' || !this.rescueText.visible) return;

    const canRescue = this.points >= CONFIG.RESCUE.cost && this.fallenFromKeg;
    if (canRescue && Phaser.Input.Keyboard.JustDown(this.rescueKey)) {
      this.doRescue();
    } else if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.returnToStart();
    }
  }

  hideRescuePrompt() {
    this.rescueText.setVisible(false);
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
    const targetY = keg.baseY - K.height / 2 - P.height / 2;

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
    const P = CONFIG.PLAYER;
    const D = CONFIG.DOCK;
    const cam = this.cameras.main;

    this.tweens.killTweensOf(this.player);
    this.playerState = 'resetting';
    this.player.body.setAllowGravity(false);
    this.player.setAlpha(0);

    cam.fadeOut(250, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.player.setPosition(90, D.topY - P.height / 2);
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
