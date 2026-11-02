import './style.css';
import { browserAudioContext, Sfx } from './audio/sfx';
import { DIRECTION_DELTAS, Game, parseLevel } from './game';
import type { Direction } from './game';
import { attachInput } from './input/attach';
import type { Action } from './input/actions';
import { formatCode, parseCode, randomSeed } from './generator/code';
import { PRESETS, findPreset } from './generator/presets';
import type { WorkerRequest, WorkerResponse } from './generator/worker';
import { SolveClient } from './help/client';
import type { WorkerLike } from './help/client';
import { Help } from './help/controller';
import { PACKS } from './levels/packs';
import { rating, starString } from './levels/rating';
import { TUTORIAL_STEPS, tutorialEntries } from './tutorial/steps';
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
  /** Set for random puzzles: the difficulty to use for "another puzzle" and the share code. */
  random?: { preset: string; code: string };
  /** True for the first-time tutorial: lessons are never scored and show a caption. */
  tutorial?: boolean;
}

let view: 'menu' | 'play' = 'menu';
let session: Session | null = null;
let game: Game | null = null;
let facing: Direction = 'down';
let anim: MoveAnimation | null = null;
let rafId = 0;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
/** Phones and tablets: tutorial wording talks about swiping and tapping instead of keys. */
const touchDevice = window.matchMedia('(pointer: coarse)').matches;

/** Hints, the "stuck" warning and solution playback; the solver runs in a Web Worker. */
const help = new Help({
  client: new SolveClient(
    () =>
      new Worker(new URL('./help/worker.ts', import.meta.url), {
        type: 'module',
      }) as unknown as WorkerLike,
  ),
  applyMove: (dir) => handle({ type: 'move', dir }, true),
  changed: () => refresh(),
});

