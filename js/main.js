// Main Initialization and Event Listeners

const defaultTasks = [
  { id: 101, client: 'JCuts Video', contact: '@jcuts', domain: 'jcuts.io', stack: 'Next.js', type: 'Landing Essencial', price: 800, deadline: 'Entregue', paymentStatus: PAYMENT_STATUS_PAID, description: '', colId: 3, order: 0, hosting: HOSTING_YES },
  { id: 102, client: 'Magic Portfolio', contact: 'magic', domain: 'magic.com', stack: 'React', type: 'Aplicação Web', price: 4500, deadline: '24h', paymentStatus: PAYMENT_STATUS_PARTIAL, description: '', colId: 2, order: 0, deadlineTimestamp: Date.now() - (12 * MS_PER_HOUR) },
  { id: 103, client: 'Marcelo Braz', contact: 'marcelo', domain: 'marcelo.xyz', stack: 'Node', type: 'Aplicação Web', price: 3200, deadline: '48h', paymentStatus: PAYMENT_STATUS_PARTIAL, description: '', colId: 1, order: 0, deadlineTimestamp: Date.now() - HOURS_24_MS },
  { id: 104, client: 'StartUp Alpha', contact: 'founder', domain: '', stack: 'Landing', type: 'Landing Essencial', price: 1200, deadline: 'Descoberta', paymentStatus: PAYMENT_STATUS_PENDING, description: '', colId: 0, order: 0 },
  { id: 105, client: 'Loja Bio', contact: 'loja', domain: '', stack: 'Shopify', type: 'Autoridade de Marca', price: 2500, deadline: DEADLINE_UNDEFINED, paymentStatus: PAYMENT_STATUS_PENDING, description: '', colId: 0, order: 1 }
];

function getCurrentTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return saved || 'light';
}

function setTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  const isDark = theme === 'dark';
  const isLight = theme === 'light';
  const dropdownThemeIcon = document.getElementById('dropdownThemeIcon');
  const dropdownThemeText = document.getElementById('dropdownThemeText');

  if (isDark) {
    if (dropdownThemeIcon) {
      dropdownThemeIcon.className = 'fa-solid fa-sun';
    }
    if (dropdownThemeText) {
      dropdownThemeText.textContent = 'Tema Claro';
    }
  } else if (isLight) {
    if (dropdownThemeIcon) {
      dropdownThemeIcon.className = 'fa-solid fa-moon';
    }
    if (dropdownThemeText) {
      dropdownThemeText.textContent = 'Tema Escuro';
    }
  }
}

function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  AppState.log('Theme toggled', { theme: newTheme });
}

function initTheme() {
  const theme = getCurrentTheme();
  setTheme(theme);
}

function expandSearch() {
  if (!DOM.searchContainer || !DOM.searchInput) return;
  DOM.searchContainer.classList.add('expanded');
  setTimeout(() => {
    if (DOM.searchInput) {
      DOM.searchInput.focus();
    }
  }, 100);
}

function collapseSearch() {
  if (!DOM.searchInput || !DOM.searchContainer) return;
  const hasValue = DOM.searchInput.value.trim().length > 0;
  if (!hasValue) {
    DOM.searchContainer.classList.remove('expanded');
    DOM.searchInput.blur();
  }
}

function handleSearch() {
  if (AppState.searchTimeout) {
    clearTimeout(AppState.searchTimeout);
  }
  AppState.searchTimeout = setTimeout(() => {
    renderBoard();
    updateHeaderStats();
    AppState.log('Search executed');
  }, SEARCH_DEBOUNCE_MS);
}

function fadeContainer(container, isFadeIn) {
  if (!container) return;

  container.style.transition = 'opacity 0.15s ease';

  if (isFadeIn) {
    requestAnimationFrame(() => {
      container.style.opacity = '1';
    });
  } else {
    container.style.opacity = '0';
  }
}

