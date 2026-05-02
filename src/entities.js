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
        const c = MAP[y][x];
        if (c === 'N') {
          list.push({
            type: 'bug',
            x: x + 0.5, y: y + 0.5,
            hp: 2, alive: true,
            attackCooldown: 0.8,
            awake: false,
            hitFlash: 0,
            size: 0.5
          });
        } else if (c === 'C') {
          list.push({
            type: 'coffee',
            x: x + 0.5, y: y + 0.5,
            alive: true,
            size: 0.4,
            bobPhase: Math.random() * Math.PI * 2
          });
        } else if (c === 'X') {
          list.push({
            type: 'nick',
            x: x + 0.5, y: y + 0.5,
            alive: true,
            size: 0.6
          });
        } else if (c === 'M') {
          list.push({
            type: 'mergeconflict',
            x: x + 0.5, y: y + 0.5,
            hp: 3, alive: true,
            attackCooldown: 1.0,
            awake: false,
            hitFlash: 0,
            size: 0.6
          });
        } else if (c === 'K') {
          list.push({
            type: 'key',
            x: x + 0.5, y: y + 0.5,
            alive: true,
            size: 0.3,
            bobPhase: Math.random() * Math.PI * 2
          });
        } else if (c === 'B') {
          list.push({
            type: 'boss',
            x: x + 0.5, y: y + 0.5,
            hp: 25, alive: true,
            attackCooldown: 1.5,
            meleeCool: 0.5,
            hitFlash: 0,
            size: 1.4
          });
          bossEverSpawned = true;
        }
      }
    }
  }

  // Cast a coarse ray and check for wall hits — used for AI line-of-sight
  // and weapon hit-scan occlusion.
  function rayHitsWall(x, y, ang, maxDist) {
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const step = 0.05;
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

        if (sees && dist > 2.4) {
          const speed = 0.35;
          const nx = e.x + Math.cos(ang) * speed * dt;
          const ny = e.y + Math.sin(ang) * speed * dt;
          if (!isWall(Math.floor(nx), Math.floor(e.y))) e.x = nx;
          if (!isWall(Math.floor(e.x), Math.floor(ny))) e.y = ny;
        }
        e.attackCooldown -= dt;
        if (sees && dist < 2.6 && e.attackCooldown <= 0) {
          onHurt(8);
          e.attackCooldown = 1.2;
        }
      } else if (e.type === 'coffee') {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        if (dx*dx + dy*dy < 0.4*0.4) {
          e.alive = false;
          player.hp = Math.min(100, player.hp + 25);
          player.coffee++;
          player.pickupFlash = 0.3;
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
      } else if (e.type === 'key') {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        if (dx*dx + dy*dy < 0.4*0.4) {
          e.alive = false;
          player.keys = (player.keys || 0) + 1;
          player.pickupFlash = 0.3;
          sfx('pickup');
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