/** Redraw every frame while a move is sliding; stop (and show the win overlay) when it ends. */
function tick(now: number): void {
  rafId = 0;
  if (!anim) return;
  if (isFinished(anim, now)) {
    anim = null;
    refresh();
    return;
  }
  renderer.draw(facing, anim, now, help.hint);
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

function startTutorial(): void {
  startSession(tutorialEntries(), 0, false, undefined, true);
}

/** Mark the tutorial as seen so it is not offered automatically again. */
function finishTutorial(goToMenu: boolean): void {
  settings.tutorialDone = true;
  saveSettings(storage, settings);
  session = null;
  if (goToMenu) showMenu();
}

function showMenu(): void {
  if (session?.tutorial) finishTutorial(false);
  stopAnimation();
  cancelGeneration();
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
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

function startSession(
  levels: readonly LevelEntry[],
  index: number,
  ranked: boolean,
  random?: Session['random'],
  tutorial = false,
): void {
  session = { levels, index, ranked, random, tutorial };
  loadCurrent();
}

// --- Random puzzles -------------------------------------------------------------------------

let worker: Worker | null = null;

function setGenerating(label: string | null): void {
  const busy = label !== null;
  $('gen-status').textContent = label ?? '';
  $('gen-cancel').hidden = !busy;
  document
    .querySelectorAll<HTMLButtonElement>('#difficulty-buttons button, #code-form button')
    .forEach((b) => (b.disabled = busy));
}

function cancelGeneration(): void {
  worker?.terminate();
  worker = null;
  setGenerating(null);
}

/** Generate in a Web Worker so the page stays responsive, then start playing the result. */
function startRandom(presetId: string, seed: number = randomSeed()): void {
  const preset = findPreset(presetId);
  if (!preset) return void ($('gen-status').textContent = `Unknown difficulty '${presetId}'.`);
  cancelGeneration();
  setGenerating(`Generating ${/^[aeiou]/i.test(preset.name) ? 'an' : 'a'} ${preset.name} puzzle…`);
  const w = new Worker(new URL('./generator/worker.ts', import.meta.url), { type: 'module' });
  worker = w;
  w.onmessage = (e: MessageEvent<WorkerResponse>) => {
    w.terminate();
    if (worker === w) worker = null;
    setGenerating(null);
    if (!e.data.ok) return void ($('gen-status').textContent = e.data.error);
    const code = formatCode({ preset: preset.id, seed });
    const entry: LevelEntry = {
      id: `random:${code}`,
      name: `${preset.name} #${seed}`,
      par: e.data.par,
      text: e.data.text,
    };
    startSession([entry], 0, false, { preset: preset.id, code });
    history.replaceState(null, '', `#p=${code}`);
  };
  w.onerror = () => {
    w.terminate();
    worker = null;
    setGenerating(null);
    $('gen-status').textContent = 'Puzzle generation failed. Please try again.';
  };
  const request: WorkerRequest = { seed, preset: preset.id };
  w.postMessage(request);
}

function startFromCodeText(text: string): void {
  const code = parseCode(text);
  if (!code && /^v\d+\./i.test(text.trim())) {
    $('gen-status').textContent =
      'That code is from a different version of the generator and cannot be reproduced.';
    return;
  }
  if (!code || !findPreset(code.preset)) {
    $('gen-status').textContent = 'That is not a valid puzzle code (expected e.g. v2.hard.482913).';
    return;
  }
  startRandom(code.preset, code.seed);
}

function setupRandomUi(): void {
  const row = $('difficulty-buttons');
  for (const preset of PRESETS) {
    const button = Object.assign(document.createElement('button'), {
      type: 'button',
      textContent: preset.name,
    });
    button.addEventListener('click', () => startRandom(preset.id));
    row.append(button);
  }
  $('code-form').addEventListener('submit', (e) => {
    e.preventDefault();
    startFromCodeText($<HTMLInputElement>('code').value);
  });
  $('gen-cancel').addEventListener('click', cancelGeneration);
  $('share').addEventListener('click', async () => {
    if (!session?.random) return;
    const url = `${location.origin}${location.pathname}#p=${session.random.code}`;
    try {
      await navigator.clipboard.writeText(url);
      $('share').textContent = 'Copied!';
    } catch {
      $('share').textContent = session.random.code; // fall back to showing the code
    }
    setTimeout(() => ($('share').textContent = 'Copy link'), 2000);
  });
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
  help.setGame(game);
}

function refresh(): void {
  if (!game || !session) return;
  renderer.draw(facing, anim, performance.now(), help.hint);
  const entry = currentEntry();
  $('level').textContent = session.tutorial
    ? `Lesson ${session.index + 1}/${session.levels.length}: ${entry.name}`
    : `${entry.name} (${session.index + 1}/${session.levels.length})`;
  const caption = $('tutorial-text');
  caption.hidden = !session.tutorial;
  if (session.tutorial) {
    const step = TUTORIAL_STEPS[session.index]!;
    caption.textContent = touchDevice ? step.caption.touch : step.caption.keys;
  }
  $('skip-tutorial').hidden = !session.tutorial;
  $('moves').textContent = `Moves: ${game.moves}`;
  $('pushes').textContent = `Pushes: ${game.pushes}`;
  $('par').textContent = `Par: ${entry.par}`;
  // Hold the win overlay back until the last move has finished sliding.
  $('win').hidden = !game.isWon || anim !== null;
  const status = $('help-status');
  status.textContent = help.status;
  status.classList.toggle('warn', help.stuck);
  $<HTMLButtonElement>('hint').disabled = game.isWon;
  $<HTMLButtonElement>('solve').disabled = game.isWon;
  $('share').hidden = !session.random;
  $('next').textContent = session.random
    ? 'Another puzzle'
    : session.tutorial
      ? session.index + 1 < session.levels.length
        ? 'Next lesson'
        : 'Finish'
      : session.index + 1 < session.levels.length
        ? 'Next level'
        : 'Back to menu';
}

function onWin(g: Game): void {
  if (session!.tutorial) {
    $('win-stars').textContent = '';
    $('win-stats').textContent = 'Well done!';
    return;
  }
  const entry = currentEntry();
  const flag = (isNew: boolean) => (isNew ? ' (new best!)' : '');
  const stars = rating(g.pushes, entry.par);
  $('win-stars').textContent = help.assisted ? '' : starString(stars);

  let line = `Moves: ${g.moves} · Pushes: ${g.pushes} (par ${entry.par})`;
  if (help.assisted) {
    line = 'Solved with help, so no score was saved.';
  } else if (session!.ranked) {
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
  if (session.random) return startRandom(session.random.preset);
  if (session.index + 1 < session.levels.length) {
    session.index++;
    loadCurrent();
  } else showMenu();
}

function handle(action: Action, fromAutoplay = false): void {
  if (action.type === 'mute') return toggleMute();
  if (view !== 'play' || !game) return;
  if (!fromAutoplay) help.stopAutoplay(); // any manual input takes over from the solution playback
  if (action.type === 'menu') return showMenu();
  if (action.type === 'hint') return void help.requestHint();
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
    if (result.moved) help.onMove(action.dir);
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
    if (game.undo()) {
      sfx.play('undo');
      help.onReset();
    }
  } else {
    game.restart();
    sfx.play('restart');
    help.onReset();
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
$('hint').addEventListener('click', () => handle({ type: 'hint' }));
$('solve').addEventListener('click', () => {
  help.stopAutoplay();
  void help.startSolution();
});
$('next').addEventListener('click', nextLevel);
$('how-to').addEventListener('click', startTutorial);
$('skip-tutorial').addEventListener('click', () => finishTutorial(true));
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
// Any key press or tap takes over from the solution playback.
window.addEventListener('keydown', () => help.stopAutoplay());
$('stage').addEventListener('pointerdown', () => help.stopAutoplay());
window.addEventListener('resize', () => renderer.fit());

setupRandomUi();

// A shared link like #p=v2.hard.482913 opens that puzzle directly. Read it before showMenu(),
// which clears the hash.
const shared = /^#p=(.+)$/.exec(location.hash);
showMenu();
if (shared) startFromCodeText(decodeURIComponent(shared[1]!));
else if (!settings.tutorialDone && Object.keys(progress.levels).length === 0) {
  // First visit: offer the tutorial straight away (it can be skipped).
  startTutorial();
}
