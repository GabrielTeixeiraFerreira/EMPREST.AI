const form = document.getElementById('loginForm');
const operationButton = document.querySelector('.operations-access');

const setUserContext = (role) => {
  const heading = document.querySelector('.form-wrap h2');
  const text = document.querySelector('.panel-text');
  const helper = document.querySelector('.helper');

  if (role === 'operations') {
    heading.textContent = 'Operações';
    text.textContent = 'Acompanhe empréstimos abertos, atrasos e itens em manutenção.';
    helper.textContent = 'Visão operacional de todo o inventário.';
    return;
  }

  heading.textContent = 'Entrar';
  text.textContent = 'Acesse seu painel e acompanhe seus empréstimos.';
  helper.textContent = 'Cada pessoa vê apenas os próprios empréstimos.';
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value.trim();

  if (!email || !password) {
    const button = form.querySelector('button[type="submit"]');
    button.textContent = 'Preencha e-mail e senha';
    button.disabled = true;
    setTimeout(() => {
      button.textContent = 'Entrar';
      button.disabled = false;
    }, 1600);
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.textContent = 'Acessando...';
  button.disabled = true;

  setTimeout(() => {
    button.textContent = 'Entrar';
    button.disabled = false;
    setUserContext('user');
  }, 900);
});

operationButton.addEventListener('click', () => {
  setUserContext('operations');
});
