import { DIRECTION_DELTAS } from '../game';
import type { Direction, Level } from '../game';
import { HashSet64 } from './hashset';

const DIRS: readonly Direction[] = ['up', 'down', 'left', 'right'];

export interface Push {
  /** Cell index the box occupied before the push. */
  from: number;
  dir: Direction;
}

/** Why a solve ended: found a solution, proved there is none, or gave up at the state budget. */
export type SolveOutcome =
  { status: 'solved'; result: SolveResult } | { status: 'unsolvable' } | { status: 'budget' };

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

/** Deterministic 32-bit random table for Zobrist hashing (same on every run and platform). */
function zobristTable(size: number, seed: number): Int32Array {
  const table = new Int32Array(size);
  let x = seed | 0 || 1;
  for (let i = 0; i < size; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5; // xorshift32
    table[i] = x;
  }
  return table;
}

/**
 * Breadth-first search over pushes. Returns null if unsolvable or if maxStates is exceeded.
 *
 * Performance notes: the hot loop allocates nothing per state. Box positions live in one growable
 * typed-array pool, occupancy is a reusable byte array, and states are identified by an
 * incremental Zobrist hash of the box set plus the normalised player cell (the lowest cell the
 * player can reach), packed into one 53-bit number. Search order and pruning are identical to the
 * original implementation, so `states` and the solution length are unchanged.
 */
