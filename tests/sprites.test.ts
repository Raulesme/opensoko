import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TILE } from '../src/render/sprites';

/** Read width/height from a PNG's IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const buf = readFileSync(new URL(`../src/assets/sprites/${file}`, import.meta.url));
  expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('sprite assets', () => {
  for (const name of ['floor', 'wall', 'goal', 'crate', 'crate-done']) {
    it(`${name}.png is one tile (${TILE}x${TILE})`, () => {
      expect(pngSize(`${name}.png`)).toEqual({ width: TILE, height: TILE });
    });
  }

  for (const dir of ['north', 'south', 'east', 'west']) {
    it(`player-${dir}.png is square and at least one tile wide`, () => {
      const { width, height } = pngSize(`player-${dir}.png`);
      expect(width).toBe(height);
      expect(width).toBeGreaterThanOrEqual(TILE);
    });
  }
});
