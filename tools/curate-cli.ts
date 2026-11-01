import { readFileSync, writeFileSync } from 'node:fs';
import { curate } from './curate';
import type { Candidate } from './generate';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1]! : fallback;
}

const inputs = arg('in', '').split(',').filter(Boolean);
const all = inputs.flatMap((f) => JSON.parse(readFileSync(f, 'utf8')) as Candidate[]);
const picks = curate(all, Number(arg('count', '35')));
writeFileSync(arg('out', 'picks.json'), JSON.stringify(picks, null, 2));
console.log(`pool ${all.length} -> picked ${picks.length}`);
for (const p of picks) {
  console.log(
    `${p.boxes} boxes ${String(p.minPushes).padStart(3)} pushes ${String(p.states).padStart(6)} states score ${p.score.toFixed(1)}`,
  );
}
