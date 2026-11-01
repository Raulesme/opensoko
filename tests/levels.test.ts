import { describe, expect, it } from 'vitest';
import { Game, parseLevel } from '../src/game';
import { BUILTIN_LEVELS } from '../src/levels/builtin';
import { pushesToMoves, solvePushes } from '../tools/solver';

describe('built-in levels', () => {
  BUILTIN_LEVELS.forEach((entry) => {
    it(`${entry.id} parses and is solvable`, () => {
      const level = parseLevel(entry.text);
      const result = solvePushes(level);
      expect(result).not.toBeNull();
      const game = new Game(level);
      for (const dir of pushesToMoves(level, result!.pushes)) game.move(dir);
      expect(game.isWon).toBe(true);
    });
  });
});

it('built-in level ids are unique', () => {
  const ids = BUILTIN_LEVELS.map((l) => l.id);
  expect(new Set(ids).size).toBe(ids.length);
});
