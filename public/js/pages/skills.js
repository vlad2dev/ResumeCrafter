import { api } from '../api.js';
import { setState, getState } from '../state.js';
import { showToast } from '../components/toast.js';
import { openModal, closeModal, setModalLoading, confirmDelete } from '../components/modal.js';
import { attachAiReview } from '../components/aiSuggestion.js';
import { escapeHtml, setEmpty } from '../utils/dom.js';
import { showFieldError, clearAllErrors } from '../utils/validators.js';

export async function initSkills() {
  const container = document.getElementById('skills-container');
  container.innerHTML = `<div class="d-flex align-items-center gap-2 text-muted" role="status">
    <div class="spinner-border spinner-border-sm" aria-hidden="true"></div><span>Loading…</span></div>`;

  document.getElementById('add-skill-btn').onclick = () => openSkillForm(null);
  document.getElementById('add-category-btn').onclick = () => openCategoryForm(null);

  try {
    const [skills, categories] = await Promise.all([api.getSkills(), api.getSkillCategories()]);
    setState('skills', skills);
    setState('skillCategories', categories);
    renderSkills(skills, categories, container);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load skills: ${escapeHtml(err.message)}</div>`;
  }
}

function renderSkills(skills, categories, container) {
  container.innerHTML = '';
  if (!skills.length && !categories.length) {
    setEmpty(container, 'No skills yet. Add categories and skills to get started.');
    return;
  }

  // Group skills by category
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

  const wrapper = document.createElement('div');
  wrapper.className = 'row g-3';

  categories.forEach(cat => {
    const catSkills = grouped[cat.id] || [];
    wrapper.appendChild(renderCategoryCard(cat, catSkills));
  });

  if (uncategorized.length) {
    const fakecat = { id: null, name: 'Uncategorized' };
    wrapper.appendChild(renderCategoryCard(fakecat, uncategorized));
  }

  container.appendChild(wrapper);
}

function renderCategoryCard(cat, skills) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';

  const badgeMap = { expert: 'bg-success', advanced: 'bg-primary', intermediate: 'bg-info text-dark', beginner: 'bg-secondary' };

  col.innerHTML = `
    <div class="card h-100 shadow-sm">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2 class="h6 mb-0">${escapeHtml(cat.name)}</h2>
        <div class="d-flex gap-1">
          ${cat.id ? `
            <button class="btn btn-outline-secondary btn-sm edit-cat-btn"
                    aria-label="Edit category ${escapeHtml(cat.name)}">
              <i class="bi bi-pencil" aria-hidden="true"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm delete-cat-btn"
                    aria-label="Delete category ${escapeHtml(cat.name)}">
              <i class="bi bi-trash" aria-hidden="true"></i>
            </button>` : ''}
        </div>
      </div>
      <div class="card-body">
        ${skills.length
          ? `<ul class="list-unstyled mb-0" role="list" aria-label="Skills in ${escapeHtml(cat.name)}">
              ${skills.map(s => `
                <li class="d-flex justify-content-between align-items-center py-1 border-bottom last-no-border" role="listitem">
                  <span>${escapeHtml(s.name)}</span>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge ${badgeMap[s.proficiency] || 'bg-secondary'} small">
                      ${escapeHtml(s.proficiency)}
                    </span>
                    <button class="btn btn-link btn-sm p-0 edit-skill-btn"
                            data-skill-id="${s.id}"
                            aria-label="Edit skill ${escapeHtml(s.name)}">
                      <i class="bi bi-pencil" aria-hidden="true"></i>
                    </button>
                    <button class="btn btn-link btn-sm p-0 text-danger delete-skill-btn"
                            data-skill-id="${s.id}"
                            aria-label="Delete skill ${escapeHtml(s.name)}">
                      <i class="bi bi-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                </li>`).join('')}
             </ul>`
          : '<p class="text-muted small fst-italic mb-0">No skills in this category.</p>'}
      </div>
    </div>`;

  if (cat.id) {
    col.querySelector('.edit-cat-btn')?.addEventListener('click', () => openCategoryForm(cat));
    col.querySelector('.delete-cat-btn')?.addEventListener('click', () => {
      confirmDelete(`Delete category "${cat.name}"? Skills will become uncategorized.`, async () => {
        try {
          await api.deleteCategory(cat.id);
          await refreshSkills();
          showToast('Category deleted.', 'info');
        } catch (err) { showToast(`Error: ${err.message}`, 'error'); }
      });
    });
  }

  col.querySelectorAll('.edit-skill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const skill = getState('skills').find(s => s.id === Number(btn.dataset.skillId));
      if (skill) openSkillForm(skill);
    });
  });

  col.querySelectorAll('.delete-skill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const skill = getState('skills').find(s => s.id === Number(btn.dataset.skillId));
      confirmDelete(`Delete skill "${skill?.name}"?`, async () => {
        try {
          await api.deleteSkill(btn.dataset.skillId);
          await refreshSkills();
          showToast('Skill deleted.', 'info');
        } catch (err) { showToast(`Error: ${err.message}`, 'error'); }
      });
    });
  });

  return col;
}

