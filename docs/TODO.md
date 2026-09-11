# Backlog de Implementação — Motor VTT Universal

Backlog técnico orientado por `docs/regras-de-negocio.md`. Um item só deve ser concluído quando seus critérios de aceitação forem atendidos.

## Tarefas concluídas verificadas — Frontend

- [X] **Guarda de rotas:** configurar `requiresAuth`, `requiresGuest` e `router.beforeEach` para redirecionar usuários conforme o estado da sessão.
- [X] **Cliente HTTP com credenciais:** configurar Axios com `withCredentials: true` para envio automático de cookies `HttpOnly`.
- [X] **Interceptor de sessão expirada:** tratar respostas 401/403, limpar a sessão Pinia e redirecionar para `/login`, exceto nos endpoints públicos de autenticação.
- [X] **Reidratação de sessão:** implementar `checkSession()` com `/auth/me` e executá-lo antes da montagem da aplicação.
- [X] **Logout no frontend:** chamar `/auth/logout` e limpar o estado local mesmo quando a requisição falhar.
- [X] **Tipagens de autenticação:** criar `User`, `LoginCredentials`, `RegisterPayload` e `AuthResponse` em `src/types/auth.ts`.
- [X] **Feedback dos formulários:** implementar validações/mensagens de erro e estados de carregamento em Login e Cadastro.

## Sprint 0 — Fundação

- [ ] **Contratos compartilhados:** definir DTOs/tipos para Usuario, Sala, Participante, Tabuleiro, Cena, Token, Asset, SheetTemplate, CharacterSheet e MessageLog, incluindo enums e JSONs. **Aceitação:** frontend e backend validam os mesmos formatos.
- [ ] **Ambientes e segredos:** documentar API, banco, JWT, cookies, CORS, e-mail, filas e storage em `.env.example`. **Aceitação:** segredos não entram no repositório e variáveis ausentes geram erro claro.
- [ ] **Validação e erros:** padronizar schemas de entrada, respostas HTTP, correlation ID e logs estruturados. **Aceitação:** nenhum erro expõe stack trace ou dados sensíveis.
- [ ] **Qualidade:** configurar TypeScript strict, lint, formatter, testes e CI para frontend/backend. **Aceitação:** pipeline executa typecheck, testes e build.

## Sprint 1 — Módulo 1: Autenticação REST & Persistência

- [ ] **Migrações MySQL 8:** criar Usuario, Sala, Participante, Tabuleiro, Cena, Token, Asset, SheetTemplate, CharacterSheet e MessageLog, com UUIDs, FKs, índices, constraints e JSON nativo. **Aceitação:** migrações sobem/descem deterministicamente e impedem órfãos e duplicidades.
- [ ] **Seed e transações:** criar seed de desenvolvimento e criação atômica de sala, tabuleiro e participante mestre. **Aceitação:** falha em qualquer etapa desfaz a operação.
- [ ] **Cadastro seguro:** validar nome/e-mail/senha, aplicar BCrypt/Argon2, gerar UUID e status PENDENTE. **Aceitação:** e-mail duplicado e senha menor que 8 caracteres são rejeitados; senha nunca é persistida em claro.
- [ ] **Login, sessão e logout:** comparar hash, bloquear conta não ativada, atualizar ultimo_login, emitir JWT em cookie HttpOnly e invalidá-lo no logout. **Aceitação:** Secure em produção, SameSite/CORS/credentials corretos e 401 para sessão inválida.
- [ ] **Ativação de conta:** gerar token de uso único, validade de 24h, envio assíncrono e ativação atômica. **Aceitação:** token expirado/inexistente/reutilizado falha; reenvio invalida o anterior.
- [ ] **Recuperação de conta:** implementar token expirável, redefinição segura e limite de 15 minutos. **Aceitação:** resposta não revela se o e-mail existe e o token só funciona uma vez.
- [ ] **Middleware REST:** validar JWT e autorização por proprietário, participante e mestre. **Aceitação:** usuário não acessa recursos de terceiros.
- [ ] **Dashboard de perfil:** criar GET/PATCH de perfil e listagem exclusiva de salas próprias/participadas. **Aceitação:** alteração sensível exige senha atual; mestre único não pode excluir a conta.
- [ ] **Testes REST:** cobrir cadastro, cookies, ativação, recuperação, logout, permissões e transações. **Aceitação:** cenários positivos e negativos automatizados.

