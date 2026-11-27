// PARDON RUN — bootstrap and game state machine.
//
// States: title → run → (pause) → caught | escaped → title/run again.
// The turkey auto-runs right; the world scrolls past at a speed that
// ramps with distance. Reach 1,200 m (the forest line) for the pardon;
// lose all three lives to obstacles or the farmer's hand and it's
// dinner. Score = distance + pickups, fattened by the combo multiplier.

import { GROUND_Y, VIEW_H, VIEW_W, drawForeground, drawWorld } from "./world.js";
import { createTurkey, drawTurkey, resetTurkey, startStumble, turkeyBox, turkeySpeedFactor, updateTurkey } from "./turkey.js";
import { GRAB_GAP, createFarmer, drawFarmer, farmerDanger, farmerGainOnStumble, farmerPushedByDash, updateFarmer } from "./farmer.js";
import { createSpawner, drawObstacle, knifeBob, obstacleBox, spawnObstacles, updateObstacles } from "./obstacles.js";
import { PICKUP_VALUES, createPickupSpawner, drawPickup, pickupBox, spawnPickups } from "./pickups.js";
import { burstFeathers, burstPickup, burstShards, clearParticles, confetti, dashTrail, drawParticles, puffDust, updateParticles } from "./particles.js";
import { drawHUD } from "./hud.js";
import { drawCaught, drawEscaped, drawPause, drawTitle } from "./screens.js";
import * as input from "./input.js";
import { initAudio, isMuted, playDash, playGobble, playHit, playPickup, playStinger, setMuted, startMusic, stopMusic } from "./audio.js";
import { clamp } from "./utils.js";

export const FINISH_M = 1200;
const PX_PER_M = 50;
const FINISH_PX = FINISH_M * PX_PER_M;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const s = {
  mode: "title",
  time: 0,
  camX: 0,
  distanceM: 0,
  score: 0,
  lives: 3,
  combo: 0,
  bestCombo: 0,
  comboTimer: 0,
  multiplier: 1,
  speed: 0,
  progress: 0,
  farmerDanger: 0,
  turboTime: 0,
  shake: 0,
  caughtBy: "",
  highScore: Number(localStorage.getItem("pardon_run_hs") || 0),
  turkey: createTurkey(),
  titleTurkey: createTurkey(),
  farmer: createFarmer(),
  obstacles: [],
  pickups: [],
  obSpawner: createSpawner(mulberry(20261127)),
  pkSpawner: createPickupSpawner(mulberry(112358)),
  dustTimer: 0,
  farmerDustTimer: 0,
  wasDashing: false,
  endTimer: 0,
};
window.__pardon = s;

