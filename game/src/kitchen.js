// Ember & Ladle — the kitchen itself: state, orders, stations, scoring.
// No drawing here and no DOM: render.js draws this state, input.js calls
// these verbs. Everything advances in fixed steps through step(state, dt).

import {
  BINS,
  DISHES,
  INGREDIENTS,
  LAYOUT,
  LEVEL_SECONDS,
  MAX_LEVEL,
  ORDERS,
  SCORING,
  SHIFT_SECONDS,
  STATIONS,
} from './config.js';

/** Deterministic random stream, so a seed always replays the same shift. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(rng, array) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function dishById(id) {
  return DISHES.find((dish) => dish.id === id);
}

export function levelOf(state) {
  return Math.min(MAX_LEVEL, Math.floor(state.time / LEVEL_SECONDS) + 1);
}

export function createState(seed = 1) {
  const rng = mulberry32(seed);
  const state = {
    seed,
    rng,
    screen: 'title',
    time: 0,
    score: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    orders: [],
    nextOrderId: 1,
    spawnTimer: 4,
    stations: {},
    hands: null,
    tray: [null, null, null, null],
    plate: [],
    selectedTicket: null,
    message: null,
    popups: [],
    grade: null,
    muted: false,
  };
  for (const station of STATIONS) state.stations[station.id] = { item: null, notified: false };
  return state;
}

export function startShift(state) {
  state.screen = 'play';
  state.time = 0;
  state.score = 0;
  state.served = 0;
  state.lost = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.orders = [];
  state.spawnTimer = 3;
  state.hands = null;
  state.tray = [null, null, null, null];
  state.plate = [];
  state.selectedTicket = null;
  state.popups = [];
  state.grade = null;
  for (const station of STATIONS) state.stations[station.id] = { item: null, notified: false };
  say(state, 'Shift started — take the first order!');
}

export function say(state, text, seconds = 2.2) {
  state.message = { text, until: state.time + seconds };
}

export function popup(state, x, y, text, color = '#2b1d12') {
  state.popups.push({ x, y, text, color, until: state.time + 1.4 });
}

function spawnOrder(state) {
  const level = levelOf(state);
  const pool = ORDERS.dishesByLevel[level - 1];
  const dish = DISHES[pool[Math.floor(state.rng() * pool.length)]];
  const patienceMax = Math.max(
    ORDERS.minPatience,
    ORDERS.patience * Math.pow(ORDERS.patiencePerLevel, level - 1),
  );
  const order = {
    id: state.nextOrderId,
    dishId: dish.id,
    patience: patienceMax,
    patienceMax,
    born: state.time,
  };
  state.nextOrderId += 1;
  state.orders.push(order);
  return order;
}

function gradeFor(score) {
  if (score >= 420) return 'S';
  if (score >= 320) return 'A';
  if (score >= 220) return 'B';
  if (score >= 120) return 'C';
  return 'D';
}

function endShift(state) {
  state.screen = 'over';
  state.grade = gradeFor(state.score);
  state.orders = [];
}

/** Advance the simulation by dt seconds (call with fixed steps). */
export function step(state, dt) {
  if (state.screen !== 'play') return;
  state.time += dt;
  if (state.time >= SHIFT_SECONDS) {
    state.time = SHIFT_SECONDS;
    endShift(state);
    return;
  }
  const level = levelOf(state);
  if (level !== state.levelShown) {
    if (state.levelShown !== undefined) {
      say(state, `Rush level ${level} — orders come faster!`, 2.5);
      state.popups.push({ x: 640, y: 300, text: `LEVEL ${level}`, color: '#d9482f', until: state.time + 1.6 });
    }
    state.levelShown = level;
  }

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.orders.length < ORDERS.maxActive) {
    spawnOrder(state);
    const gap = ORDERS.spawnEvery * Math.pow(ORDERS.spawnEveryPerLevel, level - 1);
    state.spawnTimer = gap * (0.85 + state.rng() * 0.3);
  }

  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const order = state.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders.splice(i, 1);
      state.lost += 1;
      state.combo = 0;
      state.score = Math.max(0, state.score - SCORING.lostPenalty);
      if (state.selectedTicket === order.id) state.selectedTicket = null;
      say(state, `${dishById(order.dishId).name} walked out — combo lost`, 2.2);
    }
  }

  for (const station of STATIONS) {
    const slot = state.stations[station.id];
    if (slot.item && slot.item.state === 'cooking') {
      slot.item.t += dt;
      const ing = INGREDIENTS[slot.item.ing];
      if (slot.item.t >= ing.cookSeconds && !slot.notified) {
        slot.item.state = 'ready';
        slot.notified = true;
        slot.item.readyAt = state.time;
      }
    }
    if (slot.item && slot.item.state === 'ready') {
      const ing = INGREDIENTS[slot.item.ing];
      if (slot.item.t - ing.cookSeconds >= ing.burnSeconds) {
        slot.item.state = 'burnt';
        say(state, `Burnt on the ${station.name} — click it to clear`, 2.2);
      }
    }
  }

  state.popups = state.popups.filter((p) => p.until > state.time);
  if (state.message && state.message.until <= state.time) state.message = null;
}

