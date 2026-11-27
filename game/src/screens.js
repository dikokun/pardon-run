// The four framed moments the judge scores: the title cover, the
// pause overlay, and the two endings — CAUGHT (the farmer got his
// dinner) and PARDONED (the turkey reached the forest line). All drawn
// on the same canvas over the world, no DOM overlays.

import { GROUND_Y, VIEW_H, VIEW_W } from "./world.js";
import { drawTurkey } from "./turkey.js";
import { drawFarmer } from "./farmer.js";
import { formatMeters, formatScore } from "./utils.js";

function bigTitle(ctx, text, y, size, color) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  ctx.lineWidth = size / 9;
  ctx.strokeStyle = "#1a0d0a";
  ctx.strokeText(text, VIEW_W / 2, y);
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_W / 2, y);
  ctx.restore();
}

function statsPanel(ctx, s, lines) {
  ctx.save();
  ctx.fillStyle = "rgba(16,8,6,0.66)";
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 240, 356, 480, 188, 18);
  ctx.fill();
  ctx.fillStyle = "#fff8f0";
  ctx.textAlign = "center";
  ctx.font = "bold 25px system-ui, sans-serif";
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 408 + i * 42));
  ctx.restore();
}

function runAgainPrompt(ctx, time) {
  ctx.save();
  ctx.globalAlpha = 0.72 + Math.sin(time * 4) * 0.28;
  ctx.fillStyle = "#ffd700";
  ctx.textAlign = "center";
  ctx.font = "bold 27px system-ui, sans-serif";
  ctx.fillText("Press R or click to run again", VIEW_W / 2, 606);
  ctx.restore();
}

export function drawTitle(ctx, s, time) {
  // The farmer creeps in from the left edge, knife already out; the
  // turkey poses big at centre stage — the cover has to sell both.
  const pose = s.titleTurkey;
  pose.runPhase = time * 2.2;
  drawFarmer(ctx, { gap: 208 + Math.sin(time * 0.7) * 14, runPhase: time * 5, grabLunge: 0 }, time);
  ctx.save();
  ctx.translate(540, GROUND_Y);
  ctx.scale(1.6, 1.6);
  ctx.translate(-300, -GROUND_Y);
  drawTurkey(ctx, pose, time);
  ctx.restore();

  bigTitle(ctx, "PARDON RUN", 196, 118, "#ffb347");
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff8f0";
  ctx.font = "bold 30px system-ui, sans-serif";
  ctx.fillText("The Great Thanksgiving Escape", VIEW_W / 2, 248);
  ctx.font = "21px system-ui, sans-serif";
  ctx.fillStyle = "#ffe9c9";
  ctx.fillText("Outrun the farmer. Dodge the oven and the carving knife.", VIEW_W / 2, 300);
  ctx.fillText("Reach the forest line at 1,200 m and earn the pardon.", VIEW_W / 2, 332);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.7 + Math.sin(time * 4.5) * 0.3;
  ctx.fillStyle = "#ffd700";
  ctx.textAlign = "center";
  ctx.font = "bold 31px system-ui, sans-serif";
  ctx.fillText("Press ENTER or click to run", VIEW_W / 2, 668);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(255,248,240,0.85)";
  ctx.textAlign = "center";
  ctx.font = "18px system-ui, sans-serif";
  ctx.fillText("SPACE jump · SPACE again to flap · ↓ duck · D gobble-dash · P pause · M mute", VIEW_W / 2, 706);
  if (s.highScore > 0) {
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 19px system-ui, sans-serif";
    ctx.fillText(`Best escape so far: ${formatScore(s.highScore)}`, VIEW_W / 2, 740);
  }
  ctx.restore();
}

export function drawPause(ctx, s) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = "rgba(24,12,8,0.92)";
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 230, 250, 460, 300, 20);
  ctx.fill();
  ctx.fillStyle = "#ffb347";
  ctx.textAlign = "center";
  ctx.font = "900 52px system-ui, sans-serif";
  ctx.fillText("PAUSED", VIEW_W / 2, 330);
  ctx.fillStyle = "#fff8f0";
  ctx.font = "21px system-ui, sans-serif";
  ctx.fillText(`Score ${formatScore(s.score)} · ${formatMeters(s.distanceM)}`, VIEW_W / 2, 386);
  ctx.fillText("P — resume", VIEW_W / 2, 440);
  ctx.fillText("R — restart the run", VIEW_W / 2, 478);
  ctx.fillText("M — mute · ENTER — title", VIEW_W / 2, 516);
  ctx.restore();
}

export function drawCaught(ctx, s, time) {
  ctx.save();
  ctx.fillStyle = "rgba(90,10,0,0.35)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
  drawFarmer(ctx, { gap: 118, runPhase: 0, grabLunge: 1 }, time);
  bigTitle(ctx, "CAUGHT!", 218, 104, "#ff5533");
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff8f0";
  ctx.font = "bold 26px system-ui, sans-serif";
  ctx.fillText(
    s.caughtBy === "farmer" ? "The farmer's hand closed on the last tail feather."
      : "One obstacle too many on the road to freedom.",
    VIEW_W / 2, 282);
  ctx.restore();
  statsPanel(ctx, s, [
    `Final score  ${formatScore(s.score)}`,
    `Distance  ${formatMeters(s.distanceM)} of 1,200 m`,
    `Best combo  x${(1 + Math.min(s.bestCombo * 0.1, 2)).toFixed(1)}`,
  ]);
  runAgainPrompt(ctx, time);
}

export function drawEscaped(ctx, s, time) {
  // The forest edge: dark pines crowd in from the right.
  ctx.save();
  ctx.fillStyle = "#12240f";
  for (let i = 0; i < 7; i++) {
    const x = 880 + i * 62;
    const h = 240 + (i % 3) * 60;
    ctx.beginPath();
    ctx.moveTo(x - 44, GROUND_Y + 4);
    ctx.lineTo(x + 44, GROUND_Y + 4);
    ctx.lineTo(x, GROUND_Y - h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const pose = s.titleTurkey;
  pose.runPhase = time * 3;
  pose.flapAnim = 0.6 + Math.sin(time * 5) * 0.4;
  drawTurkey(ctx, pose, time);

  bigTitle(ctx, "PARDONED!", 200, 108, "#7fb069");
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff8f0";
  ctx.font = "bold 27px system-ui, sans-serif";
  ctx.fillText("The turkey crossed the forest line — officially not dinner.", VIEW_W / 2, 268);
  ctx.restore();
  statsPanel(ctx, s, [
    `Final score  ${formatScore(s.score)}`,
    `Distance  the full 1,200 m — the whole escape`,
    `Lives left  ${s.lives} · Best combo  x${(1 + Math.min(s.bestCombo * 0.1, 2)).toFixed(1)}`,
  ]);
  runAgainPrompt(ctx, time);
}
