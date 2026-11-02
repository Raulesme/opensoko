import { ADVANCED_LEVELS } from './advanced';
import { BUILTIN_LEVELS } from './builtin';
import type { LevelEntry } from './types';

export interface LevelPack {
  id: string;
  name: string;
  description: string;
  levels: readonly LevelEntry[];
}

/** Packs shown in the menu, in order. Empty packs are skipped. */
export const PACKS: readonly LevelPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Learn the ropes, from one push to a few crates.',
    levels: BUILTIN_LEVELS,
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Tight rooms, more crates, and plenty of ways to get stuck.',
    levels: ADVANCED_LEVELS,
  },
].filter((p) => p.levels.length > 0);

export const ALL_LEVELS: readonly LevelEntry[] = PACKS.flatMap((p) => p.levels);
