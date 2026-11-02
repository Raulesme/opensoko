/**
 * Procedural Sokoban level generator.
 *
 * Builds a random room, places boxes on goals (a solved position), then plays the game
 * *backwards* by pulling boxes. The result is solvable by construction; the forward solver
 * then measures difficulty. Usage:
 *   npx vite-node tools/generate-cli.ts --seed 1 --attempts 2000 --out candidates.json
 */
import { levelToString, parseLevel } from '../game';
import { solvePushes } from './solver';

export interface Candidate {
  text: string;
  boxes: number;
  width: number;
  height: number;
  floorCells: number;
  minPushes: number;
  states: number;
}

/** Small deterministic PRNG so runs are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]!;

/** true = floor. Outer ring is always wall. */
function makeRoom(rng: Rng): { w: number; h: number; floor: boolean[] } {
  const w = int(rng, 7, 11);
  const h = int(rng, 6, 9);
  const floor: boolean[] = new Array<boolean>(w * h).fill(false);
  const set = (x: number, y: number, v: boolean) => {
    if (x > 0 && y > 0 && x < w - 1 && y < h - 1) floor[y * w + x] = v;
  };

  if (rng() < 0.5) {
    // Open interior with random wall blocks.
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) set(x, y, true);
    const blocks = int(rng, 3, 7);
    for (let i = 0; i < blocks; i++) {
      const bw = int(rng, 1, 2);
      const bh = int(rng, 1, 2);
      const bx = int(rng, 1, w - 1 - bw);
      const by = int(rng, 1, h - 1 - bh);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) set(bx + x, by + y, false);
    }
  } else {
    // A few rectangular rooms joined by corridors.
    const rooms: { x: number; y: number; w: number; h: number }[] = [];
    const count = int(rng, 2, 3);
    for (let i = 0; i < count; i++) {
      const rw = int(rng, 2, Math.max(2, Math.floor((w - 2) / 2) + 1));
      const rh = int(rng, 2, Math.max(2, Math.floor((h - 2) / 2) + 2));
      const rx = int(rng, 1, w - 1 - rw);
      const ry = int(rng, 1, h - 1 - rh);
      rooms.push({ x: rx, y: ry, w: rw, h: rh });
      for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) set(rx + x, ry + y, true);
    }
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1]!;
      const b = rooms[i]!;
      let x = a.x + Math.floor(a.w / 2);
      let y = a.y + Math.floor(a.h / 2);
      const tx = b.x + Math.floor(b.w / 2);
      const ty = b.y + Math.floor(b.h / 2);
      while (x !== tx) {
        set(x, y, true);
        x += Math.sign(tx - x);
      }
      while (y !== ty) {
        set(x, y, true);
        y += Math.sign(ty - y);
      }
      set(x, y, true);
    }
  }
  return { w, h, floor };
}

/** Keep only the largest connected floor region. */
function largestRegion(w: number, h: number, floor: boolean[]): boolean[] {
  const seen = new Array<boolean>(w * h).fill(false);
  let best: number[] = [];
  for (let s = 0; s < w * h; s++) {
    if (!floor[s] || seen[s]) continue;
    const region = [s];
    seen[s] = true;
    for (let i = 0; i < region.length; i++) {
      const c = region[i]!;
      for (const n of [c - 1, c + 1, c - w, c + w]) {
        if (floor[n] && !seen[n]) {
          seen[n] = true;
          region.push(n);
        }
      }
    }
    if (region.length > best.length) best = region;
  }
  const out = new Array<boolean>(w * h).fill(false);
  for (const c of best) out[c] = true;
  return out;
}

/** A reverse-play state: where the goals are, where the boxes have been pulled to, and the player. */
export interface PullState {
  goals: number[];
  boxes: number[];
  player: number;
}

