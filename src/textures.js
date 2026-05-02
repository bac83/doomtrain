// =====================================================
// Textures — procedural wall textures (Dometrain themed)
// =====================================================
//
// Each tile type ('1', '2', 'E') gets a 64×64 texture painted once
// at boot into an OffscreenCanvas-style HTMLCanvasElement, then cached
// as a flat Uint8ClampedArray (RGBA) for fast per-pixel sampling.
//
// Theme: navy + gold + purple + green only. Mock course covers,
// "D" logos, "DIPLOMA" graduation banner. No real letters needed —
// chunky pixel bars at distance read as text. Affectionate, not ironic.

const Textures = (() => {
  const SIZE = 64;
  const cache = {};

  function makeCanvas() {
    const c = document.createElement('canvas');
    c.width = SIZE;
    c.height = SIZE;
    return c;
  }

  // Minimal 4×6 bitmap glyphs — only what we stamp on textures.
  const FONT = {
    D: [
      '###.',
      '#..#',
      '#..#',
      '#..#',
      '#..#',
      '###.',
    ],
  };

  function drawGlyph(ctx, ch, x, y, color) {
    const g = FONT[ch];
    if (!g) return;
    ctx.fillStyle = color;
    for (let r = 0; r < g.length; r++) {
      const row = g[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '#') ctx.fillRect(x + c, y + r, 1, 1);
      }
    }
  }

  // Tile '1' — "Course Shelf": navy backdrop with 4 gold book spines.
  function paintCourseShelf(ctx) {
    ctx.fillStyle = '#1a1f3a';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Shelf boards (gold) at top + bottom
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(0, 0, SIZE, 2);
    ctx.fillRect(0, SIZE - 2, SIZE, 2);

    // Book spines, 4 columns × 14px wide, 2px gaps
    const spineColors = ['#c89800', '#9a6f00', '#e0a800', '#a07a00'];
    for (let i = 0; i < 4; i++) {
      const x = i * 16 + 1;
      ctx.fillStyle = spineColors[i];
      ctx.fillRect(x, 4, 14, SIZE - 8);

      // Title band (gold trim + dark stripe)
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(x + 1, 14, 12, 8);
      ctx.fillStyle = '#f5b800';
      ctx.fillRect(x + 2, 16, 10, 1);
      ctx.fillRect(x + 2, 19, 10, 1);

      // Mini "D" logo at bottom of each spine
      drawGlyph(ctx, 'D', x + 5, SIZE - 14, '#f5b800');

      // Vertical edge highlight
      ctx.fillStyle = '#f5b800';
      ctx.fillRect(x, 4, 1, SIZE - 8);
      ctx.fillStyle = '#3a2800';
      ctx.fillRect(x + 13, 4, 1, SIZE - 8);
    }
  }

  // Tile '2' — "Course Poster": purple plaque with bordered cover art.
  function paintCoursePoster(ctx) {
    ctx.fillStyle = '#3c2850';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Outer gold frame (2px)
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(0, 0, SIZE, 2);
    ctx.fillRect(0, SIZE - 2, SIZE, 2);
    ctx.fillRect(0, 0, 2, SIZE);
    ctx.fillRect(SIZE - 2, 0, 2, SIZE);

    // Inner darker panel
    ctx.fillStyle = '#241834';
    ctx.fillRect(4, 4, SIZE - 8, SIZE - 8);

    // Big "D" centered top
    drawGlyph(ctx, 'D', 30, 8, '#f5b800');

    // Title bars (gold) — abstracted "DOMETRAIN" lettering
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(12, 20, 40, 2);
    ctx.fillRect(16, 25, 32, 1);

    // Mid divider
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(8, 30, SIZE - 16, 1);

    // "FROM ZERO TO HERO" pixel chunks
    ctx.fillStyle = '#f5b800';
    const banner = [4, 7, 5, 0, 4, 4, 0, 4, 5, 0, 4, 4, 5];
    let bx = 8;
    for (const w of banner) {
      if (w > 0) ctx.fillRect(bx, 36, w, 2);
      bx += w + 2;
    }

    // Bottom strip with gold/purple tab pattern
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(4, SIZE - 12, SIZE - 8, 6);
    ctx.fillStyle = '#3c2850';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(7 + i * 9, SIZE - 10, 5, 2);
    }
  }

  // Tile 'E' — "Diploma": cream parchment with gold seal, exit marker.
  function paintDiploma(ctx) {
    ctx.fillStyle = '#1a3a22';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Outer gold frame (3px)
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(0, 0, SIZE, 3);
    ctx.fillRect(0, SIZE - 3, SIZE, 3);
    ctx.fillRect(0, 0, 3, SIZE);
    ctx.fillRect(SIZE - 3, 0, 3, SIZE);

    // Cream parchment panel
    ctx.fillStyle = '#f0e0a0';
    ctx.fillRect(6, 6, SIZE - 12, SIZE - 12);

    // Inner gold trim
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(8, 8, SIZE - 16, 1);
    ctx.fillRect(8, SIZE - 9, SIZE - 16, 1);

    // Centered "D"
    drawGlyph(ctx, 'D', 30, 14, '#1a1f3a');

    // Faux text lines
    ctx.fillStyle = '#3c2850';
    ctx.fillRect(12, 24, SIZE - 24, 1);
    ctx.fillRect(16, 28, SIZE - 32, 1);
    ctx.fillRect(14, 32, SIZE - 28, 1);
    ctx.fillRect(18, 38, SIZE - 36, 1);

    // Gold seal at bottom
    ctx.fillStyle = '#f5b800';
    const cx = SIZE / 2, cy = SIZE - 14;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dy * dy <= 16) ctx.fillRect(cx + dx, cy + dy, 1, 1);
      }
    }
    drawGlyph(ctx, 'D', cx - 2, cy - 3, '#1a1f3a');

    // Ribbon tails below seal
    ctx.fillStyle = '#dc3232';
    ctx.fillRect(cx - 5, cy + 4, 2, 4);
    ctx.fillRect(cx + 3, cy + 4, 2, 4);
  }

  function buildTexture(type, painter) {
    const canvas = makeCanvas();
    const ctx = canvas.getContext('2d');
    painter(ctx);
    cache[type] = ctx.getImageData(0, 0, SIZE, SIZE).data;
  }

  // Tile 'D' — locked wooden door with gold trim and "D" plaque.
  function paintDoor(ctx) {
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Outer gold frame
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(0, 0, SIZE, 3);
    ctx.fillRect(0, SIZE - 3, SIZE, 3);
    ctx.fillRect(0, 0, 3, SIZE);
    ctx.fillRect(SIZE - 3, 0, 3, SIZE);

    // Vertical wood planks
    for (let i = 0; i < 4; i++) {
      const x = 6 + i * 14;
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(x, 4, 12, SIZE - 8);
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(x, 4, 1, SIZE - 8);
      ctx.fillStyle = '#5c3c20';
      ctx.fillRect(x + 11, 4, 1, SIZE - 8);
    }

    // "D" plaque top
    ctx.fillStyle = '#1a1f3a';
    ctx.fillRect(SIZE / 2 - 6, 8, 12, 10);
    drawGlyph(ctx, 'D', SIZE / 2 - 2, 10, '#f5b800');

    // Gold lock middle
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(SIZE / 2 - 5, SIZE / 2 - 5, 10, 10);
    ctx.fillStyle = '#1a1f3a';
    ctx.fillRect(SIZE / 2 - 1, SIZE / 2 - 2, 2, 5);
    ctx.fillRect(SIZE / 2 - 2, SIZE / 2 - 2, 4, 2);
  }

  function init() {
    buildTexture('1', paintCourseShelf);
    buildTexture('2', paintCoursePoster);
    buildTexture('E', paintDiploma);
    buildTexture('D', paintDoor);
  }

  function sample(type, u, v) {
    const data = cache[type];
    if (!data) return null;
    let tu = Math.floor(u * SIZE);
    let tv = Math.floor(v * SIZE);
    if (tu < 0) tu = 0; else if (tu >= SIZE) tu = SIZE - 1;
    if (tv < 0) tv = 0; else if (tv >= SIZE) tv = SIZE - 1;
    const i = (tv * SIZE + tu) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  }

  return { init, sample, SIZE };
})();
