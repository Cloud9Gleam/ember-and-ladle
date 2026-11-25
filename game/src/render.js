// Ember & Ladle — every pixel the player sees. Plain Canvas 2D, no images:
// the wall, the counters, the tickets and every dish are drawn from shapes,
// so the game ships no assets and loads nothing over the network.

import {
  BINS,
  DISHES,
  FIELD,
  INGREDIENTS,
  LAYOUT,
  PALETTE,
  SHIFT_SECONDS,
  STATIONS,
} from './config.js';
import {
  binRect,
  dishById,
  levelOf,
  plateMatches,
  plateRect,
  serveRect,
  stationRect,
  ticketRect,
  trashRect,
  traySlotRect,
} from './kitchen.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function shadow(ctx, on) {
  ctx.shadowColor = on ? PALETTE.shadow : 'transparent';
  ctx.shadowBlur = on ? 10 : 0;
  ctx.shadowOffsetY = on ? 4 : 0;
}

// ---------------------------------------------------------------- food
// Each ingredient draws itself at (cx, cy) with radius r, as vector shapes.
export function drawIngredient(ctx, ingId, cx, cy, r) {
  const ing = INGREDIENTS[ingId];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(1.5, r * 0.08);
  ctx.strokeStyle = 'rgba(43,29,18,0.55)';
  switch (ingId) {
    case 'bun': {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(0, r * 0.18, r * 0.92, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ing.color2;
      ctx.fillRect(-r * 0.92, r * 0.1, r * 1.84, r * 0.34);
      ctx.fillStyle = '#fff2cf';
      for (const [sx, sy] of [[-0.45, -0.45], [0, -0.62], [0.45, -0.45], [-0.22, -0.28], [0.22, -0.28]]) {
        ctx.beginPath();
        ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'patty': {
      ctx.fillStyle = ing.color;
      rr(ctx, -r, -r * 0.42, r * 2, r * 0.84, r * 0.4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = ing.color2;
      ctx.lineWidth = r * 0.1;
      for (const dx of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(dx * r, -r * 0.3);
        ctx.lineTo(dx * r, r * 0.3);
        ctx.stroke();
      }
      break;
    }
    case 'tomato': {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f2826f';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd9c9';
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34, r * 0.12, r * 0.07, a, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      for (let i = 0; i <= 10; i += 1) {
        const a = (i / 10) * Math.PI * 2;
        const rad = r * (0.82 + 0.16 * Math.sin(a * 3));
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = ing.color2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.quadraticCurveTo(0, r * 0.25, r * 0.6, 0);
      ctx.stroke();
      break;
    }
    case 'cheese': {
      ctx.fillStyle = ing.color;
      ctx.save();
      ctx.rotate(-0.06);
      rr(ctx, -r * 0.95, -r * 0.8, r * 1.9, r * 1.6, r * 0.2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ing.color2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, r * 0.8);
      ctx.quadraticCurveTo(-r * 0.35, r * 1.15, -r * 0.2, r * 0.8);
      ctx.quadraticCurveTo(0, r * 1.05, r * 0.2, r * 0.8);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'pasta': {
      ctx.fillStyle = '#e8e2d4';
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 0.95, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = ing.color2;
      ctx.lineWidth = r * 0.12;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(0, -r * 0.15, r * (0.28 + i * 0.24), Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
      ctx.fillStyle = '#e07840';
      ctx.beginPath();
      ctx.arc(-r * 0.4, -r * 0.3, r * 0.16, 0, Math.PI * 2);
      ctx.arc(r * 0.35, -r * 0.35, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'soup': {
      ctx.fillStyle = '#e8e2d4';
      ctx.beginPath();
      ctx.arc(0, -r * 0.05, r * 0.95, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.05, r * 0.8, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = r * 0.09;
      for (const dx of [-0.35, 0.05]) {
        ctx.beginPath();
        ctx.moveTo(dx * r, -r * 0.5);
        ctx.quadraticCurveTo((dx + 0.2) * r, -r * 0.85, (dx - 0.05) * r, -r * 1.1);
        ctx.stroke();
      }
      break;
    }
    case 'fries': {
      ctx.fillStyle = '#d9482f';
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.2);
      ctx.lineTo(r * 0.8, -r * 0.2);
      ctx.lineTo(r * 0.62, r * 0.95);
      ctx.lineTo(-r * 0.62, r * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ing.color;
      for (let i = -2; i <= 2; i += 1) {
        ctx.save();
        ctx.translate(i * r * 0.32, -r * 0.55);
        ctx.rotate(i * 0.06);
        ctx.fillRect(-r * 0.11, -r * 0.55, r * 0.22, r * 1.1);
        ctx.restore();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, r * 0.35, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d9482f';
      text(ctx, 'F', 0, r * 0.38, r * 0.55, '#d9482f', 'center', '800');
      break;
    }
    case 'sauce': {
      ctx.fillStyle = '#e8e2d4';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.72, r * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e89aab';
      ctx.beginPath();
      ctx.ellipse(-r * 0.2, -r * 0.08, r * 0.3, r * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

// ---------------------------------------------------------------- pieces
function drawPlate(ctx, x, y, w, h, items, highlight) {
  ctx.save();
  shadow(ctx, true);
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = highlight ? PALETTE.green : '#d8cdb2';
  ctx.lineWidth = highlight ? 5 : 2;
  ctx.stroke();
  ctx.fillStyle = '#e9e2cf';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 26, h / 2 - 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Stacked items on the plate, bottom to top.
  const n = items.length;
  items.forEach((item, i) => {
    const cy = y + h / 2 + 34 - i * 26;
    drawIngredient(ctx, item.ing, x + w / 2, cy, 34);
    void n;
  });
}

function progressRing(ctx, cx, cy, r, frac, color) {
  ctx.save();
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(43,29,18,0.2)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac));
  ctx.stroke();
  ctx.restore();
}

function drawStation(ctx, state, station) {
  const rect = stationRect(station);
  const slot = state.stations[station.id];
  ctx.save();
  shadow(ctx, true);
  ctx.fillStyle = PALETTE.counterWood;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.counterWoodDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, rect.x + 6, rect.y + 6, rect.w - 12, 30, 8);
  ctx.fill();
  text(ctx, station.name.toUpperCase(), rect.x + rect.w / 2, rect.y + 22, 13, PALETTE.ink, 'center', '800');
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + 70;
  // The station's own look.
  ctx.save();
  if (station.id === 'grill') {
    ctx.fillStyle = '#3a3a3a';
    rr(ctx, cx - 52, cy - 26, 104, 52, 8);
    ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx - 44, cy + i * 9);
      ctx.lineTo(cx + 44, cy + i * 9);
      ctx.stroke();
    }
    ctx.fillStyle = '#e07840';
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 30);
    ctx.quadraticCurveTo(cx - 14, cy + 12, cx, cy + 30);
    ctx.quadraticCurveTo(cx + 14, cy + 12, cx + 30, cy + 30);
    ctx.fill();
  } else if (station.id === 'chop') {
    ctx.fillStyle = '#e8cf9f';
    rr(ctx, cx - 52, cy - 26, 104, 52, 8);
    ctx.fill();
    ctx.strokeStyle = '#b89b62';
    ctx.stroke();
    ctx.fillStyle = '#c8ccd2';
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 8);
    ctx.lineTo(cx + 30, cy - 8);
    ctx.lineTo(cx + 44, cy + 4);
    ctx.lineTo(cx - 40, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5d4a33';
    ctx.fillRect(cx + 40, cy - 6, 14, 8);
  } else if (station.id === 'pot') {
    ctx.fillStyle = '#5d646c';
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 46, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a3f45';
    ctx.stroke();
    ctx.fillStyle = '#e07840';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 40, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 8);
    ctx.quadraticCurveTo(cx - 8, cy - 26, cx - 14, cy - 38);
    ctx.moveTo(cx + 12, cy - 8);
    ctx.quadraticCurveTo(cx + 20, cy - 26, cx + 14, cy - 38);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#9aa2ab';
    rr(ctx, cx - 52, cy - 30, 104, 60, 10);
    ctx.fill();
    ctx.strokeStyle = '#6d757e';
    ctx.stroke();
    ctx.fillStyle = '#f6d365';
    for (let i = -1; i <= 1; i += 1) ctx.fillRect(cx + i * 16 - 4, cy - 44, 8, 30);
    ctx.fillStyle = '#3a3f45';
    ctx.fillRect(cx - 52, cy + 22, 104, 8);
  }
  ctx.restore();
  if (slot.item) {
    const ing = INGREDIENTS[slot.item.ing];
    if (slot.item.state === 'cooking') {
      drawIngredient(ctx, slot.item.ing, cx, cy, 26);
      progressRing(ctx, cx, cy, 36, slot.item.t / ing.cookSeconds, PALETTE.gold);
      text(ctx, `${Math.ceil(ing.cookSeconds - slot.item.t)}s`, cx, cy + 52, 13, PALETTE.cream, 'center', '800');
    } else if (slot.item.state === 'ready') {
      const pulse = 1 + 0.06 * Math.sin(state.time * 6);
      drawIngredient(ctx, slot.item.ing, cx, cy, 26 * pulse);
      ctx.fillStyle = PALETTE.green;
      rr(ctx, cx - 34, cy - 52, 68, 22, 11);
      ctx.fill();
      text(ctx, 'READY', cx, cy - 41, 12, '#fff', 'center', '800');
    } else {
      drawIngredient(ctx, slot.item.ing, cx, cy, 26);
      ctx.fillStyle = '#241a12';
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'BURNT', cx, cy + 1, 12, '#ffb3a0', 'center', '800');
      text(ctx, 'click to clear', cx, cy + 52, 11, PALETTE.cream, 'center');
    }
  } else {
    text(ctx, 'empty', cx, cy + 52, 12, 'rgba(255,246,227,0.65)', 'center');
  }
}

function drawTicket(ctx, state, order, index) {
  const rect = ticketRect(index);
  const dish = dishById(order.dishId);
  const selected = state.selectedTicket === order.id;
  const matches = plateMatches(state, order);
  const frac = Math.max(0, order.patience / order.patienceMax);
  const patienceColor = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.red;
  ctx.save();
  shadow(ctx, true);
  ctx.fillStyle = PALETTE.ticket;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = matches ? PALETTE.green : selected ? PALETTE.blue : PALETTE.ticketEdge;
  ctx.lineWidth = matches || selected ? 3 : 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = dish.color;
  rr(ctx, rect.x + 10, rect.y + 10, 8, rect.h - 20, 4);
  ctx.fill();
  text(ctx, `#${order.id} ${dish.name}`, rect.x + 28, rect.y + 20, 16, PALETTE.ink, 'left', '800');
  text(ctx, `${dish.reward} coins`, rect.x + rect.w - 12, rect.y + 20, 13, PALETTE.inkSoft, 'right');
  // Needed ingredients as small icons.
  dish.needs.forEach((ing, i) => {
    const ix = rect.x + 40 + i * 44;
    drawIngredient(ctx, ing, ix, rect.y + 52, 15);
    if (state.plate.some((item) => item.ing === ing)) {
      ctx.strokeStyle = PALETTE.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ix, rect.y + 52, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  // Patience bar.
  ctx.fillStyle = 'rgba(43,29,18,0.15)';
  rr(ctx, rect.x + 28, rect.y + 80, rect.w - 56, 10, 5);
  ctx.fill();
  ctx.fillStyle = patienceColor;
  rr(ctx, rect.x + 28, rect.y + 80, Math.max(10, (rect.w - 56) * frac), 10, 5);
  ctx.fill();
  if (matches) {
    ctx.fillStyle = PALETTE.green;
    rr(ctx, rect.x + rect.w - 92, rect.y + 64, 80, 24, 12);
    ctx.fill();
    text(ctx, 'SERVE!', rect.x + rect.w - 52, rect.y + 77, 13, '#fff', 'center', '800');
  }
}

function drawBin(ctx, state, ingId, index) {
  const rect = binRect(index);
  const ing = INGREDIENTS[ingId];
  ctx.save();
  shadow(ctx, true);
  ctx.fillStyle = PALETTE.steel;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.steelDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(43,29,18,0.08)';
  rr(ctx, rect.x + 8, rect.y + 8, rect.w - 16, 46, 8);
  ctx.fill();
  drawIngredient(ctx, ingId, rect.x + rect.w / 2, rect.y + 32, 20);
  text(ctx, ing.name, rect.x + rect.w / 2, rect.y + 66, 13, PALETTE.ink, 'center', '800');
  const key = index + 1;
  text(ctx, `[${key}]`, rect.x + rect.w - 10, rect.y + 16, 11, PALETTE.inkSoft, 'right');
}

function drawTray(ctx, state) {
  const t = LAYOUT.tray;
  text(ctx, 'TRAY — ready items wait here', t.x + 4, t.y - 8, 12, PALETTE.cream, 'left', '700');
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  rr(ctx, t.x, t.y, t.w, t.h, 12);
  ctx.fill();
  ctx.restore();
  state.tray.forEach((ing, i) => {
    const rect = traySlotRect(i);
    ctx.fillStyle = 'rgba(255,246,227,0.12)';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,246,227,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (ing !== null) drawIngredient(ctx, ing.ing, rect.x + rect.w / 2, rect.y + rect.h / 2, 30);
  });
}

function drawHands(ctx, state) {
  const r = LAYOUT.hands;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  text(ctx, 'IN HAND:', r.x + 16, r.y + r.h / 2, 13, PALETTE.cream, 'left', '800');
  if (state.hands !== null) {
    drawIngredient(ctx, state.hands.ing, r.x + 120, r.y + r.h / 2, 22);
    text(ctx, INGREDIENTS[state.hands.ing].name, r.x + 152, r.y + r.h / 2, 15, PALETTE.cream, 'left', '700');
  } else {
    text(ctx, 'empty — click a bin or a tray slot', r.x + 120, r.y + r.h / 2, 13, 'rgba(255,246,227,0.6)', 'left');
  }
}

function drawButton(ctx, rect, label, sub, enabled, color) {
  ctx.save();
  shadow(ctx, enabled);
  ctx.fillStyle = enabled ? color : '#8d959d';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.restore();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 - (sub ? 9 : 0), 20, '#fff', 'center', '800');
  if (sub) text(ctx, sub, rect.x + rect.w / 2, rect.y + rect.h / 2 + 14, 12, 'rgba(255,255,255,0.85)', 'center');
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- screens
function drawTopBar(ctx, state) {
  const bar = LAYOUT.topBar;
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, bar.h - 4, bar.w, 4);
  text(ctx, 'EMBER & LADLE', 24, 32, 26, PALETTE.cream, 'left', '800');
  text(ctx, 'HEARTH RUSH', 246, 34, 13, PALETTE.gold, 'left', '700');
  const timeLeft = SHIFT_SECONDS - state.time;
  const urgent = timeLeft <= 30;
  text(ctx, `⏱ ${formatTime(timeLeft)}`, 640, 32, 26, urgent ? '#ff9a86' : PALETTE.cream, 'center', '800');
  text(ctx, `★ ${state.score} coins`, 900, 32, 20, PALETTE.cream, 'center', '800');
  text(ctx, `Served ${state.served} · Lost ${state.lost}`, 1080, 32, 15, 'rgba(255,246,227,0.8)', 'center');
  text(ctx, `Lv ${levelOf(state)}`, 1236, 32, 15, PALETTE.gold, 'right', '800');
}

function drawTitle(ctx, state) {
  ctx.fillStyle = PALETTE.wallBottom;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Hanging lamps.
  for (const lx of [240, 640, 1040]) {
    ctx.strokeStyle = '#1c130c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 90);
    ctx.stroke();
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.moveTo(lx - 42, 92);
    ctx.lineTo(lx + 42, 92);
    ctx.lineTo(lx + 26, 140);
    ctx.lineTo(lx - 26, 140);
    ctx.closePath();
    ctx.fill();
    const glow = ctx.createRadialGradient(lx, 150, 10, lx, 150, 150);
    glow.addColorStop(0, 'rgba(242,178,52,0.28)');
    glow.addColorStop(1, 'rgba(242,178,52,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(lx, 170, 120, 110, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'EMBER & LADLE', 640, 250, 64, PALETTE.cream, 'center', '800');
  text(ctx, '— HEARTH RUSH —', 640, 306, 22, PALETTE.gold, 'center', '700');
  text(ctx, 'The dinner rush is on. Take orders, cook each dish to order,', 640, 360, 19, 'rgba(255,246,227,0.9)', 'center');
  text(ctx, 'and serve before patience runs out. One shift: 2½ minutes.', 640, 388, 19, 'rgba(255,246,227,0.9)', 'center');
  const dishes = DISHES.map((d) => d.name).join('  ·  ');
  text(ctx, dishes, 640, 428, 15, PALETTE.gold, 'center', '700');
  const pulse = 0.75 + 0.25 * Math.sin(state.time * 4);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.red;
  rr(ctx, 490, 470, 300, 64, 32);
  ctx.fill();
  ctx.restore();
  text(ctx, 'CLICK TO START THE SHIFT', 640, 503, 20, '#fff', 'center', '800');
  text(ctx, 'Mouse to cook & serve · keys 1–9 grab ingredients · S serves · Backspace clears the plate', 640, 580, 14, 'rgba(255,246,227,0.65)', 'center');
}

function drawEnd(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.save();
  shadow(ctx, true);
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, 340, 120, 600, 470, 20);
  ctx.fill();
  ctx.restore();
  text(ctx, 'SHIFT OVER', 640, 180, 40, PALETTE.ink, 'center', '800');
  text(ctx, `GRADE ${state.grade}`, 640, 240, 30, state.grade === 'S' ? PALETTE.gold : PALETTE.red, 'center', '800');
  text(ctx, `★ ${state.score} coins`, 640, 300, 28, PALETTE.ink, 'center', '800');
  text(ctx, `Served ${state.served} dishes · ${state.lost} walked out · best combo x${state.bestCombo}`, 640, 348, 17, PALETTE.inkSoft, 'center');
  const tip = state.grade === 'S'
    ? 'A flawless rush — the hearth sings your name.'
    : state.grade === 'A'
      ? 'A fine service. The regulars will be back.'
      : state.grade === 'B'
        ? 'Solid cooking. Faster hands next shift.'
        : 'The kitchen forgives — practice the rush again.';
  text(ctx, tip, 640, 396, 16, PALETTE.inkSoft, 'center');
  ctx.fillStyle = PALETTE.green;
  rr(ctx, 490, 520, 300, 64, 32);
  ctx.fill();
  text(ctx, 'PLAY AGAIN', 640, 553, 20, '#fff', 'center', '800');
  text(ctx, 'click the button or press Enter', 640, 610, 13, 'rgba(255,246,227,0.6)', 'center');
}

// ---------------------------------------------------------------- frame
export function render(ctx, state) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  // Wall and tiled backsplash.
  const wall = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  wall.addColorStop(0, PALETTE.wallTop);
  wall.addColorStop(1, PALETTE.wallBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.tile;
  ctx.fillRect(0, 62, FIELD.width, 118);
  ctx.strokeStyle = PALETTE.tileLine;
  ctx.lineWidth = 1;
  for (let x = 0; x < FIELD.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 62);
    ctx.lineTo(x, 180);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 121);
  ctx.lineTo(FIELD.width, 121);
  ctx.stroke();

  if (state.screen === SCREEN_TITLE) {
    drawTitle(ctx, state);
    return;
  }
  if (state.screen === SCREEN_OVER) {
    drawTopBar(ctx, state);
    drawEnd(ctx, state);
    return;
  }

  drawTopBar(ctx, state);
  // Order rail.
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the first ticket is coming…', 640, 122, 16, PALETTE.inkSoft, 'center');
  }
  state.orders.forEach((order, i) => drawTicket(ctx, state, order, i));

  for (const station of STATIONS) drawStation(ctx, state, station);

  // The assembly plate.
  const plate = plateRect();
  text(ctx, 'ASSEMBLY PLATE', plate.x + 4, plate.y - 8, 12, PALETTE.cream, 'left', '800');
  const anyMatch = state.orders.some((o) => plateMatches(state, o));
  drawPlate(ctx, plate.x, plate.y + 24, plate.w, plate.h - 24, state.plate, anyMatch);
  if (state.plate.length === 0) {
    text(ctx, 'click ingredients to stack a dish here', plate.x + plate.w / 2, plate.y + plate.h / 2 + 12, 14, PALETTE.inkSoft, 'center');
  }

  drawTray(ctx, state);

  text(ctx, 'INGREDIENTS', LAYOUT.bins.x + 4, LAYOUT.bins.y - 8, 12, PALETTE.cream, 'left', '800');
  BINS.forEach((ing, i) => drawBin(ctx, state, ing, i));

  const canServe = state.orders.some((o) => plateMatches(state, o));
  drawButton(ctx, serveRect(), 'SERVE  [S]', canServe ? 'plate matches a ticket!' : 'match a ticket first', canServe, PALETTE.greenDark);
  drawButton(ctx, trashRect(), 'TRASH  [⌫]', 'clear the plate', state.plate.length > 0, PALETTE.redDark);
  drawHands(ctx, state);

  // Hint bar.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(LAYOUT.hintBar.x, LAYOUT.hintBar.y, LAYOUT.hintBar.w, LAYOUT.hintBar.h);
  const hint = state.message
    ? state.message.text
    : 'Click a bin to take an ingredient · click a station to cook it · stack it on the plate · click its ticket to serve.';
  text(ctx, hint, 640, LAYOUT.hintBar.y + 22, 15, PALETTE.cream, 'center');

  // Floating score popups.
  for (const p of state.popups) {
    const alpha = Math.max(0, Math.min(1, (p.until - state.time) / 0.5));
    ctx.save();
    ctx.globalAlpha = alpha;
    text(ctx, p.text, p.x, p.y - (1.4 - (p.until - state.time)) * 24, 22, p.color, 'left', '800');
    ctx.restore();
  }
}
