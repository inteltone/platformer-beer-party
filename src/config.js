/**
 * Immutable game configuration.
 *
 * This file contains ONLY static settings — colors, dimensions, speeds,
 * level definitions. Runtime state (current level, unlocked levels) lives
 * in gameState.js to avoid mutating configuration at runtime.
 */

const CONFIG = {
  GAME: {
    width: 1280,
    height: 720,
    worldWidth: 4000,
    backgroundColor: '#565656',
    gravityY: 1800,
    totalLevels: 2, // was hardcoded as "2" in advanceToNextLevel
  },

  LEVELS: [
    { equalGaps: false, gapGrowth: 20, rockKegs: true, safeZoneRatio: 0.5, time: 0, variedProtrusion: true },
    { drifting: true, safeZoneRatio: 0.5, time: 0, variedProtrusion: true },
  ],

  BEER: {
    surfaceRatio: 0.786,
    color: 0x824e00,
    bodyAlpha: 0.9,
    overlayAlpha: 0.55,
    foamColor: 0xd5c4aa,
    foamFlakeCount: 36,
    foamSink: 5,
    foamMaxSize: 9,
    bubbleCount: 130,
    bubbleColor: 0xfff6e0,
  },

  PLAYER: {
    width: 44,
    height: 64,
    speed: 330,
    jumpVelocity: -820,
    color: 0x4d8df0,
    accent: 0xffd166,
    skin: 0xffd9a8,
  },

  DOCK: {
    topY: 513,
    width: 410,
    height: 207,
    color: 0xcdcdcd,
    plank: 0x6b4423,
  },

  KEG: {
    width: 96,
    height: 151,
    topOffsetFromSurface: 20,
    topOffsetMax: 40,
    safeZoneRatio: 0.5,
    gradientStops: [
      { p: 0.0037, c: 0x5b8b65 },
      { p: 0.2711, c: 0x4cb062 },
      { p: 0.7628, c: 0x2d4432 },
      { p: 0.9968, c: 0x46614c },
    ],
    tiltAmplitude: 0.08,
    tiltAmpGrowth: 0.8,
    tiltSpeedMin: 0.8,
    tiltSpeedMax: 1.6,
    warningMaxLean: 0.18,
    warningStartRatio: 0.7,
    bodyColor: 0x9aa7b5,
    lidColor: 0xc8d2dd,
    metalColor: 0x6b7684,
  },

  FINISH: {
    width: 410,
    height: 207,
    topY: 513,
    color: 0xcdcdcd,
  },

  DRIFT: {
    speed: 42,
    gapMin: -10,
    gapMax: 170,
    bobAmpMin: 3,
    bobAmpMax: 10,
    bobFreqMin: 0.5,
    bobFreqMax: 2,
    swayAmpMin: 3,
    swayAmpMax: 12,
    swayFreqMin: 0.3,
    swayFreqMax: 1.5,
    tiltAmpMin: 0.02,
    tiltAmpMax: 0.08,
    tiltFreqMin: 0.4,
    tiltFreqMax: 1.8,
    kegCount: 40,
  },

  JUMP: {
    maxReach: 295,
    coyoteMs: 90,
    bufferMs: 120,
  },

  GEN: {
    gapMin: 190,
    gapMax: 245,
    equalGap: 218,
    maxGap: 270,
    firstKegOffset: 60,
    exitKegGap: 60,
  },

  RESCUE: {
    cost: 2,
    graceDuration: 1000,
    riseDuration: 900,
  },

  TIP: {
    duration: 400,
    sinkDuration: 600,
    graceAfterLanding: 400,
  },

  HUD: {
    color: '#222222',
    fontSize: 22,
    fontFamily: 'Courier New, monospace',
  },
};

export default CONFIG;
