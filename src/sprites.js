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
    case 'bug':           return bugPixel(u, v, ent);
    case 'coffee':        return coffeePixel(u, v);
    case 'ammo':          return ammoPixel(u, v);
    case 'nick':          return nickPixel(u, v);
    case 'mergeconflict': return mergeConflictPixel(u, v, ent);
    case 'key':           return keyPixel(u, v);
    case 'projectile':    return projectilePixel(u, v);
    case 'boss':          return bossPixel(u, v, ent);
    default:              return null;
  }
}

// ---------------------------------------------
// Bug demon — segmented purple/green critter:
// antennae, head w/ mandibles, thorax, abdomen, six legs, drop shadow
// ---------------------------------------------
function bugPixel(u, v, ent) {
  const flash = ent.hitFlash > 0;
  const FL = [255, 255, 255, 255];

  // Drop shadow at feet
  const sdx = (u - 0.5) * 2.4;
  const sdy = (v - 0.95) * 18;
  const inShadow = sdx*sdx + sdy*sdy < 1;

  // Antennae — two arcs above head, segmented
  const antT = (u - 0.5);
  const antLY = 0.18 - Math.abs(antT + 0.10) * 1.4;
  const antRY = 0.18 - Math.abs(antT - 0.10) * 1.4;
  const inAntL = u > 0.30 && u < 0.48 && Math.abs(v - antLY) < 0.012;
  const inAntR = u > 0.52 && u < 0.70 && Math.abs(v - antRY) < 0.012;
  const antTipL = (u-0.30)*(u-0.30)*180 + (v-0.04)*(v-0.04)*180 < 1;
  const antTipR = (u-0.70)*(u-0.70)*180 + (v-0.04)*(v-0.04)*180 < 1;

  // Head ellipse (top, smaller)
  const hdx = (u - 0.5) * 2.6;
  const hdy = (v - 0.28) * 5.0;
  const headR = hdx*hdx + hdy*hdy;
  const inHead = headR < 1;

  // Thorax (middle segment)
  const tdx = (u - 0.5) * 2.4;
  const tdy = (v - 0.50) * 5.5;
  const inThorax = tdx*tdx + tdy*tdy < 1;

  // Abdomen (lower, bigger)
  const adx = (u - 0.5) * 2.0;
  const ady = (v - 0.72) * 3.6;
  const abdR = adx*adx + ady*ady;
  const inAbdomen = abdR < 1;

  // Belly highlight stripe down abdomen center
  const inBelly = inAbdomen && Math.abs(u - 0.5) < 0.06 && v > 0.60 && v < 0.85;
  // Abdomen segment lines
  const segLine = inAbdomen && (
    Math.abs(v - 0.66) < 0.012 ||
    Math.abs(v - 0.76) < 0.012 ||
    Math.abs(v - 0.84) < 0.012
  );

  // Eyes — yellow w/ black pupil + white specular
  const e1dx = (u - 0.40) * 14, e1dy = (v - 0.26) * 14;
  const e2dx = (u - 0.60) * 14, e2dy = (v - 0.26) * 14;
  const inEye1 = e1dx*e1dx + e1dy*e1dy < 1;
  const inEye2 = e2dx*e2dx + e2dy*e2dy < 1;
  const p1dx = (u - 0.41) * 28, p1dy = (v - 0.27) * 28;
  const p2dx = (u - 0.59) * 28, p2dy = (v - 0.27) * 28;
  const inPup1 = p1dx*p1dx + p1dy*p1dy < 1;
  const inPup2 = p2dx*p2dx + p2dy*p2dy < 1;
  const sp1 = (u - 0.385) * 90, spv1 = (v - 0.245) * 90;
  const sp2 = (u - 0.585) * 90, spv2 = (v - 0.245) * 90;
  const inSpec1 = sp1*sp1 + spv1*spv1 < 1;
  const inSpec2 = sp2*sp2 + spv2*spv2 < 1;

  // Mandibles — two black fangs below head
  const mandL = v > 0.36 && v < 0.42 &&
                u > (0.42 + (v - 0.36) * 0.4) && u < (0.46 + (v - 0.36) * 0.4);
  const mandR = v > 0.36 && v < 0.42 &&
                u > (0.54 - (v - 0.36) * 0.4) && u < (0.58 - (v - 0.36) * 0.4);

  // Six legs — 3 pairs at thorax, angling outward
  function leg(cy, slope, side) {
    const baseU = side < 0 ? 0.30 : 0.70;
    const t = (v - cy) / 0.18;
    if (t < 0 || t > 1) return false;
    const x = baseU + side * t * slope;
    return Math.abs(u - x) < 0.018;
  }
  const inLegs =
    leg(0.45, 0.18, -1) || leg(0.45, 0.18, +1) ||
    leg(0.52, 0.22, -1) || leg(0.52, 0.22, +1) ||
    leg(0.59, 0.18, -1) || leg(0.59, 0.18, +1);

  // Right-side body shading mask
  const shaded = u > 0.55;

  if (inAntL || inAntR || antTipL || antTipR) return flash ? FL : [40, 20, 50, 255];
  if (inSpec1 || inSpec2) return [255, 255, 255, 255];
  if (inPup1 || inPup2) return [10, 10, 10, 255];
  if (inEye1 || inEye2) return [255, 230, 100, 255];
  if (mandL || mandR) return [20, 10, 10, 255];
  if (inHead) {
    if (flash) return FL;
    return shaded ? [85, 35, 100, 255] : [120, 50, 140, 255];
  }
  if (segLine && !inBelly) return flash ? FL : [40, 90, 40, 255];
  if (inBelly) return flash ? FL : [140, 220, 140, 255];
  if (inThorax) {
    if (flash) return FL;
    return shaded ? [55, 130, 55, 255] : [80, 180, 80, 255];
  }
  if (inAbdomen) {
    if (flash) return FL;
    return shaded ? [55, 130, 55, 255] : [80, 180, 80, 255];
  }
  if (inLegs) return flash ? FL : [50, 110, 50, 255];
  if (inShadow) return [0, 0, 0, 110];
  return [0, 0, 0, 0];
}

