import { describe, expect, it } from 'vitest';
import { difficulty } from '../src/generator/generate';
import { findPreset, generateForPreset, PRESETS } from '../src/generator/presets';
import { parseLevel } from '../src/game';
import { solvePushes } from '../src/generator/solver';

describe('presets', () => {
  it('have unique ids and contiguous, increasing difficulty bands', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (let i = 1; i < PRESETS.length; i++) {
      expect(PRESETS[i]!.minDifficulty).toBeGreaterThanOrEqual(PRESETS[i - 1]!.maxDifficulty);
    }
  });

  it('can be looked up by id', () => {
    expect(findPreset('easy')?.name).toBe('Easy');
    expect(findPreset('nope')).toBeUndefined();
  });

  for (const id of ['easy', 'medium']) {
    it(`${id}: same seed gives the same solvable level inside its difficulty band`, () => {
      const preset = findPreset(id)!;
      const a = generateForPreset(4242, preset);
      const b = generateForPreset(4242, preset);
      expect(a).not.toBeNull();
      expect(a!.candidate.text).toBe(b!.candidate.text);
      const d = difficulty(a!.candidate);
      expect(d).toBeGreaterThanOrEqual(preset.minDifficulty);
      expect(d).toBeLessThan(preset.maxDifficulty);
      const solved = solvePushes(parseLevel(a!.candidate.text), 200_000);
      expect(solved?.pushes.length).toBe(a!.candidate.minPushes);
    });

    it(`${id}: different seeds give different levels`, () => {
      const preset = findPreset(id)!;
      const texts = new Set(
        [1, 2, 3, 4, 5].map((s) => generateForPreset(s, preset)?.candidate.text),
      );
      expect(texts.size).toBeGreaterThan(1);
    });
  }
});
