import type { LevelEntry } from './types';

/**
 * Procedurally generated levels, ordered easiest to hardest.
 * Produced by tools/generate.ts (seeds: 21, 22, 23, 24 (10000 attempts each)) and selected by tools/curate.ts.
 * Every level is verified solvable by tests/levels.test.ts.
 */
export const GENERATED_LEVELS: readonly LevelEntry[] = [
  {
    id: 'gen-01',
    name: 'Quarry',
    par: 7,
    text: `
########
#   .  #
#  ##$ #
#  ## ##
# $##. #
# @##  #
########
`,
  },
  {
    id: 'gen-02',
    name: 'Harbor',
    par: 7,
    text: `
###########
#       # #
#@$     # #
#         #
###   ##$##
###   ##.#
#  #.  # ##
#      #  #
###########
`,
  },
  {
    id: 'gen-03',
    name: 'Cellar',
    par: 8,
    text: `
###########
#  .##    #
#   ##    #
#   ## ####
#    $@#
#   $.##
#######
`,
  },
  {
    id: 'gen-04',
    name: 'Foundry',
    par: 8,
    text: `
#######
#.    #
#.  $@#
#   $ #
##    #
 ######
`,
  },
  {
    id: 'gen-05',
    name: 'Granary',
    par: 8,
    text: `
#######
# #   #
# .   #
# $ $ #
# @ ###
# ####
# ## #
#.   #
######
`,
  },
  {
    id: 'gen-06',
    name: 'Depot',
    par: 8,
    text: `
#########
#.  .@  #
# ## $$ #
#       #
#       #
#########
`,
  },
  {
    id: 'gen-07',
    name: 'Annex',
    par: 9,
    text: `
  ########
### . .  #
#        #
# $$   ###
##@ ##   #
 #########
`,
  },
  {
    id: 'gen-08',
    name: 'Loft',
    par: 11,
    text: `
#### #####
#  # #   #
# $###   #
# @#  #  #
# $#    .#
# .      #
#        #
##########
`,
  },
  {
    id: 'gen-09',
    name: 'Bunker',
    par: 12,
    text: `
##########
#  .##   #
#   ## $ #
#   .  $@#
#   ##   #
##########
`,
  },
  {
    id: 'gen-10',
    name: 'Wharf',
    par: 8,
    text: `
#########
#     @ #
### $ $ #
###    .#
#   ##  #
#       #
# . #   #
#       #
#########
`,
  },
  {
    id: 'gen-11',
    name: 'Dockyard',
    par: 13,
    text: `
#########
# #.    #
# ####  #
# ####  #
# $@$  .#
#       #
#########
`,
  },
  {
    id: 'gen-12',
    name: 'Smithy',
    par: 10,
    text: `
#########
#    #  #
# ##.#  #
#      .#
# .$ #$$#
#    # @#
#########
`,
  },
  {
    id: 'gen-13',
    name: 'Cannery',
    par: 10,
    text: `
 #####
## @ ##
# $$$ #
#    .#
#   ..#
##   ##
 #####
`,
  },
  {
    id: 'gen-14',
    name: 'Boiler Room',
    par: 14,
    text: `
######
#    #
#$#  ##
#.# $@#
#.  ###
# .$ ##
#     #
#######
`,
  },
  {
    id: 'gen-15',
    name: 'Mill',
    par: 8,
    text: `
###########
#    #    #
# $       #
#   @$    #
#   . #   #
#       ###
#       ###
#    .    #
###########
`,
  },
  {
    id: 'gen-16',
    name: 'Pantry',
    par: 12,
    text: `
   ######
#### $..#
# $   . #
#@$     #
####    #
   ######
`,
  },
  {
    id: 'gen-17',
    name: 'Lighthouse',
    par: 10,
    text: `
########
#.     #
#    # #
#    # #
#    # #
#  $ # #
#  @$  #
#.    ##
#######
`,
  },
  {
    id: 'gen-18',
    name: 'Stockroom',
    par: 9,
    text: `
#######
# .   #
#     #
#@$.  #
#.    #
# $ $ #
###   #
  #####
`,
  },
  {
    id: 'gen-19',
    name: 'Crossing',
    par: 12,
    text: `
 ######
 #  . #
##$ . #
# $   #
#@$   #
# ## .#
#######
`,
  },
  {
    id: 'gen-20',
    name: 'Gatehouse',
    par: 11,
    text: `
########
#  .   #
#  $ $ #
# #@$  #
# ## # #
#    #.#
#   ## #
##  # .#
 #######
`,
  },
  {
    id: 'gen-21',
    name: 'Cistern',
    par: 13,
    text: `
##### ###
#   # #+#
#   ###$#
# $ .  .#
# $     #
# ###   #
# # #   #
### #####
`,
  },
  {
    id: 'gen-22',
    name: 'Tannery',
    par: 9,
    text: `
##########
#   @#  .#
# $ $# $ #
# #      #
#    . ###
#.       #
##########
`,
  },
  {
    id: 'gen-23',
    name: 'Kiln',
    par: 10,
    text: `
##########
#.      .#
#  $+    #
# $ $    #
#        #
##########
`,
  },
  {
    id: 'gen-24',
    name: 'Rope Walk',
    par: 16,
    text: `
###########
#    ##   #
# ##      #
# ## ##   #
#        .#
# $      .#
#@$       #
#         #
###########
`,
  },
  {
    id: 'gen-25',
    name: 'Bakehouse',
    par: 14,
    text: `
###########
#       . #
##  . $@###
#  ## $ $ #
#  . #    #
##   #### #
#     ##  #
###########
`,
  },
  {
    id: 'gen-26',
    name: 'Salt Store',
    par: 11,
    text: `
###########
# #       #
# #  $  . #
# ##   $  #
#     #@# #
#     #$  #
#   .   # #
#    .    #
###########
`,
  },
  {
    id: 'gen-27',
    name: 'Lamp Works',
    par: 11,
    text: `
  ########
  #  .   #
  #      #
 ##  .   #
##       #
# $.  $  #
# @$     #
#        #
##########
`,
  },
  {
    id: 'gen-28',
    name: 'Chandlery',
    par: 14,
    text: `
#########
# ##   .#
# ##$ ###
#     . #
# $##   #
#  ##   #
#@$     #
#   .   #
#########
`,
  },
  {
    id: 'gen-29',
    name: 'Tidal Store',
    par: 18,
    text: `
#########
# @#  . #
# $.$   #
#  #$ $ #
#. # .  #
#########
`,
  },
  {
    id: 'gen-30',
    name: 'Belfry',
    par: 13,
    text: `
#######
#...$ #
#   . #
# .$ ##
#$   #
#@$$ #
##   #
 #####
`,
  },
  {
    id: 'gen-31',
    name: 'Vault',
    par: 12,
    text: `
###########
#         #
#  .      #
#         #
#  $    ###
# $    $+#
#       ##
#      .#
#########
`,
  },
  {
    id: 'gen-32',
    name: 'Signal Hall',
    par: 18,
    text: `
  #########
###.      #
# $@$ . . #
# $ $ #  .#
#         #
###########
`,
  },
  {
    id: 'gen-33',
    name: 'Engine Shed',
    par: 15,
    text: `
##########
#        #
#. ## $ .#
#   . ## #
#. $$    #
####    ##
  #    $@#
  #    ###
  ######
`,
  },
  {
    id: 'gen-34',
    name: 'Cold Store',
    par: 15,
    text: `
##########
#.      .#
#  $     #
#    $ . #
#       ##
###  #$$##
  # .#@  #
  ########
`,
  },
  {
    id: 'gen-35',
    name: 'Long Haul',
    par: 31,
    text: `
###########
# @ ##    #
##$$##   .#
##      ..#
#       . #
#   $#    #
#  $      #
#         #
###########
`,
  },
];
