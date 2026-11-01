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
  {
    id: 'builtin-7',
    name: 'Wide Hall',
    text: `
##########
#        #
#   $$   #
# @      #
#   ..   #
##########
`,
  },
  {
    id: 'builtin-8',
    name: 'Alcove',
    text: `
#######
#  .  #
#  #  #
# $$  #
# @ . #
#######
`,
  },
  {
    id: 'builtin-9',
    name: 'Swap Room',
    text: `
########
#  .   #
# $#$  #
#  @ . #
########
`,
  },
  {
    id: 'builtin-10',
    name: 'The Ring',
    text: `
########
#      #
# #### #
# #. . #
#@$ $# #
#      #
########
`,
  },
  {
    id: 'builtin-11',
    name: 'Narrow Pass',
    text: `
#########
#   #   #
# $ # . #
#@  $ . #
#   #   #
#########
`,
  },
  {
    id: 'builtin-12',
    name: 'Doorway',
    text: `
#########
#   #   #
# $ # . #
#   $ . #
# @ #   #
#########
`,
  },
  {
    id: 'builtin-13',
    name: 'Three Crates',
    text: `
#########
#       #
# $ $ $ #
#   @   #
#       #
# . . . #
#########
`,
  },
];
