/* Tiny pub/sub store for UI-level state (active project, settings, notifications). */
import { storage } from './services/storage-service.js';

const listeners = new Map();

export const state = {
  get activeProjectId() { return storage.get('activeProjectId'); },
  get activeProject() {
    return storage.get('projects').find((p) => p.id === this.activeProjectId) ?? storage.get('projects')[0] ?? null;
  },
  get settings() { return storage.get('settings'); },

  setActiveProject(id) {
    storage.set('activeProjectId', id);
    emit('project', id);
  },

  updateSettings(patch) {
    const next = { ...this.settings };
    for (const [k, v] of Object.entries(patch)) next[k] = { ...next[k], ...v };
    storage.set('settings', next);
    emit('settings', next);
    return next;
  },

  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event)?.delete(fn);
  },
  emit,
};

function emit(event, payload) {
  listeners.get(event)?.forEach((fn) => {
    try { fn(payload); } catch (err) { console.error(`state listener for "${event}" failed`, err); }
  });
}
