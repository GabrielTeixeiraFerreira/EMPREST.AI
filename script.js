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
const logoutButton = document.querySelector('#logout-button');
const submitButton = loginForm.querySelector('button[type="submit"]');

let catalogItems = [];

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

const statusLabel = (status) => status === 'available' ? 'Disponível' : 'Em manutenção';

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

const renderCatalog = () => {
  const equipment = filteredCatalog();
  if (!equipment.length) {
    catalogGrid.innerHTML = '<p class="catalog-empty">Nenhum equipamento encontrado.</p>';
    return;
  }

  catalogGrid.innerHTML = equipment.map((item) => {
    const image = item.imageUrl
      ? `<img src="${escapeHtml(item.imageUrl)}" alt="" loading="lazy" />`
      : `<span>${escapeHtml(item.category)}</span>`;
    return `
      <article class="equipment-card">
        <div class="equipment-image">${image}</div>
        <div class="equipment-card-body">
          <p class="equipment-tag">${escapeHtml(item.assetTag)}</p>
          <h2>${escapeHtml(item.name)}</h2>
          <span class="equipment-status ${escapeHtml(item.status)}">${statusLabel(item.status)}</span>
        </div>
      </article>
    `;
  }).join('');
};

const showCatalog = async (accessToken) => {
  catalogMessage.textContent = 'Carregando catálogo...';
  const response = await fetch(`${API_URL}/equipment`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Não foi possível carregar o catálogo.');
  }
  catalogItems = await response.json();
  renderCatalog();
  loginShell.hidden = true;
  catalogShell.hidden = false;
  catalogMessage.textContent = `${catalogItems.length} equipamentos no catálogo.`;
};

const clearSession = () => {
  sessionStorage.removeItem('emprestai_access_token');
  catalogItems = [];
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
