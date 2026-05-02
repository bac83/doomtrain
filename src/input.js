// =====================================================
// Input — keyboard, pointer-lock mouse, and touch controls
// =====================================================
//
// Touch model:
//   - Left half of canvas = virtual joystick. Touch start = anchor.
//     Drag from anchor synthesizes WASD keys on the same `keys` map
//     the keyboard handler writes to, so Player.update needs no special case.
//   - Right half = look + fire. Drag rotates view; tap fires.

const Input = (() => {
  const keys = {};
  let mouseLocked = false;
  let canvas = null;
  let onShoot = () => {};

  // Touch state
  let leftTouchId = null, leftStartX = 0, leftStartY = 0;
  let rightTouchId = null, rightLastX = 0, rightStartX = 0, rightStartY = 0, rightStartTime = 0, rightMoved = false;

  function clearJoystickKeys() {
    keys['KeyW'] = false;
    keys['KeyA'] = false;
    keys['KeyS'] = false;
    keys['KeyD'] = false;
  }

  function init(canvasEl, shootCallback) {
    canvas = canvasEl;
    onShoot = shootCallback;

    window.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        onShoot();
      }
      if (e.code === 'Digit1') Player.switchWeapon(0);
      if (e.code === 'Digit2') Player.switchWeapon(1);
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });

    canvas.addEventListener('click', () => {
      if (!mouseLocked) canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      mouseLocked = document.pointerLockElement === canvas;
    });
    document.addEventListener('mousemove', e => {
      if (mouseLocked) Player.state.dir += e.movementX * 0.003;
    });
    document.addEventListener('mousedown', () => {
      if (mouseLocked) onShoot();
    });

    // Touch
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd,  { passive: false });
  }

  function canvasSpace(touch) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left) * (canvas.width  / rect.width),
      y: (touch.clientY - rect.top)  * (canvas.height / rect.height),
    };
  }

  function onTouchStart(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const p = canvasSpace(t);
      const isLeft = p.x < canvas.width / 2;
      if (isLeft && leftTouchId === null) {
        leftTouchId = t.identifier;
        leftStartX = p.x; leftStartY = p.y;
      } else if (!isLeft && rightTouchId === null) {
        rightTouchId = t.identifier;
        rightStartX = p.x; rightStartY = p.y;
        rightLastX = p.x;
        rightStartTime = performance.now();
        rightMoved = false;
      }
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const p = canvasSpace(t);
      if (t.identifier === leftTouchId) {
        const dx = p.x - leftStartX;
        const dy = p.y - leftStartY;
        const dead = 12;
        clearJoystickKeys();
        if (Math.abs(dx) < dead && Math.abs(dy) < dead) continue;
        const ang = Math.atan2(dy, dx);
        // 8-way map (W=up, S=down, A=left, D=right)
        if (ang > -2.75 && ang < -0.39) keys['KeyW'] = true;
        if (ang > 0.39 && ang < 2.75)   keys['KeyS'] = true;
        if (ang > -1.18 && ang < 1.18)  keys['KeyD'] = true;
        if (ang > 1.96 || ang < -1.96)  keys['KeyA'] = true;
      } else if (t.identifier === rightTouchId) {
        const dx = p.x - rightLastX;
        rightLastX = p.x;
        if (Math.abs(p.x - rightStartX) > 6 || Math.abs(p.y - rightStartY) > 6) rightMoved = true;
        Player.state.dir += dx * 0.005;
      }
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === leftTouchId) {
        leftTouchId = null;
        clearJoystickKeys();
      } else if (t.identifier === rightTouchId) {
        const dt = performance.now() - rightStartTime;
        if (!rightMoved && dt < 250) onShoot();
        rightTouchId = null;
        rightMoved = false;
      }
    }
  }

  function isMouseLocked() { return mouseLocked; }
  function unlockMouse() { document.exitPointerLock(); }

  return { keys, init, isMouseLocked, unlockMouse };
})();
