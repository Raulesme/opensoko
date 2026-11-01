import { describe, expect, it } from 'vitest';
import { keyToAction, swipeToDirection } from '../src/input/actions';

describe('keyToAction', () => {
  it('maps arrows and WASD to moves', () => {
    expect(keyToAction('ArrowUp')).toEqual({ type: 'move', dir: 'up' });
    expect(keyToAction('a')).toEqual({ type: 'move', dir: 'left' });
    expect(keyToAction('D')).toEqual({ type: 'move', dir: 'right' });
  });

  it('maps undo and restart keys', () => {
    expect(keyToAction('z')).toEqual({ type: 'undo' });
    expect(keyToAction('Z')).toEqual({ type: 'undo' });
    expect(keyToAction('Backspace')).toEqual({ type: 'undo' });
    expect(keyToAction('r')).toEqual({ type: 'restart' });
    expect(keyToAction('Escape')).toEqual({ type: 'menu' });
  });

  it('ignores unknown keys', () => {
    expect(keyToAction('x')).toBeNull();
    expect(keyToAction('Enter')).toBeNull();
  });
});

describe('swipeToDirection', () => {
  it('uses the dominant axis', () => {
    expect(swipeToDirection(60, 10)).toBe('right');
    expect(swipeToDirection(-60, 10)).toBe('left');
    expect(swipeToDirection(5, 60)).toBe('down');
    expect(swipeToDirection(5, -60)).toBe('up');
  });

  it('ignores short swipes (taps)', () => {
    expect(swipeToDirection(5, 5)).toBeNull();
    expect(swipeToDirection(0, 0)).toBeNull();
  });
});
