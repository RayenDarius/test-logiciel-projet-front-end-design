/* Test execution workspace (simulated) */
import { icon } from '../icons.js';
import { esc, fmtDateTime, fmtDuration, fmtSeconds, pct } from '../utils.js';
import { state } from '../state.js';
import { TestSuiteService } from '../services/test-suite-service.js';
import { ExecutionService } from '../services/execution-service.js';
import { EnvironmentService } from '../services/project-service.js';
import { RunController } from '../services/run-controller.js';
import { storage } from '../services/storage-service.js';
import { BROWSERS } from '../data/mock-data.js';
import { pageHeader, executionBadge, resultBadge, idChip, browserName, runProgressHtml, emptyState } from '../components/ui.js';
import { DataTable } from '../components/data-table.js';
import { openDrawer } from '../components/drawer.js';
import { toast } from '../components/toast.js';
import { field, options } from '../components/form.js';

export default {
  async render(el, ctx) {
    const [suites, envs] = await Promise.all([TestSuiteService.list(), EnvironmentService.list()]);
    let history = await ExecutionService.list();
    const defaults = state.settings.testDefaults;
    const enabled = BROWSERS.filter((b) => state.settings.browsers.enabled.includes(b.id));
    const envName = (id) => envs.find((e) => e.id === id)?.name ?? '—';

    el.innerHTML = `
      ${pageHeader({ title: 'Test Execution', sub: 'Run a suite in a simulated environment and review the results.' })}
      <div class="notice" style="margin-bottom:20px">${icon('info')}<span><strong>Simulation only.</strong> No browser is opened and no real test runs. BrewTest generates sample results so you can review the workflow.</span></div>

      <div class="grid exec-grid">
        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Configure run</h2><p class="card-sub">Pick what to simulate</p></div></div>
          <form class="card-body stack" id="run-form" novalidate>
            ${field({ id: 'x-suite', label: 'Test suite', control: `<select class="select" id="x-suite" name="suite">${suites.map((s) => `<option value="${esc(s.id)}">${esc(s.name)} (${s.validatedCount} tests)</option>`).join('')}</select>` })}
            ${field({ id: 'x-browser', label: 'Browser', control: `<select class="select" id="x-browser" name="browser">${options(enabled.map((b) => [b.id, `${b.name} ${b.version}`]), defaults.browser)}</select>` })}
            ${field({ id: 'x-env', label: 'Environment', control: `<select class="select" id="x-env" name="env">${options(envs.map((e) => [e.id, `${e.name} · ${e.status}`]), defaults.environmentId)}</select>` })}
            <div class="row" style="gap:10px">
              <button type="submit" class="btn btn-primary grow" id="run-btn">${icon('play')}Run tests</button>
              <button type="button" class="btn btn-secondary" id="cancel-btn" hidden>${icon('square')}Cancel</button>
            </div>
            <p class="text-xs text-muted" id="run-hint"></p>
          </form>
        </section>

        <section class="card" aria-live="polite">
          <div class="card-header"><div><h2 class="card-title">Live execution</h2><p class="card-sub">Progress of the current simulated run</p></div><span id="live-badge"></span></div>
          <div class="card-body" id="live-slot"></div>
        </section>
      </div>

      <section class="card mt-6">
        <div class="card-header"><div><h2 class="card-title">Execution history</h2><p class="card-sub">Select a row to see test-level results</p></div></div>
        <div id="hist-table" style="margin-top:14px"></div>
      </section>`;

    const form = el.querySelector('#run-form');
    const runBtn = el.querySelector('#run-btn');
    const cancelBtn = el.querySelector('#cancel-btn');
    const liveSlot = el.querySelector('#live-slot');
    const liveBadge = el.querySelector('#live-badge');
    const hint = el.querySelector('#run-hint');

    /* Suite selection drives sensible browser / environment defaults */
    const syncFromSuite = () => {
      const s = suites.find((x) => x.id === form.elements.suite.value);
      if (!s) return;
      form.elements.env.value = s.environmentId;
      if (enabled.some((b) => b.id === s.browsers[0])) form.elements.browser.value = s.browsers[0];
      const runnable = s.validatedCount;
      hint.textContent = runnable ? `${runnable} validated test case${runnable === 1 ? '' : 's'} will be simulated.` : 'This suite has no validated test cases. Approve some in Test Cases first.';
      if (!RunController.isRunning) runBtn.disabled = !runnable;
    };
    form.elements.suite.addEventListener('change', syncFromSuite);

    /* ---- History table ---- */
    const table = new DataTable(el.querySelector('#hist-table'), {
      rowKey: 'id', noun: 'executions', pageSize: 8, caption: 'Execution history', initialSort: { key: 'startedAt', dir: 'desc' },
      columns: [
        { key: 'id', label: 'Execution', sortable: true, render: (x) => idChip(x.id) },
        { key: 'suiteName', label: 'Suite', sortable: true, render: (x) => `<span class="cell-title">${esc(x.suiteName)}</span>` },
        { key: 'browser', label: 'Browser', sortable: true, render: (x) => esc(browserName(x.browser)) },
        { key: 'startedAt', label: 'Start time', sortable: true, sortValue: (x) => new Date(x.startedAt).getTime(), render: (x) => `<span class="text-muted text-sm">${esc(fmtDateTime(x.startedAt))}</span>` },
        { key: 'durationMs', label: 'Duration', sortable: true, className: 'num', render: (x) => fmtDuration(x.durationMs) },
        { key: 'passed', label: 'Passed', sortable: true, className: 'num', render: (x) => `<span style="color:var(--color-success)">${x.passed}</span>` },
        { key: 'failed', label: 'Failed', sortable: true, className: 'num', render: (x) => `<span style="color:${x.failed ? 'var(--color-error)' : 'var(--text-muted)'}">${x.failed}</span>` },
        { key: 'status', label: 'Status', sortable: true, render: (x) => executionBadge(x.status) },
      ],
      rows: history,
      onRowClick: (x) => openResults(x.id),
      emptyHtml: emptyState({ iconName: 'play', title: 'No executions yet', text: 'Choose a suite above and select Run tests to create your first simulated run.' }),
    });

    /* ---- Results drawer ---- */
    async function openResults(id) {
      const ex = await ExecutionService.getExecutionResults(id);
      if (!ex) { toast.error('Execution not found', `${id} does not exist in this project.`); return; }
      const names = new Map(storage.get('testCases').filter((t) => t.projectId === state.activeProjectId).map((t) => [t.id, t.title]));
      const rowsHtml = (filter) => ex.results.filter((r) => !filter || r.s === filter).map((r) => `
        <tr><td>${idChip(r.tc)}</td><td>${esc(names.get(r.tc) ?? r.tc)}</td><td>${resultBadge(r.s)}</td><td class="num">${r.d ? fmtSeconds(r.d) : '—'}</td></tr>`).join('')
        || '<tr><td colspan="4" class="text-muted" style="padding:24px;text-align:center">No results with this status.</td></tr>';
      const total = ex.total || 1;
      openDrawer({
        title: `${ex.suiteName}`, width: 760,
        meta: `${idChip(ex.id)}${executionBadge(ex.status)}<span class="badge badge-info no-dot">Simulated</span>`,
        body: `
          <div class="meta-grid">
            <div class="meta-item"><div class="k">Browser</div><div class="v">${esc(browserName(ex.browser))}</div></div>
            <div class="meta-item"><div class="k">Environment</div><div class="v">${esc(envName(ex.environmentId))}</div></div>
            <div class="meta-item"><div class="k">Started</div><div class="v">${fmtDateTime(ex.startedAt)}</div></div>
            <div class="meta-item"><div class="k">Duration</div><div class="v mono-num">${fmtDuration(ex.durationMs)}</div></div>
          </div>
          <div class="stacked-bar" style="margin-bottom:10px"><span class="s-pass" style="width:${pct(ex.passed, total)}%"></span><span class="s-fail" style="width:${pct(ex.failed, total)}%"></span><span class="s-skip" style="width:${pct(ex.skipped, total)}%"></span></div>
          <div class="legend" style="margin-bottom:18px"><span><i style="background:var(--color-success)"></i>${ex.passed} passed</span><span><i style="background:var(--color-error)"></i>${ex.failed} failed</span><span><i style="background:var(--color-warning)"></i>${ex.skipped} skipped</span></div>
          <div class="row row-between row-wrap" style="margin-bottom:10px">
            <h3 style="font-size:19px">Test results</h3>
            <div class="seg" role="group" aria-label="Filter results">
              ${[['', 'All'], ['failed', 'Failed'], ['passed', 'Passed'], ['skipped', 'Skipped']].map(([v, l], i) => `<button type="button" data-f="${v}" aria-pressed="${i === 0}">${l}</button>`).join('')}
            </div>
          </div>
          <div class="table-wrap result-table"><table class="table compact" style="min-width:520px">
            <thead><tr><th scope="col">Test</th><th scope="col">Name</th><th scope="col">Result</th><th scope="col">Time</th></tr></thead>
            <tbody id="res-body">${rowsHtml('')}</tbody></table></div>`,
        onOpen(node) {
          node.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => {
            node.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            node.querySelector('#res-body').innerHTML = rowsHtml(b.dataset.f);
          }));
        },
      });
    }

    /* ---- Live panel ---- */
    function drawLive(run) {
      const running = Boolean(run?.running);
      runBtn.disabled = running || !suites.find((s) => s.id === form.elements.suite.value)?.validatedCount;
      cancelBtn.hidden = !running;
      runBtn.innerHTML = running ? `${icon('loader', 'spin')}Running…` : `${icon('play')}Run tests`;
      form.querySelectorAll('select').forEach((s) => { s.disabled = running; });

      if (!run) {
        liveBadge.innerHTML = '<span class="badge badge-neutral">Idle</span>';
        liveSlot.innerHTML = `<div class="live-idle">${emptyState({ iconName: 'play', title: 'Nothing is running', text: 'Choose a suite, browser and environment, then select Run tests.' })}</div>`;
        return;
      }
      const final = !running && run.result;
      liveBadge.innerHTML = running ? '<span class="badge badge-running">Running</span>' : run.error ? '<span class="badge badge-error">Stopped</span>' : executionBadge(run.result?.status ?? 'Cancelled');
      liveSlot.innerHTML = `
        ${runProgressHtml(run)}
        ${final ? `
          <div class="final-banner ${run.result.status === 'Passed' ? 'is-pass' : run.result.status === 'Failed' ? 'is-fail' : ''}">
            <div>
              <div class="fw-600">${run.result.status === 'Passed' ? 'All tests passed' : run.result.status === 'Failed' ? `${run.result.failed} test${run.result.failed === 1 ? '' : 's'} failed` : 'Run cancelled'}</div>
              <div class="text-sm text-muted">Simulated run ${esc(run.result.id)} finished in ${esc(fmtDuration(run.result.durationMs))}.</div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" data-view="${esc(run.result.id)}">View results</button>
          </div>` : ''}
        ${run.error ? `<div class="notice warn" style="margin-top:14px">${icon('triangle-alert')}<span>${esc(run.error.message)}</span></div>` : ''}`;
    }

    liveSlot.addEventListener('click', (e) => { const v = e.target.closest('[data-view]'); if (v) openResults(v.dataset.view); });

    let wasRunning = RunController.isRunning;
    const off = RunController.subscribe(async (run) => {
      drawLive(run);
      if (run?.running) { wasRunning = true; return; }
      if (run && wasRunning) {
        wasRunning = false;
        history = await ExecutionService.list();
        table.setRows(history);
        state.emit('data');
        if (run.result && run.result.status !== 'Cancelled') (run.result.failed ? toast.warning : toast.success)(`Simulated run ${run.result.id} finished`, `${run.result.passed} passed, ${run.result.failed} failed, ${run.result.skipped} skipped.`);
        if (run.error) toast.error('Simulation stopped', run.error.message);
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      RunController.start({ suiteId: form.elements.suite.value, browser: form.elements.browser.value, environmentId: form.elements.env.value })
        .catch((err) => toast.error('Could not start the run', err.message));
    });
    cancelBtn.addEventListener('click', () => { RunController.cancel(); toast.info('Cancelling…', 'The simulation stops after the current test.'); });

    syncFromSuite();
    const cur = RunController.current;
    if (cur) {
      form.elements.suite.value = cur.suiteId;
      form.elements.browser.value = cur.browser;
      form.elements.env.value = cur.environmentId;
    }
    drawLive(cur);
    if (ctx.param) openResults(ctx.param);
    return () => off();
  },
};
