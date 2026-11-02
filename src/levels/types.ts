export interface LevelEntry {
  /** Stable identifier used as the save-data key. Never change an id once released. */
  id: string;
  name: string;
  /** Fewest box pushes needed to solve the level (found by the solver). Used for star ratings. */
  par: number;
  text: string;
}
