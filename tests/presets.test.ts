import { describe, expect, it } from 'vitest';
import { challenge } from '../src/generator/generate';
import { findPreset, generateForPreset, PRESETS } from '../src/generator/presets';
import { parseLevel } from '../src/game';
import { solvePushes } from '../src/generator/solver';

describe('presets', () => {
  it('have unique ids and contiguous, increasing difficulty bands', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (let i = 1; i < PRESETS.length; i++) {
      expect(PRESETS[i]!.minChallenge).toBeGreaterThanOrEqual(PRESETS[i - 1]!.maxChallenge);
    }
  });

  it('demand more interaction as difficulty rises', () => {
    for (let i = 1; i < PRESETS.length; i++) {
      expect(PRESETS[i]!.minExcess).toBeGreaterThanOrEqual(PRESETS[i - 1]!.minExcess);
      expect(PRESETS[i]!.minAway).toBeGreaterThanOrEqual(PRESETS[i - 1]!.minAway);
    }
    expect(findPreset('hard')!.minExcess).toBeGreaterThan(0);
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
      const c = a!.candidate;
      const score = challenge(c);
      expect(score).toBeGreaterThanOrEqual(preset.minChallenge);
      expect(score).toBeLessThan(preset.maxChallenge);
      expect(c.excess).toBeGreaterThanOrEqual(preset.minExcess);
      expect(c.away).toBeGreaterThanOrEqual(preset.minAway);
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
