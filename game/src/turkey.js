// The player: a turkey with a fan tail, a wobble snood and strong
// opinions about Thanksgiving. Physics honour the runner's feel rules —
// coyote time and a jump buffer — and every pose (run, flap, duck,
// dash, stumble) is drawn procedurally so screenshots read at a glance.

import { GROUND_Y } from "./world.js";
import { clamp } from "./utils.js";
import * as input from "./input.js";
import { playFlap, playJump } from "./audio.js";

export const TURKEY_X = 300;
const GRAVITY = 1500;
const JUMP_VEL = -660;
const FLAP_VEL = -545;
const MAX_FALL = 920;

export function createTurkey() {
  return {
    h: 0,               // feet height above the ground, px
    vy: 0,
    grounded: true,
    coyote: 0,
    jumps: 0,           // jumps spent since leaving the ground (max 2)
    ducking: false,
    dashTime: 0,
    dashCooldown: 0,
    stumbleTime: 0,
    invulnTime: 0,
    shield: false,
    hoverFlaps: 0,      // feather pickups bank hover flaps
    hoverTime: 0,
    runPhase: 0,
    flapAnim: 0,
    dead: false,
  };
}

export function turkeyBox(t) {
  const h = t.ducking ? 36 : 68;
  return { x: TURKEY_X - 29, y: GROUND_Y - t.h - h, w: 58, h };
}

export function turkeySpeedFactor(t) {
  if (t.stumbleTime > 0) return 0.55;
  if (t.dashTime > 0) return 1.7;
  return 1;
}

export function startStumble(t) {
  t.stumbleTime = 0.9;
  t.invulnTime = 1.3;
  t.dashTime = 0;
}

export function updateTurkey(t, dt, worldSpeed) {
  t.runPhase += dt * (6 + worldSpeed / 55);
  if (t.coyote > 0) t.coyote -= dt;
  if (t.dashCooldown > 0) t.dashCooldown -= dt;
  if (t.dashTime > 0) t.dashTime -= dt;
  if (t.stumbleTime > 0) t.stumbleTime -= dt;
  if (t.invulnTime > 0) t.invulnTime -= dt;
  if (t.flapAnim > 0) t.flapAnim -= dt * 5;

  const wantDuck = input.isHeld("duck");
  t.ducking = wantDuck && t.grounded;

  if (input.consumePress("jump")) {
    if (t.grounded || t.coyote > 0) {
      t.vy = JUMP_VEL;
      t.grounded = false;
      t.coyote = 0;
      t.jumps = 1;
      t.flapAnim = 1;
      playJump();
    } else if (t.jumps < 2) {
      t.jumps = 2;
      t.flapAnim = 1;
      if (t.hoverFlaps > 0) {
        t.hoverFlaps--;
        t.hoverTime = 0.8;
        t.vy = 0;
      } else {
        t.vy = FLAP_VEL;
      }
      playFlap();
    }
  }

  if (input.consumePress("dash") && t.dashCooldown <= 0 && t.stumbleTime <= 0) {
    t.dashTime = 0.22;
    t.dashCooldown = 1.1;
  }

  if (!t.grounded) {
    if (t.hoverTime > 0) {
      t.hoverTime -= dt;
      t.vy = 0;
    } else {
      const grav = wantDuck ? GRAVITY * 2.6 : GRAVITY;
      t.vy = Math.min(t.vy + grav * dt, MAX_FALL);
    }
    t.h -= t.vy * dt;
    if (t.h <= 0) {
      t.h = 0;
      t.vy = 0;
      t.grounded = true;
      t.jumps = 0;
    }
  } else {
    t.coyote = 0.09;
  }
}

function drawLegs(ctx, t, feetY) {
  ctx.strokeStyle = "#e86c00";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  for (let i = 0; i < 2; i++) {
    const phase = t.runPhase + i * Math.PI;
    const lift = t.grounded ? Math.max(0, Math.sin(phase)) * 13 : 6;
    const swing = t.grounded ? Math.cos(phase) * 13 : (i === 0 ? 9 : -7);
    const hipX = -12 + i * 22;
    ctx.beginPath();
    ctx.moveTo(hipX, feetY - 26);
    ctx.lineTo(hipX + swing * 0.5, feetY - 13 - lift * 0.4);
    ctx.lineTo(hipX + swing, feetY - lift);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hipX + swing, feetY - lift);
    ctx.lineTo(hipX + swing + 9, feetY - lift);
    ctx.stroke();
  }
}