// ---------------------------------------------
// Coffee cup — Dometrain mug: navy body, gold band, gold "D" + steam
// ---------------------------------------------
function coffeePixel(u, v, t) {
  if (t === undefined) t = performance.now() * 0.004;
  const cupTop = 0.3, cupBottom = 0.88;
  const inCupY = v > cupTop && v < cupBottom;
  const cupLeft = 0.28 + (v - cupTop) * 0.04;
  const cupRight = 0.72 - (v - cupTop) * 0.04;
  const inCupX = u > cupLeft && u < cupRight;
  const inCup = inCupY && inCupX;

  // Highlight stripe (left edge of cup)
  const inHighlight = inCup && u < cupLeft + 0.04;
  // Shadow stripe (right edge)
  const inShadow = inCup && u > cupRight - 0.04;

  // Handle (oval on right)
  const hdx = (u - 0.82) * 8, hdy = (v - 0.55) * 5;
  const handleOuter = hdx * hdx + hdy * hdy < 1;
  const handleInner = hdx * hdx + hdy * hdy < 0.35;
  const inHandle = handleOuter && !handleInner && u > 0.72;

  // Saucer at bottom
  const saucerY = v > cupBottom && v < cupBottom + 0.04;
  const inSaucer = saucerY && u > 0.18 && u < 0.82;

  // Coffee surface (dark crema)
  const inCoffee = v > cupTop - 0.005 && v < cupTop + 0.05 && inCupX;
  const inFoam   = v > cupTop && v < cupTop + 0.015 && inCupX;

  // Top + bottom gold bands
  const inGoldBandTop = inCup && v > cupTop + 0.05 && v < cupTop + 0.08;
  const inGoldBandBot = inCup && v > cupBottom - 0.06 && v < cupBottom - 0.03;

  // Steam (animated wave) — `t` is passed in (or live default) so cache can pre-bake frames.
  const steamX1 = 0.5 + Math.sin(v * 22 + t) * 0.05;
  const steamX2 = 0.42 + Math.sin(v * 18 + t * 1.3 + 1) * 0.04;
  const steamX3 = 0.58 + Math.sin(v * 18 + t * 0.9 + 2) * 0.04;
  const inSteam = v < cupTop && v > 0.05 && (
    Math.abs(u - steamX1) < 0.03 ||
    Math.abs(u - steamX2) < 0.025 ||
    Math.abs(u - steamX3) < 0.025
  );

  // "D" logo glyph on cup, centered. 5×7 D pattern, scaled.
  // Map cup-mid block u∈[0.36,0.64], v∈[0.50,0.74] to 5×7 cells
  const inLogoArea = u > 0.36 && u < 0.64 && v > 0.50 && v < 0.74;
  let inLogo = false;
  if (inLogoArea) {
    const gx = Math.floor((u - 0.36) / 0.28 * 5);
    const gy = Math.floor((v - 0.50) / 0.24 * 7);
    const D_GLYPH = [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
    ];
    if (gy >= 0 && gy < 7 && gx >= 0 && gx < 5) inLogo = D_GLYPH[gy][gx] === 1;
  }

  if (inSteam) return [220, 220, 230, 200];
  if (inFoam) return [200, 160, 110, 255];
  if (inCoffee) return [60, 30, 10, 255];
  if (inLogo) return [245, 184, 0, 255];
  if (inGoldBandTop || inGoldBandBot) return [245, 184, 0, 255];
  if (inSaucer) return [20, 28, 50, 255];
  if (inHighlight) return [60, 80, 130, 255];
  if (inShadow) return [10, 14, 26, 255];
  if (inHandle) return [30, 50, 90, 255];
  if (inCup) return [26, 31, 58, 255];

  return [0, 0, 0, 0];
}

