// What the farm throws at the turkey: a brick oven to leap, a carving
// knife sailing at head height, a rolling barrel, and a spring-loaded
// pilgrim hat trap. A distance-based spawner deals them in patterns
// with a fair gap that tightens as the run speeds up.

import { GROUND_Y } from "./world.js";

export function createSpawner(rng) {
  return { nextAt: 900, rng };
}

const KINDS = ["oven", "knife", "barrel", "hat"];

export function spawnObstacles(spawner, camX, distanceM, out) {
  while (camX + 1500 > spawner.nextAt) {
    const x = spawner.nextAt;
    const roll = spawner.rng();
    let kind;
    if (distanceM < 60) kind = roll < 0.6 ? "oven" : "barrel";
    else if (roll < 0.3) kind = "oven";
    else if (roll < 0.55) kind = "knife";
    else if (roll < 0.8) kind = "barrel";
    else kind = "hat";
    out.push(makeObstacle(kind, x, spawner.rng));
    const tier = Math.floor(distanceM / 250);
    const gap = Math.max(430, 640 - tier * 26) + spawner.rng() * 260;
    spawner.nextAt += gap;
  }
}

function makeObstacle(kind, x, rng) {
  const base = { kind, x, phase: rng() * Math.PI * 2, dead: false };
  if (kind === "oven") return { ...base, w: 76, h: 84 };
  if (kind === "knife") return { ...base, w: 70, h: 18, hoverH: 70 };
  if (kind === "barrel") return { ...base, w: 58, h: 58, roll: 0 };
  return { ...base, w: 58, h: 76, cycle: rng() * 2.5 };
}

export function updateObstacles(list, dt) {
  for (const o of list) {
    if (o.kind === "barrel") {
      o.x -= 132 * dt; // barrels roll toward the turkey
      o.roll -= dt * 4.4;
    }
    if (o.kind === "hat") o.cycle = (o.cycle + dt) % 2.5;
  }
}

export function hatExtended(o) {
  return o.cycle > 1.9; // popped for the last 0.6 s of each cycle
}

export function obstacleBox(o, screenX) {
  if (o.kind === "oven") return { x: screenX, y: GROUND_Y - o.h, w: o.w, h: o.h };
  if (o.kind === "knife") {
    const bob = Math.sin(o.phase) * 0; // bob applied in draw+box via time below
    return { x: screenX, y: GROUND_Y - o.hoverH - 9 + bob, w: o.w, h: o.h };
  }
  if (o.kind === "barrel") return { x: screenX, y: GROUND_Y - o.h, w: o.w, h: o.h };
  if (o.kind === "hat") {
    if (!hatExtended(o)) return null;
    return { x: screenX, y: GROUND_Y - o.h, w: o.w, h: o.h };
  }
  return null;
}

export function knifeBob(o, time) {
  return Math.sin(time * 7.5 + o.phase) * 13;
}

function drawOven(ctx, o, sx, time) {
  const top = GROUND_Y - o.h;
  ctx.fillStyle = "#6e3b2a";
  ctx.fillRect(sx, top + 14, o.w, o.h - 14);
  ctx.fillStyle = "#7d4630";
  ctx.fillRect(sx - 4, top + 6, o.w + 8, 12);
  ctx.fillStyle = "#4c4c50";
  ctx.fillRect(sx + o.w - 20, top - 16, 12, 24);
  ctx.fillStyle = "rgba(200,200,200,0.5)";
  ctx.beginPath();
  ctx.arc(sx + o.w - 14 + Math.sin(time * 2 + o.phase) * 3, top - 30, 6, 0, Math.PI * 2);
  ctx.arc(sx + o.w - 10, top - 46, 8, 0, Math.PI * 2);
  ctx.fill();
  // The glowing door is the whole point of the thing
  const flicker = 0.82 + Math.sin(time * 11 + o.phase) * 0.18;
  const grad = ctx.createRadialGradient(sx + o.w / 2, top + 58, 4, sx + o.w / 2, top + 58, 30);
  grad.addColorStop(0, `rgba(255,214,90,${flicker})`);
  grad.addColorStop(1, `rgba(255,51,0,${flicker})`);
  ctx.fillStyle = grad;
  ctx.fillRect(sx + 12, top + 34, o.w - 24, 44);
  ctx.strokeStyle = "#2b1b0e";
  ctx.lineWidth = 4;
  ctx.strokeRect(sx + 12, top + 34, o.w - 24, 44);
  ctx.beginPath();
  ctx.moveTo(sx + 12, top + 56);
  ctx.lineTo(sx + o.w - 12, top + 56);
  ctx.stroke();
}

function drawKnife(ctx, o, sx, time) {
  const cy = GROUND_Y - o.hoverH + knifeBob(o, time);
  ctx.save();
  ctx.translate(sx + o.w / 2, cy);
  ctx.rotate(Math.sin(time * 7.5 + o.phase) * 0.1);
  const grad = ctx.createLinearGradient(-o.w / 2, 0, o.w / 2, 0);
  grad.addColorStop(0, "#e8eef3");
  grad.addColorStop(0.5, "#fbfdff");
  grad.addColorStop(1, "#b9c4cd");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-o.w / 2, -8);
  ctx.lineTo(o.w / 2 - 14, -3);
  ctx.lineTo(o.w / 2, 0);
  ctx.lineTo(o.w / 2 - 14, 4);
  ctx.lineTo(-o.w / 2, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3a3a3c";
  ctx.fillRect(o.w / 2 - 16, -5, 17, 10);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(-o.w / 2 + 6, -5, 20, 3);
  ctx.restore();
  // Motion streaks so the knife reads as thrown, not parked
  ctx.strokeStyle = "rgba(255,248,240,0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const y = cy - 8 + i * 8;
    ctx.beginPath();
    ctx.moveTo(sx + o.w + 8, y);
    ctx.lineTo(sx + o.w + 30 + i * 7, y);
    ctx.stroke();
  }
}

function drawBarrel(ctx, o, sx) {
  const cx = sx + o.w / 2;
  const cy = GROUND_Y - o.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(o.roll);
  ctx.fillStyle = "#8a5a33";
  ctx.beginPath();
  ctx.arc(0, 0, o.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5d3a1e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, o.w / 2 - 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.fillRect(-3, -o.w / 2 + 4, 6, 14);
  }
  ctx.restore();
}

function drawHat(ctx, o, sx) {
  const extended = hatExtended(o);
  const h = extended ? o.h : 26;
  const top = GROUND_Y - h;
  // Spring housing always visible; the hat itself pops
  ctx.fillStyle = "#3a3a3c";
  ctx.fillRect(sx + 6, GROUND_Y - 14, o.w - 12, 14);
  if (o.cycle > 1.55 && !extended) {
    ctx.fillStyle = "#ff3300";
    ctx.beginPath();
    ctx.arc(sx + o.w / 2, GROUND_Y - 20, 4 + Math.sin(o.cycle * 30) * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#191922";
  ctx.fillRect(sx + 8, top, o.w - 16, h - 8);
  ctx.beginPath();
  ctx.ellipse(sx + o.w / 2, GROUND_Y - 6, o.w / 2 + 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c9a227";
  ctx.fillRect(sx + o.w / 2 - 9, top + h * 0.45, 18, 11);
}

export function drawObstacle(ctx, o, screenX, time) {
  if (o.kind === "oven") drawOven(ctx, o, screenX, time);
  else if (o.kind === "knife") drawKnife(ctx, o, screenX, time);
  else if (o.kind === "barrel") drawBarrel(ctx, o, screenX);
  else drawHat(ctx, o, screenX);
}
