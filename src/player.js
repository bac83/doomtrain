// =====================================================
// Player — state, movement, weapons, doors
// =====================================================

const Player = (() => {
  const state = {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    dir: PLAYER_START.dir,
    fov: Math.PI / 3,
    speed: 3.0,
    rotSpeed: 2.4,
    hp: 100,
    ammo: 30,
    keys: 0,
    currentWeapon: 0,
    kills: 0,
    coffee: 0,
    bobTime: 0,
    hurtFlash: 0,
    pickupFlash: 0,
    pickupFlashColor: '245, 184, 0',
    shootCooldown: 0,
    muzzleFlash: 0,
  };

  function reset() {
    state.x = PLAYER_START.x;
    state.y = PLAYER_START.y;
    state.dir = PLAYER_START.dir;
    state.hp = 100;
    state.ammo = 30;
    state.keys = 0;
    state.currentWeapon = 0;
    state.kills = 0;
    state.coffee = 0;
    state.bobTime = 0;
    state.hurtFlash = 0;
    state.pickupFlash = 0;
    state.pickupFlashColor = '245, 184, 0';
    state.shootCooldown = 0;
    state.muzzleFlash = 0;
  }

  function update(dt, keys) {
    let mvX = 0, mvY = 0;
    const speed = (keys['ShiftLeft'] || keys['ShiftRight']) ? state.speed * 1.6 : state.speed;

    if (keys['KeyW']) { mvX += Math.cos(state.dir);             mvY += Math.sin(state.dir); }
    if (keys['KeyS']) { mvX -= Math.cos(state.dir);             mvY -= Math.sin(state.dir); }
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
      if (!isWall(Math.floor(newX + Math.sign(mvX) * buffer), Math.floor(state.y))) state.x = newX;
      if (!isWall(Math.floor(state.x), Math.floor(newY + Math.sign(mvY) * buffer))) state.y = newY;
      state.bobTime += dt * 8;
    } else {
      state.bobTime *= 0.9;
    }

    tryOpenDoor();

    if (state.shootCooldown > 0) state.shootCooldown -= dt;
    if (state.muzzleFlash > 0)   state.muzzleFlash   -= dt * 5;
    if (state.hurtFlash > 0)     state.hurtFlash     -= dt;
    if (state.pickupFlash > 0)   state.pickupFlash   -= dt;
  }

  // If player is adjacent to a 'D' tile and holds a key, consume it and open the door.
  function tryOpenDoor() {
    if (state.keys <= 0) return;
    const tx = Math.floor(state.x);
    const ty = Math.floor(state.y);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = tx + dx, ny = ty + dy;
        if (mapAt(nx, ny) !== 'D') continue;
        const ddx = (nx + 0.5) - state.x;
        const ddy = (ny + 0.5) - state.y;
        if (ddx*ddx + ddy*ddy < 1.4) {
          if (openDoor(nx, ny)) {
            state.keys--;
            sfx('door');
            return;
          }
        }
      }
    }
  }

  function shoot() {
    if (state.shootCooldown > 0) return;
    const w = Weapon.list[state.currentWeapon];
    if (w.ammoType === 'bullets' && state.ammo <= 0) { sfx('empty'); return; }
    if (w.ammoType === 'bullets') state.ammo--;
    state.shootCooldown = w.fireRate;
    state.muzzleFlash = w.muzzle;
    sfx(w.sound);

    const target = Entities.hitScan(state, w.range);
    if (target) {
      target.hp -= w.damage;
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

  function switchWeapon(idx) {
    if (idx < 0 || idx >= Weapon.list.length) return;
    if (state.currentWeapon === idx) return;
    state.currentWeapon = idx;
    state.shootCooldown = 0.2;
    sfx('switchWeapon');
  }

  function takeDamage(amount) {
    state.hp -= amount;
    if (state.hp < 0) state.hp = 0;
    state.hurtFlash = 0.4;
    sfx('hurt');
  }

  return { state, reset, update, shoot, switchWeapon, takeDamage };
})();
