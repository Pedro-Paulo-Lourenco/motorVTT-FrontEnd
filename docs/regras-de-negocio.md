# Módulo de Regras de Negócio (RN) — Motor VTT Universal

Este documento consolida as **166 Regras de Negócio (RN)** do projeto VTT Universal, estruturadas em formato Markdown otimizado para leitura, interpretação e implementação por assistentes de IA e desenvolvedores.

---

## 1. Esfera Global

Este núcleo normativo descreve as validações, restrições e comportamentos lógico-sistêmicos aplicados à **Esfera Global**, que engloba as telas e ações de Cadastro, Login, Recuperação de Senha e o Dashboard de Perfil/Campanhas.

### 1.1. Tela e Ações de Cadastro de Usuário (Sign-Up)
Esta tela é a porta de entrada para novos usuários criarem suas credenciais no sistema.

* **RN_GLB01 – Obrigatoriedade do Nome de Usuário:** O formulário de cadastro deve exigir o preenchimento obrigatório do campo `nome`. O sistema deve impedir o envio do formulário caso o campo esteja nulo ou composto apenas por espaços em branco.
* **RN_GLB02 – Obrigatoriedade do E-mail de Usuário:** O formulário de cadastro deve exigir o preenchimento obrigatório do campo `email`. O sistema deve impedir o envio se o campo estiver vazio.
* **RN_GLB03 – Obrigatoriedade da Senha de Usuário:** O formulário de cadastro deve exigir o preenchimento obrigatório do campo de senha (que originará a `senha_criptografada`). O sistema deve impedir o envio se o campo estiver vazio.
* **RN_GLB04 – Validação de Formato de E-mail:** O campo `email` inserido no cadastro deve obedecer rigorosamente ao padrão sintático de endereço de correio eletrônico internacional (ex: `usuario@dominio.com`). O sistema deve rejeitar strings que não sigam essa estrutura.
* **RN_GLB05 – Unicidade Absoluta de E-mail:** O endereço de e-mail fornecido no formulário não pode existir previamente em nenhum outro registro ativo na tabela `Usuario` do banco de dados. Caso haja duplicidade, o sistema deve interromper a operação e retornar uma mensagem de erro específica.
* **RN_GLB06 – Comprimento Mínimo da Senha:** O campo de senha fornecido pelo usuário no formulário de cadastro deve conter, no mínimo, 8 (oito) caracteres. Entradas com comprimento menor devem ser rejeitadas visualmente no front-end e logicamente no back-end.
* **RN_GLB07 – Hashing e Criptografia de Senha:** O valor textual puro inserido no campo de senha não deve ser armazenado diretamente no banco de dados. O back-end deve aplicar um algoritmo de hash seguro (criptografia unidirecional, ex: BCrypt) sobre a senha fornecida e salvar o resultado gerado no atributo `senha_criptografada`.
* **RN_GLB08 – Geração Automática de Identificador (UUID):** No momento da gravação do novo usuário, o sistema deve gerar automaticamente um identificador único universal (UUID v4) para preencher o atributo `id` na tabela `Usuario`.
* **RN_GLB09 – Registro da Data de Cadastro:** No momento da persistência bem-sucedida do registro, o banco de dados ou o back-end deve capturar a data e hora do servidor de forma automática e inseri-la no atributo `data_de_cadastro`.
* **RN_GLB10 – Inicialização do Último Login como Nulo:** Durante o primeiro salvamento do registro de um usuário recém-cadastrado, o atributo `ultimo_login` deve ser persistido como nulo (`null`).

---

### 1.2. Tela e Ações de Autenticação (Login)
Esta tela gerencia a validação de identidade para permitir que o usuário acesse as demais funcionalidades e telas do sistema.

* **RN_GLB11 – Obrigatoriedade do E-mail no Login:** O formulário de login deve exigir o preenchimento obrigatório do campo `email`. O sistema deve impedir a submissão se o campo estiver em branco.
* **RN_GLB12 – Obrigatoriedade da Senha no Login:** O formulário de login deve exigir o preenchimento obrigatório do campo de senha de texto puro. O sistema deve impedir a submissão se o campo estiver em branco.
* **RN_GLB13 – Validação de Existência de E-mail:** Ao submeter as credenciais de login, o método `autenticar` deve buscar se existe o e-mail informado na tabela `Usuario`. Caso o e-mail não seja encontrado, o sistema deve retornar um erro genérico de autenticação para proteção de segurança do usuário.
* **RN_GLB14 – Comparação Criptográfica de Senha:** O sistema deve validar a senha de texto puro digitada no formulário contra o valor contido na coluna `senha_criptografada` utilizando uma função de comparação hash segura compatível com o algoritmo adotado na criptografia. Caso as assinaturas não correspondam, o login deve ser rejeitado com um erro genérico de autenticação.
* **RN_GLB15 – Geração de Token JWT de Sessão:** Após a validação com sucesso do e-mail e da senha no método `autenticar`, o servidor deve gerar um token de autenticação cookie HTTPOnly (ex: JWT - JSON Web Token) e enviar ao frontend o ID do usuário e o tempo de expiração da sessão.
* **RN_GLB16 – Registro de Carimbo de Último Login:** No instante em que o login for efetuado com sucesso pelo método `autenticar`, o sistema deve atualizar imediatamente o atributo `ultimo_login` com a data e hora atuais obtidas do servidor.

---

### 1.3. Tela e Ações de Recuperação de Senha (Lembrar Senha)
Essa funcionalidade auxilia os usuários que esqueceram suas credenciais de acesso, atuando como uma extensão lógica do fluxo de autenticação.

* **RN_GLB17 – Obrigatoriedade de E-mail de Recuperação:** O formulário da tela de recuperação de senha deve exigir o preenchimento obrigatório do campo `email`.
* **RN_GLB18 – Validação Semântica de E-mail de Recuperação:** O campo `email` inserido no formulário de recuperação deve obedecer ao formato de e-mail internacional válido antes de disparar o processamento.
* **RN_GLB19 – Proteção contra Varredura de Contas (Enumeration):** Se o e-mail informado na recuperação de senha não constar no banco de dados, o sistema deve retornar visualmente uma mensagem genérica de sucesso de envio, impedindo que usuários mal-intencionados descubram quais e-mails estão cadastrados na plataforma.
* **RN_GLB20 – Limitação de Tempo para Novo Envio:** O sistema só deve permitir o disparo de um e-mail de recuperação de senha para o mesmo usuário uma vez a cada 15 (quinze) minutos para evitar ataques de sobrecarga no serviço de e-mail.

---

### 1.4. Tela de Perfil e Painel Geral (Dashboard do Usuário)
Esta tela é carregada imediatamente após o login com sucesso do usuário, onde ele gerencia seus dados de conta, visualiza suas salas e seus assets globais.

