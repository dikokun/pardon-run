// The farmer: overalls, straw hat, and a carving knife he only bothers
// to draw when he gets close. He lives behind the turkey by a gap that
// is the run's real pressure gauge — stumbles feed him ground, dashes
// and clean corn lines win it back, and at zero gap he grabs.

import { GROUND_Y } from "./world.js";
import { TURKEY_X } from "./turkey.js";
import { clamp } from "./utils.js";

export const GRAB_GAP = 42;
const MAX_GAP = 470;

export function createFarmer() {
  return {
    gap: 340,          // px behind the turkey
    runPhase: 0,
    grabLunge: 0,      // 0..1 reach animation when very close
    visible: true,
  };
}

export function farmerX(f) {
  return TURKEY_X - f.gap - 34;
}

// relSpeed: how much faster than the world the turkey is moving
// (dash/turbo positive, stumble negative). The farmer matches the
// world's scroll; clean running wins real ground back (16 px/s plus a
// slice of base speed), so one stumble is recoverable in a few clean
// seconds while repeated stumbles still bury the turkey.
export function updateFarmer(f, dt, relSpeed, baseSpeed = 330) {
  f.runPhase += dt * 11;
  const recovery = 16 + baseSpeed * 0.01;
  f.gap = clamp(f.gap + relSpeed * dt * 0.92 + recovery * dt, 0, MAX_GAP);
  f.grabLunge = f.gap < 120 ? Math.min(1, f.grabLunge + dt * 3) : Math.max(0, f.grabLunge - dt * 2);
}

export function farmerGainOnStumble(f) {
  f.gap = Math.max(0, f.gap * 0.88 - 6);
}

export function farmerPushedByDash(f) {
  f.gap = Math.min(MAX_GAP, f.gap + 66);
}

export function farmerDanger(f) {
  // 0 = far behind, 1 = fingers on tail feathers. Drives the HUD meter.
  return clamp(1 - f.gap / 340, 0, 1);
}

function drawKnife(ctx, x, y, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = "#3a3a3c";
  ctx.fillRect(-4, -3, 16, 7);
  const grad = ctx.createLinearGradient(12, 0, 46, 0);
  grad.addColorStop(0, "#cfd6dd");
  grad.addColorStop(1, "#f4f8fb");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(12, -5);
  ctx.lineTo(46, -1);
  ctx.lineTo(12, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawFarmer(ctx, f, time) {
  const x = farmerX(f);
  if (x < -130) return;
  const feetY = GROUND_Y;
  const run = f.runPhase;
  ctx.save();
  ctx.translate(x, feetY);

  // Legs in overalls, pumping opposite the arms
  ctx.strokeStyle = "#1b4d3e";
  ctx.lineWidth = 13;
  ctx.lineCap = "round";
  for (let i = 0; i < 2; i++) {
    const phase = run + i * Math.PI;
    const swing = Math.cos(phase) * 17;
    const lift = Math.max(0, Math.sin(phase)) * 11;
    ctx.beginPath();
    ctx.moveTo(-6 + i * 14, -52);
    ctx.lineTo(-6 + i * 14 + swing * 0.5, -26 - lift * 0.3);
    ctx.lineTo(-6 + i * 14 + swing, -lift);
    ctx.stroke();
    ctx.fillStyle = "#2b1b0e";
    ctx.fillRect(-12 + i * 14 + swing, -8 - lift, 20, 8);
  }

  // Torso: shirt and overall bib
  ctx.fillStyle = "#e0c097";
  ctx.fillRect(-24, -108, 52, 58);
  ctx.fillStyle = "#1b4d3e";
  ctx.fillRect(-20, -84, 44, 34);
  ctx.fillRect(-20, -108, 7, 26);
  ctx.fillRect(17, -108, 7, 26);

  // Back arm pumps; front arm reaches as the gap closes
  ctx.strokeStyle = "#d9a47e";
  ctx.lineWidth = 11;
  const backSwing = Math.cos(run) * 15;
  ctx.beginPath();
  ctx.moveTo(-18, -100);
  ctx.lineTo(-30, -74 + backSwing * 0.3);
  ctx.lineTo(-26, -52 + backSwing);
  ctx.stroke();
  const reach = f.grabLunge * 34;
  const frontSwing = Math.cos(run + Math.PI) * 10;
  ctx.beginPath();
  ctx.moveTo(22, -100);
  ctx.lineTo(38 + reach * 0.5, -78 + frontSwing * 0.3);
  ctx.lineTo(48 + reach, -64 + frontSwing);
  ctx.stroke();

  // The knife comes out when he can smell the feathers
  if (f.gap < 215) {
    drawKnife(ctx, 52 + reach, -60 + frontSwing, 0.25 + Math.sin(time * 7) * 0.08);
  } else {
    ctx.fillStyle = "#d9a47e";
    ctx.beginPath();
    ctx.arc(48 + reach, -64 + frontSwing, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head, beard and straw hat
  ctx.fillStyle = "#d9a47e";
  ctx.beginPath();
  ctx.arc(2, -126, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff8f0";
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-4 + i * 6, -112, 6, 0.3, Math.PI - 0.4);
    ctx.stroke();
  }
  ctx.fillStyle = "#1a0d0a";
  ctx.beginPath();
  ctx.arc(9, -129, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c9a227";
  ctx.beginPath();
  ctx.ellipse(2, -142, 30, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -166, 30, 24);
  ctx.beginPath();
  ctx.ellipse(2, -166, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
