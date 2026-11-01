import { SOUNDS } from './sounds';
import type { SoundName, Tone } from './sounds';

/** The small part of the Web Audio API this player uses (so tests can fake it). */
export interface AudioContextLike {
  readonly currentTime: number;
  readonly destination: AudioNode;
  readonly sampleRate: number;
  readonly state: string;
  resume(): Promise<void>;
  createGain(): GainNode;
  createOscillator(): OscillatorNode;
  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer;
  createBufferSource(): AudioBufferSourceNode;
}

const MASTER_GAIN = 0.35;
const ATTACK = 0.004;

/** Plays the sounds in sounds.ts. The audio context is created on first use (after a user input). */
export class Sfx {
  private ctx: AudioContextLike | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private _muted: boolean;

  constructor(
    private readonly createContext: () => AudioContextLike | null,
    muted = false,
  ) {
    this._muted = muted;
  }

  get muted(): boolean {
    return this._muted;
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
  }

  play(name: SoundName): void {
    if (this._muted) return;
    const ctx = this.context();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime;
    for (const tone of SOUNDS[name]) this.schedule(ctx, tone, t0);
  }

  private context(): AudioContextLike | null {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = this.createContext();
    } catch {
      this.ctx = null;
    }
    if (!this.ctx) return null;
    this.master = this.ctx.createGain();
    this.master.gain.value = MASTER_GAIN;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  private noiseBuffer(ctx: AudioContextLike): AudioBuffer {
    if (!this.noise) {
      const length = Math.floor(ctx.sampleRate * 0.25);
      this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  private schedule(ctx: AudioContextLike, tone: Tone, t0: number): void {
    const start = t0 + tone.start;
    const end = start + tone.duration;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(tone.gain, start + Math.min(ATTACK, tone.duration / 2));
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    env.connect(this.master!);

    if (tone.wave === 'noise') {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer(ctx);
      src.connect(env);
      src.start(start);
      src.stop(end);
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = tone.wave;
    osc.frequency.setValueAtTime(tone.from, start);
    if (tone.to !== tone.from) osc.frequency.exponentialRampToValueAtTime(tone.to, end);
    osc.connect(env);
    osc.start(start);
    osc.stop(end);
  }
}

/** A real browser AudioContext, or null where Web Audio is unavailable. */
export function browserAudioContext(): AudioContextLike | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}
