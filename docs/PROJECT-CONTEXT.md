# CONTEXTO GERAL DO PROJETO — MOTOR VTT UNIVERSAL

> **Arquivo de Contexto para Assistentes de IA em Ambientes de Desenvolvimento (IDE / Agentic Coding)**  
> **Projeto:** Desenvolvimento de Motor de Virtual Tabletop (VTT) Universal com SheetEngine  
> **Instituição:** IFSP — Câmpus Guarulhos | Curso Técnico em Informática Integrado ao Ensino Médio (4º Ano)  
> **Disciplina:** Projeto Integrador em Tecnologia da Informação  
> **Autores:** Livia Kathleen Souza Santos (Frontend, Design) & Pedro Paulo Lourenço (FullStack, Modelagem e Arquitetura)  
> **Orientador:** Prof. Dr. Thiago Schumacher Barcelos

---

## 1. Visão Geral e Propósito do Sistema

O **Motor VTT Universal** é uma plataforma web leve, acessível e de alta performance voltada para a prática de Role-Playing Games (RPG) de mesa no Brasil. O sistema substitui ferramentas estrangeiras onerosas e pesadas (como Roll20, Foundry VTT e Fantasy Grounds) por uma infraestrutura otimizada em português, com foco em baixa latência (<200ms em WebSockets) e alto desempenho gráfico (60 FPS com PixiJS).

### Principais Pilares do Projeto
1. **Universalidade via SheetEngine:** Suporte a qualquer sistema de regras (D&D 5e, Tormenta20, Ordem Paranormal, Call of Cthulhu, sistemas próprios) sem necessidade de alterar o esquema do banco de dados relacional.
2. **Comunicação em Tempo Real:** Sincronização atômica de movimentação de tokens, rolagens de dados e chat via WebSockets com Socket.io e isolamento por salas (Rooms).
3. **Renderização 2D de Alta Performance:** Canvas acelerado via WebSockets/WebGL com PixiJS 8.x, organizando o mapa em 3 camadas de sobreposição (*fundo*, *objetos*, *tokens*).
4. **Arquitetura Desacoplada e Modular:** Estruturada em 3 Esferas Funcionais (Global, Sessão e Conteúdo) e em camadas bem definidas (N-Tier Architecture).

---

## 2. Tech Stack & Estrutura do Monorepo

O projeto é organizado como um **Monorepo**:

```text
motor-vtt/
├── backend/          # Servidor Node.js + Express + Socket.io + MySQL
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── sockets/
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/         # Aplicação Vue 3 + Vite + PixiJS + Pinia
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── router/
    │   ├── services/
    │   ├── stores/
    │   └── views/
    ├── .env.development
    ├── .env.production
    ├── package.json
    └── vite.config.ts
```

### Tecnologias do Backend
* **Runtime & Framework:** Node.js (v22+ LTS), Express 5.x.
* **Comunicação em Tempo Real:** Socket.io 4.x (suporte a Rooms, handshake seguro e reconexão automática).
* **Banco de Dados:** MySQL 8.0+ (com suporte nativo a colunas de tipo de dado **JSON** para persistência *schema-less*).
* **Segurança & Autenticação:** BCrypt (hashing de senhas), JWT (JSON Web Tokens armazenados em Cookies `HttpOnly` e `SameSite`), CORS configurado.
* **Env / Utilidades:** `dotenv`, `nodemon` (devDependencies).

### Tecnologias do Frontend
* **Framework Web:** Vue 3 (Composition API com `<script setup>`), TypeScript.
* **Build Tool:** Vite.
* **Gerenciamento de Estado:** Pinia.
* **Roteamento:** Vue Router (com Guards de navegação para proteção de rotas privadas).
* **Motor Gráfico 2D:** PixiJS 8.x (WebGL / HTML5 Canvas).
* **Cliente HTTP & Sockets:** Axios, `socket.io-client`.

---

