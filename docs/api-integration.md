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
* **Resposta:** envelope `ApiSuccess<AuthResponse>` (`success: true`, `data.user`). O token de acesso e a sessão são enviados somente por cookies `HttpOnly`, não no JSON.

### 2. Cadastro
* **Rota:** `POST /auth/register`
* **Descrição:** Cria uma nova conta de usuário na aplicação.
* **Payload:** `RegisterPayload` (`nome`, `email`, `password`)
* **Resposta:** envelope `ApiSuccess<AuthResponse>` com os dados do usuário recém-criado.

### 3. Verificar Sessão (Reidratação)
* **Rota:** `GET /auth/me`
* **Descrição:** Valida a sessão ativa lendo o cookie `HttpOnly` enviado pelo navegador.
* **Resposta:** envelope `ApiSuccess<AuthResponse>` se a sessão for válida, ou um erro HTTP (ex: 401) se expirada/inválida.

Os tipos `User`, `AuthResponse` e `ApiSuccess<T>` são importados de
`@motor-vtt/contracts`. Os schemas `userSchema` e `authResponseSchema` validam
respectivamente o usuário e o conteúdo de autenticação; credenciais e validações
específicas de cada endpoint permanecem locais.

## 🏠 Endpoints de Salas (`/rooms`)

`VITE_API_URL` já inclui o prefixo `/api` (por exemplo,
`http://localhost:3000/api`). Portanto, o cliente chama os caminhos abaixo sem
repetir `/api`. Todas as operações exigem a sessão autenticada e usam o envelope
`ApiSuccess<T>` (`success: true`, `data`):

| Operação | Método e caminho | Payload | Dados em `data` |
| --- | --- | --- | --- |
| Listar salas das quais participa | `GET /rooms` | — | `Room[]` |
| Criar sala | `POST /rooms` | `{ nome: string }` | `Room` |
| Entrar por convite | `POST /rooms/join` | `{ codigoConvite: string }` | `Participant` |
| Carregar lobby | `GET /rooms/:salaId` | — | `{ sala: Room, participantes: Participant[] }` |

As entidades `Room`, `Participant`, `ApiSuccess<T>` e o schema
`apiErrorResponseSchema` vêm de `@motor-vtt/contracts`. Os payloads de criação e
entrada permanecem tipados localmente enquanto não forem exportados pela versão
do contrato usada pelo frontend. O papel mostrado no lobby é lido do participante
cujo `usuarioId` corresponde ao `id` da pessoa autenticada; a API nunca recebe
identificadores ou papéis declarados pelo cliente.

Erros usam `{ success: false, error: { code, message, ... } }`. A interface
converte códigos conhecidos em mensagens adequadas e não apresenta detalhes
internos do servidor. O endpoint de lobby verifica a participação; após atualizar
a página, os dados são sempre buscados novamente pela API com o cookie de sessão.

---

## 🔒 Segurança e Cookies HttpOnly

1. **Proteção contra XSS:** O token de autenticação/sessão é gerenciado pelo navegador através de um Cookie com as flags `HttpOnly` e `Secure`.
2. **Isolamento no Frontend:** Os scripts TypeScript no frontend não possuem acesso de leitura ou escrita ao token da sessão.
3. **Persistência de Sessão:** Toda requisição enviada pela instância do `api` inclui automaticamente os cookies de sessão mantidos pelo navegador.
