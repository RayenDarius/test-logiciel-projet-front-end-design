/* Settings */
import { icon } from '../icons.js';
import { esc, initials } from '../utils.js';
import { state } from '../state.js';
import { BROWSERS } from '../data/mock-data.js';
import { EnvironmentService } from '../services/project-service.js';
import { pageHeader } from '../components/ui.js';
import { toast } from '../components/toast.js';
import { field, options, liveValidate, validateForm } from '../components/form.js';

const toggle = (id, name, label, desc, checked) => `
  <div class="setting-row">
    <div><label for="${id}" class="setting-label">${esc(label)}</label><p class="setting-desc">${esc(desc)}</p></div>
    <span class="switch"><input type="checkbox" id="${id}" name="${name}" ${checked ? 'checked' : ''} role="switch"><span class="track"></span></span>
  </div>`;

export default {
  async render(el) {
    const s = state.settings;
    const envs = EnvironmentService.getSync();

    el.innerHTML = `
      ${pageHeader({ title: 'Settings', sub: 'Personalize BrewTest and set defaults for new test runs.' })}
      <div class="settings-layout">
        <nav class="settings-nav card" aria-label="Settings sections">
          ${[['profile', 'User profile', 'user'], ['appearance', 'Appearance', 'palette'], ['notifications', 'Notifications', 'bell'], ['defaults', 'Test defaults', 'flask-conical'], ['browsers', 'Browser preferences', 'globe']]
            .map(([id, l, i]) => `<a href="#settings-${id}" data-jump="${id}">${icon(i)}${l}</a>`).join('')}
        </nav>
        <div class="stack settings-sections">

          <section class="card" id="settings-profile" aria-labelledby="h-profile">
            <div class="card-header"><div><h2 class="card-title" id="h-profile">User profile</h2><p class="card-sub">Shown in the sidebar and on reports you generate.</p></div></div>
            <form class="card-body" id="form-profile" novalidate>
              <div class="row" style="gap:16px;margin-bottom:20px"><span class="avatar avatar-lg" id="prof-avatar" aria-hidden="true">${esc(initials(s.profile.name))}</span><div class="text-sm text-muted">Your avatar uses your initials.</div></div>
              <div class="form-grid">
                ${field({ id: 's-name', label: 'Full name', required: true, control: `<input class="input" id="s-name" name="name" required minlength="2" maxlength="60" autocomplete="name" value="${esc(s.profile.name)}">` })}
                ${field({ id: 's-role', label: 'Role', required: true, control: `<input class="input" id="s-role" name="role" required maxlength="40" value="${esc(s.profile.role)}">` })}
                ${field({ id: 's-email', label: 'Email', required: true, control: `<input class="input" id="s-email" name="email" type="email" required autocomplete="email" value="${esc(s.profile.email)}">` })}
                ${field({ id: 's-tz', label: 'Time zone', control: `<select class="select" id="s-tz" name="timezone">${options(['Africa/Lagos', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'], s.profile.timezone)}</select>` })}
              </div>
              <div class="form-actions"><button type="submit" class="btn btn-primary">${icon('check')}Save profile</button></div>
            </form>
          </section>

          <section class="card" id="settings-appearance" aria-labelledby="h-appearance">
            <div class="card-header"><div><h2 class="card-title" id="h-appearance">Appearance</h2><p class="card-sub">Changes apply straight away.</p></div></div>
            <div class="card-body">
              <div class="setting-row"><div><span class="setting-label" id="lbl-theme">Theme</span><p class="setting-desc">Light is the default. Dark keeps the espresso sidebar.</p></div>
                <div class="seg" role="group" aria-labelledby="lbl-theme" id="seg-theme">
                  ${[['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'System', 'monitor']].map(([v, l, i]) => `<button type="button" data-theme="${v}" aria-pressed="${s.appearance.theme === v}">${l}</button>`).join('')}
                </div></div>
              <div class="setting-row"><div><span class="setting-label" id="lbl-density">Table density</span><p class="setting-desc">Compact fits more rows on screen.</p></div>
                <div class="seg" role="group" aria-labelledby="lbl-density" id="seg-density">
                  ${[['comfortable', 'Comfortable'], ['compact', 'Compact']].map(([v, l]) => `<button type="button" data-density="${v}" aria-pressed="${s.appearance.density === v}">${l}</button>`).join('')}
                </div></div>
              <form id="form-appearance">
                ${toggle('a-motion', 'reducedMotion', 'Reduce motion', 'Turns off transitions and chart animations. BrewTest also follows your system setting.', s.appearance.reducedMotion)}
                ${toggle('a-sidebar', 'sidebarCollapsed', 'Collapse sidebar by default', 'Shows icons only on large screens.', s.appearance.sidebarCollapsed)}
              </form>
            </div>
          </section>

          <section class="card" id="settings-notifications" aria-labelledby="h-notif">
            <div class="card-header"><div><h2 class="card-title" id="h-notif">Notification preferences</h2><p class="card-sub">Choose what BrewTest tells you about.</p></div></div>
            <form class="card-body" id="form-notifications">
              ${toggle('n-complete', 'executionComplete', 'Run completed', 'When a simulated run finishes with every test passing.', s.notifications.executionComplete)}
              ${toggle('n-failed', 'executionFailed', 'Run failed', 'When a simulated run finishes with one or more failures.', s.notifications.executionFailed)}
              ${toggle('n-req', 'requirementChanges', 'Requirement changes', 'When a teammate edits or moves a requirement.', s.notifications.requirementChanges)}
              ${toggle('n-digest', 'weeklyDigest', 'Weekly digest', 'A Monday summary of last week’s results.', s.notifications.weeklyDigest)}
              ${toggle('n-inapp', 'inApp', 'In-app notifications', 'Show alerts in the bell menu.', s.notifications.inApp)}
              ${toggle('n-email', 'email', 'Email notifications', 'Send alerts to your email address.', s.notifications.email)}
            </form>
          </section>

          <section class="card" id="settings-defaults" aria-labelledby="h-defaults">
            <div class="card-header"><div><h2 class="card-title" id="h-defaults">Test defaults</h2><p class="card-sub">Used when you start a new simulated run.</p></div></div>
            <form class="card-body" id="form-defaults" novalidate>
              <div class="form-grid">
                ${field({ id: 'd-browser', label: 'Default browser', control: `<select class="select" id="d-browser" name="browser">${options(BROWSERS.map((b) => [b.id, b.name]), s.testDefaults.browser)}</select>` })}
                ${field({ id: 'd-env', label: 'Default environment', control: `<select class="select" id="d-env" name="environmentId">${options(envs.map((e) => [e.id, e.name]), s.testDefaults.environmentId)}</select>` })}
                ${field({ id: 'd-timeout', label: 'Timeout per test (seconds)', required: true, hint: 'Between 5 and 300.', control: `<input class="input mono-input" id="d-timeout" name="timeoutSeconds" type="number" min="5" max="300" step="1" required value="${s.testDefaults.timeoutSeconds}">` })}
                ${field({ id: 'd-retries', label: 'Retries for failed tests', required: true, hint: 'Between 0 and 3.', control: `<input class="input mono-input" id="d-retries" name="retries" type="number" min="0" max="3" step="1" required value="${s.testDefaults.retries}">` })}
              </div>
              <div style="margin-top:8px">
                ${toggle('d-shot', 'screenshotOnFailure', 'Capture a screenshot on failure', 'Simulated runs note where a screenshot would be saved.', s.testDefaults.screenshotOnFailure)}
                ${toggle('d-stop', 'stopOnFirstFailure', 'Stop after the first failure', 'Remaining tests are marked as skipped.', s.testDefaults.stopOnFirstFailure)}
              </div>
              <div class="form-actions"><button type="submit" class="btn btn-primary">${icon('check')}Save defaults</button></div>
            </form>
          </section>

          <section class="card" id="settings-browsers" aria-labelledby="h-browsers">
            <div class="card-header"><div><h2 class="card-title" id="h-browsers">Browser preferences</h2><p class="card-sub">Browsers offered when you run a suite.</p></div></div>
            <form class="card-body" id="form-browsers" novalidate>
              <fieldset class="field check-group"><legend class="label">Enabled browsers</legend>
                <div class="browser-grid">${BROWSERS.map((b) => `<label class="browser-opt"><input type="checkbox" name="enabled" value="${b.id}" ${s.browsers.enabled.includes(b.id) ? 'checked' : ''}><span><b>${esc(b.name)}</b><small>Version ${esc(b.version)}</small></span></label>`).join('')}</div>
                <span class="error-msg" role="alert">${icon('circle-alert', 'icon-sm')}<span data-msg>Keep at least one browser enabled.</span></span>
              </fieldset>
              <div class="form-grid" style="margin-top:16px">
                ${field({ id: 'b-viewport', label: 'Default viewport', control: `<select class="select" id="b-viewport" name="viewport">${options([['1920x1080', '1920 × 1080 (Desktop)'], ['1440x900', '1440 × 900 (Laptop)'], ['1024x768', '1024 × 768 (Small laptop)'], ['768x1024', '768 × 1024 (Tablet)'], ['375x812', '375 × 812 (Mobile)']], s.browsers.viewport)}</select>` })}
              </div>
              ${toggle('b-headless', 'headless', 'Headless mode', 'Run without a visible browser window.', s.browsers.headless)}
              <div class="form-actions"><button type="submit" class="btn btn-primary">${icon('check')}Save browser preferences</button></div>
            </form>
          </section>
        </div>
      </div>`;

    /* Section jump links without disturbing the hash router */
    el.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      el.querySelector(`#settings-${a.dataset.jump}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    /* Profile */
    const profile = el.querySelector('#form-profile');
    liveValidate(profile);
    profile.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(profile)) return;
      state.updateSettings({ profile: { name: profile.elements.name.value.trim(), role: profile.elements.role.value.trim(), email: profile.elements.email.value.trim(), timezone: profile.elements.timezone.value } });
      toast.success('Profile saved', 'Your name and role are updated across BrewTest.');
    });

    /* Appearance: apply immediately */
    el.querySelector('#seg-theme').addEventListener('click', (e) => {
      const b = e.target.closest('[data-theme]'); if (!b) return;
      state.updateSettings({ appearance: { theme: b.dataset.theme } });
      toast.success('Theme changed', `Using the ${b.dataset.theme} theme.`);
    });
    el.querySelector('#seg-density').addEventListener('click', (e) => {
      const b = e.target.closest('[data-density]'); if (!b) return;
      state.updateSettings({ appearance: { density: b.dataset.density } });
    });
    el.querySelector('#form-appearance').addEventListener('change', (e) => {
      state.updateSettings({ appearance: { [e.target.name]: e.target.checked } });
      toast.success('Preference saved', e.target.name === 'reducedMotion' ? (e.target.checked ? 'Motion is reduced.' : 'Motion is on.') : 'Sidebar default updated.');
    });

    /* Notifications: save on change */
    el.querySelector('#form-notifications').addEventListener('change', (e) => {
      state.updateSettings({ notifications: { [e.target.name]: e.target.checked } });
      toast.success('Notification preference saved');
    });

    /* Defaults */
    const defaults = el.querySelector('#form-defaults');
    liveValidate(defaults);
    defaults.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(defaults)) return;
      const f = defaults.elements;
      state.updateSettings({ testDefaults: { browser: f.browser.value, environmentId: f.environmentId.value, timeoutSeconds: Number(f.timeoutSeconds.value), retries: Number(f.retries.value), screenshotOnFailure: f.screenshotOnFailure.checked, stopOnFirstFailure: f.stopOnFirstFailure.checked } });
      toast.success('Test defaults saved', 'New runs will use these values.');
    });

    /* Browsers */
    const br = el.querySelector('#form-browsers');
    liveValidate(br);
    br.addEventListener('submit', (e) => {
      e.preventDefault();
      const enabled = [...br.querySelectorAll('[name="enabled"]:checked')].map((c) => c.value);
      br.querySelector('.check-group').classList.toggle('has-error', !enabled.length);
      if (!enabled.length) return;
      state.updateSettings({ browsers: { enabled, headless: br.elements.headless.checked, viewport: br.elements.viewport.value } });
      toast.success('Browser preferences saved', `${enabled.length} browser${enabled.length === 1 ? '' : 's'} enabled.`);
    });
  },
};
