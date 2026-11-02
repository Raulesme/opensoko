import { describe, expect, it } from 'vitest';
import { parseLevel } from '../src/game';
import { analyzeSolutions } from '../src/generator/solutions';
import { solvePushes } from '../src/generator/solver';
import { BUILTIN_LEVELS } from '../src/levels/builtin';

describe('analyzeSolutions', () => {
  it('a single forced corridor has exactly one solution and no choices', () => {
    const s = analyzeSolutions(parseLevel('#######\n#@ $ .#\n#######'))!;
    expect(s.depth).toBe(2);
    expect(s.solutions).toBe(1);
    expect(s.forcedFraction).toBe(1);
    expect(s.width).toBeCloseTo(1, 5);
  });

  it('two boxes that can be finished in either order give exactly 2 solutions', () => {
    // Player between two boxes, each one push from its goal: left-then-right or right-then-left.
    const s = analyzeSolutions(parseLevel('#######\n#.$@$.#\n#######'))!;
    expect(s.depth).toBe(2);
    expect(s.solutions).toBe(2);
    // Start has 2 optimal next pushes (a real choice); the 2 middle positions have exactly 1.
    expect(s.forcedFraction).toBeCloseTo(2 / 3, 5);
    expect(s.optimalStates).toBe(4); // start, two middle positions, solved position
  });

  it('reports null for an unsolvable level', () => {
    expect(analyzeSolutions(parseLevel('#####\n#$ .#\n# @ #\n#####'))).toBeNull();
  });

  it('agrees with the solver on the optimal depth for the starter levels', () => {
    for (const entry of BUILTIN_LEVELS.slice(0, 20)) {
      const level = parseLevel(entry.text);
      const s = analyzeSolutions(level, 60_000);
      const solved = solvePushes(level, 60_000);
      expect(s?.depth).toBe(solved?.pushes.length);
    }
  });

  it('forced fraction and width stay in range', () => {
    for (const entry of BUILTIN_LEVELS.slice(0, 12)) {
      const s = analyzeSolutions(parseLevel(entry.text), 60_000)!;
      expect(s.forcedFraction).toBeGreaterThanOrEqual(0);
      expect(s.forcedFraction).toBeLessThanOrEqual(1);
      expect(s.width).toBeGreaterThanOrEqual(1);
      expect(s.solutions).toBeGreaterThanOrEqual(1);
    }
  });
});
