let container;

const ICONS = {
  success: 'bi-check-circle-fill text-success',
  error:   'bi-exclamation-circle-fill text-danger',
  warning: 'bi-exclamation-triangle-fill text-warning',
  info:    'bi-info-circle-fill text-primary',
};

export function showToast(message, type = 'info', durationMs = 4000) {
  if (!container) container = document.getElementById('toast-container');

  const id = `toast-${Date.now()}`;
  const iconClass = ICONS[type] || ICONS.info;

  const toastEl = document.createElement('div');
  toastEl.id = id;
  toastEl.className = 'toast align-items-center border-0 show';
  toastEl.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toastEl.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${iconClass}" aria-hidden="true"></i>
        <span>${escapeToast(message)}</span>
      </div>
      <button type="button" class="btn-close btn-close me-2 m-auto"
              aria-label="Close notification"></button>
    </div>`;

  container.appendChild(toastEl);

  toastEl.querySelector('.btn-close').addEventListener('click', () => removeToast(toastEl));

  setTimeout(() => removeToast(toastEl), durationMs);
}

function removeToast(el) {
  el.classList.remove('show');
  el.classList.add('hide');
  setTimeout(() => el.remove(), 300);
}

function escapeToast(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
