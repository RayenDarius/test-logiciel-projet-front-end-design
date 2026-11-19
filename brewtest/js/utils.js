/* Small, dependency-free helpers */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

export function debounce(fn, ms = 200) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const shortDateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

export const fmtDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const fmtShortDate = (iso) => (iso ? shortDateFmt.format(new Date(iso)) : '—');
export const fmtTime = (iso) => (iso ? timeFmt.format(new Date(iso)) : '—');
export const fmtWeekday = (iso) => weekdayFmt.format(new Date(iso));
export const fmtDateTime = (iso) => (iso ? `${shortDateFmt.format(new Date(iso))}, ${timeFmt.format(new Date(iso))}` : '—');

export function relTime(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d} days ago`;
  return fmtDate(iso);
}

export function fmtDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${String(rem).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

export const fmtSeconds = (ms) => `${(ms / 1000).toFixed(1)}s`;
export const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
export const sum = (arr, fn = (x) => x) => arr.reduce((a, x) => a + fn(x), 0);
export const initials = (name) => String(name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function downloadFile(filename, mime, content) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(rows, columns) {
  const cell = (v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => cell(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => cell(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(','));
  return [head, ...body].join('\r\n');
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
