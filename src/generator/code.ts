/**
 * Shareable puzzle codes.
 *
 * A code identifies a random puzzle by generator version, difficulty and seed. The short form is
 * `2h1a2b3c`: one digit for the version, one letter for the difficulty (e, m, h, x) and the seed in
 * base 36. The longer `v2.hard.482913` form is still accepted. Keeping the version in the code
 * means a future generator change produces a clear "different version" message instead of silently
 * showing a different level for an old link.
 */

/** 2: difficulty uses the interaction-aware `challenge` score (version 1 used raw length). */
export const CODE_VERSION = 2;

/** One letter per difficulty preset, used by the short form. */
export const PRESET_LETTERS: Readonly<Record<string, string>> = {
  easy: 'e',
  medium: 'm',
  hard: 'h',
  expert: 'x',
};

const LETTER_PRESETS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(PRESET_LETTERS).map(([preset, letter]) => [letter, preset]),
);

export interface PuzzleCode {
  preset: string;
  seed: number;
}

const MAX_SEED = 0xffffffff;

/** The short code for a puzzle, e.g. `2h1a2b3c`. */
export function formatCode(c: PuzzleCode): string {
  const letter = PRESET_LETTERS[c.preset];
  if (!letter) throw new Error(`No code letter for difficulty '${c.preset}'`);
  if (!Number.isInteger(c.seed) || c.seed < 0 || c.seed > MAX_SEED) {
    throw new Error(`Seed out of range: ${c.seed}`);
  }
  return `${CODE_VERSION}${letter}${c.seed.toString(36)}`;
}

/** Trim, lower-case, and pull the code out of a pasted link like `https://.../#p=2h1a2b3c`. */
function normalise(text: string): string {
  const t = text.trim().toLowerCase();
  const at = t.indexOf('#p=');
  return at >= 0 ? t.slice(at + 3) : t;
}

const SHORT = /^(\d)([a-z])([0-9a-z]{1,7})$/;
const LONG = /^v(\d+)\.([a-z]+)\.(\d{1,10})$/;

/**
 * Parse a code in either form. Returns null for anything malformed, for an unknown difficulty, or
 * for a code from a different generator version (see `codeVersion` to tell those apart).
 */
export function parseCode(text: string): PuzzleCode | null {
  const t = normalise(text);
  const short = SHORT.exec(t);
  if (short) {
    const preset = LETTER_PRESETS[short[2]!];
    const seed = parseInt(short[3]!, 36);
    if (Number(short[1]) !== CODE_VERSION || !preset || seed > MAX_SEED) return null;
    return { preset, seed };
  }
  const long = LONG.exec(t);
  if (long) {
    const seed = Number(long[3]);
    if (Number(long[1]) !== CODE_VERSION || seed > MAX_SEED) return null;
    return { preset: long[2]!, seed };
  }
  return null;
}

/** The generator version a code claims, if it looks like a code at all (else null). */
export function codeVersion(text: string): number | null {
  const t = normalise(text);
  const m = SHORT.exec(t) ?? LONG.exec(t);
  return m ? Number(m[1]) : null;
}

/** A random seed for a new puzzle. */
export function randomSeed(): number {
  return 1 + Math.floor(Math.random() * 999_999_999);
}
