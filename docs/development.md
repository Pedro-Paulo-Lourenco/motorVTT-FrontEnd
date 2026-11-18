# Desenvolvimento do Frontend

## Requisitos

- Node.js `22.18+` ou `24.12+`;
- npm;
- backend configurado e acessível;
- navegador com suporte a WebGL para o tabletop PixiJS.

## Instalação

```bash
cd frontend
npm install
cp .env.example .env.development
npm run dev
```

No arquivo de desenvolvimento, `VITE_API_URL` deve terminar em `/api`:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

O backend deve permitir `http://localhost:5173` em `CORS_ORIGIN` e aceitar
cookies com credentials. O Socket.IO usa a origem derivada da URL da API.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor Vite com hot reload |
| `npm test` | Testes Vitest |
| `npm run type-check` | Verificação Vue/TypeScript |
| `npm run build-only` | Build de produção Vite |
| `npm run build` | Type-check e build |
| `npm run preview` | Servir o build de produção |

Não há lint script configurado no `package.json`, apesar de ESLint aparecer nas
dependências.

## Testes

Os testes atuais cobrem principalmente a infraestrutura tabletop:

- resolução da origem do Socket.IO;
- schemas de estado, presença, tokens e operações;
- limites e validação de payloads;
- payloads de chat e resultados de rolagens.

Execute:

```bash
npm test
npm run type-check
npm run build
```

## Convenções

- componentes Vue usam Composition API e `<script setup lang="ts">`;
- imports internos usam o alias `@/`;
- estado compartilhado fica em Pinia;
- payloads REST/Socket.io são tipados e validados quando possuem contrato
  compartilhado ou Zod local;
- IDs em URLs devem ser codificados com `encodeURIComponent`;
- estados assíncronos devem mostrar carregamento e erros acessíveis;
- listeners Socket.IO e instâncias PixiJS devem ser removidos/destruídos ao
  desmontar componentes.

## Estrutura e variáveis

As variáveis Vite disponíveis ao cliente devem usar o prefixo `VITE_`. Não coloque
tokens, senhas ou dados secretos em `.env.production` ou em qualquer variável
`VITE_*`: o bundle frontend é público.

## Build e preview

```bash
npm run build
npm run preview
```

O preview padrão usa o servidor Vite local. Em hospedagem estática, configure
fallback para `index.html`, pois o Vue Router usa `createWebHistory`.
