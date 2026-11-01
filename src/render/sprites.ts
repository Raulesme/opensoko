/** Placeholder 8x8 pixel-art sprites, defined as palette-indexed text. '.' is transparent. */
export const TILE = 8;

export type SpriteName = 'floor' | 'wall' | 'goal' | 'box' | 'boxOnGoal' | 'player';

interface SpriteDef {
  palette: Readonly<Record<string, string>>;
  rows: readonly string[];
}

const SPRITES: Readonly<Record<SpriteName, SpriteDef>> = {
  floor: {
    palette: { a: '#2b2d42', b: '#33364f' },
    rows: [
      'aaaaaaaa',
      'aaaaaaaa',
      'aaabaaaa',
      'aaaaaaaa',
      'aaaaaaaa',
      'aaaaaaba',
      'aaaaaaaa',
      'aaaaaaaa',
    ],
  },
  wall: {
    palette: { a: '#8d5b3f', b: '#4a2f22' },
    rows: [
      'bbbbbbbb',
      'aaabaaaa',
      'aaabaaaa',
      'bbbbbbbb',
      'aabaaaab',
      'aabaaaab',
      'aabaaaab',
      'bbbbbbbb',
    ],
  },
  goal: {
    palette: { g: '#ffd166' },
    rows: [
      '........',
      '........',
      '...gg...',
      '..gggg..',
      '..gggg..',
      '...gg...',
      '........',
      '........',
    ],
  },
  box: {
    palette: { d: '#7a4a12', e: '#e0a030' },
    rows: [
      'dddddddd',
      'deeeeeed',
      'dedeeded',
      'deeddeed',
      'deeddeed',
      'dedeeded',
      'deeeeeed',
      'dddddddd',
    ],
  },
  boxOnGoal: {
    palette: { d: '#2e7d32', e: '#6fcf6f' },
    rows: [
      'dddddddd',
      'deeeeeed',
      'dedeeded',
      'deeddeed',
      'deeddeed',
      'dedeeded',
      'deeeeeed',
      'dddddddd',
    ],
  },
  player: {
    palette: { h: '#3b82f6', s: '#f2c9a0', p: '#ef476f', k: '#1d3557' },
    rows: [
      '..hhhh..',
      '..ssss..',
      '..skks..',
      '.pppppp.',
      'ss.pp.ss',
      '...pp...',
      '..k..k..',
      '..k..k..',
    ],
  },
};

export type SpriteAtlas = Readonly<Record<SpriteName, HTMLCanvasElement>>;

/** Rasterise every sprite into its own small canvas, once. */
export function buildAtlas(): SpriteAtlas {
  const atlas = {} as Record<SpriteName, HTMLCanvasElement>;
  for (const name of Object.keys(SPRITES) as SpriteName[]) {
    const def = SPRITES[name];
    const canvas = document.createElement('canvas');
    canvas.width = TILE;
    canvas.height = TILE;
    const ctx = canvas.getContext('2d')!;
    def.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const colour = def.palette[row[x]!];
        if (!colour) continue;
        ctx.fillStyle = colour;
        ctx.fillRect(x, y, 1, 1);
      }
    });
    atlas[name] = canvas;
  }
  return atlas;
}

/** Exposed for tests: every sprite must be TILE x TILE and only use palette keys or '.'. */
export function spriteDefinitions(): Readonly<Record<SpriteName, SpriteDef>> {
  return SPRITES;
}
