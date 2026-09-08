# Integração com a API

Esta documentação descreve a arquitetura de comunicação HTTP entre o frontend e a API backend, detalhando as configurações do cliente Axios, os endpoints consumidos e o modelo de autenticação utilizado.

---

## 🛠️ Configuração do Cliente HTTP

A comunicação com a API é centralizada em uma instância customizada do **Axios** localizada em `src/services/api.ts`.

### Detalhes Técnicos:
- **`baseURL`**: Definida através da variável de ambiente `VITE_API_URL` (configurada no arquivo `.env` do projeto).
- **`withCredentials: true`**: Habilita o envio e recebimento automático de credenciais (incluindo **Cookies HttpOnly**) em requisições cross-origin (CORS).

---

## 🔑 Endpoints de Autenticação (`/auth`)

Os endpoints da API são gerenciados e consumidos através do store de autenticação Pinia (`src/stores/auth.ts`).

### 1. Login
* **Rota:** `POST /auth/login`
* **Descrição:** Autentica o usuário com e-mail e senha.
* **Payload:** `LoginCredentials` (`email`, `password`)
* **Resposta:** `AuthResponse` contendo as informações do usuário. O token/sessão é atribuído automaticamente pelo servidor via cookie `HttpOnly`.

### 2. Cadastro
* **Rota:** `POST /auth/cadastrar`
* **Descrição:** Cria uma nova conta de usuário na aplicação.
* **Payload:** `RegisterPayload` (`name`, `email`, `password`, etc.)
* **Resposta:** `AuthResponse` com os dados do usuário recém-criado.

### 3. Verificar Sessão (Reidratação)
* **Rota:** `GET /auth/me`
* **Descrição:** Valida a sessão ativa lendo o cookie `HttpOnly` enviado pelo navegador.
* **Resposta:** Retorna os dados do usuário (`User`) se a sessão for válida, ou um erro HTTP (ex: 401) se expirada/inválida.

---

## 🔒 Segurança e Cookies HttpOnly

1. **Proteção contra XSS:** O token de autenticação/sessão é gerenciado pelo navegador através de um Cookie com as flags `HttpOnly` e `Secure`.
2. **Isolamento no Frontend:** Os scripts TypeScript no frontend não possuem acesso de leitura ou escrita ao token da sessão.
3. **Persistência de Sessão:** Toda requisição enviada pela instância do `api` inclui automaticamente os cookies de sessão mantidos pelo navegador.
