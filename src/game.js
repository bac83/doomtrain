// =====================================================
// Game — main loop, state machine, level flow, win/lose
// =====================================================

(function main() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // States: 'menu' | 'playing' | 'paused' | 'boss' | 'levelEnd' | 'won' | 'lost'
  let gameState = 'menu';

  // Cumulative across levels for the final end-screen.
  let totalKills = 0;
  let totalCoffee = 0;
  let runStartTime = 0;

  let showMinimap = false;

  Renderer.init();
  Entities.spawn();
  Input.init(canvas, () => {
    if (gameState === 'playing') Player.shoot();
  });

  // DOM refs
  const overlay = document.getElementById('overlay');
  const endScreen = document.getElementById('endScreen');
  const pauseScreen = document.getElementById('pauseScreen');
  const levelScreen = document.getElementById('levelScreen');
  const pauseBtn = document.getElementById('pauseBtn');
  const bossScreen = document.getElementById('bossScreen');

  // ---- Level flow ----

  function beginLevel(idx) {
    loadLevel(idx);
    Player.reset();
    Entities.spawn();
    gameState = 'playing';
    canvas.requestPointerLock();
  }

  function startRun() {
    totalKills = 0;
    totalCoffee = 0;
    Save.clear();
    runStartTime = performance.now();
    beginLevel(0);
  }

  function continueRun() {
    const s = Save.read();
    if (!s) { startRun(); return; }
    totalKills = s.totalKills || 0;
    totalCoffee = s.totalCoffee || 0;
    runStartTime = performance.now() - (s.runTimeMs || 0);
    beginLevel(s.nextIdx || 0);
  }

  function completeLevel() {
    if (gameState !== 'playing') return;
    totalKills += Player.state.kills;
    totalCoffee += Player.state.coffee;
    sfx('win');
    Input.unlockMouse();

    if (hasNextLevel()) {
      Save.write({
        version: 1,
        nextIdx: nextLevelIndex(),
        totalKills,
        totalCoffee,
        runTimeMs: performance.now() - runStartTime,
      });
      gameState = 'levelEnd';
      document.getElementById('lvlKills').textContent = Player.state.kills;
      document.getElementById('lvlCoffee').textContent = Player.state.coffee;
      document.getElementById('lvlNextName').textContent = Levels[nextLevelIndex()].name;
      levelScreen.style.display = 'flex';
      refreshContinueButton();
    } else {
      finishRun();
    }
  }

  const NICK_QUOTES = [
    'Keep coding!',
    'From Zero to Hero!',
    'Ship it!',
    'Refactor with confidence.',
    'You crushed the boilerplate.',
    'Clean code wins.',
    'Onward to the next course!',
  ];

  function finishRun() {
    gameState = 'won';
    Save.clear();
    refreshContinueButton();
    document.getElementById('statKills').textContent = totalKills;
    document.getElementById('statCoffee').textContent = totalCoffee;
    const elapsed = Math.floor((performance.now() - runStartTime) / 1000);
    document.getElementById('statTime').textContent = elapsed;
    const q = NICK_QUOTES[Math.floor(Math.random() * NICK_QUOTES.length)];
    const quoteEl = document.getElementById('quote');
    if (quoteEl) quoteEl.textContent = q;
    endScreen.style.display = 'flex';
  }

  function loseGame() {
    if (gameState !== 'playing') return;
    gameState = 'lost';
    Input.unlockMouse();
    showLoseScreen();
  }

  function restartRun() {
    removeLoseScreen();
    startRun();
  }

  // ---- Pause ----

  function pauseGame() {
    if (gameState !== 'playing') return;
    gameState = 'paused';
    // Only emit unlock if still locked — avoids redundant pointerlockchange round-trip
    // when ESC already unlocked the cursor (browser-native behavior).
    if (Input.isMouseLocked()) Input.unlockMouse();
    pauseScreen.style.display = 'flex';
  }

  function resumeGame() {
    if (gameState !== 'paused') return;
    pauseScreen.style.display = 'none';
    gameState = 'playing';
    canvas.requestPointerLock();
  }

  // ---- Boss key ----

  function enterBossKey() {
    if (gameState !== 'playing' && gameState !== 'paused') return;
    if (Input.isMouseLocked()) Input.unlockMouse();
    pauseScreen.style.display = 'none';
    if (bossScreen) bossScreen.style.display = 'block';
    gameState = 'boss';
  }

  function exitBossKeyToPause() {
    if (gameState !== 'boss') return;
    if (bossScreen) bossScreen.style.display = 'none';
    gameState = 'paused';
    pauseScreen.style.display = 'flex';
  }

  // ---- Lose screen (built dynamically) ----

  let loseEl = null;
  function showLoseScreen() {
    loseEl = document.createElement('div');
    loseEl.id = 'loseScreen';
    loseEl.style.cssText = `
      position: fixed; inset: 0;
      background: #1a0a0a;
      display: flex; align-items: center; justify-content: center;
      flex-direction: column;
      z-index: 100;
      color: #dc3232;
      text-align: center;
      font-family: 'Courier New', monospace;
    `;
    const runKills = totalKills + Player.state.kills;
    const runCoffee = totalCoffee + Player.state.coffee;
    const runSecs = Math.floor((performance.now() - runStartTime) / 1000);
    loseEl.innerHTML = `
      <div style="font-size:72px;letter-spacing:8px;text-shadow:4px 4px 0 #000;font-weight:900;">YOU DIED</div>
      <div style="color:#fff;font-size:18px;margin:24px 0;">The bugs got you. Time to refactor.</div>
      <div style="background:rgba(0,0,0,0.5);border:2px solid #dc3232;padding:16px 32px;margin-bottom:20px;color:#fff;font-size:16px;line-height:1.7;">
        <div>Bugs squashed: <span style="color:#dc3232;font-weight:bold;">${runKills}</span></div>
        <div>Coffee consumed: <span style="color:#dc3232;font-weight:bold;">${runCoffee}</span></div>
        <div>Time: <span style="color:#dc3232;font-weight:bold;">${runSecs}</span>s</div>
      </div>
      <div style="color:#aaa;font-style:italic;margin-bottom:24px;">"Every senior dev was once a junior. Try again."</div>
      <button id="retryBtn" style="background:#dc3232;color:#fff;border:none;padding:14px 36px;font-family:inherit;font-size:18px;font-weight:bold;letter-spacing:3px;cursor:pointer;">RESTART COURSE</button>
    `;
    document.body.appendChild(loseEl);
    document.getElementById('retryBtn').addEventListener('click', restartRun);
  }

  function removeLoseScreen() {
    if (loseEl && loseEl.parentNode) loseEl.parentNode.removeChild(loseEl);
    loseEl = null;
  }

  // ---- Wiring ----

  function refreshContinueButton() {
    const btn = document.getElementById('continueBtn');
    if (!btn) return;
    btn.style.display = Save.exists() ? '' : 'none';
  }

  document.getElementById('startBtn').addEventListener('click', () => {
    overlay.classList.add('hidden');
    Music.start();
    startRun();
  });

  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      overlay.classList.add('hidden');
      Music.start();
      continueRun();
    });
  }
  refreshContinueButton();

  document.getElementById('resumeBtn').addEventListener('click', resumeGame);

  if (pauseBtn) {
    pauseBtn.addEventListener('click', e => {
      e.stopPropagation();
      pauseGame();
    });
  }

  document.getElementById('nextLevelBtn').addEventListener('click', () => {
    levelScreen.style.display = 'none';
    beginLevel(nextLevelIndex());
  });

  document.getElementById('endRestartBtn').addEventListener('click', () => {
    endScreen.style.display = 'none';
    startRun();
  });

  // ESC toggles pause / exits boss key
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
      if (gameState === 'boss') { e.preventDefault(); exitBossKeyToPause(); }
      else if (gameState === 'playing') { e.preventDefault(); pauseGame(); }
      else if (gameState === 'paused') { e.preventDefault(); resumeGame(); }
    }
    if (e.code === 'KeyB') {
      if (gameState === 'playing' || gameState === 'paused') {
        e.preventDefault();
        enterBossKey();
      }
    }
    if (e.code === 'Tab') {
      e.preventDefault();
      if (gameState === 'playing' || gameState === 'paused') showMinimap = !showMinimap;
    }
  });

  // Auto-pause if pointer-lock breaks unexpectedly mid-game
  document.addEventListener('pointerlockchange', () => {
    if (gameState === 'playing' && document.pointerLockElement !== canvas) {
      pauseGame();
    }
  });

  // ---- Loop ----

  function drawMinimap(ctx) {
    const S = CONFIG.SCREEN_W / 640;
    const px = Math.max(4, Math.round(5 * S));
    const w = MAP_W * px;
    const h = MAP_H * px;
    const ox = CONFIG.SCREEN_W - w - Math.round(12 * S);
    const oy = Math.round(12 * S);

    ctx.fillStyle = 'rgba(10, 14, 26, 0.85)';
    ctx.fillRect(ox - 3, oy - 3, w + 6, h + 6);
    ctx.strokeStyle = '#f5b800';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 3, oy - 3, w + 6, h + 6);

    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const c = mapAt(x, y);
        let col = null;
        if (c === '1') col = '#f5b800';
        else if (c === '2') col = '#9966cc';
        else if (c === 'E') col = '#3cdc64';
        else if (c === 'D') col = '#a07030';
        if (col) {
          ctx.fillStyle = col;
          ctx.fillRect(ox + x * px, oy + y * px, px, px);
        }
      }
    }

    for (const e of Entities.list) {
      if (!e.alive) continue;
      let col = null;
      if (e.type === 'bug') col = '#80c850';
      else if (e.type === 'mergeconflict') col = '#cc55cc';
      else if (e.type === 'coffee') col = '#ffffff';
      else if (e.type === 'key') col = '#f5b800';
      else if (e.type === 'nick') col = '#ffd84a';
      else if (e.type === 'boss') col = '#dc3232';
      else if (e.type === 'ammo') col = '#ffe060';
      else if (e.type === 'projectile') col = '#cc55ff';
      if (!col) continue;
      ctx.fillStyle = col;
      const sz = e.type === 'projectile' ? 2 : 3;
      ctx.fillRect(ox + e.x * px - 1, oy + e.y * px - 1, sz, sz);
    }

    const ps = Player.state;
    ctx.fillStyle = '#dc3232';
    ctx.fillRect(ox + ps.x * px - 2, oy + ps.y * px - 2, 4, 4);
    ctx.strokeStyle = '#dc3232';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox + ps.x * px, oy + ps.y * px);
    ctx.lineTo(ox + ps.x * px + Math.cos(ps.dir) * 10, oy + ps.y * px + Math.sin(ps.dir) * 10);
    ctx.stroke();
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (gameState === 'playing') {
      Player.update(dt, Input.keys);
      Entities.update(dt, Player.state, completeLevel, (dmg) => Player.takeDamage(dmg));
      if (Player.state.hp <= 0) loseGame();
    }

    if (pauseBtn) pauseBtn.classList.toggle('visible', gameState === 'playing');

    Renderer.castRays(Player.state);
    Renderer.drawSprites(Player.state, Entities.list);
    Renderer.drawHUD();
    Renderer.blit(ctx);

    if (Player.state.hurtFlash > 0) {
      ctx.fillStyle = `rgba(220, 50, 50, ${Player.state.hurtFlash * 0.5})`;
      ctx.fillRect(0, 0, CONFIG.SCREEN_W, CONFIG.SCREEN_H);
    }
    if (Player.state.pickupFlash > 0) {
      ctx.fillStyle = `rgba(${Player.state.pickupFlashColor}, ${Player.state.pickupFlash * 0.35})`;
      ctx.fillRect(0, 0, CONFIG.SCREEN_W, CONFIG.SCREEN_H);
    }

    Weapon.draw(ctx, Player.state);
    HUD.draw(ctx, Player.state);

    if (showMinimap) drawMinimap(ctx);

    // Touch joystick visualization
    const js = Input.getJoystick && Input.getJoystick();
    if (js && gameState === 'playing') {
      const baseR = 60;
      const knobR = 26;
      const dx = js.curX - js.startX;
      const dy = js.curY - js.startY;
      const len = Math.sqrt(dx*dx + dy*dy);
      const clamp = Math.min(len, baseR);
      const kx = len > 0 ? js.startX + dx / len * clamp : js.startX;
      const ky = len > 0 ? js.startY + dy / len * clamp : js.startY;

      ctx.beginPath();
      ctx.arc(js.startX, js.startY, baseR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 184, 0, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 184, 0, 0.55)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(kx, ky, knobR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 184, 0, 0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 184, 0, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

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
