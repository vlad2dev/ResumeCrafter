let bsModal = null;
let currentOnConfirm = null;

export function initModal() {
  const modalEl = document.getElementById('appModal');
  bsModal = new bootstrap.Modal(modalEl);

  document.getElementById('appModalConfirm').addEventListener('click', async () => {
    if (typeof currentOnConfirm === 'function') {
      const result = await currentOnConfirm();
      if (result !== false) bsModal.hide();
    } else {
      bsModal.hide();
    }
  });
}

export function openModal(title, bodyHtml, onConfirm, confirmLabel = 'Save') {
  currentOnConfirm = onConfirm;
  document.getElementById('appModalLabel').textContent = title;
  document.getElementById('appModalBody').innerHTML = bodyHtml;

  const confirmBtn = document.getElementById('appModalConfirm');
  confirmBtn.textContent = confirmLabel;

  if (onConfirm === null) {
    document.getElementById('appModalFooter').classList.add('d-none');
  } else {
    document.getElementById('appModalFooter').classList.remove('d-none');
  }

  bsModal.show();
}

export function closeModal() {
  if (bsModal) bsModal.hide();
}

export function setModalLoading(loading) {
  const confirmBtn = document.getElementById('appModalConfirm');
  confirmBtn.disabled = loading;
  confirmBtn.innerHTML = loading
    ? '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Saving…'
    : confirmBtn.dataset.label || 'Save';
}

// ── Confirm dialog ────────────────────────────────────────────────────────

let bsConfirmModal = null;

export function initConfirmModal() {
  const el = document.getElementById('confirmModal');
  bsConfirmModal = new bootstrap.Modal(el);
}

export function confirmDelete(message, onConfirm) {
  document.getElementById('confirmModalBody').textContent = message;
  bsConfirmModal.show();

  const okBtn = document.getElementById('confirmModalOk');
  const newOkBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  newOkBtn.addEventListener('click', () => {
    bsConfirmModal.hide();
    onConfirm();
  });
}
