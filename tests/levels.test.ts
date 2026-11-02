import { describe, expect, it } from 'vitest';
import { Game, parseLevel } from '../src/game';
import { ALL_LEVELS } from '../src/levels/packs';
import { pushesToMoves, solvePushes } from '../src/generator/solver';

describe('built-in levels', () => {
  ALL_LEVELS.forEach((entry) => {
    it(`${entry.id} parses and is solvable`, () => {
      const level = parseLevel(entry.text);
      const result = solvePushes(level, 600_000);
      expect(result).not.toBeNull();
      expect(result!.pushes.length).toBe(entry.par);
      const game = new Game(level);
      for (const dir of pushesToMoves(level, result!.pushes)) game.move(dir);
      expect(game.isWon).toBe(true);
    });
  });
});

it('built-in level ids are unique', () => {
  const ids = ALL_LEVELS.map((l) => l.id);
  expect(new Set(ids).size).toBe(ids.length);
});
