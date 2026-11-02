/**
 * Offline search for much harder levels: hill-climb each candidate for many edits.
 *   npx vite-node tools/climb-cli.ts --in candidates.json --out climbed.json --steps 200
 * Sampling alone tops out around challenge 70; climbing routinely passes 100.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { climb } from '../src/generator/climb';
import { isAcceptable } from '../src/generator/curate';
import { challenge, mulberry32 } from '../src/generator/generate';
import type { Candidate } from '../src/generator/generate';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1]! : fallback;
}

const input = JSON.parse(readFileSync(arg('in', 'candidates.json'), 'utf8')) as Candidate[];
const steps = Number(arg('steps', '200'));
const maxStates = Number(arg('max-states', '150000'));
const cap = Number(arg('max-challenge', '1000')); // stop climbing once a level reaches this score
const rng = mulberry32(Number(arg('seed', '1')));

const out: Candidate[] = [];
for (const [i, start] of input.entries()) {
  const t = Date.now();
  const best = climb(start, rng, {
    steps,
    maxStates,
    done: (c) => challenge(c) >= cap,
    acceptable: isAcceptable,
  });
  out.push(best);
  console.log(
    `${i + 1}/${input.length}: challenge ${challenge(start).toFixed(0)} -> ${challenge(best).toFixed(0)} ` +
      `(excess ${best.excess}, away ${best.away}, pushes ${best.minPushes}, boxes ${best.boxes}) ` +
      `${((Date.now() - t) / 1000).toFixed(0)}s`,
  );
  writeFileSync(arg('out', 'climbed.json'), JSON.stringify(out)); // save progress as we go
}
