/* ReportService: analytics derived from stored executions, plus export helpers. */
import { storage, nowIso, clone, latency, nextNumberedId } from './storage-service.js';
import { state } from '../state.js';
import { effectiveResult } from './test-case-service.js';
import { pct, sum, toCsv, fmtDateTime, fmtDuration } from '../utils.js';
import { BROWSERS } from '../data/mock-data.js';

const executions = (days) => {
  const cutoff = days ? Date.now() - days * 86400000 : 0;
  return storage.get('executions')
    .filter((e) => e.projectId === state.activeProjectId && new Date(e.startedAt).getTime() >= cutoff)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
};

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export const ReportService = {
  async summary(days = 14) {
    await latency(120);
    const ex = executions(days);
    const passed = sum(ex, (e) => e.passed);
    const failed = sum(ex, (e) => e.failed);
    const skipped = sum(ex, (e) => e.skipped);
    const total = passed + failed + skipped;
    const prev = (() => {
      const cutoffA = Date.now() - days * 2 * 86400000;
      const cutoffB = Date.now() - days * 86400000;
      return storage.get('executions').filter((e) => e.projectId === state.activeProjectId
        && new Date(e.startedAt).getTime() >= cutoffA && new Date(e.startedAt).getTime() < cutoffB);
    })();
    const prevTotal = sum(prev, (e) => e.passed + e.failed);
    const prevRate = prevTotal ? sum(prev, (e) => e.passed) / prevTotal : 0;
    const rate = passed + failed ? passed / (passed + failed) : 0;
    return {
      executions: ex.length, passed, failed, skipped, total,
      successRate: Math.round(rate * 1000) / 10,
      successRateDelta: prev.length ? Math.round((rate - prevRate) * 1000) / 10 : null,
      avgDurationMs: ex.length ? Math.round(sum(ex, (e) => e.durationMs) / ex.length) : 0,
      previousExecutions: prev.length,
      previousFailed: sum(prev, (e) => e.failed),
    };
  },

  /** Daily totals for the last N days (zero-filled) */
  async dailySeries(days = 7) {
    const buckets = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      buckets.push({ date: d, key: dayKey(d), passed: 0, failed: 0, skipped: 0, runs: 0, durationMs: 0 });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    executions(days + 1).forEach((e) => {
      const b = map.get(dayKey(new Date(e.startedAt)));
      if (!b) return;
      b.passed += e.passed; b.failed += e.failed; b.skipped += e.skipped; b.runs += 1; b.durationMs += e.durationMs;
    });
    return buckets;
  },

  /** Test cases grouped by suite type for the dashboard doughnut */
  async distribution() {
    const suites = storage.get('suites').filter((s) => s.projectId === state.activeProjectId);
    const cases = storage.get('testCases').filter((t) => t.projectId === state.activeProjectId);
    return suites.map((s) => ({ suiteId: s.id, type: s.type, name: s.name, count: cases.filter((t) => t.suiteId === s.id).length }));
  },

  /** Share of test cases per requirement and how many pass */
  async coverageByRequirement() {
    const reqs = storage.get('requirements').filter((r) => r.projectId === state.activeProjectId);
    const cases = storage.get('testCases').filter((t) => t.projectId === state.activeProjectId);
    return reqs.map((r) => {
      const linked = cases.filter((t) => t.requirementId === r.id);
      const passing = linked.filter((t) => effectiveResult(t) === 'passed').length;
      return { id: r.id, title: r.title, total: linked.length, passing, failing: linked.filter((t) => effectiveResult(t) === 'failed').length, coverage: pct(passing, linked.length) };
    });
  },

  async suitePerformance(days = 14) {
    const suites = storage.get('suites').filter((s) => s.projectId === state.activeProjectId);
    const ex = executions(days);
    return suites.map((s) => {
      const runs = ex.filter((e) => e.suiteId === s.id);
      const p = sum(runs, (e) => e.passed); const f = sum(runs, (e) => e.failed);
      return {
        id: s.id, name: s.name, runs: runs.length, passRate: pct(p, p + f),
        avgDurationMs: runs.length ? Math.round(sum(runs, (e) => e.durationMs) / runs.length) : 0,
      };
    });
  },

  /** Pass rate by browser */
  async browserBreakdown(days = 14) {
    const ex = executions(days);
    return BROWSERS.map((b) => {
      const runs = ex.filter((e) => e.browser === b.id);
      const p = sum(runs, (e) => e.passed); const f = sum(runs, (e) => e.failed);
      return { id: b.id, name: b.name, runs: runs.length, passRate: pct(p, p + f) };
    });
  },

  /** GET /reports */
  async list() {
    await latency(120);
    return clone(storage.get('reports').filter((r) => r.projectId === state.activeProjectId)
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)));
  },

  /** POST /reports */
  async generateReport({ name, type, range, format }) {
    const report = {
      id: nextNumberedId('RPT', storage.get('reports').map((r) => r.id)), projectId: state.activeProjectId,
      name, type, range, format, generatedAt: nowIso(), generatedBy: state.settings.profile.name,
    };
    storage.set('reports', [report, ...storage.get('reports')]);
    return clone(report);
  },

  rangeToDays(range) {
    return { 'Last 7 days': 7, 'Last 14 days': 14, 'Last 30 days': 30, 'All time': 0 }[range] ?? 14;
  },

  /** CSV for a set of executions (one row per execution) */
  buildCsv(days = 0) {
    const suites = storage.get('suites');
    const envs = storage.get('environments');
    const rows = executions(days).reverse();
    return toCsv(rows, [
      { label: 'Execution ID', key: 'id' },
      { label: 'Suite', key: 'suiteName' },
      { label: 'Browser', value: (e) => BROWSERS.find((b) => b.id === e.browser)?.name ?? e.browser },
      { label: 'Environment', value: (e) => envs.find((v) => v.id === e.environmentId)?.name ?? '' },
      { label: 'Started', value: (e) => fmtDateTime(e.startedAt) },
      { label: 'Duration', value: (e) => fmtDuration(e.durationMs) },
      { label: 'Passed', key: 'passed' },
      { label: 'Failed', key: 'failed' },
      { label: 'Skipped', key: 'skipped' },
      { label: 'Status', key: 'status' },
      { label: 'Simulated', value: () => 'Yes' },
      { label: 'Suite type', value: (e) => suites.find((s) => s.id === e.suiteId)?.type ?? '' },
    ]);
  },

  /** JSON execution summary (mock) */
  async buildJson(days = 0) {
    const s = await this.summary(days || 3650);
    const project = state.activeProject;
    return JSON.stringify({
      generatedAt: nowIso(), simulated: true, project: { id: project.id, name: project.name },
      range: days ? `last ${days} days` : 'all time',
      summary: { executions: s.executions, passed: s.passed, failed: s.failed, skipped: s.skipped, successRatePercent: s.successRate, averageDurationMs: s.avgDurationMs },
      suites: await this.suitePerformance(days || 3650),
      executions: executions(days).reverse().map(({ results, ...rest }) => ({ ...rest, resultCount: results.length })),
    }, null, 2);
  },
};
