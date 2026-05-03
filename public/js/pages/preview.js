import { api } from '../api.js';
import { getState } from '../state.js';
import { navigate } from '../router.js';
import { escapeHtml, formatDate } from '../utils/dom.js';

function stripUrl(url) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

export async function initPreview() {
  const container = document.getElementById('preview-container');
  container.innerHTML = `<div class="d-flex align-items-center gap-2 text-muted" role="status">
    <div class="spinner-border spinner-border-sm" aria-hidden="true"></div><span>Building resume…</span></div>`;

  document.getElementById('back-to-builder-btn').onclick = () => navigate('builder');

  try {
    const [profile, jobs, skills, categories, certs, awards] = await Promise.all([
      api.getProfile(), api.getJobs(), api.getSkills(),
      api.getSkillCategories(), api.getCertifications(), api.getAwards()
    ]);

    const config = getState('currentResumeConfig');

    // Filter based on builder selections
    const selectedJobs = jobs
      .filter(j => config.jobIds.includes(j.id))
      .map(j => ({
        ...j,
        responsibilities: j.responsibilities.filter(r => config.respIds.includes(r.id))
      }));

    const selectedSkills = skills.filter(s => config.skillIds.includes(s.id));
    const selectedCerts  = certs.filter(c => config.certIds.includes(c.id));
    const selectedAwards = awards.filter(a => config.awardIds.includes(a.id));

    // Group selected skills by category
    const skillsByCategory = {};
    const uncatSkills = [];
    selectedSkills.forEach(s => {
      if (s.category_id) {
        const cat = categories.find(c => c.id === s.category_id);
        const catName = cat?.name || 'Other';
        if (!skillsByCategory[catName]) skillsByCategory[catName] = [];
        skillsByCategory[catName].push(s.name);
      } else {
        uncatSkills.push(s.name);
      }
    });
    if (uncatSkills.length) skillsByCategory['Skills'] = uncatSkills;

    container.innerHTML = renderResumeHtml(profile, selectedJobs, skillsByCategory, selectedCerts, selectedAwards);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to build preview: ${escapeHtml(err.message)}</div>`;
  }
}

function renderResumeHtml(profile, jobs, skillsByCategory, certs, awards) {
  const hasContent = jobs.length || Object.keys(skillsByCategory).length || certs.length || awards.length;

  if (!hasContent && !profile.full_name) {
    return `<div class="alert alert-info">
      <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
      Your resume is empty. Go to the <a href="#builder" data-nav="builder">Builder</a> to select content,
      and <a href="#profile" data-nav="profile">Profile</a> to add your details.
    </div>`;
  }

  return `
    <div id="resume-document" class="resume-doc" aria-label="Resume document">

      <!-- Header -->
      <header class="resume-header" role="banner">
        <h1 class="resume-name">${escapeHtml(profile.full_name || 'Your Name')}</h1>
        <div class="resume-contact" aria-label="Contact information">
          ${[
            profile.email     ? escapeHtml(profile.email) : '',
            profile.phone     ? escapeHtml(profile.phone) : '',
            profile.location  ? escapeHtml(profile.location) : '',
            profile.linkedin  ? escapeHtml(stripUrl(profile.linkedin)) : '',
            profile.github    ? escapeHtml(stripUrl(profile.github)) : '',
            profile.website   ? escapeHtml(stripUrl(profile.website)) : '',
          ].filter(Boolean).join(' <span class="resume-sep" aria-hidden="true">|</span> ')}
        </div>
        ${profile.summary ? `<p class="resume-summary">${escapeHtml(profile.summary)}</p>` : ''}
      </header>

      <!-- Experience -->
      ${jobs.length ? `
        <section class="resume-section" aria-labelledby="resume-exp-heading">
          <h2 id="resume-exp-heading" class="resume-section-title">Experience</h2>
          ${jobs.map(job => `
            <article class="resume-job" aria-label="${escapeHtml(job.title)} at ${escapeHtml(job.company)}">
              <div class="resume-job-header">
                <div>
                  <h3 class="resume-job-title">${escapeHtml(job.title)}</h3>
                  <p class="resume-job-company">
                    ${escapeHtml(job.company)}${job.location ? ` &bull; ${escapeHtml(job.location)}` : ''}
                  </p>
                </div>
                <div class="resume-job-dates">
                  <time>${escapeHtml(job.is_current
                    ? `${formatDate(job.start_date)} – Present`
                    : `${formatDate(job.start_date)} – ${formatDate(job.end_date)}`)}</time>
                </div>
              </div>
              ${job.responsibilities.length ? `
                <ul class="resume-bullets" aria-label="Responsibilities">
                  ${job.responsibilities.map(r => `<li>${escapeHtml(r.bullet_text)}</li>`).join('')}
                </ul>` : ''}
            </article>`).join('')}
        </section>` : ''}

      <!-- Skills -->
      ${Object.keys(skillsByCategory).length ? `
        <section class="resume-section" aria-labelledby="resume-skills-heading">
          <h2 id="resume-skills-heading" class="resume-section-title">Skills</h2>
          <dl class="resume-skills-grid">
            ${Object.entries(skillsByCategory).map(([cat, names]) => `
              <div class="resume-skill-row">
                <dt class="resume-skill-cat">${escapeHtml(cat)}:</dt>
                <dd class="resume-skill-list">${names.map(escapeHtml).join(', ')}</dd>
              </div>`).join('')}
          </dl>
        </section>` : ''}

      <!-- Certifications -->
      ${certs.length ? `
        <section class="resume-section" aria-labelledby="resume-certs-heading">
          <h2 id="resume-certs-heading" class="resume-section-title">Certifications</h2>
          <ul class="resume-bullets" aria-label="Certifications">
            ${certs.map(c => {
              const issued = c.issue_date ? formatDate(c.issue_date.slice(0,7)) : '';
              return `<li>
                <strong>${escapeHtml(c.name)}</strong>
                ${c.issuer ? ` &bull; ${escapeHtml(c.issuer)}` : ''}
                ${issued ? ` &bull; ${escapeHtml(issued)}` : ''}
              </li>`;
            }).join('')}
          </ul>
        </section>` : ''}

      <!-- Awards -->
      ${awards.length ? `
        <section class="resume-section" aria-labelledby="resume-awards-heading">
          <h2 id="resume-awards-heading" class="resume-section-title">Awards &amp; Achievements</h2>
          <ul class="resume-bullets" aria-label="Awards and achievements">
            ${awards.map(a => {
              const dateStr = a.date ? formatDate(a.date.slice(0,7)) : '';
              return `<li>
                <strong>${escapeHtml(a.title)}</strong>
                ${a.issuer ? ` &bull; ${escapeHtml(a.issuer)}` : ''}
                ${dateStr ? ` &bull; ${escapeHtml(dateStr)}` : ''}
                ${a.description ? `<br><span class="resume-desc">${escapeHtml(a.description)}</span>` : ''}
              </li>`;
            }).join('')}
          </ul>
        </section>` : ''}

    </div>`;
}
