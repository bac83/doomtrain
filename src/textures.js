// =====================================================
// Textures — procedural wall textures (Dometrain themed)
// =====================================================
//
// 128×128 tiles, painted once at boot, cached as flat RGBA arrays.
// Theme: navy + gold + purple + green + cream. Mock Dometrain
// course covers, real bitmap text ("DOMETRAIN", "DIPLOMA",
// "FROM ZERO TO HERO"), shelves of "course" books.

const Textures = (() => {
  const SIZE = 128;
  const cache = {};

  function makeCanvas() {
    const c = document.createElement('canvas');
    c.width = SIZE;
    c.height = SIZE;
    return c;
  }

  // 5×7 uppercase pixel font. Enough for Dometrain branding + course codes.
  const FONT = {
    A: ['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
    B: ['####.','#...#','#...#','####.','#...#','#...#','####.'],
    C: ['.####','#....','#....','#....','#....','#....','.####'],
    D: ['####.','#...#','#...#','#...#','#...#','#...#','####.'],
    E: ['#####','#....','#....','####.','#....','#....','#####'],
    F: ['#####','#....','#....','####.','#....','#....','#....'],
    G: ['.####','#....','#....','#..##','#...#','#...#','.####'],
    H: ['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
    I: ['#####','..#..','..#..','..#..','..#..','..#..','#####'],
    J: ['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
    K: ['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
    L: ['#....','#....','#....','#....','#....','#....','#####'],
    M: ['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
    N: ['#...#','##..#','#.#.#','#.#.#','#..##','#...#','#...#'],
    O: ['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
    P: ['####.','#...#','#...#','####.','#....','#....','#....'],
    Q: ['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
    R: ['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
    S: ['.####','#....','#....','.###.','....#','....#','####.'],
    T: ['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
    U: ['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
    V: ['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
    W: ['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
    X: ['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
    Y: ['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
    Z: ['#####','....#','...#.','..#..','.#...','#....','#####'],
    '0': ['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
    '1': ['..#..','.##..','..#..','..#..','..#..','..#..','.###.'],
    '2': ['.###.','#...#','....#','...#.','..#..','.#...','#####'],
    '3': ['####.','....#','....#','.###.','....#','....#','####.'],
    '4': ['#...#','#...#','#...#','#####','....#','....#','....#'],
    '5': ['#####','#....','#....','####.','....#','....#','####.'],
    '6': ['.###.','#....','#....','####.','#...#','#...#','.###.'],
    '7': ['#####','....#','...#.','..#..','.#...','.#...','.#...'],
    '8': ['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
    '9': ['.###.','#...#','#...#','.####','....#','....#','.###.'],
    '#': ['.#.#.','.#.#.','#####','.#.%.','#####','.#.#.','.#.#.'],
    '-': ['.....','.....','.....','#####','.....','.....','.....'],
    '.': ['.....','.....','.....','.....','.....','.....','..#..'],
    ' ': ['.....','.....','.....','.....','.....','.....','.....'],
  };

  function drawText(ctx, text, x, y, color, scale = 1) {
    ctx.fillStyle = color;
    let cx = x;
    for (const ch of text) {
      const g = FONT[ch] || FONT[' '];
      for (let r = 0; r < g.length; r++) {
        const row = g[r];
        for (let c = 0; c < row.length; c++) {
          if (row[c] === '#') ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
        }
      }
      cx += (g[0].length + 1) * scale;
    }
  }

  function textWidth(text, scale = 1) {
    let w = 0;
    for (const ch of text) {
      const g = FONT[ch] || FONT[' '];
      w += (g[0].length + 1) * scale;
    }
    return w - scale;
  }

  // Tile '1' — "Course Shelf": 4 fat book spines with course codes + tagline.
  function paintCourseShelf(ctx) {
    // Background (deep navy)
    ctx.fillStyle = '#0f1428';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Top + bottom shelf boards (gold trim)
    ctx.fillStyle = '#3a2800';
    ctx.fillRect(0, 0, SIZE, 6);
    ctx.fillRect(0, SIZE - 6, SIZE, 6);
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(0, 5, SIZE, 2);
    ctx.fillRect(0, SIZE - 7, SIZE, 2);

    // 4 book spines, 30w each, 2px gap, 110h
    const codes = ['C#', 'EF', 'DI', 'API'];
    const spineColors = [
      ['#1e3258', '#2a4880', '#0a1428'],   // navy
      ['#3c2850', '#5c3c80', '#1a1230'],   // purple
      ['#6a4a00', '#a07a00', '#3a2800'],   // dark gold
      ['#1a3a1a', '#2c5c2c', '#0a1a0a'],   // green
    ];
    for (let i = 0; i < 4; i++) {
      const x = i * 32 + 1;
      const w = 30;
      const top = 8, bot = SIZE - 8;
      const [mid, light, dark] = spineColors[i];

      // Spine body
      ctx.fillStyle = mid;
      ctx.fillRect(x, top, w, bot - top);
      // Highlight + shadow edges
      ctx.fillStyle = light;
      ctx.fillRect(x, top, 2, bot - top);
      ctx.fillStyle = dark;
      ctx.fillRect(x + w - 2, top, 2, bot - top);

      // Top + bottom gold rails
      ctx.fillStyle = '#f5b800';
      ctx.fillRect(x + 2, top + 4, w - 4, 3);
      ctx.fillRect(x + 2, bot - 7, w - 4, 3);

      // Title plaque (dark band w/ course code)
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(x + 2, top + 14, w - 4, 16);
      ctx.fillStyle = '#f5b800';
      ctx.fillRect(x + 2, top + 14, w - 4, 1);
      ctx.fillRect(x + 2, top + 29, w - 4, 1);

      // Course code centered
      const code = codes[i];
      const tw = textWidth(code, 2);
      drawText(ctx, code, x + (w - tw) / 2, top + 17, '#f5b800', 2);

      // Mid ornament: small "D" emblem
      ctx.fillStyle = '#3a2800';
      ctx.fillRect(x + 2, top + 50, w - 4, 18);
      drawText(ctx, 'D', x + (w - 5) / 2, top + 56, '#f5b800', 1);

      // Lower band
      ctx.fillStyle = '#f5b800';
      ctx.fillRect(x + 2, bot - 22, w - 4, 2);
      ctx.fillRect(x + 2, bot - 18, w - 4, 1);

      // Tiny year mark
      drawText(ctx, '101', x + 4, bot - 14, '#f5b800', 1);
    }
  }

  // Tile '2' — "Course Poster": full Dometrain promo with logo + tagline.
  function paintCoursePoster(ctx) {
    // Purple backdrop
    ctx.fillStyle = '#3c2850';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Gold outer frame (3px)
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(0, 0, SIZE, 3);
    ctx.fillRect(0, SIZE - 3, SIZE, 3);
    ctx.fillRect(0, 0, 3, SIZE);
    ctx.fillRect(SIZE - 3, 0, 3, SIZE);

    // Inner darker panel
    ctx.fillStyle = '#241834';
    ctx.fillRect(5, 5, SIZE - 10, SIZE - 10);

    // Top header bar (gold)
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(5, 5, SIZE - 10, 14);
    drawText(ctx, 'DOMETRAIN', 12, 8, '#1a1f3a', 2);

    // Big course title
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(8, 26, SIZE - 16, 1);
    drawText(ctx, 'FROM ZERO',  10, 32, '#f5b800', 2);
    drawText(ctx, 'TO HERO',    20, 50, '#ffd84a', 2);
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(8, 70, SIZE - 16, 1);

    // Cover art block: dark with stylized "play" triangle
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(8, 74, SIZE - 16, 32);
    ctx.fillStyle = '#f5b800';
    // Play triangle
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(SIZE / 2 - 6, 80 + i, 12 - i, 1);
    }
    // Subtle scanlines
    ctx.fillStyle = 'rgba(245,184,0,0.15)';
    for (let y = 76; y < 105; y += 2) ctx.fillRect(8, y, SIZE - 16, 1);

    // Footer: "BY NICK CHAPSAS"
    drawText(ctx, 'BY NICK CHAPSAS', 12, 110, '#f5b800', 1);
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(8, 120, SIZE - 16, 1);
  }

  // Tile 'E' — "Diploma": parchment, gold seal, "DIPLOMA" / "DOMETRAIN".
  function paintDiploma(ctx) {
    // Green wall behind
    ctx.fillStyle = '#1a3a22';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Outer gold frame (4px)
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(0, 0, SIZE, 4);
    ctx.fillRect(0, SIZE - 4, SIZE, 4);
    ctx.fillRect(0, 0, 4, SIZE);
    ctx.fillRect(SIZE - 4, 0, 4, SIZE);
    // Corner ornaments
    ctx.fillStyle = '#ffd84a';
    for (const [cx, cy] of [[6,6],[SIZE-12,6],[6,SIZE-12],[SIZE-12,SIZE-12]]) {
      ctx.fillRect(cx, cy, 6, 6);
      ctx.fillRect(cx + 1, cy + 1, 4, 4);
    }

    // Cream parchment
    ctx.fillStyle = '#f0e0a8';
    ctx.fillRect(8, 8, SIZE - 16, SIZE - 16);
    // Inner gold trim line
    ctx.fillStyle = '#c89800';
    ctx.fillRect(11, 11, SIZE - 22, 1);
    ctx.fillRect(11, SIZE - 12, SIZE - 22, 1);
    ctx.fillRect(11, 11, 1, SIZE - 22);
    ctx.fillRect(SIZE - 12, 11, 1, SIZE - 22);

    // "DIPLOMA" header
    const dipW = textWidth('DIPLOMA', 2);
    drawText(ctx, 'DIPLOMA', (SIZE - dipW) / 2, 16, '#1a1f3a', 2);

    // "DOMETRAIN" subtitle
    const domW = textWidth('DOMETRAIN', 1);
    drawText(ctx, 'DOMETRAIN', (SIZE - domW) / 2, 30, '#3c2850', 1);
    drawText(ctx, 'ACADEMY',   (SIZE - textWidth('ACADEMY', 1)) / 2, 40, '#3c2850', 1);

    // Faux signature lines
    ctx.fillStyle = '#3c2850';
    ctx.fillRect(20, 52, SIZE - 40, 1);
    ctx.fillRect(28, 58, SIZE - 56, 1);
    ctx.fillRect(24, 64, SIZE - 48, 1);

    // Gold seal
    const sx = SIZE / 2, sy = 92;
    ctx.fillStyle = '#c89800';
    for (let dy = -10; dy <= 10; dy++) {
      for (let dx = -10; dx <= 10; dx++) {
        if (dx*dx + dy*dy <= 100) ctx.fillRect(sx + dx, sy + dy, 1, 1);
      }
    }
    ctx.fillStyle = '#f5b800';
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        if (dx*dx + dy*dy <= 64) ctx.fillRect(sx + dx, sy + dy, 1, 1);
      }
    }
    drawText(ctx, 'D', sx - 2, sy - 3, '#1a1f3a', 1);

    // Ribbon tails
    ctx.fillStyle = '#dc3232';
    ctx.fillRect(sx - 7, sy + 9, 3, 12);
    ctx.fillRect(sx + 4, sy + 9, 3, 12);
    ctx.fillStyle = '#a02020';
    ctx.fillRect(sx - 7, sy + 9, 1, 12);
    ctx.fillRect(sx + 6, sy + 9, 1, 12);

    // Year stamp bottom
    drawText(ctx, '2026', (SIZE - textWidth('2026', 1)) / 2, SIZE - 16, '#3c2850', 1);
  }

  // Tile 'D' — locked door: wood planks, gold trim, "ACCESS" plate.
  function paintDoor(ctx) {
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Outer gold frame
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(0, 0, SIZE, 4);
    ctx.fillRect(0, SIZE - 4, SIZE, 4);
    ctx.fillRect(0, 0, 4, SIZE);
    ctx.fillRect(SIZE - 4, 0, 4, SIZE);

    // Vertical wood planks
    for (let i = 0; i < 4; i++) {
      const x = 8 + i * 28;
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(x, 6, 26, SIZE - 12);
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(x, 6, 1, SIZE - 12);
      ctx.fillStyle = '#5c3c20';
      ctx.fillRect(x + 25, 6, 1, SIZE - 12);
      // Wood grain (a few darker streaks)
      ctx.fillStyle = '#3a2412';
      ctx.fillRect(x + 6, 14, 1, SIZE - 28);
      ctx.fillRect(x + 16, 22, 1, SIZE - 44);
    }

    // Top plaque "ACCESS"
    ctx.fillStyle = '#1a1f3a';
    ctx.fillRect(SIZE/2 - 28, 14, 56, 16);
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(SIZE/2 - 28, 14, 56, 1);
    ctx.fillRect(SIZE/2 - 28, 29, 56, 1);
    drawText(ctx, 'ACCESS', SIZE/2 - textWidth('ACCESS', 1)/2, 19, '#f5b800', 1);

    // Big gold lock middle
    const lx = SIZE / 2, ly = SIZE / 2 + 4;
    ctx.fillStyle = '#3a2800';
    ctx.fillRect(lx - 14, ly - 14, 28, 28);
    ctx.fillStyle = '#f5b800';
    ctx.fillRect(lx - 12, ly - 12, 24, 24);
    ctx.fillStyle = '#ffd84a';
    ctx.fillRect(lx - 12, ly - 12, 24, 2);
    ctx.fillRect(lx - 12, ly - 12, 2, 24);
    // Keyhole
    ctx.fillStyle = '#1a1f3a';
    ctx.fillRect(lx - 2, ly - 4, 4, 4);
    ctx.fillRect(lx - 1, ly,    2, 6);

    // "DOMETRAIN" tag below lock
    drawText(ctx, 'DOMETRAIN', SIZE/2 - textWidth('DOMETRAIN', 1)/2, SIZE - 18, '#f5b800', 1);
  }

  function buildTexture(type, painter) {
    const canvas = makeCanvas();
    const ctx = canvas.getContext('2d');
    painter(ctx);
    cache[type] = ctx.getImageData(0, 0, SIZE, SIZE).data;
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
