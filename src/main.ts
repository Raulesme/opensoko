import './style.css';
import { browserAudioContext, Sfx } from './audio/sfx';
import { DIRECTION_DELTAS, Game, parseLevel } from './game';
import type { Direction } from './game';
import { attachInput } from './input/attach';
import type { Action } from './input/actions';
import { BUILTIN_LEVELS } from './levels/builtin';
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

let view: 'menu' | 'play' = 'menu';
let levelIndex = 0;
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

function persist(): void {
  saveProgress(storage, progress);
}

function showMenu(): void {
  stopAnimation();
  view = 'menu';
  $('play').hidden = true;
  $('select').hidden = false;

  const list = $('level-list');
  list.replaceChildren();
  BUILTIN_LEVELS.forEach((entry, index) => {
    const record = progress.levels[entry.id];
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    if (record) button.classList.add('done');
    const num = Object.assign(document.createElement('span'), {
      className: 'num',
      textContent: `${record ? '✓ ' : ''}${index + 1}`,
    });
    const name = Object.assign(document.createElement('span'), {
      className: 'name',
      textContent: entry.name,
    });
    button.append(num, name);
    if (record) {
      button.append(
        Object.assign(document.createElement('span'), {
          className: 'best',
          textContent: `Best: ${record.bestMoves} moves / ${record.bestPushes} pushes`,
        }),
      );
    }
    button.addEventListener('click', () => startLevel(index));
    li.append(button);
    list.append(li);
  });

  const last = BUILTIN_LEVELS.findIndex((l) => l.id === progress.lastLevel);
  (list.querySelectorAll('button')[last >= 0 ? last : 0] as HTMLElement | undefined)?.focus();
}

function startLevel(index: number): void {
  stopAnimation();
  levelIndex = index;
  const entry = BUILTIN_LEVELS[index]!;
  game = new Game(parseLevel(entry.text));
  facing = 'down';
  progress = setLastLevel(progress, entry.id);
  persist();

  view = 'play';
  $('select').hidden = true;
  $('play').hidden = false;
  renderer.setGame(game); // after un-hiding so the canvas can measure its container
  refresh();
}

function refresh(): void {
  if (!game) return;
  renderer.draw(facing, anim, performance.now());
  $('level').textContent = `Level ${levelIndex + 1}/${BUILTIN_LEVELS.length}`;
  $('moves').textContent = `Moves: ${game.moves}`;
  $('pushes').textContent = `Pushes: ${game.pushes}`;
  // Hold the win overlay back until the last move has finished sliding.
  $('win').hidden = !game.isWon || anim !== null;
  $('next').textContent = levelIndex + 1 < BUILTIN_LEVELS.length ? 'Next level' : 'Back to menu';
}

function onWin(g: Game): void {
  const entry = BUILTIN_LEVELS[levelIndex]!;
  const result = recordCompletion(progress, entry.id, g.moves, g.pushes);
  progress = result.progress;
  persist();
  const best = progress.levels[entry.id]!;
  const flag = (isNew: boolean) => (isNew ? ' (new best!)' : '');
  $('win-stats').textContent =
    `Moves: ${g.moves}${flag(result.newBestMoves)} · Pushes: ${g.pushes}${flag(result.newBestPushes)}` +
    ` — Best: ${best.bestMoves}/${best.bestPushes}`;
}

function nextLevel(): void {
  if (levelIndex + 1 < BUILTIN_LEVELS.length) startLevel(levelIndex + 1);
  else showMenu();
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
