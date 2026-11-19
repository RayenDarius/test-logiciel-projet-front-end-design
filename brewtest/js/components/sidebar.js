/* Sidebar: navigation, collapse (desktop) and off-canvas (tablet / mobile) */
import { icon } from '../icons.js';
import { esc, initials } from '../utils.js';
import { state } from '../state.js';
import { storage } from '../services/storage-service.js';

export const NAV = [
  { label: 'Workspace', items: [
    { route: 'dashboard', text: 'Overview', icon: 'layout-dashboard' },
    { route: 'requirements', text: 'Requirements', icon: 'clipboard-list', count: 'requirements' },
    { route: 'test-cases', text: 'Test Cases', icon: 'flask-conical', count: 'testCases' },
    { route: 'test-suites', text: 'Test Suites', icon: 'layers' },
    { route: 'execution', text: 'Test Execution', icon: 'play' },
    { route: 'reports', text: 'Reports', icon: 'chart-column' },
  ] },
  { label: 'Management', items: [
    { route: 'projects', text: 'Projects', icon: 'folder-kanban' },
    { route: 'environments', text: 'Test Environments', icon: 'server' },
  ] },
  { label: 'Preferences', items: [
    { route: 'settings', text: 'Settings', icon: 'settings' },
  ] },
];

const isDesktop = () => window.matchMedia('(min-width: 1101px)').matches;

export function mountSidebar(app) {
  const aside = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  const counts = () => {
    const pid = state.activeProjectId;
    return {
      requirements: storage.get('requirements').filter((r) => r.projectId === pid).length,
      testCases: storage.get('testCases').filter((t) => t.projectId === pid).length,
    };
  };

  function render(activeRoute) {
    const c = counts();
    const { profile } = state.settings;
    aside.innerHTML = `
      <div class="sidebar-brand">
        <a href="#/dashboard" class="brand-link" aria-label="BrewTest home">
          <span class="brand-mark">${icon('coffee', 'icon-lg')}</span>
          <span class="brand-name">Brew<span>Test</span></span>
        </a>
        <button type="button" class="sidebar-collapse-btn" data-collapse aria-label="Collapse sidebar">${icon('panel-left')}</button>
      </div>
      <nav class="sidebar-nav" aria-label="Main">
        ${NAV.map((s) => `
          <div class="nav-section">
            <div class="nav-label" id="nav-${s.label.toLowerCase()}">${s.label}</div>
            <div role="group" aria-labelledby="nav-${s.label.toLowerCase()}">
              ${s.items.map((i) => `
                <a class="nav-item ${i.route === activeRoute ? 'is-active' : ''}" href="#/${i.route}" ${i.route === activeRoute ? 'aria-current="page"' : ''} title="${esc(i.text)}">
                  ${icon(i.icon)}<span class="label">${esc(i.text)}</span>
                  ${i.count ? `<span class="nav-count">${c[i.count]}</span>` : ''}
                </a>`).join('')}
            </div>
          </div>`).join('')}
      </nav>
      <div class="sidebar-user">
        <span class="avatar" aria-hidden="true">${esc(initials(profile.name))}</span>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${esc(profile.name)}</div>
          <div class="sidebar-user-role">${esc(profile.role)}</div>
        </div>
        <a class="icon-btn" href="#/settings" aria-label="Open settings" title="Settings">${icon('settings')}</a>
      </div>`;
  }

  const setOpen = (open) => {
    app.toggleAttribute('data-sidebar-open', open);
    backdrop.classList.toggle('is-visible', open);
    document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', String(open));
  };

  const setCollapsed = (collapsed) => {
    if (collapsed) app.setAttribute('data-sidebar', 'collapsed'); else app.removeAttribute('data-sidebar');
    state.updateSettings({ appearance: { sidebarCollapsed: collapsed } });
  };

  aside.addEventListener('click', (e) => {
    if (e.target.closest('[data-collapse]')) { setCollapsed(true); return; }
    if (e.target.closest('a')) setOpen(false);
  });
  backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', () => { if (isDesktop()) setOpen(false); });

  /* Expand button lives in the topbar when the sidebar is collapsed */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-sidebar-toggle]');
    if (!t) return;
    if (isDesktop()) setCollapsed(app.getAttribute('data-sidebar') !== 'collapsed');
    else setOpen(!app.hasAttribute('data-sidebar-open'));
  });

  if (state.settings.appearance.sidebarCollapsed && isDesktop()) app.setAttribute('data-sidebar', 'collapsed');

  let active = 'dashboard';
  render(active);
  return {
    setActive(route) { active = route; render(route); },
    refresh() { render(active); },
    close: () => setOpen(false),
  };
}
