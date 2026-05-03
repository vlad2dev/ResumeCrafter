import { api } from '../api.js';
import { setState } from '../state.js';
import { showToast } from '../components/toast.js';
import { openModal, setModalLoading, confirmDelete } from '../components/modal.js';
import { attachAiReview } from '../components/aiSuggestion.js';
import { escapeHtml, formatDate, setEmpty } from '../utils/dom.js';
import { showFieldError, clearAllErrors } from '../utils/validators.js';

export async function initCerts() {
  const container = document.getElementById('certs-container');
  container.innerHTML = `<div class="d-flex align-items-center gap-2 text-muted" role="status">
    <div class="spinner-border spinner-border-sm" aria-hidden="true"></div><span>Loading…</span></div>`;

  document.getElementById('add-cert-btn').onclick = () => openCertForm(null);

  try {
    const certs = await api.getCertifications();
    setState('certifications', certs);
    renderCerts(certs, container);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load certifications: ${escapeHtml(err.message)}</div>`;
  }
}

function renderCerts(certs, container) {
  container.innerHTML = '';
  if (!certs.length) {
    setEmpty(container, 'No certifications yet. Click "Add Certification" to get started.');
    return;
  }

  const row = document.createElement('div');
  row.className = 'row g-3';
  row.setAttribute('role', 'list');
  row.setAttribute('aria-label', 'Certifications');

  certs.forEach(cert => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.setAttribute('role', 'listitem');

    const issued = cert.issue_date ? formatDate(cert.issue_date.slice(0, 7)) : '';
    const expires = cert.expiry_date ? formatDate(cert.expiry_date.slice(0, 7)) : '';

    col.innerHTML = `
      <div class="card h-100 shadow-sm" data-cert-id="${cert.id}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1 me-2">
              <h2 class="h6 mb-1">${escapeHtml(cert.name)}</h2>
              ${cert.issuer ? `<p class="small text-muted mb-1">${escapeHtml(cert.issuer)}</p>` : ''}
              ${issued ? `<p class="small text-muted mb-1">
                <i class="bi bi-calendar3" aria-hidden="true"></i>
                Issued ${escapeHtml(issued)}${expires ? ` · Expires ${escapeHtml(expires)}` : ''}
              </p>` : ''}
              ${cert.credential_id ? `<p class="small text-muted mb-0">ID: ${escapeHtml(cert.credential_id)}</p>` : ''}
            </div>
            <div class="d-flex gap-1 flex-shrink-0">
              <button class="btn btn-outline-primary btn-sm edit-cert-btn"
                      aria-label="Edit ${escapeHtml(cert.name)}">
                <i class="bi bi-pencil" aria-hidden="true"></i>
              </button>
              <button class="btn btn-outline-danger btn-sm delete-cert-btn"
                      aria-label="Delete ${escapeHtml(cert.name)}">
                <i class="bi bi-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;

    col.querySelector('.edit-cert-btn').addEventListener('click', () => openCertForm(cert));
    col.querySelector('.delete-cert-btn').addEventListener('click', () => {
      confirmDelete(`Delete "${cert.name}"?`, async () => {
        try {
          await api.deleteCert(cert.id);
          const certs = await api.getCertifications();
          setState('certifications', certs);
          renderCerts(certs, container);
          showToast('Certification deleted.', 'info');
        } catch (err) { showToast(`Error: ${err.message}`, 'error'); }
      });
    });

    row.appendChild(col);
  });

  container.appendChild(row);
}

function openCertForm(cert) {
  const isNew = !cert;
  const bodyHtml = `
    <form id="cert-form" novalidate>
      <div class="row g-3">
        <div class="col-12">
          <label for="cf-name" class="form-label">Certification Name <span class="text-danger" aria-hidden="true">*</span></label>
          <input type="text" id="cf-name" name="name" class="form-control"
                 value="${escapeHtml(cert?.name || '')}" required aria-required="true"
                 placeholder="e.g. AWS Certified Solutions Architect">
        </div>
        <div class="col-md-6">
          <label for="cf-issuer" class="form-label">Issuing Organization</label>
          <input type="text" id="cf-issuer" name="issuer" class="form-control"
                 value="${escapeHtml(cert?.issuer || '')}"
                 placeholder="e.g. Amazon Web Services">
        </div>
        <div class="col-md-3">
          <label for="cf-issued" class="form-label">Issue Date</label>
          <input type="month" id="cf-issued" name="issue_date" class="form-control"
                 value="${cert?.issue_date ? cert.issue_date.slice(0,7) : ''}">
        </div>
        <div class="col-md-3">
          <label for="cf-expiry" class="form-label">Expiry Date</label>
          <input type="month" id="cf-expiry" name="expiry_date" class="form-control"
                 value="${cert?.expiry_date ? cert.expiry_date.slice(0,7) : ''}">
        </div>
        <div class="col-md-6">
          <label for="cf-credid" class="form-label">Credential ID</label>
          <input type="text" id="cf-credid" name="credential_id" class="form-control"
                 value="${escapeHtml(cert?.credential_id || '')}">
        </div>
        <div class="col-md-6">
          <label for="cf-credurl" class="form-label">Credential URL</label>
          <input type="url" id="cf-credurl" name="credential_url" class="form-control"
                 value="${escapeHtml(cert?.credential_url || '')}"
                 placeholder="https://...">
        </div>
      </div>
    </form>`;

  openModal(isNew ? 'Add Certification' : 'Edit Certification', bodyHtml, async () => {
    const form = document.getElementById('cert-form');
    clearAllErrors(form);
    const data = Object.fromEntries(new FormData(form));
    if (!data.name?.trim()) { showFieldError(form.querySelector('#cf-name'), 'Name is required.'); return false; }

    setModalLoading(true);
    try {
      if (isNew) await api.createCert(data);
      else await api.updateCert(cert.id, data);
      const certs = await api.getCertifications();
      setState('certifications', certs);
      renderCerts(certs, document.getElementById('certs-container'));
      showToast(`Certification ${isNew ? 'added' : 'updated'}!`, 'success');
      return true;
    } catch (err) { showToast(`Error: ${err.message}`, 'error'); return false; }
    finally { setModalLoading(false); }
  });

  const nameEl = document.getElementById('cf-name');
  attachAiReview(nameEl, 'certification', 'Certification');
}
