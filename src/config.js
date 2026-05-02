// =====================================================
// Config — constants, palette, render resolution
// =====================================================

const CONFIG = {
  // Screen / canvas
  SCREEN_W: 640,
  SCREEN_H: 400,
  // Internal render buffer (Doom-ish chunky pixels, scaled up)
  RENDER_W: 320,
  RENDER_H: 200,
  // HUD takes the bottom strip of the render buffer
  HUD_H: 44,
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
