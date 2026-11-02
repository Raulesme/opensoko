import type { LevelEntry } from '../levels/types';

/** One short lesson: a tiny level plus a caption shown above the board. */
export interface TutorialStep {
  name: string;
  /** Fewest pushes (verified by the test-suite solver). */
  par: number;
  text: string;
  /** Caption for keyboard players, and for touch players (swipe and tap wording). */
  caption: { keys: string; touch: string };
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    name: 'Push the crate',
    par: 2,
    text: `
#######
#@ $ .#
#######
`,
    caption: {
      keys: 'Move with the arrow keys or WASD. Push the crate onto the glowing target.',
      touch: 'Swipe to move. Push the crate onto the glowing target.',
    },
  },
  {
    name: 'Walk around',
    par: 2,
    text: `
######
#  . #
#@$  #
#    #
######
`,
    caption: {
      keys: 'You can only push, never pull. To push a crate another way, walk around to its other side.',
      touch:
        'You can only push, never pull. To push a crate another way, walk around to its other side.',
    },
  },
  {
    name: 'More crates',
    par: 6,
    text: `
#########
#.     .#
#   $ $ #
#   @   #
#       #
#########
`,
    caption: {
      keys: 'Every crate needs its own target. A crate in the way can block you, so think about the order.',
      touch:
        'Every crate needs its own target. A crate in the way can block you, so think about the order.',
    },
  },
  {
    name: 'Mistakes happen',
    par: 3,
    text: `
########
#      #
# .  $ #
#   @  #
#      #
########
`,
    caption: {
      keys: 'A crate against a wall can slide along it but never leave it. Try pushing this one up against the top wall, then undo with Z.',
      touch:
        'A crate against a wall can slide along it but never leave it. Try pushing this one up against the top wall, then tap Undo.',
    },
  },
  {
    name: 'Stuck?',
    par: 6,
    text: `
#########
#  #    #
#  $ $. #
# @    .#
#   #   #
#########
`,
    caption: {
      keys: 'Lost? Press H for a hint: it outlines the next crate to push. If the level can never be solved, a red warning tells you to undo.',
      touch:
        'Lost? Tap Hint: it outlines the next crate to push. If the level can never be solved, a red warning tells you to undo.',
    },
  },
];

/** The lessons as playable level entries (never scored). */
export function tutorialEntries(): LevelEntry[] {
  return TUTORIAL_STEPS.map((s, i) => ({
    id: `tutorial-${i + 1}`,
    name: s.name,
    par: s.par,
    text: s.text,
  }));
}
