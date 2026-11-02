import { isAcceptable } from './curate';
import { challenge, generateOne, mulberry32 } from './generate';
import type { Candidate, GenOptions } from './generate';

export interface Preset {
  id: string;
  name: string;
  /** Accept a level only when its challenge score is in [minChallenge, maxChallenge). */
  minChallenge: number;
  maxChallenge: number;
  /** ...and it has at least this much box-on-box interaction (see metrics.ts). */
  minExcess: number;
  minAway: number;
  options: GenOptions;
  /** Give up (return null) after this many attempts. */
  maxAttempts: number;
}

/**
 * Difficulty presets. Bands are on the `challenge` score and every preset above Easy also demands
 * real interaction (boxes blocking each other, counter-intuitive pushes), so a level cannot reach
 * Hard just by being long. Room-size filters aim generation at shapes that produce interaction:
 * in generated pools, 4-5 boxes with at least ~8 floor cells per box did far better.
 */
export const PRESETS: readonly Preset[] = [
  {
    id: 'easy',
    name: 'Easy',
    minChallenge: 10,
    maxChallenge: 24,
    minExcess: 0,
    minAway: 0,
    options: {
      boxes: [2, 2, 3],
      pullsPerBox: [50, 80],
      hill: 0,
      hillPulls: [10, 30],
      maxStates: 20_000,
    },
    maxAttempts: 400,
  },
  {
    id: 'medium',
    name: 'Medium',
    minChallenge: 24,
    maxChallenge: 33,
    minExcess: 2,
    minAway: 0,
    options: {
      boxes: [3, 3, 4],
      pullsPerBox: [60, 90],
      hill: 0,
      hillPulls: [10, 30],
      maxStates: 60_000,
    },
    maxAttempts: 800,
  },
  {
    id: 'hard',
    name: 'Hard',
    minChallenge: 33,
    maxChallenge: 43,
    minExcess: 4,
    minAway: 1,
    options: {
      boxes: [4, 4, 5],
      pullsPerBox: [70, 110],
      hill: 0,
      hillPulls: [10, 30],
      maxStates: 100_000,
      minFloorCells: 32,
      maxFloorCells: 56,
    },
    maxAttempts: 3000,
  },
  {
    id: 'expert',
    name: 'Expert',
    minChallenge: 43,
    maxChallenge: 1000,
    minExcess: 6,
    minAway: 2,
    options: {
      boxes: [4, 5, 5],
      pullsPerBox: [70, 110],
      hill: 0,
      hillPulls: [10, 30],
      maxStates: 250_000,
      minFloorCells: 36,
      maxFloorCells: 60,
    },
    maxAttempts: 8000,
  },
];

export function findPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

export interface GeneratedPuzzle {
  candidate: Candidate;
  /** How many attempts it took (for diagnostics). */
  attempts: number;
}

/**
 * Deterministically generate a puzzle for a preset and seed: the same inputs always yield the same
 * level (for a given generator version), so a short code can share a puzzle.
 */
export function generateForPreset(seed: number, preset: Preset): GeneratedPuzzle | null {
  const rng = mulberry32(seed);
  for (let attempt = 1; attempt <= preset.maxAttempts; attempt++) {
    const candidate = generateOne(rng, preset.options);
    if (!candidate || !isAcceptable(candidate)) continue;
    const c = challenge(candidate);
    if (
      c >= preset.minChallenge &&
      c < preset.maxChallenge &&
      candidate.excess >= preset.minExcess &&
      candidate.away >= preset.minAway
    ) {
      return { candidate, attempts: attempt };
    }
  }
  return null;
}
