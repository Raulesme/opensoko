import { describe, expect, it } from 'vitest';
import { formatCode, parseCode } from '../src/generator/code';
import { canonical, generateOne, mulberry32, DEFAULT_OPTIONS } from '../src/generator/generate';
import { parseLevel } from '../src/game';
import { solvePushes } from '../src/generator/solver';

describe('puzzle codes', () => {
  it('round-trips', () => {
    expect(formatCode({ preset: 'hard', seed: 482913 })).toBe('v2.hard.482913');
    expect(parseCode('v2.hard.482913')).toEqual({ preset: 'hard', seed: 482913 });
  });
  it('is forgiving about case and whitespace', () => {
    expect(parseCode('  V2.Easy.7 ')).toEqual({ preset: 'easy', seed: 7 });
  });
  it('rejects malformed codes and other versions', () => {
    for (const bad of [
      '',
      'hard.1',
      'v1.hard.1',
      'v2.hard.',
      'v2.hard.abc',
      'v2.hard.99999999999',
    ]) {
      expect(parseCode(bad)).toBeNull();
    }
  });
});

describe('generator', () => {
  it('is deterministic for a given seed', () => {
    const run = (seed: number) => {
      const rng = mulberry32(seed);
      const out: (string | null)[] = [];
      for (let i = 0; i < 15; i++) out.push(generateOne(rng, DEFAULT_OPTIONS)?.text ?? null);
      return out;
    };
    expect(run(123)).toEqual(run(123));
    expect(run(123)).not.toEqual(run(124));
  });

  it('only produces valid, solvable levels', () => {
    const rng = mulberry32(99);
    let produced = 0;
    for (let i = 0; i < 40; i++) {
      const c = generateOne(rng, DEFAULT_OPTIONS);
      if (!c) continue;
      produced++;
      const level = parseLevel(c.text);
      expect(solvePushes(level, 200_000)?.pushes.length).toBe(c.minPushes);
    }
    expect(produced).toBeGreaterThan(5);
  });

  it('canonical form ignores rotation and reflection', () => {
    const a = '#####\n#@$.#\n#####';
    const rotated = '###\n#@#\n#$#\n#.#\n###';
    expect(canonical(a)).toBe(canonical(rotated));
  });
});
