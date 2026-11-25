// Ember & Ladle — pointer and keyboard input. The canvas is scaled to fit
// the window, so every event is mapped back into the 1280x720 logical field
// before the kitchen sees it.

import { FIELD } from './config.js';
import { clickAt, keyAction } from './kitchen.js';
import { sfx, unlockAudio } from './audio.js';

function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * FIELD.width,
    y: ((clientY - rect.top) / rect.height) * FIELD.height,
  };
}

function playSound(event) {
  if (!event) return;
  if (event === 'pick') sfx.pick();
  else if (event === 'place') sfx.place();
  else if (event === 'chop') sfx.chop();
  else if (event === 'sizzle') sfx.sizzle();
  else if (event === 'done') sfx.done();
  else if (event === 'serve') sfx.serve();
  else if (event === 'error') sfx.error();
  else if (event === 'lost') sfx.lost();
  else if (event === 'start') sfx.levelUp();
}

export function attachInput(canvas, state) {
  canvas.addEventListener('pointerdown', (event) => {
    unlockAudio();
    const point = toLogical(canvas, event.clientX, event.clientY);
    playSound(clickAt(state, point.x, point.y));
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') return;
    unlockAudio();
    if (['Backspace', ' '].includes(event.key)) event.preventDefault();
    playSound(keyAction(state, event.key));
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
}
