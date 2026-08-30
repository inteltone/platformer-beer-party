import Phaser from 'phaser';
import CONFIG from '../config.js';
import GameState from '../gameState.js';
import Keg, { DriftingKeg } from '../objects/Keg.js';
import HUD from '../objects/HUD.js';
import { generateKegXPositions } from '../utils/kegPositions.js';
import { KegState, PlayerState, SceneKey, SoundKey } from '../enums.js';

/**
 * Main game scene — the beer-platforming action happens here.
 *
 * Manages: player physics, keg generation/interaction, drifting train
 * recycling (level 2), rescue system, finish platform, and level
 * progression. UI elements are delegated to the HUD class.
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    const G = CONFIG.GAME;
    const B = CONFIG.BEER;

    this.beerY = Math.round(G.height * B.surfaceRatio);
    this.points = 0;
    this.falls = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.playerState = PlayerState.ALIVE;
    this.groundedKeg = null;
    this.lastKeg = null;
    this.fallenFromKeg = null;
    this.levelCfg = CONFIG.LEVELS[GameState.level - 1] || CONFIG.LEVELS[0];

    this.physics.world.setBounds(0, 0, G.worldWidth, G.height);

    this.add.tileSprite(G.worldWidth / 2, G.height / 2, G.worldWidth, G.height, 'bgtexture').setDepth(-0.5);

    try {
      if (this.textures.exists('truby')) {
        this.add.image(G.worldWidth / 2, G.height / 2, 'truby').setDepth(0);
      }

      if (this.textures.exists('header')) {
        const hH = this.textures.get('header').get(0).height;
        this.add.image(G.width / 2, hH / 2, 'header').setDepth(30).setScrollFactor(0);
      }

      if (this.textures.exists('lamp')) {
        const lampW = this.textures.get('lamp').get(0).width;
        for (let x = 400; x < G.worldWidth; x += lampW + 270) {
          this.add.image(x, 174, 'lamp').setDepth(29);
        }
      }
    } catch (err) {
      console.warn('Optional background assets failed to load:', err);
    }

    this.drawBeer();
    this.drawBeerBubbles();
    this.makePlatforms();
    this.makeFinishPlatform();
    this.makePlayer();

    // --- HUD ---
    this.hud = new HUD(this);
    this.hud.updateStats({
      level: GameState.level,
      points: this.points,
      rescues: Math.floor(this.points / CONFIG.RESCUE.cost),
      falls: this.falls,
    });

    // --- Kegs ---
    this.kegs = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    if (this.levelCfg.drifting) {
      this.makeDriftingKegs();
    } else {
      this.makeKegs();
    }

    this.physics.add.collider(this.player, this.kegs, this.handleKegContact, null, this);
    // Player collides with platforms (docks / finish) only when NOT
    // riding a drifting keg. If a keg drifts past a platform under the
    // player, the collider would eject them into the beer — so we
    // disable it while grounded on a drifting keg.
    this.physics.add.collider(this.player, this.platforms, null, () => {
      return !(this.levelCfg.drifting && this.groundedKeg);
    }, this);

    // --- Input ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.rescueKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    try {
      if (this.textures.exists('btnHome')) {
        const homeBtn = this.add.image(30, 34, 'btnHome')
          .setScrollFactor(0)
          .setDepth(32)
          .setInteractive({ useHandCursor: true });
        homeBtn.on('pointerdown', () => {
          this.scene.start(SceneKey.MENU);
        });
      }
    } catch (err) {
      console.warn('Failed to create home button:', err);
    }

    // --- Victory / level-complete UI ---
    this.finishCupShown = false;
    this.levelSuccessShown = false;
    this.lastDriftVelocity = 0;

    try {
      this.rescueBanner = this.add.image(G.width / 2, G.height * 0.42, 'plashka')
        .setScrollFactor(0).setDepth(40).setVisible(false);

      this.levelSuccessPanel = this.add.image(G.width / 2, G.height / 2, 'plashkaLevelSuccess')
        .setScrollFactor(0).setDepth(50).setVisible(false)
        .setInteractive({ useHandCursor: true });
      this.victoryScreen = this.add.image(G.width / 2, G.height / 2, 'screenVictory')
        .setScrollFactor(0).setDepth(50).setVisible(false)
        .setInteractive({ useHandCursor: true });
    } catch (err) {
      console.warn('Victory assets failed to load:', err);
    }

    this.levelSuccessPanel.on('pointerdown', () => {
      if (this.levelSuccessShown) this.advanceToNextLevel();
    });
    this.victoryScreen.on('pointerdown', () => {
      if (this.levelSuccessShown) this.advanceToNextLevel();
    });

    // --- Particles ---
    this.splashEmitter = this.add.particles(0, 0, 'circle', {
      speed: { min: 80, max: 220 },
      angle: { min: 200, max: 340 },
      gravityY: 350,
      lifespan: 1100,
      scale: { start: 0.58, end: 0.29 },
      tint: B.foamColor,
      emitting: false,
    }).setDepth(5);

    this.timerStarted = false;
  }

  /** Compute the x-coordinate of the finish platform's left edge. */
  get finishLeft() {
    const G = CONFIG.GAME;
    const F = CONFIG.FINISH;
    return G.worldWidth - F.width;
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

    this._drawFoamBubbles(G, B, elements);
  }

  _drawFoamBubbles(G, B, elements) {
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

    try {
      if (this.textures.exists('nameplate')) {
        const npH = this.textures.get('nameplate').get(0).height;
        const npY = D.topY + D.height - 20 - npH / 2;
        this.add.image(D.width / 2, npY, 'nameplate').setDepth(0);
      }
    } catch (err) {
      console.warn('Nameplate texture failed:', err);
    }
  }

  makeKegs() {
    const K = CONFIG.KEG;
    const positions = generateKegXPositions(this.levelCfg);

    positions.forEach((x, i) => {
      const topOffset = this.levelCfg.variedProtrusion
        ? Phaser.Math.Between(K.topOffsetFromSurface, K.topOffsetMax)
        : Math.round((K.topOffsetFromSurface + K.topOffsetMax) / 2);
      const baseY = (this.beerY - topOffset) + K.height / 2;
      const keg = new Keg(this, x, baseY);
      const progress = positions.length > 1 ? i / (positions.length - 1) : 0;
      keg.tiltAmp = this.levelCfg.rockKegs ? K.tiltAmplitude * (1 + K.tiltAmpGrowth * progress) : 0;
      if (i === positions.length - 1) {
        keg.isLastKeg = true;
      }
      this.kegs.add(keg);
    });
    this.kegList = this.kegs.getChildren();
  }

  makeDriftingKegs() {
    const D = CONFIG.DRIFT;
    const K = CONFIG.KEG;
    const G = CONFIG.GAME;
    const startX = CONFIG.DOCK.width + 100;
    const endX = G.worldWidth + 800;

    let x = startX;
    let i = 0;
    while (x < endX && i < D.kegCount) {
      const topOffset = Phaser.Math.Between(K.topOffsetFromSurface, K.topOffsetMax);
      const baseY = (this.beerY - topOffset) + K.height / 2;
      const keg = new DriftingKeg(this, x, baseY);
      this.kegs.add(keg);
      i++;
      x += K.width + Phaser.Math.Between(D.gapMin, D.gapMax);
    }
    this.kegList = this.kegs.getChildren();
  }

  updateDriftingKegs(time) {
    const K = CONFIG.KEG;

    // Remaining kegs keep drifting (bob / sway / tilt) even after the
    // player reaches the finish or is otherwise out of play — only
    // recycling / spawning of new kegs pauses once victory begins.
    this.kegList.forEach((keg) => keg.update(time));

    if (this.finishCupShown) return;

    this.kegList.sort((a, b) => a.x - b.x);

    // Rightmost *active* keg — recycling must extend the floating train,
    // not jump to a (possibly sunk) keg dangling at the far right edge.
    const floating = this.kegList.filter((k) => k.state === KegState.FLOATING).sort((a, b) => a.x - b.x);
    const rightMost = floating.length ? floating[floating.length - 1] : null;

    // Recycle kegs that drifted off the left edge OR fully sank (TIPPED),
    // re-injecting them just behind the rightmost floating keg. This keeps
    // the train contiguous and prevents the active-keg pool from shrinking
    // as kegs sink. TIPPING is NOT sunk: on drifting levels DriftingKeg.tipKeg
    // wobbles and recovers back to FLOATING, so such kegs must stay in place.
    let extended = false;
    this.kegList.forEach((keg) => {
      const offLeft = keg.state === KegState.FLOATING && keg.x < -K.width;
      const sunk = keg.state === KegState.TIPPED;
      if (!offLeft && !sunk) return;

      const baseX = rightMost
        ? rightMost.x + K.width + Phaser.Math.Between(CONFIG.DRIFT.gapMin, CONFIG.DRIFT.gapMax)
        : this.finishLeft - K.width / 2 - Phaser.Math.Between(0, 120);

      const topOffset = Phaser.Math.Between(K.topOffsetFromSurface, K.topOffsetMax);
      keg.baseY = (this.beerY - topOffset) + K.height / 2;
      keg.recycle();
      keg.x = baseX;
      extended = true;
    });

    if (extended) {
      this.kegList.sort((a, b) => a.x - b.x);
    }

    // Keep the finish reachable: if no floating keg is near the finish,
    // advance the leftmost floating keg forward to just ahead of the
    // rightmost — a short hop that preserves train density instead of
    // teleporting a keg from the far left edge across the whole level.
    const nowFloating = this.kegList.filter((k) => k.state === KegState.FLOATING).sort((a, b) => a.x - b.x);
    const nearFinish = nowFloating.some((k) => k.x > this.finishLeft - K.width * 2);
    if (!nearFinish && nowFloating.length >= 2) {
      // Never yank the keg the player is currently standing on — being
      // teleported from under their feet reads as an unfair second fall.
      const leftMost = nowFloating.find((k) => k !== this.groundedKeg);
      const right = nowFloating[nowFloating.length - 1];
      if (leftMost && leftMost !== right) {
        const topOffset = Phaser.Math.Between(K.topOffsetFromSurface, K.topOffsetMax);
        leftMost.baseY = (this.beerY - topOffset) + K.height / 2;
        leftMost.recycle();
        leftMost.x = right.x + K.width + Phaser.Math.Between(CONFIG.DRIFT.gapMin, CONFIG.DRIFT.gapMax);
        this.kegList.sort((a, b) => a.x - b.x);
      }
    }
  }

  regenerateLevel() {
    this.kegs.clear(true, true);
    this.kegList = [];
    if (this.levelCfg.drifting) {
      this.makeDriftingKegs();
    } else {
      this.makeKegs();
    }
  }

  makePlayer() {
    const D = CONFIG.DOCK;

    const tex = this.textures.exists('playerKon') ? 'playerKon' : 'player';
    this.player = this.physics.add.sprite(260, D.topY, tex);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.4);
    this.player.body.setSize(120, 205, false);
    this.player.body.setOffset(68, 22);

    const bodyOffsetY = this.player.body.offset.y * this.player.scaleY;
    const bodyH = this.player.body.height * this.player.scaleY;
    const spriteH = 256 * this.player.scaleY;
    this.playerBodyBottom = bodyOffsetY + bodyH - spriteH * 0.5;
    this.player.y = D.topY - this.playerBodyBottom;

    if (this.textures.exists('playerKon')) {
      this.player.play('playerIdle');
    }
  }

  makeFinishPlatform() {
    const F = CONFIG.FINISH;
    const G = CONFIG.GAME;
    const centerX = G.worldWidth - F.width / 2;
    const centerY = F.topY + F.height / 2;

    const bg = this.add.rectangle(centerX, centerY, F.width, F.height, F.color);
    this.physics.add.existing(bg, true);
    this.platforms.add(bg);

    this.add.tileSprite(centerX, centerY, F.width, F.height, 'brick')
      .setFlipX(true);

    const outline = this.add.graphics().setDepth(0);
    outline.lineStyle(3, 0x333333, 1);
    outline.beginPath();
    outline.moveTo(G.worldWidth - F.width, F.topY);
    outline.lineTo(G.worldWidth, F.topY);
    outline.strokePath();

    outline.beginPath();
    outline.moveTo(G.worldWidth - F.width, F.topY);
    outline.lineTo(G.worldWidth - F.width, F.topY + F.height);
    outline.strokePath();

    this.finishPlatform = bg;
  }

  showCup() {
    const F = CONFIG.FINISH;
    const G = CONFIG.GAME;
    const cupScale = 1;
    const cupCenterX = G.worldWidth - F.width / 2;
    const cupBottomY = F.topY;

    try {
      const cupH = this.textures.get('cup').get(0).height * cupScale;
      const cupY = cupBottomY - cupH / 2;
      const labelY = -cupH / 2 + 41;

      const luchi = this.add.image(0, labelY, 'cupLuchi');
      const cup = this.add.image(0, 0, 'cup').setScale(cupScale);
      const label = this.add.text(0, labelY, String(GameState.level), {
        fontFamily: 'Arial',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#fed330',
      }).setOrigin(0.5);

      const container = this.add.container(G.worldWidth + 300, cupY, [luchi, cup, label]).setDepth(3);

      // Cup (depth 3) should render under the player — lift the player
      // slightly so they appear in front during the victory ceremony.
      this.player.setDepth(4);

      this.tweens.add({
        targets: luchi,
        angle: 360,
        duration: 5000,
        repeat: -1,
      });

      this.tweens.add({
        targets: container,
        x: cupCenterX,
        duration: 1800,
        ease: 'Back.easeOut',
      });
    } catch (err) {
      console.warn('Failed to show victory cup:', err);
    }
  }

  checkFinishReached() {
    if (this.playerState !== PlayerState.ALIVE) return;
    const F = CONFIG.FINISH;
    const playerBottom = this.player.y + this.playerBodyBottom;
    const onFinish = this.player.x > this.finishLeft && Math.abs(playerBottom - F.topY) < 15;

    if (!this.finishCupShown && onFinish) {
      this.finishCupShown = true;
      this.timerStarted = false;
      this.showCup();
      if (GameState.level === 1) {
        this.sound.play(SoundKey.PEOPLE);
      } else if (GameState.level === 2) {
        this.sound.play(SoundKey.FANFARY);
      }
      this.time.delayedCall(2000, () => {
        if (this.playerState === PlayerState.ALIVE) {
          this.showLevelSuccess();
        }
      });
    }
  }

  showLevelSuccess() {
    this.levelSuccessShown = true;
    const panel = GameState.level === 2 ? this.victoryScreen : this.levelSuccessPanel;
    panel.setScale(0.3).setAlpha(0).setVisible(true);
    this.tweens.add({
      targets: panel,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });
  }

  advanceToNextLevel() {
    const nextLevel = GameState.level + 1;
    if (nextLevel > CONFIG.GAME.totalLevels) {
      this.scene.start(SceneKey.MENU);
    } else {
      GameState.level = nextLevel;
      GameState.unlockNext();
      this.scene.start(SceneKey.GAME);
    }
  }

  handleVictoryInput() {
    if (!this.finishCupShown) return;
    if (!this.levelSuccessShown) return;
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.advanceToNextLevel();
    }
  }

  handleKegContact(player, keg) {
    if (this.playerState !== PlayerState.ALIVE) return;
    if (keg.state !== KegState.FLOATING) return;

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
        if (!keg.scored) {
          keg.scored = true;
          this.addPoint();
        }
        return;
      }

      if (Math.abs(dx) <= threshold) {
        this.groundedKeg = keg;
        this.lastKeg = keg;
        keg.grantGrace(CONFIG.TIP.graceAfterLanding);
        this.sound.play(SoundKey.KEG);
        if (!keg.scored) {
          keg.scored = true;
          this.addPoint();
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

  tipKegUnder(_player, keg, dx) {
    // Brushing the edge of a NEIGHBOR keg while standing on another one
    // must not steal the player's footing: clearing groundedKeg here made
    // the keg actually under the player slide away (velocity match stops)
    // and drop them into the beer right after a rescue.
    if (this.groundedKeg && this.groundedKeg !== keg) {
      keg.tipKeg(dx >= 0 ? 1 : -1);
      return;
    }
    this.groundedKeg = null;
    this.lastKeg = keg;
    this.fallenFromKeg = keg;
    keg.tipKeg(dx >= 0 ? 1 : -1);
  }

  addPoint() {
    this.points++;
    this.updateHUD();
  }

  updateHUD() {
    this.hud.updateStats({
      level: GameState.level,
      points: this.points,
      rescues: Math.floor(this.points / CONFIG.RESCUE.cost),
      falls: this.falls,
    });
  }

  update(time, delta) {
    this.handleInput(delta);
    if (this.levelCfg.drifting) {
      this.updateDriftingKegs(time);
    }
    if (!this.finishCupShown && !this.levelCfg.drifting) {
      this.updateKegs(time);
    }
    this.checkFall();
    this.updateCamera();
    this.handleRescuePrompt();
    if (this.hud) this.hud.updateTimer(this.time.now - (this.timerStart || this.time.now), this.timerStarted);
    this.checkFinishReached();
    this.handleVictoryInput();
  }

  updateKegs(time) {
    this.kegList.forEach((keg) => keg.update(time));
  }

  checkFall() {
    if (this.playerState !== PlayerState.ALIVE) return;
    if (this.player.y > this.beerY) {
      this.fallToBeer();
    }
  }

  fallToBeer() {
    this.playerState = PlayerState.FALLEN;
    this.groundedKeg = null;
    this.falls++;
    this.fallenFromKeg = this.fallenFromKeg || this.lastKeg;
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);
    this.updateHUD();

    if (this.falls <= 3) {
      this.showRescuePrompt();
    }

    this.splashEmitter.x = this.player.x;
    this.splashEmitter.y = this.beerY;
    this.splashEmitter.explode(36);

    try {
      this.sound.play(SoundKey.FALL);
      this.sound.play(SoundKey.CRY);
    } catch (err) {
      console.warn('Failed to play fall/cry sounds:', err);
    }

    this.tweens.add({
      targets: this.player,
      y: this.beerY + 26,
      alpha: 0,
      duration: 500,
    });
  }

  showRescuePrompt() {
    this.rescueBanner.setScale(0.3).setAlpha(0).setVisible(true);

    this.tweens.add({
      targets: this.rescueBanner,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    this.time.delayedCall(3000, () => {
      if (!this.rescueBanner.visible) return;
      this.tweens.add({
        targets: this.rescueBanner,
        scaleX: 0.3,
        scaleY: 0.3,
        alpha: 0,
        duration: 300,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.rescueBanner.setVisible(false);
        },
      });
    });
  }

  handleRescuePrompt() {
    if (this.playerState !== PlayerState.FALLEN) return;

    const canRescue = this.points >= CONFIG.RESCUE.cost && (this.fallenFromKeg || this.levelCfg.drifting);
    if (canRescue && Phaser.Input.Keyboard.JustDown(this.rescueKey)) {
      this.doRescue();
    } else if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.returnToStart();
    }
  }

  hideRescuePrompt() {
    if (this.rescueBanner) this.rescueBanner.setVisible(false);
  }

  doRescue() {
    this.points -= CONFIG.RESCUE.cost;
    this.updateHUD();
    this.hideRescuePrompt();
    this.tweens.killTweensOf(this.player);

    const keg = this.findNearestKeg();
    this.fallenFromKeg = null;
    this.groundedKeg = null;

    if (!keg) {
      this.resetPlayer();
      return;
    }

    this.playerState = PlayerState.RESCUING;
    keg.restoreForRescue();

    const K = CONFIG.KEG;
    const targetY = keg.baseY - K.height / 2 - this.playerBodyBottom;

    this.player.body.enable = false;

    if (this.levelCfg.drifting) {
      this.tweens.add({
        targets: this.player,
        y: targetY,
        alpha: 1,
        duration: CONFIG.RESCUE.riseDuration,
        ease: 'Sine.easeOut',
        onUpdate: () => {
          this.player.x = keg.x;
        },
        onComplete: () => {
          this.player.x = keg.x;
          this.player.y = targetY;
          this.player.body.enable = true;
          this.player.body.setAllowGravity(true);
          this.player.setVelocity(keg.body.velocity.x, keg.body.velocity.y);
          this.playerState = PlayerState.ALIVE;
          this.groundedKeg = keg;
          this.lastKeg = keg;
          // Grace must start at LANDING, not at rescue start: the rise
          // already consumed most of the 1s granted by restoreForRescue(),
          // leaving ~100ms — any perturbation then tipped the keg again.
          keg.grantGrace(CONFIG.RESCUE.graceDuration);
        },
      });
    } else {
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
          this.playerState = PlayerState.ALIVE;
          this.groundedKeg = keg;
          this.lastKeg = keg;
          keg.grantGrace(CONFIG.RESCUE.graceDuration);
        },
      });
    }
  }

  findNearestKeg() {
    let nearest = null;
    let minDist = Infinity;
    const finishLeft = this.finishLeft;
    this.kegList.forEach((keg) => {
      if (keg.state !== KegState.FLOATING) return;
      if (keg.x <= this.player.x) return;
      if (keg.x > finishLeft - 20) return;
      const dist = keg.x - this.player.x;
      if (dist < minDist) {
        minDist = dist;
        nearest = keg;
      }
    });
    return nearest;
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
    this.playerState = PlayerState.RESETTING;
    this.player.body.setAllowGravity(false);
    this.player.setAlpha(0);

    cam.fadeOut(250, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.player.setPosition(260, D.topY - this.playerBodyBottom);
      this.player.setVelocity(0, 0);
      this.player.body.setAllowGravity(true);
      this.player.setAlpha(1);
      this.playerState = PlayerState.ALIVE;
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

  handleInput(delta) {
    if (this.playerState !== PlayerState.ALIVE) return;

    const P = CONFIG.PLAYER;
    const J = CONFIG.JUMP;
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;

    if (onGround) {
      this.coyoteTimer = J.coyoteMs;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.jumpBufferTimer = J.bufferMs;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    if (this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown) {
      if (!this.timerStarted) {
        this.timerStarted = true;
        this.timerStart = this.time.now;
      }
    }

    const canDrift = this.levelCfg.drifting;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-P.speed);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(P.speed);
      this.player.setFlipX(false);
    } else if (onGround && this.groundedKeg && this.groundedKeg.body && canDrift) {
      this.lastDriftVelocity = this.groundedKeg.body.velocity.x;
      this.player.setVelocityX(this.lastDriftVelocity);
    } else if (onGround) {
      this.player.setVelocityX(0);
    } else if (canDrift) {
      this.player.setVelocityX(this.lastDriftVelocity);
    } else {
      this.player.setVelocityX(0);
    }

    if ((onGround || this.coyoteTimer > 0) && this.jumpBufferTimer > 0) {
      this.player.setVelocityY(P.jumpVelocity);
      this.jumpBufferTimer = 0;
      this.groundedKeg = null;
      this.sound.play(SoundKey.OH);
    }

    this.updatePlayerAnim(onGround);

    // On the finish platform, confine the player horizontally so they can
    // freely walk with arrow keys but cannot fall off either edge.
    const F = CONFIG.FINISH;
    if (this.player.body.blocked.down || this.player.body.touching.down) {
      const bottom = this.player.y + this.playerBodyBottom;
      if (this.player.x > this.finishLeft && Math.abs(bottom - F.topY) < 15) {
        const halfW = this.player.body.width * 0.5;
        const minX = this.finishLeft + halfW;
        const maxX = CONFIG.GAME.worldWidth - halfW;
        if (this.player.x < minX) {
          this.player.x = minX;
          this.player.setVelocityX(Math.max(0, this.player.body.velocity.x));
        } else if (this.player.x > maxX) {
          this.player.x = maxX;
          this.player.setVelocityX(Math.min(0, this.player.body.velocity.x));
        }
      }
    }
  }

  updatePlayerAnim(onGround) {
    if (!this.textures.exists('playerKon')) return;

    const p = this.player;
    const velY = p.body.velocity.y;

    if (!onGround) {
      if (velY < -50) {
        if (!p.anims.isPlaying || p.anims.currentAnim.key !== 'playerJump') {
          p.play('playerJump');
        }
      } else {
        if (!p.anims.isPlaying || p.anims.currentAnim.key !== 'playerFall') {
          p.play('playerFall');
        }
      }
    } else if (this.cursors.left.isDown || this.cursors.right.isDown) {
      if (!p.anims.isPlaying || p.anims.currentAnim.key !== 'playerRun') {
        p.play('playerRun');
      }
    } else {
      if (!p.anims.isPlaying || p.anims.currentAnim.key !== 'playerIdle') {
        p.play('playerIdle');
      }
    }
  }
}
