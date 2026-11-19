/* Layer stack shared by modals and drawers: Escape closes the top layer, Tab stays inside it. */
const stack = [];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function onKeydown(e) {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    top.close();
    return;
  }
  if (e.key === 'Tab') {
    const items = [...top.el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!top.el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  }
}
document.addEventListener('keydown', onKeydown, true);

export function pushLayer(layer) {
  layer.returnFocus = document.activeElement;
  stack.push(layer);
  document.body.style.overflow = 'hidden';
}

export function popLayer(layer) {
  const i = stack.indexOf(layer);
  if (i >= 0) stack.splice(i, 1);
  if (!stack.length) document.body.style.overflow = '';
  if (layer.returnFocus?.isConnected) layer.returnFocus.focus?.({ preventScroll: true });
}

export function closeAllLayers() {
  [...stack].reverse().forEach((l) => l.close({ instant: true, skipFocus: true }));
}

export const hasOpenLayer = () => stack.length > 0;
export const focusFirst = (el) => (el.querySelector('[autofocus]') ?? el.querySelector(FOCUSABLE))?.focus({ preventScroll: true });
