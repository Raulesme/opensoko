import { describe, expect, it } from 'vitest';
import { levelToString, parseLevel } from '../src/game';
import { climb, mutateLevel, normalizeLevel } from '../src/generator/climb';
import { isAcceptable } from '../src/generator/curate';
import { challenge, DEFAULT_OPTIONS, generateOne, mulberry32 } from '../src/generator/generate';
import { solvePushes } from '../src/generator/solver';

/** A small, fast starting level from the generator. */
function startCandidate(seed: number) {
  const rng = mulberry32(seed);
  for (let i = 0; i < 100; i++) {
    const c = generateOne(rng, { ...DEFAULT_OPTIONS, boxes: [2, 3], maxStates: 20_000 });
    if (c && isAcceptable(c)) return c;
  }
  throw new Error('no start candidate');
}

describe('normalizeLevel', () => {
  it('is idempotent and keeps box, goal and wall-count invariants', () => {
    const level = parseLevel(startCandidate(5).text);
    const once = normalizeLevel(level);
    const twice = normalizeLevel(once);
    expect(levelToString(twice)).toBe(levelToString(once));
    expect(once.boxes.length).toBe(level.boxes.length);
    expect(once.goals.filter(Boolean).length).toBe(level.goals.filter(Boolean).length);
  });

  it('drops stray walls that touch no floor and crops to the used area', () => {
    const padded = parseLevel('#########\n#       #\n#  @$ . #\n#       #\n#########');
    // Pad the grid with extra solid wall columns on the right.
    const w = padded.width + 3;
    const walls: boolean[] = [];
    const goals: boolean[] = [];
    for (let y = 0; y < padded.height; y++) {
      for (let x = 0; x < w; x++) {
        const inside = x < padded.width;
        walls.push(inside ? padded.walls[y * padded.width + x]! : true);
        goals.push(inside ? padded.goals[y * padded.width + x]! : false);
      }
    }
    const remap = (i: number) => Math.floor(i / padded.width) * w + (i % padded.width);
    const wide = {
      width: w,
      height: padded.height,
      walls,
      goals,
      boxes: padded.boxes.map(remap),
      player: remap(padded.player),
    };
    expect(normalizeLevel(wide).width).toBe(padded.width);
  });
});

describe('mutateLevel', () => {
  it('only ever returns valid, solver-ready levels', () => {
    const rng = mulberry32(11);
    let level = parseLevel(startCandidate(7).text);
    let produced = 0;
    for (let i = 0; i < 300; i++) {
      const edited = mutateLevel(level, rng);
      if (!edited) continue;
      produced++;
      // Round-trips through the parser: single player, matching counts, enclosed by walls.
      const reparsed = parseLevel(levelToString(edited));
      expect(reparsed.boxes.length).toBe(edited.boxes.length);
      expect(edited.boxes.some((b) => edited.goals[b])).toBe(false);
      level = reparsed;
    }
    expect(produced).toBeGreaterThan(30);
  });
});

describe('climb', () => {
  const opts = (steps: number) => ({
    steps,
    maxStates: 20_000,
    done: () => false,
    acceptable: isAcceptable,
  });

  it('never returns a level that is worse than the start, and the result is solvable', () => {
    const start = startCandidate(21);
    const best = climb(start, mulberry32(3), opts(40));
    expect(challenge(best)).toBeGreaterThanOrEqual(challenge(start));
    expect(solvePushes(parseLevel(best.text), 100_000)?.pushes.length).toBe(best.minPushes);
  });

  it('is deterministic for a given seed', () => {
    const start = startCandidate(21);
    const a = climb(start, mulberry32(9), opts(25));
    const b = climb(start, mulberry32(9), opts(25));
    expect(a.text).toBe(b.text);
  });

  it('stops early once the goal is reached', () => {
    const start = startCandidate(21);
    const best = climb(start, mulberry32(3), { ...opts(500), done: () => true });
    expect(best.text).toBe(start.text);
  });
});
