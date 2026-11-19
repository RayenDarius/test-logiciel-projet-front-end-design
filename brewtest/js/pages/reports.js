/* Reports & analytics */
import { icon } from '../icons.js';
import { esc, fmtDate, fmtDateTime, fmtDuration, fmtShortDate, downloadFile, stamp, pct } from '../utils.js';
import { state } from '../state.js';
import { ReportService } from '../services/report-service.js';
import { pageHeader, statCard, chartCard, idChip, emptyState } from '../components/ui.js';
import { lineChart, barChart, doughnutChart, chartTheme } from '../components/charts.js';
import { DataTable } from '../components/data-table.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { field, options, liveValidate, validateForm } from '../components/form.js';

const RANGES = ['Last 7 days', 'Last 14 days', 'Last 30 days', 'All time'];

export default {
  async render(el) {
    let range = 'Last 14 days';
    let days = ReportService.rangeToDays(range);

    el.innerHTML = `
      ${pageHeader({
        title: 'Reports',
        sub: 'Track execution trends, coverage and suite health.',
        actions: `
          <label class="sr-only" for="rep-range">Date range</label>
          <select class="select" id="rep-range" style="width:auto">${options(RANGES, range)}</select>
          <button type="button" class="btn btn-secondary" data-export="csv">${icon('file-spreadsheet')}Export CSV</button>
          <button type="button" class="btn btn-secondary" data-export="json">${icon('file-json')}Download JSON</button>
          <button type="button" class="btn btn-secondary" data-print>${icon('printer')}Print report</button>
          <button type="button" class="btn btn-primary" data-generate>${icon('plus')}Generate report</button>`,
      })}
      <div class="print-only print-head"><strong>BrewTest report</strong> · ${esc(state.activeProject?.name ?? '')} · ${esc(fmtDateTime(new Date().toISOString()))} · simulated data</div>
      <section class="grid grid-4 kpis" id="rep-kpis" aria-label="Report figures"></section>
      <div class="grid grid-main-side mt-6">
        ${chartCard({ title: 'Execution history', sub: 'Passed, failed and skipped tests per day', canvasId: 'rc-history', ariaLabel: 'Line chart of passed, failed and skipped tests per day',
          actions: '<div class="legend"><span><i style="background:var(--color-success)"></i>Passed</span><span><i style="background:var(--color-error)"></i>Failed</span><span><i style="background:var(--color-warning)"></i>Skipped</span></div>' })}
        <section class="card">
          <div class="card-header"><div><h2 class="card-title">Pass / fail distribution</h2><p class="card-sub" id="dist-sub"></p></div></div>
          <div class="card-body"><div class="chart-box sm"><canvas id="rc-dist" role="img" aria-label="Doughnut chart of passed, failed and skipped results"></canvas></div><ul class="dist-legend" id="rc-dist-legend"></ul></div>
        </section>
      </div>
      <div class="grid grid-2 mt-6">
        ${chartCard({ title: 'Test coverage by requirement', sub: 'Share of linked test cases that currently pass', canvasId: 'rc-cov', ariaLabel: 'Bar chart of passing test case percentage by requirement' })}
        ${chartCard({ title: 'Suite performance comparison', sub: 'Pass rate by suite for the selected range', canvasId: 'rc-suite', ariaLabel: 'Bar chart of pass rate per suite' })}
      </div>
      <section class="card mt-6">
        <div class="card-header"><div><h2 class="card-title">Recent reports</h2><p class="card-sub">Generated summaries you can download again</p></div></div>
        <div id="rep-table" style="margin-top:14px"></div>
      </section>`;

    let reportsTable;

    async function drawAnalytics() {
      const [s, daily, cov, suites] = await Promise.all([
        ReportService.summary(days || 3650), ReportService.dailySeries(Math.min(days || 30, 30)), ReportService.coverageByRequirement(), ReportService.suitePerformance(days || 3650),
      ]);
      const delta = s.successRateDelta;
      el.querySelector('#rep-kpis').innerHTML = [
        statCard({ label: 'Total executions', value: s.executions, iconName: 'play', tone: 'caramel', trend: { dir: 'flat', text: `${s.total} tests` }, foot: range.toLowerCase() }),
        statCard({ label: 'Success rate', value: `${s.successRate}%`, iconName: 'circle-check', tone: 'success', trend: delta === null || !days ? { dir: 'flat', text: 'Overall' } : { dir: delta >= 0 ? 'up' : 'down', text: `${delta >= 0 ? '+' : ''}${delta} pts` }, foot: days ? 'vs previous period' : 'passed of passed + failed' }),
        statCard({ label: 'Average duration', value: fmtDuration(s.avgDurationMs), iconName: 'timer', tone: 'warning', trend: { dir: 'flat', text: 'per run' }, foot: 'simulated time' }),
        statCard({ label: 'Total failures', value: s.failed, iconName: 'circle-x', tone: 'error', trend: { dir: s.failed <= s.previousFailed ? 'up' : 'down', text: days ? `${s.failed - s.previousFailed > 0 ? '+' : ''}${s.failed - s.previousFailed}` : 'All time' }, foot: days ? 'vs previous period' : 'across all runs' }),
      ].join('');

      const t = chartTheme();
      lineChart('rc-history', {
        labels: daily.map((d) => fmtShortDate(d.date.toISOString())),
        datasets: [
          { label: 'Passed', data: daily.map((d) => d.passed), color: 'success', fill: true },
          { label: 'Failed', data: daily.map((d) => d.failed), color: 'error' },
          { label: 'Skipped', data: daily.map((d) => d.skipped), color: 'warning' },
        ],
      });
      doughnutChart('rc-dist', { labels: ['Passed', 'Failed', 'Skipped'], data: [s.passed, s.failed, s.skipped], colors: [t.success, t.error, t.warning] });
      el.querySelector('#dist-sub').textContent = `${s.total} test results · ${range.toLowerCase()}`;
      el.querySelector('#rc-dist-legend').innerHTML = [['Passed', s.passed, t.success], ['Failed', s.failed, t.error], ['Skipped', s.skipped, t.warning]]
        .map(([l, n, c]) => `<li><span><i style="background:${c}"></i>${l}</span><b class="mono-num">${n} <span class="text-muted">(${pct(n, s.total)}%)</span></b></li>`).join('');

      barChart('rc-cov', { labels: cov.map((c) => c.id), datasets: [{ label: 'Passing %', data: cov.map((c) => c.coverage), color: 'success' }], yPercent: true, yMax: 100 });
      barChart('rc-suite', { labels: suites.map((x) => x.name.replace(' Testing', '').replace('Responsive Design', 'Responsive').replace('Performance & Robustness', 'Perf. & Robustness')), datasets: [{ label: 'Pass rate %', data: suites.map((x) => x.passRate), color: t.brand[0] }], yPercent: true, yMax: 100 });
    }

    async function drawReports() {
      const rows = await ReportService.list();
      if (!reportsTable) {
        reportsTable = new DataTable(el.querySelector('#rep-table'), {
          rowKey: 'id', noun: 'reports', pageSize: 6, caption: 'Recent reports', initialSort: { key: 'generatedAt', dir: 'desc' },
          columns: [
            { key: 'id', label: 'Report', sortable: true, render: (r) => idChip(r.id) },
            { key: 'name', label: 'Name', sortable: true, render: (r) => `<span class="cell-title">${esc(r.name)}</span><div class="cell-sub">${esc(r.type)}</div>` },
            { key: 'range', label: 'Range', render: (r) => esc(r.range) },
            { key: 'format', label: 'Format', render: (r) => `<span class="tag">${esc(r.format)}</span>` },
            { key: 'generatedAt', label: 'Generated', sortable: true, sortValue: (r) => new Date(r.generatedAt).getTime(), render: (r) => `<span class="text-muted text-sm">${esc(fmtDateTime(r.generatedAt))}</span><div class="cell-sub">by ${esc(r.generatedBy)}</div>` },
            { key: 'actions', label: '', align: 'right', render: (r) => `<button type="button" class="btn btn-secondary btn-sm" data-action="download" aria-label="Download ${esc(r.name)}">${icon('download')}Download</button>` },
          ],
          rows,
          onAction: (a, r) => downloadReport(r),
          emptyHtml: emptyState({ iconName: 'file-text', title: 'No reports yet', text: 'Generate a report to keep a snapshot of your results.' }),
        });
      } else reportsTable.setRows(rows);
    }

    async function downloadReport(r) {
      const d = ReportService.rangeToDays(r.range);
      if (r.format === 'JSON') downloadFile(`brewtest-${r.id}-${stamp()}.json`, 'application/json', await ReportService.buildJson(d));
      else downloadFile(`brewtest-${r.id}-${stamp()}.csv`, 'text/csv', ReportService.buildCsv(d));
      toast.success('Download started', `${r.name} (${r.format})`);
    }

    el.addEventListener('click', async (e) => {
      const ex = e.target.closest('[data-export]');
      if (ex) {
        if (ex.dataset.export === 'csv') downloadFile(`brewtest-executions-${stamp()}.csv`, 'text/csv', ReportService.buildCsv(days));
        else downloadFile(`brewtest-summary-${stamp()}.json`, 'application/json', await ReportService.buildJson(days));
        toast.success('Download started', ex.dataset.export === 'csv' ? 'Execution rows exported as CSV.' : 'Execution summary downloaded as JSON.');
      }
      if (e.target.closest('[data-print]')) window.print();
      if (e.target.closest('[data-generate]')) openGenerate();
    });

    el.querySelector('#rep-range').addEventListener('change', async (e) => {
      range = e.target.value; days = ReportService.rangeToDays(range);
      /* Charts are recreated, so destroy the old ones first */
      const { destroyAllCharts } = await import('../components/charts.js');
      destroyAllCharts();
      drawAnalytics();
    });

    function openGenerate() {
      openModal({
        title: 'Generate report', subtitle: 'Saves a snapshot to Recent reports and downloads it.', size: 'sm',
        body: `<form id="gen-form" class="stack" novalidate>
          ${field({ id: 'g-name', label: 'Report name', required: true, control: `<input class="input" id="g-name" name="name" required minlength="4" maxlength="60" placeholder="For example, Release 2.4 readiness" value="${esc(`Execution summary ${fmtDate(new Date().toISOString())}`)}">` })}
          ${field({ id: 'g-type', label: 'Type', control: `<select class="select" id="g-type" name="type">${options(['Execution summary', 'Coverage', 'Failure analysis'], 'Execution summary')}</select>` })}
          ${field({ id: 'g-range', label: 'Date range', control: `<select class="select" id="g-range" name="range">${options(RANGES, range)}</select>` })}
          ${field({ id: 'g-format', label: 'Format', control: `<select class="select" id="g-format" name="format">${options(['CSV', 'JSON'], 'CSV')}</select>` })}
        </form>`,
        footer: '<button type="button" class="btn btn-secondary" data-close>Cancel</button><button type="submit" form="gen-form" class="btn btn-primary">Generate and download</button>',
        onOpen(node, layer) {
          const form = node.querySelector('#gen-form');
          liveValidate(form);
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm(form)) return;
            const v = (n) => form.elements[n].value;
            const report = await ReportService.generateReport({ name: v('name').trim(), type: v('type'), range: v('range'), format: v('format') });
            await downloadReport(report);
            layer.close();
            drawReports();
          });
        },
      });
    }

    await Promise.all([drawAnalytics(), drawReports()]);
  },
};