// ---------------------------------------------
// Ammo crate — Dometrain-styled: navy box, gold bands, gold "D" logo,
// brass bullet tips peeking from top.
// ---------------------------------------------
function ammoPixel(u, v) {
  const boxTop = 0.30, boxBottom = 0.88;
  const boxLeft = 0.18, boxRight = 0.82;
  const inBoxY = v > boxTop && v < boxBottom;
  const inBoxX = u > boxLeft && u < boxRight;
  const inBox = inBoxY && inBoxX;

  // Edge highlight + shadow (matches coffee mug treatment)
  const inHighlight = inBox && u < boxLeft + 0.04;
  const inShadow    = inBox && u > boxRight - 0.04;

  // Top + bottom gold bands
  const inGoldTop = inBox && v > boxTop + 0.03 && v < boxTop + 0.07;
  const inGoldBot = inBox && v > boxBottom - 0.07 && v < boxBottom - 0.03;

  // Bullet tips poking up — 3 bullets above box
  // Each bullet: brass tip (gold) over a navy casing band.
  const bulletY = v > 0.18 && v < boxTop;
  const bulletCenters = [0.32, 0.50, 0.68];
  let inBulletTip = false, inBulletCase = false;
  for (const cx of bulletCenters) {
    const bdx = (u - cx) * 18;
    // tip ellipse (top half of bullet)
    const tdy = (v - 0.22) * 10;
    if (bdx*bdx + tdy*tdy < 1 && v < 0.26) inBulletTip = true;
    // casing rectangle below tip
    if (bulletY && v > 0.24 && Math.abs(u - cx) < 0.05) inBulletCase = true;
  }

  // Centered "D" glyph on box face
  const inLogoArea = u > 0.36 && u < 0.64 && v > 0.46 && v < 0.74;
  let inLogo = false;
  if (inLogoArea) {
    const gx = Math.floor((u - 0.36) / 0.28 * 5);
    const gy = Math.floor((v - 0.46) / 0.28 * 7);
    const D_GLYPH = [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
    ];
    if (gy >= 0 && gy < 7 && gx >= 0 && gx < 5) inLogo = D_GLYPH[gy][gx] === 1;
  }

  if (inBulletTip) return [245, 184, 0, 255];
  if (inBulletCase) return [60, 50, 20, 255];
  if (inLogo) return [245, 184, 0, 255];
  if (inGoldTop || inGoldBot) return [245, 184, 0, 255];
  if (inHighlight) return [60, 80, 130, 255];
  if (inShadow) return [10, 14, 26, 255];
  if (inBox) return [26, 31, 58, 255];

  return [0, 0, 0, 0];
}