function resetRun() {
  s.camX = 0;
  s.distanceM = 0;
  s.score = 0;
  s.lives = 3;
  s.combo = 0;
  s.bestCombo = 0;
  s.comboTimer = 0;
  s.multiplier = 1;
  s.turboTime = 0;
  s.shake = 0;
  s.caughtBy = "";
  s.endTimer = 0;
  resetTurkey(s.turkey);
  s.farmer = createFarmer();
  s.obstacles.length = 0;
  s.pickups.length = 0;
  s.obSpawner = createSpawner(mulberry(20261127));
  s.pkSpawner = createPickupSpawner(mulberry(112358));
  clearParticles();
  input.clearPresses();
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function endRun(mode, by) {
  s.mode = mode;
  s.caughtBy = by || "";
  s.endTimer = 0;
  stopMusic();
  playStinger(mode === "escaped");
  if (mode === "escaped") {
    confetti(640, 240);
    confetti(400, 200);
  }
  if (s.score > s.highScore) {
    s.highScore = Math.round(s.score);
    localStorage.setItem("pardon_run_hs", String(s.highScore));
  }
}

function loseLife(by) {
  s.lives--;
  burstFeathers(300, GROUND_Y - s.turkey.h - 30);
  s.shake = Math.max(s.shake, 7);
  playHit();
  if (s.lives <= 0) {
    endRun("caught", by);
    return;
  }
  startStumble(s.turkey);
  if (by === "obstacle") farmerGainOnStumble(s.farmer);
  if (by === "farmer") s.farmer.gap = 330;
}

function updateRun(dt) {
  const t = s.turkey;
  const baseSpeed = Math.min(700, 330 + s.distanceM * 0.31);
  const turbo = s.turboTime > 0 ? 1.35 : 1;
  if (s.turboTime > 0) s.turboTime -= dt;
  const factor = turkeySpeedFactor(t) * turbo;
  s.speed = baseSpeed * factor;

  updateTurkey(t, dt, s.speed);
  if (t.dashTime > 0) {
    dashTrail(268, GROUND_Y - t.h - 40);
    if (!s.wasDashing) {
      farmerPushedByDash(s.farmer);
      playDash();
      playGobble();
    }
  }
  s.wasDashing = t.dashTime > 0;

  s.camX += s.speed * dt;
  s.distanceM = s.camX / PX_PER_M;
  s.progress = clamp(s.distanceM / FINISH_M, 0, 1);
  s.score += (s.speed * dt / PX_PER_M) * 10;

  if (s.comboTimer > 0) {
    s.comboTimer -= dt;
    if (s.comboTimer <= 0) s.combo = 0;
  }
  s.multiplier = 1 + Math.min(s.combo * 0.1, 2);
  s.bestCombo = Math.max(s.bestCombo, s.combo);

  updateFarmer(s.farmer, dt, (factor - 1) * baseSpeed);
  s.farmerDanger = farmerDanger(s.farmer);

  spawnObstacles(s.obSpawner, s.camX, s.distanceM, s.obstacles);
  spawnPickups(s.pkSpawner, s.camX, s.pickups);
  updateObstacles(s.obstacles, dt);

  // Dust: turkey footfalls and the farmer's boots
  s.dustTimer -= dt;
  if (t.grounded && s.dustTimer <= 0) { puffDust(282, GROUND_Y - 2); s.dustTimer = 0.13; }
  s.farmerDustTimer -= dt;
  if (s.farmerDustTimer <= 0) {
    const fx = 300 - s.farmer.gap - 20;
    if (fx > -60) puffDust(fx, GROUND_Y - 2, true);
    s.farmerDustTimer = 0.3;
  }

  // Collisions — obstacles
  const tBox = turkeyBox(t);
  for (const o of s.obstacles) {
    const sx = o.x - s.camX;
    if (sx < -160 || sx > VIEW_W + 160) continue;
    let box = obstacleBox(o, sx);
    if (!box) continue;
    if (o.kind === "knife") box = { ...box, y: box.y + knifeBob(o, s.time) };
    if (!boxesOverlap(tBox, box)) continue;
    if (t.dashTime > 0 && (o.kind === "oven" || o.kind === "hat")) {
      o.dead = true;
      s.score += 150;
      burstShards(sx + o.w / 2, GROUND_Y - 40);
      s.shake = Math.max(s.shake, 4);
      playHit();
      continue;
    }
    if (t.invulnTime > 0) continue;
    o.dead = true;
    if (t.shield) {
      t.shield = false;
      t.invulnTime = 1.2;
      burstShards(sx + o.w / 2, GROUND_Y - 40);
      continue;
    }
    s.combo = 0;
    loseLife("obstacle");
    if (s.mode !== "run") return;
  }
  s.obstacles = s.obstacles.filter((o) => !o.dead && o.x - s.camX > -220);

  // Collisions — pickups
  for (const p of s.pickups) {
    if (p.taken) continue;
    const sx = p.x - s.camX;
    if (sx < -80 || sx > VIEW_W + 80) continue;
    if (!boxesOverlap(tBox, pickupBox(p, sx))) continue;
    p.taken = true;
    s.combo++;
    s.comboTimer = Math.min(3.5, s.comboTimer + (p.kind === "feather" ? 1.5 : 0.6));
    s.score += PICKUP_VALUES[p.kind] * s.multiplier;
    burstPickup(sx, GROUND_Y - p.h, p.kind === "corn" ? "#ffd700" : "#fff8f0");
    playPickup(s.combo);
    if (p.kind === "corn") s.farmer.gap = Math.min(470, s.farmer.gap + 2);
    if (p.kind === "pie") { s.turboTime = 3; t.shield = true; }
    if (p.kind === "feather") t.hoverFlaps++;
  }
  s.pickups = s.pickups.filter((p) => !p.taken && p.x - s.camX > -120);

  // The farmer's hand
  if (s.farmer.gap <= GRAB_GAP && t.invulnTime <= 0) {
    loseLife("farmer");
    if (s.mode !== "run") return;
  }

  // The pardon line
  if (s.distanceM >= FINISH_M) {
    s.score += 500;
    endRun("escaped");
  }
}

function drawFinishSign() {
  const sx = FINISH_PX - s.camX;
  if (sx < -200 || sx > VIEW_W + 200) return;
  ctx.fillStyle = "#5d3a1e";
  ctx.fillRect(sx, GROUND_Y - 150, 10, 150);
  ctx.fillStyle = "#f5e6c8";
  ctx.beginPath();
  ctx.roundRect(sx - 58, GROUND_Y - 196, 150, 52, 8);
  ctx.fill();
  ctx.fillStyle = "#1a0d0a";
  ctx.textAlign = "center";
  ctx.font = "bold 21px system-ui, sans-serif";
  ctx.fillText("PARDON LINE", sx + 17, GROUND_Y - 162);
}

function draw() {
  ctx.save();
  if (s.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    s.shake *= 0.88;
  }
  const dusk = s.mode === "title" ? 0.12 : s.progress;
  drawWorld(ctx, s.camX, dusk, s.time);

  if (s.mode === "run" || s.mode === "pause") {
    for (const p of s.pickups) {
      const sx = p.x - s.camX;
      if (sx > -60 && sx < VIEW_W + 60) drawPickup(ctx, p, sx, s.time);
    }
    for (const o of s.obstacles) {
      const sx = o.x - s.camX;
      if (sx > -160 && sx < VIEW_W + 160) drawObstacle(ctx, o, sx, s.time);
    }
    drawFinishSign();
    drawFarmer(ctx, s.farmer, s.time);
    drawTurkey(ctx, s.turkey, s.time);
  }
  drawParticles(ctx);
  drawForeground(ctx, s.camX, s.time);

  if (s.mode === "title") drawTitle(ctx, s, s.time);
  else if (s.mode === "run") drawHUD(ctx, s);
  else if (s.mode === "pause") { drawHUD(ctx, s); drawPause(ctx, s); }
  else if (s.mode === "caught") drawCaught(ctx, s, s.time);
  else if (s.mode === "escaped") drawEscaped(ctx, s, s.time);
  ctx.restore();
}

let lastTs = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;
  s.time += dt;
  input.nextFrame();

  if (input.consumePress("mute", 18)) setMuted(!isMuted());

  if (s.mode === "title") {
    s.camX += 42 * dt;
    if (input.consumePress("confirm", 18) || input.consumePress("jump", 18)) {
      initAudio();
      resetRun();
      s.mode = "run";
      startMusic();
      playGobble();
    }
  } else if (s.mode === "run") {
    if (input.consumePress("pause", 18)) s.mode = "pause";
    else updateRun(dt);
  } else if (s.mode === "pause") {
    if (input.consumePress("pause", 18)) s.mode = "run";
    else if (input.consumePress("restart", 18)) { resetRun(); s.mode = "run"; startMusic(); }
    else if (input.consumePress("confirm", 18)) { s.mode = "title"; stopMusic(); }
  } else if (s.mode === "caught" || s.mode === "escaped") {
    s.endTimer += dt;
    updateParticles(dt);
    if (s.endTimer > 0.6 && (input.consumePress("restart", 18) || input.consumePress("confirm", 18))) {
      resetRun();
      s.mode = "run";
      startMusic();
    }
  }
  if (s.mode === "run") updateParticles(dt);
  draw();
  requestAnimationFrame(frame);
}

input.setupInput(canvas);
requestAnimationFrame(frame);
