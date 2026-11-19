/* TestSuiteService: mock implementation. */
import { storage, nowIso, clone, latency, nextNumberedId } from './storage-service.js';
import { state } from '../state.js';
import { ExecutionService } from './execution-service.js';

const scoped = () => storage.get('suites').filter((s) => s.projectId === state.activeProjectId);

/** Adds derived fields: counts, last execution, status. */
function decorate(suite) {
  const cases = storage.get('testCases').filter((t) => t.projectId === state.activeProjectId && t.suiteId === suite.id);
  const runs = storage.get('executions')
    .filter((e) => e.projectId === state.activeProjectId && e.suiteId === suite.id)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  const last = runs[0] ?? null;
  const env = storage.get('environments').find((e) => e.id === suite.environmentId) ?? null;
  return {
    ...clone(suite),
    testCaseCount: cases.length,
    validatedCount: cases.filter((t) => t.status === 'Validated').length,
    lastExecution: last ? clone(last) : null,
    lastRunAt: last?.startedAt ?? null,
    status: !last ? 'Not run' : last.status === 'Passed' ? 'Passing' : 'Failing',
    environment: env ? clone(env) : null,
  };
}

export const TestSuiteService = {
  /** GET /suites */
  async list() {
    await latency();
    return scoped().map(decorate);
  },

  async get(id) {
    const s = scoped().find((x) => x.id === id);
    return s ? decorate(s) : null;
  },

  async getTestCases(id) {
    return clone(storage.get('testCases').filter((t) => t.projectId === state.activeProjectId && t.suiteId === id));
  },

  async getExecutionHistory(id) {
    return clone(storage.get('executions').filter((e) => e.projectId === state.activeProjectId && e.suiteId === id)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)));
  },

  /** POST /suites */
  async createTestSuite(data) {
    const suite = {
      id: nextNumberedId('SU', storage.get('suites').map((s) => s.id)), projectId: state.activeProjectId, createdAt: nowIso(),
      type: data.type ?? 'functional', name: data.name.trim(), description: data.description.trim(),
      environmentId: data.environmentId, browsers: data.browsers,
    };
    storage.set('suites', [...storage.get('suites'), suite]);
    return decorate(suite);
  },

  /** PUT /suites/:id */
  async updateTestSuite(id, data) {
    storage.set('suites', storage.get('suites').map((s) => (s.id === id ? { ...s, ...data } : s)));
    return this.get(id);
  },

  /** POST /suites/:id/executions (simulated) */
  executeTestSuite(id, opts) {
    return ExecutionService.executeTestSuite(id, opts);
  },
};
