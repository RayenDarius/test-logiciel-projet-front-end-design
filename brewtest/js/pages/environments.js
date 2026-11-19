/* Test environments */
import { icon } from '../icons.js';
import { esc } from '../utils.js';
import { EnvironmentService } from '../services/project-service.js';
import { BROWSERS } from '../data/mock-data.js';
import { pageHeader, envStatusBadge, browserName, emptyState } from '../components/ui.js';
import { DataTable } from '../components/data-table.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { field, options, liveValidate, validateForm } from '../components/form.js';
import { storage } from '../services/storage-service.js';

const TYPES = ['Local', 'Integration', 'Pre-production', 'Read-only'];
const STATUSES = ['Online', 'Degraded', 'Offline'];

export default {
  async render(el) {
    let envs = await EnvironmentService.list();
    let table;

    el.innerHTML = `
      ${pageHeader({
        title: 'Test Environments',
        sub: 'The deployments your suites run against.',
        actions: `<button type="button" class="btn btn-primary" data-new>${icon('plus')}Add environment</button>`,
      })}
      <div class="notice" style="margin-bottom:20px">${icon('info')}<span><strong>Status checks are simulated.</strong> BrewTest does not contact these addresses in this version.</span></div>
      <section class="card"><div id="env-table"></div></section>`;

    async function reload() { envs = await EnvironmentService.list(); table.setRows(envs); }

    table = new DataTable(el.querySelector('#env-table'), {
      rowKey: 'id', paginate: false, caption: 'Test environments',
      columns: [
        { key: 'name', label: 'Environment', render: (e) => `<div class="cell-title">${esc(e.name)}</div><div class="cell-sub">${esc(e.notes)}</div>` },
        { key: 'baseUrl', label: 'Base URL', className: 'mono-cell', render: (e) => `<span class="text-sm">${esc(e.baseUrl)}</span>` },
        { key: 'type', label: 'Type', render: (e) => `<span class="tag">${esc(e.type)}</span>` },
        { key: 'browsers', label: 'Browsers', render: (e) => `<span class="text-sm text-muted">${e.browsers.map(browserName).join(', ')}</span>` },
        { key: 'status', label: 'Status', render: (e) => envStatusBadge(e.status) },
        { key: 'actions', label: '', align: 'right', render: (e) => `<div class="actions">
          <button type="button" class="btn btn-secondary btn-sm" data-action="check" aria-label="Check status of ${esc(e.name)}">${icon('refresh-cw')}Check</button>
          <button type="button" class="icon-btn" data-action="edit" aria-label="Edit ${esc(e.name)}">${icon('pencil')}</button>
          <button type="button" class="icon-btn danger" data-action="delete" aria-label="Delete ${esc(e.name)}">${icon('trash-2')}</button></div>` },
      ],
      rows: envs,
      emptyHtml: emptyState({ iconName: 'server', title: 'No environments', text: 'Add an environment so suites know where to run.', actionHtml: `<button type="button" class="btn btn-primary" data-new>${icon('plus')}Add environment</button>` }),
      async onAction(action, e, btn) {
        if (action === 'edit') openForm(e);
        if (action === 'check') {
          btn.disabled = true;
          btn.innerHTML = `${icon('loader', 'spin')}Checking`;
          const updated = await EnvironmentService.checkHealth(e.id);
          toast.info(`${updated.name} is ${updated.status.toLowerCase()}`, 'Simulated status check.');
          reload();
        }
        if (action === 'delete') {
          const used = storage.get('suites').filter((s) => s.environmentId === e.id).length;
          const ok = await confirmDialog({ title: `Delete ${e.name}?`, confirmLabel: 'Delete environment', message: used ? `${used} suite${used === 1 ? ' uses' : 's use'} this environment and will need a new one.` : 'This environment will be removed.' });
          if (!ok) return;
          await EnvironmentService.remove(e.id);
          toast.success('Environment deleted', `${e.name} was removed.`);
          reload();
        }
      },
    });

    function openForm(env) {
      const editing = Boolean(env);
      openModal({
        title: editing ? `Edit ${env.name}` : 'Add environment', size: 'lg',
        body: `<form id="env-form" class="form-grid" novalidate>
          ${field({ id: 'e-name', label: 'Name', required: true, control: `<input class="input" id="e-name" name="name" required minlength="2" maxlength="40" value="${esc(env?.name ?? '')}" placeholder="For example, Staging">` })}
          ${field({ id: 'e-url', label: 'Base URL', required: true, hint: 'Include https:// or http://', control: `<input class="input mono-input" id="e-url" name="baseUrl" type="url" required value="${esc(env?.baseUrl ?? '')}" placeholder="https://staging.example.com">` })}
          ${field({ id: 'e-type', label: 'Type', control: `<select class="select" id="e-type" name="type">${options(TYPES, env?.type ?? 'Integration')}</select>` })}
          ${field({ id: 'e-status', label: 'Status', control: `<select class="select" id="e-status" name="status">${options(STATUSES, env?.status ?? 'Online')}</select>` })}
          <fieldset class="field span-2 check-group"><legend class="label">Supported browsers<span class="req" aria-hidden="true">*</span></legend>
            <div class="row row-wrap" style="gap:18px">${BROWSERS.map((b) => `<label class="check"><input type="checkbox" name="browsers" value="${b.id}" ${(env?.browsers ?? ['chrome']).includes(b.id) ? 'checked' : ''}>${esc(b.name)}</label>`).join('')}</div>
            <span class="error-msg" role="alert">${icon('circle-alert', 'icon-sm')}<span data-msg>Choose at least one browser.</span></span></fieldset>
          ${field({ id: 'e-notes', label: 'Notes', span2: true, control: `<textarea class="textarea" id="e-notes" name="notes" rows="2" placeholder="Anything the team should know about this environment">${esc(env?.notes ?? '')}</textarea>` })}
        </form>`,
        footer: `<button type="button" class="btn btn-secondary" data-close>Cancel</button><button type="submit" form="env-form" class="btn btn-primary">${icon('check')}${editing ? 'Save changes' : 'Add environment'}</button>`,
        onOpen(node, layer) {
          const form = node.querySelector('#env-form');
          liveValidate(form);
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const ok = validateForm(form);
            const browsers = [...form.querySelectorAll('[name="browsers"]:checked')].map((c) => c.value);
            node.querySelector('.check-group').classList.toggle('has-error', !browsers.length);
            if (!ok || !browsers.length) return;
            const data = { name: form.elements.name.value.trim(), baseUrl: form.elements.baseUrl.value.trim(), type: form.elements.type.value, status: form.elements.status.value, browsers, notes: form.elements.notes.value.trim() };
            if (editing) { await EnvironmentService.update(env.id, data); toast.success('Environment updated', `${data.name} was saved.`); }
            else { await EnvironmentService.create(data); toast.success('Environment added', `${data.name} is ready to use in suites.`); }
            layer.close();
            reload();
          });
        },
      });
    }

    el.addEventListener('click', (e) => { if (e.target.closest('[data-new]')) openForm(); });
  },
};
