import CONFIG from '../config.js';
import GameState from '../gameState.js';

/**
 * Heads-up display — level number, points, rescues, falls, timer.
 *
 * All elements are fixed to the camera (scrollFactor 0) so they
 * don't move with the world. Created once in GameScene and updated
 * via updateStats() / updateTimer().
 */
export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this._createTexts();
  }

  _createTexts() {
    const { fontFamily, fontSize } = CONFIG.HUD;

    this.levelText = this.scene.add.text(318, 25.5, '1', {
      fontFamily,
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

    this.pointsText = this.scene.add.text(453.5, 34, '0', {
      fontFamily,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#00ff42',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

    this.rescuesText = this.scene.add.text(590.5, 34, '0', {
      fontFamily,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#00ff42',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

    this.fallsText = this.scene.add.text(713, 34, '0', {
      fontFamily,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ff0000',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);

    this.timerText = this.scene.add.text(1174, 35, '00:00', {
      fontFamily,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#00ff42',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(31);
  }

  updateStats({ level, points, rescues, falls }) {
    this.levelText.setText(String(level));
    this.pointsText.setText(String(points));
    this.rescuesText.setText(String(rescues));
    this.fallsText.setText(String(falls));
  }

  updateTimer(elapsedMs, started) {
    if (!started) return;
    const secs = Math.floor(elapsedMs / 1000);
    const mm = Math.floor(secs / 60);
    const ss = secs % 60;
    this.timerText.setText(
      `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
    );
  }
}
