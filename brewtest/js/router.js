/* Lightweight hash router: #/route or #/route/param. Pages are loaded lazily as ES modules. */
import { destroyAllCharts } from './components/charts.js';
import { closeAllLayers } from './components/layers.js';
import { pageSkeleton, emptyState } from './components/ui.js';
import { icon } from './icons.js';
import { esc } from './utils.js';

export const ROUTES = {
  dashboard: { title: 'Overview', module: './pages/dashboard.js' },
  requirements: { title: 'Requirements', module: './pages/requirements.js' },
  'test-cases': { title: 'Test Cases', module: './pages/test-cases.js' },
  'test-suites': { title: 'Test Suites', module: './pages/test-suites.js' },
  execution: { title: 'Test Execution', module: './pages/execution.js' },
  reports: { title: 'Reports', module: './pages/reports.js' },
  projects: { title: 'Projects', section: 'Management', module: './pages/projects.js' },
  environments: { title: 'Test Environments', section: 'Management', module: './pages/environments.js' },
  settings: { title: 'Settings', section: 'Preferences', module: './pages/settings.js' },
};

const SECTION_DEFAULT = 'Workspace';
let cleanup = null;
let token = 0;
let hooks = {};

export function parseHash() {
  const [, route = 'dashboard', param = ''] = window.location.hash.replace(/^#/, '').split('/');
  return { route: ROUTES[route] ? route : null, raw: route, param: decodeURIComponent(param) };
}

export const navigate = (path) => { window.location.hash = `#/${path}`; };

export async function renderRoute() {
  const view = document.getElementById('view');
  const { route, raw, param } = parseHash();
  const mine = ++token;

  cleanup?.();
  cleanup = null;
  destroyAllCharts();
  closeAllLayers();

  if (!route) {
    hooks.onRoute?.('dashboard', [{ text: 'Not found' }]);
    document.title = 'Page not found · BrewTest';
    view.innerHTML = `<div class="page">${emptyState({
      iconName: 'search', error: true, title: 'This page does not exist',
      text: `There is no page called “${esc(raw)}”. Pick a page from the sidebar or return to the overview.`,
      actionHtml: '<a class="btn btn-primary" href="#/dashboard">Back to overview</a>',
    })}</div>`;
    return;
  }

  const def = ROUTES[route];
  hooks.onRoute?.(route, [{ text: def.section ?? SECTION_DEFAULT, href: '#/dashboard' }, { text: def.title }]);
  document.title = `${def.title} · BrewTest`;
  view.innerHTML = pageSkeleton();

  try {
    const mod = await import(def.module);
    if (mine !== token) return;
    const page = mod.default;
    view.innerHTML = '<div class="page" id="page"></div>';
    const result = await page.render(view.querySelector('#page'), { param, route });
    if (mine !== token) { result?.(); return; }
    cleanup = typeof result === 'function' ? result : null;
    window.scrollTo({ top: 0 });
    view.focus({ preventScroll: true });
  } catch (err) {
    console.error(`BrewTest: failed to render "${route}"`, err);
    if (mine !== token) return;
    view.innerHTML = `<div class="page">${emptyState({
      iconName: 'triangle-alert', error: true, title: 'This page could not load',
      text: 'Something went wrong while preparing the page. Try again, and reset the demo data from the account menu if it keeps happening.',
      actionHtml: `<button type="button" class="btn btn-primary" data-retry>${icon('rotate-cw')}Try again</button>`,
    })}</div>`;
    view.querySelector('[data-retry]')?.addEventListener('click', renderRoute);
  }
}

export function startRouter(h) {
  hooks = h;
  window.addEventListener('hashchange', renderRoute);
  if (!window.location.hash) window.location.hash = '#/dashboard';
  else renderRoute();
}
