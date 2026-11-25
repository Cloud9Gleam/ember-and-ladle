# Ember & Ladle — Hearth Rush

An original timed cooking game for make.fun's `best-cooking-game-20261125-0137`
bounty. It runs in a desktop browser from static files with no network
request, played with keyboard and mouse.

## The game

One 150-second dinner shift. Tickets arrive on the order board, each with a
patience bar. Take ingredients from the bins, cook them on the grill,
chopping board, pot and fryer, stack the dish on the assembly plate, and
serve before the ticket walks out. Serve fast for tips, chain serves for a
combo multiplier, and survive four rush levels as orders come faster and
patience runs shorter.

Five original dishes: Ember Burger, Garden Stack, Hearth Pasta, Crispy Basket,
Ladle Soup. All art is drawn in code on canvas and all sounds are synthesised
with the Web Audio API — no image, audio or font files, no network.

## Play

Open `game/index.html` in desktop Chrome (or `node serve.ts`, then
http://localhost:8080):

- Click a bin (or keys 1–9) to take an ingredient.
- Click a station to cook it; click again when it is ready to collect it.
- Click the plate to stack what is in hand; click a ticket (or SERVE / S)
  when the plate matches it.
- Backspace clears the plate.

## Shots

`shots.json` lists the four screenshots: a busy mid-shift frame (cover),
a plate ready to serve, the title screen, and the graded end screen. Each
is staged by `?shot=…&seed=1`, a real played position, never a mock.

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to `/output` and writes `/output/dossier.json` with the
vendored `vendor/makefun-game.ts` library.

MIT licensed.
