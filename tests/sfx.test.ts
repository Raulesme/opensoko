import { describe, expect, it } from 'vitest';
import { Sfx } from '../src/audio/sfx';
import type { AudioContextLike } from '../src/audio/sfx';
import { SOUNDS, soundDuration } from '../src/audio/sounds';
import type { SoundName } from '../src/audio/sounds';
import { defaultSettings, loadSettings, saveSettings, SETTINGS_KEY } from '../src/storage/settings';

/** A fake audio context that counts what gets created and started. */
function fakeContext() {
  const counts = { oscillators: 0, noiseSources: 0, gains: 0, resumed: 0 };
  const param = () => ({
    value: 0,
    setValueAtTime: () => undefined,
    linearRampToValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined,
  });
  const node = () => ({ connect: () => undefined, start: () => undefined, stop: () => undefined });
  const ctx = {
    currentTime: 0,
    destination: {},
    sampleRate: 8000,
    state: 'suspended',
    resume: async () => void counts.resumed++,
    createGain: () => {
      counts.gains++;
      return { ...node(), gain: param() };
    },
    createOscillator: () => {
      counts.oscillators++;
      return { ...node(), frequency: param(), type: 'sine' };
    },
    createBuffer: (_c: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => {
      counts.noiseSources++;
      return { ...node(), buffer: null };
    },
  };
  return { ctx: ctx as unknown as AudioContextLike, counts };
}

const names = Object.keys(SOUNDS) as SoundName[];

describe('sound definitions', () => {
  for (const name of names) {
    it(`${name} has valid tones and is short`, () => {
      const tones = SOUNDS[name];
      expect(tones.length).toBeGreaterThan(0);
      for (const t of tones) {
        expect(t.duration).toBeGreaterThan(0);
        expect(t.start).toBeGreaterThanOrEqual(0);
        expect(t.gain).toBeGreaterThan(0);
        expect(t.gain).toBeLessThanOrEqual(1);
        if (t.wave !== 'noise') {
          expect(t.from).toBeGreaterThan(0);
          expect(t.to).toBeGreaterThan(0);
        }
      }
      expect(soundDuration(tones)).toBeLessThan(1);
    });
  }
});

describe('Sfx', () => {
  it('schedules one source per tone', () => {
    const { ctx, counts } = fakeContext();
    const sfx = new Sfx(() => ctx);
    sfx.play('win');
    const tones = SOUNDS.win;
    expect(counts.oscillators).toBe(tones.filter((t) => t.wave !== 'noise').length);
    sfx.play('bump');
    expect(counts.noiseSources).toBe(1);
  });

  it('resumes a suspended context (autoplay policy)', () => {
    const { ctx, counts } = fakeContext();
    new Sfx(() => ctx).play('step');
    expect(counts.resumed).toBe(1);
  });

  it('does nothing, and never creates a context, while muted', () => {
    let created = 0;
    const { ctx, counts } = fakeContext();
    const sfx = new Sfx(() => {
      created++;
      return ctx;
    }, true);
    sfx.play('goal');
    expect(created).toBe(0);
    expect(counts.oscillators).toBe(0);
    sfx.setMuted(false);
    sfx.play('goal');
    expect(created).toBe(1);
    expect(counts.oscillators).toBeGreaterThan(0);
  });

  it('survives an unavailable or throwing audio context', () => {
    expect(() => new Sfx(() => null).play('step')).not.toThrow();
    expect(() =>
      new Sfx(() => {
        throw new Error('no audio');
      }).play('step'),
    ).not.toThrow();
  });
});

describe('settings', () => {
  const store = (initial?: string) => {
    const data = new Map<string, string>();
    if (initial !== undefined) data.set(SETTINGS_KEY, initial);
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    };
  };

  it('round-trips the mute preference', () => {
    const s = store();
    expect(saveSettings(s, { muted: true })).toBe(true);
    expect(loadSettings(s)).toEqual({ muted: true });
  });

  it('falls back to defaults for missing, corrupt or inaccessible storage', () => {
    expect(loadSettings(store())).toEqual(defaultSettings());
    expect(loadSettings(store('{oops'))).toEqual(defaultSettings());
    expect(loadSettings(store('null'))).toEqual(defaultSettings());
    expect(loadSettings(null)).toEqual(defaultSettings());
    expect(saveSettings(null, defaultSettings())).toBe(false);
  });
});
