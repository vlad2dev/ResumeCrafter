import { api } from '../api.js';
import { setState } from '../state.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/dom.js';

export async function initSettings() {
  const container = document.getElementById('settings-container');
  container.innerHTML = `<div class="d-flex align-items-center gap-2 text-muted" role="status">
    <div class="spinner-border spinner-border-sm" aria-hidden="true"></div><span>Loading…</span></div>`;

  try {
    const settings = await api.getSettings();
    setState('settings', settings);
    renderSettings(settings, container);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load settings: ${escapeHtml(err.message)}</div>`;
  }
}

function renderSettings(settings, container) {
  container.innerHTML = `
    <div class="row g-4">

      <!-- Gemini API Key -->
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header">
            <h2 class="h5 mb-0">
              <i class="bi bi-stars text-warning me-2" aria-hidden="true"></i>
              Google Gemini AI Configuration
            </h2>
          </div>
          <div class="card-body">
            <form id="settings-form" novalidate>
              <div class="mb-3">
                <label for="s-apikey" class="form-label">
                  Gemini API Key
                  <span class="badge bg-secondary ms-1">Required for AI features</span>
                </label>
                <div class="input-group">
                  <input type="password" id="s-apikey" name="gemini_api_key"
                         class="form-control font-monospace"
                         value="${escapeHtml(settings.gemini_api_key || '')}"
                         aria-describedby="s-apikey-help"
                         autocomplete="off"
                         placeholder="AIza...">
                  <button class="btn btn-outline-secondary" type="button" id="toggle-key-btn"
                          aria-label="Show or hide API key">
                    <i class="bi bi-eye" aria-hidden="true"></i>
                  </button>
                </div>
                <div id="s-apikey-help" class="form-text">
                  Get a free API key from
                  <strong>Google AI Studio</strong> (aistudio.google.com).
                  Your key is stored locally in the database and never sent anywhere except directly to Google's API.
                </div>
              </div>

              <div class="mb-3">
                <label for="s-model" class="form-label">Gemini Model</label>
                <select id="s-model" name="gemini_model" class="form-select"
                        aria-describedby="s-model-help">
                  <option value="gemini-2.5-flash" ${settings.gemini_model === 'gemini-2.5-flash' ? 'selected' : ''}>
                    gemini-2.5-flash (Recommended — 10 RPM free tier)
                  </option>
                  <option value="gemini-2.5-flash-lite" ${settings.gemini_model === 'gemini-2.5-flash-lite' ? 'selected' : ''}>
                    gemini-2.5-flash-lite (15 RPM free tier, fastest)
                  </option>
                  <option value="gemini-2.0-flash" ${settings.gemini_model === 'gemini-2.0-flash' ? 'selected' : ''}>
                    gemini-2.0-flash (Legacy — retiring March 2026)
                  </option>
                </select>
                <div id="s-model-help" class="form-text">
                  gemini-2.5-flash is recommended. Free tier: 10 requests/min, 250 requests/day.
                </div>
              </div>

              <button type="submit" class="btn btn-primary">
                <i class="bi bi-floppy" aria-hidden="true"></i> Save Settings
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- App Info -->
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header">
            <h2 class="h5 mb-0">
              <i class="bi bi-info-circle me-2" aria-hidden="true"></i>About ResumeCrafter
            </h2>
          </div>
          <div class="card-body">
            <dl class="row mb-0">
              <dt class="col-sm-3">Version</dt>
              <dd class="col-sm-9">1.0.0</dd>
              <dt class="col-sm-3">Database</dt>
              <dd class="col-sm-9">SQLite (local file: ResumeCrafter.db)</dd>
              <dt class="col-sm-3">AI Provider</dt>
              <dd class="col-sm-9">Google Gemini API (your key, your data)</dd>
            </dl>
          </div>
        </div>
      </div>

    </div>`;

  // Toggle key visibility
  const keyInput = container.querySelector('#s-apikey');
  container.querySelector('#toggle-key-btn').addEventListener('click', () => {
    const isHidden = keyInput.type === 'password';
    keyInput.type = isHidden ? 'text' : 'password';
    const icon = container.querySelector('#toggle-key-btn i');
    icon.className = `bi ${isHidden ? 'bi-eye-slash' : 'bi-eye'}`;
    container.querySelector('#toggle-key-btn').setAttribute('aria-label',
      isHidden ? 'Hide API key' : 'Show API key');
  });

  container.querySelector('#settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));

    const submitBtn = e.target.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Saving…';

    try {
      await api.saveSettings(data);
      const updated = await api.getSettings();
      setState('settings', updated);
      // Refresh displayed (masked) key
      keyInput.value = updated.gemini_api_key || '';
      showToast('Settings saved!', 'success');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-floppy" aria-hidden="true"></i> Save Settings';
    }
  });
}