* **RN_GLB21 – Exigência de Token para Acesso:** O sistema deve bloquear o carregamento da tela de Perfil/Dashboard caso o cliente não envie um Token de Sessão válido ou caso o Token esteja expirado, redirecionando o fluxo do front-end automaticamente para a tela de Login.
* **RN_GLB22 – Edição Segura de Atributos de Perfil:** O método `editarPerfil` deve permitir a modificação do nome e do e-mail do usuário conectado. O sistema só deve salvar as alterações se as novas entradas passarem pelas regras de obrigatoriedade e validação de formato aplicadas no cadastro.
* **RN_GLB23 – Confirmação de Senha na Alteração de Perfil:** Para persistir qualquer alteração de e-mail ou senha no método `editarPerfil`, o usuário deve fornecer obrigatoriamente a sua senha atual para fins de validação criptográfica de segurança.
* **RN_GLB24 – Listagem Exclusiva de Salas Próprias:** O método `listarMinhasSalas` chamado ao carregar o Dashboard deve retornar estritamente os registros de salas onde o ID do usuário conectado esteja presente como `mestre_id` na tabela `Sala`, ou onde ele possua um registro associado como participante na tabela `Participante`. O sistema deve impedir que dados de salas de terceiros sejam visualizados pelo usuário ativo.
* **RN_GLB25 – Vinculação Automática de Mestre ao Criar Sala:** Ao acionar o comando `criarSala(nome, sistema)`, o sistema deve gerar automaticamente um novo registro na tabela `Sala` e registrar em paralelo o ID do usuário ativo na tabela `Participante` com o atributo `role` configurado de forma mandatória como `MESTRE`.
* **RN_GLB26 – Restrição de Exclusão de Conta Ativa:** O usuário só poderá solicitar a exclusão de sua conta se não houver nenhuma sala ativa na qual ele seja o único participante com papel de `MESTRE`. O sistema deve exigir a transferência do papel de mestre para outro usuário antes de permitir a exclusão da conta física.

---

### 1.5. Fluxo de Ativação de Conta via E-mail Automático
Estas regras ditam as restrições lógicas aplicadas à segurança de contas recém-criadas que necessitam de validação por e-mail antes de obterem acesso total ao sistema.

* **RN_GLB27 – Estado Inicial "Pendente de Ativação":** Ao persistir um novo registro de `Usuario` na tabela correspondente através do método de cadastro, o sistema deve definir o seu estado de ativação (ex: campo `status_ativacao`) obrigatoriamente como `"PENDENTE"` ou `"INATIVO"`.
* **RN_GLB28 – Geração Automática de Token de Ativação:** Imediatamente após a gravação dos dados do usuário pendente, o back-end deve gerar automaticamente um token de ativação criptográfico de uso único, seguro e de alta entropia (ex: UUID v4).
* **RN_GLB29 – Persistência de Prazo de Expiração do Token:** O token gerado deve ser persistido no banco de dados associado ao ID do `Usuario` juntamente com um carimbo de data e hora que limite sua validade a, no máximo, 24 (vinte e quatro) horas a partir do momento da criação.
* **RN_GLB30 – Disparo de E-mail Assíncrono:** Ao concluir o salvamento do usuário e do token de ativação, o back-end deve disparar de forma assíncrona (ex: utilizando filas de processamento de background) um e-mail automático ao endereço cadastrado em `email`.
* **RN_GLB31 – Estrutura Obrigatória do Link de Ativação:** O corpo do e-mail automático enviado deve conter um link seguro composto obrigatoriamente pela URL pública de ativação do sistema (Frontend) concatenada ao respectivo token gerado em `RN_GLB28`.
* **RN_GLB32 – Bloqueio de Login para Contas Não Ativadas:** O método `autenticar` deve bloquear e rejeitar a geração de tokens de sessão para qualquer conta cujo campo de estado de ativação seja `"PENDENTE"` ou `"INATIVO"`, mesmo que o e-mail e a senha informados estejam corretos.
* **RN_GLB33 – Mensagem Informativa de Bloqueio:** No caso de bloqueio por conta pendente de ativação, o sistema de login deve retornar uma resposta específica solicitando que o usuário verifique sua caixa de entrada para ativar a conta.
* **RN_GLB34 – Rejeição de Token Inexistente:** Ao receber uma requisição de ativação no endpoint correspondente, o sistema deve validar a existência do token no banco de dados. Caso o token fornecido seja inexistente, a ativação deve ser imediatamente rejeitada.
* **RN_GLB35 – Validação de Expiração Temporal de Token:** Caso o token seja localizado, o sistema deve verificar a data e hora do servidor. Se a hora atual for superior ao prazo de validade gravado em `RN_GLB29`, o processo de ativação deve ser interrompido e o token considerado inválido.
* **RN_GLB36 – Atualização de Estado de Ativação para Sucesso:** Se o token for válido e estiver dentro do prazo de expiração, o sistema deve atualizar o estado do `Usuario` para `"ATIVO"` de forma atômica no banco de dados.
* **RN_GLB37 – Descarte de Token Utilizado:** No instante em que o status do usuário for alterado para `"ATIVO"`, o token correspondente deve ser limpo ou marcado como inutilizado no banco de dados, impossibilitando tentativas de reutilização do mesmo link.
* **RN_GLB38 – Mecanismo de Reenvio de Link de Ativação:** Caso o token tenha expirado ou o usuário solicite um reenvio na tela de login, o sistema deve invalidar o token antigo no banco de dados, gerar um novo token com novo prazo de expiração de 24 horas e disparar um novo e-mail automático seguindo as regras de envio assíncrono.

---

## 2. Esfera de Sessão

Este núcleo normativo descreve as validações, restrições e comportamentos lógico-sistêmicos aplicados à **Esfera de Sessão**, regulamentando o ciclo de vida das Salas de Jogo, o controle de acesso e de papéis dos Participantes (RBAC) e as interações em tempo real por meio de WebSockets.

### 2.1. Tela e Ações de Criação de Sala
Esta tela, acessada a partir do Dashboard do Usuário, permite iniciar uma nova campanha de jogo estruturada sob as regras do motor VTT.

* **RN_SES01 – Obrigatoriedade do Nome da Sala:** O formulário de criação de sala deve exigir o preenchimento obrigatório do campo correspondente ao nome da sessão. O sistema deve impedir o envio do formulário se este campo estiver vazio ou preenchido apenas com espaços em branco.
* **RN_SES02 – Comprimento do Nome da Sala:** O nome fornecido no formulário de criação deve conter, no mínimo, 3 (três) caracteres e, no máximo, 100 (cem) caracteres.
* **RN_SES03 – Especificação do Sistema de Jogo:** O formulário de criação deve incluir a seleção obrigatória do sistema de RPG (ex: Tormenta, D&D 5e). O valor selecionado deve ser gravado para orientar o tipo de ficha que será carregado na campanha.
* **RN_SES04 – Geração Automática de Identificador (UUID):** No momento da criação da sala, o sistema deve gerar automaticamente um identificador único universal (UUID v4) para preencher a coluna `id` na tabela `Sala`.
* **RN_SES05 – Geração de Código de Convite Único:** No ato de persistência da sala, o sistema deve gerar uma string aleatória e única para preencher o atributo `codigo_convite`. Essa chave será usada para o ingresso de outros usuários.
* **RN_SES06 – Vinculação do Proprietário como Mestre:** O identificador do usuário criador deve ser gravado de forma automática no atributo `mestre_id` da tabela `Sala`.
* **RN_SES07 – Instanciação de Registro de Participante:** Simultaneamente à gravação da sala, o sistema deve criar automaticamente um registro correspondente na tabela `Participante` para vincular o criador à nova sala.
* **RN_SES08 – Atribuição do Papel de Mestre ao Criador:** O registro de `Participante` gerado para o criador da sala em `RN_SES07` deve ter o seu atributo `role` configurado de forma mandatória com o valor `"MESTRE"`.
* **RN_SES09 – Definição do Status Inicial da Sala:** Durante a inserção da nova sala no banco de dados, o atributo `status` deve ser inicializado obrigatoriamente com o valor `"ATIVA"`.

