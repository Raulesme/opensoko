import { describe, expect, it } from 'vitest';
import { Game, parseLevel } from '../src/game';
import type { Direction } from '../src/game';
import { solveDetailed, pushesToMoves } from '../src/generator/solver';
import type { SolveResponse } from '../src/help/client';
import { Help } from '../src/help/controller';
import type { HelpDeps } from '../src/help/controller';
import type { Level } from '../src/game';

const LEVEL = '#########\n#       #\n#@ $   .#\n#       #\n#########';

/** A manual clock: scheduled callbacks run only when `advance` is called. */
function makeClock() {
  let now = 0;
  const tasks: { at: number; fn: () => void; id: number }[] = [];
  let nextId = 1;
  return {
    schedule: (fn: () => void, ms: number) => {
      const id = nextId++;
      tasks.push({ at: now + ms, fn, id });
      return id;
    },
    unschedule: (h: unknown) => {
      const i = tasks.findIndex((t) => t.id === h);
      if (i >= 0) tasks.splice(i, 1);
    },
    async advance(ms: number) {
      const end = now + ms;
      for (;;) {
        tasks.sort((a, b) => a.at - b.at);
        const task = tasks[0];
        if (!task || task.at > end) break;
        tasks.shift();
        now = task.at;
        task.fn();
        await Promise.resolve();
        await Promise.resolve();
      }
      now = end;
    },
    get pending() {
      return tasks.length;
    },
  };
}

/** A client backed by the real solver, with call counting and optional overrides. */
function realClient(override?: (level: Level) => Promise<SolveResponse> | null) {
  const calls: { budget: number }[] = [];
  let id = 0;
  const client: HelpDeps['client'] = {
    solve: async (level, budget) => {
      calls.push({ budget });
      const custom = override?.(level);
      if (custom) return custom;
      const outcome = solveDetailed(level, budget);
      id++;
      return outcome.status === 'solved'
        ? { id, status: 'solved', moves: pushesToMoves(level, outcome.result.pushes) }
        : { id, status: outcome.status };
    },
    cancel: () => undefined,
  };
  return { client, calls };
}

function setup(text = LEVEL, override?: Parameters<typeof realClient>[0]) {
  const game = new Game(parseLevel(text));
  const clock = makeClock();
  const { client, calls } = realClient(override);
  let changes = 0;
  const help: Help = new Help({
    client,
    applyMove: (dir: Direction) => {
      const r = game.move(dir);
      if (r.moved) help.onMove(dir);
    },
    changed: () => changes++,
    schedule: clock.schedule,
    unschedule: clock.unschedule,
  });
  help.setGame(game);
  return { game, help, clock, calls, changes: () => changes };
}

describe('Help: hints', () => {
  it('shows the next push, clears it on a move, and reuses the plan without re-solving', async () => {
    const { game, help, calls } = setup();
    await help.requestHint();
    expect(help.hint).toEqual({ from: 3 + 2 * 9, to: 4 + 2 * 9, dir: 'right' });
    expect(calls).toHaveLength(1);

    // Follow the plan: step right twice (reaching the box's left), the hint clears while moving.
    game.move('right');
    help.onMove('right');
    expect(help.hint).toBeNull();
    await help.requestHint();
    expect(calls).toHaveLength(1); // still the same plan, no second solve
    expect(help.hint).not.toBeNull();
  });

  it('drops the plan when the player goes off it, so the next hint is recomputed', async () => {
    const { game, help, calls } = setup();
    await help.requestHint();
    game.move('down');
    help.onMove('down'); // not the planned move
    await help.requestHint();
    expect(calls).toHaveLength(2);
    expect(help.hint).not.toBeNull();
  });

  it('ignores an answer that arrives after the position changed', async () => {
    let release: ((r: SolveResponse) => void) | undefined;
    const slow = new Promise<SolveResponse>((resolve) => (release = resolve));
    const { game, help } = setup(LEVEL, () => slow);
    const pending = help.requestHint();
    expect(help.status).toBe('Thinking…');
    game.move('down');
    help.onMove('down');
    release!({ id: 1, status: 'solved', moves: ['right', 'right', 'right'] });
    await pending;
    expect(help.hint).toBeNull();
  });

  it('reports a too-complex position instead of hanging', async () => {
    const { help } = setup(LEVEL, () => Promise.resolve({ id: 1, status: 'budget' }));
    await help.requestHint();
    expect(help.hint).toBeNull();
    expect(help.status).toMatch(/too complex/i);
  });
});

describe('Help: stuck detection', () => {
  it('flags an obviously dead box instantly, without asking the solver', async () => {
    const { help, calls } = setup('#####\n#$ .#\n# @ #\n#####');
    help.onReset(); // re-evaluate the starting position
    expect(help.stuck).toBe(true);
    await help.requestHint();
    expect(help.status).toMatch(/cannot be solved/i);
    expect(calls).toHaveLength(0);
  });

  it('runs a debounced background check and flags an unsolvable position it proves', async () => {
    const { help, clock, calls, game } = setup(LEVEL, () =>
      Promise.resolve({ id: 1, status: 'unsolvable' }),
    );
    game.move('right');
    help.onMove('right');
    expect(help.stuck).toBe(false);
    await clock.advance(400);
    expect(calls).toHaveLength(0); // still inside the debounce window
    await clock.advance(200);
    expect(calls).toHaveLength(1);
    expect(help.stuck).toBe(true);
  });

  it('debounces: rapid moves trigger one check, not one per move', async () => {
    const { help, clock, calls, game } = setup();
    for (const dir of ['right', 'down', 'right'] as const) {
      game.move(dir);
      help.onMove(dir);
      await clock.advance(100);
    }
    expect(calls).toHaveLength(0);
    await clock.advance(600);
    expect(calls).toHaveLength(1);
  });

  it('clears the stuck state after undoing the fatal push', () => {
    const { game, help } = setup('#######\n#.    #\n#     #\n# $@  #\n#     #\n#     #\n#######');
    // Push the box left to the wall, then walk around and push it down into the corner.
    game.move('left');
    help.onMove('left');
    for (const dir of ['up', 'left', 'up'] as const) {
      game.move(dir);
      help.onMove(dir);
    }
    expect(help.stuck).toBe(false);
    for (let i = 0; i < 4; i++) {
      game.move('down');
      help.onMove('down');
    }
    expect(help.stuck).toBe(true);
    game.undo();
    help.onReset();
    expect(help.stuck).toBe(false);
  });
});

describe('Help: solution playback', () => {
  it('plays the solution to a win, marks the run assisted, and can be interrupted', async () => {
    const { game, help, clock } = setup();
    await help.startSolution();
    expect(help.assisted).toBe(true);
    expect(help.autoplaying).toBe(true);
    await clock.advance(5000);
    expect(game.isWon).toBe(true);
    expect(help.autoplaying).toBe(false);
  });

  it('stops when interrupted', async () => {
    const { game, help, clock } = setup();
    await help.startSolution();
    await clock.advance(200);
    const movesSoFar = game.moves;
    help.stopAutoplay();
    await clock.advance(5000);
    expect(game.moves).toBe(movesSoFar);
    expect(game.isWon).toBe(false);
    expect(help.autoplaying).toBe(false);
  });

  it('setGame resets everything for the next level', async () => {
    const { help } = setup();
    await help.startSolution();
    help.setGame(new Game(parseLevel(LEVEL)));
    expect(help.assisted).toBe(false);
    expect(help.autoplaying).toBe(false);
    expect(help.hint).toBeNull();
    expect(help.stuck).toBe(false);
  });
});
