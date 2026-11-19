/* BrewTest application bootstrap */
import { storage } from './services/storage-service.js';
import { state } from './state.js';
import { mountSidebar } from './components/sidebar.js';
import { mountTopbar } from './components/topbar.js';
import { startRouter, renderRoute } from './router.js';
import { toast } from './components/toast.js';

const root = document.documentElement;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

/** Applies theme, density and motion preferences to the document */
export function applyAppearance() {
  const { theme, density, reducedMotion } = state.settings.appearance;
  const dark = theme === 'dark' || (theme === 'system' && systemDark.matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.density = density;
  if (reducedMotion) root.dataset.motion = 'reduced'; else delete root.dataset.motion;
}

function boot() {
  storage.init();
  applyAppearance();

  const app = document.getElementById('app');
  const sidebar = mountSidebar(app);
  const topbar = mountTopbar({
    onThemeToggle() {
      const dark = root.dataset.theme === 'dark';
      state.updateSettings({ appearance: { theme: dark ? 'light' : 'dark' } });
    },
  });

  state.on('settings', () => {
    applyAppearance();
    sidebar.refresh();
    topbar.render();
    renderRoute();
  });
  state.on('project', () => { sidebar.refresh(); topbar.render(); renderRoute(); });
  systemDark.addEventListener('change', () => { if (state.settings.appearance.theme === 'system') { applyAppearance(); topbar.render(); renderRoute(); } });

  /* Pages can ask the shell to refresh counts / notifications after data changes */
  state.on('data', () => { sidebar.refresh(); topbar.render(); });

  startRouter({
    onRoute(route, crumbs) {
      sidebar.setActive(route);
      topbar.setCrumbs(crumbs);
    },
  });
}

try {
  boot();
} catch (err) {
  console.error('BrewTest failed to start', err);
  document.getElementById('view').innerHTML = `
    <div class="empty is-error" style="padding:80px 24px">
      <h3>BrewTest could not start</h3>
      <p>Stored data may be damaged. Clear this site’s data or reset it, then reload.</p>
      <button type="button" class="btn btn-primary" id="hard-reset">Reset demo data</button>
    </div>`;
  document.getElementById('hard-reset')?.addEventListener('click', () => { storage.reset(); location.reload(); });
  toast.error('Start-up failed', 'See the browser console for details.');
}
