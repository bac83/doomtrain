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

  function spawn() {
    list.length = 0;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const c = MAP[y][x];
        if (c === 'N') {
          list.push({
            type: 'bug',
            x: x + 0.5, y: y + 0.5,
            hp: 2, alive: true,
            attackCooldown: 0,
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
    for (const e of list) {
      if (!e.alive) continue;
      if (e.hitFlash > 0) e.hitFlash -= dt;

      if (e.type === 'bug') {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 0.001) continue;
        const ang = Math.atan2(dy, dx);
        const sees = !rayHitsWall(e.x, e.y, ang, dist);

        if (sees && dist > 0.6) {
          const speed = 1.2;
          const nx = e.x + Math.cos(ang) * speed * dt;
          const ny = e.y + Math.sin(ang) * speed * dt;
          if (!isWall(Math.floor(nx), Math.floor(e.y))) e.x = nx;
          if (!isWall(Math.floor(e.x), Math.floor(ny))) e.y = ny;
        }
        e.attackCooldown -= dt;
        if (sees && dist < 1.0 && e.attackCooldown <= 0) {
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
      }
    }
  }

  // Hit-scan from player's crosshair: returns nearest visible bug or null
  function hitScan(player, range = 12) {
    let bestEnt = null;
    let bestDist = Infinity;
    for (const e of list) {
      if (!e.alive || e.type !== 'bug') continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > range) continue;
      const ang = Math.atan2(dy, dx);
      let diff = ang - player.dir;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      const hitWidth = Math.atan2(0.4, dist);
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