export function solveDetailed(level: Level, maxStates = 400_000): SolveOutcome {
  const nb = buildNeighbours(level);
  const size = level.walls.length;
  const walls = Uint8Array.from(level.walls, (v) => (v ? 1 : 0));
  const goals = Uint8Array.from(level.goals, (v) => (v ? 1 : 0));
  const alive = Uint8Array.from(aliveSquares(level, nb), (v) => (v ? 1 : 0));
  const B = level.boxes.length;

  const z1 = zobristTable(size, 0x9e3779b9);
  const z2 = zobristTable(size, 0x85ebca6b);
  const p1 = zobristTable(size, 0xc2b2ae35);
  const p2 = zobristTable(size, 0x27d4eb2f);

  // Growable node storage (struct-of-arrays).
  let cap = 4096;
  let boxPool = new Int16Array(cap * B);
  let playerAt = new Int16Array(cap);
  let parent = new Int32Array(cap);
  let pushFrom = new Int16Array(cap);
  let pushDir = new Uint8Array(cap);
  let hash1 = new Int32Array(cap);
  let hash2 = new Int32Array(cap);
  const grow = () => {
    cap *= 2;
    const copy = <T extends Int16Array | Int32Array | Uint8Array>(old: T, len: number): T => {
      const next = new (old.constructor as new (n: number) => T)(len);
      next.set(old);
      return next;
    };
    boxPool = copy(boxPool, cap * B);
    playerAt = copy(playerAt, cap);
    parent = copy(parent, cap);
    pushFrom = copy(pushFrom, cap);
    pushDir = copy(pushDir, cap);
    hash1 = copy(hash1, cap);
    hash2 = copy(hash2, cap);
  };

  // Root node.
  let r1 = 0;
  let r2 = 0;
  level.boxes.forEach((b, i) => {
    boxPool[i] = b;
    r1 ^= z1[b]!;
    r2 ^= z2[b]!;
  });
  playerAt[0] = level.player;
  parent[0] = -1;
  hash1[0] = r1;
  hash2[0] = r2;
  let count = 1; // nodes created so far (the BFS queue is nodes[head..count))

  const onGoals = (off: number) => {
    for (let i = 0; i < B; i++) if (!goals[boxPool[off + i]!]) return false;
    return true;
  };
  if (onGoals(0)) return { status: 'solved', result: { pushes: [], states: 1 } };

  // One array serves as wall map, box map and flood 'visited' marks: a cell can be entered only
  // while vis[cell] < stamp. Walls and (during a node's expansion) boxes hold BLOCKED, which never
  // compares below a stamp; visited cells hold the current stamp.
  const BLOCKED = 0x7fffffff;
  const vis = new Int32Array(size);
  for (let i = 0; i < size; i++) if (walls[i] === 1) vis[i] = BLOCKED;
  const stack = new Int32Array(size);
  let stamp = 0;
  // Neighbour offsets in DIRS order (up, down, left, right). Levels are enclosed by walls, so any
  // cell the player or a box can occupy has all four neighbours inside the grid.
  const W = level.width;
  const OFF = [-W, W, -1, 1] as const;

  /** A box in a 2x2 block of walls/boxes with any box off-goal can never move again. */
  const frozen = (cell: number): boolean => {
    for (let k = 0; k < 4; k++) {
      const hx = cell + (k < 2 ? -1 : 1); // left / right neighbour
      const vy = cell + ((k & 1) === 0 ? -W : W); // up / down neighbour
      const diag = hx + ((k & 1) === 0 ? -W : W);
      if (vis[hx] !== BLOCKED || vis[vy] !== BLOCKED || vis[diag] !== BLOCKED) continue;
      // The 2x2 block is solid. It is a deadlock if any box in it is off a goal.
      if (
        (walls[cell] === 0 && goals[cell] === 0) ||
        (walls[hx] === 0 && goals[hx] === 0) ||
        (walls[vy] === 0 && goals[vy] === 0) ||
        (walls[diag] === 0 && goals[diag] === 0)
      ) {
        return true;
      }
    }
    return false;
  };

  const seen = new HashSet64(); // normalised states visited (dequeue-time)
  let head = 0;
  while (head < count) {
    const idx = head++;
    const off = idx * B;
    for (let i = 0; i < B; i++) vis[boxPool[off + i]!] = BLOCKED;

    // Flood the player's reachable region; its lowest cell normalises the player position.
    const start = playerAt[idx]!;
    stamp++;
    let min = start;
    vis[start] = stamp;
    let sp = 0;
    stack[sp++] = start;
    while (sp > 0) {
      const c = stack[--sp]!;
      if (c < min) min = c;
      let n = c - W;
      if (vis[n]! < stamp) {
        vis[n] = stamp;
        stack[sp++] = n;
      }
      n = c + W;
      if (vis[n]! < stamp) {
        vis[n] = stamp;
        stack[sp++] = n;
      }
      n = c - 1;
      if (vis[n]! < stamp) {
        vis[n] = stamp;
        stack[sp++] = n;
      }
      n = c + 1;
      if (vis[n]! < stamp) {
        vis[n] = stamp;
        stack[sp++] = n;
      }
    }

    if (seen.add(hash1[idx]! ^ p1[min]!, hash2[idx]! ^ p2[min]!)) {
      if (seen.size > maxStates) return { status: 'budget' };

      for (let bi = 0; bi < B; bi++) {
        const b = boxPool[off + bi]!;
        for (let d = 0; d < 4; d++) {
          const ahead = b + OFF[d]!;
          const behind = b - OFF[d]!;
          // The player must be able to stand behind the box; the cell ahead must be free and alive.
          if (vis[behind] !== stamp || vis[ahead] === BLOCKED || alive[ahead] === 0) continue;

          const savedAhead = vis[ahead]!;
          vis[b] = 0;
          vis[ahead] = BLOCKED;
          const dead = frozen(ahead);
          vis[b] = BLOCKED;
          vis[ahead] = savedAhead;
          if (dead) continue;

          if (count === cap) grow();
          const child = count;
          const coff = child * B;
          for (let i = 0; i < B; i++) boxPool[coff + i] = boxPool[off + i]!;
          boxPool[coff + bi] = ahead;
          playerAt[child] = b;
          parent[child] = idx;
          pushFrom[child] = b;
          pushDir[child] = d;
          hash1[child] = hash1[idx]! ^ z1[b]! ^ z1[ahead]!;
          hash2[child] = hash2[idx]! ^ z2[b]! ^ z2[ahead]!;

          if (onGoals(coff)) {
            const pushes: Push[] = [];
            for (let p = child; parent[p]! >= 0; p = parent[p]!) {
              pushes.push({ from: pushFrom[p]!, dir: DIRS[pushDir[p]!]! });
            }
            return { status: 'solved', result: { pushes: pushes.reverse(), states: seen.size } };
          }
          count++;
        }
      }
    }
    // Release the boxes' cells so they can be entered again by later floods.
    for (let i = 0; i < B; i++) vis[boxPool[off + i]!] = 0;
  }
  // The whole reachable space was searched without finding a solution.
  return { status: 'unsolvable' };
}

/** Breadth-first search over pushes. Returns null if unsolvable or if maxStates is exceeded. */
export function solvePushes(level: Level, maxStates = 400_000): SolveResult | null {
  const outcome = solveDetailed(level, maxStates);
  return outcome.status === 'solved' ? outcome.result : null;
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
