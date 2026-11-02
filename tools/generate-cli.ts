import { writeFileSync } from 'node:fs';
import { DEFAULT_OPTIONS, generate } from '../src/generator/generate';
import type { GenOptions } from '../src/generator/generate';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1]! : fallback;
}
const nums = (s: string) => s.split(',').map(Number);

const seed = Number(arg('seed', '1'));
const attempts = Number(arg('attempts', '1000'));
const file = arg('out', 'candidates.json');
const pulls = nums(arg('pulls', DEFAULT_OPTIONS.pullsPerBox.join(',')));
const hillPulls = nums(arg('hill-pulls', DEFAULT_OPTIONS.hillPulls.join(',')));
const opts: GenOptions = {
  boxes: nums(arg('boxes', DEFAULT_OPTIONS.boxes.join(','))),
  pullsPerBox: [pulls[0]!, pulls[1]!],
  hill: Number(arg('hill', String(DEFAULT_OPTIONS.hill))),
  hillPulls: [hillPulls[0]!, hillPulls[1]!],
  maxStates: Number(arg('max-states', String(DEFAULT_OPTIONS.maxStates))),
};

const started = Date.now();
const candidates = generate(seed, attempts, opts);
writeFileSync(file, JSON.stringify(candidates));
console.log(
  `seed ${seed}: ${candidates.length} candidates from ${attempts} attempts ` +
    `in ${((Date.now() - started) / 1000).toFixed(1)}s -> ${file}`,
);