// ---------------------------------------------
// Nick Chapsas — quiffed dark hair + mustache, navy T-shirt, gold halo.
// (Real Nick: hair on top, no glasses, mustache only — no full beard.)
// ---------------------------------------------
function nickPixel(u, v) {
  // Gold halo (ring + soft inner glow)
  const adx = (u - 0.5) * 2.0;
  const ady = (v - 0.55) * 1.3;
  const auraR = adx * adx + ady * ady;
  const inAuraRing = auraR < 1.02 && auraR > 0.92;
  const inAuraSoft = auraR < 0.92 && auraR > 0.82;

  // Body / shoulders
  const inShoulders = v > 0.46 && v < 0.55 && u > 0.22 && u < 0.78;
  const inBody = v >= 0.55 && v < 0.95 && u > 0.27 && u < 0.73;

  // Neck
  const inNeck = v > 0.42 && v < 0.48 && u > 0.45 && u < 0.55;

  // Head ellipse
  const hdx = (u - 0.5) * 3.6;
  const hdy = (v - 0.27) * 5.4;
  const headR = hdx * hdx + hdy * hdy;
  const inHead = headR < 1;

  // Ears
  const lE = (u - 0.27) * (u - 0.27) * 80 + (v - 0.28) * (v - 0.28) * 80 < 1;
  const rE = (u - 0.73) * (u - 0.73) * 80 + (v - 0.28) * (v - 0.28) * 80 < 1;
  const inEar = (lE || rE) && v > 0.22 && v < 0.34;

  // HAIR — short, quiffed (taller in front, swept up).
  // Head top is roughly v < 0.22 inside the head ellipse. Add a quiff bump
  // above the head between u ∈ [0.40, 0.60].
  const inHairCap = inHead && v < 0.22;
  // Quiff bump: a small dome above the head between u ∈ [0.42, 0.60]
  const qdx = (u - 0.50) * 6.5;
  const qdy = (v - 0.16) * 9;
  const inQuiff = qdx*qdx + qdy*qdy < 1 && v < 0.22;
  const inHair = inHairCap || inQuiff;

  // Eyebrows (thin)
  const inBrowL = v > 0.225 && v < 0.235 && u > 0.38 && u < 0.46;
  const inBrowR = v > 0.225 && v < 0.235 && u > 0.54 && u < 0.62;

  // Eyes (whites + pupils)
  const e1dx = (u - 0.41) * 28, e1dy = (v - 0.255) * 28;
  const e2dx = (u - 0.59) * 28, e2dy = (v - 0.255) * 28;
  const inEyeW1 = e1dx*e1dx + e1dy*e1dy < 1;
  const inEyeW2 = e2dx*e2dx + e2dy*e2dy < 1;
  const p1dx = (u - 0.41) * 56, p1dy = (v - 0.255) * 56;
  const p2dx = (u - 0.59) * 56, p2dy = (v - 0.255) * 56;
  const inPup1 = p1dx*p1dx + p1dy*p1dy < 1;
  const inPup2 = p2dx*p2dx + p2dy*p2dy < 1;

  // Nose
  const inNose = v > 0.28 && v < 0.33 && u > 0.485 && u < 0.515;
  const inNostril = v > 0.31 && v < 0.32 && (Math.abs(u - 0.485) < 0.005 || Math.abs(u - 0.515) < 0.005);

  // MUSTACHE — thin band under nose, slight downturn at edges
  const stacheY = v > 0.335 && v < 0.355;
  const inStacheBand = stacheY && u > 0.40 && u < 0.60;
  // Drooping wings
  const inStacheWingL = v > 0.345 && v < 0.365 && u > 0.39 && u < 0.42;
  const inStacheWingR = v > 0.345 && v < 0.365 && u > 0.58 && u < 0.61;
  const inStache = inStacheBand || inStacheWingL || inStacheWingR;

  // Smile (under mustache)
  const inSmile = v > 0.37 && v < 0.385 && u > 0.43 && u < 0.57;
  const inSmileEnds = (v > 0.36 && v < 0.37) && ((u > 0.42 && u < 0.44) || (u > 0.56 && u < 0.58));

  // Cheek shading
  const inCheekShade = inHead && v > 0.27 && v < 0.36 && (u < 0.35 || u > 0.65);

  // Shirt logo: big "D" centered chest
  const logoArea = u > 0.40 && u < 0.60 && v > 0.62 && v < 0.78;
  let inLogo = false;
  if (logoArea) {
    const gx = Math.floor((u - 0.40) / 0.20 * 5);
    const gy = Math.floor((v - 0.62) / 0.16 * 7);
    const D_GLYPH = [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
    ];
    if (gy >= 0 && gy < 7 && gx >= 0 && gx < 5) inLogo = D_GLYPH[gy][gx] === 1;
  }

  // Shirt: dark navy/black tee, crew neckline
  const inCrew = v > 0.46 && v < 0.50 && u > 0.42 && u < 0.58;

  // Arms
  const inArmL = v > 0.55 && v < 0.85 && u > 0.20 && u < 0.30;
  const inArmR = v > 0.55 && v < 0.85 && u > 0.70 && u < 0.80;

  if (inAuraRing) return [255, 220, 100, 255];
  if (inAuraSoft && !inHead && !inBody && !inShoulders && !inEar && !inArmL && !inArmR && !inHair) return [245, 184, 0, 90];
  if (inPup1 || inPup2) return [10, 10, 20, 255];
  if (inEyeW1 || inEyeW2) return [255, 255, 255, 255];
  if (inBrowL || inBrowR) return [30, 20, 12, 255];
  if (inStache) return [40, 28, 18, 255];
  if (inNostril) return [120, 80, 60, 255];
  if (inNose) return [200, 155, 125, 255];
  if (inSmile || inSmileEnds) return [60, 30, 25, 255];
  if (inHair) return [35, 22, 14, 255];
  if (inEar) return [200, 160, 130, 255];
  if (inCheekShade && inHead) return [200, 155, 120, 255];
  if (inHead) return [225, 185, 155, 255];
  if (inNeck) return [195, 155, 125, 255];
  if (inCrew) return [10, 12, 18, 255];
  if (inLogo) return [245, 184, 0, 255];
  if (inArmL || inArmR) return [16, 18, 26, 255];
  if (inBody) return [22, 25, 34, 255];
  if (inShoulders) return [16, 18, 26, 255];

  return [0, 0, 0, 0];
}

