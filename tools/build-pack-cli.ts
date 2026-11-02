import { readFileSync, writeFileSync } from 'node:fs';
import { ADVANCED_NAMES, buildPackSource, STARTER_NAMES } from '../src/generator/build-pack';
import type { Scored } from '../src/generator/curate';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1]! : fallback;
}

const picks = JSON.parse(readFileSync(arg('in', 'picks.json'), 'utf8')) as Scored[];
const advanced = arg('pack', 'starter') === 'advanced';
writeFileSync(
  arg('out', 'src/levels/generated.ts'),
  buildPackSource(picks, {
    seeds: arg('seeds', '?'),
    constName: advanced ? 'ADVANCED_LEVELS' : 'GENERATED_LEVELS',
    idPrefix: advanced ? 'adv' : 'gen',
    names: advanced ? ADVANCED_NAMES : STARTER_NAMES,
    title: advanced ? 'Harder procedurally generated levels' : 'Procedurally generated levels',
  }),
);
console.log(`wrote ${picks.length} levels`);
