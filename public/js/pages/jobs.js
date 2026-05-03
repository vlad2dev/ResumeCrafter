import { api } from '../api.js';
import { setState, getState } from '../state.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal, setModalLoading, confirmDelete } from '../components/modal.js';
import { attachAiReview } from '../components/aiSuggestion.js';
import { escapeHtml, formatDate, setEmpty } from '../utils/dom.js';
import { showFieldError, clearAllErrors } from '../utils/validators.js';

export async function initJobs() {
  const container = document.getElementById('jobs-container');
  container.innerHTML = `<div class="d-flex align-items-center gap-2 text-muted" role="status">
    <div class="spinner-border spinner-border-sm" aria-hidden="true"></div><span>Loading…</span></div>`;

  document.getElementById('add-job-btn').onclick = () => openJobForm(null);

  try {
    const jobs = await api.getJobs();
    setState('jobs', jobs);
    renderJobList(jobs, container);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load jobs: ${escapeHtml(err.message)}</div>`;
  }
}

function renderJobList(jobs, container) {
  container.innerHTML = '';
  if (!jobs.length) {
    setEmpty(container, 'No work experience yet. Click "Add Job" to get started.');
    return;
  }

  const list = document.createElement('div');
  list.className = 'row g-3';
  list.setAttribute('role', 'list');
  list.setAttribute('aria-label', 'Work experience entries');
  jobs.forEach(job => list.appendChild(renderJobCard(job)));
  container.appendChild(list);
}

function renderJobCard(job) {
  const col = document.createElement('div');
  col.className = 'col-12';
  col.setAttribute('role', 'listitem');

  const dateStr = job.is_current
    ? `${formatDate(job.start_date)} – Present`
    : `${formatDate(job.start_date)} – ${formatDate(job.end_date)}`;

  const respHtml = job.responsibilities.length
    ? `<ul class="mb-0 mt-2" aria-label="Responsibilities">
        ${job.responsibilities.map(r => `<li class="small text-muted">${escapeHtml(r.bullet_text)}</li>`).join('')}
       </ul>`
    : '<p class="small text-muted mb-0 mt-1 fst-italic">No responsibilities added yet.</p>';

  col.innerHTML = `
    <div class="card shadow-sm h-100" data-job-id="${job.id}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <h2 class="h5 mb-1">${escapeHtml(job.title)}</h2>
            <p class="mb-0 text-muted">
              <strong>${escapeHtml(job.company)}</strong>
              ${job.location ? ` &bull; ${escapeHtml(job.location)}` : ''}
            </p>
            <p class="small text-muted mb-0">
              <i class="bi bi-calendar3" aria-hidden="true"></i>
              <time>${escapeHtml(dateStr)}</time>
            </p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm edit-job-btn"
                    aria-label="Edit ${escapeHtml(job.title)} at ${escapeHtml(job.company)}">
              <i class="bi bi-pencil" aria-hidden="true"></i> Edit
            </button>
            <button class="btn btn-outline-danger btn-sm delete-job-btn"
                    aria-label="Delete ${escapeHtml(job.title)} at ${escapeHtml(job.company)}">
              <i class="bi bi-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="responsibilities-section">${respHtml}</div>
      </div>
    </div>`;

  col.querySelector('.edit-job-btn').addEventListener('click', () => openJobForm(job));
  col.querySelector('.delete-job-btn').addEventListener('click', () => {
    confirmDelete(
      `Delete "${job.title}" at ${job.company}? This will also remove all responsibilities.`,
      async () => {
        try {
          await api.deleteJob(job.id);
          const jobs = await api.getJobs();
          setState('jobs', jobs);
          renderJobList(jobs, document.getElementById('jobs-container'));
          showToast('Job deleted.', 'info');
        } catch (err) {
          showToast(`Delete failed: ${err.message}`, 'error');
        }
      }
    );
  });

  return col;
}

function openJobForm(job) {
  const isNew = !job;
  const respRows = job?.responsibilities || [];

  const bodyHtml = `
    <form id="job-form" novalidate>
      <div class="row g-3">
        <div class="col-md-6">
          <label for="jf-title" class="form-label">Job Title <span class="text-danger" aria-hidden="true">*</span></label>
          <input type="text" id="jf-title" name="title" class="form-control"
                 value="${escapeHtml(job?.title || '')}" required aria-required="true">
        </div>
        <div class="col-md-6">
          <label for="jf-company" class="form-label">Company <span class="text-danger" aria-hidden="true">*</span></label>
          <input type="text" id="jf-company" name="company" class="form-control"
                 value="${escapeHtml(job?.company || '')}" required aria-required="true">
        </div>
        <div class="col-md-6">
          <label for="jf-location" class="form-label">Location</label>
          <input type="text" id="jf-location" name="location" class="form-control"
                 value="${escapeHtml(job?.location || '')}" placeholder="City, State or Remote">
        </div>
        <div class="col-md-3">
          <label for="jf-start" class="form-label">Start Date <span class="text-danger" aria-hidden="true">*</span></label>
          <input type="month" id="jf-start" name="start_date" class="form-control"
                 value="${escapeHtml(job?.start_date || '')}" required aria-required="true">
        </div>
        <div class="col-md-3" id="end-date-col">
          <label for="jf-end" class="form-label">End Date</label>
          <input type="month" id="jf-end" name="end_date" class="form-control"
                 value="${escapeHtml(job?.end_date || '')}"
                 ${job?.is_current ? 'disabled' : ''}>
        </div>
        <div class="col-12">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="jf-current" name="is_current"
                   ${job?.is_current ? 'checked' : ''} value="1">
            <label class="form-check-label" for="jf-current">I currently work here</label>
          </div>
        </div>
        <div class="col-12">
          <label for="jf-desc" class="form-label">Job Description</label>
          <textarea id="jf-desc" name="description" class="form-control" rows="3"
                    aria-describedby="jf-desc-hint">${escapeHtml(job?.description || '')}</textarea>
          <div id="jf-desc-hint" class="form-text">Describe your role. Use AI Suggest to convert this into bullet points.</div>
        </div>
        <div class="col-12">
          <label class="form-label">Responsibilities / Bullet Points</label>
          <ul id="resp-list" class="list-unstyled mb-2" aria-label="Responsibility bullets">
            ${respRows.map((r, i) => renderRespRow(r.bullet_text, r.id, i)).join('')}
          </ul>
          <button type="button" id="add-resp-btn" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-plus-lg" aria-hidden="true"></i> Add Bullet Point
          </button>
        </div>
      </div>
    </form>`;

  openModal(isNew ? 'Add Work Experience' : 'Edit Work Experience', bodyHtml, async () => {
    return await saveJobForm(job);
  });

  // Wire up current-job checkbox
  document.getElementById('jf-current').addEventListener('change', (e) => {
    document.getElementById('jf-end').disabled = e.target.checked;
    if (e.target.checked) document.getElementById('jf-end').value = '';
  });

  // AI review on description
  const descEl = document.getElementById('jf-desc');
  attachAiReview(descEl, 'job_description', 'Job Description', (suggestion) => {
    // Convert suggestion (bullet points) into individual responsibility inputs
    const lines = suggestion.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
    const list = document.getElementById('resp-list');
    lines.forEach(line => {
      const li = document.createElement('li');
      li.innerHTML = renderRespRow(line, null, list.children.length);
      list.appendChild(li.firstElementChild);
      wireRespRow(list.lastElementChild);
    });
  });

  // Wire existing resp rows
  document.querySelectorAll('.resp-row').forEach(row => wireRespRow(row));

  // Add bullet button
  document.getElementById('add-resp-btn').addEventListener('click', () => {
    const list = document.getElementById('resp-list');
    const li = document.createElement('li');
    li.innerHTML = renderRespRow('', null, list.children.length);
    list.appendChild(li.firstElementChild);
    const newRow = list.lastElementChild;
    wireRespRow(newRow);
    newRow.querySelector('input').focus();
  });
}

function renderRespRow(text, id, index) {
  return `
    <li class="resp-row d-flex gap-2 align-items-center mb-2" data-resp-id="${id || ''}">
      <input type="text" class="form-control form-control-sm resp-input"
             value="${escapeHtml(text)}"
             aria-label="Responsibility bullet point ${index + 1}">
      <button type="button" class="btn btn-outline-danger btn-sm delete-resp-btn"
              aria-label="Remove this bullet point">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    </li>`;
}

function wireRespRow(rowEl) {
  const input = rowEl.querySelector('.resp-input');
  attachAiReview(input, 'job_responsibility', 'Bullet Point');
  rowEl.querySelector('.delete-resp-btn').addEventListener('click', () => rowEl.remove());
}

async function saveJobForm(job) {
  const form = document.getElementById('job-form');
  clearAllErrors(form);

  const data = Object.fromEntries(new FormData(form));
  data.is_current = form.querySelector('#jf-current').checked ? 1 : 0;
  if (data.is_current) data.end_date = null;

  let valid = true;
  if (!data.title?.trim()) { showFieldError(form.querySelector('#jf-title'), 'Title is required.'); valid = false; }
  if (!data.company?.trim()) { showFieldError(form.querySelector('#jf-company'), 'Company is required.'); valid = false; }
  if (!data.start_date) { showFieldError(form.querySelector('#jf-start'), 'Start date is required.'); valid = false; }
  if (!valid) return false;

  // Collect responsibilities
  const respInputs = [...form.querySelectorAll('.resp-row')];
  const responsibilities = respInputs
    .map((row, i) => ({
      id: row.dataset.respId || null,
      bullet_text: row.querySelector('.resp-input').value.trim(),
      sort_order: i
    }))
    .filter(r => r.bullet_text);

  setModalLoading(true);
  try {
    let savedJob;
    if (!job) {
      savedJob = await api.createJob(data);
    } else {
      savedJob = await api.updateJob(job.id, data);
    }

    // Save responsibilities: delete removed ones, upsert existing/new
    const existingIds = (job?.responsibilities || []).map(r => r.id);
    const keptIds = responsibilities.filter(r => r.id).map(r => Number(r.id));
    const deletedIds = existingIds.filter(id => !keptIds.includes(id));

    await Promise.all(deletedIds.map(id => api.deleteResp(savedJob.id, id)));

    for (let i = 0; i < responsibilities.length; i++) {
      const r = responsibilities[i];
      if (r.id) {
        await api.updateResp(savedJob.id, r.id, { bullet_text: r.bullet_text, sort_order: i });
      } else {
        await api.createResp(savedJob.id, { bullet_text: r.bullet_text, sort_order: i });
      }
    }

    const jobs = await api.getJobs();
    setState('jobs', jobs);
    renderJobList(jobs, document.getElementById('jobs-container'));
    showToast(`Job ${job ? 'updated' : 'added'} successfully!`, 'success');
    return true;
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
    return false;
  } finally {
    setModalLoading(false);
  }
}