---

### 2.2. Tela e Ações de Ingresso em Sala (Código de Convite)
Esta tela gerencia o fluxo de entrada de usuários em salas existentes por meio do fornecimento do código identificador.

* **RN_SES10 – Obrigatoriedade do Código de Convite:** A tela de ingresso em sala deve exigir o preenchimento obrigatório do campo destinado ao código de convite.
* **RN_SES11 – Validação de Existência do Código:** O sistema deve rejeitar a solicitação de ingresso se o código digitado pelo usuário não corresponder a nenhuma sala cadastrada no atributo `codigo_convite`.
* **RN_SES12 – Bloqueio de Entrada em Salas Não Ativas:** O sistema deve rejeitar o ingresso do usuário se o status da sala correspondente ao código for diferente de `"ATIVA"`.
* **RN_SES13 – Prevenção de Duplicidade de Participação:** O sistema deve validar se o usuário solicitante já possui registro ativo associado àquela sala na tabela `Participante`. Caso exista, o cadastro é ignorado e o usuário é redirecionado diretamente ao lobby.
* **RN_SES14 – Criação do Registro de Participante Convidado:** Ao validar o código com sucesso, o sistema deve gerar de forma automática um registro na tabela `Participante` contendo as chaves estrangeiras `usuario_id` e `sala_id`.
* **RN_SES15 – Atribuição do Papel de Jogador:** Todo registro de `Participante` originado a partir do fluxo de ingresso via código de convite deve ter seu atributo `role` preenchido obrigatoriamente como `"JOGADOR"`.
* **RN_SES16 – Registro Automático de Data de Entrada:** No momento da criação do vínculo de participante, o sistema deve capturar a data e a hora atuais do servidor e gravá-las no campo `data_entrada`.

---

### 2.3. Tela de Lobby e Gestão de Membros
Esta tela, renderizada antes do carregamento do Tabletop, lista as informações da campanha e os participantes associados.

* **RN_SES17 – Carregamento Automatizado de Participantes:** A tela de lobby deve realizar uma consulta no banco de dados e listar todos os registros na tabela `Participante` que compartilhem o mesmo `sala_id` ativo.
* **RN_SES18 – Exibição de Status de Presença:** O lobby deve indicar em tempo real o status de conexão de cada integrante (online ou offline), cruzando o identificador do participante com as conexões ativas no servidor de WebSockets.
* **RN_SES19 – Visibilidade Exclusiva do Código para o Mestre:** O campo de texto contendo o `codigo_convite` deve ser exibido de forma visível e editável apenas para o participante cujo papel seja `"MESTRE"`.
* **RN_SES20 – Ocultação do Código para Jogadores:** Para participantes com o papel de `"JOGADOR"`, o `codigo_convite` deve ser ocultado ou omitido na interface gráfica do lobby.
* **RN_SES21 – Privilégio para Edição de Metadados da Sala:** Alterações no nome da sala ou no sistema de jogo ativo só podem ser enviadas e salvas se a requisição partir de um participante que possua o papel de `"MESTRE"` na respectiva sala.

---

### 2.4. Gestão de Papéis, Permissões (RBAC) e Remoção
Regras de validação de privilégios para garantir a governança e a segurança tática da mesa de jogo.

* **RN_SES22 – Restrição para Alteração de Papel (Promotion/Demotion):** O método de alteração de papel (`mudarPapel`) só pode ser invocado com sucesso se o requisitante possuir o papel de `"MESTRE"` registrado na tabela `Participante`.
* **RN_SES23 – Bloqueio de Rebaixamento Sem Sucessor:** O participante com o papel de `"MESTRE"` não pode alterar seu próprio papel para `"JOGADOR"` se for o único mestre ativo na sala. O sistema deve exigir a transferência prévia da propriedade.
* **RN_SES24 – Transferência Atômica de Mestre:** Ao promover outro participante ao papel de `"MESTRE"`, o sistema deve realizar uma transação atômica que rebaixa o mestre atual para `"JOGADOR"` e define o mestre selecionado como o novo proprietário no campo `mestre_id` da sala.
* **RN_SES25 – Restrição para Remoção de Membros:** O método `removerMembro` é de execução restrita e só deve prosseguir se o solicitante da ação possuir privilégios de `"MESTRE"`.
* **RN_SES26 – Bloqueio de Autoexclusão do Mestre:** O sistema deve impedir que o mestre remova a si mesmo da sala através do método `removerMembro`. A saída voluntária do mestre exige a exclusão completa da sala ou a transferência de sua propriedade.
* **RN_SES27 – Autonomia de Desconexão do Jogador:** Qualquer participante com o papel de `"JOGADOR"` tem autonomia para voluntariamente deixar a sala. A ação acionará a remoção física do seu respectivo registro na tabela `Participante`.

---

### 2.5. Sincronização em Tempo Real e Estados de Conexão (Socket.io)
Regras que gerenciam a infraestrutura de tempo real e evitam que oscilações de conexão quebrem a imersão do jogo.

* **RN_SES28 – Isolamento de Comunicação por Sala (Rooms):** O servidor WebSocket deve criar um canal isolado (Room do Socket.io) utilizando o `id` da `Sala`. Toda troca de eventos de sessão, chat ou mapa deve ser distribuída estritamente aos sockets conectados a essa Room específica.
* **RN_SES29 – Entrada Obrigatória na Room:** Ao carregar a tela de uma sala ativa, a aplicação cliente deve solicitar que a conexão do socket seja inserida na Room correspondente ao ID da sala.
* **RN_SES30 – Notificação Automática de Ingresso de Socket:** No instante em que o socket de um usuário ingressar na Room da sala, o servidor WebSocket deve emitir uma notificação automática para os demais participantes ativos indicando que o membro está online.
* **RN_SES31 – Notificação de Desconexão por Inatividade:** Se a conexão socket de um participante cair por instabilidade ou fechamento abrupto de aba, o servidor deve detectar a desconexão e emitir um evento para a Room notificando os membros conectados.
* **RN_SES32 – Recuperação de Conexão Automática:** O cliente WebSocket deve possuir um mecanismo de reconexão automática ativo. Ao reestabelecer o sinal, o socket deve ser reinserido automaticamente na Room correspondente ao ID da sala ativa.
* **RN_SES33 – Sincronização de Estado de Entrada:** Ao concluir a entrada de um participante na Room, o servidor WebSocket deve disparar o método `sincronizarEstado`, enviando ao cliente recém-conectado a cena ativa no tabuleiro e a lista atualizada de jogadores presentes.
* **RN_SES34 – Persistência Obrigatória de Preferências de Tela:** Ao detectar a saída do usuário da sala ou fechamento do socket, o sistema deve gravar as preferências atuais do jogador (como abas abertas e zoom do mapa) na coluna `preferencias_view` do `Participante`.
* **RN_SES35 – Sincronização de Preferências ao Retornar:** No momento do carregamento da tela de jogo para um participante que retorna, a interface do Angular/Vue deve ler o atributo `preferencias_view` no banco de dados e restaurar o zoom e a aba da biblioteca exatamente como estavam na última conexão.
* **RN_SES36 – Encerramento Forçado de Sessão (Mesa em Pausa):** Quando o mestre acionar a ação de pausar ou encerrar a sessão, o sistema deve atualizar o status da sala, disparar um comando via WebSocket para desconectar todos os clientes e redirecionar os jogadores automaticamente para o Dashboard global.