## Sprint 2 — Módulo 2: Tempo Real com Socket.io

- [ ] **Servidor e Rooms:** configurar Socket.io, CORS, eventos versionados e isolamento por sala_id. **Aceitação:** evento de uma sala jamais chega a outra.
- [ ] **Handshake autenticado:** validar JWT no cookie/transporte e carregar usuário no socket. **Aceitação:** conexão sem sessão válida é recusada.
- [ ] **Presença:** emitir entrada, saída, desconexão e lista de membros ativos. **Aceitação:** lobby não apresenta duplicidades e reflete offline/online.
- [ ] **Sincronização inicial:** implementar sincronizarEstado com cena ativa, jogadores, permissões e preferencias_view. **Aceitação:** cliente novo converge sem depender de eventos antigos.
- [ ] **Reconexão automática:** configurar backoff, reentrada na Room e nova sincronização. **Aceitação:** queda temporária não duplica presença nem perde a sala.
- [ ] **Preferências de tela:** persistir zoom, pan e aba com debounce e JSON validado. **Aceitação:** preferências são individuais e restauradas no retorno.
- [ ] **RBAC da sala:** implementar promoção, demissão, transferência atômica de mestre, remoção, saída de jogador e pausa/encerramento. **Aceitação:** apenas mestre administra; sala ativa nunca fica sem mestre.
- [ ] **Testes Socket.io:** cobrir handshake, isolamento, reconexão, presença, autorização e concorrência. **Aceitação:** testes provam segregação entre salas.

## Sprint 3 — Módulo 3: Tabletop & PixiJS 8

- [ ] **Componente Vue/Pixi:** montar no onMounted e destruir com app.destroy(), removendo listeners/recursos no onUnmounted. **Aceitação:** navegação repetida não acumula canvas nem listeners.
- [ ] **Grid e cena:** renderizar background_url, grid_config e células com zoom/pan. **Aceitação:** grid permanece alinhado ao mapa.
- [ ] **Câmera local:** implementar zoom limitado, pan, centralização e restauração de preferencias_view sem broadcast. **Aceitação:** câmera de um usuário não altera outra.
- [ ] **Três Layers:** mapear fundo, objetos e tokens para containers com ordem fixa. **Aceitação:** fundo fica abaixo de objetos e tokens; jogadores não editam decorativos.
- [ ] **Permissões de cena:** restringir cenas ocultas e edição de fundo/objetos ao mestre. **Aceitação:** regra é validada no backend, não só na UI.
- [ ] **Drag-and-drop:** implementar seleção, Snap to Grid, limites e evento solicitarMovimentacao. **Aceitação:** jogador só move token autorizado.
- [ ] **Persistência/broadcast:** validar movimentação no backend e transmitir coordenada final. **Aceitação:** movimento inválido não altera banco nem clientes.
- [ ] **Testes de motor gráfico:** cobrir montagem, teardown, grid, câmera, layers, permissões e drag. **Aceitação:** testes detectam vazamento básico e ordem de renderização.

## Sprint 4 — Módulo 4: SheetEngine

- [ ] **Validador de campos_schema:** exigir cabecalho, atributos, recursos e pericias, com tipos e IDs válidos. **Aceitação:** template incompleto, duplicado ou inválido não é salvo.
- [ ] **Parser de fórmulas:** avaliar operações permitidas e variáveis @ sem eval, incluindo floor((@forca - 10) / 2). **Aceitação:** sintaxe perigosa, variável desconhecida e divisão inválida falham controladamente.
- [ ] **Referências circulares:** construir grafo e detectar ciclos diretos/indiretos antes do salvamento. **Aceitação:** erro lista os campos envolvidos.
- [ ] **Recálculo em cascata:** usar ordem topológica e sanitizar nulos/ inválidos para 0. **Aceitação:** dependências atualizam uma vez, sem NaN ou loops.
- [ ] **Persistência de ficha:** validar payload, aplicar transações e tratar concorrência/versionamento. **Aceitação:** campos fora do template são rejeitados.
- [ ] **Ponte ficha–token:** interpretar status_bar_map e transmitir barras vitais após alterações. **Aceitação:** somente valores numéricos válidos chegam ao PixiJS.
- [ ] **Testes do Engine:** cobrir parser, precedência, ciclos, cascata, nulos, permissões e segurança. **Aceitação:** nenhuma expressão executa código arbitrário.

