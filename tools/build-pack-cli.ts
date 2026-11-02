import { readFileSync, writeFileSync } from 'node:fs';
import {
  ADVANCED_NAMES,
  buildPackSource,
  MASTER_NAMES,
  STARTER_NAMES,
} from '../src/generator/build-pack';
import type { Scored } from '../src/generator/curate';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1]! : fallback;
}

const picks = JSON.parse(readFileSync(arg('in', 'picks.json'), 'utf8')) as Scored[];
const pack = arg('pack', 'starter');
const config = {
  starter: {
    constName: 'GENERATED_LEVELS',
    idPrefix: 'gen',
    names: STARTER_NAMES,
    title: 'Procedurally generated levels',
  },
  advanced: {
    constName: 'ADVANCED_LEVELS',
    idPrefix: 'adv',
    names: ADVANCED_NAMES,
    title: 'Harder procedurally generated levels',
  },
  master: {
    constName: 'MASTER_LEVELS',
    idPrefix: 'mst',
    names: MASTER_NAMES,
    title: 'Very hard levels found by local search (tools/climb-cli.ts)',
  },
}[pack];
if (!config) throw new Error(`Unknown pack '${pack}' (use starter, advanced or master)`);
writeFileSync(
  arg('out', 'src/levels/generated.ts'),
  buildPackSource(picks, { seeds: arg('seeds', '?'), ...config }),
);
console.log(`wrote ${picks.length} levels`);