function switchToDashboard() {
  fadeContainer(DOM.boardContainer, false);
  fadeContainer(DOM.financialContainer, false);

  setTimeout(() => {
    DOM.boardContainer.classList.add('hidden');
    DOM.financialContainer.classList.add('hidden');
    DOM.financialContainer.classList.remove('active');
    DOM.financialContainer.style.display = '';
    DOM.dashboardContainer.classList.add('active');
    DOM.dashboardContainer.classList.remove('hidden');

    fadeContainer(DOM.dashboardContainer, true);
    clearKanbanFilter();
    renderDashboard();
    updateHeader('dashboard');
  }, 150);
}

function switchToProjects() {
  fadeContainer(DOM.dashboardContainer, false);
  fadeContainer(DOM.financialContainer, false);

  setTimeout(() => {
    DOM.dashboardContainer.classList.remove('active');
    DOM.dashboardContainer.classList.add('hidden');
    DOM.financialContainer.classList.add('hidden');
    DOM.financialContainer.classList.remove('active');
    DOM.financialContainer.style.display = '';
    DOM.boardContainer.classList.remove('hidden');

    fadeContainer(DOM.boardContainer, true);
    updateHeader('projects');
  }, 150);
}

function switchToFinancial() {
  fadeContainer(DOM.boardContainer, false);
  fadeContainer(DOM.dashboardContainer, false);

  setTimeout(() => {
    DOM.boardContainer.classList.add('hidden');
    DOM.dashboardContainer.classList.remove('active');
    DOM.dashboardContainer.classList.add('hidden');
    DOM.financialContainer.classList.remove('hidden');
    DOM.financialContainer.classList.add('active');
    DOM.financialContainer.style.display = 'block';

    fadeContainer(DOM.financialContainer, true);
    renderFinancial();
    updateHeader('financial');
  }, 150);
}

function updateNavButtons(isProjects, isDashboard, isFinancial) {
  DOM.navButtons.forEach((btn, index) => {
    if (index === 0 && isProjects) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    } else if (index === 1 && isDashboard) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    } else if (index === 2 && isFinancial) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.classList.remove('active');
      btn.removeAttribute('aria-current');
    }
  });
}

function updateAriaHiddenForViews() {
  if (!DOM.boardContainer || !DOM.dashboardContainer || !DOM.financialContainer) return;

  const isBoardVisible = !DOM.boardContainer.classList.contains('hidden');
  const isDashboardVisible = DOM.dashboardContainer.classList.contains('active');
  const isFinancialVisible = DOM.financialContainer.classList.contains('active');

  DOM.boardContainer.setAttribute('aria-hidden', isBoardVisible ? 'false' : 'true');
  DOM.dashboardContainer.setAttribute('aria-hidden', isDashboardVisible ? 'false' : 'true');
  DOM.financialContainer.setAttribute('aria-hidden', isFinancialVisible ? 'false' : 'true');
}

function switchView(view) {
  if (!DOM.boardContainer || !DOM.dashboardContainer || !DOM.financialContainer) return;

  const isDashboard = view === 'dashboard';
  const isProjects = view === 'projects';
  const isFinancial = view === 'financial';

  const currentIsDashboard = DOM.dashboardContainer.classList.contains('active');
  const currentIsProjects = !DOM.boardContainer.classList.contains('hidden');
  const currentIsFinancial = DOM.financialContainer.classList.contains('active');

  const isSwitchingToDashboard = isDashboard && !currentIsDashboard;
  const isSwitchingToProjects = isProjects && !currentIsProjects;
  const isSwitchingToFinancial = isFinancial && !currentIsFinancial;

  if (isSwitchingToDashboard) {
    switchToDashboard();
  } else if (isSwitchingToProjects) {
    switchToProjects();
  } else if (isSwitchingToFinancial) {
    switchToFinancial();
  } else {
    DOM.boardContainer.classList.toggle('hidden', isDashboard || isFinancial);
    DOM.dashboardContainer.classList.toggle('active', isDashboard);
    DOM.dashboardContainer.classList.toggle('hidden', isProjects || isFinancial);

    if (isFinancial) {
      DOM.financialContainer.classList.remove('hidden');
      DOM.financialContainer.classList.add('active');
      DOM.financialContainer.style.display = 'block';
      fadeContainer(DOM.financialContainer, true);
    } else {
      DOM.financialContainer.classList.remove('active');
      DOM.financialContainer.classList.add('hidden');
      DOM.financialContainer.style.display = '';
    }

    if (isProjects) {
      fadeContainer(DOM.boardContainer, true);
    }

    if (isDashboard) {
      clearKanbanFilter();
      renderDashboard();
    }

    if (isFinancial) {
      renderFinancial();
      updateHeader('financial');
    } else {
      updateHeader(view);
    }
  }

  updateNavButtons(isProjects, isDashboard, isFinancial);
  updateAriaHiddenForViews();
}

