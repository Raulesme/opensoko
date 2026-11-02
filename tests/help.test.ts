import { describe, expect, it } from 'vitest';
import { Game, parseLevel } from '../src/game';
import type { Direction } from '../src/game';
import { SolveClient } from '../src/help/client';
import type { SolveRequest, SolveResponse, WorkerLike } from '../src/help/client';
import { createDeadSquareCheck, HintPlan, levelFromGame, nextPush } from '../src/help/plan';
import { pushesToMoves, solveDetailed } from '../src/generator/solver';

describe('solveDetailed', () => {
  it('distinguishes solved, unsolvable and out-of-budget', () => {
    const open = parseLevel('#########\n#       #\n#@ $   .#\n#       #\n#########');
    expect(solveDetailed(open, 100_000).status).toBe('solved');
    expect(solveDetailed(open, 2).status).toBe('budget');
    expect(solveDetailed(parseLevel('#####\n#$ .#\n# @ #\n#####')).status).toBe('unsolvable');
  });
});

describe('solving from the middle of a game', () => {
  const text = '#########\n#       #\n#@ $   .#\n#       #\n#########';

  it('levelFromGame reflects the current positions', () => {
    const game = new Game(parseLevel(text));
    game.move('right'); // step next to the box
    const level = levelFromGame(game);
    expect(level.player).toBe(game.playerIndex);
    expect(level.boxes).toEqual([...game.boxIndices]);
  });

  it('a solution found from the current position finishes the game', () => {
    const game = new Game(parseLevel(text));
    game.move('down');
    game.move('right');
    const level = levelFromGame(game);
    const outcome = solveDetailed(level);
    expect(outcome.status).toBe('solved');
    if (outcome.status !== 'solved') return;
    for (const dir of pushesToMoves(level, outcome.result.pushes)) game.move(dir);
    expect(game.isWon).toBe(true);
  });
});

describe('nextPush', () => {
  it('finds the first push in a move list, skipping walking moves', () => {
    const game = new Game(parseLevel('#########\n#       #\n#@ $   .#\n#       #\n#########'));
    // Two steps right bring the player next to the box; the third move pushes it.
    const push = nextPush(game, ['right', 'right', 'right', 'right']);
    expect(push).toEqual({ from: 3 + 2 * 9, to: 4 + 2 * 9, dir: 'right' });
  });

  it('returns null when the moves never push', () => {
    const game = new Game(parseLevel('#########\n#       #\n#@ $   .#\n#       #\n#########'));
    expect(nextPush(game, ['up', 'down'])).toBeNull();
    expect(nextPush(game, [])).toBeNull();
  });

  it('does not change the real game', () => {
    const game = new Game(parseLevel('#########\n#       #\n#@ $   .#\n#       #\n#########'));
    const before = [game.playerIndex, ...game.boxIndices];
    nextPush(game, ['right', 'right', 'right']);
    expect([game.playerIndex, ...game.boxIndices]).toEqual(before);
  });
});

describe('HintPlan', () => {
  it('advances when the player follows it and empties when they deviate', () => {
    const plan = new HintPlan(['right', 'right', 'down']);
    expect(plan.follow('right')).toBe(true);
    expect(plan.remaining).toEqual(['right', 'down']);
    expect(plan.follow('up')).toBe(false);
    expect(plan.isEmpty).toBe(true);
  });

  it('does not mutate the array it was given', () => {
    const moves: Direction[] = ['up', 'down'];
    new HintPlan(moves).follow('up');
    expect(moves).toEqual(['up', 'down']);
  });
});

describe('createDeadSquareCheck', () => {
  it('flags a box stuck in a corner away from every goal', () => {
    const level = parseLevel('#####\n#$ .#\n# @ #\n#####');
    expect(createDeadSquareCheck(level)(new Game(level))).toBe(true);
  });

  it('does not flag a box that is on a goal, even in a corner', () => {
    const level = parseLevel('######\n#* . #\n#    #\n#  $@#\n#    #\n######');
    expect(createDeadSquareCheck(level)(new Game(level))).toBe(false);
  });

  it('does not flag boxes on live squares, and updates as boxes move', () => {
    const level = parseLevel('#######\n#.    #\n#     #\n# $@  #\n#     #\n#     #\n#######');
    const dead = createDeadSquareCheck(level);
    const game = new Game(level);
    expect(dead(game)).toBe(false);
    game.move('left'); // push the box left against the wall: still able to slide up to the goal
    expect(dead(game)).toBe(false);
    // Push it down the wall into the bottom-left corner.
    game.move('up');
    game.move('left');
    game.move('up'); // walk around above the box
    for (let i = 0; i < 4; i++) game.move('down'); // push it down to the corner
    expect(dead(game)).toBe(true);
  });
});

/** A fake worker that answers only when told to. */
class FakeWorker implements WorkerLike {
  onmessage: ((e: { data: SolveResponse }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  terminated = false;
  requests: SolveRequest[] = [];
  postMessage(message: SolveRequest): void {
    this.requests.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
  reply(response: SolveResponse): void {
    this.onmessage?.({ data: response });
  }
}

describe('SolveClient', () => {
  const level = parseLevel('#####\n#@$.#\n#####');

  it('resolves with the worker reply and cleans the worker up', async () => {
    const workers: FakeWorker[] = [];
    const client = new SolveClient(() => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    });
    const promise = client.solve(level, 1000);
    const request = workers[0]!.requests[0]!;
    expect(request.maxStates).toBe(1000);
    workers[0]!.reply({ id: request.id, status: 'solved', moves: ['right'] });
    expect(await promise).toEqual({ id: request.id, status: 'solved', moves: ['right'] });
    expect(workers[0]!.terminated).toBe(true);
  });

  it('a newer request supersedes the running one and terminates its worker', async () => {
    const workers: FakeWorker[] = [];
    const client = new SolveClient(() => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    });
    const first = client.solve(level, 1000);
    const second = client.solve(level, 2000);
    expect(workers[0]!.terminated).toBe(true);
    expect((await first).status).toBe('error'); // superseded
    // A late answer from the old worker must not resolve the new request.
    workers[0]!.reply({ id: 1, status: 'budget' });
    workers[1]!.reply({ id: 2, status: 'unsolvable' });
    expect((await second).status).toBe('unsolvable');
  });

  it('cancel resolves the pending request and a worker error becomes status error', async () => {
    const workers: FakeWorker[] = [];
    const client = new SolveClient(() => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    });
    const p1 = client.solve(level, 10);
    client.cancel();
    expect((await p1).status).toBe('error');
    const p2 = client.solve(level, 10);
    workers[1]!.onerror?.(new Error('boom'));
    expect((await p2).status).toBe('error');
  });
});
