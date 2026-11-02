# How the level generator works

Everything lives in `src/generator/` (shared by the game, the tests and the `tools/` scripts).

## Pipeline

1. **Room** (`generate.ts`): a random rectangular room with wall blocks, or a few rooms joined by
   corridors. Only the largest connected floor region is kept.
2. **Reverse play**: boxes start on goals (a solved position) and are _pulled_ around for many
   steps. Every level produced this way is solvable by construction.
3. **Solve** (`solver.ts`): breadth-first search over _pushes_ gives the optimal push count (par).
4. **Measure** (`metrics.ts`): how interesting is it? See below.
5. **Accept** (`presets.ts`): a level is kept only if it falls in a difficulty band _and_ has
   enough interaction. Generation is deterministic for a given (preset, seed), which is what makes
   share codes like `v2.hard.482913` work.

## Measuring "interesting"

Length alone is a poor measure. In a pool of ~1,200 generated levels, 24% had **zero** interaction
(every box just slides to a goal) and 53% never needed a counter-intuitive push. The original score
(pushes plus log search effort) correlated 0.87 with plain push count.

`metrics.ts` isolates interaction from the optimal solution:

- **excess** (blocker cost): optimal pushes minus the sum of each box's push distance to its nearest
  goal on an empty board. It is exactly the work forced by boxes getting in each other's way.
- **away**: pushes that move a box farther from its goal (parking, detours).
- `challenge = 2*excess + 3*away + pushes/2 + log2(states)`.

Presets bound `challenge` and also demand minimum excess/away, so a level cannot reach Hard just by
being long. Levels that gain interaction cluster in **4-5 boxes with at least ~8 floor cells per
box** (rooms under 6 cells/box produced interaction 1% of the time), so Hard and Expert filter rooms
by size before spending any solver time.

## Solver performance

The first solver ran at ~26k states/s (63 s to solve all 75 bundled levels). It now runs at ~217k
states/s (7.7 s) with identical results: typed arrays, an incremental Zobrist hash with 64-bit keys
in an open-addressing table (`hashset.ts`), and one array doubling as wall map, box map and flood-fill
marks. Search order and pruning are unchanged, so scores and puzzle codes are identical; this is
checked against the preserved original (`tests/helpers/referenceSolver.ts`) in `tests/solver.test.ts`.
Expert generation went from ~10 s to ~2 s typical.

Dead ends worth knowing about: a generation-time duplicate filter (exact box + player position)
removed only 4% of nodes, because most duplicates are the same boxes with the player on a different
cell of the same region. And the cost is dominated by the flood fill per dequeued node, not hashing.

## Local search (`climb.ts`)

`climb` hill-climbs a solvable level with small edits (add/remove a wall, move a box, move a goal),
keeping an edit when the level stays solvable and the challenge score does not drop.

- **In the browser it does not help.** Compared with plain sampling, the median time improved a
  little but the tail got worse (every edit costs a full solve, and wall removals often blow up the
  search), so mean time to a valid Expert level was no better. Presets therefore only sample.
- **Offline it is very effective.** Sampling tops out around challenge 70; climbing reaches 100+
  (e.g. 59 -> 120 with 26 blocker pushes and 11 away pushes). `tools/climb-cli.ts` uses it to build
  the Master pack from the best sampled candidates.

## Ideas not tried yet

- Count optimal solutions (unique-solution puzzles feel more designed).
- Count dead-end states reachable by natural play (how easy it is to get stuck).
- A smarter move set for the climb (e.g. only moves that keep the search size bounded).
- Non-rectangular boards or new tile types.
