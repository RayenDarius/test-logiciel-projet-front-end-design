/* Global search across the active project. */
import { storage } from './storage-service.js';
import { state } from '../state.js';

export const SearchService = {
  search(query, limit = 8) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const pid = state.activeProjectId;
    const hits = [];
    storage.get('requirements').filter((r) => r.projectId === pid).forEach((r) => {
      if (`${r.id} ${r.title}`.toLowerCase().includes(q)) hits.push({ kind: 'Requirement', id: r.id, title: r.title, href: `#/requirements/${r.id}`, icon: 'clipboard-list' });
    });
    storage.get('testCases').filter((t) => t.projectId === pid).forEach((t) => {
      if (`${t.id} ${t.title}`.toLowerCase().includes(q)) hits.push({ kind: 'Test case', id: t.id, title: t.title, href: `#/test-cases/${t.id}`, icon: 'flask-conical' });
    });
    storage.get('suites').filter((s) => s.projectId === pid).forEach((s) => {
      if (s.name.toLowerCase().includes(q)) hits.push({ kind: 'Suite', id: s.id, title: s.name, href: `#/test-suites/${s.id}`, icon: 'layers' });
    });
    return hits.slice(0, limit);
  },
};
