import { expect, it } from 'vitest';
import { Game, parseLevel } from '../../src/game';
import { pushesToMoves, solvePushes } from '../../src/generator/solver';
import type { LevelEntry } from '../../src/levels/types';

/** Register one test per level: it parses, is solvable, and its par matches the solver. */
export function verifyLevels(levels: readonly LevelEntry[]): void {
  // A shard of an empty or small pack may have nothing to check; vitest rejects empty suites.
  if (levels.length === 0) it.skip('no levels in this shard', () => undefined);
  for (const entry of levels) {
    it(`${entry.id} parses, is solvable and has the right par`, () => {
      const level = parseLevel(entry.text);
      const result = solvePushes(level, 600_000);
      expect(result).not.toBeNull();
      expect(result!.pushes.length).toBe(entry.par);
      const game = new Game(level);
      for (const dir of pushesToMoves(level, result!.pushes)) game.move(dir);
      expect(game.isWon).toBe(true);
    });
  }
}
