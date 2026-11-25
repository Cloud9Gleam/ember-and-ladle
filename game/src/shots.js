// Ember & Ladle — screenshot scenes and the self-test. A shot stages a real
// game: it starts a fresh seeded shift and steers it with a small greedy
// autopilot (the same clicks a player makes), so every screenshot is a frame
// of genuine play and the same seed always gives the same frame.

import { BINS, DISHES, INGREDIENTS, STATIONS, STEP } from './config.js';
import {
  binRect,
  clickAt,
  createState,
  dishById,
  plateMatches,
  plateRect,
  serveRect,
  startShift,
  stationRect,
  step,
  traySlotRect,
} from './kitchen.js';

function clickCenter(state, rect) {
  return clickAt(state, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function stationFor(ing) {
  return STATIONS.find((s) => s.accepts.includes(ing)) || null;
}

function missingFor(state, order) {
  const want = dishById(order.dishId).needs.slice();
  for (const item of state.plate) {
    const i = want.indexOf(item.ing);
    if (i >= 0) want.splice(i, 1);
  }
  return want;
}

function cookingHas(state, ing) {
  return STATIONS.some((s) => {
    const slot = state.stations[s.id];
    return slot.item && slot.item.ing === ing && slot.item.state !== 'burnt';
  });
}

/**
 * One greedy move: collect what is ready, cook what is held, stack what the
 * oldest ticket still needs, serve when the plate matches. Returns true when
 * it did something.
 */
export function botStep(state) {
  if (state.screen === 'title') {
    clickAt(state, 640, 360);
    return true;
  }
  if (state.screen !== 'play') return false;

  // 1. Collect ready stations, clear burnt ones.
  for (const station of STATIONS) {
    const slot = state.stations[station.id];
    if (slot.item && (slot.item.state === 'ready' || slot.item.state === 'burnt')) {
      clickCenter(state, stationRect(station));
      return true;
    }
  }

  // 2. Serve a matching plate.
  const match = state.orders.find((o) => plateMatches(state, o));
  if (match) {
    clickCenter(state, serveRect());
    return true;
  }

  const target = state.orders[0];
  if (!target) return false;

  // 3. Put what is in hand where it belongs.
  if (state.hands !== null) {
    const held = state.hands.ing;
    const cooked = state.hands.done;
    const station = stationFor(held);
    const slot = station ? state.stations[station.id] : null;
    if (!cooked && station && slot.item === null && INGREDIENTS[held].kind !== 'bin') {
      clickCenter(state, stationRect(station));
      return true;
    }
    if (cooked && missingFor(state, target).includes(held) && state.plate.length < 4) {
      clickCenter(state, plateRect());
      return true;
    }
    const free = state.tray.findIndex((t) => t === null);
    if (free >= 0) {
      clickAt(state, 200, 628); // the hands box: stows what is held
      return true;
    }
    return false;
  }

  // 4. Hands are empty: fetch the next thing the ticket needs.
  const missing = missingFor(state, target);
  for (const ing of missing) {
    const trayIndex = state.tray.findIndex((t) => t !== null && t.ing === ing && t.done);
    if (trayIndex >= 0) {
      clickCenter(state, traySlotRect(trayIndex));
      return true;
    }
  }
  for (const ing of missing) {
    if (cookingHas(state, ing)) continue;
    const binIndex = BINS.indexOf(ing);
    if (binIndex >= 0) {
      clickCenter(state, binRect(binIndex));
      return true;
    }
  }
  return false;
}

/** Run the simulation forward a number of fixed steps, botting each one.
 * botEvery paces the bot: it acts only every botEvery-th step, so a slow
 * bot (a human pace) lets orders pile up for a busy mid-shift frame. */
function runBot(state, maxSteps, until, botEvery = 1) {
  for (let i = 0; i < maxSteps; i += 1) {
    if (state.screen === 'over') break;
    if (i % botEvery === 0) botStep(state);
    step(state, STEP);
    if (until && until(state)) break;
  }
  return state;
}

function hasMidAssembly(state) {
  // A busy mid-shift frame: past the opening, tickets up, and a dish
  // mid-assembly on the plate or something on a station.
  if (state.time < 20) return false;
  if (state.orders.length < 2) return false;
  const cooking = STATIONS.some((s) => {
    const slot = state.stations[s.id];
    return slot.item && slot.item.state === 'cooking';
  });
  return state.plate.length >= 1 || cooking;
}

function hasServablePlate(state) {
  return state.orders.some((order) => plateMatches(state, order));
}

/**
 * Build the state for one screenshot scene. Names: start | mid | serve | end.
 * Every scene is a real played position, never a mock.
 */
export function stageShot(name, seed = 1) {
  const state = createState(seed);
  if (name === 'start') {
    state.time = 1.2;
    return state;
  }
  startShift(state);
  if (name === 'mid') {
    // A human-paced bot, so tickets pile up while it works.
    runBot(state, 60 * 90, hasMidAssembly, 75);
    return state;
  }
  if (name === 'serve') {
    runBot(state, 60 * 120, hasServablePlate);
    return state;
  }
  if (name === 'end') {
    runBot(state, 60 * 200);
    if (state.screen !== 'over') {
      // The bot may still be mid-shift: fast-forward the clock to the end.
      while (state.screen !== 'over') step(state, STEP);
    }
    return state;
  }
  return state;
}

/**
 * Self-test: play a whole seeded shift with the bot and report the result.
 * Runs synchronously; the caller prints the returned summary.
 */
export function selfTest(seed = 7) {
  const state = createState(seed);
  const errors = [];
  try {
    startShift(state);
    let steps = 0;
    while (state.screen !== 'over' && steps < 60 * 200) {
      botStep(state);
      step(state, STEP);
      steps += 1;
    }
    if (state.screen !== 'over') errors.push('shift did not finish');
    if (state.served < 3) errors.push(`only ${state.served} served`);
    if (!(state.score > 0)) errors.push('score stayed zero');
  } catch (err) {
    errors.push(`exception: ${err.message}`);
  }
  return {
    seed,
    screen: state.screen,
    score: state.score,
    served: state.served,
    lost: state.lost,
    bestCombo: state.bestCombo,
    grade: state.grade,
    errors,
    pass: errors.length === 0,
  };
}
