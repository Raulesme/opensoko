/// <reference lib="webworker" />
import { solveDetailed, pushesToMoves } from '../generator/solver';
import type { SolveRequest, SolveResponse } from './client';

self.onmessage = (e: MessageEvent<SolveRequest>) => {
  const { id, level, maxStates } = e.data;
  let response: SolveResponse;
  try {
    const outcome = solveDetailed(level, maxStates);
    response =
      outcome.status === 'solved'
        ? { id, status: 'solved', moves: pushesToMoves(level, outcome.result.pushes) }
        : { id, status: outcome.status };
  } catch {
    response = { id, status: 'error' };
  }
  (self as unknown as Worker).postMessage(response);
};
