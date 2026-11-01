# Art provenance

All sprites in `src/assets/sprites/` were generated with [Pixellab](https://pixellab.ai) on
2026-11-01 (account of the project owner) and selected by hand.

## Terms review

Reviewed against Pixellab's [terms of service](https://pixellab.ai/termsofservice) (last updated
2026-10-30), summarised, not legal advice:

- §1.3, §3.3: the user owns what they create and may use, modify and distribute it commercially or
  not, with no permission needed. The user is responsible for it not infringing third parties.
- §1.2, §3.3: outputs must **not** be used to train other models without Pixellab's written
  permission. `ASSETS-LICENSE.md` repeats this as a request to downstream users.
- §2.2: programmatic use only through `api.pixellab.ai`, which is the only host used here.
- §4: terms reference the Open RAIL-M licence (the model's licence, not the generated images').
- Copyright in purely AI-generated images varies by country; the project owner confirmed this is
  not an issue in theirs.
- Terms can change (§2.1); re-check before generating more assets.

## Assets

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
