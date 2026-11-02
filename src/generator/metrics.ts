import { DIRECTION_DELTAS } from '../game';
import type { Level } from '../game';
import type { Push } from './solver';

/**
 * Measures of how "interesting" a solved level is, beyond its raw length.
 *
 * A level where every box slides straight to a goal is long but dull. What makes a puzzle good is
 * interaction: boxes blocking each other, forcing detours, and counter-intuitive moves. These
 * metrics isolate that from the optimal solution.
 */
export interface InterestMetrics {
  /** Sum over boxes of the push distance to the nearest goal, ignoring all other boxes. */
  lowerBound: number;
  /** Optimal pushes beyond the lower bound: work forced by boxes getting in each other's way. */
  excess: number;
  /** Pushes in the optimal solution that move a box *farther* from its goal (parking, detours). */
  away: number;
  /** How many different boxes the solution moves. */
  moved: number;
}

/**
 * For every cell, the fewest pushes needed to get a lone box from there onto some goal on an
 * otherwise empty board; -1 where it is impossible (dead squares). Computed by reverse search.
 */
export function pushDistances(level: Level): Int16Array {
  const { width, height, walls, goals } = level;
  const size = width * height;
  const dist = new Int16Array(size).fill(-1);
  const queue: number[] = [];
  goals.forEach((g, i) => {
    if (g) {
      dist[i] = 0;
      queue.push(i);
    }
  });
  const deltas = Object.values(DIRECTION_DELTAS);
  for (let head = 0; head < queue.length; head++) {
    const b = queue[head]!;
    const bx = b % width;
    const by = Math.floor(b / width);
    for (const d of deltas) {
      // A box now at `a` could have been pushed to `b` by a player standing at `p`.
      const ax = bx - d.x;
      const ay = by - d.y;
      const px = ax - d.x;
      const py = ay - d.y;
      if (ax < 0 || ay < 0 || ax >= width || ay >= height) continue;
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const a = ay * width + ax;
      if (walls[a] || walls[py * width + px] || dist[a] !== -1) continue;
      dist[a] = dist[b]! + 1;
      queue.push(a);
    }
  }
  return dist;
}

/** Compute interest metrics for a level from its optimal push solution. */
export function analyze(level: Level, pushes: readonly Push[]): InterestMetrics {
  const dist = pushDistances(level);
  const lowerBound = level.boxes.reduce((sum, b) => sum + Math.max(0, dist[b]!), 0);

  const offset: Record<string, number> = {};
  for (const [name, d] of Object.entries(DIRECTION_DELTAS)) offset[name] = d.y * level.width + d.x;

  // Track each box by identity as it moves, so we can tell how many distinct boxes get pushed.
  const idAt = new Map<number, number>(level.boxes.map((b, i) => [b, i]));
  const touched = new Set<number>();
  let away = 0;
  for (const push of pushes) {
    const to = push.from + offset[push.dir]!;
    if (dist[to]! > dist[push.from]!) away++;
    const id = idAt.get(push.from)!;
    idAt.delete(push.from);
    idAt.set(to, id);
    touched.add(id);
  }
  return {
    lowerBound,
    excess: Math.max(0, pushes.length - lowerBound),
    away,
    moved: touched.size,
  };
}
