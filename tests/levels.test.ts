import { describe, expect, it } from 'vitest';
import { Game, parseLevel } from '../src/game';
import { BUILTIN_LEVELS } from '../src/levels/builtin';
import { spriteDefinitions, TILE } from '../src/render/sprites';
import { solve } from './helpers/solve';

describe('built-in levels', () => {
  BUILTIN_LEVELS.forEach((text, i) => {
    it(`level ${i + 1} parses and is solvable`, () => {
      const level = parseLevel(text);
      const solution = solve(level);
      expect(solution).not.toBeNull();
      const game = new Game(level);
      for (const dir of solution!) game.move(dir);
      expect(game.isWon).toBe(true);
    });
  });
});

describe('sprite definitions', () => {
  for (const [name, def] of Object.entries(spriteDefinitions())) {
    it(`${name} is ${TILE}x${TILE} and uses only known palette keys`, () => {
      expect(def.rows).toHaveLength(TILE);
      for (const row of def.rows) {
        expect(row).toHaveLength(TILE);
        for (const ch of row) expect(ch === '.' || ch in def.palette).toBe(true);
      }
    });
  }
});
