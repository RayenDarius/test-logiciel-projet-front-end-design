/* ProjectService, EnvironmentService and NotificationService: mock implementations. */
import { storage, nowIso, clone, latency, uid } from './storage-service.js';
import { state } from '../state.js';
import { SUITE_TYPES } from '../data/mock-data.js';

export const ProjectService = {
  async list() {
    await latency(140);
    const reqs = storage.get('requirements');
    const tcs = storage.get('testCases');
    return clone(storage.get('projects')).map((p) => ({
      ...p,
      requirementCount: reqs.filter((r) => r.projectId === p.id).length,
      testCaseCount: tcs.filter((t) => t.projectId === p.id).length,
    }));
  },

  async create({ name, description, status }) {
    const project = { id: uid('prj'), name: name.trim(), description: description.trim(), status, createdAt: nowIso(), lastActivityAt: nowIso() };
    storage.set('projects', [...storage.get('projects'), project]);
    /* New projects start with the four standard suites so tests can be organised straight away. */
    const suites = Object.entries(SUITE_TYPES).map(([type, meta]) => ({
      id: uid('SU'), projectId: project.id, type, name: meta.name, description: `${meta.name} for ${project.name}.`,
      environmentId: storage.get('environments')[0]?.id ?? '', browsers: ['chrome'], createdAt: nowIso(),
    }));
    storage.set('suites', [...storage.get('suites'), ...suites]);
    return clone(project);
  },

  async update(id, data) {
    storage.set('projects', storage.get('projects').map((p) => (p.id === id ? { ...p, ...data, lastActivityAt: nowIso() } : p)));
    return clone(storage.get('projects').find((p) => p.id === id));
  },

  async remove(id) {
    const remaining = storage.get('projects').filter((p) => p.id !== id);
    storage.set('projects', remaining);
    for (const key of ['requirements', 'testCases', 'suites', 'executions', 'reports']) {
      storage.set(key, storage.get(key).filter((x) => x.projectId !== id));
    }
    if (state.activeProjectId === id && remaining[0]) state.setActiveProject(remaining[0].id);
    return { deleted: id };
  },
};

export const EnvironmentService = {
  async list() {
    await latency(100);
    return clone(storage.get('environments'));
  },
  getSync() { return clone(storage.get('environments')); },
  async create(data) {
    const env = { id: uid('env'), ...data };
    storage.set('environments', [...storage.get('environments'), env]);
    return clone(env);
  },
  async update(id, data) {
    storage.set('environments', storage.get('environments').map((e) => (e.id === id ? { ...e, ...data } : e)));
    return clone(storage.get('environments').find((e) => e.id === id));
  },
  async remove(id) {
    const inUse = storage.get('suites').filter((s) => s.environmentId === id).length;
    storage.set('environments', storage.get('environments').filter((e) => e.id !== id));
    return { deleted: id, suitesAffected: inUse };
  },
  /** Mock health check: flips between statuses so the control feels alive without any network call. */
  async checkHealth(id) {
    await latency(700);
    const env = storage.get('environments').find((e) => e.id === id);
    if (!env) throw new Error('Environment not found.');
    const status = env.baseUrl.includes('localhost') ? 'Offline' : env.status === 'Offline' ? 'Online' : env.status;
    return this.update(id, { status });
  },
};

export const NotificationService = {
  list() { return clone(storage.get('notifications')); },
  unreadCount() { return storage.get('notifications').filter((n) => !n.read).length; },
  markRead(id) { storage.set('notifications', storage.get('notifications').map((n) => (n.id === id ? { ...n, read: true } : n))); },
  markAllRead() { storage.set('notifications', storage.get('notifications').map((n) => ({ ...n, read: true }))); },
};
