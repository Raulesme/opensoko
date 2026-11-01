# Art provenance

All sprites in `src/assets/sprites/` were generated with [Pixellab](https://pixellab.ai) on
2026-11-01 (account of the project owner) and selected by hand. **Check Pixellab's
[terms of service](https://pixellab.ai/termsofservice) before relying on the licence stated in
`ASSETS-LICENSE.md`**: AI-generated output may have limited copyright protection, and the
terms decide what the owner may relicense.

| File                                 | Size  | Source tool                                                         | Prompt (abridged)                                                                 | Pick                 |
| ------------------------------------ | ----- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------- |
| `floor.png`                          | 32x32 | `create_tiles_pro`, seed 7, square top-down                         | "dark blue-grey stone floor tile, subtle speckles"                                | variation 5 of 0-7   |
| `wall.png`                           | 32x32 | same call                                                           | "red-brown brick wall tile, clearly raised, with mortar lines"                    | variation 13 of 8-15 |
| `crate.png`                          | 32x32 | `create_tiles_pro`, seed 11                                         | "wooden crate seen straight from above, plank lid with dark iron corner brackets" | variation 1          |
| `crate-done.png`                     | 32x32 | same call                                                           | "...with glowing green iron bands, delivered crate"                               | variation 5          |
| `goal.png`                           | 32x32 | same call                                                           | "dark blue-grey stone floor tile with a glowing yellow diamond target marker"     | variation 8          |
| `player-{south,east,north,west}.png` | 36x36 | `create_character` (standard, 4 directions, size 24, high top-down) | "warehouse worker in a blue cap and red vest"                                     | idle rotations       |

Notes:

- Sprites are drawn at 32x32 native pixels. The renderer scales in half-pixel steps.
- A first attempt at the crate and goal as map objects was discarded: the isometric look clashed
  with the flat top-down tiles.
- Pixellab also offers a `pushing` character animation (`animate_character`). It is not used yet
  and would be a nice future upgrade.
- The API token lives only in the cloud environment's network secrets, never in the repo.