// ---------------------------------------------
// Merge Conflict — two overlapping diff-colored chunks (red + green)
// with angry yellow eyes and an angle-bracket "mouth"
// ---------------------------------------------
function mergeConflictPixel(u, v, ent) {
  const flash = ent.hitFlash > 0;

  // Two stacked diff blocks
  const inRedBlock = v > 0.30 && v < 0.55 && u > 0.20 && u < 0.80;
  const inGreenBlock = v > 0.55 && v < 0.80 && u > 0.20 && u < 0.80;

  // Diff "+" / "-" markers on left edge
  const minusBar = inRedBlock && u < 0.28 && v > 0.40 && v < 0.45;
  const plusV = inGreenBlock && u > 0.22 && u < 0.27 && v > 0.62 && v < 0.72;
  const plusH = inGreenBlock && u > 0.20 && u < 0.30 && v > 0.66 && v < 0.69;

  // Eyes (yellow, in red block)
  const e1dx = (u - 0.40) * 16, e1dy = (v - 0.40) * 16;
  const e2dx = (u - 0.60) * 16, e2dy = (v - 0.40) * 16;
  const inEye1 = e1dx*e1dx + e1dy*e1dy < 1;
  const inEye2 = e2dx*e2dx + e2dy*e2dy < 1;

  // Angle-bracket "<<<" mouth across the seam
  const mouthY = v > 0.52 && v < 0.58;
  const mouthBracket = mouthY && (
    (u > 0.40 && u < 0.42) || (u > 0.45 && u < 0.47) || (u > 0.50 && u < 0.52)
  );

  if (mouthBracket) return [10, 10, 10, 255];
  if (inEye1 || inEye2) return [255, 230, 80, 255];
  if (minusBar) return [255, 255, 255, 255];
  if (plusV || plusH) return [255, 255, 255, 255];
  if (inRedBlock) return flash ? [255, 255, 255, 255] : [180, 50, 50, 255];
  if (inGreenBlock) return flash ? [255, 255, 255, 255] : [60, 160, 70, 255];

  return [0, 0, 0, 0];
}