function drawTailFan(ctx, t, time) {
  const breathe = 0.9 + Math.sin(time * 9) * 0.06;
  const duckSquash = t.ducking ? 0.45 : 1;
  ctx.save();
  ctx.translate(-34, -52);
  ctx.scale(1, breathe * duckSquash);
  for (let i = 0; i < 7; i++) {
    const ang = (-58 + i * 19) * (Math.PI / 180);
    const len = 56 - Math.abs(i - 3) * 5;
    const grad = ctx.createLinearGradient(0, 0, Math.sin(ang) * len, -Math.cos(ang) * len);
    grad.addColorStop(0, "#4a2c1e");
    grad.addColorStop(1, "#f5e6c8");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(ang) * len - 8, -Math.cos(ang) * len);
    ctx.lineTo(Math.sin(ang) * len + 8, -Math.cos(ang) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawWing(ctx, t) {
  const flap = t.flapAnim > 0 ? Math.sin((1 - t.flapAnim) * Math.PI * 3) * 0.7 : Math.sin(t.runPhase * 0.7) * 0.12;
  ctx.save();
  ctx.translate(-2, -46);
  ctx.rotate(t.ducking ? -0.9 : flap - 0.15);
  ctx.fillStyle = "#5d3a24";
  ctx.beginPath();
  ctx.ellipse(6, 8, 30, 15, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f5e6c8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(6, 8, 24, 10, 0.5, 0.4, Math.PI * 1.4);
  ctx.stroke();
  ctx.restore();
}

export function drawTurkey(ctx, t, time) {
  const feetY = GROUND_Y - t.h;
  ctx.save();
  ctx.translate(TURKEY_X, feetY);
  if (t.dashTime > 0) {
    for (let g = 1; g <= 3; g++) {
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.translate(-g * 13, 0);
      ctx.fillStyle = "#ffb347";
      ctx.beginPath();
      ctx.ellipse(0, -38, 50, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  const flash = t.invulnTime > 0 && t.stumbleTime > 0 && Math.floor(time * 12) % 2 === 0;
  if (t.stumbleTime > 0) ctx.rotate(Math.sin(time * 40) * 0.1);
  if (t.ducking) ctx.scale(1.12, 0.62);

  drawLegs(ctx, t, 0);
  drawTailFan(ctx, t, time);

  // Body
  ctx.fillStyle = flash ? "#fff3e0" : "#6b4226";
  ctx.beginPath();
  ctx.ellipse(2, -40, 50, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#fff3e0" : "#7d4e2c";
  ctx.beginPath();
  ctx.ellipse(8, -46, 40, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  drawWing(ctx, t);

  // Neck and head
  const bob = Math.sin(t.runPhase * 2) * 2.5;
  ctx.fillStyle = flash ? "#fff3e0" : "#6b4226";
  ctx.fillRect(34, -78 + bob, 13, 30);
  ctx.beginPath();
  ctx.arc(44, -80 + bob, 17, 0, Math.PI * 2);
  ctx.fillStyle = flash ? "#fff3e0" : "#8a5a33";
  ctx.fill();
  // Beak
  ctx.fillStyle = "#f39c12";
  ctx.beginPath();
  ctx.moveTo(57, -84 + bob);
  ctx.lineTo(74, -79 + bob);
  ctx.lineTo(57, -74 + bob);
  ctx.closePath();
  ctx.fill();
  // Snood and wattle
  const wobble = Math.sin(time * 18) * 2;
  ctx.strokeStyle = "#c41e3a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(56, -88 + bob);
  ctx.quadraticCurveTo(62 + wobble, -76 + bob, 58 + wobble, -66 + bob);
  ctx.stroke();
  ctx.fillStyle = "#c41e3a";
  ctx.beginPath();
  ctx.ellipse(46, -64 + bob, 6, 9, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Eye — wide when the farmer is close, squinting on a dash
  ctx.fillStyle = "#fff8f0";
  ctx.beginPath();
  ctx.arc(48, -84 + bob, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a0d0a";
  ctx.beginPath();
  ctx.arc(50, -84 + bob, t.dashTime > 0 ? 2 : 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (t.shield) {
    ctx.strokeStyle = "rgba(255,248,240,0.75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(TURKEY_X, feetY - 42, 62, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (t.invulnTime > 0 && t.stumbleTime <= 0) {
    ctx.fillStyle = "rgba(255,248,240,0.5)";
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("UNTOUCHABLE!", TURKEY_X, feetY - 128);
  }
}

export function resetTurkey(t) {
  Object.assign(t, createTurkey());
}

export { clamp };
