/* Requirements management */
import { icon } from '../icons.js';
import { esc, fmtDate, debounce } from '../utils.js';
import { state } from '../state.js';
import { RequirementService } from '../services/requirement-service.js';
import { PRIORITIES, REQUIREMENT_STATUSES } from '../data/mock-data.js';
import { pageHeader, idChip, priorityEl, requirementBadge, emptyState, validationBadge, resultBadge } from '../components/ui.js';
import { effectiveResult } from '../services/test-case-service.js';
import { DataTable } from '../components/data-table.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { openDrawer } from '../components/drawer.js';
import { toast } from '../components/toast.js';
import { field, options, liveValidate, validateForm, dynamicList, validateField } from '../components/form.js';

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default {
  async render(el, ctx) {
    let reqs = await RequirementService.list();
    const filters = { q: '', status: '', priority: '' };
    let table;

    el.innerHTML = `
      ${pageHeader({
        title: 'Requirements',
        sub: 'Define and organize your application’s functional requirements.',
        actions: `<button type="button" class="btn btn-primary" data-add>${icon('plus')}Add requirement</button>`,
      })}
      <section class="card">
        <div class="toolbar" role="search">
          <div class="search">
            ${icon('search')}
            <label class="sr-only" for="req-search">Search requirements</label>
            <input type="search" class="input" id="req-search" placeholder="Search by ID, title or description" autocomplete="off">
          </div>
          <label class="sr-only" for="req-status">Filter by status</label>
          <select class="select select-sm" id="req-status"><option value="">All statuses</option>${options(REQUIREMENT_STATUSES, '')}</select>
          <label class="sr-only" for="req-priority">Filter by priority</label>
          <select class="select select-sm" id="req-priority"><option value="">All priorities</option>${options(PRIORITIES, '')}</select>
          <button type="button" class="btn btn-ghost btn-sm" data-clear hidden>${icon('x')}Clear filters</button>
          <span class="spacer"></span>
          <span class="result-count" id="req-count" aria-live="polite"></span>
        </div>
        <div id="req-table"></div>
      </section>`;

    const countEl = el.querySelector('#req-count');
    const clearBtn = el.querySelector('[data-clear]');

    const filtered = () => reqs.filter((r) => {
      const q = filters.q.toLowerCase();
      return (!q || `${r.id} ${r.title} ${r.description}`.toLowerCase().includes(q))
        && (!filters.status || r.status === filters.status)
        && (!filters.priority || r.priority === filters.priority);
    });

    const noMatches = () => (reqs.length
      ? emptyState({ iconName: 'search', title: 'No requirements match', text: 'Try a different search term or clear the filters.', actionHtml: '<button type="button" class="btn btn-secondary btn-sm" data-clear-empty>Clear filters</button>' })
      : emptyState({ iconName: 'clipboard-list', title: 'No requirements yet', text: 'Requirements describe what the application should do. Add the first one to start building test cases.', actionHtml: `<button type="button" class="btn btn-primary" data-add-empty>${icon('plus')}Add requirement</button>` }));

    function refresh() {
      const rows = filtered();
      table.opts.emptyHtml = noMatches();
      table.setRows(rows);
      countEl.textContent = `${rows.length} of ${reqs.length} requirements`;
      clearBtn.hidden = !(filters.q || filters.status || filters.priority);
    }

    async function reload() {
      reqs = await RequirementService.list();
      refresh();
      state.emit('data');
    }

    table = new DataTable(el.querySelector('#req-table'), {
      noun: 'requirements', caption: 'Requirements', pageSize: 8, initialSort: { key: 'id', dir: 'asc' },
      columns: [
        { key: 'id', label: 'ID', sortable: true, render: (r) => idChip(r.id) },
        { key: 'title', label: 'Requirement', sortable: true, render: (r) => `<div class="cell-title">${esc(r.title)}</div><div class="cell-sub">${esc(r.description)}</div>` },
        { key: 'acceptanceCriteria', label: 'Criteria', sortable: true, sortValue: (r) => r.acceptanceCriteria.length, className: 'num', render: (r) => `${icon('check-check', 'icon-sm')} ${r.acceptanceCriteria.length}` },
        { key: 'priority', label: 'Priority', sortable: true, sortValue: (r) => PRIORITY_ORDER[r.priority], render: (r) => priorityEl(r.priority) },
        { key: 'status', label: 'Status', sortable: true, render: (r) => requirementBadge(r.status) },
        { key: 'createdAt', label: 'Created', sortable: true, render: (r) => `<span class="text-muted">${fmtDate(r.createdAt)}</span>` },
        { key: 'actions', label: '', align: 'right', render: (r) => `<div class="actions">
            <button type="button" class="icon-btn" data-action="edit" aria-label="Edit ${esc(r.id)}">${icon('pencil')}</button>
            <button type="button" class="icon-btn danger" data-action="delete" aria-label="Delete ${esc(r.id)}">${icon('trash-2')}</button></div>` },
      ],
      rows: reqs,
      onRowClick: (r) => openDetails(r.id),
      onAction: (action, r) => (action === 'edit' ? openForm(r) : removeReq(r)),
    });

    /* ---- Filters ---- */
    el.querySelector('#req-search').addEventListener('input', debounce((e) => { filters.q = e.target.value.trim(); refresh(); }, 150));
    el.querySelector('#req-status').addEventListener('change', (e) => { filters.status = e.target.value; refresh(); });
    el.querySelector('#req-priority').addEventListener('change', (e) => { filters.priority = e.target.value; refresh(); });
    const clearAll = () => {
      Object.assign(filters, { q: '', status: '', priority: '' });
      el.querySelector('#req-search').value = ''; el.querySelector('#req-status').value = ''; el.querySelector('#req-priority').value = '';
      refresh();
    };
    clearBtn.addEventListener('click', clearAll);
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-add], [data-add-empty]')) openForm();
      if (e.target.closest('[data-clear-empty]')) clearAll();
    });

    /* ---- Delete ---- */
    async function removeReq(r, drawer) {
      const linked = (await RequirementService.getLinkedTestCases(r.id)).length;
      const ok = await confirmDialog({
        title: `Delete ${r.id}?`, confirmLabel: 'Delete requirement',
        message: `“${esc(r.title)}” will be removed permanently.${linked ? ` ${linked} linked test case${linked === 1 ? '' : 's'} will stay in the project without a requirement.` : ''}`,
      });
      if (!ok) return;
      drawer?.close({ instant: true });
      await RequirementService.deleteRequirement(r.id);
      toast.success('Requirement deleted', `${r.id} was removed.`);
      reload();
    }

    /* ---- Details drawer ---- */
    async function openDetails(id) {
      const r = await RequirementService.get(id);
      if (!r) { toast.error('Requirement not found', `${id} does not exist in this project.`); return; }
      const linked = await RequirementService.getLinkedTestCases(id);
      const drawer = openDrawer({
        title: r.title,
        meta: `${idChip(r.id)}${requirementBadge(r.status)}`,
        body: `
          <div class="meta-grid">
            <div class="meta-item"><div class="k">Priority</div><div class="v">${priorityEl(r.priority)}</div></div>
            <div class="meta-item"><div class="k">Created</div><div class="v">${fmtDate(r.createdAt)}</div></div>
            <div class="meta-item"><div class="k">Acceptance criteria</div><div class="v mono-num">${r.acceptanceCriteria.length}</div></div>
            <div class="meta-item"><div class="k">Linked test cases</div><div class="v mono-num">${linked.length}</div></div>
          </div>
          <section class="detail-section"><h4>Description</h4><p>${esc(r.description)}</p></section>
          <section class="detail-section"><h4>User story</h4><div class="detail-quote">${esc(r.userStory)}</div></section>
          <section class="detail-section"><h4>Acceptance criteria</h4>
            <ul class="check-list">${r.acceptanceCriteria.map((a) => `<li>${icon('circle-check')}<span>${esc(a)}</span></li>`).join('')}</ul></section>
          <section class="detail-section"><h4>Business rules</h4>
            ${r.businessRules.length ? `<ul class="check-list rules">${r.businessRules.map((a) => `<li>${icon('book-open')}<span>${esc(a)}</span></li>`).join('')}</ul>` : '<p class="text-muted">No business rules recorded.</p>'}</section>
          <section class="detail-section"><h4>Associated test cases (${linked.length})</h4>
            ${linked.length ? `<div class="stack-sm">${linked.slice(0, 12).map((t) => `
              <a class="linked-item" href="#/test-cases/${esc(t.id)}">${idChip(t.id)}<span class="grow truncate">${esc(t.title)}</span>${resultBadge(effectiveResult(t))}</a>`).join('')}
              ${linked.length > 12 ? `<a class="link-btn" href="#/test-cases">View all ${linked.length} in Test Cases</a>` : ''}</div>`
              : '<p class="text-muted">No test cases cover this requirement yet.</p>'}</section>`,
        footer: `
          <button type="button" class="btn btn-secondary" data-edit>${icon('pencil')}Edit</button>
          <button type="button" class="btn btn-danger-soft" data-delete>${icon('trash-2')}Delete</button>
          <button type="button" class="btn btn-ai" disabled title="Generating test cases with AI is not available yet">${icon('sparkles')}Generate test cases <span class="soon-tag">Coming soon</span></button>`,
        onOpen(node, layer) {
          node.querySelector('[data-edit]').addEventListener('click', () => { layer.close({ instant: true }); openForm(r); });
          node.querySelector('[data-delete]').addEventListener('click', () => removeReq(r, layer));
          node.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => layer.close({ instant: true, skipFocus: true })));
        },
      });
    }

    /* ---- Add / edit modal ---- */
    function openForm(req) {
      const editing = Boolean(req);
      let criteria; let rules;
      openModal({
        title: editing ? `Edit ${req.id}` : 'Add requirement',
        subtitle: editing ? 'Update the details below. Changes apply to linked test cases immediately.' : 'Describe what the application must do and how you will know it works.',
        size: 'lg',
        body: `
          <form id="req-form" class="form-grid" novalidate>
            ${field({ id: 'f-title', label: 'Requirement title', required: true, span2: true,
              control: `<input class="input" id="f-title" name="title" required minlength="5" maxlength="80" placeholder="For example, Wishlist management" value="${esc(req?.title ?? '')}">` })}
            ${field({ id: 'f-desc', label: 'Description', required: true, span2: true, hint: 'Explain the behavior in plain language. At least 20 characters.',
              control: `<textarea class="textarea" id="f-desc" name="description" required minlength="20" maxlength="500" rows="3" placeholder="What should the application do?">${esc(req?.description ?? '')}</textarea>` })}
            ${field({ id: 'f-story', label: 'User story', required: true, span2: true, hint: 'Format: As a [role], I want [goal] so that [benefit].',
              control: `<textarea class="textarea" id="f-story" name="userStory" required minlength="20" rows="2" placeholder="As a shopper, I want to save products so that I can buy them later.">${esc(req?.userStory ?? '')}</textarea>` })}
            <div class="field span-2">
              <span class="label" id="ac-label">Acceptance criteria<span class="req" aria-hidden="true">*</span></span>
              <span class="hint">Add at least one testable condition.</span>
              <div id="ac-list" role="group" aria-labelledby="ac-label"></div>
            </div>
            <div class="field span-2">
              <span class="label" id="br-label">Business rules</span>
              <div id="br-list" role="group" aria-labelledby="br-label"></div>
            </div>
            ${field({ id: 'f-priority', label: 'Priority', required: true, control: `<select class="select" id="f-priority" name="priority" required>${options(PRIORITIES, req?.priority ?? 'Medium')}</select>` })}
            ${field({ id: 'f-status', label: 'Status', required: true, control: `<select class="select" id="f-status" name="status" required>${options(REQUIREMENT_STATUSES, req?.status ?? 'Draft')}</select>` })}
          </form>`,
        footer: `<button type="button" class="btn btn-secondary" data-close>Cancel</button>
                 <button type="submit" form="req-form" class="btn btn-primary">${icon('check')}${editing ? 'Save changes' : 'Add requirement'}</button>`,
        onOpen(node, layer) {
          const form = node.querySelector('#req-form');
          liveValidate(form);
          criteria = dynamicList(node.querySelector('#ac-list'), {
            values: req?.acceptanceCriteria ?? [], label: 'Criterion', placeholder: 'Describe one condition that must be true', addLabel: 'Add criterion', min: 1,
            minMessage: 'Add at least one acceptance criterion.', multiline: true,
          });
          rules = dynamicList(node.querySelector('#br-list'), { values: req?.businessRules ?? [], label: 'Rule', placeholder: 'For example, Orders over $75 ship free', addLabel: 'Add business rule' });

          const story = form.elements.userStory;
          story.addEventListener('input', () => { story.dataset.customError = ''; });
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            /* Story format check runs through the same validation pipeline */
            const looksLikeStory = /^as an? .+,?\s+i want .+/is.test(story.value.trim());
            if (story.value.trim() && !looksLikeStory) { story.dataset.customError = '1'; story.setCustomValidity('Start with “As a …, I want …”.'); }
            else { story.dataset.customError = ''; story.setCustomValidity(''); }
            const okFields = validateForm(form);
            const okCriteria = criteria.validate();
            if (!okFields || !okCriteria) return;
            const data = {
              title: form.elements.title.value, description: form.elements.description.value, userStory: story.value,
              acceptanceCriteria: criteria.getValues(), businessRules: rules.getValues(),
              priority: form.elements.priority.value, status: form.elements.status.value,
            };
            const btn = node.querySelector('[type="submit"]');
            btn.disabled = true;
            try {
              if (editing) {
                await RequirementService.updateRequirement(req.id, {
                  ...data, title: data.title.trim(), description: data.description.trim(), userStory: data.userStory.trim(),
                });
                toast.success('Requirement updated', `${req.id} was saved.`);
              } else {
                const created = await RequirementService.createRequirement(data);
                toast.success('Requirement added', `${created.id} is ready for test cases.`);
              }
              layer.close();
              reload();
            } catch (err) {
              btn.disabled = false;
              toast.error('Could not save the requirement', err.message);
            }
          });
        },
      });
    }

    refresh();
    if (ctx.param) openDetails(ctx.param);
  },
};
