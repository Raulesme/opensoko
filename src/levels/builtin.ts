export interface LevelEntry {
  /** Stable identifier used as the save-data key. Never change an id once released. */
  id: string;
  name: string;
  text: string;
}

/** Small original placeholder levels. Real level sets are tracked in docs/LEVEL-SOURCES.md. */
export const BUILTIN_LEVELS: readonly LevelEntry[] = [
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
    id: 'builtin-3',
    name: 'Two Crates',
    text: `
########
#  #   #
# $  $ #
#  @.  #
# .#   #
########
`,
  },
];
