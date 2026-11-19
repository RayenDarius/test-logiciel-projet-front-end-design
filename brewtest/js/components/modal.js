/* Modal dialogs and confirmation dialogs */
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { pushLayer, popLayer, focusFirst } from './layers.js';

let seq = 0;

/**
 * openModal({ title, subtitle, size, body, footer, onOpen, onClose })
 * body/footer are HTML strings. Returns { el, close }.
 */
export function openModal({ title, subtitle = '', size = '', body = '', footer = '', onOpen, onClose, role = 'dialog' }) {
  const id = `modal-${++seq}`;
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal ${size ? `modal-${size}` : ''}" role="${role}" aria-modal="true" aria-labelledby="${id}-title">
      <header class="modal-header">
        <div>
          <h2 id="${id}-title">${esc(title)}</h2>
          ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
        </div>
        <button type="button" class="icon-btn" data-close aria-label="Close dialog">${icon('x')}</button>
      </header>
      <div class="modal-body">${body}</div>
      ${footer ? `<footer class="modal-footer">${footer}</footer>` : ''}
    </div>`;
  document.body.appendChild(overlay);

  let closed = false;
  const layer = {
    el: overlay.querySelector('.modal'),
    close({ instant = false, skipFocus = false } = {}) {
      if (closed) return;
      closed = true;
      if (skipFocus) layer.returnFocus = null;
      const finish = () => { overlay.remove(); popLayer(layer); onClose?.(); };
      if (instant) finish();
      else { overlay.classList.add('is-closing'); setTimeout(finish, 200); }
    },
  };
  pushLayer(layer);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) layer.close(); });
  overlay.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => layer.close()));
  onOpen?.(layer.el, layer);
  focusFirst(layer.el.querySelector('.modal-body') ?? layer.el);
  return layer;
}

/** confirmDialog({ title, message, confirmLabel, tone }) → Promise<boolean> */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger', iconName }) {
  return new Promise((resolve) => {
    let result = false;
    openModal({
      title, size: 'sm', role: 'alertdialog',
      body: `
        <div class="row" style="align-items:flex-start;gap:16px;padding-top:4px">
          <span class="confirm-icon ${tone === 'danger' ? '' : 'is-info'}">${icon(iconName ?? (tone === 'danger' ? 'triangle-alert' : 'info'))}</span>
          <div>
            <h3 style="font-size:21px;margin-bottom:6px">${esc(title)}</h3>
            <p class="text-muted" style="line-height:1.6">${message}</p>
          </div>
        </div>`,
      footer: `
        <button type="button" class="btn btn-secondary" data-close>${esc(cancelLabel)}</button>
        <button type="button" class="btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}" data-confirm>${esc(confirmLabel)}</button>`,
      onOpen(el, layer) {
        el.querySelector('.modal-header h2').parentElement.parentElement.style.display = 'none';
        el.querySelector('[data-confirm]').addEventListener('click', () => { result = true; layer.close(); });
        el.querySelector('[data-confirm]').focus();
      },
      onClose: () => resolve(result),
    });
  });
}
