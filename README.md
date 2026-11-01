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

## Tech

TypeScript, Vite, Canvas 2D, Vitest. Deployed to GitHub Pages via GitHub Actions.

## License

Code: MIT (`LICENSE`). Assets: CC BY 4.0 unless noted (`ASSETS-LICENSE.md`).
