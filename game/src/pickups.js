// What the farm gives back: golden corn dealt in arcs and lines (the
// score path a good player reads ahead), a rare pumpkin pie that
// brings turbo speed and a feather shield, and pilgrim feathers that
// bank a hover flap. Spawned in patterns tied to the obstacle rhythm.

import { GROUND_Y } from "./world.js";

export const PICKUP_VALUES = { corn: 50, pie: 200, feather: 100 };

export function createPickupSpawner(rng) {
  return { nextAt: 620, rng };
}

export function spawnPickups(spawner, camX, out) {
  while (camX + 1500 > spawner.nextAt) {
    const x = spawner.nextAt;
    const roll = spawner.rng();
    if (roll < 0.62) {
      // Corn arc: six kernels over a jump-shaped curve
      const peak = 60 + spawner.rng() * 110;
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        out.push({ kind: "corn", x: x + i * 44, h: 26 + Math.sin(t * Math.PI) * peak, taken: false, phase: i * 0.6 });
      }
      spawner.nextAt += 340 + spawner.rng() * 160;
    } else if (roll < 0.8) {
      // Corn line at duck height — reward for staying low
      for (let i = 0; i < 5; i++) {
        out.push({ kind: "corn", x: x + i * 42, h: 22, taken: false, phase: i * 0.6 });
      }
      spawner.nextAt += 300 + spawner.rng() * 140;
    } else if (roll < 0.9) {
      out.push({ kind: "feather", x, h: 150 + spawner.rng() * 40, taken: false, phase: 0 });
      spawner.nextAt += 380;
    } else {
      out.push({ kind: "pie", x, h: 84, taken: false, phase: 0 });
      spawner.nextAt += 460;
    }
  }
}

export function pickupBox(p, screenX) {
  return { x: screenX - 15, y: GROUND_Y - p.h - 15, w: 30, h: 30 };
}

function drawCorn(ctx, sx, cy, time, phase) {
  const bob = Math.sin(time * 3 + phase) * 3;
  ctx.save();
  ctx.translate(sx, cy + bob);
  ctx.rotate(Math.sin(time * 2 + phase) * 0.14);
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d9a400";
  ctx.lineWidth = 1.6;
  for (let r = -1; r <= 1; r++) {
    ctx.beginPath();
    ctx.moveTo(-8, r * 6);
    ctx.lineTo(8, r * 6);
    ctx.stroke();
  }
  ctx.fillStyle = "#7fb069";
  ctx.beginPath();
  ctx.ellipse(-7, 9, 7, 4, -0.7, 0, Math.PI * 2);
  ctx.ellipse(7, 9, 7, 4, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPie(ctx, sx, cy, time) {
  const bob = Math.sin(time * 2.4) * 4;
  ctx.save();
  ctx.translate(sx, cy + bob);
  ctx.fillStyle = "#d2691e";
  ctx.beginPath();
  ctx.moveTo(-19, -8);
  ctx.lineTo(19, -8);
  ctx.lineTo(0, 17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ff9d2e";
  ctx.beginPath();
  ctx.moveTo(-15, -8);
  ctx.lineTo(15, -8);
  ctx.lineTo(0, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff3e0";
  ctx.beginPath();
  ctx.arc(0, -11, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFeather(ctx, sx, cy, time, phase) {
  const bob = Math.sin(time * 2 + phase) * 5;
  ctx.save();
  ctx.translate(sx, cy + bob);
  ctx.rotate(Math.sin(time * 1.6 + phase) * 0.3);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 17, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#cbbfa5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, 14);
  ctx.lineTo(3, -14);
  ctx.stroke();
  ctx.restore();
}

export function drawPickup(ctx, p, screenX, time) {
  const cy = GROUND_Y - p.h;
  if (p.kind === "corn") drawCorn(ctx, screenX, cy, time, p.phase);
  else if (p.kind === "pie") drawPie(ctx, screenX, cy, time);
  else drawFeather(ctx, screenX, cy, time, p.phase);
}
