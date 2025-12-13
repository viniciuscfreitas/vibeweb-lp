// Forms and Modal Logic

const URL_PATTERN = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
const SIMPLE_DOMAIN_PATTERN = /^([\da-z\.-]+)\.([a-z\.]{2,6})$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_PATTERN = /^[@]?[\w\-\.]+$/;

function openModal(task = null) {
  if (!DOM.modalOverlay || !DOM.modalTitle || !DOM.btnDelete) return;

  const isEditingExistingTask = !!task;
  AppState.currentTaskId = isEditingExistingTask ? task.id : null;
  clearFormErrors();

  const modalTitle = isEditingExistingTask ? `Editar #${task.id}` : 'Novo Projeto';
  const deleteButtonDisplay = isEditingExistingTask ? 'block' : 'none';

  DOM.modalTitle.innerText = modalTitle;
  DOM.btnDelete.style.display = deleteButtonDisplay;

  DOM.modalOverlay.setAttribute('aria-hidden', 'false');
  DOM.modalOverlay.classList.add('open');

  DOM.formClient.value = task?.client || '';
  DOM.formContact.value = task?.contact || '';
  DOM.formType.value = task?.type || 'Landing Essencial';
  DOM.formStack.value = task?.stack || '';
  DOM.formDomain.value = task?.domain || '';
  DOM.formDesc.value = task?.description || '';
  DOM.formPrice.value = task?.price || '';
  DOM.formPayment.value = task?.paymentStatus || PAYMENT_STATUS_PENDING;
  DOM.formDeadline.value = task?.deadline || '';

  const hostingValue = task?.hosting || HOSTING_NO;
  DOM.formHosting.value = hostingValue;

  setTimeout(() => {
    if (DOM.formClient) {
      DOM.formClient.focus();
    }
  }, 100);

  trapFocusInModal();
  AppState.log('Modal opened', { isEditingExistingTask, taskId: AppState.currentTaskId });
}

function closeModal() {
  if (!DOM.modalOverlay) return;
  DOM.modalOverlay.classList.remove('open');
  DOM.modalOverlay.setAttribute('aria-hidden', 'true');
  clearFormErrors();
  AppState.currentTaskId = null;
  releaseFocusFromModal();
}

let modalFocusTrap = null;

function trapFocusInModal() {
  if (!DOM.modalOverlay) return;

  const focusableElements = DOM.modalOverlay.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  DOM.modalOverlay.addEventListener('keydown', handleTabKey);
  modalFocusTrap = handleTabKey;
}

function releaseFocusFromModal() {
  if (modalFocusTrap && DOM.modalOverlay) {
    DOM.modalOverlay.removeEventListener('keydown', modalFocusTrap);
    modalFocusTrap = null;
  }
}

function validateDomain(domain) {
  if (!domain) return true;
  const matchesUrl = URL_PATTERN.test(domain);
  const matchesSimple = SIMPLE_DOMAIN_PATTERN.test(domain);
  return matchesUrl || matchesSimple;
}

function validateContact(contact) {
  if (!contact) return true;
  const matchesEmail = EMAIL_PATTERN.test(contact);
  const matchesContact = CONTACT_PATTERN.test(contact);
  return matchesEmail || matchesContact;
}

function showFormError(fieldId, message) {
  let errorEl, inputEl;

  if (fieldId === 'client') {
    errorEl = DOM.errorClient;
    inputEl = DOM.formClient;
  } else if (fieldId === 'contact') {
    errorEl = DOM.errorContact;
    inputEl = DOM.formContact;
  } else if (fieldId === 'domain') {
    errorEl = DOM.errorDomain;
    inputEl = DOM.formDomain;
  } else if (fieldId === 'price') {
    errorEl = DOM.errorPrice;
    inputEl = DOM.formPrice;
  } else {
    return;
  }

  if (errorEl && inputEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
    inputEl.classList.add('error');
  }
}

function clearFormError(fieldId) {
  let errorEl, inputEl;

  if (fieldId === 'client') {
    errorEl = DOM.errorClient;
    inputEl = DOM.formClient;
  } else if (fieldId === 'contact') {
    errorEl = DOM.errorContact;
    inputEl = DOM.formContact;
  } else if (fieldId === 'domain') {
    errorEl = DOM.errorDomain;
    inputEl = DOM.formDomain;
  } else if (fieldId === 'price') {
    errorEl = DOM.errorPrice;
    inputEl = DOM.formPrice;
  } else {
    return;
  }

  if (errorEl && inputEl) {
    errorEl.classList.remove('show');
    inputEl.classList.remove('error');
  }
}

function clearFormErrors() {
  clearFormError('client');
  clearFormError('contact');
  clearFormError('domain');
  clearFormError('price');
}

