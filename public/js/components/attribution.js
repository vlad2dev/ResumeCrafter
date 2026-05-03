const LIBRARIES = [
  {
    name: 'Express',
    url: 'https://expressjs.com',
    license: 'MIT',
    purpose: 'HTTP server framework for Node.js'
  },
  {
    name: 'Node.js node:sqlite',
    url: 'https://nodejs.org/api/sqlite.html',
    license: 'MIT (Node.js)',
    purpose: 'Built-in synchronous SQLite database (Node 24+)'
  },
  {
    name: 'Bootstrap 5',
    url: 'https://getbootstrap.com',
    license: 'MIT',
    purpose: 'CSS framework for responsive UI components'
  },
  {
    name: 'Bootstrap Icons',
    url: 'https://icons.getbootstrap.com',
    license: 'MIT',
    purpose: 'Open-source icon library'
  },
  {
    name: 'Helmet',
    url: 'https://helmetjs.github.io',
    license: 'MIT',
    purpose: 'Secure Express apps with HTTP headers'
  },
  {
    name: 'dotenv',
    url: 'https://github.com/motdotla/dotenv',
    license: 'BSD-2-Clause',
    purpose: 'Load environment variables from .env files'
  },
  {
    name: 'Morgan',
    url: 'https://github.com/expressjs/morgan',
    license: 'MIT',
    purpose: 'HTTP request logger middleware'
  },
  {
    name: 'Google Gemini API',
    url: 'https://ai.google.dev',
    license: 'Commercial (free tier available)',
    purpose: 'Generative AI for resume text suggestions'
  },
  {
    name: 'Electron',
    url: 'https://electronjs.org',
    license: 'MIT',
    purpose: 'Desktop app wrapper (optional)'
  },
];

export function initAttribution() {
  const btn = document.getElementById('attribution-btn');
  const body = document.getElementById('attribution-body');
  const modalEl = document.getElementById('attributionModal');
  const bsModal = new bootstrap.Modal(modalEl);

  body.innerHTML = `
    <p class="text-muted small mb-3">
      ResumeCrafter is built on the work of these amazing open-source projects and services.
      We are grateful to their contributors.
    </p>
    <ul class="list-group list-group-flush" role="list">
      ${LIBRARIES.map(lib => `
        <li class="list-group-item px-0" role="listitem">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <strong>${escapeHtml(lib.name)}</strong>
              <div class="text-muted small">${escapeHtml(lib.purpose)}</div>
            </div>
            <span class="badge bg-secondary-subtle text-secondary-emphasis ms-2 text-nowrap">
              ${escapeHtml(lib.license)}
            </span>
          </div>
        </li>`).join('')}
    </ul>`;

  btn.addEventListener('click', () => bsModal.show());
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
