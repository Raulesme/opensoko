import { writeFileSync } from 'node:fs';
import { generate } from './generate';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1]! : fallback;
}

const seed = Number(arg('seed', '1'));
const attempts = Number(arg('attempts', '1000'));
const file = arg('out', 'candidates.json');
const started = Date.now();
const candidates = generate(seed, attempts);
writeFileSync(file, JSON.stringify(candidates));
console.log(
  `seed ${seed}: ${candidates.length} unique solvable candidates from ${attempts} attempts ` +
    `in ${((Date.now() - started) / 1000).toFixed(1)}s -> ${file}`,
);
