/* RequirementService: mock implementation. Each method maps to a future REST endpoint. */
import { storage, nowIso, clone, latency, nextNumberedId } from './storage-service.js';
import { state } from '../state.js';

const scoped = () => storage.get('requirements').filter((r) => r.projectId === state.activeProjectId);
const touchProject = () => {
  const projects = storage.get('projects').map((p) => (p.id === state.activeProjectId ? { ...p, lastActivityAt: nowIso() } : p));
  storage.set('projects', projects);
};

export const RequirementService = {
  /** GET /requirements */
  async list() {
    await latency();
    return clone(scoped()).sort((a, b) => a.id.localeCompare(b.id));
  },

  /** GET /requirements/:id */
  async get(id) {
    return clone(scoped().find((r) => r.id === id) ?? null);
  },

  /** POST /requirements */
  async createRequirement(data) {
    const all = storage.get('requirements');
    const id = nextNumberedId('REQ', scoped().map((r) => r.id));
    const req = {
      id, projectId: state.activeProjectId, createdAt: nowIso(),
      title: data.title.trim(), description: data.description.trim(), userStory: data.userStory.trim(),
      acceptanceCriteria: data.acceptanceCriteria, businessRules: data.businessRules,
      priority: data.priority, status: data.status,
    };
    storage.set('requirements', [...all, req]);
    touchProject();
    return clone(req);
  },

  /** PUT /requirements/:id */
  async updateRequirement(id, data) {
    const all = storage.get('requirements');
    const next = all.map((r) => (r.id === id && r.projectId === state.activeProjectId ? { ...r, ...data } : r));
    storage.set('requirements', next);
    touchProject();
    return clone(next.find((r) => r.id === id && r.projectId === state.activeProjectId));
  },

  /** DELETE /requirements/:id */
  async deleteRequirement(id) {
    const linked = storage.get('testCases').filter((t) => t.projectId === state.activeProjectId && t.requirementId === id).length;
    storage.set('requirements', storage.get('requirements').filter((r) => !(r.id === id && r.projectId === state.activeProjectId)));
    touchProject();
    return { deleted: id, orphanedTestCases: linked };
  },

  /** Test cases linked to a requirement */
  async getLinkedTestCases(id) {
    return clone(storage.get('testCases').filter((t) => t.projectId === state.activeProjectId && t.requirementId === id));
  },
};