// ---------------------------------------------
// Key — gold key pickup
// ---------------------------------------------
function keyPixel(u, v) {
  // Bow (round head) at top
  const bdx = (u - 0.5) * 6, bdy = (v - 0.30) * 6;
  const bowOuter = bdx*bdx + bdy*bdy < 1;
  const bowInner = bdx*bdx + bdy*bdy < 0.45;
  const inBow = bowOuter && !bowInner;

  // Shaft straight down
  const inShaft = v > 0.42 && v < 0.85 && u > 0.46 && u < 0.54;

  // Teeth at bottom
  const tooth1 = v > 0.70 && v < 0.78 && u > 0.54 && u < 0.65;
  const tooth2 = v > 0.78 && v < 0.86 && u > 0.54 && u < 0.62;

  if (inBow) return [245, 184, 0, 255];
  if (inShaft) return [245, 184, 0, 255];
  if (tooth1 || tooth2) return [245, 184, 0, 255];

  return [0, 0, 0, 0];
}

// ---------------------------------------------
// Projectile — small purple energy blob (merge-conflict's attack)
// ---------------------------------------------
function projectilePixel(u, v) {
  const dx = (u - 0.5) * 2;
  const dy = (v - 0.5) * 2;
  const r = dx*dx + dy*dy;
  if (r < 0.3) return [255, 220, 255, 255];
  if (r < 0.7) return [180, 80, 200, 255];
  if (r < 1.0) return [120, 40, 140, 255];
  return [0, 0, 0, 0];
}

