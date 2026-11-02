import { describe, expect, it } from 'vitest';
import {
  CODE_VERSION,
  codeVersion,
  formatCode,
  parseCode,
  PRESET_LETTERS,
  randomSeed,
} from '../src/generator/code';
import { canonical, DEFAULT_OPTIONS, generateOne, mulberry32 } from '../src/generator/generate';
import { PRESETS } from '../src/generator/presets';
import { parseLevel } from '../src/game';
import { solvePushes } from '../src/generator/solver';

describe('puzzle codes', () => {
  it('formats a short code: version digit, difficulty letter, base-36 seed', () => {
    expect(formatCode({ preset: 'hard', seed: 482913 })).toBe('2h' + (482913).toString(36));
    expect(formatCode({ preset: 'expert', seed: 0 })).toBe('2x0');
  });

  it('round-trips every preset across the whole seed range', () => {
    for (const preset of PRESETS) {
      for (const seed of [0, 1, 35, 36, 482913, 999_999_999, 0xffffffff]) {
        expect(parseCode(formatCode({ preset: preset.id, seed }))).toEqual({
          preset: preset.id,
          seed,
        });
      }
    }
  });

  it('stays short for the seeds the game actually generates', () => {
    for (let i = 0; i < 2000; i++) {
      expect(formatCode({ preset: 'medium', seed: randomSeed() }).length).toBeLessThanOrEqual(8);
    }
  });

  it('still accepts the older long form and gives the same puzzle as the short form', () => {
    expect(parseCode('v2.hard.482913')).toEqual({ preset: 'hard', seed: 482913 });
    expect(parseCode('v2.hard.482913')).toEqual(
      parseCode(formatCode({ preset: 'hard', seed: 482913 })),
    );
  });

  it('is forgiving about case, whitespace and pasted links', () => {
    const code = formatCode({ preset: 'easy', seed: 12345 });
    expect(parseCode(`  ${code.toUpperCase()} `)).toEqual({ preset: 'easy', seed: 12345 });
    expect(parseCode('  V2.Easy.7 ')).toEqual({ preset: 'easy', seed: 7 });
    expect(parseCode(`https://example.github.io/opensoko/#p=${code}`)).toEqual({
      preset: 'easy',
      seed: 12345,
    });
  });

  it('rejects malformed codes, unknown difficulties and out-of-range seeds', () => {
    for (const bad of [
      '',
      '2',
      '2h',
      'hard.1',
      'v2.hard.',
      'v2.hard.abc',
      'v2.hard.99999999999',
      '2q5', // no difficulty with that letter
      '2h' + 'z'.repeat(7), // seed beyond 32 bits
      '2h12345678', // too many seed characters
      'hello',
    ]) {
      expect(parseCode(bad)).toBeNull();
    }
  });

  it('rejects other generator versions but can still tell their version', () => {
    expect(parseCode('v1.hard.1')).toBeNull();
    expect(parseCode('1h5')).toBeNull();
    expect(parseCode('3h5')).toBeNull();
    expect(codeVersion('v1.hard.1')).toBe(1);
    expect(codeVersion('1h5')).toBe(1);
    expect(codeVersion('3h5')).toBe(3);
    expect(codeVersion(formatCode({ preset: 'hard', seed: 9 }))).toBe(CODE_VERSION);
    expect(codeVersion('hello')).toBeNull();
  });

  it('has a distinct code letter for every preset, and no letter for a preset that is gone', () => {
    const letters = PRESETS.map((p) => PRESET_LETTERS[p.id]);
    expect(letters.every(Boolean)).toBe(true);
    expect(new Set(letters).size).toBe(PRESETS.length);
    expect(() => formatCode({ preset: 'nope', seed: 1 })).toThrow();
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
