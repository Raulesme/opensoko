import { DIRECTION_DELTAS } from '../../src/game';
import type { Direction, Level } from '../../src/game';

/** Breadth-first search for any solution. Returns a move list, or null if unsolvable. */
export function solve(level: Level, maxStates = 500_000): Direction[] | null {
  const { width, height } = level;
  const dirs = Object.keys(DIRECTION_DELTAS) as Direction[];
  const key = (player: number, boxes: number[]) => `${player}|${[...boxes].sort((a, b) => a - b)}`;
  const isWon = (boxes: number[]) => boxes.every((b) => level.goals[b]);

  const start = { player: level.player, boxes: [...level.boxes], path: [] as Direction[] };
  if (isWon(start.boxes)) return [];
  const seen = new Set([key(start.player, start.boxes)]);
  let frontier = [start];

  while (frontier.length > 0 && seen.size < maxStates) {
    const next: typeof frontier = [];
    for (const s of frontier) {
      for (const dir of dirs) {
        const d = DIRECTION_DELTAS[dir];
        const x = (s.player % width) + d.x;
        const y = Math.floor(s.player / width) + d.y;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const target = y * width + x;
        if (level.walls[target]) continue;

        let boxes = s.boxes;
        const boxIdx = boxes.indexOf(target);
        if (boxIdx !== -1) {
          const bx = x + d.x;
          const by = y + d.y;
          if (bx < 0 || by < 0 || bx >= width || by >= height) continue;
          const beyond = by * width + bx;
          if (level.walls[beyond] || boxes.includes(beyond)) continue;
          boxes = boxes.map((b, i) => (i === boxIdx ? beyond : b));
        }
        const k = key(target, boxes);
        if (seen.has(k)) continue;
        seen.add(k);
        const path = [...s.path, dir];
        if (isWon(boxes)) return path;
        next.push({ player: target, boxes, path });
      }
    }
    frontier = next;
  }
  return null;
}
