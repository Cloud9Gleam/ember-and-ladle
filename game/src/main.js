// Ember & Ladle — boot and the game loop. The canvas is a fixed 1280x720
// logical field scaled to the window; the simulation runs in fixed 1/60 s
// steps so a shift plays the same on any display.
//
// URL parameters (for screenshots and tests, never for play):
//   ?shot=start|mid|serve|end&seed=N  stage one deterministic scene and
//       render it once, frozen, for a screenshot.
//   ?selftest=1&seed=N                play a whole shift with the bot and
//       write the result into #selftest and document.title.

import { FIELD, STEP } from './config.js';
import { attachInput } from './input.js';
import { createState, step } from './kitchen.js';
import { render } from './render.js';
import { selfTest, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);

function resize() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}

function fitCanvas() {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  resize();
  window.addEventListener('resize', resize);
}

if (params.has('selftest')) {
  fitCanvas();
  const seed = Number(params.get('seed') || 7);
  const result = selfTest(seed);
  const line = `SELFTEST seed=${result.seed} screen=${result.screen} score=${result.score} served=${result.served} lost=${result.lost} bestCombo=${result.bestCombo} grade=${result.grade} pass=${result.pass} errors=${result.errors.join('; ') || 'none'}`;
  document.title = line;
  const node = document.getElementById('selftest');
  if (node) node.textContent = line;
  const state = createState(seed);
  render(ctx, state);
} else if (params.has('shot')) {
  fitCanvas();
  const seed = Number(params.get('seed') || 1);
  const state = stageShot(params.get('shot'), seed);
  render(ctx, state);
  document.title = `SHOT ${params.get('shot')} seed=${seed} screen=${state.screen} score=${state.score} served=${state.served} plate=${state.plate.map((i) => i.ing).join(',') || 'empty'} orders=${state.orders.length}`;
} else {
  fitCanvas();
  const state = createState(1);
  attachInput(canvas, state);
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= STEP) {
      step(state, STEP);
      acc -= STEP;
    }
    render(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
