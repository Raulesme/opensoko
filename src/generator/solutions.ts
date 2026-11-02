import type { Level } from '../game';
import { aliveSquares } from './solver';

/**
 * How "forced" a level's solution is, measured on the graph of all *optimal* solutions.
 *
 * The solver finds one shortest solution. Here we keep every shortest route instead, and ask how
 * much freedom the player has: a puzzle with a single narrow line of play feels designed, while one
 * with many interchangeable orders feels loose.
 */
export interface SolutionStats {
  /** Optimal push count (equals the level's par). */
  depth: number;
  /**
   * Number of distinct optimal push sequences. Swapping two independent pushes counts as a
   * different sequence, so loose levels can reach very large numbers.
   */
  solutions: number;
  /** Distinct positions that lie on at least one optimal solution. */
  optimalStates: number;
  /** Average positions per step along the optimal solutions; 1 means a single narrow line. */
  width: number;
  /** Fraction of optimal positions with exactly one optimal next push (a forced move). */
  forcedFraction: number;
  /** Positions the search had to visit, for reference. */
  visited: number;
}

interface State {
  boxes: number[]; // sorted
  player: number; // normalised: lowest reachable cell
  depth: number;
  ways: number; // optimal routes from the start
  children: number[]; // states one push further along an optimal route
}

/**
 * Analyse the optimal-solution graph of a level. Returns null if the level is unsolvable or the
 * search exceeds `maxStates`. Slower and heavier than `solvePushes`, so use it offline or on
 * levels that already passed cheaper filters.
 */
export function analyzeSolutions(level: Level, maxStates = 200_000): SolutionStats | null {
  const { width: W, walls, goals } = level;
  const size = walls.length;
  const alive = aliveSquares(level);
  const OFF = [-W, W, -1, 1];

  // `blocked` marks walls and (while a state is being processed) its boxes.
  const blocked = new Uint8Array(size);
  walls.forEach((w, i) => (blocked[i] = w ? 1 : 0));
  const markA = new Int32Array(size);
  const markB = new Int32Array(size);
  let stampA = 0;
  let stampB = 0;
  const stack: number[] = [];

  /** Flood from `start`, marking `mark` with `stamp`; returns the lowest reachable cell. */
  const flood = (start: number, mark: Int32Array, stamp: number): number => {
    let min = start;
    mark[start] = stamp;
    stack.length = 0;
    stack.push(start);
    while (stack.length > 0) {
      const c = stack.pop()!;
      if (c < min) min = c;
      for (const o of OFF) {
        const n = c + o;
        if (mark[n] !== stamp && blocked[n] === 0) {
          mark[n] = stamp;
          stack.push(n);
        }
      }
    }
    return min;
  };

  /** A box in a solid 2x2 block of walls/boxes with any box off-goal can never move again. */
  const frozen = (cell: number): boolean => {
    for (let k = 0; k < 4; k++) {
      const hx = cell + (k < 2 ? -1 : 1);
      const vy = cell + ((k & 1) === 0 ? -W : W);
      const diag = hx + ((k & 1) === 0 ? -W : W);
      if (!blocked[hx] || !blocked[vy] || !blocked[diag]) continue;
      for (const c of [cell, hx, vy, diag]) if (!walls[c] && !goals[c]) return true;
    }
    return false;
  };

  const keyOf = (boxes: number[], player: number) => `${boxes.join(',')}|${player}`;
  const states: State[] = [];
  const index = new Map<string, number>();

  const setBoxes = (boxes: number[], v: number) => boxes.forEach((b) => (blocked[b] = v));

  const startBoxes = [...level.boxes].sort((a, b) => a - b);
  setBoxes(startBoxes, 1);
  const startPlayer = flood(level.player, markB, ++stampB);
  setBoxes(startBoxes, 0);
  states.push({ boxes: startBoxes, player: startPlayer, depth: 0, ways: 1, children: [] });
  index.set(keyOf(startBoxes, startPlayer), 0);

  const isGoal = (boxes: number[]) => boxes.every((b) => goals[b]);
  if (isGoal(startBoxes)) return null;

  let goalDepth = -1;
  let frontier = [0];
  for (let depth = 0; frontier.length > 0 && (goalDepth < 0 || depth < goalDepth); depth++) {
    const next: number[] = [];
    for (const sid of frontier) {
      const s = states[sid]!;
      setBoxes(s.boxes, 1);
      stampA++;
      flood(s.player, markA, stampA);

      for (let bi = 0; bi < s.boxes.length; bi++) {
        const b = s.boxes[bi]!;
        for (const o of OFF) {
          const ahead = b + o;
          const behind = b - o;
          if (markA[behind] !== stampA || blocked[ahead] || !alive[ahead]) continue;

          // Simulate the push for the frozen check and to find the child's normalised player.
          blocked[b] = 0;
          blocked[ahead] = 1;
          const dead = frozen(ahead);
          let player = -1;
          if (!dead) player = flood(b, markB, ++stampB);
          blocked[b] = 1;
          blocked[ahead] = 0;
          if (dead) continue;

          const boxes = s.boxes.slice();
          boxes[bi] = ahead;
          boxes.sort((x, y) => x - y);
          const key = keyOf(boxes, player);
          let cid = index.get(key);
          if (cid === undefined) {
            if (states.length >= maxStates) {
              setBoxes(s.boxes, 0);
              return null;
            }
            cid = states.length;
            states.push({ boxes, player, depth: depth + 1, ways: 0, children: [] });
            index.set(key, cid);
            next.push(cid);
            if (isGoal(boxes) && goalDepth < 0) goalDepth = depth + 1;
          }
          const child = states[cid]!;
          if (child.depth !== depth + 1) continue; // reached earlier by a shorter route
          child.ways += s.ways;
          s.children.push(cid);
        }
      }
      setBoxes(s.boxes, 0);
    }
    frontier = next;
  }
  if (goalDepth < 0) return null;

  // Which positions lie on some optimal route? Work backwards from the solved positions.
  const onOptimal = new Uint8Array(states.length);
  let solutions = 0;
  for (let i = 0; i < states.length; i++) {
    const s = states[i]!;
    if (s.depth === goalDepth && isGoal(s.boxes)) {
      onOptimal[i] = 1;
      solutions += s.ways;
    }
  }
  const byDepth: number[][] = Array.from({ length: goalDepth + 1 }, () => []);
  states.forEach((s, i) => {
    if (s.depth <= goalDepth) byDepth[s.depth]!.push(i);
  });
  let optimalStates = 0;
  let nonGoalOptimal = 0;
  let forced = 0;
  for (let d = goalDepth; d >= 0; d--) {
    for (const i of byDepth[d]!) {
      const s = states[i]!;
      if (d < goalDepth) {
        const optimalChildren = s.children.filter((c) => onOptimal[c] === 1).length;
        if (optimalChildren === 0) continue;
        onOptimal[i] = 1;
        nonGoalOptimal++;
        if (optimalChildren === 1) forced++;
      }
      if (onOptimal[i] === 1) optimalStates++;
    }
  }
  return {
    depth: goalDepth,
    solutions,
    optimalStates,
    width: optimalStates / (goalDepth + 1),
    forcedFraction: nonGoalOptimal === 0 ? 1 : forced / nonGoalOptimal,
    visited: states.length,
  };
}
