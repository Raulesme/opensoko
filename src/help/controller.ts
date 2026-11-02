import type { Direction, Game } from '../game';
import type { SolveClient } from './client';
import { createDeadSquareCheck, HintPlan, levelFromGame, nextPush } from './plan';
import type { NextPush } from './plan';

/** State-search budget for the background "stuck?" check after each move (kept modest). */
export const CHECK_BUDGET = 150_000;
/** Budget when the player explicitly asks for a hint or the solution. */
export const HINT_BUDGET = 1_500_000;
/** Wait this long after the last move before running the background check. */
export const CHECK_DELAY_MS = 500;
/** Pause between moves while the solution plays itself. */
export const AUTOPLAY_DELAY_MS = 170;

export interface HelpDeps {
  client: Pick<SolveClient, 'solve' | 'cancel'>;
  /** Make a move on the real game (used by the solution autoplay). */
  applyMove: (dir: Direction) => void;
  /** Called whenever anything the UI shows has changed. */
  changed: () => void;
  schedule?: (fn: () => void, ms: number) => unknown;
  unschedule?: (handle: unknown) => void;
}

/**
 * Helps a stuck player: shows the next push, warns when the position cannot be solved, and can
 * play the solution. The solver runs elsewhere (a Web Worker); every asynchronous answer is checked
 * against a version number so an answer for an old position is never shown.
 */
export class Help {
  private game: Game | null = null;
  private deadCheck: ((game: Game) => boolean) | null = null;
  private plan: HintPlan | null = null;
  private version = 0;
  private checkTimer: unknown = null;
  private autoTimer: unknown = null;
  private readonly schedule: (fn: () => void, ms: number) => unknown;
  private readonly unschedule: (handle: unknown) => void;

  /** The push to highlight, if a hint is showing. */
  hint: NextPush | null = null;
  /** True when the current position provably cannot be solved. */
  stuck = false;
  /** A short message about what the helper is doing or found; empty when idle. */
  status = '';
  /** True once the solution has been played for the player: the result should not be scored. */
  assisted = false;
  /** True while the solution is playing itself. */
  autoplaying = false;

  constructor(private readonly deps: HelpDeps) {
    this.schedule = deps.schedule ?? ((fn, ms) => setTimeout(fn, ms));
    this.unschedule = deps.unschedule ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  }

  /** Start fresh for a newly loaded level. */
  setGame(game: Game | null): void {
    this.cancelAll();
    this.game = game;
    this.deadCheck = game ? createDeadSquareCheck(game.level) : null;
    this.plan = null;
    this.hint = null;
    this.stuck = false;
    this.status = '';
    this.assisted = false;
    this.version++;
    this.deps.changed();
  }

  /** The player made a move that changed the position. */
  onMove(dir: Direction): void {
    this.version++;
    this.hint = null;
    this.status = '';
    if (this.plan && (!this.plan.follow(dir) || this.plan.isEmpty)) this.plan = null;
    this.afterChange();
  }

  /** The player undid a move or restarted: any plan no longer applies. */
  onReset(): void {
    this.version++;
    this.plan = null;
    this.hint = null;
    this.status = '';
    this.afterChange();
  }

  /** Stop the solution playing itself (any manual input should do this). */
  stopAutoplay(): void {
    if (this.autoTimer !== null) this.unschedule(this.autoTimer);
    this.autoTimer = null;
    if (this.autoplaying) {
      this.autoplaying = false;
      this.deps.changed();
    }
  }

  /** Show the next push of a solution, computing one first if needed. */
  async requestHint(): Promise<void> {
    const game = this.game;
    if (!game || game.isWon) return;
    this.stopAutoplay();
    if (!(await this.ensurePlan(HINT_BUDGET))) return;
    if (this.game !== game) return;
    this.hint = nextPush(game, this.plan!.remaining);
    this.status = this.hint ? '' : 'Nothing left to push.';
    this.deps.changed();
  }

