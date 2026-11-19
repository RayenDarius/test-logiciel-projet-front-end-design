/* Reusable presentational building blocks: badges, stat cards, empty states, page headers. */
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { BROWSERS } from '../data/mock-data.js';

export const browserName = (id) => BROWSERS.find((b) => b.id === id)?.name ?? id;

export function resultBadge(result) {
  const map = {
    passed: ['badge-success', 'Passed'], failed: ['badge-error', 'Failed'], skipped: ['badge-warning', 'Skipped'],
    pending: ['badge-warning', 'Pending'], running: ['badge-running', 'Running'],
  };
  const [cls, label] = map[result] ?? ['badge-neutral', result];
  return `<span class="badge ${cls}">${esc(label)}</span>`;
}

export function executionBadge(status) {
  const cls = { Passed: 'badge-success', Failed: 'badge-error', Cancelled: 'badge-neutral', Running: 'badge-running' }[status] ?? 'badge-neutral';
  return `<span class="badge ${cls}">${esc(status)}</span>`;
}

export function validationBadge(status) {
  const cls = { Validated: 'badge-success', Draft: 'badge-warning', Rejected: 'badge-error' }[status] ?? 'badge-neutral';
  return `<span class="badge ${cls}">${esc(status)}</span>`;
}

export function requirementBadge(status) {
  const cls = { Draft: 'badge-neutral', 'In Review': 'badge-warning', Approved: 'badge-info', Implemented: 'badge-success' }[status] ?? 'badge-neutral';
  return `<span class="badge ${cls}">${esc(status)}</span>`;
}

export function suiteStatusBadge(status) {
  const cls = { Passing: 'badge-success', Failing: 'badge-error', 'Not run': 'badge-neutral', Running: 'badge-running' }[status] ?? 'badge-neutral';
  return `<span class="badge ${cls}">${esc(status)}</span>`;
}

export function envStatusBadge(status) {
  const cls = { Online: 'badge-success', Degraded: 'badge-warning', Offline: 'badge-error' }[status] ?? 'badge-neutral';
  return `<span class="badge ${cls}">${esc(status)}</span>`;
}

export function projectStatusBadge(status) {
  const cls = { Active: 'badge-success', 'On hold': 'badge-warning', Archived: 'badge-neutral' }[status] ?? 'badge-neutral';
  return `<span class="badge ${cls}">${esc(status)}</span>`;
}

export function typeBadge(type) {
  return `<span class="badge no-dot ${type === 'Positive' ? 'badge-success' : 'badge-error'}">${esc(type)}</span>`;
}

export function priorityEl(p) {
  const cls = `p-${String(p).toLowerCase()}`;
  return `<span class="priority ${cls}"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>${esc(p)}</span>`;
}

export const idChip = (id) => `<span class="id-chip">${esc(id)}</span>`;

/** Stat card. tone: success | error | warning | caramel */
export function statCard({ label, value, iconName, tone = 'caramel', trend, foot = '' }) {
  const trendHtml = trend
    ? `<span class="trend ${trend.dir}">${icon(trend.dir === 'down' ? 'trending-down' : trend.dir === 'up' ? 'trending-up' : 'arrow-right')}${esc(trend.text)}</span>`
    : '';
  return `
    <article class="card stat-card tone-${tone}">
      <div class="stat-top">
        <span class="stat-label">${esc(label)}</span>
        <span class="stat-icon">${icon(iconName, 'icon')}</span>
      </div>
      <div class="stat-value mono-num">${esc(value)}</div>
      <div class="stat-foot">${trendHtml}<span>${esc(foot)}</span></div>
    </article>`;
}

export function emptyState({ iconName = 'inbox', title, text = '', actionHtml = '', error = false }) {
  return `
    <div class="empty ${error ? 'is-error' : ''}">
      <div class="empty-art">${icon(iconName, 'icon-lg')}</div>
      <h3>${esc(title)}</h3>
      ${text ? `<p>${esc(text)}</p>` : ''}
      ${actionHtml}
    </div>`;
}

export function pageHeader({ title, sub = '', actions = '' }) {
  return `
    <header class="page-header">
      <div>
        <h1>${esc(title)}</h1>
        ${sub ? `<p class="page-sub">${esc(sub)}</p>` : ''}
      </div>
      ${actions ? `<div class="page-header-actions">${actions}</div>` : ''}
    </header>`;
}

export function chartCard({ title, sub = '', canvasId, height = '', actions = '', ariaLabel }) {
  return `
    <section class="card">
      <div class="card-header">
        <div><h2 class="card-title">${esc(title)}</h2>${sub ? `<p class="card-sub">${esc(sub)}</p>` : ''}</div>
        ${actions}
      </div>
      <div class="card-body">
        <div class="chart-box ${height}"><canvas id="${canvasId}" role="img" aria-label="${esc(ariaLabel ?? title)}"></canvas></div>
      </div>
    </section>`;
}

/** Skeleton shown while a page loads */
export function pageSkeleton(kind = 'default') {
  const cards = kind === 'list' ? '' : '<div class="grid grid-4"><div class="skeleton sk-card"></div><div class="skeleton sk-card"></div><div class="skeleton sk-card"></div><div class="skeleton sk-card"></div></div>';
  return `
    <div class="page-loading" aria-busy="true" aria-label="Loading">
      <div class="skeleton sk-title"></div>
      <div class="skeleton sk-line" style="width:380px;max-width:60%;margin-bottom:28px"></div>
      ${cards}
      <div class="grid grid-main-side mt-6"><div class="skeleton sk-chart"></div><div class="skeleton sk-chart"></div></div>
    </div>`;
}

export function runProgressHtml(run) {
  if (!run) return '';
  const { progress, suiteName, browser, running } = run;
  const total = progress.total || 1;
  const done = progress.done ? total : progress.index;
  const pctDone = Math.round((done / total) * 100);
  const c = progress.counts;
  return `
    <div class="run-panel ${running ? 'is-running' : ''}">
      <div class="row row-between row-wrap" style="margin-bottom:12px">
        <div>
          <div class="fw-600">${esc(suiteName)} <span class="text-muted" style="font-weight:400">on ${esc(browserName(browser))}</span></div>
          <div class="text-sm text-muted truncate" style="max-width:52ch">${progress.current
            ? `Simulating ${esc(progress.current.id)}: ${esc(progress.current.title)}`
            : progress.done ? 'Simulation finished' : 'Preparing the simulated run…'}</div>
        </div>
        <span class="badge badge-info no-dot">Simulated</span>
      </div>
      <div class="progress ${c.failed ? 'is-error' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pctDone}" aria-label="Execution progress"><span style="width:${pctDone}%"></span></div>
      <div class="run-stats">
        <div><b class="mono-num">${pctDone}%</b><span>Progress</span></div>
        <div class="is-pass"><b class="mono-num">${c.passed}</b><span>Passed</span></div>
        <div class="is-fail"><b class="mono-num">${c.failed}</b><span>Failed</span></div>
        <div class="is-skip"><b class="mono-num">${c.skipped}</b><span>Skipped</span></div>
        <div><b class="mono-num">${(progress.virtualMs / 1000).toFixed(1)}s</b><span>Duration</span></div>
      </div>
    </div>`;
}
