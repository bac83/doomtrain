// =====================================================
// Sprites — procedural pixel-art for in-world entities
// =====================================================
//
// Each function takes normalized UV coords (0..1) and returns [r,g,b,a]
// or null/undefined for transparent. These get sampled by the renderer
// at sprite scale.
//
// To add a new entity sprite:
//   1. Add a new {type}Pixel function here.
//   2. Wire it into spritePixel() below.
//   3. Spawn entities of that type in entities.js.

function spritePixel(ent, u, v) {
  switch (ent.type) {
    case 'bug':    return bugPixel(u, v, ent);
    case 'coffee': return coffeePixel(u, v);
    case 'nick':   return nickPixel(u, v);
    default:       return null;
  }
}

// ---------------------------------------------
// Bug demon — purple head, green body, four legs
// ---------------------------------------------
function bugPixel(u, v, ent) {
  const flash = ent.hitFlash > 0;

  // Body ellipse (centered)
  const dx = (u - 0.5) * 2;
  const dy = (v - 0.55) * 2;
  const bodyR = dx * dx * 1.2 + dy * dy * 1.5;

  // Head circle (top)
  const hdx = (u - 0.5) * 2;
  const hdy = (v - 0.25) * 4;
  const headR = hdx * hdx + hdy * hdy;

  // Eyes (yellow with black pupils)
  const e1dx = (u - 0.4) * 12, e1dy = (v - 0.22) * 12;
  const e2dx = (u - 0.6) * 12, e2dy = (v - 0.22) * 12;
  const inEye1 = e1dx * e1dx + e1dy * e1dy < 1;
  const inEye2 = e2dx * e2dx + e2dy * e2dy < 1;

  const p1dx = (u - 0.42) * 24, p1dy = (v - 0.24) * 24;
  const p2dx = (u - 0.58) * 24, p2dy = (v - 0.24) * 24;
  const inPup1 = p1dx * p1dx + p1dy * p1dy < 1;
  const inPup2 = p2dx * p2dx + p2dy * p2dy < 1;

  // Legs
  const legY = v > 0.7 && v < 0.95;
  const legX = (u < 0.15 || u > 0.85) ||
               (u > 0.05 && u < 0.18) ||
               (u > 0.82 && u < 0.95);

  // Mouth
  const mouth = v > 0.32 && v < 0.38 && u > 0.4 && u < 0.6;

  if (inPup1 || inPup2) return [10, 10, 10, 255];
  if (inEye1 || inEye2) return [255, 230, 100, 255];
  if (mouth) return [80, 0, 0, 255];
  if (headR < 1) return flash ? [255, 255, 255, 255] : [120, 50, 140, 255];
  if (bodyR < 1) return flash ? [255, 255, 255, 255] : [80, 180, 80, 255];
  if (legY && legX && Math.abs(dx) < 1.4) {
    return flash ? [255, 255, 255, 255] : [60, 130, 60, 255];
  }
  return [0, 0, 0, 0];
}

// ---------------------------------------------
// Coffee cup — white cup with gold "D" + steam
// ---------------------------------------------
function coffeePixel(u, v) {
  const cupTop = 0.3, cupBottom = 0.85;
  const inCupY = v > cupTop && v < cupBottom;
  const cupLeft = 0.3 + (v - cupTop) * 0.05;
  const cupRight = 0.7 - (v - cupTop) * 0.05;
  const inCupX = u > cupLeft && u < cupRight;
  const inCup = inCupY && inCupX;

  // Handle (oval on right)
  const hdx = (u - 0.78) * 8, hdy = (v - 0.55) * 6;
  const handleOuter = hdx * hdx + hdy * hdy < 1;
  const handleInner = hdx * hdx + hdy * hdy < 0.3;
  const inHandle = handleOuter && !handleInner && u > 0.7;

  // Coffee surface
  const inCoffee = v > cupTop && v < cupTop + 0.06 && inCupX;

  // Steam (animated wave)
  const steamX = u - 0.5;
  const steamWave = Math.sin(v * 30 + performance.now() * 0.005) * 0.04;
  const inSteam = v < cupTop && v > 0.05 && Math.abs(steamX - steamWave) < 0.04;

  // Dometrain "D" logo on cup
  const logoY = v > 0.5 && v < 0.7;
  const logoX = u > 0.4 && u < 0.6;
  const inLogo = logoY && logoX &&
                 ((u > 0.4 && u < 0.45) || (Math.abs(v - 0.6) > 0.08 && u < 0.55));

  if (inSteam) return [200, 200, 200, 200];
  if (inCoffee) return [60, 30, 10, 255];
  if (inLogo) return [245, 184, 0, 255];
  if (inCup) return [240, 240, 240, 255];
  if (inHandle) return [240, 240, 240, 255];

  return [0, 0, 0, 0];
}

// ---------------------------------------------
// Nick Chapsas — pixel character at exit, with halo
// ---------------------------------------------
function nickPixel(u, v) {
  // Body
  const inBody = v > 0.45 && v < 0.95 && u > 0.3 && u < 0.7;

  // Head circle
  const hdx = (u - 0.5) * 4;
  const hdy = (v - 0.28) * 6;
  const headR = hdx * hdx + hdy * hdy;
  const inHead = headR < 1;

  // Hair
  const inHair = inHead && v < 0.22;

  // Beard
  const beardY = v > 0.32 && v < 0.4;
  const inBeard = inHead && beardY && (u < 0.42 || u > 0.58 || v > 0.36);

  // Eyes
  const e1dx = (u - 0.43) * 30, e1dy = (v - 0.27) * 30;
  const e2dx = (u - 0.57) * 30, e2dy = (v - 0.27) * 30;
  const inEye1 = e1dx * e1dx + e1dy * e1dy < 1;
  const inEye2 = e2dx * e2dx + e2dy * e2dy < 1;

  // Smile
  const inSmile = v > 0.34 && v < 0.37 && u > 0.44 && u < 0.56;

  // Logo on shirt
  const inLogo = v > 0.6 && v < 0.78 && u > 0.42 && u < 0.58;

  // Gold halo / aura
  const dx = (u - 0.5) * 2.2;
  const dy = (v - 0.55) * 1.4;
  const auraR = dx * dx + dy * dy;
  const inAura = auraR < 1.05 && auraR > 0.95;

  if (inAura) return [245, 184, 0, 200];
  if (inEye1 || inEye2) return [10, 10, 30, 255];
  if (inSmile) return [40, 20, 20, 255];
  if (inBeard) return [60, 40, 30, 255];
  if (inHair) return [50, 35, 25, 255];
  if (inLogo) return [245, 184, 0, 255];
  if (inHead) return [220, 180, 150, 255];
  if (inBody) return [30, 50, 90, 255];

  return [0, 0, 0, 0];
}
