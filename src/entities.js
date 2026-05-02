// =====================================================
// Entities — spawn, update, AI, and pickup logic
// =====================================================
//
// Entity shape:
//   { type, x, y, alive, size, ...type-specific fields }
//
// Types:
//   'bug'    — chases player when visible, melee attacks
//   'coffee' — health pickup, gives +25 HP
//   'nick'   — touch to win
//
// To add a new entity type:
//   1. Add a case in spawn() to recognize a new map char.
//   2. Add an update branch in update().
//   3. Add a sprite in sprites.js.

// Pickup config — collision radius, HUD flash params, and effect to apply.
// Nick (touch-to-win) is intentionally separate: different radius, no flash.
const PICKUP_FX = {
  coffee: { rad: 0.4, flash: 0.3, color: '80, 220, 120',  apply: p => { p.hp = Math.min(100, p.hp + CONFIG.TUNING.COFFEE_HEAL); p.coffee++; } },
  ammo:   { rad: 0.4, flash: 0.3, color: '120, 180, 255', apply: p => { p.ammo = Math.min(99, p.ammo + 10); } },
  key:    { rad: 0.4, flash: 0.4, color: '255, 230, 90',  apply: p => { p.keys = (p.keys || 0) + 1; } },
};

// Per-map-char spawn template. Spread into entity at spawn time; behavior
// still lives in update(). `_bob` flag adds a random bob phase on spawn.
const ENTITY_DEFS = {
  N: { type: 'bug',           size: 0.5, hp: 2,  attackCooldown: 0.8, awake: false, hitFlash: 0 },
  C: { type: 'coffee',        size: 0.4, _bob: true },
  A: { type: 'ammo',          size: 0.4, _bob: true },
  X: { type: 'nick',          size: 0.6 },
  M: { type: 'mergeconflict', size: 0.6, hp: 3,  attackCooldown: 1.0, awake: false, hitFlash: 0 },
  K: { type: 'key',           size: 0.3, _bob: true },
  B: { type: 'boss',          size: 1.4, hp: 25, attackCooldown: 1.5, meleeCool: 0.5, hitFlash: 0 },
};

