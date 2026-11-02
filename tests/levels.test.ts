import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, PACKS } from '../src/levels/packs';

describe('level packs', () => {
  it('has unique level ids across all packs', () => {
    const ids = ALL_LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has non-empty packs with positive pars', () => {
    expect(PACKS.length).toBeGreaterThan(0);
    for (const pack of PACKS) {
      expect(pack.levels.length).toBeGreaterThan(0);
      for (const level of pack.levels) expect(level.par).toBeGreaterThan(0);
    }
  });
});

describe('advanced pack sharding', () => {
  it('covers every advanced level exactly once across 4 shards', () => {
    const shards = [0, 1, 2, 3].map((s) =>
      PACKS.find((p) => p.id === 'advanced')!.levels.filter((_, i) => i % 4 === s),
    );
    expect(shards.flat().length).toBe(PACKS.find((p) => p.id === 'advanced')!.levels.length);
  });
});
