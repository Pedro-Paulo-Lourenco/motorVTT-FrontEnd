# Fluxo de Autenticação e Sessão (`auth-flow.md`)

Este documento descreve a arquitetura e o funcionamento do sistema de autenticação, cadastro, proteção de rotas e reidratação de sessão do frontend.

---

## 🔒 1. Segurança baseada em Cookies `HttpOnly`

O projeto foi arquitetado para **não** armazenar tokens de acesso (JWT) no `localStorage` ou `sessionStorage` do navegador. 

- **Como funciona:** Quando o usuário realiza o login ou o cadastro com sucesso, o backend emite um token e o define diretamente nos cabeçalhos de resposta (`Set-Cookie`) como um cookie seguro do tipo `HttpOnly`.
- **Vantagem:** Scripts maliciosos executados no navegador (ataques XSS) não conseguem ler ou roubar o token, pois o JavaScript da aplicação não tem acesso direto a cookies `HttpOnly`. O navegador gerencia o envio desse cookie automaticamente em todas as requisições subsequentes para a API.

---

## 📌 2. Gerenciamento de Estado (`../src/stores/auth.ts`)

A store global do Pinia (`auth`) é a única fonte da verdade para o estado de autenticação no frontend. Ela gerencia três propriedades principais no `state`:

1. `user`: Objeto contendo os dados do usuário logado (tipado pela interface `User`) ou `null` se deslogado.
2. `isAuthenticated`: Booleano que indica se o usuário possui sessão ativa.
3. `isInitialized`: Booleano que indica se o processo inicial de checagem de sessão ao carregar a página já foi concluído.

### Principais Ações (`actions`):
- **`login(credentials)`**: Envia as credenciais para `/auth/login`. O backend valida e injeta o cookie `HttpOnly`. A store atualiza `user` e `isAuthenticated = true`.
- **`cadastrar(credentials)`**: Envia os dados para `/auth/cadastrar`, realizando o registro e logando automaticamente o usuário.
- **`checkSession()`**: Faz uma requisição GET para `/auth/me`. O backend lê o cookie `HttpOnly` da requisição e retorna os dados atualizados do usuário. Caso o cookie seja inválido ou expirado, a store limpa o estado (`user = null`, `isAuthenticated = false`) e finaliza a inicialização (`isInitialized = true`).

---

## 🚦 3. Proteção e Guarda de Rotas (`../src/router/index.ts`)

O Vue Router utiliza metadados nas rotas (`meta`) combinados com um *Navigation Guard* global (`router.beforeEach`) para proteger as páginas:

- **Rotas Privadas (`requiresAuth: true`)**: Exigem que o usuário esteja autenticado (`isAuthenticated === true`). Caso contrário, o usuário é redirecionado para a tela de login (`/login`).
- **Rotas de Convidado / Guests (`requiresGuest: true`)**: Destinadas a usuários não autenticados (ex: telas de Login e Cadastro). Caso um usuário já logado tente acessá-las, ele é redirecionado automaticamente para a home protegida.

---

## 🔄 4. Ciclo de Vida e Reidratação da Sessão (F5)

Como o estado da Pinia é armazenado apenas na memória volátil do navegador, **recarregar a página (F5)** apagaria temporariamente o estado de login do usuário.

Para resolver isso:
1. Ao iniciar a aplicação (no `main.ts` ou antes de montar o app), chama-se a ação `checkSession()` da store de autenticação.
2. O Axios envia automaticamente o cookie `HttpOnly` para a API validar a sessão.
3. Se o cookie for válido, a store é repovoada instantaneamente, permitindo que o usuário continue navegando sem perceber que a página foi recarregada.
