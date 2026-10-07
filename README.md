# Motor VTT — Frontend

Aplicação frontend em Vue 3 e TypeScript, com autenticação por cookies
HttpOnly e uma demonstração de tabletop em tempo real.

## Tecnologias

- **Vue 3** (Composition API / `<script setup>`)
- **TypeScript**
- **Pinia** (Gerenciamento de Estado)
- **Vue Router** (Proteção e navegação de rotas)
- **Axios** (Comunicação HTTP)
- **Vite** (Bundler e ambiente de desenvolvimento)

## Executar a demonstração tabletop

O tabletop depende do backend e de um MySQL configurado. Siga o guia completo
do backend para configurar as variáveis, executar migrations, criar duas
contas, compartilhar uma sala e testar mestre e jogador: consulte
`backend/docs/tabletop-realtime.md` (seção “Demonstração local com duas sessões”).

Para um ambiente local padrão, configure `.env.development`:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

`VITE_API_URL` deve apontar para a API do backend. O cliente usa a origem dessa
URL para abrir o Socket.IO; não coloque segredos ou tokens nessa variável.
Configure `CORS_ORIGIN` no backend com a origem do frontend, normalmente
`http://localhost:5173`.

Requisitos: Node.js `22.18+` ou `24.12+` e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. Para uma segunda sessão autenticada, use outro
navegador, perfil ou janela privativa e entre com uma segunda conta participante
da mesma sala.

Na tela da sala, o chat simples também aceita as rolagens V1 documentadas pelo
backend. O servidor valida, calcula, persiste e distribui os resultados; a
documentação do protocolo e dos limites está em
`backend/docs/tabletop-realtime.md`.

## Scripts

```bash
npm test        # testes do protocolo e configuração tabletop
npm run type-check
npm run build
```
