import type { Direction, Level } from '../game';

export interface SolveRequest {
  id: number;
  level: Level;
  maxStates: number;
}

export type SolveResponse =
  | { id: number; status: 'solved'; moves: Direction[] }
  | { id: number; status: 'unsolvable' }
  | { id: number; status: 'budget' }
  | { id: number; status: 'error' };

/** The slice of the Worker API the client uses (so tests can fake it). */
export interface WorkerLike {
  onmessage: ((e: { data: SolveResponse }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  postMessage(message: SolveRequest): void;
  terminate(): void;
}

/**
 * Runs the solver in a Web Worker without ever blocking the page. Only the newest request matters:
 * asking again while one is running terminates the old worker (a running search cannot be
 * interrupted any other way) and starts afresh.
 */
export class SolveClient {
  private worker: WorkerLike | null = null;
  private nextId = 1;
  private pending: { id: number; resolve: (r: SolveResponse) => void } | null = null;

  constructor(private readonly createWorker: () => WorkerLike) {}

  /** Solve from `level`'s current position. A superseded request resolves with status 'error'. */
  solve(level: Level, maxStates: number): Promise<SolveResponse> {
    this.cancel();
    const id = this.nextId++;
    const worker = this.createWorker();
    this.worker = worker;
    return new Promise<SolveResponse>((resolve) => {
      this.pending = { id, resolve };
      worker.onmessage = (e) => {
        if (this.pending?.id !== id) return;
        this.finish(worker, e.data);
      };
      worker.onerror = () => {
        if (this.pending?.id !== id) return;
        this.finish(worker, { id, status: 'error' });
      };
      worker.postMessage({ id, level, maxStates });
    });
  }

  /** Abandon the running request, if any. */
  cancel(): void {
    if (!this.pending) return;
    const { id, resolve } = this.pending;
    this.pending = null;
    this.worker?.terminate();
    this.worker = null;
    resolve({ id, status: 'error' });
  }

  private finish(worker: WorkerLike, response: SolveResponse): void {
    const pending = this.pending;
    this.pending = null;
    worker.terminate();
    if (this.worker === worker) this.worker = null;
    pending?.resolve(response);
  }
}
