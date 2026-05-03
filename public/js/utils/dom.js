export const qs  = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else el.setAttribute(k, v);
  });
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(isoMonth) {
  if (!isoMonth) return '';
  const [year, month] = isoMonth.split('-');
  if (!month) return year;
  const date = new Date(`${isoMonth}-01`);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

export function setLoading(container, message = 'Loading…') {
  container.innerHTML = `
    <div class="d-flex align-items-center gap-2 text-muted py-4" role="status">
      <div class="spinner-border spinner-border-sm" aria-hidden="true"></div>
      <span>${escapeHtml(message)}</span>
    </div>`;
}

export function setEmpty(container, message) {
  container.innerHTML = `
    <div class="text-center text-muted py-5">
      <i class="bi bi-inbox display-4 d-block mb-3" aria-hidden="true"></i>
      <p class="mb-0">${escapeHtml(message)}</p>
    </div>`;
}
