import type { Direction } from '../game';

export type Action = { type: 'move'; dir: Direction } | { type: 'undo' } | { type: 'restart' };

const KEY_ACTIONS: Readonly<Record<string, Action>> = {
  ArrowUp: { type: 'move', dir: 'up' },
  ArrowDown: { type: 'move', dir: 'down' },
  ArrowLeft: { type: 'move', dir: 'left' },
  ArrowRight: { type: 'move', dir: 'right' },
  w: { type: 'move', dir: 'up' },
  s: { type: 'move', dir: 'down' },
  a: { type: 'move', dir: 'left' },
  d: { type: 'move', dir: 'right' },
  z: { type: 'undo' },
  Backspace: { type: 'undo' },
  r: { type: 'restart' },
};

/** Map a KeyboardEvent.key value to a game action (letters are case-insensitive). */
export function keyToAction(key: string): Action | null {
  return KEY_ACTIONS[key] ?? KEY_ACTIONS[key.toLowerCase()] ?? null;
}

/** Minimum swipe distance in CSS pixels before a touch counts as a move. */
export const SWIPE_THRESHOLD = 24;

/** Convert a touch displacement into a direction along the dominant axis, or null if too short. */
export function swipeToDirection(
  dx: number,
  dy: number,
  threshold: number = SWIPE_THRESHOLD,
): Direction | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
