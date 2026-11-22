// Aether Duel — tiny synthesized sound effects, WebAudio only, no
// audio files. Every effect is a short oscillator blip; the module
// degrades silently when audio is unavailable or muted.

let context = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function ac() {
  if (muted) return null;
  try {
    if (!context) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      context = new AC();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

function blip(freq, dur, type, gainValue, when = 0) {
  const ctx = ac();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue, ctx.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + dur);
  } catch {
    // Sound is garnish; a failure here must never break the game.
  }
}

export const sfx = {
  play: () => blip(660, 0.12, 'sine', 0.12),
  hit: () => {
    blip(160, 0.18, 'square', 0.14);
    blip(90, 0.22, 'sawtooth', 0.1, 0.03);
  },
  guard: () => blip(320, 0.16, 'triangle', 0.12),
  heal: () => {
    blip(520, 0.14, 'sine', 0.1);
    blip(780, 0.18, 'sine', 0.1, 0.09);
  },
  draw: () => blip(880, 0.08, 'sine', 0.08),
  turn: () => blip(440, 0.1, 'triangle', 0.09),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.22, 'triangle', 0.12, i * 0.11));
  },
  lose: () => {
    [392, 330, 262, 196].forEach((f, i) => blip(f, 0.24, 'sine', 0.11, i * 0.13));
  },
};
