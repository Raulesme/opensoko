/** Shareable puzzle codes like `v2.hard.482913`: version, difficulty preset and seed. */

/** v2: difficulty is measured by the interaction-aware `challenge` score (v1 used raw length). */
export const CODE_VERSION = 'v2';

export interface PuzzleCode {
  preset: string;
  seed: number;
}

export function formatCode(c: PuzzleCode): string {
  return `${CODE_VERSION}.${c.preset}.${c.seed}`;
}

/** Parse a code; returns null for anything malformed or from a different generator version. */
export function parseCode(text: string): PuzzleCode | null {
  const m = /^(v\d+)\.([a-z]+)\.(\d{1,10})$/.exec(text.trim().toLowerCase());
  if (!m || m[1] !== CODE_VERSION) return null;
  const seed = Number(m[3]);
  return seed <= 0xffffffff ? { preset: m[2]!, seed } : null;
}

/** A random seed for a new puzzle. */
export function randomSeed(): number {
  return 1 + Math.floor(Math.random() * 999_999_999);
}