/** Start from a solved position: boxes on goals, player somewhere else. */
function initialState(rng: Rng, floor: boolean[], boxCount: number): PullState | null {
  const cells: number[] = [];
  floor.forEach((f, i) => f && cells.push(i));
  if (cells.length < boxCount + 6) return null;
  const goals: number[] = [];
  while (goals.length < boxCount) {
    const c = pick(rng, cells);
    if (!goals.includes(c)) goals.push(c);
  }
  const free = cells.filter((c) => !goals.includes(c));
  return { goals, boxes: [...goals], player: pick(rng, free) };
}

/** Pull boxes around for `pulls` more steps (mutates `state`). Resumable, so it can be extended. */
function pullMore(rng: Rng, w: number, floor: boolean[], state: PullState, pulls: number): void {
  const { boxes } = state;
  const D = [-1, 1, -w, w];
  let last: { box: number; e: number } | null = null;
  for (let step = 0; step < pulls; step++) {
    // Reachable region for the player.
    const seen = new Set<number>([state.player]);
    const stack = [state.player];
    while (stack.length > 0) {
      const c = stack.pop()!;
      for (const d of D) {
        const n = c + d;
        if (floor[n] && !seen.has(n) && !boxes.includes(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    // A pull: player at q, box at q+e, cell q-e free -> box moves to q, player to q-e.
    let options: { box: number; q: number; e: number }[] = [];
    boxes.forEach((b, bi) => {
      for (const e of D) {
        const q = b - e;
        const r = q - e;
        if (seen.has(q) && floor[r] && !boxes.includes(r)) options.push({ box: bi, q, e });
      }
    });
    // Never immediately cancel the previous pull of the same box.
    if (last) options = options.filter((o) => !(o.box === last!.box && o.e === -last!.e));
    if (options.length === 0) break;
    // Prefer carrying on in the same direction: it yields long, committed pushes.
    const same: typeof options = last
      ? options.filter((o) => o.box === last!.box && o.e === last!.e)
      : [];
    const o: (typeof options)[number] =
      same.length > 0 && rng() < 0.55 ? pick(rng, same) : pick(rng, options);
    boxes[o.box] = o.q;
    state.player = o.q - o.e;
    last = { box: o.box, e: o.e };
  }
}

/** Smallest text among the 8 rotations/reflections, used to drop duplicate layouts. */
export function canonical(text: string): string {
  const rows = text.split('\n');
  const w = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => r.padEnd(w, ' ').split(''));
  const rotate = (g: string[][]) => g[0]!.map((_, x) => g.map((row) => row[x]!).reverse());
  const flip = (g: string[][]) => g.map((row) => [...row].reverse());
  const variants: string[] = [];
  let g = grid;
  for (let i = 0; i < 4; i++) {
    variants.push(g.map((r) => r.join('').trimEnd()).join('\n'));
    variants.push(
      flip(g)
        .map((r) => r.join('').trimEnd())
        .join('\n'),
    );
    g = rotate(g);
  }
  return variants.sort()[0]!;
}

/** Higher = harder. Pushes and search effort both matter; effort is log-scaled. */
export function difficulty(c: Pick<Candidate, 'minPushes' | 'states'>): number {
  return c.minPushes + 4 * Math.log2(c.states + 1);
}

/** Render a pull state as level text, keeping only walls that touch the floor and cropping. */
function render(room: { w: number; h: number }, floor: boolean[], s: PullState) {
  const { w, h } = room;
  const touchesFloor = (i: number) => {
    const x = i % w;
    const y = Math.floor(i / w);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && floor[ny * w + nx]) return true;
      }
    }
    return false;
  };
  const used = floor.map((f, i) => f || touchesFloor(i));
  let minX = w;
  let maxX = -1;
  let minY = h;
  let maxY = -1;
  used.forEach((u, i) => {
    if (!u) return;
    minX = Math.min(minX, i % w);
    maxX = Math.max(maxX, i % w);
    minY = Math.min(minY, Math.floor(i / w));
    maxY = Math.max(maxY, Math.floor(i / w));
  });
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const remap = (i: number) => (Math.floor(i / w) - minY) * cw + ((i % w) - minX);
  const walls: boolean[] = new Array<boolean>(cw * ch).fill(false);
  const goalGrid: boolean[] = new Array<boolean>(cw * ch).fill(false);
  used.forEach((u, i) => {
    if (u && !floor[i]) walls[remap(i)] = true;
  });
  s.goals.forEach((g) => (goalGrid[remap(g)] = true));
  const text = levelToString({
    width: cw,
    height: ch,
    walls,
    goals: goalGrid,
    boxes: s.boxes.map(remap),
    player: remap(s.player),
  });
  return { text, width: cw, height: ch };
}

