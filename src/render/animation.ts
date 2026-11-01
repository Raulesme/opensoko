import { DIRECTION_DELTAS } from '../game';
import type { Direction } from '../game';

/** How long one step (or push) takes to slide between cells, in milliseconds. */
export const MOVE_MS = 120;

/** An in-flight move: the player (and possibly a pushed box) sliding to a neighbouring cell. */
export interface MoveAnimation {
  /** `performance.now()`-style timestamp when the move began. */
  start: number;
  duration: number;
  dir: Direction;
  /** Row-major cell indices. */
  playerFrom: number;
  playerTo: number;
  /** The box being pushed, if any. */
  box: { from: number; to: number } | null;
}

/** Animation progress clamped to 0..1. */
export function progress(anim: Pick<MoveAnimation, 'start' | 'duration'>, now: number): number {
  if (anim.duration <= 0) return 1;
  return Math.min(1, Math.max(0, (now - anim.start) / anim.duration));
}

export function isFinished(anim: Pick<MoveAnimation, 'start' | 'duration'>, now: number): boolean {
  return progress(anim, now) >= 1;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Which of `frameCount` evenly spaced frames to show at progress `t` (0..1). */
export function frameIndex(t: number, frameCount: number): number {
  if (frameCount <= 1) return 0;
  return Math.min(frameCount - 1, Math.max(0, Math.floor(t * frameCount)));
}

/** Grid coordinates (in cells) of a row-major index. */
export function cellXY(index: number, width: number): { x: number; y: number } {
  return { x: index % width, y: Math.floor(index / width) };
}

/** Position in cells (fractional) of something sliding from one cell to another. */
export function slidePosition(
  from: number,
  to: number,
  width: number,
  t: number,
): { x: number; y: number } {
  const a = cellXY(from, width);
  const b = cellXY(to, width);
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

/**
 * Describe a move that just succeeded as an animation. `playerTo` is where the player ended up;
 * when `pushed`, the box that was there has moved one further cell in the same direction.
 */
export function makeMoveAnimation(args: {
  now: number;
  duration?: number;
  dir: Direction;
  width: number;
  playerFrom: number;
  playerTo: number;
  pushed: boolean;
}): MoveAnimation {
  const { now, dir, width, playerFrom, playerTo, pushed } = args;
  const d = DIRECTION_DELTAS[dir];
  return {
    start: now,
    duration: args.duration ?? MOVE_MS,
    dir,
    playerFrom,
    playerTo,
    box: pushed ? { from: playerTo, to: playerTo + d.y * width + d.x } : null,
  };
}