function updateHeader(view) {
  if (view === 'dashboard') {
    const metrics = calculateDashboardMetrics();
    renderDashboardHeader(metrics);
    if (DOM.btnNewProject) DOM.btnNewProject.style.display = 'none';
    if (DOM.searchContainer) DOM.searchContainer.style.display = 'none';
  } else if (view === 'financial') {
    const metrics = calculateDashboardMetrics();
    renderFinancialHeader(metrics);
    if (DOM.btnNewProject) DOM.btnNewProject.style.display = 'none';
    if (DOM.searchContainer) DOM.searchContainer.style.display = 'none';
  } else {
    renderProjectsHeader();
    if (DOM.btnNewProject) DOM.btnNewProject.style.display = 'flex';
    if (DOM.searchContainer) DOM.searchContainer.style.display = 'flex';
  }
}

function setupEventListeners() {
  DOM.navButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      if (index === 0) {
        switchView('projects');
      } else if (index === 1) {
        switchView('dashboard');
      } else if (index === 2) {
        switchView('financial');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

    if (isInput) {
      if (e.key === 'Enter' && e.ctrlKey && DOM.modalOverlay.classList.contains('open')) {
        e.preventDefault();
        saveForm();
        return;
      }
      if (e.key === 'Escape' && DOM.modalOverlay.classList.contains('open')) {
        closeModal();
        return;
      }
    }

    if (e.key === '/' && !DOM.modalOverlay.classList.contains('open') && e.target !== DOM.searchInput) {
      e.preventDefault();
      expandSearch();
    }

    const isNewProjectKey = e.key === 'n' || e.key === 'N';
    const isCtrlKeyPressed = e.ctrlKey;
    const isModalClosed = !DOM.modalOverlay.classList.contains('open');
    const shouldOpenNewProject = isNewProjectKey && isCtrlKeyPressed && isModalClosed;

    if (shouldOpenNewProject) {
      e.preventDefault();
      openModal();
    }
  });

  const btnNewProject = document.getElementById('btnNewProject');
  if (btnNewProject) {
    btnNewProject.addEventListener('click', () => openModal());
  }

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const isDashboard = DOM.dashboardContainer.classList.contains('active');
      const isFinancial = DOM.financialContainer.classList.contains('active');
      if (isDashboard) {
        exportDashboardData();
      } else if (isFinancial) {
        exportFinancialData();
      } else {
        exportKanbanData();
      }
    });
  }

  if (DOM.btnDelete) {
    DOM.btnDelete.addEventListener('click', deleteItem);
  }

  const btnCloseModal = document.getElementById('btnCloseModal');
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeModal);
  }

  const btnCancel = document.getElementById('btnCancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', closeModal);
  }

  const btnSave = document.getElementById('btnSave');
  if (btnSave) {
    btnSave.addEventListener('click', saveForm);
  }

  if (DOM.searchBtn) {
    DOM.searchBtn.addEventListener('click', expandSearch);
  }

  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', handleSearch);
    DOM.searchInput.addEventListener('blur', collapseSearch);
  }

  // Chart toggle buttons
  const chartToggleHistory = document.getElementById('chartToggleHistory');
  const chartToggleProjection = document.getElementById('chartToggleProjection');
  if (chartToggleHistory) {
    chartToggleHistory.addEventListener('click', () => {
      const tasks = AppState.getTasks();
      const historicalData = calculateMonthlyRevenue(tasks, 12);
      renderRevenueChart(historicalData, 'history');
    });
  }
  if (chartToggleProjection) {
    chartToggleProjection.addEventListener('click', () => {
      const tasks = AppState.getTasks();
      const projectionData = calculateProjectedRevenue(tasks, 12);
      renderRevenueChart(projectionData, 'projection');
    });
  }

  DOM.modalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.modalOverlay) closeModal();
  });

  DOM.formClient.addEventListener('input', () => clearFormError('client'));
  DOM.formContact.addEventListener('input', () => clearFormError('contact'));
  DOM.formDomain.addEventListener('input', () => clearFormError('domain'));
  DOM.formPrice.addEventListener('input', () => clearFormError('price'));
}

