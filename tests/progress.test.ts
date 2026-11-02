import { describe, expect, it } from 'vitest';
import {
  emptyProgress,
  loadProgress,
  recordCompletion,
  saveProgress,
  setLastLevel,
  STORAGE_KEY,
} from '../src/storage/progress';
import type { StorageLike } from '../src/storage/progress';

function memoryStorage(initial?: string): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(STORAGE_KEY, initial);
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  };
}

describe('recordCompletion', () => {
  it('records the first completion as a new best', () => {
    const r = recordCompletion(emptyProgress(), 'a', 10, 4);
    expect(r.progress.levels.a).toEqual({ bestMoves: 10, bestPushes: 4 });
    expect(r.newBestMoves && r.newBestPushes).toBe(true);
  });

  it('keeps moves and pushes bests independently', () => {
    const first = recordCompletion(emptyProgress(), 'a', 10, 4).progress;
    const r = recordCompletion(first, 'a', 12, 3);
    expect(r.progress.levels.a).toEqual({ bestMoves: 10, bestPushes: 3 });
    expect(r.newBestMoves).toBe(false);
    expect(r.newBestPushes).toBe(true);
  });

  it('does not mutate the input', () => {
    const p = emptyProgress();
    recordCompletion(p, 'a', 1, 1);
    expect(p.levels).toEqual({});
  });
});

describe('load/save', () => {
  it('round-trips through storage', () => {
    const s = memoryStorage();
    const p = setLastLevel(recordCompletion(emptyProgress(), 'a', 7, 2).progress, 'a');
    expect(saveProgress(s, p)).toBe(true);
    expect(loadProgress(s)).toEqual(p);
  });

  it('returns empty progress for missing, corrupt or wrong-version data', () => {
    expect(loadProgress(memoryStorage())).toEqual(emptyProgress());
    expect(loadProgress(memoryStorage('{not json'))).toEqual(emptyProgress());
    expect(loadProgress(memoryStorage('{"version":2,"levels":{}}'))).toEqual(emptyProgress());
    expect(loadProgress(memoryStorage('null'))).toEqual(emptyProgress());
    expect(loadProgress(null)).toEqual(emptyProgress());
  });

  it('drops malformed level records but keeps valid ones', () => {
    const raw = JSON.stringify({
      version: 1,
      lastLevel: 'a',
      levels: {
        a: { bestMoves: 5, bestPushes: 2 },
        b: { bestMoves: -1, bestPushes: 2 },
        c: { bestMoves: 'x' },
        d: null,
      },
    });
    const p = loadProgress(memoryStorage(raw));
    expect(Object.keys(p.levels)).toEqual(['a']);
    expect(p.lastLevel).toBe('a');
  });

  it('survives storage that throws', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(loadProgress(broken)).toEqual(emptyProgress());
    expect(saveProgress(broken, emptyProgress())).toBe(false);
    expect(saveProgress(null, emptyProgress())).toBe(false);
  });
});
