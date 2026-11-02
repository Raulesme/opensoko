import type { Scored } from './curate';

export const STARTER_NAMES = [
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

export const ADVANCED_NAMES = [
  'Switchyard',
  'Chokepoint',
  'Bottleneck',
  'Gauntlet',
  'Labyrinth',
  'Catacomb',
  'Turnstile',
  'Spillway',
  'Undertow',
  'Crosscurrent',
  'Ironworks',
  'Gridlock',
  'Switchback',
  'Knotwork',
  'Sluice',
  'Weir',
  'Cofferdam',
  'Breakwater',
  'Maelstrom',
  'Eddy',
  'Backwater',
  'Riptide',
  'Cutwater',
  'Drydock',
  'Slipway',
  'Capstan',
  'Windlass',
  'Bulkhead',
  'Keelhaul',
  'Tangle',
  'Deadlock',
  'Impasse',
  'Quagmire',
  'Conundrum',
  'Last Crate',
];

/** Render curated picks as a TypeScript source file for src/levels/generated.ts. */
export const MASTER_NAMES = [
  'Foothold',
  'Pinch Point',
  'Crossed Wires',
  'Hard Shoulder',
  'Switchgear',
  'Tight Squeeze',
  'Slow Burn',
  'Stranglehold',
  'Pressure Valve',
  'Fault Line',
  'Long Division',
  'Dead Reckoning',
  'Knife Edge',
  'Overload',
  'Cold Iron',
  'Pitfall',
  'Black Ice',
  'Chain Reaction',
  'Undercurrent',
  'Rock Bottom',
  'Last Resort',
  'Point of No Return',
  'Gordian',
  'Redline',
  'Whiteout',
  'Hairpin',
  'Endgame',
  'Zugzwang',
  'Checkmate',
  'Apex',
];

export interface PackOptions {
  seeds: string;
  /** Exported constant name, e.g. GENERATED_LEVELS. */
  constName: string;
  /** Level id prefix, e.g. 'gen' gives gen-01. */
  idPrefix: string;
  names: readonly string[];
  title: string;
}

export function buildPackSource(picks: readonly Scored[], o: PackOptions): string {
  const entries = picks.map((p, i) => {
    const id = `${o.idPrefix}-${String(i + 1).padStart(2, '0')}`;
    const name = o.names[i] ?? `Level ${i + 1}`;
    return `  {\n    id: '${id}',\n    name: '${name}',\n    par: ${p.minPushes},\n    text: \`\n${p.text}\n\`,\n  },`;
  });
  return `import type { LevelEntry } from './types';

/**
 * ${o.title}, ordered easiest to hardest.
 * Produced by tools/generate.ts (seeds: ${o.seeds}) and selected by tools/curate.ts.
 * Every level is verified solvable by tests/levels.test.ts.
 */
export const ${o.constName}: readonly LevelEntry[] = [
${entries.join('\n')}
];
`;
}
