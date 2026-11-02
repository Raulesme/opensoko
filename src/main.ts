import './style.css';
import { browserAudioContext, Sfx } from './audio/sfx';
import { DIRECTION_DELTAS, Game, parseLevel } from './game';
import type { Direction } from './game';
import { attachInput } from './input/attach';
import type { Action } from './input/actions';
import { PACKS } from './levels/packs';
import { rating, starString } from './levels/rating';
import type { LevelEntry } from './levels/types';
import { isFinished, makeMoveAnimation, MOVE_MS } from './render/animation';
import type { MoveAnimation } from './render/animation';
import { Renderer } from './render/renderer';
import { loadAtlas } from './render/sprites';
import { loadSettings, saveSettings } from './storage/settings';
import {
  browserStorage,
  loadProgress,
  recordCompletion,
  saveProgress,
  setLastLevel,
} from './storage/progress';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const storage = browserStorage();
let progress = loadProgress(storage);
const settings = loadSettings(storage);
const sfx = new Sfx(browserAudioContext, settings.muted);

function renderMuteButton(): void {
  $('mute').textContent = `Sound: ${sfx.muted ? 'off' : 'on'} (M)`;
}

function toggleMute(): void {
  sfx.setMuted(!sfx.muted);
  settings.muted = sfx.muted;
  saveSettings(storage, settings);
  renderMuteButton();
  sfx.play('step'); // audible confirmation when turning sound back on
}

const canvas = $<HTMLCanvasElement>('game');
const renderer = new Renderer(canvas, await loadAtlas());

/** A run of levels being played: a pack from the menu (ranked) or a one-off puzzle. */
interface Session {
  levels: readonly LevelEntry[];
  index: number;
  /** Ranked sessions save best scores to progress; others (random puzzles) do not. */
  ranked: boolean;
}

let view: 'menu' | 'play' = 'menu';
let session: Session | null = null;
let game: Game | null = null;
let facing: Direction = 'down';
let anim: MoveAnimation | null = null;
let rafId = 0;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Redraw every frame while a move is sliding; stop (and show the win overlay) when it ends. */
function tick(now: number): void {
  rafId = 0;
  if (!anim) return;
  if (isFinished(anim, now)) {
    anim = null;
    refresh();
    return;
  }
  renderer.draw(facing, anim, now);
  rafId = requestAnimationFrame(tick);
}

