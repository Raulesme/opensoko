/**
 * Local search over levels: take a solvable level and repeatedly make a small random edit (add or
 * remove a wall, move a box, move a goal), keeping the edit when the level is still solvable and
 * its challenge score does not drop. This climbs toward interactive levels directly instead of
 * waiting for random sampling to stumble on one.
 */
import { levelToString, parseLevel, reachableFloor } from '../game';
import type { Level } from '../game';
import { challenge, evaluate, int, pick } from './generate';
import type { Candidate, Rng } from './generate';

/** Keep only walls that touch the playable floor, and crop to the used area. */
export function normalizeLevel(level: Level): Level {
  const { width, height } = level;
  const reach = reachableFloor(level);
  const touches = (i: number): boolean => {
    const x = i % width;
    const y = Math.floor(i / width);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && reach[ny * width + nx]) return true;
      }
    }
    return false;
  };
  const used = reach.map((r, i) => r || (level.walls[i]! && touches(i)));
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  used.forEach((u, i) => {
    if (!u) return;
    minX = Math.min(minX, i % width);
    maxX = Math.max(maxX, i % width);
    minY = Math.min(minY, Math.floor(i / width));
    maxY = Math.max(maxY, Math.floor(i / width));
  });
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const remap = (i: number) => (Math.floor(i / width) - minY) * w + ((i % width) - minX);
  const walls: boolean[] = new Array<boolean>(w * h).fill(false);
  const goals: boolean[] = new Array<boolean>(w * h).fill(false);
  used.forEach((u, i) => {
    if (u && !reach[i]) walls[remap(i)] = true;
  });
  level.goals.forEach((g, i) => {
    if (g) goals[remap(i)] = true;
  });
  return {
    width: w,
    height: h,
    walls,
    goals,
    boxes: level.boxes.map(remap),
    player: remap(level.player),
  };
}

/** True if the player's reachable floor never touches the grid edge (the solver relies on this). */
function enclosed(level: Level): boolean {
  const reach = reachableFloor(level);
  const { width, height } = level;
  for (let i = 0; i < reach.length; i++) {
    if (!reach[i]) continue;
    const x = i % width;
    const y = Math.floor(i / width);
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return false;
  }
  return true;
}

/** One random edit, or null if it produced an invalid level. */
export function mutateLevel(level: Level, rng: Rng): Level | null {
  const { width, height } = level;
  const reach = reachableFloor(level);
  const walls = [...level.walls];
  const goals = [...level.goals];
  const boxes = [...level.boxes];
  const occupied = new Set<number>([level.player, ...boxes]);

  const floorCells: number[] = [];
  const innerWalls: number[] = [];
  for (let i = 0; i < width * height; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    const interior = x > 0 && y > 0 && x < width - 1 && y < height - 1;
    if (reach[i]) floorCells.push(i);
    else if (interior && walls[i]) innerWalls.push(i);
  }
  const freeFloor = floorCells.filter((c) => !occupied.has(c) && !goals[c]);

  const kind = rng();
  if (kind < 0.35) {
    // Add a wall on a free floor cell.
    if (freeFloor.length === 0) return null;
    walls[pick(rng, freeFloor)] = true;
  } else if (kind < 0.55) {
    // Knock out an interior wall.
    if (innerWalls.length === 0) return null;
    walls[pick(rng, innerWalls)] = false;
  } else if (kind < 0.775) {
    // Move a box to another free cell (never onto a goal).
    if (freeFloor.length === 0) return null;
    boxes[int(rng, 0, boxes.length - 1)] = pick(rng, freeFloor);
  } else {
    // Move a goal to another cell without a goal or box on it.
    const gs = floorCells.filter((c) => goals[c]);
    const targets = floorCells.filter((c) => !goals[c] && !boxes.includes(c));
    if (gs.length === 0 || targets.length === 0) return null;
    goals[pick(rng, gs)] = false;
    goals[pick(rng, targets)] = true;
  }

  const edited: Level = { width, height, walls, goals, boxes, player: level.player };
  // Every box and goal must still be reachable floor, and the room must stay enclosed.
  const after = reachableFloor(edited);
  if (!enclosed(edited)) return null;
  if (boxes.some((b) => !after[b]) || goals.some((g, i) => g && !after[i])) return null;
  if (goals.filter(Boolean).length !== boxes.length) return null;
  if (boxes.some((b) => goals[b])) return null; // no box may start on a goal
  return normalizeLevel(edited);
}

export interface ClimbOptions {
  /** Maximum number of edits to try. */
  steps: number;
  /** Search budget for each solve. */
  maxStates: number;
  /** Stop early when this holds for the current level. */
  done: (c: Candidate) => boolean;
  /** Reject levels that fail the layout quality gate. */
  acceptable: (c: Candidate) => boolean;
}

/** Hill-climb from `start`; returns the best level found (possibly `start` itself). */
export function climb(start: Candidate, rng: Rng, opts: ClimbOptions): Candidate {
  let current = start;
  let level = parseLevel(start.text);
  for (let step = 0; step < opts.steps && !opts.done(current); step++) {
    const edited = mutateLevel(level, rng);
    if (!edited) continue;
    const text = levelToString(edited);
    const cand = evaluate(
      { text, width: edited.width, height: edited.height },
      reachableFloor(edited).filter(Boolean).length,
      edited.boxes.length,
      opts.maxStates,
    );
    if (!cand || !opts.acceptable(cand)) continue;
    // Accept sideways moves too, which lets the search cross plateaus.
    if (challenge(cand) >= challenge(current)) {
      current = cand;
      level = parseLevel(text);
    }
  }
  return current;
}
