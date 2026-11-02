/** Persistent player progress, stored as JSON in localStorage (or any Storage-like object). */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LevelRecord {
  bestMoves: number;
  bestPushes: number;
}

export interface Progress {
  version: 1;
  /** Records for completed levels, keyed by level id. */
  levels: Record<string, LevelRecord>;
  /** Id of the level most recently opened. */
  lastLevel: string | null;
}

export const STORAGE_KEY = 'opensoko:progress';

export function emptyProgress(): Progress {
  return { version: 1, levels: {}, lastLevel: null };
}

function isCount(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}

/** Load progress; anything missing, corrupt or inaccessible yields empty progress. */
export function loadProgress(storage: StorageLike | null): Progress {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return emptyProgress();
    const obj = data as Record<string, unknown>;
    if (obj.version !== 1) return emptyProgress();

    const progress = emptyProgress();
    if (typeof obj.lastLevel === 'string') progress.lastLevel = obj.lastLevel;
    if (typeof obj.levels === 'object' && obj.levels !== null) {
      for (const [id, rec] of Object.entries(obj.levels)) {
        const r = rec as Partial<LevelRecord> | null;
        if (r && isCount(r.bestMoves) && isCount(r.bestPushes)) {
          progress.levels[id] = { bestMoves: r.bestMoves, bestPushes: r.bestPushes };
        }
      }
    }
    return progress;
  } catch {
    return emptyProgress();
  }
}

/** Save progress. Returns false if storage is unavailable (private mode, quota, ...). */
export function saveProgress(storage: StorageLike | null, progress: Progress): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export interface CompletionResult {
  progress: Progress;
  newBestMoves: boolean;
  newBestPushes: boolean;
}

/** Record a finished level, keeping the lowest moves and pushes independently. Pure. */
export function recordCompletion(
  progress: Progress,
  levelId: string,
  moves: number,
  pushes: number,
): CompletionResult {
  const prev = progress.levels[levelId];
  const record: LevelRecord = prev
    ? { bestMoves: Math.min(prev.bestMoves, moves), bestPushes: Math.min(prev.bestPushes, pushes) }
    : { bestMoves: moves, bestPushes: pushes };
  return {
    progress: { ...progress, levels: { ...progress.levels, [levelId]: record } },
    newBestMoves: !prev || moves < prev.bestMoves,
    newBestPushes: !prev || pushes < prev.bestPushes,
  };
}

export function setLastLevel(progress: Progress, levelId: string): Progress {
  return { ...progress, lastLevel: levelId };
}

/** The real localStorage, or null when the browser blocks access to it. */
export function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
