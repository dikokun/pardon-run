// Small shared helpers: clamping, interpolation, seeded variety and
// number formatting for the HUD. Pure functions only, no game state.

export function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Deterministic per-index variety: the same fence post, tree or grass
// tuft looks identical every frame without storing a field of objects.
export function hash01(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function randRange(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

export function formatScore(n) {
  return String(Math.max(0, Math.round(n))).padStart(6, "0");
}

export function formatMeters(m) {
  return `${Math.floor(m)} m`;
}

// Mix two #rrggbb colours; used by the day-progress sky and the dusk
// tint that settles over the farm as the run goes on.
export function mixHex(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r = Math.round(lerp(a >> 16, b >> 16, t));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  const bl = Math.round(lerp(a & 255, b & 255, t));
  return `rgb(${r},${g},${bl})`;
}
