import { api } from '../api.js';
import { setState } from '../state.js';
import { showToast } from '../components/toast.js';
import { attachAiReview } from '../components/aiSuggestion.js';
import { escapeHtml } from '../utils/dom.js';
import { validateEmail, validateUrl, showFieldError, clearAllErrors } from '../utils/validators.js';

export async function initProfile() {
  const container = document.getElementById('profile-form-container');
  container.innerHTML = `
    <div class="d-flex align-items-center gap-2 text-muted" role="status">
      <div class="spinner-border spinner-border-sm" aria-hidden="true"></div>
      <span>Loading profile…</span>
    </div>`;

  try {
    const profile = await api.getProfile();
    setState('profile', profile);
    renderProfileForm(profile, container);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger" role="alert">Failed to load profile: ${escapeHtml(err.message)}</div>`;
  }
}

function renderProfileForm(profile, container) {
  container.innerHTML = `
    <form id="profile-form" novalidate class="row g-3">
      <div class="col-md-6">
        <label for="pf-name" class="form-label">Full Name <span aria-hidden="true" class="text-danger">*</span></label>
        <input type="text" id="pf-name" name="full_name" class="form-control"
               value="${escapeHtml(profile.full_name)}" required
               aria-required="true" autocomplete="name">
      </div>
      <div class="col-md-6">
        <label for="pf-email" class="form-label">Email <span aria-hidden="true" class="text-danger">*</span></label>
        <input type="email" id="pf-email" name="email" class="form-control"
               value="${escapeHtml(profile.email)}" required
               aria-required="true" autocomplete="email">
      </div>
      <div class="col-md-4">
        <label for="pf-phone" class="form-label">Phone</label>
        <input type="tel" id="pf-phone" name="phone" class="form-control"
               value="${escapeHtml(profile.phone)}" autocomplete="tel">
      </div>
      <div class="col-md-8">
        <label for="pf-location" class="form-label">Location</label>
        <input type="text" id="pf-location" name="location" class="form-control"
               value="${escapeHtml(profile.location)}"
               placeholder="City, State" autocomplete="address-level2">
      </div>
      <div class="col-md-4">
        <label for="pf-linkedin" class="form-label">LinkedIn URL</label>
        <input type="url" id="pf-linkedin" name="linkedin" class="form-control"
               value="${escapeHtml(profile.linkedin)}"
               placeholder="https://linkedin.com/in/yourname">
      </div>
      <div class="col-md-4">
        <label for="pf-github" class="form-label">GitHub URL</label>
        <input type="url" id="pf-github" name="github" class="form-control"
               value="${escapeHtml(profile.github)}"
               placeholder="https://github.com/yourname">
      </div>
      <div class="col-md-4">
        <label for="pf-website" class="form-label">Website</label>
        <input type="url" id="pf-website" name="website" class="form-control"
               value="${escapeHtml(profile.website)}"
               placeholder="https://yoursite.com">
      </div>
      <div class="col-12">
        <label for="pf-summary" class="form-label">Professional Summary</label>
        <textarea id="pf-summary" name="summary" class="form-control" rows="4"
                  aria-describedby="pf-summary-hint">${escapeHtml(profile.summary)}</textarea>
        <div id="pf-summary-hint" class="form-text">
          A 2–4 sentence overview of your experience and goals. Click AI Suggest for help.
        </div>
      </div>
      <div class="col-12">
        <button type="submit" class="btn btn-primary">
          <i class="bi bi-floppy" aria-hidden="true"></i> Save Profile
        </button>
      </div>
    </form>`;

  // Attach AI review to summary
  const summaryEl = container.querySelector('#pf-summary');
  attachAiReview(summaryEl, 'profile_summary', 'Professional Summary');

  const form = container.querySelector('#profile-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors(form);

    let valid = true;
    const data = Object.fromEntries(new FormData(form));

    if (!data.full_name.trim()) {
      showFieldError(form.querySelector('#pf-name'), 'Full name is required.');
      valid = false;
    }
    if (!data.email.trim()) {
      showFieldError(form.querySelector('#pf-email'), 'Email is required.');
      valid = false;
    } else {
      const emailErr = validateEmail(data.email);
      if (emailErr) { showFieldError(form.querySelector('#pf-email'), emailErr); valid = false; }
    }
    ['linkedin', 'github', 'website'].forEach(field => {
      if (data[field]) {
        const err = validateUrl(data[field]);
        if (err) { showFieldError(form.querySelector(`#pf-${field}`), err); valid = false; }
      }
    });

    if (!valid) return;

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Saving…';

    try {
      const updated = await api.saveProfile(data);
      setState('profile', updated);
      showToast('Profile saved successfully!', 'success');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-floppy" aria-hidden="true"></i> Save Profile';
    }
  });
}
