import { describe, expect, it } from 'vitest';
import { levelToString, parseLevel } from '../src/game';

const SIMPLE = `
#####
#@$.#
#####
`;

describe('parseLevel', () => {
  it('parses walls, player, boxes and goals', () => {
    const level = parseLevel(SIMPLE);
    expect(level.width).toBe(5);
    expect(level.height).toBe(3);
    expect(level.player).toBe(1 * 5 + 1);
    expect(level.boxes).toEqual([1 * 5 + 2]);
    expect(level.goals[1 * 5 + 3]).toBe(true);
    expect(level.walls[0]).toBe(true);
  });

  it('handles player-on-goal and box-on-goal', () => {
    const level = parseLevel('######\n#+*$ #\n######');
    expect(level.player).toBe(7);
    expect(level.goals[7]).toBe(true);
    expect(level.goals[8]).toBe(true);
    expect(level.boxes).toEqual([8, 9]);
  });

  it('accepts CRLF line endings and ragged rows', () => {
    const level = parseLevel('####\r\n#@$.#\r\n####');
    expect(level.width).toBe(5);
  });

  it('round-trips through levelToString', () => {
    const text = '#####\n#@$.#\n#####';
    expect(levelToString(parseLevel(text))).toBe(text);
  });

  it('rejects empty input', () => {
    expect(() => parseLevel('  \n ')).toThrow(/empty/);
  });

  it('rejects unknown characters', () => {
    expect(() => parseLevel('#####\n#@x.#\n#####')).toThrow(/Unknown character/);
  });

  it('rejects missing or duplicate players', () => {
    expect(() => parseLevel('####\n#$.#\n####')).toThrow(/no player/);
    expect(() => parseLevel('#####\n#@@$.#\n#####')).toThrow(/more than one player/);
  });

  it('rejects box/goal count mismatch and no boxes', () => {
    expect(() => parseLevel('######\n#@$$.#\n######')).toThrow(/2 boxes but 1 goals/);
    expect(() => parseLevel('####\n#@.#\n####')).toThrow(/no boxes/);
  });

  it('rejects levels that are not enclosed', () => {
    expect(() => parseLevel('#####\n @$. \n#####')).toThrow(/not enclosed/);
  });
});