---

## 3. Esfera de Conteúdo

Este núcleo normativo descreve as validações, restrições e comportamentos lógico-sistêmicos aplicados à **Esfera de Conteúdo (Asset System)**, regulamentando o ciclo de vida dos ativos reutilizáveis, a propriedade intelectual dos usuários, as operações de importação e clonagem, e a instanciação técnica de elementos visuais no tabuleiro (Tokens).

### 3.1. Propriedades e Organização da Biblioteca de Ativos (Assets)
Esta seção especifica as restrições de armazenamento, edição e governança dos moldes estáticos presentes no repositório de dados.

* **RN_CNT01 – Vínculo de Propriedade do Asset:** Cada registro na tabela `Asset` deve obrigatoriamente possuir um atributo identificador `usuario_id` (FK, Nullable) e um atributo `sala_id` (FK, Nullable). Se o `usuario_id` estiver preenchido e o `sala_id` for nulo, o ativo pertence estritamente à biblioteca global do usuário. Se o `sala_id` estiver preenchido e o `usuario_id` for nulo, o ativo pertence exclusivamente à biblioteca local daquela campanha.
* **RN_CNT02 – Tipos de Recursos de Ativos:** O atributo `tipo_recurso` de um `Asset` deve ser preenchido obrigatoriamente através de um Enum contendo apenas as chaves `TEMPLATE_FICHA`, `NPC_PRESET`, `MAPA` ou `TOKEN`.
* **RN_CNT03 – Persistência de Dados de Referência:** O atributo `dados_referencia` do `Asset` deve ser estruturado em formato JSON e conter estritamente as referências estruturais do recurso, como o ID da ficha vinculada ou o link público da imagem original do arquivo de mídia.
* **RN_CNT04 – Clonagem de Ativo Global para Campanha:** O método `clonarParaSala` deve copiar um `Asset` do acervo pessoal do usuário para a biblioteca local de uma campanha específica. O sistema deve gerar um novo registro físico na tabela `Asset`, definindo o `usuario_id` como nulo e preenchendo o `sala_id` com o ID correspondente da sala receptora, protegendo o "molde" original contra alterações efetuadas em jogo.
* **RN_CNT05 – Edição Parcial de Ativo (Patch):** O método `editarAsset` deve permitir a alteração parcial de atributos do ativo (como nome, tipo de recurso e dados de referência). O sistema deve atualizar estritamente os campos fornecidos no JSON de entrada `dadosEditados`, mantendo os demais atributos anteriores intactos e intocados.
* **RN_CNT06 – Hierarquia de Pastas na Biblioteca:** O atributo `pai_id` (FK, Nullable) deve conter a autorreferência ao ID de outro `Asset` cujo `tipo_recurso` seja obrigatoriamente configurado como `PASTA`. Caso o atributo seja nulo, o item reside na raiz do diretório de biblioteca.
* **RN_CNT07 – Visibilidade Segura de Biblioteca (Fog of War de Segredos):** A listagem de ativos exibida dentro de uma sala de jogo deve passar por um filtro de segurança dinâmico baseado no ID do participante e seu respectivo papel. Participantes com papel de `MESTRE` visualizam a totalidade dos ativos locais da sala. Participantes com papel de `JOGADOR` só visualizam ativos locais cujos IDs de referência correspondam aos recursos explicitamente atribuídos a eles.

---

### 3.2. Mediação de Conteúdo e Serviços (AssetManager)
Regras que regem o comportamento da camada de serviço responsável por atuar como intermediária entre o banco de dados e as intenções dos usuários na mesa de jogo.

* **RN_CNT08 – Papel de Intermediação do AssetManager:** O `AssetManager` deve atuar como uma camada de serviço (Service) de lógica dedicada, sendo responsável por orquestrar a biblioteca e gerenciar a instanciação de recursos. Esta camada de serviço deve ser *Stateless* (sem estado próprio persistente), realizando as ações lógicas diretamente contra a camada de banco de dados.
* **RN_CNT09 – Importação de Modelos de Ficha:** O método `importarTemplate` do `AssetManager` deve receber o ID do Usuário, o ID da Sala e o ID do template para buscar o modelo global de ficha e disponibilizá-lo dentro do acervo local da campanha.
* **RN_CNT10 – Diferenciação Física entre Molde e Presença:** O sistema deve diferenciar rigidamente o "molde" (`Asset`) da "presença" (`Token`) no jogo. O `Asset` serve como o repositório estático de dados do objeto. O `Token` e a Ficha de Personagem (`CharacterSheet`) atuam como as instâncias vivas manipuladas em tempo real pelos jogadores.
* **RN_CNT11 – Instanciação de Tokens via AssetManager:** O método `instanciarPersonagemNoMapa` do `AssetManager` deve receber os parâmetros `assetID`, `cenaID` e as coordenadas espaciais `x` e `y`. O método deve buscar o preset de NPC da biblioteca da sala (`NPC_PRESET`), recuperar a sua imagem padrão e sua ficha de regras associada e criar um novo registro leve na tabela `Token` posicionado na cena correspondente.
* **RN_CNT12 – Organização e Agrupamento:** O método `organizarBiblioteca` do `AssetManager` deve receber filtros de tipo ou ID de pastas para classificar e retornar os ativos agrupados, simplificando a renderização dinâmica de abas e painéis no front-end em Angular/Vue.

---

### 3.3. Instanciação e Sincronização de Objetos em Cena (Tokens)
Regras de validação técnica aplicadas às instâncias visuais renderizadas no motor gráfico (Pixi.js) que se conectam ao ecossistema de fichas.

