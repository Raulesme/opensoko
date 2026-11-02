/** Time the solver on every bundled level: npx vite-node tools/bench-solver.ts */
import { parseLevel } from '../src/game';
import { solvePushes } from '../src/generator/solver';
import { ALL_LEVELS } from '../src/levels/packs';

let totalMs = 0;
let totalStates = 0;
const rows: string[] = [];
for (const entry of ALL_LEVELS) {
  const level = parseLevel(entry.text);
  const t = performance.now();
  const result = solvePushes(level, 1_000_000);
  const ms = performance.now() - t;
  if (!result) throw new Error(`${entry.id} unsolved`);
  if (result.pushes.length !== entry.par) throw new Error(`${entry.id} par mismatch`);
  totalMs += ms;
  totalStates += result.states;
  if (result.states > 20_000)
    rows.push(`${entry.id}: ${result.states} states, ${ms.toFixed(0)} ms`);
}
console.log(rows.join('\n'));
console.log(
  `TOTAL ${ALL_LEVELS.length} levels: ${totalMs.toFixed(0)} ms, ${totalStates} states, ` +
    `${(totalStates / (totalMs / 1000) / 1000).toFixed(0)}k states/s`,
);
