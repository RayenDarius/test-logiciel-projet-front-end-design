/* Toast notifications */
import { icon } from '../icons.js';
import { esc } from '../utils.js';

const ICONS = { success: 'circle-check', error: 'circle-x', warning: 'triangle-alert', info: 'info' };
let region = null;

function ensureRegion() {
  if (region?.isConnected) return region;
  region = document.createElement('div');
  region.className = 'toast-region';
  region.setAttribute('role', 'region');
  region.setAttribute('aria-label', 'Notifications');
  region.setAttribute('aria-live', 'polite');
  document.body.appendChild(region);
  return region;
}

/** toast({ type, title, message, duration }) */
export function toast({ type = 'info', title, message = '', duration = 4200 }) {
  const root = ensureRegion();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `
    <span class="toast-icon">${icon(ICONS[type] ?? 'info')}</span>
    <div>
      <div class="toast-title">${esc(title)}</div>
      ${message ? `<div class="toast-msg">${esc(message)}</div>` : ''}
    </div>
    <button type="button" class="close" aria-label="Dismiss notification">${icon('x', 'icon-sm')}</button>`;
  root.appendChild(el);

  let timer;
  const dismiss = () => {
    clearTimeout(timer);
    if (!el.isConnected) return;
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 220);
  };
  el.querySelector('.close').addEventListener('click', dismiss);
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 1800); });
  timer = setTimeout(dismiss, duration);
  while (root.children.length > 4) root.firstElementChild.remove();
  return dismiss;
}

toast.success = (title, message) => toast({ type: 'success', title, message });
toast.error = (title, message) => toast({ type: 'error', title, message, duration: 6000 });
toast.warning = (title, message) => toast({ type: 'warning', title, message });
toast.info = (title, message) => toast({ type: 'info', title, message });
