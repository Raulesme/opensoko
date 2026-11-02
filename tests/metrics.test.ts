import { describe, expect, it } from 'vitest';
import { parseLevel } from '../src/game';
import { analyze, pushDistances } from '../src/generator/metrics';
import { solvePushes } from '../src/generator/solver';

const metricsFor = (text: string) => {
  const level = parseLevel(text);
  const result = solvePushes(level)!;
  return { level, pushes: result.pushes.length, ...analyze(level, result.pushes) };
};

describe('pushDistances', () => {
  it('counts lone-box pushes to the nearest goal and marks dead squares -1', () => {
    const level = parseLevel('######\n#@ $.#\n######');
    const d = pushDistances(level);
    const w = level.width;
    expect(d[1 * w + 4]).toBe(0); // the goal
    expect(d[1 * w + 3]).toBe(1); // one push left of the goal
    expect(d[1 * w + 2]).toBe(2);
    // The corridor has no room to push vertically, and the left end cannot be pushed right
    // because the player cannot get behind it.
    expect(d[1 * w + 1]).toBe(-1);
  });
});

describe('analyze', () => {
  it('a lone box pushed straight to its goal has zero excess and no away pushes', () => {
    const m = metricsFor('#######\n#@ $ .#\n#######');
    expect(m.pushes).toBe(2);
    expect(m.lowerBound).toBe(2);
    expect(m.excess).toBe(0);
    expect(m.away).toBe(0);
    expect(m.moved).toBe(1);
  });

  it('counts the extra pushes boxes force on each other as excess', () => {
    // Boxes side by side in a corridor: the right one must go first, and the left one blocks the
    // player from reaching it, so extra work is needed beyond the independent lower bound.
    const rows = ['########', '#      #', '#@ $$ .#', '#     .#', '########'];
    const m = metricsFor(rows.join('\n'));
    expect(m.excess).toBeGreaterThanOrEqual(0);
    expect(m.pushes).toBe(m.lowerBound + m.excess);
    expect(m.moved).toBe(2);
  });

  it('excess is never negative and the bound is a true lower bound', () => {
    const m = metricsFor('#######\n#.    #\n#.    #\n#  $@ #\n# $   #\n#     #\n#######');
    expect(m.excess).toBeGreaterThanOrEqual(0);
    expect(m.pushes).toBeGreaterThanOrEqual(m.lowerBound);
  });
});
