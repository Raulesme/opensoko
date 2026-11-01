import { describe, expect, it } from 'vitest';
import { Game, parseLevel } from '../src/game';

const game = (text: string) => new Game(parseLevel(text));

describe('Game movement', () => {
  it('moves into free floor and counts the move', () => {
    const g = game('######\n#@ $.#\n######');
    expect(g.move('right')).toEqual({ moved: true, pushed: false });
    expect(g.playerIndex).toBe(8);
    expect(g.moves).toBe(1);
    expect(g.pushes).toBe(0);
  });

  it('blocks movement into walls and off-grid', () => {
    const g = game('#####\n#@$.#\n#####');
    expect(g.move('left')).toEqual({ moved: false, pushed: false });
    expect(g.move('up')).toEqual({ moved: false, pushed: false });
    expect(g.moves).toBe(0);
  });

  it('pushes a box and counts the push', () => {
    const g = game('######\n#@$ .#\n######');
    expect(g.move('right')).toEqual({ moved: true, pushed: true });
    expect(g.hasBoxAt(9)).toBe(true);
    expect(g.pushes).toBe(1);
  });

  it('cannot push a box into a wall', () => {
    const g = game('######\n#@$#.#\n#    #\n######');
    expect(g.move('right')).toEqual({ moved: false, pushed: false });
    expect(g.hasBoxAt(8)).toBe(true);
    expect(g.playerIndex).toBe(7);
  });

  it('cannot push two boxes in a row', () => {
    const g = game('#######\n#@$$ .#\n#.    #\n#######');
    expect(g.move('right')).toEqual({ moved: false, pushed: false });
  });
});

describe('Game win, undo, restart', () => {
  const LEVEL = '######\n#@$ .#\n######';

  it('detects a win and ignores further moves', () => {
    const g = game(LEVEL);
    expect(g.isWon).toBe(false);
    g.move('right');
    g.move('right');
    expect(g.isWon).toBe(true);
    expect(g.move('left')).toEqual({ moved: false, pushed: false });
  });

  it('undoes steps and pushes, restoring counters', () => {
    const g = game(LEVEL);
    g.move('right');
    expect(g.undo()).toBe(true);
    expect(g.playerIndex).toBe(parseLevel(LEVEL).player);
    expect(g.hasBoxAt(parseLevel(LEVEL).boxes[0]!)).toBe(true);
    expect(g.moves).toBe(0);
    expect(g.pushes).toBe(0);
    expect(g.canUndo).toBe(false);
  });

  it('undo after a win re-enables moving', () => {
    const g = game(LEVEL);
    g.move('right');
    g.move('right');
    g.undo();
    expect(g.isWon).toBe(false);
    expect(g.move('right').pushed).toBe(true);
  });

  it('undo with empty history returns false', () => {
    expect(game(LEVEL).undo()).toBe(false);
  });

  it('restart resets everything', () => {
    const g = game(LEVEL);
    g.move('right');
    g.move('right');
    g.restart();
    expect(g.isWon).toBe(false);
    expect(g.moves).toBe(0);
    expect(g.pushes).toBe(0);
    expect(g.playerIndex).toBe(parseLevel(LEVEL).player);
  });
});
