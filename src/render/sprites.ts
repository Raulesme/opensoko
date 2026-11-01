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
  /** Idle player sprite per facing direction. */
  player: Readonly<Record<Direction, HTMLImageElement>>;
  /** Walk-cycle frames per direction. */
  walk: Readonly<Record<Direction, readonly HTMLImageElement[]>>;
  /** Push-cycle frames per direction; falls back to the walk cycle when absent. */
  push: Readonly<Record<Direction, readonly HTMLImageElement[]>>;
}

function load(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load sprite: ${url}`));
    img.src = url;
  });
}

const COMPASS_TO_DIRECTION: Readonly<Record<string, Direction>> = {
  north: 'up',
  south: 'down',
  west: 'left',
  east: 'right',
};

/** Every animation frame under assets/sprites/{walk,push}/<compass>/frame_NNN.png. */
const FRAME_URLS = import.meta.glob('../assets/sprites/{walk,push}/*/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

async function loadFrames(kind: 'walk' | 'push'): Promise<Record<Direction, HTMLImageElement[]>> {
  const found: Record<Direction, { n: number; url: string }[]> = {
    up: [],
    down: [],
    left: [],
    right: [],
  };
  for (const [path, url] of Object.entries(FRAME_URLS)) {
    const m = /\/(walk|push)\/(north|south|east|west)\/frame_(\d+)\.png$/.exec(path);
    if (!m || m[1] !== kind) continue;
    found[COMPASS_TO_DIRECTION[m[2]!]!].push({ n: Number(m[3]), url });
  }
  const out = { up: [], down: [], left: [], right: [] } as Record<Direction, HTMLImageElement[]>;
  for (const dir of Object.keys(found) as Direction[]) {
    found[dir].sort((a, b) => a.n - b.n);
    out[dir] = await Promise.all(found[dir].map((f) => load(f.url)));
  }
  return out;
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
  const [walk, push] = await Promise.all([loadFrames('walk'), loadFrames('push')]);
  return { floor, wall, goal, box, boxOnGoal, player: { up, down, left, right }, walk, push };
}