function renderUserAvatar() {
  const user = getCurrentUser();
  if (!user) return;

  const avatar = document.getElementById('userAvatar');
  const userProfile = document.getElementById('userProfile');
  const userDropdown = document.getElementById('userDropdown');
  const dropdownAvatar = document.getElementById('dropdownAvatar');
  const dropdownName = document.getElementById('dropdownName');
  const dropdownEmail = document.getElementById('dropdownEmail');
  const dropdownTheme = document.getElementById('dropdownTheme');
  const dropdownLogout = document.getElementById('dropdownLogout');

  if (avatar) {
    const initials = getInitials(user.name);
    avatar.textContent = initials;
    avatar.title = user.name;
  }

  if (dropdownAvatar) {
    const initials = getInitials(user.name);
    dropdownAvatar.textContent = initials;
  }

  if (dropdownName) {
    dropdownName.textContent = user.name;
  }

  if (dropdownEmail) {
    dropdownEmail.textContent = user.email;
  }

  if (userProfile) {
    userProfile.style.display = 'flex';
    avatar.addEventListener('click', toggleUserDropdown);
  }

  if (dropdownTheme) {
    dropdownTheme.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTheme();
    });
  }

  if (dropdownLogout) {
    dropdownLogout.addEventListener('click', (e) => {
      e.stopPropagation();
      closeUserDropdown();
      logout();
    });
  }

  const currentTheme = getCurrentTheme();
  updateThemeIcon(currentTheme);
}

function toggleUserDropdown(e) {
  if (e) {
    e.stopPropagation();
  }

  const userDropdown = document.getElementById('userDropdown');
  if (!userDropdown) return;

  const isHidden = userDropdown.classList.contains('hidden');
  if (isHidden) {
    userDropdown.classList.remove('hidden');
    setTimeout(() => {
      document.addEventListener('click', closeUserDropdownOnOutsideClick, true);
    }, 0);
  } else {
    closeUserDropdown();
  }
}

function closeUserDropdown() {
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown) {
    userDropdown.classList.add('hidden');
  }
  document.removeEventListener('click', closeUserDropdownOnOutsideClick, true);
}

function closeUserDropdownOnOutsideClick(e) {
  const userProfile = document.getElementById('userProfile');
  const userDropdown = document.getElementById('userDropdown');

  if (userProfile && userDropdown &&
    !userProfile.contains(e.target)) {
    closeUserDropdown();
  }
}

function initApp() {
  DOM.init();
  updateAriaHiddenForViews();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const migratedTasks = migrateTasksData(parsed);
      AppState.setTasks(migratedTasks);
      AppState.log('Loaded from localStorage', { count: migratedTasks.length });
    } else {
      AppState.setTasks(defaultTasks);
      AppState.log('Using default data');
    }
  } catch (error) {
    console.error('[Init] Erro ao carregar dados:', error);
    AppState.setTasks(defaultTasks);
    AppState.log('Fallback to defaults due to error');
  }

  initTheme();
  renderUserAvatar();
  renderBoard();
  updateHeader('projects');
  setupEventListeners();

  setInterval(() => {
    updateDeadlineDisplays();
    if (DOM.dashboardContainer.classList.contains('active')) {
      renderDashboard();
    } else if (DOM.financialContainer.classList.contains('active')) {
      renderFinancial();
    } else {
      updateHeader('projects');
    }
  }, 60000);
}

