// The HUD a screenshot has to sell in one glance: score and distance
// up top, three turkey-head lives, a combo bar that fills gold, a
// pardon-progress ribbon (farm gate → forest), and a FARMER meter
// that reddens as his hand closes on the tail feathers.

import { VIEW_W } from "./world.js";
import { formatMeters, formatScore } from "./utils.js";

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(16,8,6,0.55)";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
}

function drawTurkeyHead(ctx, x, y, alive) {
  ctx.save();
  ctx.globalAlpha = alive ? 1 : 0.25;
  ctx.fillStyle = "#8a5a33";
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f39c12";
  ctx.beginPath();
  ctx.moveTo(x + 9, y - 3);
  ctx.lineTo(x + 19, y + 1);
  ctx.lineTo(x + 9, y + 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c41e3a";
  ctx.beginPath();
  ctx.ellipse(x + 4, y + 10, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff8f0";
  ctx.beginPath();
  ctx.arc(x + 4, y - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a0d0a";
  ctx.beginPath();
  ctx.arc(x + 5, y - 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawHUD(ctx, s) {
  // Score + distance, top-left
  panel(ctx, 18, 16, 300, 86);
  ctx.fillStyle = "#fff8f0";
  ctx.textAlign = "left";
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.fillText(formatScore(s.score), 36, 56);
  ctx.font = "bold 19px system-ui, sans-serif";
  ctx.fillStyle = "#ffb347";
  ctx.fillText(formatMeters(s.distanceM), 36, 86);
  ctx.fillStyle = "#fff8f0";
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.fillText("to the pardon line", 118, 86);

  // Lives, top-center-left as turkey heads
  for (let i = 0; i < 3; i++) drawTurkeyHead(ctx, 356 + i * 40, 42, i < s.lives);
  if (s.turkey.shield) {
    ctx.fillStyle = "#fff8f0";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText("SHIELD UP", 332, 84);
  }

  // Combo, under the lives
  if (s.combo > 1) {
    ctx.fillStyle = "rgba(16,8,6,0.55)";
    ctx.beginPath();
    ctx.roundRect(332, 96, 150, 16, 8);
    ctx.fill();
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.roundRect(334, 98, Math.min(146, (s.combo / 20) * 146), 12, 6);
    ctx.fill();
    ctx.fillStyle = "#fff8f0";
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.fillText(`COMBO x${s.multiplier.toFixed(1)}`, 492, 110);
  }

  // Pardon progress ribbon, top-right
  panel(ctx, VIEW_W - 330, 16, 312, 60);
  ctx.fillStyle = "#fff8f0";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("FARM", VIEW_W - 312, 40);
  ctx.textAlign = "right";
  ctx.fillText("FOREST = PARDON", VIEW_W - 36, 40);
  ctx.fillStyle = "rgba(255,248,240,0.25)";
  ctx.beginPath();
  ctx.roundRect(VIEW_W - 312, 50, 276, 10, 5);
  ctx.fill();
  ctx.fillStyle = "#7fb069";
  ctx.beginPath();
  ctx.roundRect(VIEW_W - 312, 50, Math.max(10, s.progress * 276), 10, 5);
  ctx.fill();
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.arc(VIEW_W - 312 + s.progress * 276, 55, 7, 0, Math.PI * 2);
  ctx.fill();

  // Farmer danger meter, bottom-left: quiet green, loud red
  const danger = s.farmerDanger;
  panel(ctx, 18, 716, 250, 52);
  ctx.fillStyle = "#fff8f0";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("FARMER", 34, 738);
  ctx.fillStyle = "rgba(255,248,240,0.22)";
  ctx.beginPath();
  ctx.roundRect(34, 746, 218, 12, 6);
  ctx.fill();
  ctx.fillStyle = danger > 0.72 ? "#ff3300" : danger > 0.45 ? "#ff8800" : "#7fb069";
  ctx.beginPath();
  ctx.roundRect(34, 746, Math.max(12, danger * 218), 12, 6);
  ctx.fill();
  if (danger > 0.72) {
    ctx.fillStyle = "#ff5533";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.fillText("HE'S ON YOUR TAIL!", 34, 706);
  }

  // Speed + controls reminder, bottom-right
  ctx.fillStyle = "rgba(255,248,240,0.75)";
  ctx.font = "15px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`SPEED x${(s.speed / 330).toFixed(1)}`, VIEW_W - 24, 738);
  ctx.fillText("SPACE jump x2 · ↓ duck · D gobble-dash · P pause", VIEW_W - 24, 762);
}
