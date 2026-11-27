// The farm the turkey runs through: a day-progress sunset sky, a sun
// that sinks as the pardon line nears, layered parallax (hills, pine
// trees, cloud streaks, fences), the dirt track and a fast foreground
// of grass tufts that sells the speed. All procedural canvas drawing.

import { clamp, hash01, lerp, mixHex, smoothstep } from "./utils.js";

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const GROUND_Y = 620;

function drawSky(ctx, dusk) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, mixHex("#2c1a3a", "#0b0812", dusk));
  grad.addColorStop(0.45, mixHex("#e86c00", "#8b2e16", dusk));
  grad.addColorStop(0.85, mixHex("#ffb347", "#ff6b00", dusk));
  grad.addColorStop(1, mixHex("#ffc46b", "#ff7b1c", dusk));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y + 2);
}

function drawSun(ctx, dusk) {
  const x = 980;
  const y = lerp(215, 330, dusk);
  const r = lerp(52, 38, dusk);
  const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 3.4);
  glow.addColorStop(0, "rgba(255,214,120,0.55)");
  glow.addColorStop(1, "rgba(255,140,40,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 3.4, y - r * 3.4, r * 6.8, r * 6.8);
  ctx.fillStyle = mixHex("#fff3c0", "#ff8800", dusk);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawStars(ctx, dusk) {
  const alpha = smoothstep(0.7, 0.95, dusk);
  if (alpha <= 0) return;
  ctx.fillStyle = "#fff8f0";
  for (let i = 0; i < 70; i++) {
    const x = hash01(i * 3 + 1) * VIEW_W;
    const y = hash01(i * 7 + 2) * 300;
    ctx.globalAlpha = alpha * (0.25 + hash01(i * 13) * 0.6);
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawHills(ctx, camX, dusk) {
  // Hills are indexed by WORLD segment, like the pines and fences:
  // each segment's peak height is hashed from its integer index, so a
  // hill keeps its shape and only translates as the world scrolls.
  // (Hashing the screen-space x instead made every peak re-roll its
  // height each frame — the range visibly trembled.)
  const seg = 400;
  const scroll = camX * 0.05;
  const first = Math.floor(scroll / seg) - 1;
  ctx.fillStyle = mixHex("#3a2140", "#160b20", dusk);
  ctx.beginPath();
  ctx.moveTo(first * seg - scroll, GROUND_Y);
  for (let i = first; i * seg - scroll < VIEW_W + seg; i++) {
    const x = i * seg - scroll;
    ctx.quadraticCurveTo(x + 200, GROUND_Y - 190 - hash01(i * 7 + 3) * 60, x + seg, GROUND_Y - 40);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function drawPines(ctx, camX, dusk) {
  const spacing = 260;
  const off = (camX * 0.15) % spacing;
  ctx.fillStyle = mixHex("#33200f", "#140a06", dusk);
  const first = Math.floor(camX * 0.15 / spacing) - 1;
  for (let i = 0; i < 8; i++) {
    const idx = first + i;
    const x = idx * spacing - camX * 0.15 + hash01(idx) * 90;
    const h = 120 + hash01(idx * 3) * 90;
    const base = GROUND_Y - 6;
    ctx.fillRect(x - 5, base - h * 0.25, 10, h * 0.25);
    for (let tier = 0; tier < 3; tier++) {
      const w = (h * 0.62) * (1 - tier * 0.26);
      const y = base - h * 0.2 - tier * h * 0.24;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x + w / 2, y);
      ctx.lineTo(x, y - h * 0.34);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawClouds(ctx, camX, time) {
  const off = (camX * 0.3) % 2400;
  ctx.fillStyle = "rgba(255,179,71,0.16)";
  for (let i = 0; i < 6; i++) {
    const x = i * 420 - off + hash01(i * 11) * 160;
    const y = 60 + hash01(i * 5) * 190 + Math.sin(time * 0.3 + i) * 4;
    ctx.beginPath();
    ctx.ellipse(x, y, 130, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 60, y + 7, 90, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBarn(ctx, camX, dusk) {
  // One big barn in the mid layer, passing every ~2600 px of world.
  const period = 2600;
  const x = period - ((camX * 0.6) % period) - 420;
  if (x < -460 || x > VIEW_W + 60) return;
  const base = GROUND_Y - 4;
  ctx.fillStyle = mixHex("#7e2f1d", "#38130c", dusk);
  ctx.fillRect(x, base - 150, 300, 150);
  ctx.beginPath();
  ctx.moveTo(x - 18, base - 150);
  ctx.lineTo(x + 150, base - 228);
  ctx.lineTo(x + 318, base - 150);
  ctx.closePath();
  ctx.fillStyle = mixHex("#5d2113", "#2a0e08", dusk);
  ctx.fill();
  ctx.fillStyle = mixHex("#f5e6c8", "#8f7a5c", dusk);
  ctx.fillRect(x + 118, base - 96, 64, 96);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 5;
  ctx.strokeRect(x + 118, base - 96, 64, 96);
  ctx.beginPath();
  ctx.moveTo(x + 118, base - 96);
  ctx.lineTo(x + 182, base);
  ctx.moveTo(x + 182, base - 96);
  ctx.lineTo(x + 118, base);
  ctx.stroke();
  ctx.fillStyle = mixHex("#f8ecd2", "#97a0b0", dusk);
  ctx.fillRect(x + 132, base - 196, 36, 30);
}

function drawFences(ctx, camX) {
  const spacing = 92;
  const off = (camX * 0.6) % spacing;
  ctx.fillStyle = "#5c3a21";
  const first = Math.floor(camX * 0.6 / spacing);
  for (let i = -1; i < 16; i++) {
    const x = (first + i) * spacing - camX * 0.6 + 30;
    ctx.fillRect(x, GROUND_Y - 64, 9, 64);
  }
  ctx.fillRect(-off - spacing, GROUND_Y - 52, VIEW_W + spacing * 2, 6);
  ctx.fillRect(-off - spacing, GROUND_Y - 26, VIEW_W + spacing * 2, 6);
}

function drawGround(ctx, camX) {
  ctx.fillStyle = "#3d2b1f";
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = "#5c3a21";
  ctx.fillRect(0, GROUND_Y, VIEW_W, 7);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  const spacing = 120;
  const off = camX % spacing;
  for (let x = -off; x < VIEW_W; x += spacing) {
    ctx.fillRect(x + 18, GROUND_Y + 42, 52, 6);
    ctx.fillRect(x + 62, GROUND_Y + 108, 38, 6);
  }
}

function drawForegroundGrass(ctx, camX, time) {
  const spacing = 74;
  const off = (camX * 1.15) % spacing;
  ctx.fillStyle = "#2e2015";
  const first = Math.floor(camX * 1.15 / spacing);
  for (let i = -1; i < 20; i++) {
    const idx = first + i;
    const x = idx * spacing - camX * 1.15;
    const sway = Math.sin(time * 6 + idx) * 3;
    const h = 20 + hash01(idx * 7) * 16;
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H);
    ctx.lineTo(x + 5 + sway, VIEW_H - h);
    ctx.lineTo(x + 11, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }
}

// dusk: 0 at the farm gate, 1 at the pardon line (distance / finish).
export function drawWorld(ctx, camX, dusk, time) {
  const d = clamp(dusk, 0, 1);
  drawSky(ctx, d);
  drawStars(ctx, d);
  drawSun(ctx, d);
  drawHills(ctx, camX, d);
  drawPines(ctx, camX, d);
  drawClouds(ctx, camX, time);
  drawBarn(ctx, camX, d);
  drawFences(ctx, camX);
  drawGround(ctx, camX);
}

export function drawForeground(ctx, camX, time) {
  drawForegroundGrass(ctx, camX, time);
}
