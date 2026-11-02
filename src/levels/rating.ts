/** Star rating for a finished level, based on pushes relative to the level's par. */
export type Stars = 1 | 2 | 3;

/**
 * 3 stars: within 10% of the minimum possible pushes. 2 stars: within 50%. Otherwise 1.
 * Finishing a level always earns at least one star.
 */
export function rating(pushes: number, par: number): Stars {
  if (pushes <= Math.floor(par * 1.1)) return 3;
  if (pushes <= Math.ceil(par * 1.5)) return 2;
  return 1;
}

/** "★★☆" style string for display. */
export function starString(stars: Stars): string {
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}
