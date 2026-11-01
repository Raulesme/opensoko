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