function openSkillForm(skill) {
  const isNew = !skill;
  const categories = getState('skillCategories') || [];

  const bodyHtml = `
    <form id="skill-form" novalidate>
      <div class="mb-3">
        <label for="sf-name" class="form-label">Skill Name <span class="text-danger" aria-hidden="true">*</span></label>
        <input type="text" id="sf-name" name="name" class="form-control"
               value="${escapeHtml(skill?.name || '')}" required aria-required="true"
               placeholder="e.g. JavaScript, Project Management">
      </div>
      <div class="mb-3">
        <label for="sf-category" class="form-label">Category</label>
        <select id="sf-category" name="category_id" class="form-select">
          <option value="">— No category —</option>
          ${categories.map(c => `
            <option value="${c.id}" ${skill?.category_id === c.id ? 'selected' : ''}>
              ${escapeHtml(c.name)}
            </option>`).join('')}
        </select>
      </div>
      <div class="mb-3">
        <label for="sf-prof" class="form-label">Proficiency</label>
        <select id="sf-prof" name="proficiency" class="form-select">
          ${['beginner','intermediate','advanced','expert'].map(p =>
            `<option value="${p}" ${(skill?.proficiency || 'intermediate') === p ? 'selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
    </form>`;

  openModal(isNew ? 'Add Skill' : 'Edit Skill', bodyHtml, async () => {
    const form = document.getElementById('skill-form');
    clearAllErrors(form);
    const data = Object.fromEntries(new FormData(form));
    if (!data.name?.trim()) { showFieldError(form.querySelector('#sf-name'), 'Skill name is required.'); return false; }
    if (!data.category_id) data.category_id = null;

    setModalLoading(true);
    try {
      if (isNew) await api.createSkill(data);
      else await api.updateSkill(skill.id, data);
      await refreshSkills();
      showToast(`Skill ${isNew ? 'added' : 'updated'}!`, 'success');
      return true;
    } catch (err) { showToast(`Error: ${err.message}`, 'error'); return false; }
    finally { setModalLoading(false); }
  });

  // AI suggestion for skill name
  const nameEl = document.getElementById('sf-name');
  attachAiReview(nameEl, 'skill', 'Skill Name', (suggestion) => {
    // suggestion may be comma-separated list of related skills; show first as fill
    nameEl.value = suggestion.split(',')[0].trim();
  });
}

function openCategoryForm(cat) {
  const isNew = !cat;
  const bodyHtml = `
    <form id="cat-form" novalidate>
      <div class="mb-3">
        <label for="cf-name" class="form-label">Category Name <span class="text-danger" aria-hidden="true">*</span></label>
        <input type="text" id="cf-name" name="name" class="form-control"
               value="${escapeHtml(cat?.name || '')}" required aria-required="true"
               placeholder="e.g. Programming Languages, Soft Skills">
      </div>
    </form>`;

  openModal(isNew ? 'Add Category' : 'Edit Category', bodyHtml, async () => {
    const form = document.getElementById('cat-form');
    clearAllErrors(form);
    const data = Object.fromEntries(new FormData(form));
    if (!data.name?.trim()) { showFieldError(form.querySelector('#cf-name'), 'Category name is required.'); return false; }

    setModalLoading(true);
    try {
      if (isNew) await api.createCategory(data);
      else await api.updateCategory(cat.id, data);
      await refreshSkills();
      showToast(`Category ${isNew ? 'added' : 'updated'}!`, 'success');
      return true;
    } catch (err) { showToast(`Error: ${err.message}`, 'error'); return false; }
    finally { setModalLoading(false); }
  });
}

async function refreshSkills() {
  const [skills, categories] = await Promise.all([api.getSkills(), api.getSkillCategories()]);
  setState('skills', skills);
  setState('skillCategories', categories);
  renderSkills(skills, categories, document.getElementById('skills-container'));
}
