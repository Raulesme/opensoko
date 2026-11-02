import type { LevelEntry } from './types';

/**
 * Very hard levels found by local search (tools/climb-cli.ts), ordered easiest to hardest.
 * Produced by tools/generate.ts (seeds: top 60 of the advanced pool (seeds 31-33) improved by tools/climb-cli.ts: 150 edits each, challenge cap 110) and selected by tools/curate.ts.
 * Every level is verified solvable by tests/levels.test.ts.
 */
export const MASTER_LEVELS: readonly LevelEntry[] = [
  {
    id: 'mst-01',
    name: 'Foothold',
    par: 24,
    text: `
##########
#  @   . #
##     . #
#  .     #
##$ $    #
#  $    .#
# $      #
##  # #  #
 #########
`,
  },
  {
    id: 'mst-02',
    name: 'Pinch Point',
    par: 27,
    text: `
###########
#       ..#
#    $  # #
##  ####  #
# .$$@$   #
#    # # ##
##  .    ##
#         #
###########
`,
  },
  {
    id: 'mst-03',
    name: 'Crossed Wires',
    par: 28,
    text: `
      #####
###   #. .#
#  ## #   #
# #  #    #
# #$      #
#  $  .@  #
# $ #     #
#   # #   #
###########
`,
  },
  {
    id: 'mst-04',
    name: 'Hard Shoulder',
    par: 23,
    text: `
##########
#   ##   #
# $@$.   #
#    #   #
##  $ #  #
#    #   #
#   #.   #
#       .#
##########
`,
  },
  {
    id: 'mst-05',
    name: 'Switchgear',
    par: 27,
    text: `
###########
#.      $ #
# $ $     #
#  #. .#.#
#  #$ ### #
#       $+#
###########
`,
  },
  {
    id: 'mst-06',
    name: 'Tight Squeeze',
    par: 28,
    text: `
####  ####
#  # ##  #
#   #   .#
#  $ #   #
##$   .  #
 #       #
##$   @$##
#  .  .  #
##########
`,
  },
  {
    id: 'mst-07',
    name: 'Slow Burn',
    par: 33,
    text: `
  ########
  # # # .##
###      .#
# $  .    #
# $ $    .#
#@$ $#  . #
###  #   ##
  ########
`,
  },
  {
    id: 'mst-08',
    name: 'Stranglehold',
    par: 30,
    text: `
##########
#+#  $  .#
#$#   $$ #
# #      #
# .#     #
#    . $##
#  .     #
##########
`,
  },
  {
    id: 'mst-09',
    name: 'Pressure Valve',
    par: 29,
    text: `
#########
# $  .#@#
#..  # $#
#    #  #
#  $  $ #
#. #  $.#
#  #    #
#########
`,
  },
  {
    id: 'mst-10',
    name: 'Fault Line',
    par: 26,
    text: `
  #########
  #       #
### ### $ #
#    $@$. #
##     $###
#.  . . #
#########
`,
  },
  {
    id: 'mst-11',
    name: 'Long Division',
    par: 26,
    text: `
  #######
### @   #
#.#$ $$ ##
#.#. .$$ #
#        #
#.       #
##########
`,
  },
  {
    id: 'mst-12',
    name: 'Dead Reckoning',
    par: 26,
    text: `
 ##########
#   # #   #
# $@      #
##$$      #
#  .      #
#  $    #.#
#      . .#
###########
`,
  },
  {
    id: 'mst-13',
    name: 'Knife Edge',
    par: 29,
    text: `
     ####
  #### @##
## $   $.#
#. ##    #
# .   #$##
#   #   #
#       #
 #  #  #
 #######
`,
  },
  {
    id: 'mst-14',
    name: 'Overload',
    par: 32,
    text: `
###########
#     . $ #
#.    #$$ #
#.   #    #
#  .    # #
#       $ #
#    @   ##
# #  # # #
##########
`,
  },
  {
    id: 'mst-15',
    name: 'Cold Iron',
    par: 26,
    text: `
  ########
##      .#
#  @     #
##   #   #
#   #    #
##$ #    #
# $$#    #
# .   #. #
##########
`,
  },
  {
    id: 'mst-16',
    name: 'Pitfall',
    par: 30,
    text: `
###########
# #   #   #
# $$#     #
#.    #  .#
#$#   #   #
#@  #     #
#  #      #
#  #     .#
### #######
`,
  },
  {
    id: 'mst-17',
    name: 'Black Ice',
    par: 34,
    text: `
  ####
### @#
# $$$ ##
#  $ $ #
#  .   #
#..#  ##
# ..##
#####
`,
  },
  {
    id: 'mst-18',
    name: 'Chain Reaction',
    par: 32,
    text: `
#########
#   # # #
# $   $ ##
###   .. #
 #  #.  ##
##    #  #
# # $$   #
#+$  .   #
##########
`,
  },
  {
    id: 'mst-19',
    name: 'Undercurrent',
    par: 31,
    text: `
#########
#  #    #
#  #  $ #
#    . ##
##  # # #
# $# $$ #
# .# @..#
 ########
`,
  },
  {
    id: 'mst-20',
    name: 'Rock Bottom',
    par: 35,
    text: `
###########
#.     # .#
#     .## #
#         #
#  ##     #
#  ##  $$ #
#   .#  $$#
#    ##.$@#
###########
`,
  },
  {
    id: 'mst-21',
    name: 'Last Resort',
    par: 33,
    text: `
###########
#      .  #
#         #
#         #
# $    #  #
# $  ##   #
# #$   # .#
# $+#   . #
###########
`,
  },
  {
    id: 'mst-22',
    name: 'Point of No Return',
    par: 32,
    text: `
#####
#   #####
# $$$   #
#@$.## .#
#  $    #
 ## .   #
   # . .#
    #####
`,
  },
  {
    id: 'mst-23',
    name: 'Gordian',
    par: 38,
    text: `
###########
#.    ##  #
#     #  ##
#   # @$  #
##.. #$$$ #
### #     #
#     .   #
#         #
###########
`,
  },
  {
    id: 'mst-24',
    name: 'Redline',
    par: 34,
    text: `
###########
#  # # #  #
##  $    @#
# .   .$$ #
#     # $ #
#.      ###
#. # # #
########
`,
  },
  {
    id: 'mst-25',
    name: 'Whiteout',
    par: 30,
    text: `
##########
#.    #   #
# .       #
#         #
#       $@#
#      .$ #
#   #  $$##
#.   #    #
###########
`,
  },
  {
    id: 'mst-26',
    name: 'Hairpin',
    par: 35,
    text: `
 ##########
 #   #    #
  #   # $ #
###  #   ##
#       $@#
#     ##$##
#      .  #
#..     ###
########
`,
  },
  {
    id: 'mst-27',
    name: 'Endgame',
    par: 40,
    text: `
###########
#.    #   #
#.   #. # #
#  ##  $  #
#  # #$ $##
#       @##
#  .   #$ #
#         #
###########
`,
  },
  {
    id: 'mst-28',
    name: 'Zugzwang',
    par: 36,
    text: `
### ######
# ##     #
#  ## $ ##
# $.. .# #
#. ##  $ #
# $ #    #
 #@#     #
 #########
`,
  },
  {
    id: 'mst-29',
    name: 'Checkmate',
    par: 37,
    text: `
########
# .   . #
#      @#
## # #.$###
#   $.  $ #
#   # # $ #
##  ###   #
 #### #####
`,
  },
  {
    id: 'mst-30',
    name: 'Apex',
    par: 46,
    text: `
###########
#. # .   .#
#   ##    #
# $$#   #.#
#$ $ $@   #
#   # #. ##
#   #     #
###########
`,
  },
];
