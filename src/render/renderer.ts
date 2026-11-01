import { reachableFloor } from '../game';
import type { Direction, Game } from '../game';
import { TILE } from './sprites';
import type { SpriteAtlas } from './sprites';

/** Draws a Game onto a canvas at native pixel size, then scales it by an integer factor via CSS. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private floor: boolean[] = [];
  private game: Game | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly atlas: SpriteAtlas,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  setGame(game: Game): void {
    this.game = game;
    this.floor = reachableFloor(game.level);
    this.canvas.width = game.level.width * TILE;
    this.canvas.height = game.level.height * TILE;
    this.ctx.imageSmoothingEnabled = false;
    this.fit();
    this.draw();
  }

  /**
   * Pick the largest scale that fits, in half-pixel steps (1, 1.5, 2, ...). Half steps keep pixels
   * crisp enough while using far more of the screen than whole numbers alone.
   */
  fit(): void {
    if (!this.game) return;
    const parent = this.canvas.parentElement;
    const availW = parent?.clientWidth ?? window.innerWidth;
    const availH = parent?.clientHeight ?? window.innerHeight;
    const fit = Math.min(availW / this.canvas.width, availH / this.canvas.height);
    const scale = Math.max(1, Math.floor(fit * 2) / 2);
    this.canvas.style.width = `${Math.round(this.canvas.width * scale)}px`;
    this.canvas.style.height = `${Math.round(this.canvas.height * scale)}px`;
  }

  draw(facing: Direction = 'down'): void {
    const game = this.game;
    if (!game) return;
    const { level } = game;
    const { ctx, atlas } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < level.width * level.height; i++) {
      const px = (i % level.width) * TILE;
      const py = Math.floor(i / level.width) * TILE;
      if (level.walls[i]) {
        ctx.drawImage(atlas.wall, px, py);
        continue;
      }
      if (!this.floor[i]) continue; // void outside the walls
      ctx.drawImage(level.goals[i] ? atlas.goal : atlas.floor, px, py);
      if (game.hasBoxAt(i)) ctx.drawImage(level.goals[i] ? atlas.boxOnGoal : atlas.box, px, py);
    }

    const p = game.playerIndex;
    const sprite = atlas.player[facing];
    // The player sprite's canvas is larger than a tile; centre it on the cell.
    const inset = (TILE - sprite.width) / 2;
    ctx.drawImage(
      sprite,
      (p % level.width) * TILE + inset,
      Math.floor(p / level.width) * TILE + inset,
    );
  }
}
