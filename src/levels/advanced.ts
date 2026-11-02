import type { LevelEntry } from './types';

/**
 * Harder procedurally generated levels, ordered easiest to hardest.
 * Produced by tools/generate.ts (seeds: 31, 32, 33 (2500 attempts each, 3-5 boxes, 300k state cap)) and selected by tools/curate.ts.
 * Every level is verified solvable by tests/levels.test.ts.
 */
export const ADVANCED_LEVELS: readonly LevelEntry[] = [
  {
    id: 'adv-01',
    name: 'Switchyard',
    par: 11,
    text: `
###########
#        .#
# $ $     #
## @.     #
## $      #
# .     # #
#   ##    #
#   ##    #
###########
`,
  },
  {
    id: 'adv-02',
    name: 'Chokepoint',
    par: 11,
    text: `
   ####
####  ###
# $   $+#
#  .   $#
#   $   #
#       #
###.   .#
  #######
`,
  },
  {
    id: 'adv-03',
    name: 'Bottleneck',
    par: 14,
    text: `
########
#  . ..#
# $    #
# $$ $@#
#     .#
########
`,
  },
  {
    id: 'adv-04',
    name: 'Gauntlet',
    par: 11,
    text: `
########
#@$  . #
##  ####
##.  . #
# $    #
#      #
#  $ $ #
#     .#
########
`,
  },
  {
    id: 'adv-05',
    name: 'Labyrinth',
    par: 15,
    text: `
###########
#  ##  .  #
#  ##   . #
#       . #
# $    $@ #
#     $   #
##      # #
 ##########
`,
  },
  {
    id: 'adv-06',
    name: 'Catacomb',
    par: 13,
    text: `
###########
# $. ##   #
# ##### ..#
# ###   $ #
#         #
#. $ ##   #
#   $@##  #
#  #  ##  #
###########
`,
  },
  {
    id: 'adv-07',
    name: 'Turnstile',
    par: 11,
    text: `
#####
# . #####
#. $@$ .#
#   $   #
#   $   #
#     . #
###     #
  #######
`,
  },
  {
    id: 'adv-08',
    name: 'Spillway',
    par: 13,
    text: `
#####
# . # #####
# $ # #.  #
#   ### $.#
#     $@$.#
#  .### $ #
##### #   #
      #####
`,
  },
  {
    id: 'adv-09',
    name: 'Undertow',
    par: 13,
    text: `
#########
#       #
#$ ## $ #
#  ##   #
#   # ..#
# #    $#
# .   $@#
#.$.  ###
#######
`,
  },
  {
    id: 'adv-10',
    name: 'Crosscurrent',
    par: 14,
    text: `
###########
#  .      #
#       $@#
#       $ #
#        ##
# $ .##  #
#.     ###
########
`,
  },
  {
    id: 'adv-11',
    name: 'Ironworks',
    par: 15,
    text: `
########
# .    ###
#. $   $.#
#      $@#
##.    $ #
 #########
`,
  },
  {
    id: 'adv-12',
    name: 'Gridlock',
    par: 16,
    text: `
##########
#      ..#
# $      ##
# @$      #
#    $  . #
#  #  #   #
# ##  #   #
#         #
###########
`,
  },
  {
    id: 'adv-13',
    name: 'Switchback',
    par: 13,
    text: `
##########
#        #
# $.$   .#
#  ##   .#
# $    $@#
# ##     #
#     .  #
#        #
##########
`,
  },
  {
    id: 'adv-14',
    name: 'Knotwork',
    par: 13,
    text: `
#########
#       #
#.   $  #
# .   $ #
# .  ## #
#    ## #
## $@$  #
 #  .   #
 ########
`,
  },
  {
    id: 'adv-15',
    name: 'Sluice',
    par: 17,
    text: `
###########
#         #
# $$   $@ #
#         #
#      .###
# #     # #
#    .    #
#     .   #
###########
`,
  },
  {
    id: 'adv-16',
    name: 'Weir',
    par: 14,
    text: `
###########
#  .      #
# ##.  .###
# .    $+ #
# $ # $$$ #
#   #     #
###########
`,
  },
  {
    id: 'adv-17',
    name: 'Cofferdam',
    par: 17,
    text: `
### ######
# ###    #
#  ## $  #
#  .. .  #
#  ##  $ #
##$## $  #
 #@#    .#
 #########
`,
  },
  {
    id: 'adv-18',
    name: 'Breakwater',
    par: 13,
    text: `
##########
#        #
# .  $ $ #
#   $@#  #
#.   $.  #
#      ###
#     ## #
#    .   #
##########
`,
  },
  {
    id: 'adv-19',
    name: 'Maelstrom',
    par: 13,
    text: `
###########
#         #
# # .   $ #
# # # @   #
#   #.$ $ #
#.  #    ##
# $ .     #
#         #
###########
`,
  },
  {
    id: 'adv-20',
    name: 'Eddy',
    par: 19,
    text: `
##########
# .    ..##
#         #
# $$$     #
###@$  .  #
  #####   #
      #####
`,
  },
  {
    id: 'adv-21',
    name: 'Backwater',
    par: 15,
    text: `
###########
#       . #
#    $ ## #
#   .#### #
#   $@$   #
#    ##   #
#  $.#### #
#   .     #
###########
`,
  },
  {
    id: 'adv-22',
    name: 'Riptide',
    par: 16,
    text: `
  ####
### +#
# $$$###
#      #
# $    #
#.   $.#
# ..####
#####
`,
  },
  {
    id: 'adv-23',
    name: 'Cutwater',
    par: 13,
    text: `
  ########
  #   .  #
#####.$# #
#  ##$@# #
# $   $ .#
#  #.$ # #
#       .#
##########
`,
  },
  {
    id: 'adv-24',
    name: 'Drydock',
    par: 17,
    text: `
 ##########
 #        #
##.     $ #
#.  ##    #
#   ###   #
##  $@$ # #
##   #$ ###
#  .  . #
#########
`,
  },
  {
    id: 'adv-25',
    name: 'Slipway',
    par: 16,
    text: `
   ###
   # ##
 ###. ###
##   .$@#
#.    $$#
#       #
#    $  #
# $ .  .#
#########
`,
  },
  {
    id: 'adv-26',
    name: 'Capstan',
    par: 18,
    text: `
  #######
  #   . #
###$$   #
#@$   ..#
# $.  . #
#  #$   #
####    #
   ######
`,
  },
  {
    id: 'adv-27',
    name: 'Windlass',
    par: 15,
    text: `
###########
#   .     #
#     ##  #
# $$$ #####
#      ####
#      .  #
#   @$    #
#  .  .   #
###########
`,
  },
  {
    id: 'adv-28',
    name: 'Bulkhead',
    par: 13,
    text: `
##########
#     . .#
#.  $@ $ #
# .      #
#   $$.$ #
#        #
##########
`,
  },
  {
    id: 'adv-29',
    name: 'Keelhaul',
    par: 16,
    text: `
###########
#   @   ..#
# $ $ # $ #
###   # $ #
#         #
#      ## #
# #.     .#
#         #
###########
`,
  },
  {
    id: 'adv-30',
    name: 'Tangle',
    par: 15,
    text: `
##########
#   @   .#
# $ $$  .#
# $   $  #
#.  . .  #
##########
`,
  },
  {
    id: 'adv-31',
    name: 'Deadlock',
    par: 20,
    text: `
###########
#  # .    #
# $@$     #
#  $  #.  #
# ##  #   #
#  $  .   #
#        .#
###########
`,
  },
  {
    id: 'adv-32',
    name: 'Impasse',
    par: 16,
    text: `
###########
#.        #
# $ # $  .#
# $ # $ #.#
#    $+## #
#  . #### #
#    ##   #
###########
`,
  },
  {
    id: 'adv-33',
    name: 'Quagmire',
    par: 17,
    text: `
###########
#   .    .#
# .  $  $ #
###       #
###  ## $ #
#@$       #
###  #   ##
  # ##. $.#
  #########
`,
  },
  {
    id: 'adv-34',
    name: 'Conundrum',
    par: 19,
    text: `
###########
#    #   .#
# $ ##    #
# ###.    #
# .       #
#  $ $$$###
#. .# @ #
#########
`,
  },
  {
    id: 'adv-35',
    name: 'Last Crate',
    par: 22,
    text: `
###########
# .       #
#  #   $$ #
# .#..  $@#
#   .    ##
#  $ ##  ##
#    ##$  #
#         #
###########
`,
  },
];
