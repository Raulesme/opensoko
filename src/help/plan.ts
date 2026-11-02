import { aliveSquares } from '../generator/solver';
import { DIRECTION_DELTAS, Game } from '../game';
import type { Direction, Level } from '../game';

/** A level whose start is the game's *current* position, so the solver can help mid-game. */
export function levelFromGame(game: Game): Level {
  return { ...game.level, boxes: game.boxIndices, player: game.playerIndex };
}

/** Where the next push of a solution happens: which box, where it goes, and in which direction. */
export interface NextPush {
  from: number;
  to: number;
  dir: Direction;
}

/**
 * Find the first push in a list of moves played from the game's current position. Returns null if
 * the moves never push (or are empty).
 */
export function nextPush(game: Game, moves: readonly Direction[]): NextPush | null {
  const sim = new Game(levelFromGame(game));
  const { width } = game.level;
  for (const dir of moves) {
    const result = sim.move(dir);
    if (result.pushed) {
      const d = DIRECTION_DELTAS[dir];
      // After a push the player stands where the box was.
      return { from: sim.playerIndex, to: sim.playerIndex + d.y * width + d.x, dir };
    }
  }
  return null;
}

/**
 * The rest of a solution, kept in step with what the player actually does. Following the plan
 * advances it; any other move makes it stale, so it is dropped rather than shown wrongly.
 */
export class HintPlan {
  private moves: Direction[];

  constructor(moves: readonly Direction[]) {
    this.moves = [...moves];
  }

  get remaining(): readonly Direction[] {
    return this.moves;
  }

  get isEmpty(): boolean {
    return this.moves.length === 0;
  }

  /** Record a move the player made. Returns false if it left the plan (the plan is now empty). */
  follow(dir: Direction): boolean {
    if (this.moves[0] === dir) {
      this.moves.shift();
      return true;
    }
    this.moves = [];
    return false;
  }
}

/**
 * An instant, conservative stuck check: a box that is not on a goal but sits on a square from which
 * no push can ever reach a goal (even on an empty board) makes the level unsolvable. This misses
 * subtler deadlocks, which the solver catches; it never reports a false alarm.
 */
export function createDeadSquareCheck(level: Level): (game: Game) => boolean {
  const alive = aliveSquares(level);
  return (game) => game.boxIndices.some((b) => !alive[b] && !level.goals[b]);
}
