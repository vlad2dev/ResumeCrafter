import { api } from '../api.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/dom.js';
import { navigate } from '../router.js';

/**
 * Attaches an AI review button below a textarea or input.
 * @param {HTMLElement} inputEl      - The textarea/input to review
 * @param {string}      contextType  - One of: profile_summary, job_responsibility, job_description, award, certification, skill
 * @param {string}      fieldName    - Human-readable name for aria labels
 * @param {Function}    [onAccept]   - Called with suggestion string; defaults to setting inputEl.value
 */
export function attachAiReview(inputEl, contextType, fieldName, onAccept) {
  const wrapper = document.createElement('div');
  wrapper.className = 'ai-suggestion-wrapper mt-1';

  wrapper.innerHTML = `
    <button type="button"
            class="btn btn-link btn-sm p-0 text-primary ai-review-btn"
            aria-label="Get AI suggestion for ${escapeHtml(fieldName)}">
      <i class="bi bi-stars" aria-hidden="true"></i> AI Suggest
    </button>
    <div class="ai-suggestion-box card border-primary mt-2 d-none" role="status" aria-live="polite">
      <div class="card-body p-3">
        <p class="card-text small ai-suggestion-text mb-2"></p>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-primary btn-sm ai-accept-btn">
            <i class="bi bi-check-lg" aria-hidden="true"></i> Accept
          </button>
          <button type="button" class="btn btn-outline-secondary btn-sm ai-dismiss-btn">
            Dismiss
          </button>
        </div>
      </div>
    </div>`;

  inputEl.parentNode.insertBefore(wrapper, inputEl.nextSibling);

  const btn      = wrapper.querySelector('.ai-review-btn');
  const box      = wrapper.querySelector('.ai-suggestion-box');
  const textEl   = wrapper.querySelector('.ai-suggestion-text');
  const acceptBtn  = wrapper.querySelector('.ai-accept-btn');
  const dismissBtn = wrapper.querySelector('.ai-dismiss-btn');

  btn.addEventListener('click', async () => {
    const content = inputEl.value.trim();
    if (!content) {
      showToast('Enter some text first before requesting AI suggestions.', 'warning');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Thinking…';

    try {
      const { suggestion } = await api.aiReview({ context_type: contextType, content });
      textEl.textContent = suggestion;
      box.classList.remove('d-none');
      acceptBtn.focus();
    } catch (err) {
      if (err.message.includes('API key not configured')) {
        showToast('Gemini API key not configured. Visit Settings to add your key.', 'warning');
        navigate('settings');
      } else {
        showToast(`AI error: ${err.message}`, 'error');
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-stars" aria-hidden="true"></i> AI Suggest';
    }
  });

  acceptBtn.addEventListener('click', () => {
    const text = textEl.textContent;
    if (typeof onAccept === 'function') {
      onAccept(text);
    } else {
      inputEl.value = text;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    box.classList.add('d-none');
    showToast('AI suggestion applied!', 'success');
    inputEl.focus();
  });

  dismissBtn.addEventListener('click', () => {
    box.classList.add('d-none');
    btn.focus();
  });
}
