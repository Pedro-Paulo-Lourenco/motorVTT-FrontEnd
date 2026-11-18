# Arquitetura do Frontend

## Visão geral

O frontend é uma aplicação Vue 3 com TypeScript criada pelo Vite. A aplicação
combina três responsabilidades principais:

1. sessão e navegação protegida;
2. biblioteca, templates e fichas de personagem;
3. tabletop em tempo real com Socket.IO e PixiJS.

O estado global usa Pinia, a navegação usa Vue Router e as integrações REST usam
uma instância compartilhada do Axios. Contratos compartilhados publicados pelo
pacote `@motor-vtt/contracts` fornecem tipos e schemas Zod usados entre
frontend e backend.

## Árvore funcional

```text
src/
├── assets/                 # CSS e recursos estáticos
├── components/
│   ├── sheet/              # Renderizador e gaveta das fichas
│   ├── tabletop/           # Dock lateral e presença dos participantes
│   ├── TabletopCanvas.vue  # Cena PixiJS
│   ├── RoomSettings.vue    # Templates associados à sala
│   └── FieldEditorModal.vue
├── router/                 # Rotas e Navigation Guards
├── services/api.ts         # Axios, cookies, refresh e sessão expirada
├── stores/                 # Estado Pinia de autenticação e fichas
├── tabletop/
│   ├── connection.ts       # Resolução da origem do Socket.IO
│   └── protocol.ts         # Schemas Zod do protocolo tabletop v1
├── types/                  # Tipos locais que ainda não vêm dos contratos
├── views/                  # Telas por rota
├── App.vue                 # Navegação global e menu do usuário
└── main.ts                 # Bootstrap da aplicação
```

## Inicialização e navegação

O fluxo de inicialização é:

1. `main.ts` cria a aplicação e o Pinia.
2. Registra o handler de sessão não autorizada no Axios.
3. Executa `authStore.checkSession()` em `GET /auth/me`.
4. Instala o Vue Router e monta a aplicação.

As rotas públicas têm `meta.public`. Rotas privadas usam `requiresAuth`.
Rotas de visitante usam `requiresGuest`. O guarda global impede acesso sem
sessão, redireciona visitantes já autenticados para `/home` e reidrata a sessão
quando necessário.

## Estado

- `authStore`: usuário, autenticação e inicialização da sessão.
- `sheetTemplateStore`: draft do construtor de template, campos, validação local
  de IDs e fórmulas e detecção de ciclos.
- `characterSheetStore`: ficha carregada, template associado, valores atuais,
  versão, persistência em debounce e sincronização por socket.

As instâncias PixiJS não são guardadas em `ref` ou `reactive`. Variáveis locais
mantêm o ciclo de vida da cena para evitar que o Vue transforme objetos gráficos
em proxies reativos.

## Camadas de comunicação

### REST

`src/services/api.ts` cria o Axios com:

- `baseURL` em `VITE_API_URL`;
- `withCredentials: true`;
- renovação cooperativa em `POST /auth/refresh`;
- limpeza e redirecionamento para login após falha de sessão.

A URL HTTP deve normalmente apontar para `http://localhost:3000/api`. Para
Socket.IO, o cliente usa apenas a origem `http://localhost:3000`, derivada de
`VITE_API_URL` por `resolveTabletopSocketOrigin`.

### Socket.IO

`RoomView.vue` abre a conexão com cookies habilitados e aguarda a confirmação
do evento `tabletop:v1:join`. Entrar em uma sala não é autorização pelo
frontend: o backend valida participação e papel.

Eventos recebidos:

- `tabletop:v1:state`: snapshot inicial do tabuleiro, cena e tokens;
- `tabletop:v1:presence`: IDs dos usuários presentes;
- `tabletop:v1:messages`: histórico inicial limitado;
- `tabletop:v1:message:created`: nova mensagem ou rolagem;
- `tabletop:v1:token:added`, `token:moved`, `token:removed`;
- `tabletop:v1:error`: erro estrutural da operação.

Operações enviadas:

- `tabletop:v1:join`;
- `tabletop:v1:token:add`;
- `tabletop:v1:token:move`;
- `tabletop:v1:token:remove`;
- `tabletop:v1:message:send`;
- `sheet:update-resource`.

Todas as operações usam confirmação por callback (`ack`) em até 5 segundos.
Payloads são validados com Zod antes de serem enviados ou aplicados ao estado
local. O conteúdo final das rolagens é recebido do servidor; o cliente não envia
resultados calculados.

## Renderização tabletop

`TabletopCanvas.vue` usa PixiJS 8 e organiza a cena em:

1. fundo: mapa estático;
2. grid: grade derivada da configuração da cena;
3. objetos: marcações e elementos decorativos;
4. tokens: sprites seletáveis e arrastáveis.

A demonstração usa um mapa SVG local em `public/tabletop-demo-map.svg`. Zoom,
pan e escala da câmera são locais ao navegador. A movimentação de tokens é
calculada no cliente para visualização imediata, mas a posição final é enviada ao
backend com snap para o grid e só persiste após validação e broadcast.

Somente mestre possui `canEdit` na interface do tabletop. Mesmo assim, todas as
operações sensíveis devem ser autorizadas novamente pelo backend.

O componente inicializa o PixiJS em `onMounted`, remove listeners, cancela o
frame pendente e destrói a aplicação em `onBeforeUnmount`.

## Fichas e templates

O construtor permite organizar campos nas quatro seções fixas:

- `cabecalho`;
- `atributos`;
- `recursos`;
- `pericias`.

Tipos e operações são fornecidos pelos contratos compartilhados. Fórmulas podem
referenciar campos por `@campoId` e são validadas antes da persistência. Na
gaveta de ficha, valores são enviados ao backend com debounce de 350 ms.
Mudanças de recursos podem ser emitidas diretamente pelo socket.

Exclusão de template pode ser recusada pelo backend se o template estiver em uso.
Não é responsabilidade do frontend desconsiderar essa regra.

## Biblioteca pessoal

`/biblioteca` apresenta fichas e templates do usuário autenticado. Permite criar,
duplicar, compartilhar por URL local e abrir uma ficha em uma gaveta lateral.
O clone cria uma instância pessoal sem alterar o objeto original.

Dentro da sala, o usuário pode importar uma ficha da biblioteca e vinculá-la ao
token selecionado. O mestre pode criar fichas para um token ou criar primeiro o
token e depois vinculá-lo à ficha.

## Estrutura de tela da sala

`RoomView.vue` concentra o estado da sessão tabletop:

- lobby e participante atual;
- conexão e presença;
- tabuleiro, cena e tokens;
- chat e histórico;
- dock com chat, fichas, tokens e assets;
- configurações exclusivas do mestre.

Componentes especializados recebem os dados necessários por props e emitam ações
para `RoomView`, que é responsável por executar REST ou Socket.IO e manter o
estado sincronizado.
