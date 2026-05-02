// =====================================================
// Weapon — first-person sprites, crosshair, muzzle flash, registry
// =====================================================
//
// Weapon.list is the canonical registry. Player.state.currentWeapon
// indexes into it. Each weapon defines fire behavior + sprite.

const Weapon = (() => {

  // Pistol — gold "Debugger Gun" with shaded barrel + dark grip.
  // X=outline, S=shadow gold, G=gold, Y=highlight, D=dark navy, R=red dot, W=white
  const GUN_PIXELS = [
    "        XXXXXXXX        ",
    "        XSGGGGGX        ",
    "        XSGYYGGX        ",
    "        XSGYRGGX        ",
    "        XSGYYGGX        ",
    "        XSGGGGGX        ",
    "      XXXSGGGGGXXX      ",
    "      XSSGGGGGGGGX      ",
    "      XSGYYYYYYGGX      ",
    "      XSGYY  YYGGX      ",
    "    XXXSGYY  YYGGXXX    ",
    "    XSSGGYY  YYGGGGX    ",
    "    XSGYYYYYYYYYYGGX    ",
    "    XSGYYYWWYYYYYYGX    ",
    "  XXXSGYYYWDWYYYYYYGXXX ",
    "  XSGGGGGYWDWGGGGGGGGX  ",
    "  XSGYYYYYWWYYYYYYYYGX  ",
    "XXSSGYYYYYYYYYYYYYYYYGXX",
    "XSDDGYYYY    YYYYYYYYGSX",
    "XSDDGYY        YYYYYYGSX",
    "XSDDGGGGGGGGGGGGGGGGGGSX",
    "XSDDDDDDDDDDDDDDDDDDDDSX",
    "XSDDDDDDDDDDDDDDDDDDDDSX",
    "XXSSSSSSSSSSSSSSSSSSSSXX"
  ];

  // Hammer — "Refactor Hammer", gold head with "D" engraving, brown shaft.
  const HAMMER_PIXELS = [
    "                        ",
    "                        ",
    "    XXXXXXXXXXXXXXXX    ",
    "    XSGGGGGGGGGGGGGX    ",
    "    XSGYYYYYYYYYYGGX    ",
    "    XSGYYDDYYDDYYGGX    ",
    "    XSGYYDDYYDDYYGGX    ",
    "    XSGYYDDYYDDYYGGX    ",
    "    XSGYYDDYYDDYYGGX    ",
    "    XSGYYYYYYYYYYGGX    ",
    "    XSGGGGGGGGGGGGGX    ",
    "    XXXXXXXXXXXXXXXX    ",
    "           XBX          ",
    "           XBX          ",
    "           XBX          ",
    "           XBX          ",
    "          XBBBX         ",
    "         XBBBBBX        ",
    "        XBBBBBBBX       ",
    "        XBHHHHHBX       ",
    "        XBHHHHHBX       ",
    "        XBHHHHHBX       ",
    "        XBBBBBBBX       ",
    "        XXXXXXXXX       "
  ];

  const COLOR_MAP = {
    'X': '#000000',
    'S': '#a07a00',
    'G': '#f5b800',
    'Y': '#ffd84a',
    'W': '#ffffff',
    'R': '#dc3232',
    'D': '#0a0e1a',
    'B': '#5a3818',
    'H': '#7a4e22',
  };

  const list = [
    { name: 'PISTOL',  ammoType: 'bullets', fireRate: 0.35, damage: 1, range: 12,  sound: 'shoot',       muzzle: 1.0, sprite: GUN_PIXELS },
    { name: 'HAMMER',  ammoType: null,      fireRate: 0.20, damage: 3, range: 1.6, sound: 'shootHammer', muzzle: 0.0, sprite: HAMMER_PIXELS },
  ];

  function draw(ctx, player) {
    const W = CONFIG.SCREEN_W, H = CONFIG.SCREEN_H;
    const S = W / 640;
    const cx = W / 2;
    const cy = H - Math.round(100 * S);
    const bob = Math.sin(player.bobTime) * 6 * S;
    const px = Math.round(5 * S);
    const sprite = list[player.currentWeapon].sprite;
    const spriteW = sprite[0].length * px;
    const baseX = cx - spriteW / 2;
    const baseY = cy + bob - 20 * S;

    ctx.imageSmoothingEnabled = false;

    if (player.muzzleFlash > 0) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, baseY - 30 * S, 60 * S * player.muzzleFlash, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5b800';
      ctx.beginPath();
      ctx.arc(cx, baseY - 30 * S, 60 * S * player.muzzleFlash * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let r = 0; r < sprite.length; r++) {
      const row = sprite[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === ' ') continue;
        ctx.fillStyle = COLOR_MAP[ch] || '#000';
        ctx.fillRect(baseX + c * px, baseY + r * px, px, px);
      }
    }

    // Crosshair sits on the wall-horizon row (renderer projects walls around RH/2),
    // which scales to screen y = H/2. That's where hitScan rays aim.
    const ch_y = H / 2;
    const t = Math.max(2, Math.round(2 * S));
    const arm = Math.round(6 * S);
    const gap = Math.round(8 * S);
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(cx - t/2, ch_y - gap, t, arm);
    ctx.fillRect(cx - t/2, ch_y + gap - arm, t, arm);
    ctx.fillRect(cx - gap, ch_y - t/2, arm, t);
    ctx.fillRect(cx + gap - arm, ch_y - t/2, arm, t);
  }

  return { list, draw };
})();
