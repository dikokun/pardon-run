// Every sound in PARDON RUN is synthesized with WebAudio at runtime —
// gobbles, whooshes, pops, stingers and a small four-bar music loop.
// There are no audio files and no network requests.

let ctx = null;
let master = null;
let musicTimer = null;
let muted = false;

export function initAudio() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
}

export function setMuted(value) {
  muted = value;
  if (!ctx) return;
  if (muted) ctx.suspend();
  else ctx.resume();
}

export function isMuted() {
  return muted;
}

function tone({ freq, freqEnd, type = "sine", dur = 0.15, vol = 0.3, delay = 0 }) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst({ dur = 0.1, vol = 0.2, freq = 1200, q = 1.5, delay = 0 }) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(t0);
}

export function playGobble() {
  tone({ freq: 800, freqEnd: 1250, dur: 0.07, vol: 0.25 });
  tone({ freq: 620, freqEnd: 940, dur: 0.08, vol: 0.25, delay: 0.075 });
  tone({ freq: 700, freqEnd: 1100, dur: 0.06, vol: 0.18, delay: 0.16 });
}

export function playJump() {
  noiseBurst({ dur: 0.12, vol: 0.16, freq: 1200, q: 2 });
  tone({ freq: 82, dur: 0.05, vol: 0.2 });
}

export function playFlap() {
  noiseBurst({ dur: 0.09, vol: 0.13, freq: 900, q: 1.2 });
}

export function playHit() {
  tone({ freq: 150, type: "square", dur: 0.05, vol: 0.3 });
  noiseBurst({ dur: 0.07, vol: 0.2, freq: 500, q: 0.8, delay: 0.02 });
}

export function playPickup(combo = 1) {
  const lift = Math.min(combo, 12) * 18;
  tone({ freq: 880 + lift, dur: 0.07, vol: 0.22 });
  tone({ freq: 1100 + lift, dur: 0.08, vol: 0.2, delay: 0.045 });
}

export function playDash() {
  noiseBurst({ dur: 0.18, vol: 0.2, freq: 2400, q: 0.7 });
  tone({ freq: 300, freqEnd: 720, dur: 0.16, vol: 0.12 });
}

export function playStinger(win) {
  const notes = win ? [523, 659, 784, 1047] : [440, 349, 294, 220];
  notes.forEach((freq, i) =>
    tone({ freq, dur: 0.34, vol: 0.22, delay: i * 0.085 }));
}

// A tiny 120 BPM loop: kick on the beats, hats on the eighths, a saw
// bass line and a square pentatonic lead, scheduled bar by bar.
const LEAD = [440, 523, 659, 523, 587, 659, 784, 659];
const BASS = [110, 110, 165, 147];

function scheduleBar(bar) {
  const beat = 0.5; // 120 BPM
  for (let b = 0; b < 4; b++) {
    tone({ freq: 58, freqEnd: 38, dur: 0.09, vol: 0.32, delay: b * beat });
    noiseBurst({ dur: 0.03, vol: 0.05, freq: 6000, q: 0.6, delay: b * beat + beat / 2 });
  }
  tone({ freq: BASS[bar % 4], type: "sawtooth", dur: 1.7, vol: 0.07 });
  for (let s = 0; s < 8; s++) {
    tone({ freq: LEAD[(bar * 8 + s) % LEAD.length], type: "square", dur: 0.11, vol: 0.045, delay: s * beat / 2 });
  }
}

export function startMusic() {
  if (!ctx || musicTimer) return;
  let bar = 0;
  scheduleBar(bar++);
  musicTimer = setInterval(() => scheduleBar(bar++), 2000);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
