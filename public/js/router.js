export const PAGES = ['profile', 'jobs', 'skills', 'certs', 'awards', 'builder', 'preview', 'settings'];

const sections = {};
let onNavigateCallback = null;

export function initRouter(onNavigate) {
  onNavigateCallback = onNavigate;

  PAGES.forEach(p => {
    sections[p] = document.getElementById(`page-${p}`);
  });

  window.addEventListener('hashchange', () => {
    navigate(getPageFromHash());
  });

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.nav);
    });
  });

  // Initial load
  navigate(getPageFromHash() || 'profile');
}

function getPageFromHash() {
  return window.location.hash.slice(1);
}

export function navigate(page) {
  if (!PAGES.includes(page)) page = 'profile';

  PAGES.forEach(p => {
    const el = sections[p];
    if (!el) return;
    el.classList.add('d-none');
    el.removeAttribute('tabindex');
  });

  const target = sections[page];
  if (target) {
    target.classList.remove('d-none');
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: false });
  }

  // Update nav active states
  document.querySelectorAll('[data-nav]').forEach(el => {
    const isActive = el.dataset.nav === page;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  if (window.location.hash.slice(1) !== page) {
    window.location.hash = page;
  }

  // Update document title
  const titles = {
    profile: 'Profile', jobs: 'Experience', skills: 'Skills',
    certs: 'Certifications', awards: 'Awards', builder: 'Builder',
    preview: 'Preview', settings: 'Settings'
  };
  document.title = `ResumeCrafter – ${titles[page] || page}`;

  // Announce page change to screen readers
  const sr = document.getElementById('sr-status');
  if (sr) sr.textContent = `Navigated to ${titles[page] || page}`;

  if (typeof onNavigateCallback === 'function') onNavigateCallback(page);
}