// ---------------------------------------------------------------- geometry
export function ticketRect(index) {
  const t = LAYOUT.ticket;
  return { x: t.x0 + index * (t.w + t.gap), y: t.y, w: t.w, h: t.h };
}

export function stationRect(station) {
  return { x: station.x, y: station.y, w: station.w, h: station.h };
}

export function binRect(index) {
  const b = LAYOUT.bins;
  const c = LAYOUT.binCell;
  const col = index % 3;
  const row = Math.floor(index / 3);
  return { x: b.x + col * (c.w + c.gap), y: b.y + row * (c.h + c.gap), w: c.w, h: c.h };
}

export function traySlotRect(index) {
  const t = LAYOUT.tray;
  const w = 96;
  const gap = 12;
  return { x: t.x + 14 + index * (w + gap), y: t.y + 14, w, h: 100 };
}

export function plateRect() {
  return { ...LAYOUT.plate };
}

export function serveRect() {
  return { ...LAYOUT.serveButton };
}

export function trashRect() {
  return { ...LAYOUT.trashButton };
}

export function handsRect() {
  return { ...LAYOUT.hands };
}

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// ---------------------------------------------------------------- verbs
function freeTraySlot(state) {
  return state.tray.findIndex((slot) => slot === null);
}

// Items in hands, on the tray and on the plate are { ing, done }: done is
// true once the ingredient is prepared (bin items are ready at once, station
// items once cooked). Raw food must never reach the plate.
function stow(state, ing, done = false) {
  if (state.hands === null) {
    state.hands = { ing, done };
    return true;
  }
  const slot = freeTraySlot(state);
  if (slot >= 0) {
    state.tray[slot] = { ing, done };
    return true;
  }
  return false;
}

export function plateMatches(state, order) {
  const dish = dishById(order.dishId);
  if (state.plate.length !== dish.needs.length) return false;
  const have = state.plate.map((item) => item.ing).sort();
  const want = dish.needs.slice().sort();
  return have.every((ing, i) => ing === want[i]);
}

function missingFor(state, order) {
  const dish = dishById(order.dishId);
  const want = dish.needs.slice();
  for (const item of state.plate) {
    const i = want.indexOf(item.ing);
    if (i >= 0) want.splice(i, 1);
  }
  return want;
}

function serveOrder(state, order) {
  const dish = dishById(order.dishId);
  const tip = Math.round(SCORING.maxTip * (order.patience / order.patienceMax));
  const multiplier = Math.min(SCORING.comboMax, 1 + SCORING.comboStep * state.combo);
  const earned = Math.round((dish.reward + tip) * multiplier);
  state.score += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const index = state.orders.findIndex((o) => o.id === order.id);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  if (state.selectedTicket === order.id) state.selectedTicket = null;
  state.plate = [];
  const rect = ticketRect(Math.max(0, index));
  popup(state, rect.x + 60, rect.y + 30, `+${earned}`, '#2f6b2f');
  say(state, `${dish.name} served — +${earned} coins${state.combo > 1 ? ` (combo x${multiplier.toFixed(2)})` : ''}`, 2.2);
  return { ok: true, earned };
}

/**
 * Handle one click in logical field coordinates. Returns a short event name
 * the caller maps to a sound: 'pick' | 'place' | 'chop' | 'sizzle' | 'done' |
 * 'serve' | 'error' | 'lost' | 'start' | null.
 */
