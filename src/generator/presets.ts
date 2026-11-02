import { isAcceptable } from './curate';
import { difficulty, generateOne, mulberry32 } from './generate';
import type { Candidate, GenOptions } from './generate';

export interface Preset {
  id: string;
  name: string;
  /** Accept a generated level only when its difficulty score is in [min, max). */
  minDifficulty: number;
  maxDifficulty: number;
  options: GenOptions;
  /** Give up (return null) after this many attempts. */
  maxAttempts: number;
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'easy',
    name: 'Easy',
    minDifficulty: 28,
    maxDifficulty: 45,
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
    minDifficulty: 45,
    maxDifficulty: 65,
    options: {
      boxes: [3, 3, 4],
      pullsPerBox: [60, 90],
      hill: 0,
      hillPulls: [10, 30],
      maxStates: 60_000,
    },
    maxAttempts: 600,
  },
  {
    id: 'hard',
    name: 'Hard',
    minDifficulty: 65,
    maxDifficulty: 85,
    options: {
      boxes: [4, 4, 5],
      pullsPerBox: [70, 110],
      hill: 0,
      hillPulls: [10, 30],
      maxStates: 120_000,
    },
    maxAttempts: 1500,
  },
  {
    id: 'expert',
    name: 'Expert',
    minDifficulty: 85,
    maxDifficulty: 1000,
    options: {
      boxes: [4, 5, 5],
      pullsPerBox: [70, 110],
      hill: 0,
      hillPulls: [10, 30],
      maxStates: 250_000,
    },
    maxAttempts: 4000,
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
    const d = difficulty(candidate);
    if (d >= preset.minDifficulty && d < preset.maxDifficulty)
      return { candidate, attempts: attempt };
  }
  return null;
}
