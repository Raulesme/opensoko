import './style.css';
import { Game, parseLevel } from './game';
import type { Direction } from './game';
import { attachInput } from './input/attach';
import type { Action } from './input/actions';
import { BUILTIN_LEVELS } from './levels/builtin';
import { Renderer } from './render/renderer';
import { loadAtlas } from './render/sprites';
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

const canvas = $<HTMLCanvasElement>('game');
const renderer = new Renderer(canvas, await loadAtlas());

let view: 'menu' | 'play' = 'menu';
let levelIndex = 0;
let game: Game | null = null;
let facing: Direction = 'down';

function persist(): void {
  saveProgress(storage, progress);
}

function showMenu(): void {
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
  renderer.draw(facing);
  $('level').textContent = `Level ${levelIndex + 1}/${BUILTIN_LEVELS.length}`;
  $('moves').textContent = `Moves: ${game.moves}`;
  $('pushes').textContent = `Pushes: ${game.pushes}`;
  $('win').hidden = !game.isWon;
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
  if (view !== 'play' || !game) return;
  if (action.type === 'menu') return showMenu();
  const wasWon = game.isWon;
  if (action.type === 'move') {
    facing = action.dir; // turn to face the move even when blocked
    game.move(action.dir);
  } else if (action.type === 'undo') game.undo();
  else game.restart();
  if (!wasWon && game.isWon) onWin(game);
  refresh();
}

attachInput($('stage'), handle);
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
