/**
 * Print solution-graph metrics for a bundled pack (see src/generator/solutions.ts):
 *   npx vite-node tools/solutions-cli.ts starter|advanced|master
 * `width` is average optimal positions per step (1 = a single narrow line of play).
 */
import { parseLevel } from '../src/game';
import { analyzeSolutions } from '../src/generator/solutions';
import { PACKS } from '../src/levels/packs';

const packId = process.argv[2] ?? 'master';
const pack = PACKS.find((p) => p.id === packId);
if (!pack) throw new Error(`Unknown pack '${packId}' (${PACKS.map((p) => p.id).join(', ')})`);

console.log('id       name            par  width  forced  log10(solutions)');
for (const entry of pack.levels) {
  const s = analyzeSolutions(parseLevel(entry.text), 400_000);
  console.log(
    `${entry.id.padEnd(8)} ${entry.name.padEnd(15)} ${String(entry.par).padStart(3)}  ` +
      (s
        ? `${s.width.toFixed(0).padStart(5)}  ${`${(s.forcedFraction * 100).toFixed(0)}%`.padStart(6)}  ${Math.log10(s.solutions).toFixed(1).padStart(6)}`
        : '  (over budget)'),
  );
}
