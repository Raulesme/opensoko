import { readFileSync, writeFileSync } from 'node:fs';
import { buildPackSource } from './build-pack';
import type { Scored } from './curate';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1]! : fallback;
}

const picks = JSON.parse(readFileSync(arg('in', 'picks.json'), 'utf8')) as Scored[];
writeFileSync(arg('out', 'src/levels/generated.ts'), buildPackSource(picks, arg('seeds', '?')));
console.log(`wrote ${picks.length} levels`);
