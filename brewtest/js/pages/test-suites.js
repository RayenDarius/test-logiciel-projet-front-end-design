/* Test suites */
import { icon } from '../icons.js';
import { esc, relTime, fmtDateTime, fmtDuration, pct } from '../utils.js';
import { TestSuiteService } from '../services/test-suite-service.js';
import { EnvironmentService } from '../services/project-service.js';
import { RunController } from '../services/run-controller.js';
import { BROWSERS, SUITE_TYPES } from '../data/mock-data.js';
import { pageHeader, suiteStatusBadge, envStatusBadge, browserName, idChip, validationBadge, executionBadge, runProgressHtml, emptyState, resultBadge } from '../components/ui.js';
import { effectiveResult } from '../services/test-case-service.js';
import { openModal } from '../components/modal.js';
import { openDrawer } from '../components/drawer.js';
import { toast } from '../components/toast.js';
import { field, options, liveValidate, validateForm } from '../components/form.js';
import { state } from '../state.js';

export default {
  async render(el, ctx) {
    let suites = await TestSuiteService.list();
    let envs = await EnvironmentService.list();
    let drawer = null; // { id, layer }

    el.innerHTML = `
      ${pageHeader({
        title: 'Test Suites',
        sub: 'Organize test cases into testing suites.',
        actions: `<button type="button" class="btn btn-primary" data-new>${icon('plus')}New suite</button>`,
      })}
      <div class="notice no-print" style="margin-bottom:20px">${icon('info')}<span><strong>Runs are simulated.</strong> BrewTest generates sample results in your browser. No real browser or Selenium test is launched in this version.</span></div>
      <div class="grid grid-2 suite-grid" id="suite-grid"></div>`;

    const grid = el.querySelector('#suite-grid');

    function card(s) {
      const last = s.lastExecution;
      const total = last ? last.total || 1 : 1;
      return `
        <article class="card card-hover suite-card" tabindex="0" role="button" data-suite="${esc(s.id)}" aria-label="Open ${esc(s.name)}">
          <div class="suite-top">
            <span class="suite-icon">${icon(SUITE_TYPES[s.type]?.icon ?? 'layers', 'icon-lg')}</span>
            <div class="grow">
              <h2 class="suite-name">${esc(s.name)}</h2>
              <div class="text-sm text-muted">${idChip(s.id)}</div>
            </div>
            ${suiteStatusBadge(s.status)}
          </div>
          <p class="suite-desc">${esc(s.description)}</p>
          <div class="suite-bar" aria-hidden="true">
            ${last ? `<div class="stacked-bar"><span class="s-pass" style="width:${pct(last.passed, total)}%"></span><span class="s-fail" style="width:${pct(last.failed, total)}%"></span><span class="s-skip" style="width:${pct(last.skipped, total)}%"></span></div>`
              : '<div class="stacked-bar"></div>'}
          </div>
          <dl class="suite-facts">
            <div><dt>Test cases</dt><dd class="mono-num">${s.testCaseCount}</dd></div>
            <div><dt>Last execution</dt><dd>${relTime(s.lastRunAt)}</dd></div>
            <div><dt>Environment</dt><dd>${esc(s.environment?.name ?? 'None')}</dd></div>
          </dl>
        </article>`;
    }

    function drawGrid() {
      grid.innerHTML = suites.length ? suites.map(card).join('')
        : `<div class="card" style="grid-column:1/-1">${emptyState({ iconName: 'layers', title: 'No suites yet', text: 'Create a suite to group test cases that run together.', actionHtml: `<button type="button" class="btn btn-primary" data-new>${icon('plus')}New suite</button>` })}</div>`;
    }

    async function reloadAll() {
      suites = await TestSuiteService.list();
      envs = await EnvironmentService.list();
      drawGrid();
      state.emit('data');
      if (drawer) renderDrawerBody();
    }

    /* ---- Drawer ---- */
    async function drawerBodyHtml(id) {
      const s = suites.find((x) => x.id === id);
      const [cases, history] = await Promise.all([TestSuiteService.getTestCases(id), TestSuiteService.getExecutionHistory(id)]);
      const run = RunController.current;
      const showRun = run && run.suiteId === id;
      const busy = RunController.isRunning;
      const offline = s.environment?.status === 'Offline';
      return `
        <div class="meta-grid">
          <div class="meta-item"><div class="k">Status</div><div class="v">${suiteStatusBadge(s.status)}</div></div>
          <div class="meta-item"><div class="k">Last execution</div><div class="v">${s.lastRunAt ? fmtDateTime(s.lastRunAt) : 'Never'}</div></div>
          <div class="meta-item"><div class="k">Test cases</div><div class="v"><span class="mono-num">${s.testCaseCount}</span> <span class="text-muted text-sm">(${s.validatedCount} validated)</span></div></div>
          <div class="meta-item"><div class="k">Environment</div><div class="v">${esc(s.environment?.name ?? 'None')} ${s.environment ? envStatusBadge(s.environment.status) : ''}</div></div>
        </div>
        <section class="detail-section"><h4>Description</h4><p>${esc(s.description)}</p></section>

        <section class="detail-section run-section">
          <h4>Run this suite</h4>
          <div class="notice" style="margin-bottom:14px">${icon('info')}<span><strong>Simulated execution.</strong> Results are generated locally from sample data. Only validated test cases are included.</span></div>
          ${offline ? `<div class="notice warn" style="margin-bottom:14px">${icon('triangle-alert')}<span>${esc(s.environment.name)} is offline. The simulation still works, but a real run would fail.</span></div>` : ''}
          <div class="row row-wrap" style="gap:12px">
            <div class="field" style="min-width:170px">
              <label for="run-browser">Browser</label>
              <select class="select" id="run-browser">${s.browsers.map((b) => `<option value="${esc(b)}">${esc(browserName(b))}</option>`).join('')}</select>
            </div>
            <button type="button" class="btn btn-primary" style="align-self:flex-end" data-run ${busy || !s.validatedCount ? 'disabled' : ''}>${icon('play')}Run suite (simulated)</button>
          </div>
          ${!s.validatedCount ? '<p class="text-sm text-muted" style="margin-top:10px">Approve at least one test case in this suite to run it.</p>' : ''}
          ${busy && !showRun ? '<p class="text-sm text-muted" style="margin-top:10px">Another simulated run is in progress.</p>' : ''}
          <div id="run-slot" style="margin-top:14px">${showRun ? runProgressHtml(run) : ''}</div>
        </section>

        <section class="detail-section"><h4>Browser and environment configuration</h4>
          <div class="config-grid">
            <div><div class="k">Base URL</div><div class="mono-cell text-sm">${esc(s.environment?.baseUrl ?? '—')}</div></div>
            <div><div class="k">Browsers</div><div class="row row-wrap" style="gap:6px">${s.browsers.map((b) => `<span class="tag">${esc(browserName(b))}</span>`).join('')}</div></div>
          </div>
          <button type="button" class="link-btn" data-config style="margin-top:8px">${icon('pencil', 'icon-sm')}Edit configuration</button>
        </section>

        <section class="detail-section"><h4>Associated test cases (${cases.length})</h4>
          ${cases.length ? `<div class="stack-sm">${cases.slice(0, 8).map((t) => `
            <a class="linked-item" href="#/test-cases/${esc(t.id)}" data-close-drawer>${idChip(t.id)}<span class="grow truncate">${esc(t.title)}</span>${validationBadge(t.status)}</a>`).join('')}
            ${cases.length > 8 ? '<a class="link-btn" href="#/test-cases" data-close-drawer>View all in Test Cases</a>' : ''}</div>`
            : '<p class="text-muted">No test cases are assigned to this suite yet. Choose this suite when adding a test case.</p>'}
        </section>

        <section class="detail-section"><h4>Execution history</h4>
          ${history.length ? `<div class="table-wrap"><table class="table compact" style="min-width:480px">
            <thead><tr><th scope="col">Run</th><th scope="col">Browser</th><th scope="col">Result</th><th scope="col">Duration</th><th scope="col">When</th></tr></thead>
            <tbody>${history.slice(0, 6).map((h) => `<tr>
              <td>${idChip(h.id)}</td><td>${esc(browserName(h.browser))}</td>
              <td><span class="mono-cell"><span style="color:var(--color-success)">${h.passed}</span> / <span style="color:var(--color-error)">${h.failed}</span> / <span style="color:var(--color-warning)">${h.skipped}</span></span></td>
              <td class="mono-cell">${fmtDuration(h.durationMs)}</td><td class="text-muted text-sm">${relTime(h.startedAt)}</td></tr>`).join('')}</tbody>
          </table></div><p class="text-xs text-muted" style="margin-top:8px">Result shows passed / failed / skipped. All runs are simulated.</p>`
            : '<p class="text-muted">This suite has not been run yet.</p>'}
        </section>`;
    }

    async function renderDrawerBody() {
      if (!drawer) return;
      const html = await drawerBodyHtml(drawer.id);
      if (drawer) drawer.layer.setBody(html);
    }

    async function openDetails(id) {
      const s = suites.find((x) => x.id === id);
      if (!s) { toast.error('Suite not found', `${id} does not exist in this project.`); return; }
      const body = await drawerBodyHtml(id);
      const layer = openDrawer({
        title: s.name, meta: `${idChip(s.id)}${suiteStatusBadge(s.status)}`, body,
        onClose: () => { drawer = null; },
        onOpen(node, l) {
          node.addEventListener('click', async (e) => {
            if (e.target.closest('[data-close-drawer]')) l.close({ instant: true, skipFocus: true });
            if (e.target.closest('[data-config]')) { l.close({ instant: true, skipFocus: true }); openSuiteForm(s); }
            if (e.target.closest('[data-run]')) {
              const browser = node.querySelector('#run-browser').value;
              RunController.start({ suiteId: s.id, browser, environmentId: s.environmentId })
                .catch((err) => toast.error('Could not start the run', err.message));
              renderDrawerBody();
            }
          });
        },
      });
      drawer = { id, layer };
    }

    /* ---- Live run progress ---- */
    let lastWasRunning = false;
    const off = RunController.subscribe((run) => {
      const slot = drawer?.layer.el.querySelector('#run-slot');
      if (slot && run && run.suiteId === drawer.id) slot.innerHTML = runProgressHtml(run);
      if (run && !run.running && lastWasRunning) {
        lastWasRunning = false;
        if (run.error) toast.error('Simulation stopped', run.error.message);
        else if (run.result) {
          const r = run.result;
          (r.failed ? toast.warning : toast.success)(`Simulated run ${r.id} ${r.status === 'Cancelled' ? 'cancelled' : 'finished'}`, `${r.passed} passed, ${r.failed} failed, ${r.skipped} skipped.`);
        }
        reloadAll();
      }
      if (run?.running) lastWasRunning = true;
    });

    /* ---- New / edit suite ---- */
    function openSuiteForm(suite) {
      const editing = Boolean(suite);
      openModal({
        title: editing ? `Edit ${suite.name}` : 'New suite',
        subtitle: editing ? 'Change where and how this suite runs.' : 'A suite groups test cases that run together.',
        body: `
          <form id="suite-form" class="form-grid" novalidate>
            ${field({ id: 'f-name', label: 'Suite name', required: true, span2: true, control: `<input class="input" id="f-name" name="name" required minlength="3" maxlength="60" value="${esc(suite?.name ?? '')}" placeholder="For example, Accessibility Testing">` })}
            ${field({ id: 'f-desc', label: 'Description', required: true, span2: true, control: `<textarea class="textarea" id="f-desc" name="description" required minlength="10" rows="2" placeholder="What does this suite check?">${esc(suite?.description ?? '')}</textarea>` })}
            ${editing ? '' : field({ id: 'f-type', label: 'Suite category', control: `<select class="select" id="f-type" name="type">${options(Object.entries(SUITE_TYPES).map(([k, v]) => [k, v.name]), 'functional')}</select>` })}
            ${field({ id: 'f-env', label: 'Environment', required: true, control: `<select class="select" id="f-env" name="environmentId" required>${options(envs.map((e) => [e.id, e.name]), suite?.environmentId ?? envs[0]?.id)}</select>` })}
            <fieldset class="field span-2 check-group">
              <legend class="label">Browsers<span class="req" aria-hidden="true">*</span></legend>
              <div class="row row-wrap" style="gap:18px">${BROWSERS.map((b) => `<label class="check"><input type="checkbox" name="browsers" value="${b.id}" ${(suite?.browsers ?? ['chrome']).includes(b.id) ? 'checked' : ''}>${esc(b.name)}</label>`).join('')}</div>
              <span class="error-msg" id="browsers-error" role="alert">${icon('circle-alert', 'icon-sm')}<span data-msg>Choose at least one browser.</span></span>
            </fieldset>
          </form>`,
        footer: `<button type="button" class="btn btn-secondary" data-close>Cancel</button>
                 <button type="submit" form="suite-form" class="btn btn-primary">${icon('check')}${editing ? 'Save changes' : 'Create suite'}</button>`,
        onOpen(node, layer) {
          const form = node.querySelector('#suite-form');
          liveValidate(form);
          const group = node.querySelector('.check-group');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const okFields = validateForm(form);
            const browsers = [...form.querySelectorAll('[name="browsers"]:checked')].map((c) => c.value);
            group.classList.toggle('has-error', !browsers.length);
            if (!okFields || !browsers.length) return;
            const data = { name: form.elements.name.value, description: form.elements.description.value, environmentId: form.elements.environmentId.value, browsers };
            try {
              if (editing) { await TestSuiteService.updateTestSuite(suite.id, { ...data, name: data.name.trim(), description: data.description.trim() }); toast.success('Suite updated', `${data.name.trim()} was saved.`); }
              else { await TestSuiteService.createTestSuite({ ...data, type: form.elements.type.value }); toast.success('Suite created', `${data.name.trim()} is ready for test cases.`); }
              layer.close();
              await reloadAll();
            } catch (err) { toast.error('Could not save the suite', err.message); }
          });
        },
      });
    }

    /* ---- Wiring ---- */
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-new]')) { openSuiteForm(); return; }
      const c = e.target.closest('[data-suite]');
      if (c) openDetails(c.dataset.suite);
    });
    el.addEventListener('keydown', (e) => {
      const c = e.target.closest?.('[data-suite]');
      if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetails(c.dataset.suite); }
    });

    drawGrid();
    if (ctx.param) openDetails(ctx.param);
    return () => off();
  },
};
