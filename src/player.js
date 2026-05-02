// =====================================================
// Player — state, movement, shooting
// =====================================================

const Player = (() => {
  const state = {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    dir: PLAYER_START.dir,
    fov: Math.PI / 3,            // 60 degrees
    speed: 3.0,                  // tiles/sec
    rotSpeed: 2.4,               // rad/sec
    hp: 100,
    ammo: 30,
    kills: 0,
    coffee: 0,
    startTime: 0,
    bobTime: 0,                  // weapon bob phase
    hurtFlash: 0,                // red overlay timer
    pickupFlash: 0,              // gold overlay timer
    shootCooldown: 0,
    muzzleFlash: 0,
  };

  function reset() {
    state.x = PLAYER_START.x;
    state.y = PLAYER_START.y;
    state.dir = PLAYER_START.dir;
    state.hp = 100;
    state.ammo = 30;
    state.kills = 0;
    state.coffee = 0;
    state.bobTime = 0;
    state.hurtFlash = 0;
    state.pickupFlash = 0;
    state.shootCooldown = 0;
    state.muzzleFlash = 0;
    state.startTime = performance.now();
  }

  function update(dt, keys) {
    let mvX = 0, mvY = 0;
    const speed = (keys['ShiftLeft'] || keys['ShiftRight']) ? state.speed * 1.6 : state.speed;

    if (keys['KeyW']) { mvX += Math.cos(state.dir);            mvY += Math.sin(state.dir); }
    if (keys['KeyS']) { mvX -= Math.cos(state.dir);            mvY -= Math.sin(state.dir); }
    if (keys['KeyA']) { mvX += Math.cos(state.dir - Math.PI/2); mvY += Math.sin(state.dir - Math.PI/2); }
    if (keys['KeyD']) { mvX += Math.cos(state.dir + Math.PI/2); mvY += Math.sin(state.dir + Math.PI/2); }

    if (keys['ArrowLeft'])  state.dir -= state.rotSpeed * dt;
    if (keys['ArrowRight']) state.dir += state.rotSpeed * dt;

    const len = Math.sqrt(mvX*mvX + mvY*mvY);
    if (len > 0) {
      mvX = mvX / len * speed * dt;
      mvY = mvY / len * speed * dt;
      const newX = state.x + mvX;
      const newY = state.y + mvY;
      const buffer = 0.18;
      // Slide along walls
      if (!isWall(Math.floor(newX + Math.sign(mvX) * buffer), Math.floor(state.y))) state.x = newX;
      if (!isWall(Math.floor(state.x), Math.floor(newY + Math.sign(mvY) * buffer))) state.y = newY;
      state.bobTime += dt * 8;
    } else {
      state.bobTime *= 0.9;
    }

    if (state.shootCooldown > 0) state.shootCooldown -= dt;
    if (state.muzzleFlash > 0)   state.muzzleFlash   -= dt * 5;
    if (state.hurtFlash > 0)     state.hurtFlash     -= dt;
    if (state.pickupFlash > 0)   state.pickupFlash   -= dt;
  }

  function shoot() {
    if (state.shootCooldown > 0) return;
    if (state.ammo <= 0) { sfx('empty'); return; }
    state.ammo--;
    state.shootCooldown = 0.35;
    state.muzzleFlash = 1.0;
    sfx('shoot');

    const target = Entities.hitScan(state);
    if (target) {
      target.hp--;
      target.hitFlash = 0.15;
      if (target.hp <= 0) {
        target.alive = false;
        state.kills++;
        sfx('kill');
      } else {
        sfx('hit');
      }
    }
  }

  function takeDamage(amount) {
    state.hp -= amount;
    if (state.hp < 0) state.hp = 0;
    state.hurtFlash = 0.4;
    sfx('hurt');
  }

  return { state, reset, update, shoot, takeDamage };
})();
