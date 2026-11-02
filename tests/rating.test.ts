import { describe, expect, it } from 'vitest';
import { rating, starString } from '../src/levels/rating';

describe('rating', () => {
  it('gives 3 stars for par or within 10%', () => {
    expect(rating(10, 10)).toBe(3);
    expect(rating(11, 10)).toBe(3);
    expect(rating(12, 10)).toBe(2);
  });
  it('gives 2 stars up to 50% over par, then 1', () => {
    expect(rating(15, 10)).toBe(2);
    expect(rating(16, 10)).toBe(1);
    expect(rating(500, 10)).toBe(1);
  });
  it('is strict on tiny pars', () => {
    expect(rating(1, 1)).toBe(3);
    expect(rating(2, 1)).toBe(2);
    expect(rating(3, 1)).toBe(1);
  });
  it('renders stars', () => {
    expect(starString(3)).toBe('★★★');
    expect(starString(1)).toBe('★☆☆');
  });
});
