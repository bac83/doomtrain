// =====================================================
// Audio — procedural sound effects (no asset files needed)
// =====================================================
//
// All SFX are generated on the fly with WebAudio oscillators.
// Call sfx('shoot'), sfx('hit'), etc. from game code.
// To add a new sound, add a new branch below.

let _audioCtx = null;
function getAudio() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

function sfx(type) {
  try {
    const ctx = getAudio();
    const t = ctx.currentTime;

    if (type === 'win') {
      // Triumphant arpeggio
      const notes = [261, 329, 392, 523]; // C, E, G, C
      for (let i = 0; i < notes.length; i++) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(notes[i], t + i * 0.15);
        g.gain.setValueAtTime(0.12, t + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.2);
        o.start(t + i * 0.15);
        o.stop(t + i * 0.15 + 0.2);
      }
      return;
    }

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);

    switch (type) {
      case 'shoot':
        o.type = 'square';
        o.frequency.setValueAtTime(220, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.start(t); o.stop(t + 0.15);
        break;
      case 'hit':
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(60, t + 0.08);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.start(t); o.stop(t + 0.12);
        break;
      case 'kill':
        o.type = 'triangle';
        o.frequency.setValueAtTime(440, t);
        o.frequency.exponentialRampToValueAtTime(80, t + 0.3);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.start(t); o.stop(t + 0.3);
        break;
      case 'hurt':
        o.type = 'square';
        o.frequency.setValueAtTime(180, t);
        o.frequency.exponentialRampToValueAtTime(70, t + 0.2);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        o.start(t); o.stop(t + 0.2);
        break;
      case 'pickup':
        o.type = 'sine';
        o.frequency.setValueAtTime(440, t);
        o.frequency.linearRampToValueAtTime(880, t + 0.1);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.start(t); o.stop(t + 0.15);
        break;
      case 'empty':
        o.type = 'square';
        o.frequency.setValueAtTime(80, t);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        o.start(t); o.stop(t + 0.05);
        break;
      case 'shootHammer':
        o.type = 'square';
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(50, t + 0.06);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        o.start(t); o.stop(t + 0.08);
        break;
      case 'merge':
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(420, t);
        o.frequency.exponentialRampToValueAtTime(120, t + 0.18);
        g.gain.setValueAtTime(0.10, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
        o.start(t); o.stop(t + 0.20);
        break;
      case 'door':
        o.type = 'sine';
        o.frequency.setValueAtTime(180, t);
        o.frequency.linearRampToValueAtTime(90, t + 0.35);
        g.gain.setValueAtTime(0.10, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.40);
        o.start(t); o.stop(t + 0.40);
        break;
      case 'switchWeapon':
        o.type = 'square';
        o.frequency.setValueAtTime(330, t);
        o.frequency.linearRampToValueAtTime(440, t + 0.06);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        o.start(t); o.stop(t + 0.08);
        break;
    }
  } catch (e) {
    // Silently ignore audio errors (e.g. before user gesture)
  }
}

// =====================================================
// Music — looping chiptune via setInterval-scheduled oscillators.
// Started after first user gesture (button click) to satisfy autoplay policies.
// =====================================================
const Music = (() => {
  // 16-step pattern. 0 = rest. Frequencies in Hz.
  // Bass: A1 minor pulse. Lead: triangle melody hinting "from zero to hero".
  const BASS = [110, 0, 110, 0, 165, 0, 110, 0, 130, 0, 130, 0, 165, 0, 196, 0];
  const LEAD = [0, 0, 440, 0, 0, 523, 0, 659, 0, 0, 587, 0, 523, 0, 440, 0];
  const STEP_MS = 140;

  let started = false;
  let intervalId = null;
  let step = 0;
  let masterGain = null;

  function ensureMaster(ctx) {
    if (masterGain) return masterGain;
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
    return masterGain;
  }

  function tick() {
    try {
      const ctx = getAudio();
      const master = ensureMaster(ctx);
      const t = ctx.currentTime;

      const bass = BASS[step % BASS.length];
      if (bass > 0) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(master);
        o.type = 'square';
        o.frequency.setValueAtTime(bass, t);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.start(t); o.stop(t + 0.20);
      }

      const lead = LEAD[step % LEAD.length];
      if (lead > 0) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(master);
        o.type = 'triangle';
        o.frequency.setValueAtTime(lead, t);
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.start(t); o.stop(t + 0.18);
      }

      step++;
    } catch (_) {}
  }

  function start() {
    if (started) return;
    started = true;
    step = 0;
    intervalId = setInterval(tick, STEP_MS);
  }

  function stop() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    started = false;
  }

  function setVolume(v) {
    if (masterGain) masterGain.gain.value = v;
  }

  // Tab-hide pause: setInterval gets throttled when hidden, then bursts
  // on reactivate. Suspend music while hidden, resume only if it was playing.
  let wasPlayingBeforeHide = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      wasPlayingBeforeHide = started;
      if (started) stop();
    } else if (wasPlayingBeforeHide) {
      start();
    }
  });

  return { start, stop, setVolume };
})();
