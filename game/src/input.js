// Keyboard and mouse input, mapped to game actions. Presses are queued
// with FRAME stamps so the turkey can honour jump buffering (a press a
// few frames before landing still jumps) — the same path a human uses:
// real key and click events, nothing writes physics from outside.
// Frame stamps, not wall-clock seconds: on a slow display (or a
// throttled headless window) a 120 ms wall window can expire before
// the next frame ever reads it, silently eating presses.

const held = {};
const pressQueue = []; // { action, frame }
let frameNo = 0;

export function nextFrame() {
  frameNo++;
}

const KEYMAP = {
  Space: "jump", ArrowUp: "jump", KeyW: "jump",
  ArrowDown: "duck", KeyS: "duck", ShiftLeft: "duck", ShiftRight: "duck",
  KeyD: "dash", ControlLeft: "dash", ControlRight: "dash",
  KeyP: "pause", Escape: "pause", KeyM: "mute", Enter: "confirm",
  KeyR: "restart",
};

function record(action, isDown) {
  held[action] = isDown;
  if (isDown) pressQueue.push({ action, frame: frameNo });
}

export function setupInput(canvas) {
  window.addEventListener("keydown", (ev) => {
    const action = KEYMAP[ev.code];
    if (!action) return;
    if (action === "jump" || action === "duck") ev.preventDefault();
    if (!ev.repeat) record(action, true);
  });
  window.addEventListener("keyup", (ev) => {
    const action = KEYMAP[ev.code];
    if (action) held[action] = false;
  });
  canvas.addEventListener("mousedown", (ev) => {
    if (ev.button === 2) record("duck", true);
    else if (ev.button === 1) record("dash", true);
    else { record("jump", true); record("confirm", true); }
  });
  window.addEventListener("mouseup", (ev) => {
    if (ev.button === 2) held.duck = false;
    if (ev.button === 0) held.jump = false;
  });
  canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
}

export function isHeld(action) {
  return !!held[action];
}

// Take the newest press of an action if it landed within
// `windowFrames` frames; this is the jump-buffer read the turkey
// performs each frame. Presses older than 30 frames are garbage.
export function consumePress(action, windowFrames = 8) {
  for (let i = pressQueue.length - 1; i >= 0; i--) {
    const p = pressQueue[i];
    if (frameNo - p.frame > 30) { pressQueue.splice(i, 1); continue; }
    if (p.action === action && frameNo - p.frame <= windowFrames) {
      pressQueue.splice(i, 1);
      return true;
    }
  }
  return false;
}

export function clearPresses() {
  pressQueue.length = 0;
}
