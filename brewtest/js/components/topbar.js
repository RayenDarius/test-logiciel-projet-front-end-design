/* Top bar: breadcrumbs, project selector, search, notifications, profile menu */
import { icon } from '../icons.js';
import { esc, initials, relTime, debounce } from '../utils.js';
import { state } from '../state.js';
import { storage } from '../services/storage-service.js';
import { NotificationService } from '../services/project-service.js';
import { SearchService } from '../services/search-service.js';
import { confirmDialog } from './modal.js';
import { toast } from './toast.js';

let openMenu = null;

function closeMenu() {
  if (!openMenu) return;
  openMenu.panel.hidden = true;
  openMenu.trigger.setAttribute('aria-expanded', 'false');
  openMenu = null;
}

function toggleMenu(trigger, panel) {
  const wasOpen = openMenu?.panel === panel;
  closeMenu();
  if (wasOpen) return;
  panel.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  openMenu = { trigger, panel };
}

document.addEventListener('click', (e) => { if (openMenu && !openMenu.panel.parentElement.contains(e.target)) closeMenu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openMenu) { const t = openMenu.trigger; closeMenu(); t.focus(); } });

const TONE_ICON = { error: 'circle-x', success: 'circle-check', warning: 'triangle-alert', info: 'info' };

export function mountTopbar({ onThemeToggle }) {
  const root = document.getElementById('topbar');

  function render() {
    const project = state.activeProject;
    const projects = storage.get('projects');
    const { profile } = state.settings;
    const unread = NotificationService.unreadCount();
    const dark = document.documentElement.dataset.theme === 'dark';
    root.innerHTML = `
      <div class="topbar-left">
        <button type="button" class="icon-btn menu-toggle-btn" data-sidebar-toggle aria-label="Toggle navigation" aria-expanded="false">${icon('menu')}</button>
        <nav class="breadcrumbs" aria-label="Breadcrumb"><ol id="breadcrumbs"></ol></nav>
      </div>
      <div class="topbar-right">
        <div class="global-search" role="search">
          ${icon('search')}
          <input type="search" id="global-search" class="input" placeholder="Search…" aria-label="Search requirements, test cases and suites" autocomplete="off">
          <span class="kbd" aria-hidden="true">/</span>
          <div class="search-results" id="search-results" hidden></div>
        </div>

        <div class="dropdown">
          <button type="button" class="project-select" data-menu="project" aria-haspopup="true" aria-expanded="false" aria-label="Current project: ${esc(project?.name ?? 'None')}">
            ${icon('folder')}<span class="project-name">${esc(project?.name ?? 'No project')}</span>${icon('chevrons-up-down', 'icon-sm')}
          </button>
          <div class="menu" data-panel="project" hidden>
            <div class="menu-label">Switch project</div>
            ${projects.map((p) => `
              <button type="button" class="menu-item ${p.id === project?.id ? 'is-selected' : ''}" data-project="${esc(p.id)}">
                ${icon(p.id === project?.id ? 'check' : 'folder')}<span class="truncate">${esc(p.name)}</span>
              </button>`).join('')}
            <div class="menu-sep"></div>
            <a class="menu-item" href="#/projects">${icon('folder-kanban')}Manage projects</a>
          </div>
        </div>

        <div class="dropdown">
          <button type="button" class="icon-btn" data-menu="notifications" aria-haspopup="true" aria-expanded="false" aria-label="Notifications${unread ? `, ${unread} unread` : ''}">
            ${icon('bell')}${unread ? '<span class="dot"></span>' : ''}
          </button>
          <div class="menu notif-menu" data-panel="notifications" hidden>
            <div class="menu-head row row-between">
              <strong>Notifications</strong>
              <button type="button" class="link-btn" data-mark-read ${unread ? '' : 'disabled'}>Mark all as read</button>
            </div>
            <div class="notif-list">
              ${NotificationService.list().map((n) => `
                <a class="notif ${n.read ? '' : 'is-unread'}" href="${esc(n.link)}" data-notif="${esc(n.id)}">
                  <span class="notif-icon tone-${n.tone}">${icon(TONE_ICON[n.tone] ?? 'info', 'icon-sm')}</span>
                  <span><span class="notif-title">${esc(n.title)}</span><span class="notif-body">${esc(n.body)}</span><span class="notif-time">${relTime(n.time)}</span></span>
                </a>`).join('') || '<p class="text-muted text-sm" style="padding:16px">You are all caught up.</p>'}
            </div>
          </div>
        </div>

        <div class="dropdown">
          <button type="button" class="profile-btn" data-menu="profile" aria-haspopup="true" aria-expanded="false" aria-label="Account menu for ${esc(profile.name)}">
            <span class="avatar avatar-sm" aria-hidden="true">${esc(initials(profile.name))}</span>${icon('chevron-down', 'icon-sm')}
          </button>
          <div class="menu" data-panel="profile" hidden>
            <div class="menu-head">
              <div class="fw-600">${esc(profile.name)}</div>
              <div class="text-sm text-muted">${esc(profile.email)}</div>
            </div>
            <a class="menu-item" href="#/settings">${icon('user')}Profile settings</a>
            <button type="button" class="menu-item" data-theme-toggle>${icon(dark ? 'sun' : 'moon')}${dark ? 'Switch to light mode' : 'Switch to dark mode'}</button>
            <div class="menu-sep"></div>
            <button type="button" class="menu-item danger" data-reset>${icon('rotate-cw')}Reset demo data</button>
          </div>
        </div>
      </div>`;
    bind();
  }

  function bind() {
    root.querySelectorAll('[data-menu]').forEach((btn) => {
      const panel = root.querySelector(`[data-panel="${btn.dataset.menu}"]`);
      btn.addEventListener('click', () => toggleMenu(btn, panel));
    });
    root.querySelectorAll('[data-project]').forEach((b) => b.addEventListener('click', () => {
      closeMenu();
      if (b.dataset.project === state.activeProjectId) return;
      state.setActiveProject(b.dataset.project);
      toast.success('Project switched', `Now working in ${state.activeProject.name}.`);
    }));
    root.querySelector('[data-mark-read]')?.addEventListener('click', () => { NotificationService.markAllRead(); render(); });
    root.querySelectorAll('[data-notif]').forEach((a) => a.addEventListener('click', () => { NotificationService.markRead(a.dataset.notif); closeMenu(); setTimeout(render, 0); }));
    root.querySelector('[data-theme-toggle]').addEventListener('click', () => { closeMenu(); onThemeToggle(); });
    root.querySelector('[data-reset]').addEventListener('click', async () => {
      closeMenu();
      const ok = await confirmDialog({
        title: 'Reset demo data?', confirmLabel: 'Reset data',
        message: 'This restores the original sample projects, requirements, test cases and executions. Your changes will be lost.',
      });
      if (ok) { storage.reset(); window.location.hash = '#/dashboard'; window.location.reload(); }
    });

    /* Global search */
    const input = root.querySelector('#global-search');
    const results = root.querySelector('#search-results');
    const run = debounce(() => {
      const hits = SearchService.search(input.value);
      if (!input.value.trim()) { results.hidden = true; return; }
      results.hidden = false;
      results.innerHTML = hits.length
        ? hits.map((h) => `<a class="search-hit" href="${esc(h.href)}">${icon(h.icon, 'icon-sm')}<span class="truncate"><span class="id-chip">${esc(h.id)}</span> ${esc(h.title)}</span><span class="text-xs text-muted">${h.kind}</span></a>`).join('')
        : `<p class="text-muted text-sm" style="padding:14px 16px">No matches for “${esc(input.value)}” in this project.</p>`;
    }, 120);
    input.addEventListener('input', run);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { input.value = ''; results.hidden = true; input.blur(); }
      if (e.key === 'Enter') results.querySelector('a')?.click();
    });
    results.addEventListener('click', () => { input.value = ''; results.hidden = true; });
    document.addEventListener('click', (e) => { if (!root.querySelector('.global-search')?.contains(e.target)) results.hidden = true; });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.target.matches('input, textarea, select, [contenteditable]') ) {
      e.preventDefault();
      root.querySelector('#global-search')?.focus();
    }
  });

  render();
  return {
    render,
    setCrumbs(crumbs) {
      const ol = root.querySelector('#breadcrumbs');
      ol.innerHTML = crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return `<li ${last ? 'aria-current="page"' : ''}>${c.href && !last ? `<a href="${c.href}">${esc(c.text)}</a>` : esc(c.text)}${last ? '' : icon('chevron-right', 'icon-sm')}</li>`;
      }).join('');
    },
  };
}
