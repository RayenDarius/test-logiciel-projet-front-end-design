/* Test case management */
import { icon } from '../icons.js';
import { esc, debounce, fmtDate, relTime } from '../utils.js';
import { state } from '../state.js';
import { TestCaseService, effectiveResult } from '../services/test-case-service.js';
import { RequirementService } from '../services/requirement-service.js';
import { TestSuiteService } from '../services/test-suite-service.js';
import { PRIORITIES, TECHNIQUES } from '../data/mock-data.js';
import { pageHeader, statCard, idChip, priorityEl, typeBadge, validationBadge, resultBadge, emptyState } from '../components/ui.js';
import { DataTable } from '../components/data-table.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { openDrawer } from '../components/drawer.js';
import { toast } from '../components/toast.js';
import { field, options, liveValidate, validateForm, dynamicList } from '../components/form.js';

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const STATUSES = ['Validated', 'Draft', 'Rejected'];

export default {
  async render(el, ctx) {
    let [cases, reqs, suites] = await Promise.all([TestCaseService.list(), RequirementService.list(), TestSuiteService.list()]);
    const filters = { q: '', requirement: '', type: '', status: '', technique: '' };
    let table;
    const reqById = () => new Map(reqs.map((r) => [r.id, r]));

    el.innerHTML = `
      ${pageHeader({
        title: 'Test Cases',
        sub: 'Review, organize, and manage your testing scenarios.',
        actions: `
          <button type="button" class="btn btn-ai" disabled aria-disabled="true" title="AI generation is not available yet">${icon('sparkles')}Generate with AI — Coming Soon</button>
          <button type="button" class="btn btn-primary" data-add>${icon('plus')}Add test case</button>`,
      })}
      <section class="grid grid-4 kpis" id="tc-stats" aria-label="Test case totals"></section>
      <section class="card mt-6">
        <div class="toolbar" role="search">
          <div class="search">
            ${icon('search')}
            <label class="sr-only" for="tc-search">Search test cases</label>
            <input type="search" class="input" id="tc-search" placeholder="Search by ID or title" autocomplete="off">
          </div>
          <label class="sr-only" for="tc-req">Filter by requirement</label>
          <select class="select select-sm" id="tc-req"><option value="">All requirements</option>${reqs.map((r) => `<option value="${esc(r.id)}">${esc(r.id)} · ${esc(r.title)}</option>`).join('')}</select>
          <label class="sr-only" for="tc-type">Filter by test type</label>
          <select class="select select-sm" id="tc-type"><option value="">All types</option>${options(['Positive', 'Negative'], '')}</select>
          <label class="sr-only" for="tc-status">Filter by status</label>
          <select class="select select-sm" id="tc-status"><option value="">All statuses</option>${options(STATUSES, '')}</select>
          <label class="sr-only" for="tc-tech">Filter by technique</label>
          <select class="select select-sm" id="tc-tech"><option value="">All techniques</option>${options(TECHNIQUES, '')}</select>
          <button type="button" class="btn btn-ghost btn-sm" data-clear hidden>${icon('x')}Clear</button>
          <span class="spacer"></span>
          <span class="result-count" id="tc-count" aria-live="polite"></span>
        </div>
        <div id="tc-table"></div>
      </section>`;

    const countEl = el.querySelector('#tc-count');
    const clearBtn = el.querySelector('[data-clear]');

    const filtered = () => cases.filter((t) => {
      const q = filters.q.toLowerCase();
      return (!q || `${t.id} ${t.title}`.toLowerCase().includes(q))
        && (!filters.requirement || t.requirementId === filters.requirement)
        && (!filters.type || t.type === filters.type)
        && (!filters.status || t.status === filters.status)
        && (!filters.technique || t.technique === filters.technique);
    });

    const emptyHtml = () => (cases.length
      ? emptyState({ iconName: 'search', title: 'No test cases match', text: 'Try another search term or clear the filters.', actionHtml: '<button type="button" class="btn btn-secondary btn-sm" data-clear-empty>Clear filters</button>' })
      : emptyState({ iconName: 'flask-conical', title: 'No test cases yet', text: 'Write your first scenario by hand. Each test case links back to a requirement.', actionHtml: `<button type="button" class="btn btn-primary" data-add-empty>${icon('plus')}Add test case</button>` }));

    async function drawStats() {
      const s = await TestCaseService.stats();
      el.querySelector('#tc-stats').innerHTML = [
        statCard({ label: 'Total test cases', value: s.total, iconName: 'flask-conical', tone: 'caramel', foot: `across ${new Set(cases.map((c) => c.requirementId)).size} requirements` }),
        statCard({ label: 'Validated', value: s.validated, iconName: 'shield-check', tone: 'success', foot: 'approved and ready to run' }),
        statCard({ label: 'Draft', value: s.draft, iconName: 'pencil', tone: 'warning', foot: 'waiting for review' }),
        statCard({ label: 'Rejected', value: s.rejected, iconName: 'ban', tone: 'error', foot: 'need rework or removal' }),
      ].join('');
    }

    function refresh() {
      const rows = filtered();
      table.opts.emptyHtml = emptyHtml();
      table.setRows(rows);
      countEl.textContent = `${rows.length} of ${cases.length} test cases`;
      clearBtn.hidden = !Object.values(filters).some(Boolean);
    }

    async function reload() {
      cases = await TestCaseService.list();
      suites = await TestSuiteService.list();
      refresh();
      drawStats();
      state.emit('data');
    }

    const rowActions = (t) => `<div class="actions">
      ${t.status !== 'Validated' ? `<button type="button" class="icon-btn ok" data-action="approve" aria-label="Approve ${esc(t.id)}" title="Approve">${icon('check')}</button>` : ''}
      ${t.status !== 'Rejected' ? `<button type="button" class="icon-btn danger" data-action="reject" aria-label="Reject ${esc(t.id)}" title="Reject">${icon('ban')}</button>` : ''}
      <button type="button" class="icon-btn" data-action="edit" aria-label="Edit ${esc(t.id)}" title="Edit">${icon('pencil')}</button>
      <button type="button" class="icon-btn" data-action="duplicate" aria-label="Duplicate ${esc(t.id)}" title="Duplicate">${icon('copy')}</button>
      <button type="button" class="icon-btn danger" data-action="delete" aria-label="Delete ${esc(t.id)}" title="Delete">${icon('trash-2')}</button></div>`;

    table = new DataTable(el.querySelector('#tc-table'), {
      noun: 'test cases', caption: 'Test cases', pageSize: 12, initialSort: { key: 'id', dir: 'asc' },
      columns: [
        { key: 'id', label: 'Test ID', sortable: true, render: (t) => idChip(t.id) },
        { key: 'title', label: 'Test name', sortable: true, render: (t) => `<div class="cell-title">${esc(t.title)}</div>` },
        { key: 'requirementId', label: 'Requirement', sortable: true, render: (t) => `<span class="mono-cell text-muted">${esc(t.requirementId)}</span>` },
        { key: 'type', label: 'Type', sortable: true, render: (t) => typeBadge(t.type) },
        { key: 'technique', label: 'Technique', sortable: true, render: (t) => `<span class="text-sm">${esc(t.technique)}</span>` },
        { key: 'status', label: 'Status', sortable: true, render: (t) => validationBadge(t.status) },
        { key: 'priority', label: 'Priority', sortable: true, sortValue: (t) => PRIORITY_ORDER[t.priority], render: (t) => priorityEl(t.priority) },
        { key: 'actions', label: 'Actions', align: 'right', render: rowActions },
      ],
      rows: cases,
      onRowClick: (t) => openDetails(t.id),
      onAction: (a, t) => act(a, t),
    });

    /* ---- Filters ---- */
    const bind = (id, key) => el.querySelector(id).addEventListener('change', (e) => { filters[key] = e.target.value; refresh(); });
    bind('#tc-req', 'requirement'); bind('#tc-type', 'type'); bind('#tc-status', 'status'); bind('#tc-tech', 'technique');
    el.querySelector('#tc-search').addEventListener('input', debounce((e) => { filters.q = e.target.value.trim(); refresh(); }, 150));
    const clearAll = () => {
      Object.keys(filters).forEach((k) => { filters[k] = ''; });
      el.querySelectorAll('.toolbar select, .toolbar input').forEach((n) => { n.value = ''; });
      refresh();
    };
    clearBtn.addEventListener('click', clearAll);
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-add], [data-add-empty]')) openForm();
      if (e.target.closest('[data-clear-empty]')) clearAll();
    });

    /* ---- Actions shared by table and drawer ---- */
    async function act(action, t, drawer) {
      try {
        if (action === 'approve') {
          await TestCaseService.approveTestCase(t.id);
          toast.success('Test case approved', `${t.id} is validated and can now run in its suite.`);
        } else if (action === 'reject') {
          await TestCaseService.rejectTestCase(t.id);
          toast.warning('Test case rejected', `${t.id} was marked as rejected.`);
        } else if (action === 'duplicate') {
          const copy = await TestCaseService.duplicateTestCase(t.id);
          toast.success('Test case duplicated', `${copy.id} was created as a draft.`);
        } else if (action === 'edit') {
          drawer?.close({ instant: true, skipFocus: true });
          openForm(await TestCaseService.get(t.id));
          return;
        } else if (action === 'delete') {
          const ok = await confirmDialog({ title: `Delete ${t.id}?`, confirmLabel: 'Delete test case', message: `“${esc(t.title)}” will be removed from the project and from its suite.` });
          if (!ok) return;
          await TestCaseService.deleteTestCase(t.id);
          toast.success('Test case deleted', `${t.id} was removed.`);
        }
        drawer?.close({ instant: true, skipFocus: true });
        await reload();
        if (drawer && action !== 'delete' && action !== 'duplicate') openDetails(t.id);
      } catch (err) {
        toast.error('That action did not work', err.message);
      }
    }

    /* ---- Details drawer ---- */
    async function openDetails(id) {
      const t = await TestCaseService.get(id);
      if (!t) { toast.error('Test case not found', `${id} does not exist in this project.`); return; }
      const req = reqById().get(t.requirementId);
      const suite = suites.find((s) => s.id === t.suiteId);
      const ac = req?.acceptanceCriteria[t.acceptanceIndex] ?? '—';
      openDrawer({
        title: t.title,
        meta: `${idChip(t.id)}${validationBadge(t.status)}${typeBadge(t.type)}`,
        body: `
          <div class="meta-grid">
            <div class="meta-item"><div class="k">Requirement</div><div class="v">${req ? `<a href="#/requirements/${esc(req.id)}">${esc(req.id)} · ${esc(req.title)}</a>` : '—'}</div></div>
            <div class="meta-item"><div class="k">Priority</div><div class="v">${priorityEl(t.priority)}</div></div>
            <div class="meta-item"><div class="k">Design technique</div><div class="v">${esc(t.technique)}</div></div>
            <div class="meta-item"><div class="k">Suite</div><div class="v">${esc(suite?.name ?? 'Not assigned')}</div></div>
            <div class="meta-item"><div class="k">Last result</div><div class="v">${resultBadge(effectiveResult(t))}</div></div>
            <div class="meta-item"><div class="k">Updated</div><div class="v">${relTime(t.updatedAt)}<span class="text-muted text-sm"> by ${esc(t.author)}</span></div></div>
          </div>
          <section class="detail-section"><h4>Objective</h4><p>${esc(t.objective)}</p></section>
          <section class="detail-section"><h4>Associated user story</h4><div class="detail-quote">${esc(req?.userStory ?? 'No requirement linked.')}</div></section>
          <section class="detail-section"><h4>Acceptance criterion covered</h4><ul class="check-list"><li>${icon('circle-check')}<span>${esc(ac)}</span></li></ul></section>
          <section class="detail-section"><h4>Preconditions</h4><p>${esc(t.preconditions || 'None.')}</p></section>
          <section class="detail-section"><h4>Test data</h4><pre class="code-block">${esc(t.testData || 'None.')}</pre></section>
          <section class="detail-section"><h4>Execution steps</h4><ol class="step-list">${t.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ol></section>
          <section class="detail-section"><h4>Expected result</h4><p>${esc(t.expectedResult)}</p></section>`,
        footer: `
          <button type="button" class="btn btn-secondary" data-a="edit">${icon('pencil')}Edit</button>
          <button type="button" class="btn btn-success-soft" data-a="approve" ${t.status === 'Validated' ? 'disabled' : ''}>${icon('check')}Approve</button>
          <button type="button" class="btn btn-danger-soft" data-a="reject" ${t.status === 'Rejected' ? 'disabled' : ''}>${icon('ban')}Reject</button>
          <button type="button" class="btn btn-secondary" data-a="duplicate">${icon('copy')}Duplicate</button>
          <button type="button" class="btn btn-ghost" data-a="delete" style="margin-left:auto;color:var(--color-error)">${icon('trash-2')}Delete</button>`,
        onOpen(node, layer) {
          node.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => act(b.dataset.a, t, layer)));
          node.querySelectorAll('a[href^="#/requirements"]').forEach((a) => a.addEventListener('click', () => layer.close({ instant: true, skipFocus: true })));
        },
      });
    }

    /* ---- Add / edit modal ---- */
    function openForm(tc) {
      const editing = Boolean(tc);
      let steps;
      const initialReq = tc?.requirementId ?? reqs[0]?.id ?? '';
      openModal({
        title: editing ? `Edit ${tc.id}` : 'Add test case',
        subtitle: editing ? 'Update the scenario. Re-approve it if the change affects the expected behavior.' : 'Describe the scenario so anyone on the team can run it the same way.',
        size: 'lg',
        body: `
          <div class="row row-between row-wrap" style="margin-bottom:18px">
            <span class="text-sm text-muted">Fields marked * are required.</span>
            <button type="button" class="btn btn-ai btn-sm" disabled aria-disabled="true">${icon('sparkles')}Generate with AI — Coming Soon</button>
          </div>
          <form id="tc-form" class="form-grid" novalidate>
            ${field({ id: 'f-title', label: 'Test title', required: true, span2: true, control: `<input class="input" id="f-title" name="title" required minlength="8" maxlength="120" placeholder="For example, Reject a malformed email on registration" value="${esc(tc?.title ?? '')}">` })}
            ${field({ id: 'f-req', label: 'Requirement', required: true, control: `<select class="select" id="f-req" name="requirementId" required>${options(reqs.map((r) => [r.id, `${r.id} · ${r.title}`]), initialReq, { placeholder: 'Choose a requirement' })}</select>` })}
            ${field({ id: 'f-suite', label: 'Test suite', required: true, control: `<select class="select" id="f-suite" name="suiteId" required>${options(suites.map((s) => [s.id, s.name]), tc?.suiteId ?? suites[0]?.id, { placeholder: 'Choose a suite' })}</select>` })}
            <div class="field span-2">
              <span class="label">Associated user story</span>
              <div class="detail-quote" id="f-story-preview" style="font-size:14.5px"></div>
            </div>
            ${field({ id: 'f-ac', label: 'Acceptance criterion covered', required: true, span2: true, control: '<select class="select" id="f-ac" name="acceptanceIndex" required></select>' })}
            ${field({ id: 'f-objective', label: 'Objective', required: true, span2: true, control: `<textarea class="textarea" id="f-objective" name="objective" required minlength="10" rows="2" placeholder="What does this test confirm?">${esc(tc?.objective ?? '')}</textarea>` })}
            ${field({ id: 'f-type', label: 'Test type', required: true, control: `<select class="select" id="f-type" name="type" required>${options(['Positive', 'Negative'], tc?.type ?? 'Positive')}</select>` })}
            ${field({ id: 'f-tech', label: 'Design technique', required: true, control: `<select class="select" id="f-tech" name="technique" required>${options(TECHNIQUES, tc?.technique ?? TECHNIQUES[0])}</select>` })}
            ${field({ id: 'f-priority', label: 'Priority', required: true, control: `<select class="select" id="f-priority" name="priority" required>${options(PRIORITIES, tc?.priority ?? 'Medium')}</select>` })}
            ${field({ id: 'f-status', label: 'Validation status', required: true, control: `<select class="select" id="f-status" name="status" required>${options(STATUSES, tc?.status ?? 'Draft')}</select>` })}
            ${field({ id: 'f-pre', label: 'Preconditions', span2: true, control: `<textarea class="textarea" id="f-pre" name="preconditions" rows="2" placeholder="State the system must be in before the test starts">${esc(tc?.preconditions ?? '')}</textarea>` })}
            ${field({ id: 'f-data', label: 'Test data', span2: true, control: `<textarea class="textarea mono-input" id="f-data" name="testData" rows="2" placeholder="Email: maia.chen@example.com">${esc(tc?.testData ?? '')}</textarea>` })}
            <div class="field span-2">
              <span class="label" id="steps-label">Execution steps<span class="req" aria-hidden="true">*</span></span>
              <div id="steps-list" role="group" aria-labelledby="steps-label"></div>
            </div>
            ${field({ id: 'f-expected', label: 'Expected result', required: true, span2: true, control: `<textarea class="textarea" id="f-expected" name="expectedResult" required minlength="5" rows="2" placeholder="What should the application do?">${esc(tc?.expectedResult ?? '')}</textarea>` })}
          </form>`,
        footer: `<button type="button" class="btn btn-secondary" data-close>Cancel</button>
                 <button type="submit" form="tc-form" class="btn btn-primary">${icon('check')}${editing ? 'Save changes' : 'Add test case'}</button>`,
        onOpen(node, layer) {
          const form = node.querySelector('#tc-form');
          liveValidate(form);
          steps = dynamicList(node.querySelector('#steps-list'), {
            values: tc?.steps ?? [], label: 'Step', placeholder: 'Describe one action the tester takes', addLabel: 'Add step', min: 1, minMessage: 'Add at least one execution step.',
          });
          const syncReq = () => {
            const r = reqById().get(form.elements.requirementId.value);
            node.querySelector('#f-story-preview').textContent = r?.userStory ?? 'Choose a requirement to see its user story.';
            const acSel = form.elements.acceptanceIndex;
            acSel.innerHTML = r ? r.acceptanceCriteria.map((a, i) => `<option value="${i}" ${i === (tc?.acceptanceIndex ?? 0) && r.id === tc?.requirementId ? 'selected' : ''}>${esc(a.length > 90 ? `${a.slice(0, 88)}…` : a)}</option>`).join('') : '<option value="">Choose a requirement first</option>';
          };
          form.elements.requirementId.addEventListener('change', syncReq);
          syncReq();

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const okFields = validateForm(form);
            const okSteps = steps.validate();
            if (!okFields || !okSteps) return;
            const v = (n) => form.elements[n].value;
            const data = {
              title: v('title').trim(), requirementId: v('requirementId'), suiteId: v('suiteId'), acceptanceIndex: Number(v('acceptanceIndex')),
              objective: v('objective').trim(), type: v('type'), technique: v('technique'), priority: v('priority'), status: v('status'),
              preconditions: v('preconditions').trim(), testData: v('testData').trim(), steps: steps.getValues(), expectedResult: v('expectedResult').trim(),
            };
            const btn = node.querySelector('[type="submit"]');
            btn.disabled = true;
            try {
              if (editing) {
                await TestCaseService.updateTestCase(tc.id, data);
                toast.success('Test case updated', `${tc.id} was saved.`);
              } else {
                const created = await TestCaseService.createTestCase(data);
                toast.success('Test case added', `${created.id} was created.`);
              }
              layer.close();
              reload();
            } catch (err) {
              btn.disabled = false;
              toast.error('Could not save the test case', err.message);
            }
          });
        },
      });
    }

    refresh();
    drawStats();
    if (ctx.param) openDetails(ctx.param);
  },
};
