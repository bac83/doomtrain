// =====================================================
// Weapon — first-person "Debugger Gun" + crosshair + muzzle flash
// =====================================================

const Weapon = (() => {

  // Gun sprite as a pixel grid. Easy to redesign — just rewrite this array.
  // Color codes: X=outline, G=gold, Y=highlight, D=dark detail, space=transparent.
  const GUN_PIXELS = [
    "      XXXXXXXX      ",
    "      XGGGGGGX      ",
    "      XGYYYYGX      ",
    "      XGYDDYGX      ",
    "      XGYDDYGX      ",
    "      XGYYYYGX      ",
    "    XXXGGGGGGXXX    ",
    "    XGGGGGGGGGGX    ",
    "    XGYYYYYYYYGX    ",
    "    XGYY    YYGX    ",
    "  XXXGYY    YYGXXX  ",
    "  XGGGGYY  YYGGGGX  ",
    "  XGYYYYYYYYYYYYGX  ",
    "  XGYYYYYYYYYYYYGX  ",
    "XXXGYYYYYYYYYYYYGXXX",
    "XGGGGGGGGGGGGGGGGGGX",
    "XGYYYYYYYYYYYYYYYYGX",
    "XGYYYY      YYYYYYGX",
    "XGYY            YYGX",
    "XGGXXXXXXXXXXXXXXGGX"
  ];
  const COLOR_MAP = {
    'X': '#000000',
    'G': '#f5b800',  // gold
    'Y': '#ffd84a',  // gold highlight
    'D': '#0a0e1a',  // dark navy
  };

  function draw(ctx, player) {
    const W = CONFIG.SCREEN_W, H = CONFIG.SCREEN_H;
    const cx = W / 2;
    const cy = H - 100;
    const bob = Math.sin(player.bobTime) * 6;
    const px = 6;
    const baseX = cx - 60;
    const baseY = cy + bob - 40;

    ctx.imageSmoothingEnabled = false;

    // Muzzle flash
    if (player.muzzleFlash > 0) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, baseY - 30, 60 * player.muzzleFlash, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5b800';
      ctx.beginPath();
      ctx.arc(cx, baseY - 30, 60 * player.muzzleFlash * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gun
    for (let r = 0; r < GUN_PIXELS.length; r++) {
      const row = GUN_PIXELS[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === ' ') continue;
        ctx.fillStyle = COLOR_MAP[ch] || '#000';
        ctx.fillRect(baseX + c * px, baseY + r * px, px, px);
      }
    }

    // Crosshair (4 ticks)
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(W/2 - 1, H/2 - 100 - 8, 2, 6);
    ctx.fillRect(W/2 - 1, H/2 - 100 + 2, 2, 6);
    ctx.fillRect(W/2 - 8, H/2 - 100 - 1, 6, 2);
    ctx.fillRect(W/2 + 2, H/2 - 100 - 1, 6, 2);
  }

  return { draw };
})();
