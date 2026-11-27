// The particle layer: dust at the turkey's feet, farmer boot puffs,
// dash trails, pickup starbursts, oven shards, stumble feathers and
// the confetti that rains on the pardon line. One pooled array, every
// effect a spawn function, drawn as simple shapes with a life fade.

const MAX = 420;
const pool = [];

function spawn(p) {
  if (pool.length >= MAX) pool.shift();
  pool.push(p);
}

export function burstFeathers(x, y) {
  for (let i = 0; i < 10; i++) {
    spawn({
      kind: "feather", x, y,
      vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 260 - 40,
      life: 0, ttl: 0.9 + Math.random() * 0.3, rot: Math.random() * 6,
    });
  }
}

export function burstPickup(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    spawn({
      kind: "spark", x, y, color,
      vx: Math.cos(a) * 150, vy: Math.sin(a) * 150 - 60,
      life: 0, ttl: 0.45, rot: a,
    });
  }
}

export function burstShards(x, y) {
  for (let i = 0; i < 16; i++) {
    spawn({
      kind: "shard", x, y,
      vx: (Math.random() - 0.3) * 420, vy: -Math.random() * 320,
      life: 0, ttl: 0.7, rot: Math.random() * 6,
    });
  }
}

export function puffDust(x, y, big = false) {
  spawn({
    kind: "dust", x: x + (Math.random() - 0.5) * 14, y,
    vx: -40 - Math.random() * 40, vy: -18 - Math.random() * 22,
    life: 0, ttl: big ? 0.55 : 0.35, rot: 0, size: big ? 13 : 8,
  });
}

export function dashTrail(x, y) {
  spawn({ kind: "trail", x, y, vx: -120, vy: 0, life: 0, ttl: 0.16, rot: 0 });
}

export function confetti(x, y) {
  const colors = ["#ffd700", "#ff8800", "#f5e6c8", "#c41e3a", "#7fb069"];
  for (let i = 0; i < 46; i++) {
    spawn({
      kind: "confetti", x: x + (Math.random() - 0.5) * 500, y: y - Math.random() * 120,
      vx: (Math.random() - 0.5) * 90, vy: 30 + Math.random() * 90,
      life: 0, ttl: 1.6 + Math.random(), rot: Math.random() * 6,
      color: colors[i % colors.length],
    });
  }
}

export function updateParticles(dt) {
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i];
    p.life += dt;
    if (p.life >= p.ttl) { pool.splice(i, 1); continue; }
    if (p.kind === "feather" || p.kind === "shard") p.vy += 620 * dt;
    if (p.kind === "confetti") p.vy += 26 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += dt * 4;
  }
}

export function drawParticles(ctx) {
  for (const p of pool) {
    const fade = 1 - p.life / p.ttl;
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);
    ctx.translate(p.x, p.y);
    if (p.kind === "feather") {
      ctx.rotate(p.rot);
      ctx.fillStyle = "#f5e6c8";
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "spark") {
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color || "#ffd700";
      ctx.fillRect(-9, -2, 18, 4);
    } else if (p.kind === "shard") {
      ctx.rotate(p.rot);
      ctx.fillStyle = "#3a3a3c";
      ctx.fillRect(-5, -5, 10, 10);
    } else if (p.kind === "dust") {
      ctx.fillStyle = "#6b4423";
      ctx.beginPath();
      ctx.arc(0, 0, (p.size || 8) * (0.6 + p.life), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "trail") {
      ctx.fillStyle = "#ff8800";
      ctx.fillRect(-14, -3, 28, 6);
    } else if (p.kind === "confetti") {
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-5, -3, 10, 6);
    }
    ctx.restore();
  }
}

export function clearParticles() {
  pool.length = 0;
}