export function clickAt(state, x, y) {
  if (state.screen === 'title') {
    startShift(state);
    return 'start';
  }
  if (state.screen === 'over') {
    const r = { x: 490, y: 520, w: 300, h: 64 };
    if (inside(r, x, y)) {
      const fresh = createState(state.seed + 1);
      Object.assign(state, fresh);
      startShift(state);
      return 'start';
    }
    return null;
  }

  // Tickets: serve when the plate matches, otherwise select it.
  for (let i = 0; i < state.orders.length; i += 1) {
    const order = state.orders[i];
    if (inside(ticketRect(i), x, y)) {
      if (plateMatches(state, order)) return serveOrder(state, order).ok ? 'serve' : 'error';
      state.selectedTicket = order.id;
      const missing = missingFor(state, order);
      say(state, `${dishById(order.dishId).name} still needs: ${missing.map((m) => INGREDIENTS[m].name).join(', ')}`, 2.4);
      return 'pick';
    }
  }

  // Stations.
  for (const station of STATIONS) {
    if (!inside(stationRect(station), x, y)) continue;
    const slot = state.stations[station.id];
    if (slot.item && slot.item.state === 'burnt') {
      slot.item = null;
      slot.notified = false;
      say(state, 'Burnt food cleared', 1.6);
      return 'place';
    }
    if (slot.item && slot.item.state === 'ready') {
      if (stow(state, slot.item.ing, true)) {
        slot.item = null;
        slot.notified = false;
        return 'pick';
      }
      say(state, 'Hands and tray are full', 1.6);
      return 'error';
    }
    if (slot.item && slot.item.state === 'cooking') {
      say(state, 'Still cooking…', 1.2);
      return null;
    }
    if (state.hands !== null && !state.hands.done && station.accepts.includes(state.hands.ing)) {
      slot.item = { ing: state.hands.ing, t: 0, state: 'cooking' };
      slot.notified = false;
      state.hands = null;
      return INGREDIENTS[slot.item.ing].kind === 'chop' ? 'chop' : 'sizzle';
    }
    if (state.hands !== null && !state.hands.done) {
      say(state, `The ${station.name} does not take ${INGREDIENTS[state.hands.ing].name}`, 1.8);
      return 'error';
    }
    return null;
  }

  // Ingredient bins.
  for (let i = 0; i < BINS.length; i += 1) {
    if (!inside(binRect(i), x, y)) continue;
    if (stow(state, BINS[i], true)) return 'pick';
    say(state, 'Hands and tray are full', 1.6);
    return 'error';
  }

  // Tray slots: pick an item up when hands are empty.
  for (let i = 0; i < state.tray.length; i += 1) {
    if (!inside(traySlotRect(i), x, y)) continue;
    if (state.tray[i] !== null && state.hands === null) {
      state.hands = state.tray[i];
      state.tray[i] = null;
      return 'pick';
    }
    return null;
  }

  // The plate: add what is in hand, or take the top item back.
  if (inside(plateRect(), x, y)) {
    if (state.hands !== null) {
      if (state.plate.length >= 4) {
        say(state, 'The plate is full', 1.6);
        return 'error';
      }
      state.plate.push(state.hands);
      state.hands = null;
      return 'place';
    }
    if (state.plate.length > 0) {
      state.hands = state.plate.pop();
      return 'pick';
    }
    return null;
  }

  // Serve button: serve the selected ticket, else the first matching one.
  if (inside(serveRect(), x, y)) {
    const target = state.orders.find((o) => o.id === state.selectedTicket)
      || state.orders.find((o) => plateMatches(state, o));
    if (target && plateMatches(state, target)) return serveOrder(state, target).ok ? 'serve' : 'error';
    say(state, 'No ticket matches this plate yet', 1.8);
    return 'error';
  }

  // Trash button: clear the plate.
  if (inside(trashRect(), x, y)) {
    if (state.plate.length > 0) {
      state.plate = [];
      say(state, 'Plate cleared', 1.4);
      return 'place';
    }
    return null;
  }

  // Hands: put what is held into a free tray slot.
  if (inside(handsRect(), x, y) && state.hands !== null) {
    const slot = freeTraySlot(state);
    if (slot >= 0) {
      state.tray[slot] = state.hands;
      state.hands = null;
      return 'place';
    }
    return 'error';
  }

  return null;
}

/** Keyboard shortcuts: keys 1-9 take a bin item, S serves, Backspace trashes the plate. */
export function keyAction(state, key) {
  if (state.screen !== 'play') {
    if ((key === 'Enter' || key === ' ') && state.screen !== 'play') return clickAt(state, 640, 360);
    return null;
  }
  if (key >= '1' && key <= '9') {
    const index = Number(key) - 1;
    if (index < BINS.length) {
      if (stow(state, BINS[index], true)) return 'pick';
      say(state, 'Hands and tray are full', 1.6);
      return 'error';
    }
  }
  if (key === 's' || key === 'S') {
    const rect = serveRect();
    return clickAt(state, rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  if (key === 'Backspace') {
    const rect = trashRect();
    return clickAt(state, rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  return null;
}
