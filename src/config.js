// =====================================================
// Config — constants, palette, render resolution
// =====================================================

const CONFIG = {
  // Screen / canvas — 2× the original 640×400.
  SCREEN_W: 1280,
  SCREEN_H: 800,
  // Internal render buffer. ~1.78× scale to screen, blit with smoothing on
  // for soft pixels rather than chunky doom blocks. Higher render res =
  // sharper textures, less aliasing on sprites.
  RENDER_W: 720,
  RENDER_H: 450,
  // HUD strip in render-buffer space (becomes ~106px on screen).
  HUD_H: 60,

  // Game-feel knobs (formerly scattered across modules).
  TUNING: {
    PLAYER_SPEED: 3.0,
    PLAYER_RUN_MUL: 1.6,
    PLAYER_FOV: Math.PI / 3,
    MOUSE_SENS: 0.003,
    BUG_SPEED: 0.35,
    BUG_DAMAGE: 8,
    BUG_ATTACK_RANGE: 2.6,
    BUG_APPROACH_DIST: 2.4,
    BUG_ATTACK_COOLDOWN: 1.2,
    COFFEE_HEAL: 25,
    FOG_FLOOR: 0.15,
    FOG_DIST: 16,
    SIDE_SHADE: 0.75,
    RAY_STEP: 0.05,
  },
};

// Dometrain-flavored palette: dark navy + gold
// Distinct from Doom's classic red/brown so we don't just look like Doom
const PALETTE = {
  ceiling:    [20, 28, 50],     // dark navy
  floor:      [12, 18, 35],     // even darker navy
  wallLight:  [245, 184, 0],    // dometrain gold (lit side)
  wallDark:   [180, 130, 0],    // dometrain gold (shadow side)
  wallAccent: [60, 40, 80],     // "course poster" walls (type 2)
  exitWall:   [60, 220, 100],   // exit marker
  hudBg:      [10, 14, 26],
  hudGold:    [245, 184, 0],
  hudWhite:   [255, 255, 255],
  red:        [220, 50, 50],
  green:      [80, 200, 80],
};
