import type { Level } from './types';

export class LevelParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelParseError';
  }
}

/**
 * Parse the standard Sokoban text format:
 *   `#` wall, `@` player, `+` player on goal, `$` box, `*` box on goal,
 *   `.` goal, space / `-` / `_` floor.
 * Lines may be ragged; they are padded with floor. Blank lines at the start/end are ignored.
 */
export function parseLevel(text: string): Level {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length > 0 && lines[0]!.trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1]!.trim() === '') lines.pop();
  if (lines.length === 0) throw new LevelParseError('Level is empty');

  const height = lines.length;
  const width = Math.max(...lines.map((l) => l.length));
  const walls: boolean[] = new Array<boolean>(width * height).fill(false);
  const goals: boolean[] = new Array<boolean>(width * height).fill(false);
  const boxes: number[] = [];
  let player = -1;

  for (let y = 0; y < height; y++) {
    const line = lines[y]!;
    for (let x = 0; x < line.length; x++) {
      const i = y * width + x;
      switch (line[x]) {
        case '#':
          walls[i] = true;
          break;
        case '@':
        case '+':
          if (player !== -1) throw new LevelParseError('Level has more than one player');
          player = i;
          if (line[x] === '+') goals[i] = true;
          break;
        case '$':
          boxes.push(i);
          break;
        case '*':
          boxes.push(i);
          goals[i] = true;
          break;
        case '.':
          goals[i] = true;
          break;
        case ' ':
        case '-':
        case '_':
          break;
        default:
          throw new LevelParseError(`Unknown character '${line[x]}' at row ${y + 1}, col ${x + 1}`);
      }
    }
  }

  if (player === -1) throw new LevelParseError('Level has no player');
  if (boxes.length === 0) throw new LevelParseError('Level has no boxes');
  const goalCount = goals.filter(Boolean).length;
  if (goalCount !== boxes.length) {
    throw new LevelParseError(`Level has ${boxes.length} boxes but ${goalCount} goals`);
  }

  const level: Level = { width, height, walls, goals, boxes, player };
  if (!isEnclosed(level)) throw new LevelParseError('Level is not enclosed by walls');
  return level;
}

/** True if the player cannot walk off the edge of the grid (ignoring boxes). */
function isEnclosed(level: Level): boolean {
  const { width, height, walls } = level;
  const seen = new Set<number>([level.player]);
  const stack = [level.player];
  while (stack.length > 0) {
    const i = stack.pop()!;
    const x = i % width;
    const y = Math.floor(i / width);
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return false;
    for (const n of [i - 1, i + 1, i - width, i + width]) {
      if (!walls[n] && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return true;
}

/** Serialise a level back to the standard text format (inverse of parseLevel). */
export function levelToString(level: Level): string {
  const boxes = new Set(level.boxes);
  const rows: string[] = [];
  for (let y = 0; y < level.height; y++) {
    let row = '';
    for (let x = 0; x < level.width; x++) {
      const i = y * level.width + x;
      const goal = level.goals[i]!;
      if (level.walls[i]) row += '#';
      else if (i === level.player) row += goal ? '+' : '@';
      else if (boxes.has(i)) row += goal ? '*' : '$';
      else row += goal ? '.' : ' ';
    }
    rows.push(row.trimEnd());
  }
  return rows.join('\n');
}
