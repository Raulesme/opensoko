export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export const DIRECTION_DELTAS: Readonly<Record<Direction, Point>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** Immutable description of a level's static layout plus its starting positions. */
export interface Level {
  width: number;
  height: number;
  /** Row-major, length width * height. */
  walls: readonly boolean[];
  /** Row-major, length width * height. */
  goals: readonly boolean[];
  /** Starting box positions as row-major cell indices. */
  boxes: readonly number[];
  /** Starting player position as a row-major cell index. */
  player: number;
}
