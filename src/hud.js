// =====================================================
// HUD — text + Nick portrait drawn on the main canvas
// =====================================================
//
// The HUD background is drawn into the buffer by Renderer.drawHUD().
// This module draws crisp text and the pixel-art portrait on top
// of the scaled-up buffer so they don't pixelate.

const HUD = (() => {

  function draw(ctx, player) {
    ctx.imageSmoothingEnabled = false;
    const W = CONFIG.SCREEN_W, H = CONFIG.SCREEN_H;
    const S = W / 640;                   // scale factor vs original 640×400 layout
    const yMid = H - Math.round(88 * S / 2);   // sits in middle of HUD strip
    const fnt = (size) => `bold ${Math.round(size * S)}px "Courier New", monospace`;
    const lbl = Math.round(18 * S);
    const big = Math.round(28 * S);
    const sx = (n) => Math.round(n * S);

    ctx.textBaseline = 'middle';

    // HEALTH
    ctx.font = fnt(18);
    ctx.fillStyle = '#f5b800';
    ctx.fillText('HP', sx(16), yMid + sx(8));
    ctx.fillStyle = player.hp > 30 ? '#fff' : '#dc3232';
    ctx.font = fnt(28);
    ctx.fillText(String(player.hp).padStart(3, '0'), sx(50), yMid + sx(8));

    // AMMO
    ctx.font = fnt(18);
    ctx.fillStyle = '#f5b800';
    ctx.fillText('AMMO', sx(160), yMid + sx(8));
    ctx.fillStyle = '#fff';
    ctx.font = fnt(28);
    ctx.fillText(String(player.ammo).padStart(2, '0'), sx(220), yMid + sx(8));

    // BUGS killed
    ctx.font = fnt(18);
    ctx.fillStyle = '#f5b800';
    ctx.fillText('BUGS', sx(290), yMid + sx(8));
    ctx.fillStyle = '#fff';
    ctx.font = fnt(28);
    ctx.fillText(String(player.kills).padStart(2, '0'), sx(350), yMid + sx(8));

    // KEYS held
    ctx.font = fnt(18);
    ctx.fillStyle = '#f5b800';
    ctx.fillText('KEY', sx(395), yMid + sx(8));
    ctx.fillStyle = (player.keys || 0) > 0 ? '#f5b800' : '#666';
    ctx.font = fnt(28);
    ctx.fillText(String(player.keys || 0), sx(440), yMid + sx(8));

    // Portrait
    drawPortrait(ctx, sx(490), yMid + sx(8), player, S);

    // Right: weapon + episode
    const weaponName = (typeof Weapon !== 'undefined' && Weapon.list[player.currentWeapon])
      ? Weapon.list[player.currentWeapon].name
      : 'PISTOL';
    const levelId = (typeof getCurrentLevel === 'function')
      ? getCurrentLevel().id.toUpperCase()
      : 'E1M1';

    ctx.font = fnt(14);
    ctx.fillStyle = '#f5b800';
    ctx.textAlign = 'right';
    ctx.fillText(levelId, W - sx(16), yMid - sx(8));
    ctx.fillStyle = '#fff';
    ctx.fillText(weaponName, W - sx(16), yMid + sx(8));
    ctx.font = `${Math.round(11 * S)}px "Courier New", monospace`;
    ctx.fillStyle = '#aaa';
    ctx.fillText('FROM ZERO TO HERO', W - sx(16), yMid + sx(24));
    ctx.textAlign = 'left';
  }

  // 20x20 pixel-art portrait of Nick Chapsas — bald top, dark beard, glasses.
  function drawPortrait(ctx, cx, cy, player, scale = 1) {
    const size = Math.round(64 * scale);
    const grid = 20;
    const px = size / grid;
    const left = cx - size/2;
    const top = cy - size/2;
    const fill = (i, j, color, w = 1, h = 1) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(left + i*px), Math.round(top + j*px),
                   Math.ceil(w*px), Math.ceil(h*px));
    };

    // Frame: gold outer + dark inner + navy bg + corner studs
    const f = Math.round(5 * scale);
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(left - f, top - f, size + 2*f, size + 2*f);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(left - f + 2, top - f + 2, size + 2*f - 4, size + 2*f - 4);
    ctx.fillStyle = '#1a1f3a';
    ctx.fillRect(left, top, size, size);
    ctx.fillStyle = '#ffd84a';
    const stud = Math.max(3, Math.round(3 * scale));
    ctx.fillRect(left - f, top - f, stud, stud);
    ctx.fillRect(left + size + f - stud, top - f, stud, stud);
    ctx.fillRect(left - f, top + size + f - stud, stud, stud);
    ctx.fillRect(left + size + f - stud, top + size + f - stud, stud, stud);

    // State-driven colors
    const hurt = player.hurtFlash > 0;
    const lowHp = player.hp < 30;
    const skin = hurt ? '#ff6464' : (lowHp ? '#cc8866' : '#e0b896');
    const skinShade = hurt ? '#cc4040' : (lowHp ? '#a06848' : '#b88c70');
    const skinHi = hurt ? '#ff8888' : (lowHp ? '#dc9c78' : '#f0c8a8');
    const hair = '#221610';
    const hairLight = '#3a2418';
    const stache = '#2a1c10';
    const shirt = '#1a1d24';
    const shirtShade = '#0e1116';

    // Hair — short with a quiff/swept-up front. Covers top of head,
    // tapers slightly at sides.
    for (let i = 5; i < 15; i++) fill(i, 3, hair);
    for (let i = 4; i < 16; i++) fill(i, 4, hair);
    // Quiff: a sweep of taller hair on the front-left, shorter on the right
    fill(7, 2, hair); fill(8, 2, hair); fill(9, 2, hair); fill(10, 2, hair);
    fill(8, 1, hair); fill(9, 1, hair);
    // Highlights along the sweep
    fill(9, 2, hairLight);
    fill(8, 3, hairLight);
    // Sideburn-ish edge (very short)
    fill(4, 5, hair);
    fill(15, 5, hair);

    // Face base
    for (let i = 5; i < 15; i++)
      for (let j = 5; j < 13; j++)
        fill(i, j, skin);

    // Face shading (right side)
    for (let j = 6; j < 12; j++) fill(14, j, skinShade);
    // Cheek highlight (left)
    fill(6, 9, skinHi); fill(7, 9, skinHi);

    // Ears
    fill(4, 7, skinShade); fill(4, 8, skinShade);
    fill(15, 7, skinShade); fill(15, 8, skinShade);

    // Eyebrows (thin, slightly arched)
    fill(7, 6, hair); fill(8, 6, hair);
    fill(11, 6, hair); fill(12, 6, hair);

    // Eyes (white + dark pupil)
    fill(7, 7, '#fff'); fill(8, 7, '#fff');
    fill(11, 7, '#fff'); fill(12, 7, '#fff');
    fill(8, 7, '#0a0e1a');
    fill(11, 7, '#0a0e1a');

    // Nose (subtle)
    fill(10, 8, skinShade);
    fill(10, 9, skinShade);
    fill(9, 10, skinShade);

    // MUSTACHE — thin, two wings under nose, no beard
    fill(7, 10, stache); fill(8, 10, stache); fill(9, 10, stache);
    fill(10, 10, stache); fill(11, 10, stache); fill(12, 10, stache);
    fill(7, 11, stache); fill(12, 11, stache);

    // Mouth (smile or frown), under mustache
    if (lowHp) {
      fill(8, 12, '#3a1a1a', 4);
      fill(7, 11, '#3a1a1a');
      fill(12, 11, '#3a1a1a');
    } else {
      fill(8, 11, '#3a1a1a', 4);
      fill(8, 12, '#3a1a1a');
      fill(11, 12, '#3a1a1a');
    }

    // Chin / jaw shading (skin only, no beard)
    fill(5, 11, skinShade); fill(14, 11, skinShade);
    fill(6, 12, skinShade); fill(13, 12, skinShade);

    // Neck
    for (let i = 8; i < 12; i++) fill(i, 13, skinShade);
    for (let i = 8; i < 12; i++) fill(i, 14, skinShade);

    // Shirt (dark navy/black T-shirt)
    for (let i = 3; i < 17; i++)
      for (let j = 15; j < 20; j++)
        fill(i, j, shirt);
    for (let j = 15; j < 20; j++) {
      fill(15, j, shirtShade);
      fill(16, j, shirtShade);
    }
    // Crew neckline
    fill(8, 14, shirt); fill(9, 14, shirt); fill(10, 14, shirt); fill(11, 14, shirt);

    // "D" logo on shirt (gold)
    fill(8, 17, '#f5b800', 4, 1);
    fill(8, 18, '#f5b800'); fill(11, 18, '#f5b800');
    fill(8, 19, '#f5b800', 4, 1);
  }

  return { draw };
})();