## Sprint 4 — Módulo 5: AssetManager

- [ ] **Serviço stateless:** separar orquestração de biblioteca, autorização, repositórios e eventos. **Aceitação:** recriar o serviço não perde estado.
- [ ] **Bibliotecas:** implementar CRUD, pastas, filtros e tipos TEMPLATE_FICHA, NPC_PRESET, MAPA e TOKEN. **Aceitação:** global e local não se misturam.
- [ ] **clonarParaSala:** clonar parcialmente com usuario_id nulo e sala_id preenchido. **Aceitação:** editar clone não altera molde original.
- [ ] **Asset → Token:** arrastar ativo cria Token leve com asset_origem_id, cena_id, posição e ficha opcional. **Aceitação:** excluir Token não exclui Asset ou CharacterSheet.
- [ ] **Visibilidade:** mestre vê tudo; jogador vê apenas ativos explicitamente atribuídos. **Aceitação:** filtro vale para listagem, detalhe, instanciação e eventos no backend.
- [ ] **Propagação segura:** definir propriedades do molde que atualizam Tokens sem sobrescrever posição/ficha/customizações. **Aceitação:** integridade de instâncias é preservada.
- [ ] **Testes de ativos:** cobrir clonagem, pastas, visibilidade, instanciação, deleção e concorrência. **Aceitação:** não há acesso cruzado entre usuários/salas.

## Sprint 5 — Módulo 6: DiceRoller & MessageLog

- [ ] **Parser anti-cheat:** aceitar quantidade d faces + modificadores, com limites e RNG seguro no servidor. **Aceitação:** cliente não envia resultado final e expressões inválidas são rejeitadas.
- [ ] **Integração com fichas:** resolver @atributo em snapshot autorizado e registrar expressão, resultado, usuário e sala. **Aceitação:** bônus é calculado no backend.
- [ ] **Chat e logs:** persistir mensagens, rolagens públicas e secretas com tipo, autor, sala e metadados JSON. **Aceitação:** segredo de mestre nunca aparece para jogador.
- [ ] **Sanitização XSS:** limitar tamanho, remover HTML/script e renderizar texto seguro. **Aceitação:** payload malicioso não executa nem é salvo como HTML perigoso.
- [ ] **Paginação:** retornar os últimos 50 logs por cursor e carregar via Infinite Scroll. **Aceitação:** não há duplicatas ou lacunas e a consulta usa índice.
- [ ] **Testes de comunicação:** cobrir RNG, variáveis, segredo, XSS, paginação, persistência e Rooms. **Aceitação:** RNG injetável permite testes determinísticos.

## Fechamento e operação

- [ ] **Auditoria de segurança:** revisar CSRF, CORS, rate limiting, headers, autorização horizontal e validação JSON. **Aceitação:** vulnerabilidades críticas corrigidas.
- [ ] **Observabilidade:** adicionar métricas de sockets, latência, erros de e-mail/rolagem e logs correlacionáveis. **Aceitação:** nenhum segredo aparece nos logs.
- [ ] **Desempenho:** executar carga REST/Socket.io, rolagens e cenas com muitos tokens. **Aceitação:** metas de latência, conexões e FPS documentadas.
- [ ] **Documentação:** publicar OpenAPI, catálogo Socket.io, payloads, permissões e versionamento. **Aceitação:** integração não depende de conhecimento implícito.
- [ ] **Deploy e rollback:** configurar migrações, backup, health checks, shutdown gracioso e rollback. **Aceitação:** homologação é reproduzível e reversível.
- [ ] **Aceite ponta a ponta:** validar cadastro → ativação → sala → lobby → tabletop → ficha → token → rolagem/chat → reconexão. **Aceitação:** fluxo funciona para mestre e jogador, incluindo cenários negativos.