## 3. Arquitetura do Sistema e Esferas Funcionais

O sistema é dividido em **3 Esferas de Domínio**:

### 1. Esfera Global (Usuário & REST API)
* **Escopo:** Autenticação, cadastro, recuperação de senha, ativação de conta por e-mail assíncrono (24h de expiração) e Dashboard do Usuário.
* **Comunicação:** HTTP REST estritamente.
* **Regras Chave:** Unicidade de e-mail (`RN_GLB05`), senha mínima de 8 caracteres (`RN_GLB06`), hashing BCrypt (`RN_GLB07`), UUID v4 automático (`RN_GLB08`), bloqueio de login para contas pendentes (`RN_GLB32`), listagem exclusiva de salas próprias (`RN_GLB24`).

### 2. Esfera de Sessão (Sala, Participante & WebSocket Rooms)
* **Escopo:** Criação de salas, geração de códigos de convite de alta entropia, ingresso em salas, gestão de lobby, controle de acesso baseado em papéis (RBAC: Mestre vs. Jogador) e salvamento de preferências de tela (`preferencias_view`).
* **Comunicação:** Socket.io + REST.
* **Regras Chave:** Isolamento absoluto de comunicação por sala via `sala_id` (`RN_SES28`), atrito atômico de transferência de mestre (`RN_SES24`), salvamento e restauração de zoom/abas ao reconectar (`RN_SES34`, `RN_SES35`).
* *Decisão de Simplificação BD:* A entidade associativa `Participante` foi simplificada no MySQL — as salas mantêm criador, participantes e listas de permissões em colunas JSON (`participantes_ids`, `permissao_mestre`, `permissao_co_mestre`).

### 3. Esfera de Conteúdo e Tabletop (Assets, SheetEngine, Grid e DiceRoller)
* **Escopo:** Gestão de ativos e moldes (`AssetManager`), renderização gráfica com camadas PixiJS, motor de fórmulas de fichas universais (`SheetEngine`), parser de rolagens no backend (`DiceRoller`) e histórico de mensagens (`MessageLog`).
* **Comunicação:** WebSocket + REST.

---

## 4. Módulos Específicos & Regras de Negócio Importantes

### A. Engine de Fichas Dinâmicas (`SheetEngine`)
* **Esquema Schema-Less:** A tabela `SheetTemplate` armazena a estrutura da ficha na coluna JSON `campos_schema`. A tabela `CharacterSheet` armazena os valores no JSON `dados_preenchidos`.
* **4 Seções Fixas Obrigatórias (`RN_SHT02`):**
    1. `cabecalho`: Dados textuais/informativos (Nome, Classe, Tendência).
    2. `atributos`: Valores numéricos base (Força, Destreza, Vigor).
    3. `recursos`: Valores numéricos com limite atual/máximo (Pontos de Vida, Mana).
    4. `pericias`: Habilidades secundárias vinculadas a atributos base.
* **Parser de Fórmulas Reativo (`RN_SHT07`-`RN_SHT11`):**
    * Expressões usam `@` para referenciar variáveis base (ex: `floor((@forca - 10) / 2)`).
    * Validação recursiva estática para bloquear **referências circulares** (`RN_SHT08`).
    * Recálculo em cascata reativo no backend ao modificar atributos base (`RN_SHT10`).
    * Tratamento sanitário de nulos/falhas convertendo para `0` por padrão (`RN_SHT11`).
* **Ponte Ficha-Token (`RN_SHT15`):** O atributo `status_bar_map` no Token lê variáveis dinâmicas da ficha para exibir barras vitais sobre o sprite no PixiJS via broadcast de WebSocket.