/** Solve a rendered state and measure it; null if it is invalid, unsolvable or too big. */
function evaluate(
  rendered: { text: string; width: number; height: number },
  floorCells: number,
  boxCount: number,
  maxStates: number,
): Candidate | null {
  let parsed;
  try {
    parsed = parseLevel(rendered.text);
  } catch {
    return null;
  }
  const result = solvePushes(parsed, maxStates);
  if (!result) return null;
  return {
    text: rendered.text,
    boxes: boxCount,
    width: rendered.width,
    height: rendered.height,
    floorCells,
    minPushes: result.pushes.length,
    states: result.states,
  };
}

export interface GenOptions {
  /** Box counts to choose from (repeat a value to weight it). */
  boxes: readonly number[];
  /** Pulls per box for the initial scramble: [min, max]. */
  pullsPerBox: readonly [number, number];
  /** Hill-climb rounds: extend the scramble and keep it only if the level got harder. */
  hill: number;
  /** Extra pulls per hill-climb round: [min, max]. */
  hillPulls: readonly [number, number];
  /** Give up on candidates whose solution search exceeds this many states. */
  maxStates: number;
}

export const DEFAULT_OPTIONS: GenOptions = {
  boxes: [2, 2, 3, 3, 3, 4, 4, 5],
  pullsPerBox: [60, 90],
  hill: 0,
  hillPulls: [10, 30],
  maxStates: 150_000,
};

/** One generation attempt: random room, scramble, optional hill-climb. Null if it fails. */
export function generateOne(rng: Rng, opts: GenOptions = DEFAULT_OPTIONS): Candidate | null {
  const room = makeRoom(rng);
  const floor = largestRegion(room.w, room.h, room.floor);
  const floorCells = floor.filter(Boolean).length;
  const boxCount = pick(rng, opts.boxes);
  const state = initialState(rng, floor, boxCount);
  if (!state) return null;
  pullMore(
    rng,
    room.w,
    floor,
    state,
    int(rng, opts.pullsPerBox[0], opts.pullsPerBox[1]) * boxCount,
  );

  const valid = (s: PullState) => !s.boxes.some((b) => s.goals.includes(b));
  if (!valid(state)) return null;
  let best = evaluate(render(room, floor, state), floorCells, boxCount, opts.maxStates);
  if (!best) return null;

  for (let round = 0; round < opts.hill; round++) {
    const next: PullState = { goals: state.goals, boxes: [...state.boxes], player: state.player };
    pullMore(rng, room.w, floor, next, int(rng, opts.hillPulls[0], opts.hillPulls[1]));
    if (!valid(next)) continue;
    const cand = evaluate(render(room, floor, next), floorCells, boxCount, opts.maxStates);
    if (cand && difficulty(cand) > difficulty(best)) {
      best = cand;
      state.boxes = next.boxes;
      state.player = next.player;
    }
  }
  return best;
}

export function generate(
  seed: number,
  attempts: number,
  opts: GenOptions = DEFAULT_OPTIONS,
): Candidate[] {
  const rng = mulberry32(seed);
  const out: Candidate[] = [];
  const seenLayouts = new Set<string>();
  for (let n = 0; n < attempts; n++) {
    const cand = generateOne(rng, opts);
    if (!cand) continue;
    const key = canonical(cand.text);
    if (seenLayouts.has(key)) continue;
    seenLayouts.add(key);
    out.push(cand);
  }
  return out;
}
