const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000')
  .replace(/\/+$/, '');
const API_URL = configuredApiUrl.endsWith('/v1')
  ? configuredApiUrl
  : `${configuredApiUrl}/v1`;
const loginShell = document.querySelector('.login-shell');
const catalogShell = document.querySelector('#catalog-shell');
const loginForm = document.querySelector('#login-form');
const operationsButton = document.querySelector('#operations-button');
const formTitle = document.querySelector('#form-title');
const formDescription = document.querySelector('#form-description');
const formNote = document.querySelector('#form-note');
const formMessage = document.querySelector('#form-message');
const catalogMessage = document.querySelector('#catalog-message');
const catalogGrid = document.querySelector('#catalog-grid');
const catalogSearch = document.querySelector('#catalog-search');
const catalogFilter = document.querySelector('#catalog-filter');
const loansList = document.querySelector('#loans-list');
const loansMessage = document.querySelector('#loans-message');
const logoutButton = document.querySelector('#logout-button');
const submitButton = loginForm.querySelector('button[type="submit"]');

let catalogItems = [];
let openLoans = [];

const userContext = {
  title: 'Entrar',
  description: 'Acesse seu painel e acompanhe seus empréstimos.',
  note: 'Cada pessoa vê apenas os próprios empréstimos.',
};

const operationsContext = {
  title: 'Operações',
  description: 'Acompanhe empréstimos abertos, atrasos e itens em manutenção.',
  note: 'Visão operacional de todo o inventário.',
};

const updateContext = (context) => {
  formTitle.textContent = context.title;
  formDescription.textContent = context.description;
  formNote.textContent = context.note;
  formMessage.textContent = '';
};

const statusLabel = (status) => ({
  available: 'Disponível',
  maintenance: 'Em manutenção',
  loaned: 'Emprestado',
}[status] || status);

const categoryLabel = (category) => ({
  notebook: 'Notebook',
  monitor: 'Monitor',
  cable: 'Cabo',
  camera: 'Câmera',
  accessory: 'Acessório',
}[category] || category);

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const filteredCatalog = () => {
  const search = catalogSearch.value.trim().toLowerCase();
  const status = catalogFilter.value;
  return catalogItems.filter((item) => {
    const matchesSearch = !search ||
      `${item.assetTag} ${item.name}`.toLowerCase().includes(search);
    return matchesSearch && (status === 'all' || item.status === status);
  });
};

const formatDate = (date) => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
}).format(new Date(date));

const renderLoans = () => {
  if (!openLoans.length) {
    loansList.innerHTML = '<p class="catalog-empty">Nenhum empréstimo em aberto.</p>';
    return;
  }
  loansList.innerHTML = openLoans.map((loan) => `
    <article class="loan-row">
      <div>
        <p class="equipment-tag">${escapeHtml(loan.equipment.assetTag)}</p>
        <h3>${escapeHtml(loan.equipment.name)}</h3>
      </div>
      <p class="loan-due">Devolver até <strong>${formatDate(loan.dueAt)}</strong></p>
    </article>
  `).join('');
};

const renderCatalog = () => {
  const equipment = filteredCatalog();
  if (!equipment.length) {
    catalogGrid.innerHTML = '<p class="catalog-empty">Nenhum equipamento encontrado.</p>';
    return;
  }

  catalogGrid.innerHTML = equipment.map((item) => {
    const image = item.imageUrl
      ? `<img src="${escapeHtml(item.imageUrl)}" alt="" loading="lazy" />`
      : `<span>${escapeHtml(categoryLabel(item.category))}</span>`;
    return `
      <article class="equipment-card">
        <div class="equipment-image">${image}</div>
        <div class="equipment-card-body">
          <p class="equipment-tag">${escapeHtml(item.assetTag)}</p>
          <h2>${escapeHtml(item.name)}</h2>
          <p class="equipment-category">${escapeHtml(categoryLabel(item.category))}</p>
          <span class="equipment-status ${escapeHtml(item.status)}">${statusLabel(item.status)}</span>
          ${item.status === 'available'
            ? `<button class="button button-primary loan-button" data-equipment-id="${escapeHtml(item.id)}" type="button">Solicitar</button>`
            : ''}
        </div>
      </article>
    `;
  }).join('');

  catalogGrid.querySelectorAll('.loan-button').forEach((button) => {
    button.addEventListener('click', () => requestLoan(button.dataset.equipmentId, button));
  });
};

const apiRequest = async (path, accessToken, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Não foi possível concluir a operação.');
  }
  return response.json();
};

const loadLoans = async (accessToken) => {
  openLoans = await apiRequest('/loans/me', accessToken);
  renderLoans();
};

const showCatalog = async (accessToken) => {
  catalogMessage.textContent = 'Carregando catálogo...';
  catalogItems = await apiRequest('/equipment', accessToken);
  renderCatalog();
  await loadLoans(accessToken);
  loginShell.hidden = true;
  catalogShell.hidden = false;
  catalogMessage.textContent = `${catalogItems.length} equipamentos no catálogo.`;
};

const requestLoan = async (equipmentId, button) => {
  const accessToken = sessionStorage.getItem('emprestai_access_token');
  if (!accessToken) return;
  button.disabled = true;
  button.textContent = 'Solicitando...';
  loansMessage.textContent = '';
  try {
    await apiRequest('/loans', accessToken, {
      method: 'POST',
      body: JSON.stringify({ equipmentId }),
    });
    await showCatalog(accessToken);
    catalogMessage.textContent = 'Empréstimo criado com sucesso.';
  } catch (error) {
    loansMessage.textContent = error instanceof Error
      ? error.message
      : 'Não foi possível solicitar o equipamento.';
    button.disabled = false;
    button.textContent = 'Solicitar';
  }
};

const clearSession = () => {
  sessionStorage.removeItem('emprestai_access_token');
  catalogItems = [];
  openLoans = [];
  catalogShell.hidden = true;
  loginShell.hidden = false;
  loginForm.reset();
  updateContext(userContext);
};

operationsButton.addEventListener('click', () => {
  updateContext(operationsContext);
  document.querySelector('#username').focus();
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';
  const username = loginForm.elements.username.value.trim();
  const password = loginForm.elements.password.value;

  if (!username || !password) {
    formMessage.textContent = 'Informe seu usuário e sua senha para continuar.';
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Validando...';
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      throw new Error('Usuário ou senha inválidos.');
    }
    const session = await response.json();
    sessionStorage.setItem('emprestai_access_token', session.access_token);
    await showCatalog(session.access_token);
  } catch (error) {
    formMessage.textContent = error instanceof Error
      ? error.message
      : 'Não foi possível concluir o login.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Entrar';
  }
});

catalogSearch.addEventListener('input', renderCatalog);
catalogFilter.addEventListener('change', renderCatalog);
logoutButton.addEventListener('click', clearSession);

const savedToken = sessionStorage.getItem('emprestai_access_token');
if (savedToken) {
  showCatalog(savedToken).catch(() => clearSession());
}