// ---------------------------------------------
// Boss "The Legacy Codebase" — old server rack covered in cobwebs,
// glowing red LEDs, sticky-notes hanging off it
// ---------------------------------------------
function bossPixel(u, v, ent) {
  const flash = ent.hitFlash > 0;

  // Main rack body (dark grey)
  const inRack = v > 0.18 && v < 0.92 && u > 0.15 && u < 0.85;

  // Frame highlight
  const inFrame = inRack && (
    u < 0.18 || u > 0.82 || v < 0.21 || v > 0.89
  );

  // Server slots (horizontal bars)
  const slotY1 = v > 0.30 && v < 0.36;
  const slotY2 = v > 0.50 && v < 0.56;
  const slotY3 = v > 0.70 && v < 0.76;
  const inSlot = inRack && (slotY1 || slotY2 || slotY3) && u > 0.22 && u < 0.78;

  // Red LED eyes (top row)
  const led1 = (u - 0.32) * (u - 0.32) + (v - 0.27) * (v - 0.27) < 0.0025;
  const led2 = (u - 0.50) * (u - 0.50) + (v - 0.27) * (v - 0.27) < 0.0025;
  const led3 = (u - 0.68) * (u - 0.68) + (v - 0.27) * (v - 0.27) < 0.0025;

  // Yellow sticky note bottom-left
  const stickyL = v > 0.78 && v < 0.88 && u > 0.20 && u < 0.34;
  // Pink sticky note bottom-right
  const stickyR = v > 0.80 && v < 0.90 && u > 0.66 && u < 0.78;

  // Cobweb diagonals (top corners)
  const webL = (u + v) < 0.30 && Math.abs(u - v) < 0.06;
  const webR = (1 - u + v) < 0.30 && Math.abs((1 - u) - v) < 0.06;

  // Antenna on top
  const antenna = u > 0.485 && u < 0.515 && v > 0.04 && v < 0.18;
  const antennaTip = (u - 0.5) * (u - 0.5) + (v - 0.05) * (v - 0.05) < 0.005;
  const antennaGlow = (u - 0.5) * (u - 0.5) + (v - 0.05) * (v - 0.05) < 0.012;

  if (antennaTip) return [255, 100, 100, 255];
  if (antennaGlow) return [255, 60, 60, 200];
  if (antenna) return [140, 140, 140, 255];
  if (led1 || led2 || led3) return [255, 40, 40, 255];
  if (stickyL) return flash ? [255, 255, 255, 255] : [240, 220, 80, 255];
  if (stickyR) return flash ? [255, 255, 255, 255] : [240, 130, 200, 255];
  if (webL || webR) return [200, 200, 200, 200];
  if (inSlot) return flash ? [255, 255, 255, 255] : [60, 60, 70, 255];
  if (inFrame) return flash ? [255, 255, 255, 255] : [180, 180, 190, 255];
  if (inRack) return flash ? [255, 255, 255, 255] : [40, 40, 50, 255];

  return [0, 0, 0, 0];
}

// ---------------------------------------------
// Sprite cache — pre-render each entity type once into a flat
// Uint8ClampedArray for fast per-pixel lookup at draw time.
// hitFlash whitewash and fog are applied at draw time by the renderer.
// ---------------------------------------------
const Sprites = (() => {
  const SIZE = 96;
  const cache = {};

  // Coffee steam: original code used `t = performance.now() * 0.004` and
  // sin(v*22 + t). Sine period is 2π in t → ~1571ms wall-clock. Bake N frames
  // covering that period so the steam animates without per-pixel sampling.
  const COFFEE_FRAMES = 8;
  const COFFEE_PERIOD_MS = (2 * Math.PI) / 0.004;

  function buildOne(type) {
    const data = new Uint8ClampedArray(SIZE * SIZE * 4);
    const ent = { type, hitFlash: 0, bobPhase: 0 };
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const c = spritePixel(ent, x / SIZE, y / SIZE);
        if (!c || c[3] === 0) continue;
        const i = (y * SIZE + x) * 4;
        data[i]     = c[0];
        data[i + 1] = c[1];
        data[i + 2] = c[2];
        data[i + 3] = c[3];
      }
    }
    cache[type] = data;
  }

  function buildCoffeeFrames() {
    const frames = [];
    for (let f = 0; f < COFFEE_FRAMES; f++) {
      const t = (f / COFFEE_FRAMES) * Math.PI * 2;
      const data = new Uint8ClampedArray(SIZE * SIZE * 4);
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const c = coffeePixel(x / SIZE, y / SIZE, t);
          if (!c || c[3] === 0) continue;
          const i = (y * SIZE + x) * 4;
          data[i]     = c[0];
          data[i + 1] = c[1];
          data[i + 2] = c[2];
          data[i + 3] = c[3];
        }
      }
      frames.push(data);
    }
    cache.coffee = frames;
  }

  function init() {
    buildOne('bug');
    buildCoffeeFrames();
    buildOne('ammo');
    buildOne('nick');
    buildOne('mergeconflict');
    buildOne('key');
    buildOne('projectile');
    buildOne('boss');
  }

  function getData(type) {
    if (type === 'coffee') {
      const frames = cache.coffee;
      if (!frames) return null;
      const idx = Math.floor((performance.now() % COFFEE_PERIOD_MS) / COFFEE_PERIOD_MS * frames.length) % frames.length;
      return frames[idx];
    }
    return cache[type] || null;
  }

  return { init, getData, SIZE };
})();
