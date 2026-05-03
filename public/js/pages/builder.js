import { api } from '../api.js';
import { getState, setState } from '../state.js';
import { showToast } from '../components/toast.js';
import { navigate } from '../router.js';
import { escapeHtml, formatDate } from '../utils/dom.js';

export async function initBuilder() {
  const container = document.getElementById('builder-container');
  container.innerHTML = `<div class="d-flex align-items-center gap-2 text-muted" role="status">
    <div class="spinner-border spinner-border-sm" aria-hidden="true"></div><span>Loading…</span></div>`;

  document.getElementById('view-preview-btn').onclick = () => navigate('preview');
  document.getElementById('save-config-btn').onclick = saveConfig;

  try {
    const [jobs, skills, categories, certs, awards] = await Promise.all([
      api.getJobs(), api.getSkills(), api.getSkillCategories(),
      api.getCertifications(), api.getAwards()
    ]);
    setState('jobs', jobs);
    setState('skills', skills);
    setState('skillCategories', categories);
    setState('certifications', certs);
    setState('awards', awards);
    renderBuilder(container);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load: ${escapeHtml(err.message)}</div>`;
  }
}

function renderBuilder(container) {
  const config = getState('currentResumeConfig');
  const jobs = getState('jobs') || [];
  const skills = getState('skills') || [];
  const categories = getState('skillCategories') || [];
  const certs = getState('certifications') || [];
  const awards = getState('awards') || [];

  container.innerHTML = `
    <div class="row g-4">
      <!-- Selection Panel -->
      <div class="col-lg-7">

        <!-- Jobs -->
        <div class="card shadow-sm mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h2 class="h5 mb-0">
              <i class="bi bi-briefcase me-2" aria-hidden="true"></i>Work Experience
            </h2>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-link btn-sm p-0 select-all-jobs">Select All</button>
              <button type="button" class="btn btn-link btn-sm p-0 deselect-all-jobs">None</button>
            </div>
          </div>
          <div class="card-body p-0">
            ${jobs.length ? jobs.map(job => renderJobSelection(job, config)).join('') :
              '<p class="text-muted small p-3 mb-0">No jobs added yet.</p>'}
          </div>
        </div>

        <!-- Skills -->
        <div class="card shadow-sm mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h2 class="h5 mb-0">
              <i class="bi bi-stars me-2" aria-hidden="true"></i>Skills
            </h2>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-link btn-sm p-0 select-all-skills">Select All</button>
              <button type="button" class="btn btn-link btn-sm p-0 deselect-all-skills">None</button>
            </div>
          </div>
          <div class="card-body">
            ${skills.length ? renderSkillsSelection(skills, categories, config) :
              '<p class="text-muted small mb-0">No skills added yet.</p>'}
          </div>
        </div>

        <!-- Certifications -->
        <div class="card shadow-sm mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h2 class="h5 mb-0">
              <i class="bi bi-patch-check me-2" aria-hidden="true"></i>Certifications
            </h2>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-link btn-sm p-0 select-all-certs">Select All</button>
              <button type="button" class="btn btn-link btn-sm p-0 deselect-all-certs">None</button>
            </div>
          </div>
          <div class="card-body">
            ${certs.length ? certs.map(c => `
              <div class="form-check">
                <input class="form-check-input cert-check" type="checkbox"
                       id="cert-${c.id}" value="${c.id}"
                       ${config.certIds.includes(c.id) ? 'checked' : ''}
                       aria-label="${escapeHtml(c.name)}">
                <label class="form-check-label" for="cert-${c.id}">
                  ${escapeHtml(c.name)}
                  ${c.issuer ? `<span class="text-muted small"> — ${escapeHtml(c.issuer)}</span>` : ''}
                </label>
              </div>`).join('') :
              '<p class="text-muted small mb-0">No certifications added yet.</p>'}
          </div>
        </div>

        <!-- Awards -->
        <div class="card shadow-sm mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h2 class="h5 mb-0">
              <i class="bi bi-trophy me-2" aria-hidden="true"></i>Awards
            </h2>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-link btn-sm p-0 select-all-awards">Select All</button>
              <button type="button" class="btn btn-link btn-sm p-0 deselect-all-awards">None</button>
            </div>
          </div>
          <div class="card-body">
            ${awards.length ? awards.map(a => `
              <div class="form-check">
                <input class="form-check-input award-check" type="checkbox"
                       id="award-${a.id}" value="${a.id}"
                       ${config.awardIds.includes(a.id) ? 'checked' : ''}
                       aria-label="${escapeHtml(a.title)}">
                <label class="form-check-label" for="award-${a.id}">
                  ${escapeHtml(a.title)}
                  ${a.issuer ? `<span class="text-muted small"> — ${escapeHtml(a.issuer)}</span>` : ''}
                </label>
              </div>`).join('') :
              '<p class="text-muted small mb-0">No awards added yet.</p>'}
          </div>
        </div>

      </div>

      <!-- Summary panel -->
      <div class="col-lg-5">
        <div class="card shadow-sm sticky-top" style="top: 80px">
          <div class="card-header">
            <h2 class="h5 mb-0"><i class="bi bi-list-check me-2" aria-hidden="true"></i>Selection Summary</h2>
          </div>
          <div class="card-body" id="selection-summary"></div>
          <div class="card-footer">
            <button class="btn btn-primary w-100" id="go-preview-btn">
              <i class="bi bi-eye me-1" aria-hidden="true"></i> View Full Preview
            </button>
          </div>
        </div>
      </div>
    </div>`;

  wireBuilderEvents(container);
  updateSummary();
}

function renderJobSelection(job, config) {
  const dateStr = job.is_current
    ? `${formatDate(job.start_date)} – Present`
    : `${formatDate(job.start_date)} – ${formatDate(job.end_date)}`;

  return `
    <div class="border-bottom p-3" data-job-id="${job.id}">
      <div class="form-check">
        <input class="form-check-input job-check" type="checkbox"
               id="job-${job.id}" value="${job.id}"
               ${config.jobIds.includes(job.id) ? 'checked' : ''}
               aria-expanded="${config.jobIds.includes(job.id)}"
               aria-controls="job-resps-${job.id}">
        <label class="form-check-label fw-semibold" for="job-${job.id}">
          ${escapeHtml(job.title)} — ${escapeHtml(job.company)}
          <span class="text-muted fw-normal small ms-1">${escapeHtml(dateStr)}</span>
        </label>
      </div>
      <div id="job-resps-${job.id}"
           class="ms-4 mt-2 ${config.jobIds.includes(job.id) ? '' : 'd-none'}"
           aria-label="Responsibilities for ${escapeHtml(job.title)}">
        ${job.responsibilities.map(r => `
          <div class="form-check">
            <input class="form-check-input resp-check" type="checkbox"
                   id="resp-${r.id}" value="${r.id}"
                   ${config.respIds.includes(r.id) ? 'checked' : ''}
                   aria-label="${escapeHtml(r.bullet_text)}">
            <label class="form-check-label small" for="resp-${r.id}">
              ${escapeHtml(r.bullet_text)}
            </label>
          </div>`).join('') || '<p class="small text-muted mb-0">No bullet points.</p>'}
      </div>
    </div>`;
}

function renderSkillsSelection(skills, categories, config) {
  const grouped = {};
  const uncategorized = [];
  skills.forEach(s => {
    if (s.category_id) {
      if (!grouped[s.category_id]) grouped[s.category_id] = [];
      grouped[s.category_id].push(s);
    } else {
      uncategorized.push(s);
    }
  });

  let html = '';
  categories.forEach(cat => {
    const catSkills = grouped[cat.id] || [];
    if (!catSkills.length) return;
    html += `<p class="fw-semibold small text-muted mb-1 mt-2">${escapeHtml(cat.name)}</p>`;
    html += catSkills.map(s => `
      <div class="form-check form-check-inline">
        <input class="form-check-input skill-check" type="checkbox"
               id="skill-${s.id}" value="${s.id}"
               ${config.skillIds.includes(s.id) ? 'checked' : ''}
               aria-label="${escapeHtml(s.name)}">
        <label class="form-check-label small" for="skill-${s.id}">${escapeHtml(s.name)}</label>
      </div>`).join('');
  });

  if (uncategorized.length) {
    html += `<p class="fw-semibold small text-muted mb-1 mt-2">Other</p>`;
    html += uncategorized.map(s => `
      <div class="form-check form-check-inline">
        <input class="form-check-input skill-check" type="checkbox"
               id="skill-${s.id}" value="${s.id}"
               ${config.skillIds.includes(s.id) ? 'checked' : ''}
               aria-label="${escapeHtml(s.name)}">
        <label class="form-check-label small" for="skill-${s.id}">${escapeHtml(s.name)}</label>
      </div>`).join('');
  }

  return html;
}

function wireBuilderEvents(container) {
  // Job checkboxes — toggle responsibilities section
  container.querySelectorAll('.job-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const respsDiv = container.querySelector(`#job-resps-${cb.value}`);
      respsDiv?.classList.toggle('d-none', !cb.checked);
      cb.setAttribute('aria-expanded', cb.checked);
      updateConfig();
    });
  });

  // All other checkboxes
  container.querySelectorAll('.resp-check, .skill-check, .cert-check, .award-check').forEach(cb => {
    cb.addEventListener('change', updateConfig);
  });

  // Select All / None buttons
  const makeToggle = (btnClass, checkClass, all) => {
    container.querySelector(`.${btnClass}`)?.addEventListener('click', () => {
      container.querySelectorAll(`.${checkClass}`).forEach(cb => {
        cb.checked = all;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  };

  makeToggle('select-all-jobs',    'job-check',   true);
  makeToggle('deselect-all-jobs',  'job-check',   false);
  makeToggle('select-all-skills',  'skill-check', true);
  makeToggle('deselect-all-skills','skill-check', false);
  makeToggle('select-all-certs',   'cert-check',  true);
  makeToggle('deselect-all-certs', 'cert-check',  false);
  makeToggle('select-all-awards',  'award-check', true);
  makeToggle('deselect-all-awards','award-check', false);

  container.querySelector('#go-preview-btn')?.addEventListener('click', () => navigate('preview'));
}

function updateConfig() {
  const container = document.getElementById('builder-container');
  const config = getState('currentResumeConfig');

  config.jobIds  = [...container.querySelectorAll('.job-check:checked')].map(c => Number(c.value));
  config.respIds = [...container.querySelectorAll('.resp-check:checked')].map(c => Number(c.value));
  config.skillIds= [...container.querySelectorAll('.skill-check:checked')].map(c => Number(c.value));
  config.certIds = [...container.querySelectorAll('.cert-check:checked')].map(c => Number(c.value));
  config.awardIds= [...container.querySelectorAll('.award-check:checked')].map(c => Number(c.value));

  setState('currentResumeConfig', config);
  updateSummary();
}

function updateSummary() {
  const config = getState('currentResumeConfig');
  const summary = document.getElementById('selection-summary');
  if (!summary) return;

  summary.innerHTML = `
    <dl class="row g-1 mb-0 small">
      <dt class="col-7">Jobs selected</dt>
      <dd class="col-5 text-end">${config.jobIds.length}</dd>
      <dt class="col-7">Bullet points</dt>
      <dd class="col-5 text-end">${config.respIds.length}</dd>
      <dt class="col-7">Skills</dt>
      <dd class="col-5 text-end">${config.skillIds.length}</dd>
      <dt class="col-7">Certifications</dt>
      <dd class="col-5 text-end">${config.certIds.length}</dd>
      <dt class="col-7">Awards</dt>
      <dd class="col-5 text-end">${config.awardIds.length}</dd>
    </dl>
    ${!config.jobIds.length && !config.skillIds.length
      ? '<p class="text-muted small mt-2 mb-0">Select at least one item to build your resume.</p>'
      : ''}`;
}

async function saveConfig() {
  const config = getState('currentResumeConfig');
  try {
    const resumes = await api.getResumes();
    // Update existing or create new
    if (config.id) {
      await api.updateResume(config.id, { name: config.name, config_json: JSON.stringify(config) });
    } else {
      const saved = await api.createResume({ name: config.name || 'My Resume', config_json: JSON.stringify(config) });
      config.id = saved.id;
      setState('currentResumeConfig', config);
    }
    showToast('Resume configuration saved!', 'success');
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
  }
}
