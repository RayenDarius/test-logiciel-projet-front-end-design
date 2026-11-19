/* Holds the single in-flight simulated run so any page can show its progress.
   Nothing here starts a real browser: ExecutionService only simulates results. */
import { state } from '../state.js';
import { ExecutionService } from './execution-service.js';
import { storage } from './storage-service.js';

let current = null;

export const RunController = {
  get current() { return current; },
  get isRunning() { return Boolean(current?.running); },

  subscribe(fn) { return state.on('run', fn); },

  async start({ suiteId, browser, environmentId }) {
    if (this.isRunning) throw new Error('A simulated run is already in progress.');
    const suite = storage.get('suites').find((s) => s.id === suiteId);
    const signal = { aborted: false };
    current = {
      suiteId, suiteName: suite?.name ?? 'Suite', browser, environmentId, signal, running: true, result: null, error: null,
      progress: { index: 0, total: 0, current: null, counts: { passed: 0, failed: 0, skipped: 0 }, virtualMs: 0, done: false },
    };
    state.emit('run', current);
    try {
      const result = await ExecutionService.executeTestSuite(suiteId, {
        browser, environmentId, signal,
        onProgress: (p) => { current.progress = p; state.emit('run', current); },
      });
      current.result = result;
    } catch (err) {
      current.error = err;
      current.progress = { ...current.progress, done: true };
    } finally {
      current.running = false;
      state.emit('run', current);
    }
    return current;
  },

  cancel() {
    if (current?.running) current.signal.aborted = true;
  },

  clear() {
    if (!current?.running) { current = null; state.emit('run', null); }
  },
};