* **RN_CNT13 – Deleção Segura de Instâncias (Integridade de Molde):** A remoção física ou exclusão de um `Token` de cena ativa do tabuleiro não deve, sob nenhuma circunstância, alterar, corromper ou excluir o `Asset` de origem (`asset_origem_id`) registrado na biblioteca local da sala.
* **RN_CNT14 – Vínculo de Origem Obrigatório:** Todo `Token` gerado deve possuir obrigatoriamente um atributo `asset_origem_id` (FK) que aponte para o ID do asset original que serviu de molde. Isso garante que atualizações efetuadas na imagem ou nas propriedades do molde na biblioteca possam ser propagadas automaticamente para todas as suas cópias ativas na cena.
* **RN_CNT15 – Vinculação Opcional de Ficha ao Token:** O `Token` pode opcionalmente conter um atributo `personagem_id` (FK, Nullable) que aponta para uma ficha de personagem ativa. Se o campo estiver preenchido, o token atua como um espelho de uma ficha viva (`CharacterSheet`). Se o campo estiver nulo, o token representa um objeto de cenário estático ou decorativo sem ficha de regras associada.
* **RN_CNT16 – Mapeamento de Status sobre o Token:** O `Token` deve possuir o atributo `status_bar_map` (JSON) que armazena as chaves de variáveis lógicas da ficha de personagem (como HP e Mana) que devem ser exibidas visualmente na forma de pequenas barras de progresso sobre o token no tabuleiro.
* **RN_CNT17 – Sincronização Dinâmica (Ponte Token-Ficha):** Sempre que um valor numérico monitorado pelo `status_bar_map` sofrer alteração na `CharacterSheet` de um personagem, o método `sincronizarComFicha` deve ser disparado no back-end para atualizar em tempo real as barras de status gráficas renderizadas sobre o respectivo `Token` via WebSocket.

---

## 4. Esfera do Tabletop e Ambiente de Jogo

Este núcleo normativo descreve de maneira detalhada e atômica as validações, restrições e comportamentos lógico-sistêmicos aplicados à **Esfera do Tabletop (Ambiente de Jogo)**. Ele regulamenta a inicialização do tabuleiro, o controle de cenas, a renderização matemática do grid, o gerenciamento de camadas (layers) para proteção do cenário e as validações espaciais e de permissão para movimentação de tokens em tempo real.

### 4.1. Inicialização e Controle do Tabuleiro (Tabletop)
Estas regras ditam as restrições lógicas aplicadas à mesa de jogo digital e à sua vinculação com a sessão ativa.

* **RN_TAB01 – Vínculo Exclusivo com Sala:** Cada `Tabuleiro` gerado deve possuir um vínculo obrigatório com exatamente uma única `Sala` por meio do atributo `sala_id`.
* **RN_TAB02 – Unicidade de Tabuleiro por Sala:** O sistema deve bloquear e impedir no banco de dados a existência de mais de um `Tabuleiro` ativo que compartilhe o mesmo `sala_id`.
* **RN_TAB03 – Registro de Cena Ativa:** O `Tabuleiro` deve armazenar o identificador da cena que está sendo atualmente renderizada para os participantes no atributo `cena_ativa_id`.
* **RN_TAB04 – Sincronização Obrigatória de Cena Ativa:** Ao alterar o valor do campo `cena_ativa_id` no `Tabuleiro`, o sistema deve disparar uma notificação automática via WebSocket para forçar todos os clientes conectados à sala a carregarem a respectiva cena.
* **RN_TAB05 – Configurações Globais do Tabuleiro:** O atributo `configuracoes_globais` (JSON) deve armazenar as propriedades gerais do ambiente físico da partida, como a métrica padrão de distância por célula e as permissões globais de uso de ferramentas de desenho para jogadores.
* **RN_TAB06 – Inicialização Sem Cena Ativa:** No momento do salvamento inicial do `Tabuleiro`, o atributo `cena_ativa_id` deve ser configurado obrigatoriamente como nulo (`null`), permanecendo assim até que o mestre crie e selecione a primeira cena ativa da campanha.

---

### 4.2. Configuração de Cenas, Grid e Câmera (Cena & Grid)
Validações de dados e de comportamento lógico aplicadas aos mapas individuais criados pelo mestre.

* **RN_TAB07 – Vínculo de Cena com Tabuleiro:** Cada `Cena` criada deve possuir vínculo obrigatório com um único `Tabuleiro` pai por meio da chave estrangeira `tabuleiro_id`.
* **RN_TAB08 – Atribuição de Nome da Cena:** O formulário de criação de cenas deve exigir o preenchimento obrigatório do campo correspondente ao nome do cenário.
* **RN_TAB09 – Upload de Imagem de Fundo (Background):** O método `uploadBackground` deve exigir o envio de uma URL ou caminho de arquivo de mídia válido para persistir no atributo `background_url` de uma `Cena`.
* **RN_TAB10 – Ordenação Decimal das Cenas:** O atributo `ordem` na tabela `Cena` deve ser armazenado como um número de ponto flutuante (`float`) para permitir que o mestre mude a ordem de uma cena arrastando-a entre outras duas sem a necessidade de atualizar o índice de ordenação de toda a lista no banco de dados.
* **RN_TAB11 – Visibilidade de Cenas para Jogadores:** Se o atributo `is_visible` de uma `Cena` estiver definido como falso (`false`), ela não deve ser listada ou acessível para participantes configurados com o papel de `JOGADOR`.
* **RN_TAB12 – Acesso Total de Cenas para o Mestre:** O participante com o papel de `MESTRE` possui permissão irrestrita para visualizar, listar e carregar qualquer `Cena` vinculada ao seu `Tabuleiro`, independentemente do valor de visibilidade contido em `is_visible`.
* **RN_TAB13 – Estrutura do Grid Config:** O atributo `grid_config` (JSON) de uma `Cena` deve obrigatoriamente armazenar as propriedades de tamanho da célula (em pixels), cor da grade de coordenadas, nível de opacidade das linhas e estado de exibição (visível ou invisível).
* **RN_TAB14 – Câmera Dinâmica (Zoom e Pan):** A aplicação no front-end (Angular/Vue) deve monitorar e aplicar de forma local as preferências individuais de escala (Zoom) e deslocamento (Pan) da câmera do usuário sobre o cenário, evitando o tráfego de dados de visualização pessoal via WebSocket.

---

### 4.3. Organização e Permissão por Camadas (Layers)
Regras aplicadas à proteção de imagens de cenário e à correta sobreposição visual de objetos no motor gráfico.

* **RN_TAB15 – Estrutura de Camadas Baseada em JSON:** O atributo `layers` (JSON) de uma `Cena` deve registrar os elementos gráficos ordenados sob três chaves lógicas principais: `fundo` (background), `objetos` estáticos (elementos decorativos de mapa) e `tokens` ativos.
* **RN_TAB16 – Ordem de Renderização (Z-Index):** O motor gráfico em HTML5 (Pixi.js) deve renderizar os elementos visuais na tela respeitando estritamente a ordem de sobreposição das camadas registradas no JSON `layers`, posicionando `"fundo"` na base, `"objetos"` sobre o fundo e `"tokens"` no topo do cenário.
* **RN_TAB17 – Bloqueio de Seleção de Elementos Decorativos:** O sistema deve bloquear e ignorar qualquer tentativa de clique, seleção ou arraste por parte de jogadores comuns sobre elementos gráficos posicionados nas chaves de `"fundo"` ou `"objetos"` da cena.
* **RN_TAB18 – Edição Exclusiva de Camadas Decorativas pelo Mestre:** Apenas participantes com o papel de `MESTRE` possuem privilégios no sistema para interagir com as chaves de `"fundo"` ou `"objetos"` da camada para posicionar novos itens decorativos, trocar imagens de mapa ou reorganizar o cenário ativo.

