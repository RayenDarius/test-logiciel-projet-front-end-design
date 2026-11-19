/* ExecutionService: SIMULATED test runs. No browser or Selenium is launched.
   executeTestSuite() would become POST /suites/:id/executions once a backend exists. */
import { storage, nowIso, clone, latency, uid } from './storage-service.js';
import { state } from '../state.js';
import { sleep } from '../utils.js';

const scoped = () => storage.get('executions').filter((e) => e.projectId === state.activeProjectId);

let counter = 0;
function nextExecutionId() {
  const max = storage.get('executions').reduce((m, e) => Math.max(m, parseInt(e.id.replace(/\D/g, ''), 10) || 0), 1000);
  counter = Math.max(counter, max) + 1;
  return `EX-${counter}`;
}

export const ExecutionService = {
  /** GET /executions */
  async list() {
    await latency();
    return clone(scoped()).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  },

  /** Test-level activity feed: a few notable results from the most recent executions. */
  recentActivity(limit = 8) {
    const names = new Map(storage.get('testCases').filter((t) => t.projectId === state.activeProjectId).map((t) => [t.id, t.title]));
    const rows = [];
    const recent = scoped().sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 8);
    for (const ex of recent) {
      const failed = ex.results.filter((r) => r.s === 'failed');
      const passed = ex.results.filter((r) => r.s === 'passed');
      const picks = [...failed.slice(0, 2), passed[(ex.id.length + ex.total) % Math.max(passed.length, 1)]].filter(Boolean).slice(0, 2);
      picks.forEach((r, i) => rows.push({
        key: `${ex.id}-${r.tc}`, id: r.tc, name: names.get(r.tc) ?? r.tc, suite: ex.suiteName, browser: ex.browser, status: r.s,
        durationMs: r.d, date: new Date(new Date(ex.startedAt).getTime() + (i + 1) * 90000).toISOString(), executionId: ex.id,
      }));
    }
    return clone(rows.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit));
  },

  /** GET /executions/:id/results */
  async getExecutionResults(id) {
    const ex = scoped().find((e) => e.id === id);
    return ex ? clone(ex) : null;
  },

  /** Runnable test cases for a suite (validated only). */
  getRunnableCases(suiteId) {
    return storage.get('testCases').filter((t) => t.projectId === state.activeProjectId && t.suiteId === suiteId && t.status === 'Validated');
  },

  /**
   * Simulates a suite run in the browser.
   * @param {string} suiteId
   * @param {{browser:string, environmentId:string, onProgress?:Function, signal?:{aborted:boolean}}} opts
   */
  async executeTestSuite(suiteId, opts) {
    const suite = storage.get('suites').find((s) => s.id === suiteId && s.projectId === state.activeProjectId);
    if (!suite) throw new Error('Suite not found.');
    const cases = this.getRunnableCases(suiteId);
    if (!cases.length) throw new Error('This suite has no validated test cases to run. Approve at least one test case first.');

    const { retries, stopOnFirstFailure } = state.settings.testDefaults;
    const tick = Math.min(220, Math.max(40, Math.round(5500 / cases.length)));
    const startedAt = nowIso();
    const results = [];
    const counts = { passed: 0, failed: 0, skipped: 0 };
    let virtualMs = 0;
    let aborted = false;

    for (let i = 0; i < cases.length; i += 1) {
      const tc = cases[i];
      opts.onProgress?.({ index: i, total: cases.length, current: tc, counts: { ...counts }, virtualMs, done: false });
      await sleep(tick);

      if (opts.signal?.aborted) { aborted = true; break; }

      let status;
      let d = Math.round((suite.type === 'performance' ? 3000 : 1400) * (0.5 + Math.random() * 1.3));
      if (stopOnFirstFailure && counts.failed > 0) {
        status = 'skipped'; d = 0;
      } else {
        const failChance = tc.lastResult === 'failed' ? 0.75 : 0.03;
        status = Math.random() < failChance ? 'failed' : 'passed';
        if (status === 'passed' && Math.random() < 0.015) { status = 'skipped'; d = 0; }
        for (let r = 0; r < retries && status === 'failed'; r += 1) {
          if (Math.random() < 0.35) status = 'passed';
          d += 900;
        }
      }
      counts[status] += 1;
      virtualMs += d;
      results.push({ tc: tc.id, s: status, d });
    }

    const execution = {
      id: nextExecutionId(), projectId: state.activeProjectId, suiteId, suiteName: suite.name,
      browser: opts.browser, environmentId: opts.environmentId, startedAt,
      durationMs: Math.round(virtualMs / (suite.type === 'functional' ? 4 : 2.5)),
      passed: counts.passed, failed: counts.failed, skipped: counts.skipped, total: results.length,
      status: aborted ? 'Cancelled' : counts.failed > 0 ? 'Failed' : 'Passed', simulated: true, results,
    };

    if (results.length) {
      storage.set('executions', [execution, ...storage.get('executions')]);
      const byId = new Map(results.filter((r) => r.s !== 'skipped').map((r) => [r.tc, r.s]));
      storage.set('testCases', storage.get('testCases').map((t) => (
        t.projectId === state.activeProjectId && byId.has(t.id) ? { ...t, lastResult: byId.get(t.id) } : t)));
      storage.set('projects', storage.get('projects').map((p) => (p.id === state.activeProjectId ? { ...p, lastActivityAt: nowIso() } : p)));
      if (!aborted && state.settings.notifications.inApp
        && (execution.status === 'Failed' ? state.settings.notifications.executionFailed : state.settings.notifications.executionComplete)) {
        storage.set('notifications', [{
          id: uid('n'), title: `${suite.name} ${execution.status === 'Passed' ? 'passed' : 'finished with failures'}`,
          body: `Simulated run ${execution.id}: ${counts.passed} passed, ${counts.failed} failed, ${counts.skipped} skipped.`,
          time: nowIso(), tone: execution.status === 'Passed' ? 'success' : 'error', read: false, link: '#/execution',
        }, ...storage.get('notifications')].slice(0, 30));
      }
    }
    opts.onProgress?.({ index: cases.length, total: cases.length, current: null, counts: { ...counts }, virtualMs, done: true });
    return clone(execution);
  },
};