const Entities = (() => {
  const list = [];
  let bossWinTriggered = false;
  let bossEverSpawned = false;
  let frameCount = 0;

  function spawn() {
    list.length = 0;
    bossWinTriggered = false;
    bossEverSpawned = false;
    frameCount = 0;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const def = ENTITY_DEFS[MAP[y][x]];
        if (!def) continue;
        const ent = { ...def, x: x + 0.5, y: y + 0.5, alive: true };
        if (def._bob) { ent.bobPhase = Math.random() * Math.PI * 2; delete ent._bob; }
        list.push(ent);
        if (def.type === 'boss') bossEverSpawned = true;
      }
    }
  }

  // Cast a coarse ray and check for wall hits — used for AI line-of-sight
  // and weapon hit-scan occlusion.
  function rayHitsWall(x, y, ang, maxDist) {
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const step = CONFIG.TUNING.RAY_STEP;
    let d = 0;
    while (d < maxDist) {
      d += step;
      if (isWall(Math.floor(x + dx * d), Math.floor(y + dy * d))) return true;
    }
    return false;
  }

  function update(dt, player, onWin, onHurt) {
    const initialLen = list.length;
    for (let i = 0; i < initialLen; i++) {
      const e = list[i];
      if (!e.alive) continue;
      if (e.hitFlash > 0) e.hitFlash -= dt;

      if (e.type === 'bug') {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 0.001) continue;
        const ang = Math.atan2(dy, dx);
        const sees = !rayHitsWall(e.x, e.y, ang, dist);

        // Sleep until first sighted (prevents ambush from behind walls).
        if (sees) e.awake = true;
        if (!e.awake) continue;

        if (sees && dist > CONFIG.TUNING.BUG_APPROACH_DIST) {
          const speed = CONFIG.TUNING.BUG_SPEED;
          const nx = e.x + Math.cos(ang) * speed * dt;
          const ny = e.y + Math.sin(ang) * speed * dt;
          if (!isWall(Math.floor(nx), Math.floor(e.y))) e.x = nx;
          if (!isWall(Math.floor(e.x), Math.floor(ny))) e.y = ny;
        }
        e.attackCooldown -= dt;
        if (sees && dist < CONFIG.TUNING.BUG_ATTACK_RANGE && e.attackCooldown <= 0) {
          onHurt(CONFIG.TUNING.BUG_DAMAGE);
          e.attackCooldown = CONFIG.TUNING.BUG_ATTACK_COOLDOWN;
        }
      } else if (PICKUP_FX[e.type]) {
        const fx = PICKUP_FX[e.type];
        const dx = player.x - e.x, dy = player.y - e.y;
        if (dx*dx + dy*dy < fx.rad * fx.rad) {
          e.alive = false;
          fx.apply(player);
          player.pickupFlash = fx.flash;
          player.pickupFlashColor = fx.color;
          sfx('pickup');
        }
      } else if (e.type === 'nick') {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        if (dx*dx + dy*dy < 0.7*0.7) onWin();
      } else if (e.type === 'mergeconflict') {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 0.001) continue;
        const ang = Math.atan2(dy, dx);
        const sees = !rayHitsWall(e.x, e.y, ang, dist);

        if (sees) e.awake = true;
        if (!e.awake) continue;

        if (sees) {
          // Strafe to maintain ~4-tile range
          let mvAng = ang;
          let mvSpeed = 0.6;
          if (dist < 3.0) { mvAng = ang + Math.PI; mvSpeed = 0.7; }
          else if (dist > 5.5) { mvSpeed = 0.7; }
          else { mvAng = ang + Math.PI / 2; mvSpeed = 0.4; }

          const nx = e.x + Math.cos(mvAng) * mvSpeed * dt;
          const ny = e.y + Math.sin(mvAng) * mvSpeed * dt;
          if (!isWall(Math.floor(nx), Math.floor(e.y))) e.x = nx;
          if (!isWall(Math.floor(e.x), Math.floor(ny))) e.y = ny;

          e.attackCooldown -= dt;
          if (dist < 8.0 && e.attackCooldown <= 0) {
            const speed = 4.5;
            list.push({
              type: 'projectile',
              x: e.x + Math.cos(ang) * 0.4,
              y: e.y + Math.sin(ang) * 0.4,
              dx: Math.cos(ang) * speed,
              dy: Math.sin(ang) * speed,
              alive: true,
              size: 0.25,
              life: 3.0
            });
            e.attackCooldown = 1.5;
            sfx('merge');
          }
        }
      } else if (e.type === 'projectile') {
        e.x += e.dx * dt;
        e.y += e.dy * dt;
        e.life -= dt;
        if (e.life <= 0 || isWall(Math.floor(e.x), Math.floor(e.y))) {
          e.alive = false;
          continue;
        }
        const pdx = player.x - e.x;
        const pdy = player.y - e.y;
        if (pdx*pdx + pdy*pdy < 0.4*0.4) {
          e.alive = false;
          onHurt(12);
        }
      } else if (e.type === 'boss') {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 0.001) continue;
        const ang = Math.atan2(dy, dx);
        const sees = !rayHitsWall(e.x, e.y, ang, dist);

        if (sees && dist > 1.8) {
          const speed = 0.9;
          const nx = e.x + Math.cos(ang) * speed * dt;
          const ny = e.y + Math.sin(ang) * speed * dt;
          if (!isWall(Math.floor(nx), Math.floor(e.y))) e.x = nx;
          if (!isWall(Math.floor(e.x), Math.floor(ny))) e.y = ny;
        }

        e.attackCooldown -= dt;
        if (sees && dist < 14 && e.attackCooldown <= 0) {
          // Triple-shot spread
          const shotSpeed = 4.5;
          for (let s = -1; s <= 1; s++) {
            const a = ang + s * 0.18;
            list.push({
              type: 'projectile',
              x: e.x + Math.cos(ang) * 0.6,
              y: e.y + Math.sin(ang) * 0.6,
              dx: Math.cos(a) * shotSpeed,
              dy: Math.sin(a) * shotSpeed,
              alive: true,
              size: 0.3,
              life: 4.0
            });
          }
          e.attackCooldown = 1.8;
          sfx('merge');
        }

        e.meleeCool -= dt;
        if (sees && dist < 1.6 && e.meleeCool <= 0) {
          onHurt(15);
          e.meleeCool = 1.0;
        }
      }
    }

    // Boss-level win trigger
    const lvl = (typeof getCurrentLevel === 'function') ? getCurrentLevel() : null;
    if (lvl && lvl.winOn === 'bossDead' && bossEverSpawned && !bossWinTriggered) {
      let anyAlive = false;
      for (const e of list) {
        if (e.type === 'boss' && e.alive) { anyAlive = true; break; }
      }
      if (!anyAlive) {
        bossWinTriggered = true;
        onWin();
      }
    }

    // Periodic GC of dead entries (boss triple-shot can pile up).
    frameCount++;
    if (frameCount % 60 === 0) {
      for (let i = list.length - 1; i >= 0; i--) {
        if (!list[i].alive) list.splice(i, 1);
      }
    }
  }

  // Hit-scan from player's crosshair: returns nearest visible enemy or null
  function hitScan(player, range = 12) {
    let bestEnt = null;
    let bestDist = Infinity;
    for (const e of list) {
      if (!e.alive) continue;
      if (e.type !== 'bug' && e.type !== 'mergeconflict' && e.type !== 'boss') continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > range) continue;
      const ang = Math.atan2(dy, dx);
      let diff = ang - player.dir;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      // Min cone of 6° so distant enemies remain aimable; widens with sprite size up close.
      const hitWidth = Math.max(0.105, Math.atan2(0.6, dist));
      if (Math.abs(diff) > hitWidth) continue;
      if (rayHitsWall(player.x, player.y, ang, dist)) continue;
      if (dist < bestDist) { bestDist = dist; bestEnt = e; }
    }
    return bestEnt;
  }

  return {
    list,
    spawn,
    update,
    hitScan,
    rayHitsWall,
  };
})();
