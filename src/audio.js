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

// One-shot SFX as data. Each entry:
//   wave:     oscillator type
//   f0:       start frequency
//   f1:       end frequency (optional — omit for steady tone)
//   ramp:     'exp' | 'lin' — frequency ramp curve
//   g:        peak gain
//   dur:      total duration (gain ramps to ~0 over this; oscillator stops here)
//   freqDur:  freq-ramp duration (defaults to dur)
const SFX_DEFS = {
  shoot:        { wave: 'square',   f0: 220, f1: 40,  ramp: 'exp', g: 0.15, dur: 0.15, freqDur: 0.10 },
  hit:          { wave: 'sawtooth', f0: 150, f1: 60,  ramp: 'exp', g: 0.12, dur: 0.12, freqDur: 0.08 },
  kill:         { wave: 'triangle', f0: 440, f1: 80,  ramp: 'exp', g: 0.18, dur: 0.30 },
  hurt:         { wave: 'square',   f0: 180, f1: 70,  ramp: 'exp', g: 0.20, dur: 0.20 },
  pickup:       { wave: 'sine',     f0: 440, f1: 880, ramp: 'lin', g: 0.12, dur: 0.15, freqDur: 0.10 },
  empty:        { wave: 'square',   f0: 80,                         g: 0.06, dur: 0.05 },
  shootHammer:  { wave: 'square',   f0: 110, f1: 50,  ramp: 'exp', g: 0.18, dur: 0.08, freqDur: 0.06 },
  merge:        { wave: 'sawtooth', f0: 420, f1: 120, ramp: 'exp', g: 0.10, dur: 0.20, freqDur: 0.18 },
  door:         { wave: 'sine',     f0: 180, f1: 90,  ramp: 'lin', g: 0.10, dur: 0.40, freqDur: 0.35 },
  switchWeapon: { wave: 'square',   f0: 330, f1: 440, ramp: 'lin', g: 0.08, dur: 0.08, freqDur: 0.06 },
};

function _playOneShot(ctx, t, def) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = def.wave;
  o.frequency.setValueAtTime(def.f0, t);
  if (def.f1 !== undefined) {
    const fEnd = t + (def.freqDur ?? def.dur);
    if (def.ramp === 'lin') o.frequency.linearRampToValueAtTime(def.f1, fEnd);
    else o.frequency.exponentialRampToValueAtTime(def.f1, fEnd);
  }
  g.gain.setValueAtTime(def.g, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + def.dur);
  o.start(t); o.stop(t + def.dur);
}

function sfx(type) {
  try {
    const ctx = getAudio();
    const t = ctx.currentTime;

    if (type === 'win') {
      // Triumphant arpeggio — kept inline (4 staggered notes, not a one-shot).
      const notes = [261, 329, 392, 523]; // C, E, G, C
      for (let i = 0; i < notes.length; i++) {
        _playOneShot(ctx, t + i * 0.15, { wave: 'square', f0: notes[i], g: 0.12, dur: 0.20 });
      }
      return;
    }

    const def = SFX_DEFS[type];
    if (def) _playOneShot(ctx, t, def);
  } catch (e) {
    // Silently ignore audio errors (e.g. before user gesture)
  }
}

// =====================================================
// Music — looping chiptune via setInterval-scheduled oscillators.
// Started after first user gesture (button click) to satisfy autoplay policies.
// =====================================================
const Music = (() => {
  // 32-step pattern, faster step. Bass + lead + kick + hat layers for drive.
  // Lead arc: A4-C5-E5-A5-G5-E5-D5-C5 — heroic upbeat motif.
  const BASS = [
    110, 0, 110, 110, 165, 0, 110, 0, 130, 0, 130, 130, 165, 0, 196, 0,
    110, 0, 110, 110, 165, 0, 110, 0, 130, 0, 196, 0, 220, 0, 165, 0,
  ];
  const LEAD = [
    440, 0, 523, 0, 659, 0, 880, 0, 784, 0, 659, 0, 587, 0, 523, 0,
    440, 0, 523, 659, 880, 0, 784, 659, 587, 0, 659, 0, 523, 0, 440, 0,
  ];
  // Kick on beats 1 + 3 of every group of 4.
  const KICK = [
    1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
    1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0,
  ];
  // Hi-hat off-beats for drive.
  const HAT = [
    0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1,
  ];
  const STEP_MS = 100;

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

      const idx = step % BASS.length;

      const bass = BASS[idx];
      if (bass > 0) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(master);
        o.type = 'square';
        o.frequency.setValueAtTime(bass, t);
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.start(t); o.stop(t + 0.14);
      }

      const lead = LEAD[idx];
      if (lead > 0) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(master);
        o.type = 'triangle';
        o.frequency.setValueAtTime(lead, t);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        o.start(t); o.stop(t + 0.15);
      }

      // Kick — short low-freq sine sweep
      if (KICK[idx]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(master);
        o.type = 'sine';
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.08);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
        o.start(t); o.stop(t + 0.11);
      }

      // Hi-hat — short noise burst via highpass-filtered buffer
      if (HAT[idx]) {
        const bufSize = Math.floor(ctx.sampleRate * 0.03);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 6000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.04, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        src.connect(hp); hp.connect(g); g.connect(master);
        src.start(t); src.stop(t + 0.05);
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
