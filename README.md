# OpenSoko

Freeware Sokoban inspired browser game.

## Development

Requires Node.js 22+.

```bash
npm install
npm run dev      # start dev server
npm test         # unit tests
npm run lint     # eslint
npm run build    # typecheck + production build into dist/
```

## Controls

Arrows / WASD move, Z undo, R restart, H hint, Esc menu, M mute. On touch screens, swipe to move.
Best moves and pushes per level are saved in your browser's localStorage.

## Level generator

Levels are produced by a reverse-play generator: build a random room, put boxes on goals, then
_pull_ boxes backwards so every level is solvable by construction. A push-based solver (with
deadlock pruning) measures difficulty, and a curation step picks a ramped, varied selection.

```bash
npm run levels:generate -- --seed 21 --attempts 10000 --out candidates.json
npm run levels:curate -- --in candidates.json --count 35 --out picks.json
npm run levels:pack -- --in picks.json --out src/levels/generated.ts --seeds "21"
```

The current pack (35 generated levels after 5 hand-made intro levels) came from seeds 21-24.

## Help when you're stuck

The solver that checks every level also helps you play (it runs in a Web Worker, so the page never
freezes):

- **Hint (H):** outlines the box to push next and shows which way it goes. The hint follows your
  own play, so it stays valid as long as you keep following it.
- **Stuck warning:** if the current position can no longer be solved, a red note appears so you can
  undo. Obvious dead boxes are caught instantly; subtler deadlocks are proven by a background check.
- **Show solution:** plays the optimal solution from where you are. Any key or tap stops it. A level
  finished this way is marked as solved with help and does not save a score.

## Sound

Sound effects are synthesised in the browser with the Web Audio API (`src/audio/`), so there are no
audio files or licences to track. Each sound is plain data in `src/audio/sounds.ts`: tweak a
frequency, length or gain there to change how it sounds. Mute state is saved in localStorage.

## Random puzzles

The menu's **Random puzzle** section generates a fresh level in the browser (in a Web Worker, so the
page stays responsive) at Easy, Medium, Hard or Expert. Generation is deterministic: a puzzle is
identified by a code like `v2.hard.482913` (generator version, difficulty, seed). "Copy link" shares
`#p=<code>` and anyone opening it gets the identical level. Difficulty is measured by the solver (see
`src/generator/presets.ts` and `src/generator/metrics.ts`): besides length it counts how many pushes boxes
force on each other ("blocker cost") and counter-intuitive away pushes, so Hard and Expert levels are
actually interactive, not just long, and Expert typically takes a second or two to find. Random puzzles show par and
stars but don't save best scores.

## Tech

TypeScript, Vite, Canvas 2D, Vitest. Deployed to GitHub Pages via GitHub Actions.

## License

Code: MIT (`LICENSE`). Assets: CC BY 4.0 unless noted (`ASSETS-LICENSE.md`).
