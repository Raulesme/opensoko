/** Sound effects described as data: short synthesised tones, no audio files. */

export type SoundName = 'step' | 'bump' | 'push' | 'goal' | 'win' | 'undo' | 'restart';

export interface Tone {
  wave: 'square' | 'triangle' | 'sine' | 'sawtooth' | 'noise';
  /** Start and end frequency in Hz (a sweep); ignored for noise. */
  from: number;
  to: number;
  /** Seconds after the sound begins. */
  start: number;
  /** Length in seconds. */
  duration: number;
  /** Peak gain, 0..1. */
  gain: number;
}

const tone = (
  wave: Tone['wave'],
  from: number,
  to: number,
  start: number,
  duration: number,
  gain: number,
): Tone => ({ wave, from, to, start, duration, gain });

// Musical notes (Hz) for the jingles.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

export const SOUNDS: Readonly<Record<SoundName, readonly Tone[]>> = {
  /** A quiet tick for a plain step. */
  step: [tone('triangle', 220, 160, 0, 0.05, 0.12)],
  /** Walking into a wall or a stuck crate. */
  bump: [tone('square', 110, 80, 0, 0.07, 0.12), tone('noise', 0, 0, 0, 0.04, 0.08)],
  /** Scraping a crate along the floor. */
  push: [tone('sawtooth', 90, 60, 0, 0.1, 0.16), tone('noise', 0, 0, 0, 0.09, 0.1)],
  /** A crate lands on a goal: a bright two-note ding. */
  goal: [tone('square', C5, C5, 0, 0.09, 0.14), tone('square', G5, G5, 0.08, 0.16, 0.14)],
  /** Level complete: a rising arpeggio. */
  win: [
    tone('square', C5, C5, 0, 0.12, 0.14),
    tone('square', E5, E5, 0.11, 0.12, 0.14),
    tone('square', G5, G5, 0.22, 0.12, 0.14),
    tone('square', C6, C6, 0.33, 0.35, 0.16),
    tone('triangle', C5, C5, 0.33, 0.35, 0.12),
  ],
  /** A short falling blip. */
  undo: [tone('triangle', 420, 240, 0, 0.09, 0.14)],
  /** A longer falling sweep. */
  restart: [tone('triangle', 520, 130, 0, 0.22, 0.14)],
};

/** Total length of a sound in seconds. */
export function soundDuration(tones: readonly Tone[]): number {
  return Math.max(0, ...tones.map((t) => t.start + t.duration));
}
