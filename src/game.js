// =====================================================
// Game — main loop, state machine, win/lose handling
// =====================================================

(function main() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // States: 'menu' | 'playing' | 'won' | 'lost'
  let gameState = 'menu';

  Renderer.init();
  Entities.spawn();
  Input.init(canvas, () => {
    if (gameState === 'playing') Player.shoot();
  });

  // Menu wiring
  const overlay = document.getElementById('overlay');
  const endScreen = document.getElementById('endScreen');
  document.getElementById('startBtn').addEventListener('click', () => {
    overlay.classList.add('hidden');
    gameState = 'playing';
    Player.reset();
    canvas.requestPointerLock();
  });

  function winGame() {
    if (gameState !== 'playing') return;
    gameState = 'won';
    sfx('win');
    Input.unlockMouse();
    document.getElementById('statKills').textContent = Player.state.kills;
    document.getElementById('statCoffee').textContent = Player.state.coffee;
    const elapsed = Math.floor((performance.now() - Player.state.startTime) / 1000);
    document.getElementById('statTime').textContent = elapsed;
    endScreen.style.display = 'flex';
  }

  function loseGame() {
    if (gameState !== 'playing') return;
    gameState = 'lost';
    Input.unlockMouse();
    const lose = document.createElement('div');
    lose.style.cssText = `
      position: fixed; inset: 0;
      background: #1a0a0a;
      display: flex; align-items: center; justify-content: center;
      flex-direction: column;
      z-index: 100;
      color: #dc3232;
      text-align: center;
      font-family: 'Courier New', monospace;
    `;
    lose.innerHTML = `
      <div style="font-size:72px;letter-spacing:8px;text-shadow:4px 4px 0 #000;font-weight:900;">YOU DIED</div>
      <div style="color:#fff;font-size:18px;margin:24px 0;">The bugs got you. Time to refactor.</div>
      <div style="color:#aaa;font-style:italic;margin-bottom:24px;">"Every senior dev was once a junior. Try again."</div>
      <button onclick="location.reload()" style="background:#dc3232;color:#fff;border:none;padding:14px 36px;font-family:inherit;font-size:18px;font-weight:bold;letter-spacing:3px;cursor:pointer;">RESTART COURSE</button>
    `;
    document.body.appendChild(lose);
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (gameState === 'playing') {
      Player.update(dt, Input.keys);
      Entities.update(dt, Player.state, winGame, (dmg) => Player.takeDamage(dmg));
      if (Player.state.hp <= 0) loseGame();
    }

    // Render to internal buffer
    Renderer.castRays(Player.state);
    Renderer.drawSprites(Player.state, Entities.list);
    Renderer.drawHUD();
    Renderer.blit(ctx);

    // Overlays on the scaled canvas
    if (Player.state.hurtFlash > 0) {
      ctx.fillStyle = `rgba(220, 50, 50, ${Player.state.hurtFlash * 0.5})`;
      ctx.fillRect(0, 0, CONFIG.SCREEN_W, CONFIG.SCREEN_H);
    }
    if (Player.state.pickupFlash > 0) {
      ctx.fillStyle = `rgba(245, 184, 0, ${Player.state.pickupFlash * 0.3})`;
      ctx.fillRect(0, 0, CONFIG.SCREEN_W, CONFIG.SCREEN_H);
    }

    Weapon.draw(ctx, Player.state);
    HUD.draw(ctx, Player.state);

    // Vignette
    const grd = ctx.createRadialGradient(
      CONFIG.SCREEN_W/2, CONFIG.SCREEN_H/2, CONFIG.SCREEN_W*0.3,
      CONFIG.SCREEN_W/2, CONFIG.SCREEN_H/2, CONFIG.SCREEN_W*0.7
    );
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, CONFIG.SCREEN_W, CONFIG.SCREEN_H);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
