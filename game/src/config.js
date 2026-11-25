// Ember & Ladle: Hearth Rush — every tuning number, dish, colour and layout
// rectangle in one place. The playfield is a fixed 1280x720 logical area;
// the renderer scales it to the window, so no rule depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** A full shift lasts this long, in seconds. */
export const SHIFT_SECONDS = 150;

/** Seconds of play per rush level; order speed and patience stop growing at the last. */
export const LEVEL_SECONDS = 45;
export const MAX_LEVEL = 4;

// ---------------------------------------------------------------- palette
export const PALETTE = {
  wallTop: '#3d2b1f',
  wallBottom: '#2a1d13',
  tile: '#f3e2c7',
  tileLine: '#d9c49a',
  counterWood: '#8a5a33',
  counterWoodDark: '#6f4525',
  counterTop: '#c98d5a',
  steel: '#b9c0c7',
  steelDark: '#8d959d',
  cream: '#fff6e3',
  ink: '#2b1d12',
  inkSoft: '#6b543d',
  red: '#d9482f',
  redDark: '#a82f1d',
  green: '#4d9b4d',
  greenDark: '#2f6b2f',
  gold: '#f2b234',
  goldDark: '#c78d1a',
  blue: '#3f7fb5',
  ticket: '#fffdf5',
  ticketEdge: '#e3d3ac',
  plate: '#f7f3ea',
  shadow: 'rgba(0,0,0,0.25)',
};

// ---------------------------------------------------------------- ingredients
// Each ingredient knows where it comes from and how it is prepared.
// kind: 'bin' (take it as-is), 'grill' | 'chop' | 'pot' | 'fry' (needs a station).
// cookSeconds: time on the station; burnSeconds: it burns this long after done.
export const INGREDIENTS = {
  bun: { name: 'Bun', kind: 'bin', short: 'Bun', color: '#e8a854', color2: '#c98a3a' },
  patty: { name: 'Patty', kind: 'grill', cookSeconds: 5, burnSeconds: 6, short: 'Patty', color: '#7a4a28', color2: '#5d3620' },
  tomato: { name: 'Tomato', kind: 'chop', cookSeconds: 2.5, burnSeconds: 99, short: 'Tomato', color: '#e04a35', color2: '#b93222' },
  lettuce: { name: 'Lettuce', kind: 'chop', cookSeconds: 2.5, burnSeconds: 99, short: 'Lettuce', color: '#69b455', color2: '#4a8f3d' },
  cheese: { name: 'Cheese', kind: 'bin', short: 'Cheese', color: '#f7c948', color2: '#e0a92c' },
  pasta: { name: 'Pasta', kind: 'pot', cookSeconds: 7, burnSeconds: 8, short: 'Pasta', color: '#f2d492', color2: '#dfc06a' },
  soup: { name: 'Soup', kind: 'pot', cookSeconds: 8, burnSeconds: 99, short: 'Soup', color: '#e07840', color2: '#c05a28' },
  fries: { name: 'Fries', kind: 'fry', cookSeconds: 4.5, burnSeconds: 4.5, short: 'Fries', color: '#f6d365', color2: '#e5b93f' },
  sauce: { name: 'Sauce', kind: 'bin', short: 'Sauce', color: '#c65d7b', color2: '#a63d5c' },
};

// ---------------------------------------------------------------- stations
export const STATIONS = [
  { id: 'grill', name: 'Grill', accepts: ['patty'], icon: 'grill', x: 36, y: 196, w: 150, h: 118 },
  { id: 'chop', name: 'Chopping Board', accepts: ['tomato', 'lettuce'], icon: 'chop', x: 36, y: 330, w: 150, h: 118 },
  { id: 'pot', name: 'Pot', accepts: ['pasta', 'soup'], icon: 'pot', x: 36, y: 464, w: 150, h: 118 },
  { id: 'fry', name: 'Fryer', accepts: ['fries'], icon: 'fry', x: 202, y: 464, w: 150, h: 118 },
];

// ---------------------------------------------------------------- dishes
// A dish is a multiset of prepared ingredient ids. reward is the base coin pay.
export const DISHES = [
  { id: 'ember-burger', name: 'Ember Burger', needs: ['bun', 'patty', 'tomato'], reward: 30, color: '#d9482f' },
  { id: 'garden-stack', name: 'Garden Stack', needs: ['bun', 'lettuce', 'tomato', 'cheese'], reward: 36, color: '#4d9b4d' },
  { id: 'hearth-pasta', name: 'Hearth Pasta', needs: ['pasta', 'sauce', 'cheese'], reward: 32, color: '#e07840' },
  { id: 'crispy-basket', name: 'Crispy Basket', needs: ['fries', 'sauce'], reward: 22, color: '#f2b234' },
  { id: 'ladle-soup', name: 'Ladle Soup', needs: ['soup', 'bun'], reward: 24, color: '#3f7fb5' },
];

// Ingredient bins along the bottom of the kitchen, in this order.
export const BINS = ['bun', 'patty', 'tomato', 'lettuce', 'cheese', 'pasta', 'soup', 'fries', 'sauce'];

// ---------------------------------------------------------------- orders
export const ORDERS = {
  maxActive: 4,
  // Seconds between new orders at level 1; multiplied by 0.85 each level.
  spawnEvery: 13,
  spawnEveryPerLevel: 0.85,
  // Patience (seconds) of a fresh ticket at level 1; shorter each level.
  patience: 46,
  patiencePerLevel: 0.88,
  minPatience: 26,
  // Dishes an order may ask for at each level (by index into DISHES).
  dishesByLevel: [
    [0, 3, 4],
    [0, 1, 3, 4],
    [0, 1, 2, 3, 4],
    [0, 1, 2, 3, 4],
  ],
};

// ---------------------------------------------------------------- scoring
export const SCORING = {
  // Tip is up to this many coins, scaled by the patience left when served.
  maxTip: 12,
  // Serving while the ticket is still green (patience above this fraction) pays the full tip.
  // Combo: each consecutive serve without a lost order adds this much to the multiplier.
  comboStep: 0.25,
  comboMax: 2,
  // A lost order costs the combo and this many coins (never below zero).
  lostPenalty: 5,
};

// ---------------------------------------------------------------- layout
// All rectangles are in the 1280x720 logical field.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 62 },
  ticketRail: { x: 0, y: 62, w: 1280, h: 118 },
  ticket: { w: 292, h: 100, gap: 16, x0: 24, y: 72 },
  stationsLabel: { x: 36, y: 168 },
  plate: { x: 400, y: 196, w: 420, h: 240 },
  tray: { x: 400, y: 452, w: 420, h: 130 },
  bins: { x: 852, y: 196, w: 392, h: 386 },
  binCell: { w: 118, h: 86, gap: 10 },
  serveButton: { x: 852, y: 596, w: 190, h: 64 },
  trashButton: { x: 1054, y: 596, w: 190, h: 64 },
  hintBar: { x: 0, y: 676, w: 1280, h: 44 },
  hands: { x: 36, y: 596, w: 330, h: 64 },
};
