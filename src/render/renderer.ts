import { reachableFloor } from '../game';
import type { Direction, Game } from '../game';
import { cellXY, frameIndex, progress, slidePosition } from './animation';
import type { MoveAnimation } from './animation';
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

  /** Draw the board. While `anim` is set the player (and any pushed box) slide between cells. */
  draw(facing: Direction = 'down', anim: MoveAnimation | null = null, now = 0): void {
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
      // A pushed box is drawn separately while it slides.
      if (game.hasBoxAt(i) && !(anim?.box && anim.box.to === i)) {
        ctx.drawImage(level.goals[i] ? atlas.boxOnGoal : atlas.box, px, py);
      }
    }

    const t = anim ? progress(anim, now) : 1;
    if (anim?.box) {
      const b = slidePosition(anim.box.from, anim.box.to, level.width, t);
      ctx.drawImage(atlas.box, Math.round(b.x * TILE), Math.round(b.y * TILE));
    }

    let sprite = atlas.player[facing];
    let pos = cellXY(game.playerIndex, level.width);
    if (anim) {
      pos = slidePosition(anim.playerFrom, anim.playerTo, level.width, t);
      const cycle = anim.box && atlas.push[anim.dir].length > 0 ? atlas.push : atlas.walk;
      const frames = cycle[anim.dir];
      if (frames.length > 0) sprite = frames[frameIndex(t, frames.length)]!;
    }
    // Sprite canvases can be larger than a tile (and differ per frame); centre them on the cell.
    const inset = (TILE - sprite.width) / 2;
    const insetY = (TILE - sprite.height) / 2;
    ctx.drawImage(sprite, Math.round(pos.x * TILE + inset), Math.round(pos.y * TILE + insetY));
  }
}
