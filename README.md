# Sistema de Autenticação - Frontend
<!-- TODO atualizar o readme -->
Aplicação frontend desenvolvida com **Vue 3**, **TypeScript**, **Pinia** e **Vue Router**, utilizando arquitetura segura baseada em **Cookies HttpOnly**.

## 🛠️ Tecnologias Utilizadas

- **Vue 3** (Composition API / `<script setup>`)
- **TypeScript**
- **Pinia** (Gerenciamento de Estado)
- **Vue Router** (Proteção e navegação de rotas)
- **Axios** (Comunicação HTTP)
- **Vite** (Bundler e ambiente de desenvolvimento)

---

## 📁 Estrutura da Documentação

Para entender a arquitetura, o fluxo de dados e o andamento do projeto, consulte a pasta [docs/](./docs/):

- [TODO.md](./docs/TODO.md) - Lista de tarefas e progresso de desenvolvimento.
- [auth-flow.md](./docs/auth-flow.md) - Explicação do fluxo de login, cadastro e reidratação de sessão via Cookies HttpOnly. *(Em breve)*
- [api-integration.md](./docs/api-integration.md) - Documentação dos serviços e endpoints consumidos. *(Em breve)*

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
Certifique-se de ter o **Node.js** instalado em sua máquina.

### Instalação
```sh
npm install
```

### Executar em Ambiente de Desenvolvimento
```sh
npm run dev
```

### Compilar e Gerar Build de Produção
```sh
npm run build
```