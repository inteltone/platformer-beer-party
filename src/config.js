const CONFIG = {
  GAME: {
    width: 1280,
    height: 720,
    worldWidth: 4000,
    backgroundColor: '#828282',
    gravityY: 1800,
    level: 1
  },

  LEVELS: [
    { equalGaps: true,  gapGrowth: 0,  rockKegs: false, safeZoneRatio: 0.5, time: 60, variedProtrusion: false },
    { equalGaps: false, gapGrowth: 0,  rockKegs: false, safeZoneRatio: 0.5, time: 50, variedProtrusion: false },
    { equalGaps: false, gapGrowth: 20, rockKegs: true,  safeZoneRatio: 0.5, time: 40, variedProtrusion: true },
    { equalGaps: false, gapGrowth: 20, rockKegs: true,  safeZoneRatio: 0.4, time: 30, variedProtrusion: true }
  ],

  FALL_MESSAGES: [
    'Эх! Не повезло!',
    'Ты снова искупался!',
    'Это заплыв, а не забег!',
    'Ты опять нырнул!',
    'Ты станешь героем мема!',
    'Пиво - твоя стихия!'
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
    bubbleColor: 0xfff6e0
  },

  PLAYER: {
    width: 44,
    height: 64,
    speed: 330,
    jumpVelocity: -820,
    color: 0x4d8df0,
    accent: 0xffd166,
    skin: 0xffd9a8
  },

  DOCK: {
    topY: 513,
    width: 410,
    height: 207,
    color: 0xcdcdcd,
    plank: 0x6b4423
  },

  KEG: {
    width: 96,
    height: 151,
    topOffsetFromSurface: 15,
    topOffsetMax: 55,
    safeZoneRatio: 0.5,
    gradientStops: [
      { p: 0.0037, c: 0x5b8b65 },
      { p: 0.2711, c: 0x4cb062 },
      { p: 0.7628, c: 0x2d4432 },
      { p: 0.9968, c: 0x46614c }
    ],
    tiltAmplitude: 0.08,
    tiltAmpGrowth: 0.8,
    tiltSpeedMin: 0.8,
    tiltSpeedMax: 1.6,
    warningMaxLean: 0.18,
    warningStartRatio: 0.7,
    bodyColor: 0x9aa7b5,
    lidColor: 0xc8d2dd,
    metalColor: 0x6b7684
  },

  DOOR: {
    width: 96,
    height: 160,
    x: 3850,
    submerged: 18,
    color: 0x4a3728,
    frameColor: 0x6b5340,
    signColor: 0x3fbf6e
  },

  JUMP: {
    maxReach: 295,
    coyoteMs: 90,
    bufferMs: 120
  },

  GEN: {
    gapMin: 190,
    gapMax: 245,
    equalGap: 218,
    gapGrowth: 20,
    maxGap: 270,
    firstKegOffset: 60,
    exitKegGap: 60
  },

  RESCUE: {
    cost: 2,
    graceDuration: 1000,
    riseDuration: 900
  },

  TIP: {
    duration: 400,
    sinkDuration: 600,
    graceAfterLanding: 400
  },

  HUD: {
    color: '#222222',
    fontSize: 22
  }
};
