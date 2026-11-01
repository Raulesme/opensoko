import { DIRECTION_DELTAS } from './types';
import type { Direction, Level } from './types';

export interface MoveResult {
  /** The player changed position. */
  moved: boolean;
  /** A box was pushed by this move. */
  pushed: boolean;
}

interface HistoryEntry {
  /** Player position before the move. */
  player: number;
  /** Box that was pushed: its position before and after, or null for a plain step. */
  push: { from: number; to: number } | null;
}

/** Mutable game session for one level, with unlimited undo. */
export class Game {
  readonly level: Level;
  private player: number;
  private boxes: Set<number>;
  private history: HistoryEntry[] = [];
  private pushCount = 0;

  constructor(level: Level) {
    this.level = level;
    this.player = level.player;
    this.boxes = new Set(level.boxes);
  }

  get playerIndex(): number {
    return this.player;
  }

  get boxIndices(): readonly number[] {
    return [...this.boxes];
  }

  /** Number of successful moves (steps and pushes) made so far, minus undone ones. */
  get moves(): number {
    return this.history.length;
  }

  get pushes(): number {
    return this.pushCount;
  }

  get isWon(): boolean {
    for (const b of this.boxes) if (!this.level.goals[b]) return false;
    return true;
  }

  hasBoxAt(index: number): boolean {
    return this.boxes.has(index);
  }

  get canUndo(): boolean {
    return this.history.length > 0;
  }

  /** Try to move the player. Does nothing once the level is won. */
  move(dir: Direction): MoveResult {
    const none: MoveResult = { moved: false, pushed: false };
    if (this.isWon) return none;

    const target = this.neighbour(this.player, dir);
    if (target === null || this.level.walls[target]) return none;

    if (!this.boxes.has(target)) {
      this.history.push({ player: this.player, push: null });
      this.player = target;
      return { moved: true, pushed: false };
    }

    // Pushing: the cell behind the box must be free (no wall, no other box).
    const beyond = this.neighbour(target, dir);
    if (beyond === null || this.level.walls[beyond] || this.boxes.has(beyond)) return none;

    this.boxes.delete(target);
    this.boxes.add(beyond);
    this.history.push({ player: this.player, push: { from: target, to: beyond } });
    this.player = target;
    this.pushCount++;
    return { moved: true, pushed: true };
  }

  /** Revert the last move. Returns false if there is nothing to undo. */
  undo(): boolean {
    const entry = this.history.pop();
    if (!entry) return false;
    this.player = entry.player;
    if (entry.push) {
      this.boxes.delete(entry.push.to);
      this.boxes.add(entry.push.from);
      this.pushCount--;
    }
    return true;
  }

  /** Reset to the starting position and clear history and counters. */
  restart(): void {
    this.player = this.level.player;
    this.boxes = new Set(this.level.boxes);
    this.history = [];
    this.pushCount = 0;
  }

  /** Neighbouring cell index, or null if it would leave the grid. */
  private neighbour(index: number, dir: Direction): number | null {
    const { width, height } = this.level;
    const d = DIRECTION_DELTAS[dir];
    const x = (index % width) + d.x;
    const y = Math.floor(index / width) + d.y;
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    return y * width + x;
  }
}
