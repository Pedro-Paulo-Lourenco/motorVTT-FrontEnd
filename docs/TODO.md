# TODO List - Autenticação e Sessão

## 1. Guarda de Rotas (Navigation Guards) - `src/router/index.ts`
- [X] Adicionar `meta: { requiresAuth: true }` nas rotas protegidas (ex: `UserHomeView.vue`).
- [X] Adicionar `meta: { requiresGuest: true }` nas rotas públicas exclusivas para não autenticados (`LoginView.vue`, `CadView.vue`).
- [X] Criar o guard global `router.beforeEach` para:
    - Redirecionar usuários não autenticados tentando acessar rotas protegidas para `/login`.
    - Redirecionar usuários autenticados tentando acessar `/login` ou `/cadastro` para `/home` (ou rota protegida).

---

## 2. Interceptadores HTTP - `src/services/api.ts`
- [ ] **Request Interceptor**: Anexar o token de autenticação no cabeçalho `Authorization: Bearer <token>` em cada requisição.
- [ ] **Response Interceptor**: Capturar erros `401 Unauthorized` e `403 Forbidden` para:
    - Limpar o estado de autenticação (Store / localStorage).
    - Redirecionar automaticamente para a tela de login.

---

## 3. Gerenciamento e Validação de Sessão - `src/stores/auth.ts` & `src/main.ts`
- [x] Utilizar cookies `HttpOnly` gerenciados automaticamente pelo navegador.
- [x] Implementar método de inicialização/reidratação de sessão (`checkSession`):
  - Chamar o endpoint da API (`/auth/me`) para validar o cookie de sessão e obter os dados do usuário.
- [ ] Executar a validação da sessão na inicialização da aplicação (`src/main.ts`) antes da montagem do app.
---

## 4. Tipagem TypeScript - `src/types/auth.ts`
- [x] Criar arquivo de tipos dedicados `src/types/auth.ts`.
- [x] Definir interface `User` (dados do perfil do usuário).
- [x] Definir interfaces para payloads: `LoginCredentials`, `RegisterPayload`.
- [x] Definir interface de resposta da API: `AuthResponse`.

---

## 5. Feedback e Tratamento de Erros no UI
- [ ] Implementar mensagens de erro nos formulários de Login e Cadastro (ex: e-mail inválido, credenciais incorretas).
- [ ] Adicionar estados de carregamento (*loading states*) nos botões de submissão dos formulários.
- [ ] (Opcional) Integrar biblioteca/componente de Toast/Alert para notificações globais (ex: sessão expirada, sucesso no cadastro).

---

## 6. Configurações de Ambiente
- [ ] Criar `.env.production` com a URL da API de produção.
- [ ] Criar `.env.example` para documentar as variáveis de ambiente do projeto.