---

### 4.4. Instanciação e Gestão de Tokens (Tokens)
Regras que validam as instâncias de jogo leves que representam personagens e presets visuais no tabuleiro.

* **RN_TAB19 – Vínculo de Token com Cena:** Cada instância física de um `Token` criada no tabuleiro deve possuir vínculo obrigatório e estrito com uma única `Cena` ativa.
* **RN_TAB20 – Vinculação do Token com Ativo de Origem:** Todo `Token` deve conter o atributo `asset_origem_id` (FK) apontando para um ID válido na tabela `Asset`, garantindo que alterações feitas na imagem padrão do ativo na biblioteca local sejam refletidas automaticamente no tabuleiro.
* **RN_TAB21 – Vinculação Opcional de Ficha de Personagem:** O `Token` pode opcionalmente apontar para uma ficha de personagem viva via atributo `personagem_id` (FK, Nullable). Se o campo for nulo, o token é considerado um mero objeto estático ou decorativo sem ficha de atributos associada.
* **RN_TAB22 – Mapeamento de Barras de Status:** O atributo `status_bar_map` (JSON) do `Token` deve registrar a correspondência entre as pequenas barras visuais renderizadas sobre o sprite e variáveis numéricas da `CharacterSheet` (como HP e Mana).
* **RN_TAB23 – Sincronização Dinâmica Atributo-Token:** Toda vez que um valor associado ao `status_bar_map` sofrer alteração na `CharacterSheet`, o sistema deve emitir um evento de atualização do token para todos os usuários em tempo real via WebSocket.
* **RN_TAB24 – Independência de Exclusão de Token:** A exclusão física ou remoção de um `Token` da cena ativa do tabuleiro não deve, sob nenhuma circunstância, alterar, corromper ou deletar o ativo molde (`Asset`) original salvo na biblioteca de recursos.
* **RN_TAB25 – Preservação de Ficha de Personagem na Deleção:** A remoção de um `Token` do tabuleiro não deve alterar ou excluir a ficha de personagem (`CharacterSheet`) vinculada a ele no banco de dados.

---

### 4.5. Sincronização de Movimentação e Validação de Coordenadas (Movement & Sync)
Regras matemáticas e lógicas aplicadas à movimentação em tempo real via drag-and-drop sobre a malha de pixels.

* **RN_TAB26 – Interceptação de Movimentação (solicitarMovimentacao):** Toda movimentação efetuada na interface gráfica do tabuleiro deve disparar obrigatoriamente uma requisição para o método `solicitarMovimentacao` na `Cena` correspondente para validação lógica no back-end antes de alterar qualquer registro no banco de dados.
* **RN_TAB27 – Controle de Permissão de Movimentação para Jogadores:** Um participante com o papel de `JOGADOR` só terá sua requisição de movimentação autorizada no método `solicitarMovimentacao` se o seu ID de usuário logado corresponder exatamente ao `proprietario_id` da `CharacterSheet` vinculada ao respectivo `Token`.
* **RN_TAB28 – Permissão de Movimentação Irrestrita para o Mestre:** O participante com o papel de `MESTRE` possui permissão irrestrita no sistema de movimentação, podendo alterar as coordenadas de qualquer `Token` presente na cena ativa.
* **RN_TAB29 – Snap to Grid Matemático:** Se a grade estiver ativa no `grid_config` da `Cena`, o método de movimentação no back-end deve calcular a posição final do token arredondando as coordenadas brutas `x,y` enviadas pelo cliente para que o token "grude" perfeitamente no centro do quadrante da célula mais próxima.
* **RN_TAB30 – Validação de Limites Físicos da Cena:** O método `solicitarMovimentacao` deve rejeitar tentativas de posicionamento que desloquem o `Token` para fora das dimensões limite da imagem de fundo cadastrada em `background_url`.
* **RN_TAB31 – Persistência Atômica de Coordenadas:** Ao aprovar o movimento, as novas coordenadas `pos_x` e `pos_y` devem ser salvas de forma atômica na tabela de tokens, e o sistema de sincronização deve gerar um arquivo contendo as coordenadas atualizadas em formato JSON.
* **RN_TAB32 – Broadcast em Tempo Real de Coordenadas (Socket.io):** Imediatamente após a gravação com sucesso das novas coordenadas do token, o servidor Node.js deve emitir uma notificação de broadcast para a Room daquela sala, sincronizando a posição de forma fluida e em tempo real na tela de todos os usuários conectados.
* **RN_TAB33 – Sincronização de Entrada Tardia:** Ao detectar a conexão de um usuário via Socket.io no tabuleiro, o sistema deve executar automaticamente o método `sincronizarEstado`, transmitindo a cena ativa no `cena_ativa_id` do tabuleiro, as imagens de fundo e as coordenadas atuais de todos os tokens.

---

## 5. Engine de Fichas (SheetEngine)

Este núcleo normativo detalha as validações, restrições e comportamentos lógico-sistêmicos aplicados ao **SheetEngine**. Alinhado com a decisão estratégica de simplificar o escopo técnico do projeto, as regras abaixo desconsideram coordenadas de grid ou posicionamento dinâmico visual. O foco está na **validação, reatividade e integridade matemática de um modelo de ficha genérica expansível e customizável estruturado via banco de dados MySQL com suporte a JSON.**

### 5.1. Estruturação e Validação de Modelos (Templates)
Estas regras ditam as restrições lógicas aplicadas à criação e estruturação de moldes de ficha pelo mestre, assegurando a universalidade do sistema sem modificação física no esquema SQL do banco de dados.

* **RN_SHT01 – Dependência de Modelo de Ficha:** Toda instância de `CharacterSheet` criada no banco de dados deve obrigatoriamente referenciar e pertencer a um modelo de estrutura definido na tabela `SheetTemplate` via chave estrangeira `template_id`.
* **RN_SHT02 – Estrutura Padronizada de Seções (Campos Schema):** O objeto JSON contido no atributo `campos_schema` do `SheetTemplate` deve ser estruturado obrigatoriamente sob 4 (quatro) chaves lógicas fixas de seções:
    1. `cabecalho`: Dados puramente textuais e informativos do personagem (ex: Nome, Classe, Tendência).
    2. `atributos`: Lista de características numéricas básicas que servem de base para o sistema de jogo (ex: Força, Destreza).
    3. `recursos`: Atributos voláteis que possuem um valor "atual" e um valor "máximo" de progresso (ex: Pontos de Vida, Pontos de Mana).
    4. `pericias`: Habilidades secundárias vinculadas a um atributo básico para fins de cálculo de modificadores.
