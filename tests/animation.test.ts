import { describe, expect, it } from 'vitest';
import {
  cellXY,
  frameIndex,
  isFinished,
  lerp,
  makeMoveAnimation,
  progress,
  slidePosition,
} from '../src/render/animation';

describe('progress', () => {
  const anim = { start: 1000, duration: 100 };
  it('is 0 before, fractional during and 1 after the move', () => {
    expect(progress(anim, 900)).toBe(0);
    expect(progress(anim, 1050)).toBe(0.5);
    expect(progress(anim, 1200)).toBe(1);
  });
  it('treats a zero duration as finished', () => {
    expect(progress({ start: 0, duration: 0 }, 0)).toBe(1);
  });
  it('reports finished only at the end', () => {
    expect(isFinished(anim, 1099)).toBe(false);
    expect(isFinished(anim, 1100)).toBe(true);
  });
});

describe('frameIndex', () => {
  it('spreads frames evenly over 0..1 and never overruns', () => {
    expect([0, 0.24, 0.25, 0.5, 0.99, 1].map((t) => frameIndex(t, 4))).toEqual([0, 0, 1, 2, 3, 3]);
  });
  it('handles a single frame', () => {
    expect(frameIndex(0.7, 1)).toBe(0);
    expect(frameIndex(0.7, 0)).toBe(0);
  });
});

describe('slidePosition', () => {
  it('interpolates between cells in grid coordinates', () => {
    // 5-wide grid: index 6 is (1,1), index 7 is (2,1), index 12 is (2,2)
    expect(slidePosition(6, 7, 5, 0.5)).toEqual({ x: 1.5, y: 1 });
    expect(slidePosition(7, 12, 5, 1)).toEqual({ x: 2, y: 2 });
    expect(cellXY(12, 5)).toEqual({ x: 2, y: 2 });
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
});

describe('makeMoveAnimation', () => {
  it('describes a plain step', () => {
    const a = makeMoveAnimation({
      now: 5,
      dir: 'right',
      width: 5,
      playerFrom: 6,
      playerTo: 7,
      pushed: false,
    });
    expect(a).toMatchObject({ start: 5, dir: 'right', playerFrom: 6, playerTo: 7, box: null });
  });

  it('describes a push: the box moves one cell beyond the player', () => {
    const right = makeMoveAnimation({
      now: 0,
      dir: 'right',
      width: 5,
      playerFrom: 6,
      playerTo: 7,
      pushed: true,
    });
    expect(right.box).toEqual({ from: 7, to: 8 });
    const down = makeMoveAnimation({
      now: 0,
      dir: 'down',
      width: 5,
      playerFrom: 6,
      playerTo: 11,
      pushed: true,
    });
    expect(down.box).toEqual({ from: 11, to: 16 });
    const up = makeMoveAnimation({
      now: 0,
      dir: 'up',
      width: 5,
      playerFrom: 11,
      playerTo: 6,
      pushed: true,
    });
    expect(up.box).toEqual({ from: 6, to: 1 });
  });
});
