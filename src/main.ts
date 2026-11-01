import './style.css';
import { Game, parseLevel } from './game';
import { attachInput } from './input/attach';
import type { Action } from './input/actions';
import { BUILTIN_LEVELS } from './levels/builtin';
import { Renderer } from './render/renderer';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>('game');
const stage = $('stage');
const renderer = new Renderer(canvas);

let levelIndex = 0;
let game = loadLevel(levelIndex);

function loadLevel(index: number): Game {
  const g = new Game(parseLevel(BUILTIN_LEVELS[index]!));
  renderer.setGame(g);
  return g;
}

function refresh(): void {
  renderer.draw();
  $('level').textContent = `Level ${levelIndex + 1}/${BUILTIN_LEVELS.length}`;
  $('moves').textContent = `Moves: ${game.moves}`;
  $('pushes').textContent = `Pushes: ${game.pushes}`;
  const win = $('win');
  win.hidden = !game.isWon;
  $('next').textContent = levelIndex + 1 < BUILTIN_LEVELS.length ? 'Next level' : 'Play again';
}

function nextLevel(): void {
  levelIndex = (levelIndex + 1) % BUILTIN_LEVELS.length;
  game = loadLevel(levelIndex);
  refresh();
}

function handle(action: Action): void {
  if (action.type === 'move') game.move(action.dir);
  else if (action.type === 'undo') game.undo();
  else game.restart();
  refresh();
}

attachInput(stage, handle);
$('undo').addEventListener('click', () => handle({ type: 'undo' }));
$('restart').addEventListener('click', () => handle({ type: 'restart' }));
$('next').addEventListener('click', nextLevel);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && game.isWon) nextLevel();
});
window.addEventListener('resize', () => renderer.fit());

refresh();
