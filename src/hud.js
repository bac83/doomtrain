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
    const yMid = H - 44;

    // HEALTH
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f5b800';
    ctx.fillText('HP', 16, yMid + 8);
    ctx.fillStyle = player.hp > 30 ? '#fff' : '#dc3232';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText(String(player.hp).padStart(3, '0'), 50, yMid + 8);

    // AMMO
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = '#f5b800';
    ctx.fillText('AMMO', 160, yMid + 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText(String(player.ammo).padStart(2, '0'), 220, yMid + 8);

    // BUGS killed
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = '#f5b800';
    ctx.fillText('BUGS', 290, yMid + 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText(String(player.kills).padStart(2, '0'), 350, yMid + 8);

    // Center: Nick portrait
    drawPortrait(ctx, 440, yMid + 8, player);

    // Right: episode label
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#f5b800';
    ctx.textAlign = 'right';
    ctx.fillText('E1M1', W - 16, yMid - 2);
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('FROM ZERO TO HERO', W - 16, yMid + 18);
    ctx.textAlign = 'left';
  }

  // 16x16 pixel-art portrait of Nick. Smiles when healthy, frowns when low HP.
  function drawPortrait(ctx, cx, cy, player) {
    const size = 60;
    const px = size / 16;
    const left = cx - size/2;
    const top = cy - size/2;

    // Frame
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(left - 4, top - 4, size + 8, size + 8);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(left - 2, top - 2, size + 4, size + 4);
    ctx.fillStyle = '#1a1f3a';
    ctx.fillRect(left, top, size, size);

    // State-driven colors
    const hurt = player.hurtFlash > 0;
    const lowHp = player.hp < 30;
    const skin = hurt ? '#ff6464' : (lowHp ? '#cc8866' : '#dcb496');
    const hair = '#322318';
    const beard = '#3c2818';
    const shirt = '#1e3258';

    // Hair
    ctx.fillStyle = hair;
    for (let i = 3; i < 13; i++) ctx.fillRect(left + i*px, top + 1*px, px, px);
    for (let i = 2; i < 14; i++) ctx.fillRect(left + i*px, top + 2*px, px, px);

    // Face
    ctx.fillStyle = skin;
    for (let i = 4; i < 12; i++) {
      for (let j = 3; j < 11; j++) {
        ctx.fillRect(left + i*px, top + j*px, px, px);
      }
    }

    // Eyes
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(left + 6*px, top + 5*px, px, px);
    ctx.fillRect(left + 9*px, top + 5*px, px, px);

    // Mouth (smile or frown)
    ctx.fillStyle = '#3a1a1a';
    if (lowHp) {
      ctx.fillRect(left + 6*px, top + 9*px, 4*px, px);
      ctx.fillRect(left + 6*px, top + 8*px, px, px);
      ctx.fillRect(left + 9*px, top + 8*px, px, px);
    } else {
      ctx.fillRect(left + 6*px, top + 8*px, 4*px, px);
      ctx.fillRect(left + 6*px, top + 9*px, px, px);
      ctx.fillRect(left + 9*px, top + 9*px, px, px);
    }

    // Beard
    ctx.fillStyle = beard;
    for (let i = 4; i < 12; i++) ctx.fillRect(left + i*px, top + 10*px, px, px);
    ctx.fillRect(left + 4*px, top + 9*px, px, px);
    ctx.fillRect(left + 11*px, top + 9*px, px, px);

    // Shirt + logo
    ctx.fillStyle = shirt;
    for (let i = 2; i < 14; i++) {
      for (let j = 12; j < 16; j++) {
        ctx.fillRect(left + i*px, top + j*px, px, px);
      }
    }
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(left + 7*px, top + 13*px, 2*px, 2*px);
  }

  return { draw };
})();
