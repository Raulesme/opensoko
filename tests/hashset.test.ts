import { describe, expect, it } from 'vitest';
import { HashSet64 } from '../src/generator/hashset';

describe('HashSet64', () => {
  it('adds, detects duplicates and counts', () => {
    const s = new HashSet64();
    expect(s.add(1, 2)).toBe(true);
    expect(s.add(1, 2)).toBe(false);
    expect(s.add(2, 1)).toBe(true); // halves are not interchangeable
    expect(s.size).toBe(2);
    expect(s.has(1, 2)).toBe(true);
    expect(s.has(3, 3)).toBe(false);
  });

  it('handles the zero key and negative halves', () => {
    const s = new HashSet64();
    expect(s.add(0, 0)).toBe(true);
    expect(s.add(0, 0)).toBe(false);
    expect(s.add(-1, -2147483648)).toBe(true);
    expect(s.has(-1, -2147483648)).toBe(true);
    expect(s.has(0xffffffff, 0x80000000)).toBe(true); // same bits as above
  });

  it('keeps every key through repeated growth', () => {
    const s = new HashSet64(16);
    const n = 50_000;
    for (let i = 0; i < n; i++) expect(s.add(i * 7919, (i * 104729) ^ 0x5bd1e995)).toBe(true);
    expect(s.size).toBe(n);
    for (let i = 0; i < n; i += 97) expect(s.has(i * 7919, (i * 104729) ^ 0x5bd1e995)).toBe(true);
    expect(s.has(-5, -5)).toBe(false);
  });
});