### B. Ambiente de Jogo & Canvas (`PixiJS Tabletop`)
* **Lifecycle do Componente Vue:** A instância do PixiJS deve ser inicializada no `onMounted` e **destruída rigorosamente** no `onUnmounted` com `app.destroy(true, { children: true, texture: true })` para prevenir vazamentos de memória (*memory leaks*).
* **Evitar Reatividade Reativa sobre o PixiJS:** Nunca guardar a instância do PixiJS em `ref()` ou `reactive()` do Vue. Usar variáveis JavaScript normais.
* **3 Camadas de Renderização (*Layers* em JSON `RN_TAB15`):**
    1. `fundo`: Mapa de fundo estático (background).
    2. `objetos`: Elementos de cenário e decorações com trava de seleção para jogadores.
    3. `tokens`: Sprites móveis dos personagens e NPCs.
* **Movimentação & Snap to Grid (`RN_TAB26`-`RN_TAB32`):** Drag-and-drop dispara `solicitarMovimentacao` no backend, que valida permissões (Mestre ou dono da ficha), calcula o alinhamento matemático no centro da célula (*Snap to Grid*), persiste as coordenadas e dispara broadcast via Socket.io.

### C. Gestão de Ativos (`AssetManager Service`)
* **Servidor Stateless:** Camada de serviço no Node.js que orquestra a biblioteca global do usuário (`usuario_id`) e a biblioteca local da sala (`sala_id`).
* **Clonagem Segura (`RN_CNT04`):** O método `clonarParaSala` copia um ativo da biblioteca do usuário para a sala, protegendo o molde original contra alterações feitas em jogo.
* **Diferenciação Molde vs. Presença:** `Asset` é o molde estático. `Token` e `CharacterSheet` são as instâncias vivas. A remoção de um Token na cena **nunca** apaga o Asset de origem (`RN_CNT13`).

### D. Dados & Comunicação (`DiceRoller & MessageLog`)
* **Processamento Anti-Cheat no Backend (`RN_COM01`):** Nenhuma rolagem é calculada no cliente.
* **Parser de Expressões (`RN_COM02`-`RN_COM11`):** Suporta o padrão `[quantidade]d[faces] + [modificadores]`, até 100 dados por rolagem, substituição de variáveis `@atributo` e simulação pseudo-aleatória individualizada.
* **Rolagens Secretas de Mestre (`RN_COM26`):** O backend salva a rolagem no histórico, mas envia os metadados completos apenas para o socket do mestre. Jogadores recebem apenas um aviso de que "O Mestre realizou uma rolagem secreta".
* **Sanitização XSS (`RN_COM15`):** Mensagens de chat são higienizadas contra injeção de HTML/scripts executáveis.

---

## 5. Diretrizes para a IA / Regras de Codificação

1. **Sempre respeite as convenções de código do monorepo:**
    - **Backend:** Node.js CommonJS/ESM moderno, Express, sintaxe assíncrona (`async/await`), respostas em JSON estruturado com status HTTP corretos.
    - **Frontend:** Vue 3 `<script setup lang="ts">`, Composition API pura, Pinia para estado global, CSS escopado ou Tailwind.
2. **Atenção aos WebSockets:** Sempre desacople a lógica de negócio do `socket.id` efêmero. Utilize a associação via `userId` e vincule conexões a `user:${userId}` e `room:${salaId}`.
3. **Mantenha a Integridade das Regras de Negócio (RNs):** Nunca altere a lógica de validação de fórmulas, permissões RBAC ou limites físicos sem seguir o documento normativo de regras de negócio (`Reegras-de-Negocio-2.pdf`).
4. **Gerenciamento de Memória no Vue + PixiJS:** Ao criar componentes de canvas, certifique-se de limpar os listeners do Socket (`socket.off()`) e destruir o app do PixiJS no `onUnmounted`.
5. **Garantia de Tipagem JSON no MySQL:** Ao escrever consultas e modelos no MySQL, trate as colunas JSON como estruturas manipuláveis nativamente e escreva rotinas defensivas contra valores nulos/indefinidos.

---
*Este arquivo serve como contexto de autoridade primária para geração de código, refatoração e implementação de tarefas na IDE.*
