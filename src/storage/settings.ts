import type { StorageLike } from './progress';

export interface Settings {
  muted: boolean;
  /** The first-time tutorial was finished, skipped or left; do not show it automatically again. */
  tutorialDone: boolean;
}

export const SETTINGS_KEY = 'opensoko:settings';

export function defaultSettings(): Settings {
  return { muted: false, tutorialDone: false };
}

/** Load settings; missing, corrupt or inaccessible storage yields defaults. */
export function loadSettings(storage: StorageLike | null): Settings {
  try {
    const raw = storage?.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const data = JSON.parse(raw) as Partial<Settings> | null;
    return { muted: data?.muted === true, tutorialDone: data?.tutorialDone === true };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(storage: StorageLike | null, settings: Settings): boolean {
  try {
    if (!storage) return false;
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