* **RN_SHT03 – Validação de Integridade do Schema:** O método `validarEstrutura` do `SheetTemplate` deve verificar se o JSON do `campos_schema` obedece rigorosamente à tipagem e chaves obrigatórias de cada seção padrão antes de autorizar qualquer operação de salvamento ou alteração.
* **RN_SHT04 – Customização de Rótulos (Labels):** O sistema deve permitir que o mestre altere livremente a propriedade visual `label` de qualquer campo dentro do JSON `campos_schema` (ex: renomear o rótulo do atributo padrão "Força" para "Poder", ou a perícia padrão "Atletismo" para "Esportes") sem corromper o identificador lógico interno (`id`) do campo.
* **RN_SHT05 – Inserção Dinâmica em Listas Estruturadas:** O mestre possui permissão para adicionar novas linhas em listas dinâmicas de perícias, habilidades ou itens de inventário no `campos_schema`. Cada nova linha adicionada deve herdar a tipagem e as regras de reatividade configuradas para a respectiva seção pai.
* **RN_SHT06 – Bloqueio de Metadados Visuais de Grade:** O método `validarEstrutura` deve ignorar, remover ou rejeitar qualquer propriedade de coordenadas físicas ou bidimensionais (`x`, `y`, `cols`, `rows`) enviada no payload do front-end. Isso garante que a renderização da ficha no Angular/Vue siga estritamente o layout sequencial responsivo padrão determinado pelo sistema.

---

### 5.2. Motor de Fórmulas e Recálculo Reativo
Regras que regem o processamento matemático das fichas, garantindo que o motor de regras processe as dependências de valores de forma automatizada e livre de erros.

* **RN_SHT07 – Declaração de Fórmulas Matemáticas:** O `campos_schema` pode conter strings de equações matemáticas vinculadas a atributos modificadores ou derivados (ex: o campo "Modificador de Força" contendo a fórmula `floor((@forca - 10) / 2)`).
* **RN_SHT08 – Bloqueio de Referência Circular:** O validador do `SheetTemplate` deve analisar recursivamente as strings de fórmulas matemáticas antes do salvamento. O sistema deve bloquear e retornar um erro descritivo caso seja detectada uma dependência circular direta ou indireta (ex: Campo A que depende de uma fórmula baseada no Campo B, que por sua vez possui uma fórmula baseada no Campo A).
* **RN_SHT09 – Resolução Dinâmica de Variáveis (@):** Ao processar uma fórmula matemática, a engine do sistema deve analisar a string e substituir todo caractere especial `@` seguido do identificador único de um atributo pelo valor numérico atualizado correspondente obtido no JSON `dados_preenchidos` do personagem (ex: a expressão `@forca` é convertida no valor `15` para o cálculo).
* **RN_SHT10 – Gatilho de Recálculo em Cascata (Reatividade):** Sempre que o método `atualizarValor` for invocado para alterar o valor bruto de um campo na tabela `CharacterSheet`, o sistema deve mapear os campos dependentes daquela variável e reexecutar de forma atômica e em memória as respectivas equações matemáticas antes de persistir a atualização.
* **RN_SHT11 – Tratamento Sanitário de Nulos e Falhas:** Se o motor de cálculo encontrar um atributo com valor nulo, indefinido ou inválido ao resolver uma fórmula, o sistema deve tratar a variável correspondente como `0` (zero) por padrão, prevenindo a quebra de execução do script e travamentos de interface na tela do usuário.

---

### 5.3. Controle de Acesso e Permissões da Ficha (RBAC)
Validações de privilégios de leitura e escrita aplicadas aos dados lógicos das fichas dentro de uma sala.

* **RN_SHT12 – Propriedade de Escrita para Jogadores:** Um participante com papel de `JOGADOR` só tem a execução do método `atualizarValor` autorizada pelo back-end se o seu ID de participante ativo na sala corresponder de forma idêntica ao campo `participante_id` registrado na respectiva `CharacterSheet`.
* **RN_SHT13 – Controle Irrestrito para o Mestre:** Um participante com papel de `MESTRE` possui autorização irrestrita no back-end para ler, modificar valores de atributos, alterar dados e invocar o método `atualizarValor` sobre qualquer `CharacterSheet` ativa vinculada à sua sala de jogo.
* **RN_SHT14 – Mapeamento de Visibilidade de Atributos:** O JSON `campos_schema` do `SheetTemplate` deve armazenar as permissões de visibilidade detalhada de cada campo de recurso para os participantes com papel de `JOGADOR` (ex: configurar se o jogador visualiza o valor numérico exato de vida atual de um NPC inimigo ou apenas a proporção de preenchimento da barra visual).

---

### 5.4. Integração com Tabuleiro e Comunicação (Ponte de Status)
Regras que garantem que as atualizações na ficha física se comuniquem em tempo real com o motor visual (Pixi.js) e o processador de dados (DiceRoller).

* **RN_SHT15 – Sincronização Automática com Token (status_bar_map):** Sempre que os campos "atual" ou "máximo" de um Recurso (como HP ou Mana) mapeados no `status_bar_map` do Token sofrerem alteração através do método `atualizarValor` na `CharacterSheet`, o sistema deve recalcular a proporção de preenchimento e disparar um broadcast em tempo real via WebSocket para atualizar as barras renderizadas sobre o Token no tabuleiro de todos os clientes.
* **RN_SHT16 – Integração Ficha-DiceRoller (Rolagem de Atributos):** Ao clicar em um botão de rolagem associado a um atributo ou perícia na ficha, a aplicação cliente deve recuperar o modificador numérico calculado atualizado da ficha e enviá-lo de forma integrada para o método `rolarComAtributo` do `DiceRoller`, gerando um registro automático de histórico no chat da sala (`MessageLog` do tipo `DICE_ROLL`).

---

## 6. Comunicação e Motor de Dados

Este núcleo normativo descreve as validações, restrições e comportamentos lógico-sistêmicos aplicados ao **DiceRoller (Helper)** e ao gerenciamento de dados de comunicação (**MessageLog**) em tempo real.

### 6.1. Motor de Rolagem de Dados (DiceRoller - Parser e Simulação)
Estas regras ditam as restrições lógicas aplicadas à interpretação de strings de comando e à execução da aleatoriedade, garantindo a integridade e a segurança matemática de cada teste em jogo.

