/// <reference lib="webworker" />
import { findPreset, generateForPreset } from './presets';

export interface WorkerRequest {
  seed: number;
  preset: string;
}

export type WorkerResponse =
  { ok: true; text: string; par: number; attempts: number } | { ok: false; error: string };

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const preset = findPreset(e.data.preset);
  let response: WorkerResponse;
  if (!preset) {
    response = { ok: false, error: `Unknown difficulty '${e.data.preset}'` };
  } else {
    const result = generateForPreset(e.data.seed, preset);
    response = result
      ? {
          ok: true,
          text: result.candidate.text,
          par: result.candidate.minPushes,
          attempts: result.attempts,
        }
      : { ok: false, error: 'Could not generate a puzzle for that code. Try another.' };
  }
  (self as unknown as Worker).postMessage(response);
};
