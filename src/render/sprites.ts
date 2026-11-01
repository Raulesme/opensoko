import floorUrl from '../assets/sprites/floor.png';
import wallUrl from '../assets/sprites/wall.png';
import goalUrl from '../assets/sprites/goal.png';
import crateUrl from '../assets/sprites/crate.png';
import crateDoneUrl from '../assets/sprites/crate-done.png';
import playerNorthUrl from '../assets/sprites/player-north.png';
import playerSouthUrl from '../assets/sprites/player-south.png';
import playerEastUrl from '../assets/sprites/player-east.png';
import playerWestUrl from '../assets/sprites/player-west.png';
import type { Direction } from '../game';

/** Edge length of one board cell in native pixels. Sprites are 32x32 (the player is 36x36). */
export const TILE = 32;

export interface SpriteAtlas {
  floor: HTMLImageElement;
  wall: HTMLImageElement;
  /** Floor tile with the goal marker; drawn instead of `floor` on goal cells. */
  goal: HTMLImageElement;
  box: HTMLImageElement;
  boxOnGoal: HTMLImageElement;
  player: Readonly<Record<Direction, HTMLImageElement>>;
}

function load(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load sprite: ${url}`));
    img.src = url;
  });
}

/** Load every sprite once. Resolves when all images are decoded and ready to draw. */
export async function loadAtlas(): Promise<SpriteAtlas> {
  const [floor, wall, goal, box, boxOnGoal, up, down, left, right] = await Promise.all([
    load(floorUrl),
    load(wallUrl),
    load(goalUrl),
    load(crateUrl),
    load(crateDoneUrl),
    load(playerNorthUrl),
    load(playerSouthUrl),
    load(playerWestUrl),
    load(playerEastUrl),
  ]);
  return { floor, wall, goal, box, boxOnGoal, player: { up, down, left, right } };
}
