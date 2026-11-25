// Ember & Ladle — tiny synthesised sound effects. No audio files: every sound
// is an oscillator or a filtered noise burst made with the Web Audio API, so
// the game ships no assets and makes no network request. Sound starts only
// after the player's first gesture (browser autoplay rules).

let ctx = null;
let muted = false;

function ac() {
  if (ctx === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function tone(freq, seconds, type, gain, when = 0) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

function noise(seconds, gain, filterFreq) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime;
  const len = Math.max(1, Math.floor(c.sampleRate * seconds));
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  pick() { tone(520, 0.07, 'triangle', 0.12); },
  place() { tone(340, 0.08, 'triangle', 0.12); tone(510, 0.06, 'sine', 0.08, 0.04); },
  chop() { noise(0.09, 0.16, 1800); },
  sizzle() { noise(0.35, 0.07, 3200); },
  done() { tone(660, 0.09, 'sine', 0.12); tone(880, 0.12, 'sine', 0.12, 0.08); },
  serve() { tone(523, 0.1, 'triangle', 0.14); tone(659, 0.1, 'triangle', 0.14, 0.09); tone(784, 0.16, 'triangle', 0.14, 0.18); },
  error() { tone(180, 0.14, 'square', 0.07); },
  lost() { tone(220, 0.22, 'sawtooth', 0.06); tone(165, 0.3, 'sawtooth', 0.06, 0.14); },
  tick() { tone(980, 0.05, 'square', 0.05); },
  levelUp() { tone(523, 0.1, 'triangle', 0.12); tone(659, 0.1, 'triangle', 0.12, 0.09); tone(784, 0.1, 'triangle', 0.12, 0.18); tone(1047, 0.18, 'triangle', 0.12, 0.27); },
};
