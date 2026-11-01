import type { Scored } from './curate';

const NAMES = [
  'Quarry',
  'Harbor',
  'Cellar',
  'Foundry',
  'Granary',
  'Depot',
  'Annex',
  'Loft',
  'Bunker',
  'Wharf',
  'Dockyard',
  'Smithy',
  'Cannery',
  'Boiler Room',
  'Mill',
  'Pantry',
  'Lighthouse',
  'Stockroom',
  'Crossing',
  'Gatehouse',
  'Cistern',
  'Tannery',
  'Kiln',
  'Rope Walk',
  'Bakehouse',
  'Salt Store',
  'Lamp Works',
  'Chandlery',
  'Tidal Store',
  'Belfry',
  'Vault',
  'Signal Hall',
  'Engine Shed',
  'Cold Store',
  'Long Haul',
];

/** Render curated picks as a TypeScript source file for src/levels/generated.ts. */
export function buildPackSource(picks: readonly Scored[], seeds: string): string {
  const entries = picks.map((p, i) => {
    const id = `gen-${String(i + 1).padStart(2, '0')}`;
    const name = NAMES[i] ?? `Level ${i + 1}`;
    return `  {\n    id: '${id}',\n    name: '${name}',\n    text: \`\n${p.text}\n\`,\n  },`;
  });
  return `import type { LevelEntry } from './types';

/**
 * Procedurally generated levels, ordered easiest to hardest.
 * Produced by tools/generate.ts (seeds: ${seeds}) and selected by tools/curate.ts.
 * Every level is verified solvable by tests/levels.test.ts.
 */
export const GENERATED_LEVELS: readonly LevelEntry[] = [
${entries.join('\n')}
];
`;
}
