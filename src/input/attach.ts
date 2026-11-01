import { keyToAction, swipeToDirection } from './actions';
import type { Action } from './actions';

/** Wire keyboard and touch-swipe input to a handler. Returns a function that removes listeners. */
export function attachInput(target: HTMLElement, onAction: (action: Action) => void): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const action = keyToAction(e.key);
    if (!action) return;
    e.preventDefault();
    onAction(action);
  };

  let start: { x: number; y: number } | null = null;
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    start = t && e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchMove = (e: TouchEvent) => {
    // Swipes drive the game, so stop the page from scrolling.
    e.preventDefault();
  };
  const onTouchEnd = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    if (!start || !t) return;
    const dir = swipeToDirection(t.clientX - start.x, t.clientY - start.y);
    start = null;
    if (dir) onAction({ type: 'move', dir });
  };

  window.addEventListener('keydown', onKey);
  target.addEventListener('touchstart', onTouchStart, { passive: true });
  target.addEventListener('touchmove', onTouchMove, { passive: false });
  target.addEventListener('touchend', onTouchEnd, { passive: true });
  return () => {
    window.removeEventListener('keydown', onKey);
    target.removeEventListener('touchstart', onTouchStart);
    target.removeEventListener('touchmove', onTouchMove);
    target.removeEventListener('touchend', onTouchEnd);
  };
}
