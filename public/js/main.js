import { initRouter } from './router.js';
import { initAttribution } from './components/attribution.js';
import { initModal, initConfirmModal } from './components/modal.js';

import { initProfile }  from './pages/profile.js';
import { initJobs }     from './pages/jobs.js';
import { initSkills }   from './pages/skills.js';
import { initCerts }    from './pages/certifications.js';
import { initAwards }   from './pages/awards.js';
import { initBuilder }  from './pages/builder.js';
import { initPreview }  from './pages/preview.js';
import { initSettings } from './pages/settings.js';

const pageRegistry = {
  profile:  { fn: initProfile,  loaded: false },
  jobs:     { fn: initJobs,     loaded: false },
  skills:   { fn: initSkills,   loaded: false },
  certs:    { fn: initCerts,    loaded: false },
  awards:   { fn: initAwards,   loaded: false },
  builder:  { fn: initBuilder,  loaded: false },
  preview:  { fn: initPreview,  loaded: false },
  settings: { fn: initSettings, loaded: false },
};

async function onNavigate(page) {
  const entry = pageRegistry[page];
  if (!entry) return;

  // Preview always re-renders (picks up latest builder config)
  if (page === 'preview') {
    await entry.fn();
    return;
  }

  if (!entry.loaded) {
    await entry.fn();
    entry.loaded = true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initConfirmModal();
  initAttribution();
  initRouter(onNavigate);
});
