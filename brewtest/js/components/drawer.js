/* Right-hand side drawer */
import { icon } from '../icons.js';
import { pushLayer, popLayer, focusFirst } from './layers.js';

let seq = 0;

/**
 * openDrawer({ title, meta, body, footer, onOpen, onClose })
 * `meta` is HTML shown above the title (IDs, badges). Returns { el, close, setBody, setFooter }.
 */
export function openDrawer({ title, meta = '', body = '', footer = '', onOpen, onClose, width }) {
  const id = `drawer-${++seq}`;
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.innerHTML = `
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="${id}-title" ${width ? `style="width:min(${width}px,100%)"` : ''}>
      <header class="drawer-header">
        <div class="grow">
          <div class="row row-wrap" style="gap:8px" data-slot="meta">${meta}</div>
          <h2 id="${id}-title"></h2>
        </div>
        <button type="button" class="icon-btn" data-close aria-label="Close panel">${icon('x')}</button>
      </header>
      <div class="drawer-body" data-slot="body">${body}</div>
      <footer class="drawer-footer" data-slot="footer" ${footer ? '' : 'hidden'}>${footer}</footer>
    </aside>`;
  overlay.querySelector('h2').textContent = title;
  document.body.appendChild(overlay);

  let closed = false;
  const el = overlay.querySelector('.drawer');
  const layer = {
    el,
    setBody(html) { el.querySelector('[data-slot="body"]').innerHTML = html; },
    setFooter(html) { const f = el.querySelector('[data-slot="footer"]'); f.innerHTML = html; f.hidden = !html; },
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
  el.querySelector('[data-close]').addEventListener('click', () => layer.close());
  onOpen?.(el, layer);
  focusFirst(el.querySelector('.drawer-header'));
  return layer;
}