* **RN_COM01 – Processamento Exclusivo no Backend (Anti-Cheat):** Todas as simulações e rolagens de dados que alterem ou influenciem o estado de uma partida devem ser geradas e processadas de forma exclusiva no servidor (back-end), impedindo que o cliente (front-end) envie resultados numéricos pré-calculados.
* **RN_COM02 – Validação da Expressão de Dados:** O método `rolar` deve receber uma string e validar se ela atende estritamente à notação matemática padrão de dados (padrão `[quantidade]d[faces]`, opcionalmente seguido de modificadores como `+` ou `-` e constantes). Expressões inválidas devem disparar um erro e interromper a execução da ação.
* **RN_COM03 – Limite de Volume de Dados por Rolagem:** O parser do `DiceRoller` deve rejeitar e bloquear qualquer tentativa de rolagem contendo uma quantidade de dados individual superior a 100 (cem) em uma única expressão, prevenindo travamentos ou loops excessivos de memória no servidor Node.js.
* **RN_COM04 – Limite do Tipo de Dados (Faces):** O sistema deve aceitar e processar apenas rolagens para dados cujas faces sejam números inteiros positivos iguais ou superiores a 2 (dois) e inferiores ou iguais a 1000 (mil).
* **RN_COM05 – Simulação Individualizada de Múltiplos Dados:** Ao processar expressões com múltiplos dados (ex: `3d6`), o algoritmo do back-end deve simular o lançamento físico gerando três números aleatórios independentes, em vez de realizar apenas uma rolagem única e multiplicar o resultado por três.
* **RN_COM06 – Algoritmo de Geração Aleatória Segura:** A simulação estatística das faces dos dados deve utilizar geradores de números pseudo-aleatórios de alta entropia do sistema operacional, garantindo distribuição uniforme e justa para valores entre 1 e o limite de faces configurado.
* **RN_COM07 – Captura Analítica de Resultados (resultado_detalhado):** O sistema deve armazenar e registrar individualmente o resultado bruto gerado de cada dado lançado em uma lista dentro do campo `resultado_detalhado` (JSON) na tabela de histórico.
* **RN_COM08 – Resolução de Modificadores Estáticos:** O processador aritmético do `DiceRoller` deve capturar quaisquer constantes de modificação estática descritas na expressão (ex: `+ 5`, `- 3`) e aplicá-las ao somatório geral de forma correspondente.
* **RN_COM09 – Resolução Dinâmica de Atributos da Ficha (@):** Ao acionar o método `rolarComAtributo`, a engine deve varrer a expressão enviada, localizar todos os marcadores de variáveis precedidos pelo caractere `@` (ex: `@forca`), consultar o JSON `dados_preenchidos` da ficha vinculada, extrair o modificador atual e substituí-lo na equação aritmética antes da execução final.
* **RN_COM10 – Higienização de Variáveis Ausentes ou Inválidas:** Se o marcador de variável `@` não for encontrado nos dados do personagem ou possuir formato de valor não numérico, o parser deve substituí-lo por `0` (zero) de forma silenciosa para prosseguir com o cálculo matemático e registrar um aviso analítico no JSON de resposta.
* **RN_COM11 – Aritmética de Cálculo do Valor Total:** O atributo `total` de uma rolagem deve ser composto de forma exata pela soma de todos os resultados individuais de dados lançados (`resultado_detalhado`), adicionada ou subtraída de todos os modificadores fixos e variáveis (`@`) resolvidos.

---

### 6.2. Chat e Registro de Histórico (MessageLog)
Regras aplicadas à persistência das interações de texto e dos registros analíticos das partidas no banco de dados MySQL.

* **RN_COM12 – Vinculação Estrita de Sala para Logs:** Todo registro criado na tabela `MessageLog` deve conter obrigatoriamente um identificador válido e existente que aponte para `sala_id`, impedindo o armazenamento de mensagens sem contexto espacial.
* **RN_COM13 – Identificação de Participante Ativo:** O atributo `emissor_id` deve referenciar obrigatoriamente um ID válido na tabela `Participante` sob o mesmo `sala_id`, garantindo que apenas membros associados àquela partida possam registrar conteúdo.
* **RN_COM14 – Restrição de Tipagem de Log (Enum):** O atributo `tipo` do log deve aceitar estritamente um dos seguintes valores enumerados: `CHAT` (mensagens de texto), `DICE_ROLL` (rolagens de dados) ou `SYSTEM` (mensagens automáticas de fluxo da mesa).
* **RN_COM15 – Sanitização contra Injeção de Código (XSS):** O campo `conteudo` de mensagens de tipo `CHAT` deve passar obrigatoriamente por um processo de sanitização de strings no back-end, limpando tags HTML, inline scripts ou trechos de código executável antes do salvamento.
* **RN_COM16 – Limitação Física de Comprimento de Mensagem:** O campo `conteudo` para mensagens do tipo `CHAT` deve possuir comprimento máximo de 1000 (mil) caracteres. O sistema deve rejeitar o salvamento de qualquer string que exceda este limite.
* **RN_COM17 – Bloqueio de Envios Vazios:** O back-end deve rejeitar a gravação de registros de `MessageLog` cujo campo `conteudo` seja nulo, vazio ou composto exclusivamente por espaços em branco.
* **RN_COM18 – Registro de Carimbo de Tempo Automático:** No momento em que qualquer mensagem for gravada no banco de dados, o sistema deve capturar a data e hora do servidor de forma automática e registrá-la no campo correspondente.
* **RN_COM19 – Geração Automática de Logs de Sistema (SYSTEM):** Eventos táticos relevantes da mesa (ex: entrada de novo membro na sala, mudança de cena ativa pelo mestre ou início/fim de combates) devem gerar automaticamente um novo registro do tipo `SYSTEM` com mensagem descritiva padronizada.
* **RN_COM20 – Geração Automática de Histórico de Dados (DICE_ROLL):** Toda rolagem processada com sucesso pelo helper `DiceRoller` deve gerar de forma automática um registro na tabela `MessageLog` com o tipo configurado estritamente como `DICE_ROLL`.
* **RN_COM21 – Metadados Obrigatórios da Rolagem (metadata):** O campo `metadata` (JSON) de mensagens do tipo `DICE_ROLL` deve ser preenchido de forma automática com o payload gerado pelo `DiceRoller`, armazenando a string da expressão original, o total do resultado obtido e os valores brutos individuais do `resultado_detalhado`.

---

### 6.3. Sincronização em Tempo Real via WebSockets
Definições de rede e segurança lógica para a distribuição dinâmica de dados em tempo real a todos os membros conectados.

* **RN_COM22 – Broadcast de Mensagens em Tempo Real:** Ao gravar com sucesso qualquer registro na tabela `MessageLog`, o servidor Node.js deve disparar imediatamente um evento de WebSocket contendo o objeto JSON do log completo para a Room do Socket.io correspondente.
* **RN_COM23 – Isolamento e Distribuição Segura:** O servidor WebSocket deve garantir que mensagens emitidas sob o canal de uma Sala (Room do Socket.io) sejam enviadas estritamente para os clientes conectados sob o respectivo `sala_id` da sala, blindando as comunicações contra vazamentos a outras sessões ativas.
* **RN_COM24 – Paginação do Histórico de Entrada Tardia:** Ao carregar a interface da sala para um usuário recém-conectado, o back-end deve recuperar do banco e enviar via WebSocket apenas os últimos 50 (cinquenta) logs salvos em `MessageLog`, para economizar largura de banda e acelerar a renderização do front-end no Angular/Vue.
* **RN_COM25 – Recuperação Sob Demanda (Infinite Scroll):** O back-end deve disponibilizar um endpoint HTTP GET ou evento WebSocket que permita recuperar logs anteriores em lotes de 50 mensagens, ordenados de forma descendente por data de envio.
* **RN_COM26 – Tratamento de Rolagem Oculta do Mestre (Secret Roll):** Caso o participante com papel de `MESTRE` execute uma rolagem com configuração de visibilidade definida como privada (secreta), o sistema deve registrar o log normalmente, mas enviar os dados completos de `metadata` (dados individuais e modificadores) via Socket.io estritamente para a conexão do mestre. Os jogadores comuns na sala devem receber apenas um log indicando que *"O Mestre realizou uma rolagem secreta"*, ocultando os valores analíticos do JSON.