function validateForm() {
  let isFormValid = true;
  clearFormErrors();

  const clientName = DOM.formClient.value.trim();
  if (!clientName) {
    showFormError('client', 'Nome do cliente é obrigatório');
    isFormValid = false;
  }

  const contact = DOM.formContact.value.trim();
  if (contact && !validateContact(contact)) {
    showFormError('contact', 'Formato inválido. Use email ou @username');
    isFormValid = false;
  }

  const domain = DOM.formDomain.value.trim();
  if (domain && !validateDomain(domain)) {
    showFormError('domain', 'Formato de URL/domínio inválido');
    isFormValid = false;
  }

  const priceValue = DOM.formPrice.value;
  const price = priceValue ? parseFloat(priceValue) : 0;
  const isInvalidNumber = isNaN(price);
  const isNegative = price < 0;
  const isInvalidPrice = isInvalidNumber || isNegative;

  if (isInvalidPrice) {
    showFormError('price', 'Preço deve ser um número positivo');
    isFormValid = false;
  }

  return isFormValid;
}

function saveForm() {
  if (!validateForm()) {
    AppState.log('Form validation failed');
    return;
  }

  if (!DOM.formClient || !DOM.formPrice || !DOM.formContact || !DOM.formType ||
    !DOM.formStack || !DOM.formDomain || !DOM.formDesc || !DOM.formPayment ||
    !DOM.formDeadline || !DOM.formHosting) {
    AppState.log('Form save failed: missing form elements');
    return;
  }

  const clientName = DOM.formClient.value.trim();
  const priceValue = DOM.formPrice.value;
  const price = priceValue ? parseFloat(priceValue) : 0;

  const deadlineValue = DOM.formDeadline.value.trim();
  const deadline = deadlineValue || DEADLINE_UNDEFINED;

  const formData = {
    client: clientName,
    contact: DOM.formContact.value.trim(),
    type: DOM.formType.value,
    stack: DOM.formStack.value.trim(),
    domain: DOM.formDomain.value.trim(),
    description: DOM.formDesc.value.trim(),
    price: price,
    paymentStatus: DOM.formPayment.value,
    deadline: deadline,
    hosting: DOM.formHosting.value,
  };

  const tasks = AppState.getTasks();
  if (!Array.isArray(tasks)) {
    AppState.log('Form save failed: invalid tasks array');
    return;
  }

  if (AppState.currentTaskId) {
    const idx = tasks.findIndex(t => t.id === AppState.currentTaskId);
    if (idx === -1) {
      AppState.log('Form save failed: task not found', { taskId: AppState.currentTaskId });
      return;
    }

    const task = tasks[idx];
    if (!task) {
      AppState.log('Form save failed: invalid task');
      return;
    }
    const updatedTasks = [...tasks];
    const currentDeadline = task.deadline;
    const newDeadline = formData.deadline;

    if (currentDeadline !== newDeadline && parseDeadlineHours(newDeadline)) {
      formData.deadlineTimestamp = Date.now();
    } else if (currentDeadline === newDeadline && task.deadlineTimestamp) {
      formData.deadlineTimestamp = task.deadlineTimestamp;
    }

    updatedTasks[idx] = { ...updatedTasks[idx], ...formData };
    AppState.setTasks(updatedTasks);
    AppState.log('Task updated', { taskId: AppState.currentTaskId });
  } else {
    const inboxTasks = tasks.filter(t => t.colId === DISCOVERY_COLUMN_ID);
    const inboxOrders = inboxTasks.map(t => t.order);
    const maxOrder = inboxOrders.length > 0 ? Math.max(...inboxOrders) : -1;
    const newOrder = maxOrder + 1;

    const hours = parseDeadlineHours(formData.deadline);
    const deadlineTimestamp = hours ? Date.now() : null;

    const newTask = {
      id: Date.now(),
      colId: DISCOVERY_COLUMN_ID,
      order: newOrder,
      ...formData,
      deadlineTimestamp: deadlineTimestamp
    };

    const updatedTasks = [...tasks, newTask];
    AppState.setTasks(updatedTasks);
    AppState.log('Task created', { taskId: newTask.id });
  }

  saveData();
  closeModal();

  if (DOM.dashboardContainer.classList.contains('active')) {
    renderDashboard();
  } else if (DOM.financialContainer.classList.contains('active')) {
    renderFinancial();
  }
}

function showConfirmDialog(message, onConfirm) {
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';
  dialog.innerHTML = `
    <p style="margin: 0; color: var(--text-main);">${message}</p>
    <div class="confirm-dialog-buttons">
      <button class="btn-text" id="confirmCancel">Cancelar</button>
      <button class="btn-danger" id="confirmOk">Confirmar</button>
    </div>
  `;

  document.body.appendChild(dialog);

  const cleanup = () => {
    document.body.removeChild(dialog);
  };

  dialog.querySelector('#confirmCancel').addEventListener('click', cleanup);
  dialog.querySelector('#confirmOk').addEventListener('click', () => {
    cleanup();
    onConfirm();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) cleanup();
  });
}

function deleteItem() {
  if (!AppState.currentTaskId) return;

  showConfirmDialog("Arquivar este projeto?", () => {
    const tasks = AppState.getTasks();
    const updatedTasks = tasks.filter(t => t.id !== AppState.currentTaskId);
    AppState.setTasks(updatedTasks);
    AppState.log('Task deleted', { taskId: AppState.currentTaskId });
    saveData();
    closeModal();

    if (DOM.dashboardContainer.classList.contains('active')) {
      renderDashboard();
    } else if (DOM.financialContainer.classList.contains('active')) {
      renderFinancial();
    }
  });
}
