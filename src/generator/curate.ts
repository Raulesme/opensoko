/**
 * Pick a difficulty-ramped, varied selection from generated candidates.
 *   npx vite-node tools/curate-cli.ts --in a.json,b.json --count 35 --out picks.json
 */
import { canonical, difficulty } from './generate';
import type { Candidate } from './generate';

export { difficulty };

export interface Scored extends Candidate {
  score: number;
}

/** Layout quality gate: reject boring (huge open) or trivial candidates. */
export function isAcceptable(c: Candidate): boolean {
  const openness = c.floorCells / (c.width * c.height);
  return (
    c.floorCells >= 18 &&
    openness <= 0.78 &&
    c.minPushes >= 3 + 2 * c.boxes &&
    c.states >= 8 * c.boxes
  );
}

/** Choose `count` candidates spread evenly across the difficulty range. */
export function curate(all: Candidate[], count: number): Scored[] {
  const seen = new Set<string>();
  const pool: Scored[] = [];
  for (const c of all) {
    const key = canonical(c.text);
    if (seen.has(key) || !isAcceptable(c)) continue;
    seen.add(key);
    pool.push({ ...c, score: difficulty(c) });
  }
  pool.sort((a, b) => a.score - b.score);
  if (pool.length <= count) return pool;

  const picks: Scored[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    // Target rank, then slide to the nearest unused candidate with a new box count/size mix.
    const target = Math.round((i / (count - 1)) * (pool.length - 1));
    let best = -1;
    for (let off = 0; off < pool.length; off++) {
      for (const idx of [target - off, target + off]) {
        if (idx < 0 || idx >= pool.length || used.has(idx)) continue;
        const prev = picks[picks.length - 1];
        const cand = pool[idx]!;
        // Avoid two identical-looking neighbours in a row (same box count and room size).
        if (
          prev &&
          prev.boxes === cand.boxes &&
          prev.width === cand.width &&
          prev.height === cand.height
        )
          continue;
        best = idx;
        break;
      }
      if (best >= 0) break;
    }
    if (best < 0) break;
    used.add(best);
    picks.push(pool[best]!);
  }
  return picks;
}
