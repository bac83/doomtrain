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
