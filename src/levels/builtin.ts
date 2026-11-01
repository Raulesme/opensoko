import { GENERATED_LEVELS } from './generated';
import type { LevelEntry } from './types';

export type { LevelEntry };

/** Hand-made tutorial levels. */
const INTRO_LEVELS: readonly LevelEntry[] = [
  {
    id: 'builtin-1',
    name: 'First Push',
    text: `
#####
#@$.#
#####
`,
  },
  {
    id: 'builtin-2',
    name: 'Open Room',
    text: `
#######
#     #
# .$@ #
#     #
#######
`,
  },
  {
    id: 'builtin-4',
    name: 'Corner Turn',
    text: `
######
#@   #
# $  #
#    #
#  . #
######
`,
  },
  {
    id: 'builtin-5',
    name: 'Pocket',
    text: `
########
#  #   #
#  $ . #
# @$ . #
#  #   #
########
`,
  },
  {
    id: 'builtin-6',
    name: 'Side by Side',
    text: `
#######
#     #
# $ $ #
#  @  #
# . . #
#######
`,
  },
];

/** All playable levels in order: tutorial levels first, then generated ones by difficulty. */
export const BUILTIN_LEVELS: readonly LevelEntry[] = [...INTRO_LEVELS, ...GENERATED_LEVELS];
