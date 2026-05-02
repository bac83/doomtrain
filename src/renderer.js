// =====================================================
// Renderer — DDA raycaster + billboard sprites
// =====================================================
//
// We render to a small offscreen buffer (CONFIG.RENDER_W x RENDER_H)
// for the chunky-pixel Doom look, then blit + scale to the main canvas.
// Renderer.init() must be called once. Each frame, call:
//   Renderer.castRays(player) — fills walls/floor/ceiling
//   Renderer.drawSprites(player, entities) — overlays sprites
//   Renderer.drawHUD() — fills the HUD strip background
//   Renderer.blit(ctx) — scales buffer onto main canvas
//
// zBuffer (per-column depth) is exposed for sprite occlusion.

const Renderer = (() => {
  let buffer, bctx, imgData, pixels;
  const zBuffer = new Float32Array(CONFIG.RENDER_W);

  function init() {
    buffer = document.createElement('canvas');
    buffer.width = CONFIG.RENDER_W;
    buffer.height = CONFIG.RENDER_H;
    bctx = buffer.getContext('2d');
    imgData = bctx.createImageData(CONFIG.RENDER_W, CONFIG.RENDER_H);
    pixels = imgData.data;
    Textures.init();
    Sprites.init();
  }

  function setPixel(x, y, r, g, b) {
    const i = (y * CONFIG.RENDER_W + x) * 4;
    pixels[i]   = r;
    pixels[i+1] = g;
    pixels[i+2] = b;
    pixels[i+3] = 255;
  }

  function castRays(player) {
    const RW = CONFIG.RENDER_W, RH = CONFIG.RENDER_H;

    // Ceiling + floor with vertical fog gradient
    for (let y = 0; y < RH; y++) {
      const isCeiling = y < RH / 2;
      const col = isCeiling ? PALETTE.ceiling : PALETTE.floor;
      const dist = Math.abs(y - RH/2) / (RH/2);
      const f = isCeiling ? (0.4 + dist * 0.6) : (0.3 + dist * 0.7);
      const r = Math.floor(col[0] * f);
      const g = Math.floor(col[1] * f);
      const b = Math.floor(col[2] * f);
      for (let x = 0; x < RW; x++) setPixel(x, y, r, g, b);
    }

    // Cast a ray per column
    for (let x = 0; x < RW; x++) {
      const cameraX = 2 * x / RW - 1;
      const rayAngle = player.dir + Math.atan(cameraX * Math.tan(player.fov / 2));
      const rayDirX = Math.cos(rayAngle);
      const rayDirY = Math.sin(rayAngle);

      // DDA setup
      let mapX = Math.floor(player.x);
      let mapY = Math.floor(player.y);
      const deltaDistX = Math.abs(1 / rayDirX);
      const deltaDistY = Math.abs(1 / rayDirY);
      let stepX, stepY, sideDistX, sideDistY;
      if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; }
      else { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
      if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; }
      else { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

      // Step until we hit a wall
      let hit = false, side = 0, wallType = '1', safety = 0;
      while (!hit && safety++ < 64) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX; mapX += stepX; side = 0;
        } else {
          sideDistY += deltaDistY; mapY += stepY; side = 1;
        }
        const c = mapAt(mapX, mapY);
        if (c === '1' || c === '2' || c === 'E' || c === 'D') { hit = true; wallType = c; }
      }

      let perpDist;
      if (side === 0) perpDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
      else perpDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;
      if (perpDist < 0.0001) perpDist = 0.0001;
      const correctedDist = perpDist * Math.cos(rayAngle - player.dir);
      zBuffer[x] = correctedDist;

      const lineHeight = Math.floor(RH / correctedDist);
      const drawStartUnclipped = -lineHeight / 2 + RH / 2;
      const drawEndUnclipped = lineHeight / 2 + RH / 2;
      let drawStart = drawStartUnclipped;
      let drawEnd = drawEndUnclipped;
      if (drawStart < 0) drawStart = 0;
      if (drawEnd >= RH) drawEnd = RH - 1;

      // Wall hit U coord (texture column 0..1)
      let wallHitCoord;
      if (side === 0) wallHitCoord = player.y + perpDist * rayDirY;
      else wallHitCoord = player.x + perpDist * rayDirX;
      wallHitCoord -= Math.floor(wallHitCoord);

      const fog = Math.max(CONFIG.TUNING.FOG_FLOOR, 1 - correctedDist / CONFIG.TUNING.FOG_DIST);
      const sideMul = side === 1 ? CONFIG.TUNING.SIDE_SHADE : 1.0;
      const lh = lineHeight > 0 ? lineHeight : 1;

      for (let y = Math.floor(drawStart); y <= Math.floor(drawEnd); y++) {
        const vFrac = (y - drawStartUnclipped) / lh;
        const tex = Textures.sample(wallType, wallHitCoord, vFrac);
        let rr = tex[0] * fog * sideMul;
        let gg = tex[1] * fog * sideMul;
        let bb = tex[2] * fog * sideMul;
        if (y % 2 === 0) { rr *= 0.92; gg *= 0.92; bb *= 0.92; }
        setPixel(x, y, rr | 0, gg | 0, bb | 0);
      }
    }
  }

  function drawSprites(player, entities) {
    // Sort by distance, far to near
    const visible = entities
      .filter(e => e.alive)
      .map(e => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        return { ent: e, distSq: dx*dx + dy*dy };
      })
      .sort((a, b) => b.distSq - a.distSq);

    for (const v of visible) {
      const e = v.ent;
      const dx = e.x - player.x;
      const dy = e.y - player.y;

      // Rotate into camera space.
      // Forward axis = (cos(dir), sin(dir)); right axis = (-sin(dir), cos(dir)).
      // transY = forward depth, transX = right offset.
      const cosA = Math.cos(player.dir);
      const sinA = Math.sin(player.dir);
      const transY = dx * cosA + dy * sinA;
      const transX = -dx * sinA + dy * cosA;
      if (transY < 0.1) continue;

      const RW = CONFIG.RENDER_W, RH = CONFIG.RENDER_H;
      const screenX = Math.floor((RW / 2) * (1 + transX / (transY * Math.tan(player.fov/2))));
      const spriteHeight = Math.abs(Math.floor(RH / transY * e.size * 1.6));
      const spriteWidth = spriteHeight;

      let yOffset = 0;
      if (e.type === 'coffee') {
        yOffset = Math.sin(performance.now() * 0.005 + e.bobPhase) * spriteHeight * 0.05;
      }

      const drawStartY = Math.floor(-spriteHeight / 2 + RH / 2 + yOffset);
      const drawStartX = Math.floor(-spriteWidth / 2 + screenX);

      drawSprite(e, drawStartX, drawStartY, spriteWidth, spriteHeight, transY);
    }
  }

  function drawSprite(ent, sx, sy, sw, sh, dist) {
    const data = Sprites.getData(ent.type);
    const fog = Math.max(0.2, 1 - dist / 14);
    const RW = CONFIG.RENDER_W, RH = CONFIG.RENDER_H;
    const SZ = Sprites.SIZE;
    const flash = ent.hitFlash > 0;
    for (let x = 0; x < sw; x++) {
      const px = sx + x;
      if (px < 0 || px >= RW) continue;
      if (zBuffer[px] < dist) continue;
      let tu = (x / sw * SZ) | 0;
      if (tu < 0) tu = 0; else if (tu >= SZ) tu = SZ - 1;
      for (let y = 0; y < sh; y++) {
        const py = sy + y;
        if (py < 0 || py >= RH) continue;
        let tv = (y / sh * SZ) | 0;
        if (tv < 0) tv = 0; else if (tv >= SZ) tv = SZ - 1;
        let r, g, b;
        if (data) {
          const idx = (tv * SZ + tu) * 4;
          if (data[idx + 3] === 0) continue;
          r = data[idx]; g = data[idx + 1]; b = data[idx + 2];
        } else {
          const c = spritePixel(ent, tu / SZ, tv / SZ);
          if (!c || c[3] === 0) continue;
          r = c[0]; g = c[1]; b = c[2];
        }
        if (flash) { r = 255; g = 255; b = 255; }
        setPixel(px, py, (r * fog) | 0, (g * fog) | 0, (b * fog) | 0);
      }
    }
  }

  function drawHUD() {
    const RW = CONFIG.RENDER_W, RH = CONFIG.RENDER_H;
    const hudY = RH - CONFIG.HUD_H;
    // Background
    for (let y = hudY; y < RH; y++) {
      for (let x = 0; x < RW; x++) {
        setPixel(x, y, PALETTE.hudBg[0], PALETTE.hudBg[1], PALETTE.hudBg[2]);
      }
    }
    // Top border (2px gold)
    for (let x = 0; x < RW; x++) {
      setPixel(x, hudY,     PALETTE.hudGold[0], PALETTE.hudGold[1], PALETTE.hudGold[2]);
      setPixel(x, hudY + 1, PALETTE.hudGold[0], PALETTE.hudGold[1], PALETTE.hudGold[2]);
    }
  }

  function blit(ctx) {
    bctx.putImageData(imgData, 0, 0);
    // Smoothed blit — softens the upscale so the world looks higher-fidelity
    // rather than chunky-pixel Doom. HUD text + portrait are drawn crisp on
    // top of the scaled buffer in hud.js, so they stay sharp.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(buffer, 0, 0, CONFIG.SCREEN_W, CONFIG.SCREEN_H);
  }

  return { init, castRays, drawSprites, drawHUD, blit };
})();
