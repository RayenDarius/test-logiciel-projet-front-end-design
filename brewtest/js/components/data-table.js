/* Reusable data table: sorting, pagination, clickable rows, action delegation, empty state. */
import { icon } from '../icons.js';
import { esc } from '../utils.js';

export class DataTable {
  /**
   * @param {HTMLElement} container
   * @param {{columns:Array, rows:Array, pageSize?:number, rowKey?:string, onRowClick?:Function, onAction?:Function,
   *          emptyHtml?:string, initialSort?:{key:string,dir:'asc'|'desc'}, caption?:string, noun?:string, paginate?:boolean}} opts
   */
  constructor(container, opts) {
    this.el = container;
    this.opts = { pageSize: 10, rowKey: 'id', noun: 'results', paginate: true, ...opts };
    this.rows = opts.rows ?? [];
    this.page = 1;
    this.sort = opts.initialSort ?? null;
    this.bind();
    this.render();
  }

  setRows(rows, { keepPage = false } = {}) {
    this.rows = rows;
    if (!keepPage) this.page = 1;
    this.render();
  }

  sortedRows() {
    if (!this.sort) return this.rows;
    const col = this.opts.columns.find((c) => c.key === this.sort.key);
    if (!col) return this.rows;
    const get = col.sortValue ?? ((r) => r[col.key]);
    const dir = this.sort.dir === 'asc' ? 1 : -1;
    return [...this.rows].sort((a, b) => {
      const x = get(a); const y = get(b);
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true, sensitivity: 'base' }) * dir;
    });
  }

  render() {
    const { columns, pageSize, paginate, caption, emptyHtml } = this.opts;
    const all = this.sortedRows();
    if (!all.length) {
      this.el.innerHTML = emptyHtml ?? '';
      return;
    }
    const pages = paginate ? Math.max(1, Math.ceil(all.length / pageSize)) : 1;
    this.page = Math.min(this.page, pages);
    const start = paginate ? (this.page - 1) * pageSize : 0;
    const visible = paginate ? all.slice(start, start + pageSize) : all;

    const head = columns.map((c) => {
      const sorted = this.sort?.key === c.key;
      const aria = sorted ? ` aria-sort="${this.sort.dir === 'asc' ? 'ascending' : 'descending'}"` : '';
      const arrow = c.sortable ? `<span class="sort-ind" aria-hidden="true">${sorted ? (this.sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>` : '';
      const inner = c.sortable
        ? `<button type="button" class="sort-btn" data-sort="${esc(c.key)}">${esc(c.label)}${arrow}</button>`
        : esc(c.label);
      return `<th scope="col" class="${c.sortable ? 'sortable' : ''} ${c.align === 'right' ? 'right' : ''}"${aria}>${inner}</th>`;
    }).join('');

    const body = visible.map((r) => {
      const key = r[this.opts.rowKey];
      const cls = [this.opts.onRowClick ? 'is-clickable' : '', this.opts.rowClass?.(r) ?? ''].join(' ');
      const cells = columns.map((c) => `<td class="${c.className ?? ''} ${c.align === 'right' ? 'right' : ''}">${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('');
      return `<tr class="${cls}" data-key="${esc(key)}" ${this.opts.onRowClick ? 'tabindex="0"' : ''}>${cells}</tr>`;
    }).join('');

    const first = start + 1;
    const last = Math.min(start + pageSize, all.length);
    this.el.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          ${caption ? `<caption class="sr-only">${esc(caption)}</caption>` : ''}
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      ${paginate ? `
      <div class="table-foot">
        <span>Showing <b class="mono-num">${first}–${last}</b> of <b class="mono-num">${all.length}</b> ${esc(this.opts.noun)}</span>
        ${pages > 1 ? this.pagerHtml(pages) : ''}
      </div>` : ''}`;
  }

  pagerHtml(pages) {
    const nums = [];
    const add = (n) => nums.push(`<button type="button" class="${n === this.page ? 'is-active' : ''}" data-page="${n}" aria-label="Page ${n}" ${n === this.page ? 'aria-current="page"' : ''}>${n}</button>`);
    for (let n = 1; n <= pages; n += 1) {
      if (n === 1 || n === pages || Math.abs(n - this.page) <= 1) add(n);
      else if (nums[nums.length - 1] !== '…') nums.push('…');
    }
    return `<nav class="pager" aria-label="Pagination">
      <button type="button" data-page="${this.page - 1}" aria-label="Previous page" ${this.page === 1 ? 'disabled' : ''}>${icon('chevron-left', 'icon-sm')}</button>
      ${nums.map((n) => (n === '…' ? '<span class="text-muted" aria-hidden="true">…</span>' : n)).join('')}
      <button type="button" data-page="${this.page + 1}" aria-label="Next page" ${this.page === pages ? 'disabled' : ''}>${icon('chevron-right', 'icon-sm')}</button>
    </nav>`;
  }

  bind() {
    this.el.addEventListener('click', (e) => {
      const sortBtn = e.target.closest('[data-sort]');
      if (sortBtn) {
        const key = sortBtn.dataset.sort;
        this.sort = this.sort?.key === key ? { key, dir: this.sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' };
        this.page = 1;
        this.render();
        this.el.querySelector(`[data-sort="${key}"]`)?.focus();
        return;
      }
      const pageBtn = e.target.closest('[data-page]');
      if (pageBtn && !pageBtn.disabled) {
        this.page = Number(pageBtn.dataset.page);
        this.render();
        this.el.querySelector('.table-wrap')?.scrollIntoView({ block: 'nearest' });
        return;
      }
      const actionEl = e.target.closest('[data-action]');
      const tr = e.target.closest('tr[data-key]');
      if (!tr) return;
      const row = this.rows.find((r) => String(r[this.opts.rowKey]) === tr.dataset.key);
      if (!row) return;
      if (actionEl) { e.stopPropagation(); this.opts.onAction?.(actionEl.dataset.action, row, actionEl); return; }
      if (e.target.closest('a, input, select, label')) return;
      this.opts.onRowClick?.(row, tr);
    });
    this.el.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr.is-clickable')) {
        e.preventDefault();
        const row = this.rows.find((r) => String(r[this.opts.rowKey]) === e.target.dataset.key);
        if (row) this.opts.onRowClick?.(row, e.target);
      }
    });
  }
}
