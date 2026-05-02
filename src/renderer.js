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
        if (c === '1' || c === '2' || c === 'E') { hit = true; wallType = c; }
      }

      let perpDist;
      if (side === 0) perpDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
      else perpDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;
      if (perpDist < 0.0001) perpDist = 0.0001;
      const correctedDist = perpDist * Math.cos(rayAngle - player.dir);
      zBuffer[x] = correctedDist;

      const lineHeight = Math.floor(RH / correctedDist);
      let drawStart = -lineHeight / 2 + RH / 2;
      let drawEnd = lineHeight / 2 + RH / 2;
      if (drawStart < 0) drawStart = 0;
      if (drawEnd >= RH) drawEnd = RH - 1;

      // Wall hit position for vertical detail stripes
      let wallHitCoord;
      if (side === 0) wallHitCoord = player.y + perpDist * rayDirY;
      else wallHitCoord = player.x + perpDist * rayDirX;
      wallHitCoord -= Math.floor(wallHitCoord);

      // Pick base color by wall type
      let baseColor;
      if (wallType === '2') baseColor = PALETTE.wallAccent;
      else if (wallType === 'E') baseColor = PALETTE.exitWall;
      else baseColor = side === 0 ? PALETTE.wallLight : PALETTE.wallDark;

      const fog = Math.max(0.15, 1 - correctedDist / 16);
      let r = Math.floor(baseColor[0] * fog);
      let g = Math.floor(baseColor[1] * fog);
      let b = Math.floor(baseColor[2] * fog);

      // "Panel line" details on walls
      const stripe = (wallHitCoord > 0.48 && wallHitCoord < 0.52) ||
                     (wallHitCoord > 0.0 && wallHitCoord < 0.04) ||
                     (wallHitCoord > 0.96 && wallHitCoord < 1.0);

      for (let y = Math.floor(drawStart); y <= Math.floor(drawEnd); y++) {
        const yFrac = (y - drawStart) / (drawEnd - drawStart);
        let rr = r, gg = g, bb = b;
        if (stripe) { rr = Math.floor(rr * 0.5); gg = Math.floor(gg * 0.5); bb = Math.floor(bb * 0.5); }
        if (y % 2 === 0) { rr = Math.floor(rr * 0.92); gg = Math.floor(gg * 0.92); bb = Math.floor(bb * 0.92); }
        // Type-2 walls get gold trim
        if (wallType === '2' && (yFrac < 0.1 || yFrac > 0.9)) {
          rr = Math.floor(245 * fog); gg = Math.floor(184 * fog); bb = 0;
        }
        setPixel(x, y, rr, gg, bb);
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

      // Rotate into camera space
      const cosA = Math.cos(-player.dir);
      const sinA = Math.sin(-player.dir);
      const transX = dx * cosA - dy * sinA;
      const transY = dx * sinA + dy * cosA;
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
    const fog = Math.max(0.2, 1 - dist / 14);
    const RW = CONFIG.RENDER_W, RH = CONFIG.RENDER_H;
    for (let x = 0; x < sw; x++) {
      const px = sx + x;
      if (px < 0 || px >= RW) continue;
      if (zBuffer[px] < dist) continue;
      const u = x / sw;
      for (let y = 0; y < sh; y++) {
        const py = sy + y;
        if (py < 0 || py >= RH) continue;
        const v = y / sh;
        const c = spritePixel(ent, u, v);
        if (!c || c[3] === 0) continue;
        setPixel(px, py,
          Math.floor(c[0] * fog),
          Math.floor(c[1] * fog),
          Math.floor(c[2] * fog));
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
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buffer, 0, 0, CONFIG.SCREEN_W, CONFIG.SCREEN_H);
  }

  return { init, castRays, drawSprites, drawHUD, blit };
})();
