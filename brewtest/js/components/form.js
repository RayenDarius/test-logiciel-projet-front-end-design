/* Form helpers: field markup, JS validation on top of HTML validation attributes, dynamic lists. */
import { icon } from '../icons.js';
import { esc } from '../utils.js';

export function field({ id, label, control, required = false, hint = '', span2 = false }) {
  return `
    <div class="field ${span2 ? 'span-2' : ''}">
      <label for="${id}">${esc(label)}${required ? '<span class="req" aria-hidden="true">*</span>' : ''}</label>
      ${control}
      ${hint ? `<span class="hint" id="${id}-hint">${esc(hint)}</span>` : ''}
      <span class="error-msg" id="${id}-error" role="alert">${icon('circle-alert', 'icon-sm')}<span data-msg></span></span>
    </div>`;
}

export const options = (items, selected, { placeholder } = {}) =>
  (placeholder ? `<option value="">${esc(placeholder)}</option>` : '')
  + items.map((i) => {
    const [value, label] = Array.isArray(i) ? i : [i, i];
    return `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`;
  }).join('');

const MESSAGES = {
  valueMissing: (el) => el.dataset.requiredMsg ?? 'This field is required.',
  typeMismatch: (el) => (el.type === 'email' ? 'Enter a valid email address.' : el.type === 'url' ? 'Enter a full web address, such as https://example.com.' : 'Enter a valid value.'),
  tooShort: (el) => `Use at least ${el.minLength} characters.`,
  tooLong: (el) => `Use ${el.maxLength} characters or fewer.`,
  patternMismatch: (el) => el.dataset.patternMsg ?? 'Check the format of this value.',
  rangeUnderflow: (el) => `Enter ${el.min} or more.`,
  rangeOverflow: (el) => `Enter ${el.max} or less.`,
};

function messageFor(el) {
  if (el.validity.valid) return '';
  for (const key of Object.keys(MESSAGES)) if (el.validity[key]) return MESSAGES[key](el);
  return el.validationMessage || 'Check this value.';
}

export function setFieldError(el, message) {
  const wrap = el.closest('.field');
  if (!wrap) return;
  const msg = wrap.querySelector('[data-msg]');
  wrap.classList.toggle('has-error', Boolean(message));
  if (message) {
    if (msg) msg.textContent = message;
    el.setAttribute('aria-invalid', 'true');
    const err = wrap.querySelector('.error-msg');
    if (err?.id) el.setAttribute('aria-describedby', err.id);
  } else {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  }
}

export function validateField(el) {
  /* Whitespace-only values do not count for required text fields */
  if (el.required && typeof el.value === 'string' && el.type !== 'checkbox' && el.value.trim() === '') el.setCustomValidity(el.dataset.requiredMsg ?? 'This field is required.');
  else if (!el.dataset.customError) el.setCustomValidity('');
  const message = messageFor(el);
  setFieldError(el, message);
  return !message;
}

/** Validates every control in the form; focuses the first invalid one. */
export function validateForm(form) {
  let firstBad = null;
  form.querySelectorAll('input, select, textarea').forEach((el) => {
    if (el.type === 'hidden' || el.disabled || !el.closest('.field')) return;
    if (!validateField(el) && !firstBad) firstBad = el;
  });
  firstBad?.focus();
  return !firstBad;
}

/** Revalidate on blur, and clear errors as soon as input becomes valid */
export function liveValidate(form) {
  form.setAttribute('novalidate', '');
  form.addEventListener('focusout', (e) => { if (e.target.closest?.('.field') && e.target.matches('input,select,textarea')) validateField(e.target); });
  form.addEventListener('input', (e) => {
    const f = e.target.closest?.('.field');
    if (f?.classList.contains('has-error') && e.target.matches('input,select,textarea')) validateField(e.target);
  });
}

/**
 * Dynamic list (acceptance criteria, business rules, steps).
 * Returns { getValues(), setValues(v), validate() }.
 */
export function dynamicList(container, { values = [], label, placeholder, addLabel, min = 0, multiline = false, minMessage }) {
  const id = `dl-${Math.random().toString(36).slice(2, 7)}`;
  container.innerHTML = `
    <div class="dynamic-list" data-list></div>
    <span class="error-msg-inline" data-error role="alert" hidden></span>
    <button type="button" class="link-btn" data-add>${icon('plus', 'icon-sm')} ${esc(addLabel)}</button>`;
  const list = container.querySelector('[data-list]');
  const err = container.querySelector('[data-error]');

  const renumber = () => {
    [...list.children].forEach((row, i) => {
      row.querySelector('.num').textContent = i + 1;
      const input = row.querySelector('.input, .textarea');
      input.setAttribute('aria-label', `${label} ${i + 1}`);
      row.querySelector('[data-remove]').setAttribute('aria-label', `Remove ${label.toLowerCase()} ${i + 1}`);
    });
  };

  const add = (value = '', focus = false) => {
    const row = document.createElement('div');
    row.className = 'dynamic-item';
    row.innerHTML = `
      <span class="num"></span>
      ${multiline ? `<textarea class="textarea" rows="2" placeholder="${esc(placeholder)}"></textarea>` : `<input class="input" type="text" placeholder="${esc(placeholder)}" autocomplete="off">`}
      <button type="button" class="icon-btn danger" data-remove>${icon('trash-2')}</button>`;
    row.querySelector('.input, .textarea').value = value;
    list.appendChild(row);
    renumber();
    if (focus) row.querySelector('.input, .textarea').focus();
  };

  container.addEventListener('click', (e) => {
    if (e.target.closest('[data-add]')) { add('', true); err.hidden = true; return; }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      if (list.children.length <= Math.max(min, 1) && min > 0) {
        const input = rm.parentElement.querySelector('.input, .textarea');
        input.value = '';
        input.focus();
      } else {
        rm.parentElement.remove();
        renumber();
      }
    }
  });
  container.addEventListener('input', () => { err.hidden = true; });

  const getValues = () => [...list.querySelectorAll('.input, .textarea')].map((i) => i.value.trim()).filter(Boolean);
  const setValues = (v) => { list.innerHTML = ''; (v.length ? v : (min ? [''] : [])).forEach((x) => add(x)); };
  const validate = () => {
    const ok = getValues().length >= min;
    err.hidden = ok;
    err.textContent = minMessage ?? `Add at least ${min}.`;
    if (!ok) list.querySelector('.input, .textarea')?.focus();
    return ok;
  };
  setValues(values);
  return { getValues, setValues, validate, id };
}

/** Reads a form into a plain object */
export const formValues = (form) => Object.fromEntries(new FormData(form).entries());