  /** Play the solution from here. The result will not be scored. */
  async startSolution(): Promise<void> {
    const game = this.game;
    if (!game || game.isWon) return;
    this.stopAutoplay();
    if (!(await this.ensurePlan(HINT_BUDGET))) return;
    if (this.game !== game) return;
    this.assisted = true;
    this.autoplaying = true;
    this.hint = null;
    this.status = 'Playing the solution… press any key or tap to stop.';
    this.deps.changed();
    this.stepAutoplay();
  }

  // -- internals ------------------------------------------------------------------------------

  private cancelAll(): void {
    this.stopAutoplay();
    if (this.checkTimer !== null) this.unschedule(this.checkTimer);
    this.checkTimer = null;
    this.deps.client.cancel();
  }

  private stepAutoplay(): void {
    const game = this.game;
    if (!this.autoplaying || !game) return;
    const next = this.plan?.remaining[0];
    if (game.isWon || next === undefined) {
      this.autoplaying = false;
      this.status = '';
      this.deps.changed();
      return;
    }
    const movesBefore = game.moves;
    this.deps.applyMove(next); // calls back into onMove, which advances the plan
    if (!this.autoplaying) return; // a manual input may have interrupted
    if (game.moves === movesBefore) {
      // The move did nothing, so the plan is out of step with the game: stop rather than loop.
      this.autoplaying = false;
      this.plan = null;
      this.status = '';
      this.deps.changed();
      return;
    }
    this.autoTimer = this.schedule(() => {
      this.autoTimer = null;
      this.stepAutoplay();
    }, AUTOPLAY_DELAY_MS);
  }

  /** Make sure a plan exists for the current position; false if none could be found. */
  private async ensurePlan(budget: number): Promise<boolean> {
    const game = this.game!;
    if (this.plan && !this.plan.isEmpty) return true;
    if (this.stuck) {
      this.status = 'This position cannot be solved. Undo (Z) or restart (R).';
      this.deps.changed();
      return false;
    }
    if (this.checkTimer !== null) this.unschedule(this.checkTimer);
    this.checkTimer = null;
    const version = this.version;
    this.status = 'Thinking…';
    this.deps.changed();
    const response = await this.deps.client.solve(levelFromGame(game), budget);
    if (version !== this.version || this.game !== game) return false; // position changed meanwhile
    if (response.status === 'solved') {
      this.plan = new HintPlan(response.moves);
      this.stuck = false;
      this.status = '';
      return !this.plan.isEmpty;
    }
    if (response.status === 'unsolvable') {
      this.stuck = true;
      this.status = 'This position cannot be solved. Undo (Z) or restart (R).';
    } else if (response.status === 'budget') {
      this.status = 'This position is too complex to solve from here.';
    } else {
      this.status = '';
    }
    this.deps.changed();
    return false;
  }

  /** After the position changed: instant dead-square check, then a debounced solver check. */
  private afterChange(): void {
    const game = this.game;
    if (!game) return;
    this.stuck = game.isWon ? false : this.deadCheck!(game);
    if (this.stuck) this.status = 'This position cannot be solved. Undo (Z) or restart (R).';
    this.deps.changed();
    if (this.checkTimer !== null) this.unschedule(this.checkTimer);
    this.checkTimer = null;
    if (game.isWon || this.stuck || this.autoplaying) return;
    const version = this.version;
    this.checkTimer = this.schedule(() => {
      this.checkTimer = null;
      void this.backgroundCheck(version);
    }, CHECK_DELAY_MS);
  }

  private async backgroundCheck(version: number): Promise<void> {
    const game = this.game;
    if (!game || version !== this.version) return;
    const response = await this.deps.client.solve(levelFromGame(game), CHECK_BUDGET);
    if (version !== this.version || this.game !== game) return;
    if (response.status === 'solved') {
      if (!this.plan) this.plan = new HintPlan(response.moves); // a later hint is then instant
    } else if (response.status === 'unsolvable') {
      this.stuck = true;
      this.status = 'This position cannot be solved. Undo (Z) or restart (R).';
      this.deps.changed();
    }
  }
}
