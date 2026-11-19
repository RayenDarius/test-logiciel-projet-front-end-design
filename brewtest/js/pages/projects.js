/* Projects */
import { icon } from '../icons.js';
import { esc, relTime } from '../utils.js';
import { state } from '../state.js';
import { ProjectService } from '../services/project-service.js';
import { pageHeader, projectStatusBadge, emptyState } from '../components/ui.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { field, options, liveValidate, validateForm } from '../components/form.js';

const STATUSES = ['Active', 'On hold', 'Archived'];

export default {
  async render(el) {
    let projects = await ProjectService.list();

    el.innerHTML = `
      ${pageHeader({
        title: 'Projects',
        sub: 'Each project keeps its own requirements, test cases and suites.',
        actions: `<button type="button" class="btn btn-primary" data-new>${icon('plus')}New project</button>`,
      })}
      <div class="grid grid-3 project-grid" id="project-grid"></div>`;

    const grid = el.querySelector('#project-grid');

    function draw() {
      grid.innerHTML = projects.length ? projects.map((p) => {
        const active = p.id === state.activeProjectId;
        return `
          <article class="card project-card ${active ? 'is-active' : ''}" data-id="${esc(p.id)}">
            <div class="project-head">
              <span class="project-glyph" aria-hidden="true">${esc(p.name.slice(0, 1))}</span>
              <div class="grow">
                <h2 class="project-title">${esc(p.name)}</h2>
                <div class="row" style="gap:8px">${projectStatusBadge(p.status)}${active ? '<span class="badge badge-info no-dot">Current project</span>' : ''}</div>
              </div>
            </div>
            <p class="project-desc">${esc(p.description)}</p>
            <dl class="project-stats">
              <div><dt>Requirements</dt><dd class="mono-num">${p.requirementCount}</dd></div>
              <div><dt>Test cases</dt><dd class="mono-num">${p.testCaseCount}</dd></div>
              <div><dt>Last activity</dt><dd>${relTime(p.lastActivityAt)}</dd></div>
            </dl>
            <div class="project-actions">
              <button type="button" class="btn ${active ? 'btn-secondary' : 'btn-primary'} btn-sm" data-select ${active ? 'disabled' : ''}>${active ? `${icon('check')}Selected` : 'Select project'}</button>
              <span class="grow"></span>
              <button type="button" class="icon-btn" data-edit aria-label="Edit ${esc(p.name)}">${icon('pencil')}</button>
              <button type="button" class="icon-btn danger" data-delete aria-label="Delete ${esc(p.name)}">${icon('trash-2')}</button>
            </div>
          </article>`;
      }).join('') : `<div class="card" style="grid-column:1/-1">${emptyState({ iconName: 'folder-kanban', title: 'No projects', text: 'Create a project to start managing requirements and tests.', actionHtml: `<button type="button" class="btn btn-primary" data-new>${icon('plus')}New project</button>` })}</div>`;
    }

    async function reload() { projects = await ProjectService.list(); draw(); state.emit('data'); }

    function openForm(p) {
      const editing = Boolean(p);
      openModal({
        title: editing ? `Edit ${p.name}` : 'New project', size: 'sm',
        subtitle: editing ? 'Update the project details.' : 'New projects start with the four standard suites.',
        body: `<form id="project-form" class="stack" novalidate>
          ${field({ id: 'p-name', label: 'Project name', required: true, control: `<input class="input" id="p-name" name="name" required minlength="3" maxlength="60" value="${esc(p?.name ?? '')}" placeholder="For example, Orbit Mobile Web">` })}
          ${field({ id: 'p-desc', label: 'Description', required: true, hint: 'One or two sentences about what the project tests.', control: `<textarea class="textarea" id="p-desc" name="description" required minlength="10" maxlength="240" rows="3" placeholder="What application does this project cover?">${esc(p?.description ?? '')}</textarea>` })}
          ${field({ id: 'p-status', label: 'Status', control: `<select class="select" id="p-status" name="status">${options(STATUSES, p?.status ?? 'Active')}</select>` })}
        </form>`,
        footer: `<button type="button" class="btn btn-secondary" data-close>Cancel</button><button type="submit" form="project-form" class="btn btn-primary">${icon('check')}${editing ? 'Save changes' : 'Create project'}</button>`,
        onOpen(node, layer) {
          const form = node.querySelector('#project-form');
          liveValidate(form);
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm(form)) return;
            const data = { name: form.elements.name.value, description: form.elements.description.value, status: form.elements.status.value };
            if (editing) { await ProjectService.update(p.id, { ...data, name: data.name.trim(), description: data.description.trim() }); toast.success('Project updated', `${data.name.trim()} was saved.`); }
            else {
              const created = await ProjectService.create(data);
              toast.success('Project created', `${created.name} is ready. Select it to start adding requirements.`);
            }
            layer.close();
            reload();
            if (editing && p.id === state.activeProjectId) state.emit('data');
          });
        },
      });
    }

    el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-new]')) { openForm(); return; }
      const card = e.target.closest('.project-card');
      if (!card) return;
      const p = projects.find((x) => x.id === card.dataset.id);
      if (e.target.closest('[data-select]')) { state.setActiveProject(p.id); toast.success('Project selected', `Now working in ${p.name}.`); }
      if (e.target.closest('[data-edit]')) openForm(p);
      if (e.target.closest('[data-delete]')) {
        if (projects.length === 1) { toast.warning('Keep at least one project', 'Create another project before deleting this one.'); return; }
        const ok = await confirmDialog({
          title: `Delete ${p.name}?`, confirmLabel: 'Delete project',
          message: `This permanently removes ${p.requirementCount} requirement${p.requirementCount === 1 ? '' : 's'}, ${p.testCaseCount} test case${p.testCaseCount === 1 ? '' : 's'}, its suites and execution history.`,
        });
        if (!ok) return;
        await ProjectService.remove(p.id);
        toast.success('Project deleted', `${p.name} was removed.`);
        if (state.activeProjectId === p.id) return; /* the project event re-renders the page */
        reload();
      }
    });

    draw();
  },
};
