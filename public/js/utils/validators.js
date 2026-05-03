export function validateRequired(value, fieldName) {
  if (!value || !String(value).trim()) {
    return `${fieldName} is required.`;
  }
  return null;
}

export function validateEmail(value) {
  if (!value) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value) ? null : 'Please enter a valid email address.';
}

export function validateUrl(value) {
  if (!value) return null;
  try {
    new URL(value.startsWith('http') ? value : `https://${value}`);
    return null;
  } catch {
    return 'Please enter a valid URL.';
  }
}

export function showFieldError(inputEl, message) {
  inputEl.classList.add('is-invalid');
  let errEl = inputEl.parentNode.querySelector('.invalid-feedback');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.className = 'invalid-feedback';
    errEl.setAttribute('role', 'alert');
    inputEl.parentNode.appendChild(errEl);
  }
  errEl.textContent = message;
}

export function clearFieldError(inputEl) {
  inputEl.classList.remove('is-invalid');
  const errEl = inputEl.parentNode.querySelector('.invalid-feedback');
  if (errEl) errEl.textContent = '';
}

export function clearAllErrors(formEl) {
  formEl.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  formEl.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
}