function initAuth() {
  sanitizeUrl();

  const loginForm = document.getElementById('loginForm');
  const loginOverlay = document.getElementById('loginOverlay');
  const appContainer = document.getElementById('appContainer');
  const btnLogout = document.getElementById('btnLogout');

  if (isAuthenticated()) {
    if (loginOverlay) {
      loginOverlay.classList.add('hidden');
      loginOverlay.classList.remove('fade-out', 'fade-in');
    }
    if (appContainer) {
      appContainer.classList.remove('hidden', 'fade-out');
      appContainer.classList.remove('fade-in');
      requestAnimationFrame(() => {
        appContainer.classList.add('fade-in');
      });
    }
    initApp();
    return;
  }
  if (loginOverlay) {
    loginOverlay.classList.remove('hidden', 'fade-out');
    loginOverlay.classList.remove('fade-in');
    requestAnimationFrame(() => {
      loginOverlay.classList.add('fade-in');
    });
  }
  if (appContainer) {
    appContainer.classList.add('hidden');
    appContainer.classList.remove('fade-out', 'fade-in');
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');
      const errorGeneral = document.getElementById('errorLoginGeneral');
      const errorEmail = document.getElementById('errorLoginEmail');
      const errorPassword = document.getElementById('errorLoginPassword');

      if (errorEmail) {
        errorEmail.classList.remove('show');
        errorEmail.textContent = '';
      }
      if (errorPassword) {
        errorPassword.classList.remove('show');
        errorPassword.textContent = '';
      }
      if (errorGeneral) {
        errorGeneral.classList.remove('show');
        errorGeneral.textContent = '';
      }

      if (emailInput) {
        emailInput.setAttribute('aria-invalid', 'false');
        emailInput.classList.remove('error');
      }
      if (passwordInput) {
        passwordInput.setAttribute('aria-invalid', 'false');
        passwordInput.classList.remove('error');
      }

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      const result = login(email, password);

      if (result.success) {
        clearFormCredentials();

        if (loginOverlay) {
          loginOverlay.classList.remove('fade-in');
          loginOverlay.classList.add('fade-out');
        }

        setTimeout(() => {
          if (loginOverlay) {
            loginOverlay.classList.add('hidden');
            loginOverlay.classList.remove('fade-out', 'fade-in');
          }

          if (appContainer) {
            appContainer.classList.remove('hidden', 'fade-out');
            appContainer.classList.remove('fade-in');
            requestAnimationFrame(() => {
              appContainer.classList.add('fade-in');
            });
          } else {
            console.error('[Login] ERRO: appContainer não encontrado!');
          }

          clearFormCredentials();
          initApp();
        }, 400);
      } else {
        if (errorGeneral) {
          errorGeneral.textContent = result.message;
          errorGeneral.classList.add('show');
        }
        if (emailInput) {
          emailInput.setAttribute('aria-invalid', 'true');
          emailInput.classList.add('error');
        }
        if (passwordInput) {
          passwordInput.setAttribute('aria-invalid', 'true');
          passwordInput.classList.add('error');
        }
      }
    });

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    if (emailInput) {
      emailInput.addEventListener('input', () => {
        emailInput.setAttribute('aria-invalid', 'false');
        emailInput.classList.remove('error');
        const errorEmail = document.getElementById('errorLoginEmail');
        if (errorEmail) {
          errorEmail.classList.remove('show');
          errorEmail.textContent = '';
        }
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        passwordInput.setAttribute('aria-invalid', 'false');
        passwordInput.classList.remove('error');
        const errorPassword = document.getElementById('errorLoginPassword');
        if (errorPassword) {
          errorPassword.classList.remove('show');
          errorPassword.textContent = '';
        }
      });
    }
  }

}

initAuth();
