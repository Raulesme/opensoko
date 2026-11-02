import { describe, expect, it } from 'vitest';
import { Game, parseLevel } from '../src/game';
import { DEFAULT_OPTIONS, generateOne, mulberry32 } from '../src/generator/generate';
import { pushesToMoves, solvePushes } from '../src/generator/solver';
import { BUILTIN_LEVELS } from '../src/levels/builtin';
import { referenceSolvePushes } from './helpers/referenceSolver';

/**
 * The optimised solver must behave exactly like the original straightforward implementation:
 * same optimal push count and the same number of visited states (which feeds the difficulty
 * score, and therefore the shareable puzzle codes).
 */
describe('optimised solver matches the reference implementation', () => {
  for (const entry of BUILTIN_LEVELS.filter((_, i) => i % 3 === 0)) {
    it(`bundled level ${entry.id}`, () => {
      const level = parseLevel(entry.text);
      const fast = solvePushes(level, 100_000);
      const ref = referenceSolvePushes(level, 100_000);
      expect(fast?.pushes.length).toBe(ref?.pushes.length);
      expect(fast?.states).toBe(ref?.states);
    });
  }

  it('150 generated levels, including unsolved-within-cap results', () => {
    const rng = mulberry32(2024);
    let compared = 0;
    for (let i = 0; i < 150; i++) {
      const cand = generateOne(rng, { ...DEFAULT_OPTIONS, maxStates: 40_000 });
      if (!cand) continue;
      const level = parseLevel(cand.text);
      const fast = solvePushes(level, 3_000);
      const ref = referenceSolvePushes(level, 3_000);
      expect(fast === null).toBe(ref === null);
      expect(fast?.pushes.length).toBe(ref?.pushes.length);
      expect(fast?.states).toBe(ref?.states);
      compared++;
    }
    expect(compared).toBeGreaterThan(20);
  });
});

describe('solver output', () => {
  it('returns a solution that actually solves the level when played', () => {
    const rng = mulberry32(7);
    let checked = 0;
    for (let i = 0; i < 40 && checked < 8; i++) {
      const cand = generateOne(rng, DEFAULT_OPTIONS);
      if (!cand) continue;
      const level = parseLevel(cand.text);
      const result = solvePushes(level)!;
      const game = new Game(level);
      for (const dir of pushesToMoves(level, result.pushes)) game.move(dir);
      expect(game.isWon).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('reports null for an unsolvable level', () => {
    // The box sits in a corner away from the goal, so it can never move.
    const level = parseLevel('#####\n#$ .#\n# @ #\n#####');
    expect(solvePushes(level)).toBeNull();
  });

  it('reports null when the state budget is exhausted, and solves with a bigger one', () => {
    const level = parseLevel('#########\n#       #\n#@ $   .#\n#       #\n#########');
    expect(solvePushes(level, 2)).toBeNull();
    expect(solvePushes(level, 100_000)).not.toBeNull();
  });
});
