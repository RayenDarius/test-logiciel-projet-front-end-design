/* TestCaseService: mock implementation. */
import { storage, nowIso, clone, latency, nextNumberedId } from './storage-service.js';
import { state } from '../state.js';

const scoped = () => storage.get('testCases').filter((t) => t.projectId === state.activeProjectId);
const saveOne = (id, patch) => {
  const next = storage.get('testCases').map((t) => (t.id === id && t.projectId === state.activeProjectId ? { ...t, ...patch, updatedAt: nowIso() } : t));
  storage.set('testCases', next);
  return next.find((t) => t.id === id && t.projectId === state.activeProjectId);
};
const touchProject = () => {
  storage.set('projects', storage.get('projects').map((p) => (p.id === state.activeProjectId ? { ...p, lastActivityAt: nowIso() } : p)));
};

/** Latest outcome shown in the UI. Only validated cases carry a result. */
export const effectiveResult = (tc) => (tc.status === 'Validated' ? tc.lastResult : 'pending');

export const TestCaseService = {
  /** GET /test-cases */
  async list() {
    await latency();
    return clone(scoped()).sort((a, b) => a.id.localeCompare(b.id));
  },

  async get(id) {
    return clone(scoped().find((t) => t.id === id) ?? null);
  },

  /** Counts used by the dashboard and test case page */
  async stats() {
    const all = scoped();
    const res = all.map(effectiveResult);
    return {
      total: all.length,
      validated: all.filter((t) => t.status === 'Validated').length,
      draft: all.filter((t) => t.status === 'Draft').length,
      rejected: all.filter((t) => t.status === 'Rejected').length,
      passed: res.filter((r) => r === 'passed').length,
      failed: res.filter((r) => r === 'failed').length,
      pending: res.filter((r) => r === 'pending').length,
    };
  },

  /** POST /test-cases */
  async createTestCase(data) {
    const id = nextNumberedId('TC', scoped().map((t) => t.id));
    const tc = {
      id, projectId: state.activeProjectId, status: 'Draft', lastResult: 'pending', author: state.settings.profile.name,
      createdAt: nowIso(), updatedAt: nowIso(), acceptanceIndex: 0, ...data,
    };
    storage.set('testCases', [...storage.get('testCases'), tc]);
    touchProject();
    return clone(tc);
  },

  /** PUT /test-cases/:id */
  async updateTestCase(id, data) {
    const tc = saveOne(id, data);
    touchProject();
    return clone(tc);
  },

  /** POST /test-cases/:id/validate. status is Validated, Draft or Rejected. */
  async validateTestCase(id, status) {
    const tc = saveOne(id, { status });
    touchProject();
    return clone(tc);
  },

  /** POST /test-cases/:id/approve */
  async approveTestCase(id) {
    return this.validateTestCase(id, 'Validated');
  },

  async rejectTestCase(id) {
    return this.validateTestCase(id, 'Rejected');
  },

  /** POST /test-cases/:id/duplicate */
  async duplicateTestCase(id) {
    const src = scoped().find((t) => t.id === id);
    if (!src) throw new Error(`Test case ${id} was not found.`);
    const copy = {
      ...clone(src), id: nextNumberedId('TC', scoped().map((t) => t.id)), title: `${src.title} (copy)`,
      status: 'Draft', lastResult: 'pending', createdAt: nowIso(), updatedAt: nowIso(), author: state.settings.profile.name,
    };
    storage.set('testCases', [...storage.get('testCases'), copy]);
    touchProject();
    return clone(copy);
  },

  /** DELETE /test-cases/:id */
  async deleteTestCase(id) {
    storage.set('testCases', storage.get('testCases').filter((t) => !(t.id === id && t.projectId === state.activeProjectId)));
    touchProject();
    return { deleted: id };
  },

  /** Out of scope for this phase: will call the generation endpoint later. */
  async generateTestCases() {
    throw new Error('AI test case generation is not available yet.');
  },
};
