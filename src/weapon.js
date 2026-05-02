// =====================================================
// Weapon — first-person sprites, crosshair, muzzle flash, registry
// =====================================================
//
// Weapon.list is the canonical registry. Player.state.currentWeapon
// indexes into it. Each weapon defines fire behavior + sprite.

const Weapon = (() => {

  // Pistol — gold "Debugger Gun".
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

  // Hammer — wooden-shafted "Refactor Hammer" with gold head.
  const HAMMER_PIXELS = [
    "                    ",
    "                    ",
    "    XXXXXXXXXXXX    ",
    "    XGGGGGGGGGGX    ",
    "    XGYYYYYYYYDX    ",
    "    XGYYYYYYYYDX    ",
    "    XGYYYYYYYYDX    ",
    "    XGYYYYYYYYDX    ",
    "    XGGGGGGGGGGX    ",
    "    XXXXXXXXXXXX    ",
    "         XBX        ",
    "         XBX        ",
    "         XBX        ",
    "         XBX        ",
    "         XBX        ",
    "        XBBBX       ",
    "       XBBBBBX      ",
    "       XBBBBBX      ",
    "       XBBBBBX      ",
    "       XXXXXXX      "
  ];

  const COLOR_MAP = {
    'X': '#000000',
    'G': '#f5b800',
    'Y': '#ffd84a',
    'D': '#0a0e1a',
    'B': '#5a3818',
  };

  const list = [
    { name: 'PISTOL',  ammoType: 'bullets', fireRate: 0.35, damage: 1, range: 12,  sound: 'shoot',       muzzle: 1.0, sprite: GUN_PIXELS },
    { name: 'HAMMER',  ammoType: null,      fireRate: 0.20, damage: 3, range: 1.6, sound: 'shootHammer', muzzle: 0.0, sprite: HAMMER_PIXELS },
  ];

  function draw(ctx, player) {
    const W = CONFIG.SCREEN_W, H = CONFIG.SCREEN_H;
    const cx = W / 2;
    const cy = H - 100;
    const bob = Math.sin(player.bobTime) * 6;
    const px = 6;
    const baseX = cx - 60;
    const baseY = cy + bob - 40;

    ctx.imageSmoothingEnabled = false;

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

    const sprite = list[player.currentWeapon].sprite;
    for (let r = 0; r < sprite.length; r++) {
      const row = sprite[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === ' ') continue;
        ctx.fillStyle = COLOR_MAP[ch] || '#000';
        ctx.fillRect(baseX + c * px, baseY + r * px, px, px);
      }
    }

    // Crosshair
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(W/2 - 1, H/2 - 100 - 8, 2, 6);
    ctx.fillRect(W/2 - 1, H/2 - 100 + 2, 2, 6);
    ctx.fillRect(W/2 - 8, H/2 - 100 - 1, 6, 2);
    ctx.fillRect(W/2 + 2, H/2 - 100 - 1, 6, 2);
  }

  return { list, draw };
})();
