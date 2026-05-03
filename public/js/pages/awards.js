import { api } from '../api.js';
import { setState } from '../state.js';
import { showToast } from '../components/toast.js';
import { openModal, setModalLoading, confirmDelete } from '../components/modal.js';
import { attachAiReview } from '../components/aiSuggestion.js';
import { escapeHtml, formatDate, setEmpty } from '../utils/dom.js';
import { showFieldError, clearAllErrors } from '../utils/validators.js';

export async function initAwards() {
  const container = document.getElementById('awards-container');
  container.innerHTML = `<div class="d-flex align-items-center gap-2 text-muted" role="status">
    <div class="spinner-border spinner-border-sm" aria-hidden="true"></div><span>Loading…</span></div>`;

  document.getElementById('add-award-btn').onclick = () => openAwardForm(null);

  try {
    const awards = await api.getAwards();
    setState('awards', awards);
    renderAwards(awards, container);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load awards: ${escapeHtml(err.message)}</div>`;
  }
}

function renderAwards(awards, container) {
  container.innerHTML = '';
  if (!awards.length) {
    setEmpty(container, 'No awards yet. Click "Add Award" to get started.');
    return;
  }

  const row = document.createElement('div');
  row.className = 'row g-3';
  row.setAttribute('role', 'list');
  row.setAttribute('aria-label', 'Awards and achievements');

  awards.forEach(award => {
    const col = document.createElement('div');
    col.className = 'col-md-6';
    col.setAttribute('role', 'listitem');

    const dateStr = award.date ? formatDate(award.date.slice(0, 7)) : '';

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1 me-2">
              <h2 class="h6 mb-1">
                <i class="bi bi-trophy-fill text-warning me-1" aria-hidden="true"></i>
                ${escapeHtml(award.title)}
              </h2>
              ${award.issuer ? `<p class="small text-muted mb-1">${escapeHtml(award.issuer)}</p>` : ''}
              ${dateStr ? `<p class="small text-muted mb-1">
                <i class="bi bi-calendar3" aria-hidden="true"></i> ${escapeHtml(dateStr)}
              </p>` : ''}
              ${award.description ? `<p class="small mb-0">${escapeHtml(award.description)}</p>` : ''}
            </div>
            <div class="d-flex gap-1 flex-shrink-0">
              <button class="btn btn-outline-primary btn-sm edit-award-btn"
                      aria-label="Edit ${escapeHtml(award.title)}">
                <i class="bi bi-pencil" aria-hidden="true"></i>
              </button>
              <button class="btn btn-outline-danger btn-sm delete-award-btn"
                      aria-label="Delete ${escapeHtml(award.title)}">
                <i class="bi bi-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;

    col.querySelector('.edit-award-btn').addEventListener('click', () => openAwardForm(award));
    col.querySelector('.delete-award-btn').addEventListener('click', () => {
      confirmDelete(`Delete "${award.title}"?`, async () => {
        try {
          await api.deleteAward(award.id);
          const awards = await api.getAwards();
          setState('awards', awards);
          renderAwards(awards, container);
          showToast('Award deleted.', 'info');
        } catch (err) { showToast(`Error: ${err.message}`, 'error'); }
      });
    });

    row.appendChild(col);
  });

  container.appendChild(row);
}

function openAwardForm(award) {
  const isNew = !award;
  const bodyHtml = `
    <form id="award-form" novalidate>
      <div class="row g-3">
        <div class="col-12">
          <label for="aw-title" class="form-label">Award Title <span class="text-danger" aria-hidden="true">*</span></label>
          <input type="text" id="aw-title" name="title" class="form-control"
                 value="${escapeHtml(award?.title || '')}" required aria-required="true"
                 placeholder="e.g. Employee of the Year">
        </div>
        <div class="col-md-8">
          <label for="aw-issuer" class="form-label">Issuer / Organization</label>
          <input type="text" id="aw-issuer" name="issuer" class="form-control"
                 value="${escapeHtml(award?.issuer || '')}"
                 placeholder="e.g. Acme Corporation">
        </div>
        <div class="col-md-4">
          <label for="aw-date" class="form-label">Date</label>
          <input type="month" id="aw-date" name="date" class="form-control"
                 value="${award?.date ? award.date.slice(0,7) : ''}">
        </div>
        <div class="col-12">
          <label for="aw-desc" class="form-label">Description</label>
          <textarea id="aw-desc" name="description" class="form-control" rows="3"
                    placeholder="Describe what you achieved or why you received this award.">${escapeHtml(award?.description || '')}</textarea>
        </div>
      </div>
    </form>`;

  openModal(isNew ? 'Add Award' : 'Edit Award', bodyHtml, async () => {
    const form = document.getElementById('award-form');
    clearAllErrors(form);
    const data = Object.fromEntries(new FormData(form));
    if (!data.title?.trim()) { showFieldError(form.querySelector('#aw-title'), 'Title is required.'); return false; }

    setModalLoading(true);
    try {
      if (isNew) await api.createAward(data);
      else await api.updateAward(award.id, data);
      const awards = await api.getAwards();
      setState('awards', awards);
      renderAwards(awards, document.getElementById('awards-container'));
      showToast(`Award ${isNew ? 'added' : 'updated'}!`, 'success');
      return true;
    } catch (err) { showToast(`Error: ${err.message}`, 'error'); return false; }
    finally { setModalLoading(false); }
  });

  const descEl = document.getElementById('aw-desc');
  attachAiReview(descEl, 'award', 'Award Description');
}