function stopAnimation(): void {
  anim = null;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

function currentEntry(): LevelEntry {
  return session!.levels[session!.index]!;
}

function showMenu(): void {
  stopAnimation();
  view = 'menu';
  $('play').hidden = true;
  $('select').hidden = false;

  const container = $('packs');
  container.replaceChildren();
  let focus: HTMLElement | null = null;

  for (const pack of PACKS) {
    const done = pack.levels.filter((l) => progress.levels[l.id]).length;
    const section = document.createElement('section');
    section.className = 'pack';
    const header = document.createElement('div');
    header.className = 'pack-header';
    header.append(
      Object.assign(document.createElement('h2'), { textContent: pack.name }),
      Object.assign(document.createElement('span'), {
        className: 'desc',
        textContent: pack.description,
      }),
      Object.assign(document.createElement('span'), {
        className: 'count',
        textContent: `${done}/${pack.levels.length} done`,
      }),
    );
    const list = document.createElement('ol');
    list.className = 'level-list';

    pack.levels.forEach((entry, index) => {
      const record = progress.levels[entry.id];
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      if (record) button.classList.add('done');
      const label = (className: string, text: string) =>
        Object.assign(document.createElement('span'), { className, textContent: text });
      button.append(label('num', `${record ? '✓ ' : ''}${index + 1}`), label('name', entry.name));
      if (record) {
        button.append(
          label('stars', starString(rating(record.bestPushes, entry.par))),
          label('best', `${record.bestMoves} moves / ${record.bestPushes} pushes`),
        );
      }
      button.addEventListener('click', () => startSession(pack.levels, index, true));
      li.append(button);
      list.append(li);
      if (entry.id === progress.lastLevel) focus = button;
    });
    section.append(header, list);
    container.append(section);
  }
  (focus ?? container.querySelector<HTMLElement>('button'))?.focus();
}

function startSession(levels: readonly LevelEntry[], index: number, ranked: boolean): void {
  session = { levels, index, ranked };
  loadCurrent();
}

function loadCurrent(): void {
  stopAnimation();
  const entry = currentEntry();
  game = new Game(parseLevel(entry.text));
  facing = 'down';
  if (session!.ranked) {
    progress = setLastLevel(progress, entry.id);
    saveProgress(storage, progress);
  }

  view = 'play';
  $('select').hidden = true;
  $('play').hidden = false;
  renderer.setGame(game); // after un-hiding so the canvas can measure its container
  refresh();
}

function refresh(): void {
  if (!game || !session) return;
  renderer.draw(facing, anim, performance.now());
  const entry = currentEntry();
  $('level').textContent = `${entry.name} (${session.index + 1}/${session.levels.length})`;
  $('moves').textContent = `Moves: ${game.moves}`;
  $('pushes').textContent = `Pushes: ${game.pushes}`;
  $('par').textContent = `Par: ${entry.par}`;
  // Hold the win overlay back until the last move has finished sliding.
  $('win').hidden = !game.isWon || anim !== null;
  $('next').textContent = session.index + 1 < session.levels.length ? 'Next level' : 'Back to menu';
}

function onWin(g: Game): void {
  const entry = currentEntry();
  const flag = (isNew: boolean) => (isNew ? ' (new best!)' : '');
  const stars = rating(g.pushes, entry.par);
  $('win-stars').textContent = starString(stars);

  let line = `Moves: ${g.moves} · Pushes: ${g.pushes} (par ${entry.par})`;
  if (session!.ranked) {
    const result = recordCompletion(progress, entry.id, g.moves, g.pushes);
    progress = result.progress;
    saveProgress(storage, progress);
    const best = progress.levels[entry.id]!;
    line =
      `Moves: ${g.moves}${flag(result.newBestMoves)} · ` +
      `Pushes: ${g.pushes}${flag(result.newBestPushes)} (par ${entry.par})` +
      ` — Best: ${best.bestMoves}/${best.bestPushes}`;
  }
  $('win-stats').textContent = line;
}

function nextLevel(): void {
  if (!session) return;
  if (session.index + 1 < session.levels.length) {
    session.index++;
    loadCurrent();
  } else showMenu();
}

function handle(action: Action): void {
  if (action.type === 'mute') return toggleMute();
  if (view !== 'play' || !game) return;
  if (action.type === 'menu') return showMenu();
  stopAnimation(); // a new input snaps any slide in progress to its end
  const wasWon = game.isWon;
  if (action.type === 'move') {
    facing = action.dir; // turn to face the move even when blocked
    const playerFrom = game.playerIndex;
    const result = game.move(action.dir);
    if (!result.moved) sfx.play('bump');
    else if (!result.pushed) sfx.play('step');
    else {
      const d = DIRECTION_DELTAS[action.dir];
      const boxTo = game.playerIndex + d.y * game.level.width + d.x;
      sfx.play(game.level.goals[boxTo] ? 'goal' : 'push');
    }
    if (result.moved && !reducedMotion.matches) {
      anim = makeMoveAnimation({
        now: performance.now(),
        duration: MOVE_MS,
        dir: action.dir,
        width: game.level.width,
        playerFrom,
        playerTo: game.playerIndex,
        pushed: result.pushed,
      });
      rafId = requestAnimationFrame(tick);
    }
  } else if (action.type === 'undo') {
    if (game.undo()) sfx.play('undo');
  } else {
    game.restart();
    sfx.play('restart');
  }
  if (!wasWon && game.isWon) {
    onWin(game);
    sfx.play('win');
  }
  refresh();
}

attachInput($('stage'), handle);
$('mute').addEventListener('click', toggleMute);
renderMuteButton();
$('menu').addEventListener('click', () => handle({ type: 'menu' }));
$('undo').addEventListener('click', () => handle({ type: 'undo' }));
$('restart').addEventListener('click', () => handle({ type: 'restart' }));
$('replay').addEventListener('click', () => handle({ type: 'restart' }));
$('next').addEventListener('click', nextLevel);
window.addEventListener('keydown', (e) => {
  // A focused button already handles Enter itself via its click handler.
  if (
    e.key === 'Enter' &&
    view === 'play' &&
    game?.isWon &&
    !(e.target instanceof HTMLButtonElement)
  ) {
    nextLevel();
  }
});
window.addEventListener('resize', () => renderer.fit());

showMenu();
