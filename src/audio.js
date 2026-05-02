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
    }
  } catch (e) {
    // Silently ignore audio errors (e.g. before user gesture)
  }
}
