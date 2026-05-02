// =====================================================
// Input — keyboard state + pointer-lock mouse look
// =====================================================

const Input = (() => {
  const keys = {};
  let mouseLocked = false;
  let canvas = null;
  let onShoot = () => {};

  function init(canvasEl, shootCallback) {
    canvas = canvasEl;
    onShoot = shootCallback;

    window.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        onShoot();
      }
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
  }

  function isMouseLocked() { return mouseLocked; }
  function unlockMouse() { document.exitPointerLock(); }

  return { keys, init, isMouseLocked, unlockMouse };
})();
