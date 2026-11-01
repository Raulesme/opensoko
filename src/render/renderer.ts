import { reachableFloor } from '../game';
import type { Game } from '../game';
import { buildAtlas, TILE } from './sprites';
import type { SpriteAtlas } from './sprites';

/** Draws a Game onto a canvas at native pixel size, then scales it by an integer factor via CSS. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly atlas: SpriteAtlas = buildAtlas();
  private floor: boolean[] = [];
  private game: Game | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
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

  /** Pick the largest integer scale that fits the available space and apply it. */
  fit(): void {
    if (!this.game) return;
    const parent = this.canvas.parentElement;
    const availW = parent?.clientWidth ?? window.innerWidth;
    const availH = parent?.clientHeight ?? window.innerHeight;
    const scale = Math.max(
      1,
      Math.floor(Math.min(availW / this.canvas.width, availH / this.canvas.height)),
    );
    this.canvas.style.width = `${this.canvas.width * scale}px`;
    this.canvas.style.height = `${this.canvas.height * scale}px`;
  }

  draw(): void {
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
      ctx.drawImage(atlas.floor, px, py);
      if (level.goals[i]) ctx.drawImage(atlas.goal, px, py);
      if (game.hasBoxAt(i)) ctx.drawImage(level.goals[i] ? atlas.boxOnGoal : atlas.box, px, py);
    }

    const p = game.playerIndex;
    ctx.drawImage(atlas.player, (p % level.width) * TILE, Math.floor(p / level.width) * TILE);
  }
}
