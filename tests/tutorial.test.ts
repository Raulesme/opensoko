import { describe, expect, it } from 'vitest';
import { parseLevel } from '../src/game';
import { analyzeSolutions } from '../src/generator/solutions';
import { solveDetailed } from '../src/generator/solver';
import { createDeadSquareCheck } from '../src/help/plan';
import { Game } from '../src/game';
import { TUTORIAL_STEPS, tutorialEntries } from '../src/tutorial/steps';

describe('tutorial steps', () => {
  it('has a handful of short lessons with unique ids and non-empty captions', () => {
    const entries = tutorialEntries();
    expect(entries.length).toBeGreaterThanOrEqual(4);
    expect(entries.length).toBeLessThanOrEqual(7);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
    for (const step of TUTORIAL_STEPS) {
      expect(step.caption.keys.length).toBeGreaterThan(10);
      expect(step.caption.touch.length).toBeGreaterThan(10);
      // Touch captions must not mention keys the player does not have.
      expect(step.caption.touch).not.toMatch(/arrow keys|WASD|press H|with Z/);
    }
  });

  for (const [i, step] of TUTORIAL_STEPS.entries()) {
    it(`lesson ${i + 1} (${step.name}) is solvable and its par is exact`, () => {
      const level = parseLevel(step.text);
      const outcome = solveDetailed(level);
      expect(outcome.status).toBe('solved');
      if (outcome.status === 'solved') expect(outcome.result.pushes.length).toBe(step.par);
    });
  }

  it('lessons are small enough for a first-time player', () => {
    for (const step of TUTORIAL_STEPS) {
      const level = parseLevel(step.text);
      expect(level.boxes.length).toBeLessThanOrEqual(2);
      expect(step.par).toBeLessThanOrEqual(8);
      expect(analyzeSolutions(level)?.visited ?? 0).toBeLessThan(500);
    }
  });

  it('the "Mistakes" lesson really lets you ruin the level by pushing the crate up the wall', () => {
    const step = TUTORIAL_STEPS.find((s) => s.name === 'Mistakes happen')!;
    const level = parseLevel(step.text);
    const game = new Game(level);
    const dead = createDeadSquareCheck(level);
    expect(dead(game)).toBe(false);
    // Walk under the crate, then push it up into the top wall row.
    game.move('right');
    game.move('up');
    expect(game.pushes).toBe(1);
    expect(dead(game)).toBe(true);
    game.undo();
    expect(dead(game)).toBe(false);
  });
});
