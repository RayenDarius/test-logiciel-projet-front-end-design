/* localStorage-backed persistence. A future API client can replace this module. */
import { createSeed } from '../data/mock-data.js';

const PREFIX = 'brewtest:v1:';
const COLLECTIONS = ['projects', 'environments', 'requirements', 'testCases', 'suites', 'executions', 'reports', 'notifications'];
const VALUES = ['settings', 'activeProjectId'];

let cache = null;
let memoryOnly = false;

function read(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function write(key, value) {
  if (memoryOnly) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    memoryOnly = true;
    console.warn('BrewTest: localStorage unavailable, changes will not persist.', err);
  }
}

export const storage = {
  /** Load all data, seeding it on first run or when stored data is unreadable. */
  init() {
    if (cache) return cache;
    const loaded = {};
    let ok = true;
    for (const key of [...COLLECTIONS, ...VALUES]) {
      const v = read(key);
      if (v === undefined) { ok = false; break; }
      loaded[key] = v;
    }
    if (ok && Array.isArray(loaded.testCases)) {
      cache = loaded;
    } else {
      cache = createSeed();
      for (const key of [...COLLECTIONS, ...VALUES]) write(key, cache[key]);
    }
    return cache;
  },

  get(key) {
    return this.init()[key];
  },

  set(key, value) {
    this.init()[key] = value;
    write(key, value);
    return value;
  },

  /** Wipe everything and re-seed. Used by "Reset demo data". */
  reset() {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    cache = null;
    return this.init();
  },
};

/** Small helpers shared by the services */
export const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const nowIso = () => new Date().toISOString();
export const clone = (v) => JSON.parse(JSON.stringify(v));
/** Simulates network latency so loading states are visible. Replace with fetch() later. */
export const latency = (ms = 160) => new Promise((r) => setTimeout(r, ms));

export function nextNumberedId(prefix, existingIds) {
  const max = existingIds.reduce((m, id) => {
    const n = parseInt(String(id).replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}
