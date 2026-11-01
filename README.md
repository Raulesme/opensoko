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

Arrows / WASD move, Z undo, R restart, Esc menu. On touch screens, swipe to move.
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

## Tech

TypeScript, Vite, Canvas 2D, Vitest. Deployed to GitHub Pages via GitHub Actions.

## License

Code: MIT (`LICENSE`). Assets: CC BY 4.0 unless noted (`ASSETS-LICENSE.md`).
