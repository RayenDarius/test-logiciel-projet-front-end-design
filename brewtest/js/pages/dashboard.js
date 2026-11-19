/* Overview / Dashboard */
import { icon } from '../icons.js';
import { esc, greeting, fmtWeekday, fmtDateTime, fmtSeconds, relTime, pct } from '../utils.js';
import { state } from '../state.js';
import { TestCaseService } from '../services/test-case-service.js';
import { ExecutionService } from '../services/execution-service.js';
import { ReportService } from '../services/report-service.js';
import { ProjectService } from '../services/project-service.js';
import { statCard, chartCard, pageHeader, resultBadge, browserName, idChip, emptyState } from '../components/ui.js';
import { lineChart, doughnutChart, chartTheme } from '../components/charts.js';
import { DataTable } from '../components/data-table.js';
import { storage } from '../services/storage-service.js';

export default {
  async render(el) {
    const [stats, daily, dist, executions, projects, week] = await Promise.all([
      TestCaseService.stats(), ReportService.dailySeries(7), ReportService.distribution(),
      ExecutionService.list(), ProjectService.list(), ReportService.summary(7),
    ]);
    const activity = ExecutionService.recentActivity(8);
    const firstName = state.settings.profile.name.split(' ')[0];
    const monthAgo = Date.now() - 30 * 86400000;
    const newCases = storage.get('testCases').filter((t) => t.projectId === state.activeProjectId && new Date(t.createdAt).getTime() >= monthAgo).length;
    const failDelta = week.failed - week.previousFailed;

    el.innerHTML = `
      ${pageHeader({
        title: `${greeting()}, ${firstName}.`,
        sub: 'Here’s what’s happening with your testing workspace.',
        actions: `
          <div class="field" style="min-width:230px">
            <label class="sr-only" for="dash-project">Project</label>
            <select class="select" id="dash-project">${projects.map((p) => `<option value="${esc(p.id)}" ${p.id === state.activeProjectId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
          </div>
          <a class="btn btn-primary" href="#/execution">${icon('play')}Run tests</a>`,
      })}

      <section class="grid grid-4 kpis" aria-label="Key figures">
        ${statCard({ label: 'Total test cases', value: stats.total, iconName: 'flask-conical', tone: 'caramel', trend: { dir: 'up', text: `+${newCases}` }, foot: 'created in 30 days' })}
        ${statCard({ label: 'Passed tests', value: stats.passed, iconName: 'circle-check', tone: 'success', trend: { dir: 'up', text: `${pct(stats.passed, stats.total)}%` }, foot: 'of all test cases' })}
        ${statCard({ label: 'Failed tests', value: stats.failed, iconName: 'circle-x', tone: 'error', trend: { dir: failDelta <= 0 ? 'up' : 'down', text: `${failDelta > 0 ? '+' : ''}${failDelta}` }, foot: 'failures vs previous week' })}
        ${statCard({ label: 'Pending tests', value: stats.pending, iconName: 'clock', tone: 'warning', trend: { dir: 'flat', text: `${stats.draft} drafts` }, foot: 'awaiting approval or a run' })}
      </section>

      <div class="grid grid-main-side mt-6">
        ${chartCard({
          title: 'Test execution overview', sub: 'Passed, failed and skipped tests over the last 7 days', canvasId: 'chart-exec',
          ariaLabel: 'Line chart of passed, failed and skipped tests per day for the last 7 days',
          actions: `<div class="legend"><span><i style="background:var(--color-success)"></i>Passed</span><span><i style="background:var(--color-error)"></i>Failed</span><span><i style="background:var(--color-warning)"></i>Skipped</span></div>`,
        })}
        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Test distribution</h2><p class="card-sub">Test cases by suite</p></div></div>
          <div class="card-body">
            <div class="chart-box sm"><canvas id="chart-dist" role="img" aria-label="Doughnut chart of test cases by suite"></canvas></div>
            <ul class="dist-legend" id="dist-legend"></ul>
          </div>
        </section>
      </div>

      <div class="grid grid-side-main mt-6">
        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Recent test activity</h2><p class="card-sub">Latest simulated suite runs</p></div></div>
          <div class="card-body" id="timeline-slot"></div>
        </section>
        <section class="card">
          <div class="card-header">
            <div><h2 class="card-title">Recent activity</h2><p class="card-sub">Notable test results from recent runs</p></div>
            <a class="btn btn-secondary btn-sm" href="#/execution">View all activity${icon('arrow-right')}</a>
          </div>
          <div id="activity-table" style="margin-top:14px"></div>
        </section>
      </div>`;

    el.querySelector('#dash-project').addEventListener('change', (e) => state.setActiveProject(e.target.value));

    /* Timeline */
    const slot = el.querySelector('#timeline-slot');
    const recent = executions.slice(0, 6);
    slot.innerHTML = recent.length ? `<ol class="timeline">${recent.map((x) => {
      const tone = x.status === 'Passed' ? 'success' : x.status === 'Failed' ? 'error' : 'warning';
      return `<li>
        <span class="node ${tone}">${icon(tone === 'success' ? 'circle-check' : tone === 'error' ? 'circle-x' : 'clock')}</span>
        <div><div class="t-title">${esc(x.suiteName)} ${x.status === 'Passed' ? 'passed' : x.failed ? `had ${x.failed} failure${x.failed === 1 ? '' : 's'}` : esc(x.status.toLowerCase())}</div>
        <div class="t-meta">${x.passed}/${x.total} passed · ${esc(browserName(x.browser))} · ${relTime(x.startedAt)}</div></div>
      </li>`;
    }).join('')}</ol>` : emptyState({ iconName: 'play', title: 'No runs yet', text: 'Run a suite to see activity here.', actionHtml: '<a class="btn btn-primary btn-sm" href="#/execution">Go to Test Execution</a>' });

    /* Table */
    new DataTable(el.querySelector('#activity-table'), {
      rowKey: 'key', paginate: false, caption: 'Recent test activity',
      columns: [
        { key: 'id', label: 'Test ID', render: (r) => `<a href="#/test-cases/${esc(r.id)}">${idChip(r.id)}</a>` },
        { key: 'name', label: 'Test name', render: (r) => `<span class="cell-title">${esc(r.name)}</span>` },
        { key: 'suite', label: 'Suite', render: (r) => `<span class="text-muted">${esc(r.suite.replace(' Testing', ''))}</span>` },
        { key: 'browser', label: 'Browser', render: (r) => esc(browserName(r.browser)) },
        { key: 'status', label: 'Status', render: (r) => resultBadge(r.status) },
        { key: 'durationMs', label: 'Duration', className: 'num', render: (r) => (r.durationMs ? fmtSeconds(r.durationMs) : '—') },
        { key: 'date', label: 'Date', render: (r) => `<span class="text-muted text-sm">${esc(fmtDateTime(r.date))}</span>` },
      ],
      rows: activity,
      emptyHtml: emptyState({ iconName: 'inbox', title: 'No activity yet', text: 'Results appear here after your first simulated run.' }),
    });

    /* Charts */
    lineChart('chart-exec', {
      labels: daily.map((d) => fmtWeekday(d.date)),
      datasets: [
        { label: 'Passed', data: daily.map((d) => d.passed), color: 'success', fill: true },
        { label: 'Failed', data: daily.map((d) => d.failed), color: 'error' },
        { label: 'Skipped', data: daily.map((d) => d.skipped), color: 'warning' },
      ],
    });
    const t = chartTheme();
    const short = { functional: 'Functional', 'cross-browser': 'Cross-browser', responsive: 'Responsive', performance: 'Performance' };
    doughnutChart('chart-dist', { labels: dist.map((d) => short[d.type] ?? d.name), data: dist.map((d) => d.count) });
    el.querySelector('#dist-legend').innerHTML = dist.map((d, i) => `
      <li><span><i style="background:${t.brand[i % t.brand.length]}"></i>${esc(short[d.type] ?? d.name)}</span><b class="mono-num">${d.count}</b></li>`).join('');
  },
};
