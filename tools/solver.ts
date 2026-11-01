import { DIRECTION_DELTAS } from '../src/game';
import type { Direction, Level } from '../src/game';

const DIRS: readonly Direction[] = ['up', 'down', 'left', 'right'];

export interface Push {
  /** Cell index the box occupied before the push. */
  from: number;
  dir: Direction;
}

export interface SolveResult {
  /** A solution with the fewest box pushes (not necessarily fewest player moves). */
  pushes: Push[];
  /** Distinct (boxes, player-region) states visited; a proxy for search difficulty. */
  states: number;
}

/** neighbour[i * 4 + d] = adjacent cell index in direction DIRS[d], or -1 if off-grid. */
function buildNeighbours(level: Level): Int16Array {
  const { width, height } = level;
  const nb = new Int16Array(width * height * 4).fill(-1);
  for (let i = 0; i < width * height; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    DIRS.forEach((dir, d) => {
      const nx = x + DIRECTION_DELTAS[dir].x;
      const ny = y + DIRECTION_DELTAS[dir].y;
      if (nx >= 0 && ny >= 0 && nx < width && ny < height) nb[i * 4 + d] = ny * width + nx;
    });
  }
  return nb;
}

const OPPOSITE = [1, 0, 3, 2]; // up<->down, left<->right (indices into DIRS)

/** Cells from which a lone box could still be pushed onto some goal (reverse "pull" search). */
export function aliveSquares(level: Level, nb: Int16Array = buildNeighbours(level)): boolean[] {
  const alive: boolean[] = new Array<boolean>(level.walls.length).fill(false);
  const stack: number[] = [];
  level.goals.forEach((g, i) => {
    if (g) {
      alive[i] = true;
      stack.push(i);
    }
  });
  while (stack.length > 0) {
    const b = stack.pop()!;
    for (let d = 0; d < 4; d++) {
      const a = nb[b * 4 + OPPOSITE[d]!]!; // box could have been here before pushing in dir d
      if (a < 0 || level.walls[a] || alive[a]) continue;
      const p = nb[a * 4 + OPPOSITE[d]!]!; // player must have stood behind it
      if (p < 0 || level.walls[p]) continue;
      alive[a] = true;
      stack.push(a);
    }
  }
  return alive;
}

interface Node {
  boxes: number[];
  player: number;
  parent: number;
  push: Push | null;
}

/** Breadth-first search over pushes. Returns null if unsolvable or if maxStates is exceeded. */
export function solvePushes(level: Level, maxStates = 400_000): SolveResult | null {
  const nb = buildNeighbours(level);
  const alive = aliveSquares(level, nb);
  const size = level.walls.length;
  const region = new Int32Array(size);
  let stamp = 0;
  const stack: number[] = [];

  const isGoalState = (boxes: number[]) => boxes.every((b) => level.goals[b]);

  /** Fill `region` with `stamp` for all cells reachable from `from`; returns the min index. */
  const flood = (from: number, occupied: Set<number>): number => {
    stamp++;
    let min = from;
    region[from] = stamp;
    stack.length = 0;
    stack.push(from);
    while (stack.length > 0) {
      const c = stack.pop()!;
      if (c < min) min = c;
      for (let d = 0; d < 4; d++) {
        const n = nb[c * 4 + d]!;
        if (n >= 0 && region[n] !== stamp && !level.walls[n] && !occupied.has(n)) {
          region[n] = stamp;
          stack.push(n);
        }
      }
    }
    return min;
  };

  /** A box on `cell` that sits in a 2x2 block of walls/boxes with a box off-goal can never move. */
  const frozen = (cell: number, occupied: Set<number>): boolean => {
    const blocked = (i: number) => i < 0 || level.walls[i]! || occupied.has(i);
    for (const [h, v] of [
      [2, 0],
      [2, 1],
      [3, 0],
      [3, 1],
    ] as const) {
      const hx = nb[cell * 4 + h]!;
      const vy = nb[cell * 4 + v]!;
      const diag = hx >= 0 ? nb[hx * 4 + v]! : -1;
      if (blocked(hx) && blocked(vy) && blocked(diag)) {
        const group = [cell, hx, vy, diag].filter((i) => i >= 0 && occupied.has(i));
        if (group.some((i) => !level.goals[i])) return true;
      }
    }
    return false;
  };

  const nodes: Node[] = [{ boxes: [...level.boxes], player: level.player, parent: -1, push: null }];
  const seen = new Set<string>();
  let head = 0;

  if (isGoalState(nodes[0]!.boxes)) return { pushes: [], states: 1 };

  while (head < nodes.length) {
    const idx = head++;
    const node = nodes[idx]!;
    const occupied = new Set(node.boxes);
    const norm = flood(node.player, occupied);
    const key = `${norm}:${[...node.boxes].sort((a, b) => a - b).join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (seen.size > maxStates) return null;

    for (let bi = 0; bi < node.boxes.length; bi++) {
      const b = node.boxes[bi]!;
      for (let d = 0; d < 4; d++) {
        const behind = nb[b * 4 + OPPOSITE[d]!]!;
        const ahead = nb[b * 4 + d]!;
        if (behind < 0 || ahead < 0 || region[behind] !== stamp) continue;
        if (level.walls[ahead] || occupied.has(ahead) || !alive[ahead]) continue;

        const boxes = node.boxes.slice();
        boxes[bi] = ahead;
        const next = new Set(boxes);
        if (frozen(ahead, next)) continue;

        const child: Node = { boxes, player: b, parent: idx, push: { from: b, dir: DIRS[d]! } };
        if (isGoalState(boxes)) {
          const pushes: Push[] = [child.push!];
          for (let p = idx; nodes[p]!.parent >= 0; p = nodes[p]!.parent)
            pushes.push(nodes[p]!.push!);
          return { pushes: pushes.reverse(), states: seen.size };
        }
        nodes.push(child);
      }
    }
  }
  return null;
}

/** Expand a push solution into the full list of player moves (walking between pushes). */
export function pushesToMoves(level: Level, pushes: readonly Push[]): Direction[] {
  const nb = buildNeighbours(level);
  const moves: Direction[] = [];
  let player = level.player;
  let boxes = new Set(level.boxes);

  for (const push of pushes) {
    const d = DIRS.indexOf(push.dir);
    const target = nb[push.from * 4 + OPPOSITE[d]!]!;

    // BFS for the shortest walk from player to `target`, avoiding walls and boxes.
    const prev = new Map<number, { cell: number; dir: Direction }>();
    const queue = [player];
    const visited = new Set([player]);
    for (let q = 0; q < queue.length && !visited.has(target); q++) {
      const c = queue[q]!;
      for (let k = 0; k < 4; k++) {
        const n = nb[c * 4 + k]!;
        if (n < 0 || visited.has(n) || level.walls[n] || boxes.has(n)) continue;
        visited.add(n);
        prev.set(n, { cell: c, dir: DIRS[k]! });
        queue.push(n);
      }
    }
    const walk: Direction[] = [];
    for (let c = target; c !== player;) {
      const step = prev.get(c)!;
      walk.push(step.dir);
      c = step.cell;
    }
    moves.push(...walk.reverse(), push.dir);

    boxes = new Set([...boxes].filter((b) => b !== push.from));
    boxes.add(nb[push.from * 4 + d]!);
    player = push.from;
  }
  return moves;
}
