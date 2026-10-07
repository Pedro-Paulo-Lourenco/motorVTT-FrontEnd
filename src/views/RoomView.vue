<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { z } from 'zod';
import { io, type Socket } from 'socket.io-client';
import {
  MessageType,
  apiErrorResponseSchema,
  apiSuccessSchema,
  boardSchema,
  participantSchema,
  roomSchema,
  sceneSchema,
  type Participant,
  type Room,
} from '@motor-vtt/contracts';
import api from '@/services/api.ts';
import { useAuthStore } from '@/stores/auth.ts';
import { resolveTabletopSocketOrigin } from '@/tabletop/connection';
import {
  DEMO_GRID_DEFAULTS,
  joinRoomPayloadSchema,
  operationAckSchema,
  presencePayloadSchema,
  socketErrorSchema,
  tabletopStateSchema,
  tokenAddedPayloadSchema,
  tokenMovedPayloadSchema,
  tokenRemovedPayloadSchema,
  tokenCreatePayloadSchema,
  tokenMoveRequestSchema,
  tokenRemoveRequestSchema,
  diceRollResultSchema,
  messageCreatedPayloadSchema,
  messageSendPayloadSchema,
  messagesPayloadSchema,
  type DiceRollResult,
  type TabletopMessage,
  type TabletopToken,
} from '@/tabletop/protocol';

const MAX_CHAT_MESSAGES = 50;
const TabletopCanvas = defineAsyncComponent(() => import('@/components/TabletopCanvas.vue'));
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const room = ref<Room | null>(null);
const participants = ref<Participant[]>([]);
const board = ref<ReturnType<typeof boardSchema.parse> | null>(null);
const scene = ref<ReturnType<typeof sceneSchema.parse> | null>(null);
const tokens = ref<TabletopToken[]>([]);
const roomMessages = ref<TabletopMessage[]>([]);
const chatDraft = ref('');
const isSendingMessage = ref(false);
const onlineUserIds = ref<string[]>([]);
const selectedTokenId = ref<string | null>(null);
const tokenName = ref('');
const isLoading = ref(true);
const isConnected = ref(false);
const isRoomReady = ref(false);
const errorMessage = ref('');
const connectionMessage = ref('');
const operationMessage = ref('');
let latestRequest = 0;
let tabletopSocket: Socket | undefined;
let refreshInProgress: Promise<void> | undefined;
let isDisposed = false;
let refreshedAfterAuthError = false;

const currentParticipant = computed(() =>
  participants.value.find((participant) => participant.usuarioId === authStore.user?.id),
);
const isMaster = computed(() => currentParticipant.value?.papel === 'MESTRE');
const canEdit = computed(() => isMaster.value && isRoomReady.value);
const selectedToken = computed(() =>
  tokens.value.find((token) => token.id === selectedTokenId.value) ?? null,
);
const gridConfig = computed(() => scene.value?.gridConfig ?? DEMO_GRID_DEFAULTS);

function refreshSocketSession(socket: Socket): void {
  if (refreshInProgress || refreshedAfterAuthError || isDisposed) return;
  refreshedAfterAuthError = true;
  refreshInProgress = api.post('/auth/refresh')
    .then(() => {
      if (!isDisposed && tabletopSocket === socket) socket.connect();
    })
    .catch(() => {
      if (isDisposed || tabletopSocket !== socket) return;
      connectionMessage.value = 'Sua sessão expirou. Entre novamente para continuar.';
      authStore.clearSession();
      void router.replace('/login');
    })
    .finally(() => {
      refreshInProgress = undefined;
    });
}

function getRoomErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const parsed = apiErrorResponseSchema.safeParse(error.response?.data);
    const code = parsed.success ? parsed.data.error.code : undefined;
    if (code === 'ROOM_NOT_FOUND' || error.response?.status === 404) {
      return 'Sala não encontrada ou você não tem acesso a ela.';
    }
    if (error.response?.status === 401) {
      return 'Sua sessão expirou. Entre novamente para continuar.';
    }
    if (error.response?.status === 403) {
      return 'Você não tem acesso a esta sala.';
    }
  }
  return 'Não foi possível carregar esta sala. Tente novamente.';
}

function showSocketError(payload: unknown): void {
  const parsed = socketErrorSchema.safeParse(payload);
  if (!parsed.success) {
    operationMessage.value = 'O servidor retornou um erro de tabletop inválido.';
    return;
  }
  operationMessage.value = parsed.data.message;
  if (parsed.data.code === 'AUTH_REQUIRED' && tabletopSocket) {
    refreshSocketSession(tabletopSocket);
  }
}

function applyToken(token: TabletopToken): void {
  if (token.cenaId !== scene.value?.id) return;
  const existingIndex = tokens.value.findIndex((entry) => entry.id === token.id);
  if (existingIndex === -1) {
    tokens.value = [...tokens.value, token];
  } else {
    tokens.value = tokens.value.map((entry) => entry.id === token.id ? token : entry);
  }
}

function appendRoomMessage(message: TabletopMessage): void {
  if (message.salaId !== room.value?.id) return;
  if (roomMessages.value.some((existing) => existing.id === message.id)) return;
  roomMessages.value = [...roomMessages.value, message].slice(-MAX_CHAT_MESSAGES);
}

function joinSocketRoom(socket: Socket, roomId: string): void {
  const payload = joinRoomPayloadSchema.safeParse({ v: 1, roomId });
  if (!payload.success) {
    connectionMessage.value = 'O identificador da sala não é válido.';
    return;
  }
  socket.emit('tabletop:v1:join', payload.data, (response: unknown) => {
    const parsed = operationAckSchema.safeParse(response);
    if (!parsed.success) {
      connectionMessage.value = 'Resposta inválida ao entrar no tabletop.';
      return;
    }
    if (!parsed.data.ok) {
      showSocketError(parsed.data.error);
      return;
    }
    isRoomReady.value = true;
    connectionMessage.value = '';
  });
}

function configureSocket(roomId: string): void {
  tabletopSocket?.removeAllListeners();
  tabletopSocket?.disconnect();
  tabletopSocket = undefined;
  isConnected.value = false;
  isRoomReady.value = false;
  onlineUserIds.value = [];
  operationMessage.value = '';
  connectionMessage.value = '';

  const socket = io(resolveTabletopSocketOrigin(import.meta.env.VITE_API_URL, window.location.origin), {
    autoConnect: false,
    withCredentials: true,
  });
  tabletopSocket = socket;

  socket.on('connect', () => {
    isConnected.value = true;
    refreshedAfterAuthError = false;
    joinSocketRoom(socket, roomId);
  });

  socket.on('connect_error', (error: Error) => {
    isConnected.value = false;
    if (error.message === 'UNAUTHORIZED' && !refreshedAfterAuthError) {
      refreshSocketSession(socket);
      return;
    }
    connectionMessage.value = error.message === 'UNAUTHORIZED'
      ? 'Não foi possível autenticar a conexão tabletop.'
      : 'Não foi possível conectar ao tabletop. Verifique se o backend está ativo.';
  });

  socket.on('disconnect', () => {
    isConnected.value = false;
    isRoomReady.value = false;
    onlineUserIds.value = [];
  });

  socket.on('tabletop:v1:state', (payload: unknown) => {
    const parsed = tabletopStateSchema.safeParse(payload);
    if (!parsed.success || parsed.data.roomId !== roomId) {
      connectionMessage.value = 'O servidor enviou um estado tabletop inválido.';
      return;
    }
    board.value = parsed.data.board;
    scene.value = parsed.data.scene;
    tokens.value = parsed.data.tokens;
    selectedTokenId.value = null;
    connectionMessage.value = '';
  });

  socket.on('tabletop:v1:presence', (payload: unknown) => {
    const parsed = presencePayloadSchema.safeParse(payload);
    if (!parsed.success || parsed.data.roomId !== roomId) return;
    onlineUserIds.value = [...new Set(parsed.data.onlineUserIds)];
  });

  socket.on('tabletop:v1:messages', (payload: unknown) => {
    const parsed = messagesPayloadSchema.safeParse(payload);
    if (!parsed.success || parsed.data.roomId !== roomId) {
      showSocketError({ v: 1, code: 'INVALID_PAYLOAD', message: 'Histórico de mensagens inválido.' });
      return;
    }
    roomMessages.value = parsed.data.messages.slice(-MAX_CHAT_MESSAGES);
  });

  socket.on('tabletop:v1:message:created', (payload: unknown) => {
    const parsed = messageCreatedPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      showSocketError({ v: 1, code: 'INVALID_PAYLOAD', message: 'Mensagem recebida inválida.' });
      return;
    }
    appendRoomMessage(parsed.data.message);
  });

  socket.on('tabletop:v1:token:added', (payload: unknown) => {
    const parsed = tokenAddedPayloadSchema.safeParse(payload);
    if (parsed.success) applyToken(parsed.data.token);
    else showSocketError({ v: 1, code: 'INVALID_PAYLOAD', message: 'Evento de token inválido.' });
  });

  socket.on('tabletop:v1:token:moved', (payload: unknown) => {
    const parsed = tokenMovedPayloadSchema.safeParse(payload);
    if (parsed.success) applyToken(parsed.data.token);
    else showSocketError({ v: 1, code: 'INVALID_PAYLOAD', message: 'Evento de movimento inválido.' });
  });

  socket.on('tabletop:v1:token:removed', (payload: unknown) => {
    const parsed = tokenRemovedPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      showSocketError({ v: 1, code: 'INVALID_PAYLOAD', message: 'Evento de remoção inválido.' });
      return;
    }
    if (parsed.data.sceneId !== scene.value?.id) return;
    tokens.value = tokens.value.filter((token) => token.id !== parsed.data.tokenId);
    if (selectedTokenId.value === parsed.data.tokenId) selectedTokenId.value = null;
  });

  socket.on('tabletop:v1:error', showSocketError);
  socket.connect();
}

async function loadRoom(id: unknown): Promise<void> {
  const requestId = ++latestRequest;
  tabletopSocket?.removeAllListeners();
  tabletopSocket?.disconnect();
  tabletopSocket = undefined;
  isConnected.value = false;
  isRoomReady.value = false;
  room.value = null;
  participants.value = [];
  board.value = null;
  scene.value = null;
  tokens.value = [];
  roomMessages.value = [];
  chatDraft.value = '';
  onlineUserIds.value = [];
  selectedTokenId.value = null;
  errorMessage.value = '';
  connectionMessage.value = '';

  if (typeof id !== 'string' || !id) {
    errorMessage.value = 'Identificador de sala inválido.';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    const response = await api.get(`/rooms/${encodeURIComponent(id)}`);
    const roomDetailsSchema = z.object({
      sala: roomSchema,
      participantes: participantSchema.array(),
    });
    const parsed = apiSuccessSchema(roomDetailsSchema).safeParse(response.data);
    if (!parsed.success) throw new Error('Resposta de sala inválida.');
    if (requestId !== latestRequest) return;
    room.value = parsed.data.data.sala;
    participants.value = parsed.data.data.participantes;

    if (!currentParticipant.value) {
      room.value = null;
      participants.value = [];
      errorMessage.value = 'Não foi possível confirmar sua participação nesta sala.';
      return;
    }
    configureSocket(id);
  } catch (error) {
    if (requestId === latestRequest) errorMessage.value = getRoomErrorMessage(error);
  } finally {
    if (requestId === latestRequest) isLoading.value = false;
  }
}

function emitOperation(eventName: string, payload: unknown): Promise<boolean> {
  const socket = tabletopSocket;
  if (!socket?.connected) {
    operationMessage.value = 'A conexão tabletop não está ativa.';
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    socket.timeout(5_000).emit(eventName, payload, (timeoutError: Error | null, response: unknown) => {
      if (timeoutError) {
        operationMessage.value = 'O servidor não confirmou a operação.';
        resolve(false);
        return;
      }
      const parsed = operationAckSchema.safeParse(response);
      if (!parsed.success) {
        operationMessage.value = 'O servidor retornou uma confirmação inválida.';
        resolve(false);
        return;
      }
      if (!parsed.data.ok) {
        showSocketError(parsed.data.error);
        resolve(false);
        return;
      }
      operationMessage.value = '';
      resolve(true);
    });
  });
}

async function addToken(): Promise<void> {
  if (!canEdit.value || !scene.value || !tokenName.value.trim()) return;
  const name = tokenName.value.trim().slice(0, 120);
  const token = tokenCreatePayloadSchema.safeParse({
    nome: name,
    x: 704 + (tokens.value.length % 5) * gridConfig.value.size,
    y: 640 + Math.floor(tokens.value.length / 5) * gridConfig.value.size,
    escala: 1,
  });
  if (!token.success) {
    operationMessage.value = 'Os dados do token não são válidos.';
    return;
  }
  const success = await emitOperation('tabletop:v1:token:add', {
    v: 1,
    token: token.data,
  });
  if (success) tokenName.value = '';
}

async function moveToken(move: { tokenId: string; x: number; y: number }): Promise<void> {
  if (!canEdit.value) return;
  const payload = { v: 1, ...move };
  if (!tokenMoveRequestSchema.safeParse(payload).success) {
    operationMessage.value = 'A posição do token não é válida.';
    return;
  }
  await emitOperation('tabletop:v1:token:move', payload);
}

async function removeSelectedToken(): Promise<void> {
  const tokenId = selectedTokenId.value;
  if (!canEdit.value || !tokenId) return;
  const payload = { v: 1, tokenId };
  if (!tokenRemoveRequestSchema.safeParse(payload).success) {
    operationMessage.value = 'O identificador do token não é válido.';
    return;
  }
  await emitOperation('tabletop:v1:token:remove', payload);
}

async function sendMessage(): Promise<void> {
  const content = chatDraft.value.trim();
  if (!content || !isRoomReady.value || isSendingMessage.value) return;
  const payload = messageSendPayloadSchema.safeParse({ v: 1, content });
  if (!payload.success) {
    operationMessage.value = 'A mensagem deve conter entre 1 e 1.000 caracteres.';
    return;
  }

  isSendingMessage.value = true;
  try {
    if (await emitOperation('tabletop:v1:message:send', payload.data) && chatDraft.value.trim() === content) {
      chatDraft.value = '';
    }
  } finally {
    isSendingMessage.value = false;
  }
}

function participantLabel(participant: Participant): string {
  if (participant.usuarioId === authStore.user?.id) return 'Você';
  if (participant.papel === 'MESTRE') return 'Mestre';
  const players = participants.value.filter((entry) => entry.papel === 'JOGADOR');
  return `Jogador ${players.indexOf(participant) + 1}`;
}

function messageAuthorLabel(userId: string): string {
  const participant = participants.value.find((entry) => entry.usuarioId === userId);
  if (!participant) return 'Participante';
  if (participant.usuarioId === authStore.user?.id) return 'Você';
  return participant.papel === 'MESTRE'
    ? 'Mestre'
    : `Jogador ${participants.value.filter((entry) => entry.papel === 'JOGADOR').indexOf(participant) + 1}`;
}

function messageRoll(message: TabletopMessage): DiceRollResult | null {
  if (message.tipo !== MessageType.ROLAGEM) return null;
  const result = diceRollResultSchema.safeParse(message.metadata?.roll);
  return result.success ? result.data : null;
}

function formatRollValues(repetition: DiceRollResult['repetitions'][number]): string {
  return repetition.displayRolls.map((value, index) => {
    const modifiedValue = repetition.displayModifiedRolls[index];
    return modifiedValue === undefined || modifiedValue === value
      ? String(value)
      : `${value} (${modifiedValue})`;
  }).join(', ');
}

function formatDieChain(die: DiceRollResult['repetitions'][number]['dice'][number]): string {
  return die.rolls.map((value, index) => {
    const modifiedValue = die.modifiedRolls[index];
    return modifiedValue === undefined || modifiedValue === value
      ? String(value)
      : `${value} (${modifiedValue})`;
  }).join(' + ');
}

function formatMessageTime(message: TabletopMessage): string {
  return new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

watch(
  () => route.params.id,
  (id) => void loadRoom(id),
  { immediate: true },
);

onBeforeUnmount(() => {
  isDisposed = true;
  tabletopSocket?.removeAllListeners();
  tabletopSocket?.disconnect();
  tabletopSocket = undefined;
});
</script>

<template>
  <main class="tabletop-page">
    <header class="tabletop-header">
      <div class="title-group">
        <button class="back-button" type="button" @click="router.push('/home')">
          ‹ Salas
        </button>
        <div>
          <p class="eyebrow">{{ board?.nome ?? 'Motor VTT Universal' }}</p>
          <h1>{{ room?.nome ?? 'Tabletop' }}</h1>
        </div>
      </div>
      <div class="session-badges">
        <span v-if="currentParticipant" class="role-badge">
          {{ isMaster ? 'Mestre' : 'Jogador' }}
        </span>
        <span class="connection-badge" :class="{ connected: isRoomReady }">
          <span class="connection-dot" />
          {{ isRoomReady ? 'Em tempo real' : isConnected ? 'Sincronizando...' : 'Conectando...' }}
        </span>
      </div>
    </header>

    <p v-if="isLoading" class="page-message" role="status">Carregando sala...</p>
    <p v-else-if="errorMessage" class="page-message error-message" role="alert">{{ errorMessage }}</p>
    <template v-else-if="room && currentParticipant">
      <section class="tabletop-layout">
        <div class="scene-column">
          <div class="scene-toolbar">
            <div>
              <p class="eyebrow">Cena ativa</p>
              <h2>{{ scene?.nome ?? 'Aguardando estado da cena' }}</h2>
            </div>
            <p class="scene-help">
              {{ isMaster
                ? 'Arraste tokens para mover • role para zoom • arraste o mapa para navegar'
                : 'Tokens sincronizados ao vivo • role para zoom • arraste o mapa para navegar' }}
            </p>
          </div>

          <div class="scene-frame">
            <TabletopCanvas
              v-if="scene"
              :tokens="tokens"
              :grid-config="gridConfig"
              :can-edit="canEdit"
              :selected-token-id="selectedTokenId"
              @select-token="selectedTokenId = $event"
              @move-token="moveToken"
              @canvas-error="connectionMessage = $event"
            />
            <div v-else class="scene-placeholder" role="status">
              {{ isConnected ? 'Carregando mapa e cena...' : 'Aguardando conexão segura com a sala...' }}
            </div>
          </div>

          <p v-if="connectionMessage" class="inline-message error-message" role="alert">
            {{ connectionMessage }}
          </p>
          <p v-if="operationMessage" class="inline-message error-message" role="alert">
            {{ operationMessage }}
          </p>

          <section class="token-panel" aria-labelledby="token-panel-heading">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Objetos da cena</p>
                <h2 id="token-panel-heading">Tokens <span>{{ tokens.length }}</span></h2>
              </div>
              <p v-if="selectedToken" class="selected-label">Selecionado: {{ selectedToken.nome }}</p>
            </div>

            <form v-if="isMaster" class="token-controls" @submit.prevent="addToken">
              <label class="visually-hidden" for="new-token-name">Nome do token</label>
              <input
                id="new-token-name"
                v-model="tokenName"
                type="text"
                maxlength="120"
                placeholder="Nome do token"
                autocomplete="off"
                :disabled="!canEdit"
              />
              <button type="submit" :disabled="!canEdit || !tokenName.trim()">
                + Adicionar token
              </button>
              <button
                type="button"
                class="secondary-button"
                :disabled="!selectedToken || !canEdit"
                @click="removeSelectedToken"
              >
                Remover selecionado
              </button>
            </form>
            <p v-else class="player-notice">Você está como jogador. Tokens são visíveis, mas só o mestre pode editá-los.</p>

            <ul v-if="tokens.length" class="token-list" aria-label="Tokens da cena">
              <li v-for="token in tokens" :key="token.id">
                <button
                  type="button"
                  :class="{ selected: token.id === selectedTokenId }"
                  @click="selectedTokenId = token.id"
                >
                  <span class="token-avatar">{{ token.nome.slice(0, 1).toUpperCase() }}</span>
                  <span>{{ token.nome }}</span>
                  <span class="token-coordinates">{{ Math.round(token.x) }}, {{ Math.round(token.y) }}</span>
                </button>
              </li>
            </ul>
            <p v-else class="empty-tokens">Ainda não há tokens nesta cena.</p>
          </section>
        </div>

        <aside class="room-sidebar">
          <section class="sidebar-card">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Ao vivo</p>
                <h2>Participantes</h2>
              </div>
              <span class="participant-count">{{ participants.length }}</span>
            </div>
            <ul class="participant-list">
              <li v-for="participant in participants" :key="participant.id">
                <span class="presence-indicator" :class="{ online: onlineUserIds.includes(participant.usuarioId) }" />
                <span class="participant-name">{{ participantLabel(participant) }}</span>
                <span class="participant-role">{{ participant.papel === 'MESTRE' ? 'Mestre' : 'Jogador' }}</span>
              </li>
            </ul>
            <p class="presence-note">
              {{ onlineUserIds.length }} {{ onlineUserIds.length === 1 ? 'conectado' : 'conectados' }}
            </p>
          </section>
          <section class="sidebar-card scene-details">
            <p class="eyebrow">Configuração do mapa</p>
            <p>Grid <strong>{{ gridConfig.enabled ? 'ligado' : 'desligado' }}</strong></p>
            <p>Tamanho <strong>{{ gridConfig.size }} px</strong></p>
            <p>Escala e posição da câmera são locais nesta sessão.</p>
          </section>
          <section class="sidebar-card chat-card" aria-labelledby="chat-heading">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Sessão</p>
                <h2 id="chat-heading">Chat da sala</h2>
              </div>
            </div>
            <ol class="chat-message-list" aria-live="polite" aria-relevant="additions">
              <li v-for="message in roomMessages" :key="message.id" class="chat-message">
                <template v-if="messageRoll(message)">
                  <div class="chat-message-heading">
                    <strong>{{ messageAuthorLabel(message.autorId) }} rolou</strong>
                    <time :datetime="message.createdAt">{{ formatMessageTime(message) }}</time>
                  </div>
                  <code class="roll-expression">{{ messageRoll(message)?.expression }}</code>
                  <div
                    v-for="repetition in messageRoll(message)?.repetitions"
                    :key="repetition.repetition"
                    class="roll-repetition"
                  >
                    <span v-if="(messageRoll(message)?.repetitionCount ?? 1) > 1" class="repetition-label">
                      Repetição {{ repetition.repetition }}
                    </span>
                    <span class="roll-values">Dados: [{{ formatRollValues(repetition) }}]</span>
                    <span v-if="repetition.total !== null" class="roll-total">
                      Total: {{ repetition.total }}
                    </span>
                    <span v-else class="roll-total">
                      Sucessos: {{ repetition.successes }}
                    </span>
                    <template v-for="(die, dieIndex) in repetition.dice" :key="dieIndex">
                      <span v-if="die.rolls.length > 1" class="explosion-detail">
                        Dado {{ dieIndex + 1 }}: {{ formatDieChain(die) }}
                        <template v-if="die.explosionLimitReached"> (limite de explosões atingido)</template>
                      </span>
                    </template>
                  </div>
                </template>
                <template v-else>
                  <div class="chat-message-heading">
                    <strong>{{ messageAuthorLabel(message.autorId) }}</strong>
                    <time :datetime="message.createdAt">{{ formatMessageTime(message) }}</time>
                  </div>
                  <p class="chat-message-content">{{ message.conteudo }}</p>
                </template>
              </li>
              <li v-if="roomMessages.length === 0" class="chat-empty">Ainda não há mensagens.</li>
            </ol>
            <form class="chat-compose" @submit.prevent="sendMessage">
              <label class="visually-hidden" for="room-chat-message">Mensagem da sala</label>
              <textarea
                id="room-chat-message"
                v-model="chatDraft"
                maxlength="1000"
                rows="2"
                placeholder="Mensagem ou rolagem, ex.: 2d4+2"
                :disabled="!isRoomReady || isSendingMessage"
              />
              <button type="submit" :disabled="!isRoomReady || isSendingMessage || !chatDraft.trim()">
                {{ isSendingMessage ? 'Enviando...' : 'Enviar' }}
              </button>
            </form>
            <p class="chat-hint">Use `d20`, `2d4+2`, `3#5d20`, `d6!`, `4d6ns`, `2d6++1`, `2d6--1`, `5d6>>4` ou `5d6<<3`.</p>
          </section>
        </aside>
      </section>
    </template>
  </main>
</template>

<style scoped>
.tabletop-page {
  width: min(100%, 1500px);
  margin: 0 auto;
}
.tabletop-header,
.title-group,
.session-badges,
.scene-toolbar,
.panel-heading,
.token-controls,
.participant-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.tabletop-header {
  margin-bottom: 1.25rem;
}
.title-group {
  justify-content: flex-start;
}
.back-button,
.token-controls button,
.token-list button {
  border: 1px solid var(--color-border);
  border-radius: 0.55rem;
  color: var(--color-heading);
  background: var(--color-background);
  font: inherit;
  cursor: pointer;
}
.back-button {
  min-height: 2.5rem;
  padding: 0.45rem 0.8rem;
}
.eyebrow {
  margin: 0 0 0.2rem;
  color: var(--color-text);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.7;
}
h1,
h2,
p {
  margin-top: 0;
}
h1 {
  margin-bottom: 0;
  font-family: Georgia, serif;
  font-size: clamp(1.4rem, 3vw, 2rem);
}
.session-badges {
  justify-content: flex-end;
}
.role-badge,
.connection-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.85rem;
}
.role-badge {
  color: #745526;
  background: #e9d9b5;
  border-color: #d6c397;
  font-weight: 700;
}
.connection-badge {
  color: var(--color-text);
}
.connection-badge.connected {
  color: #21643b;
  background: #e5f2e8;
  border-color: #bedbc6;
}
.connection-dot,
.presence-indicator {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #98a2a0;
}
.connected .connection-dot,
.presence-indicator.online {
  background: #39945a;
  box-shadow: 0 0 0 3px rgb(57 148 90 / 15%);
}
.tabletop-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: start;
  gap: 1rem;
}
.scene-column,
.room-sidebar {
  min-width: 0;
}
.scene-toolbar,
.token-panel,
.sidebar-card {
  padding: 1rem 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-background);
}
.chat-card {
  min-width: 0;
}
.chat-message-list {
  display: grid;
  max-height: 22rem;
  gap: 0.65rem;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
}
.chat-message {
  min-width: 0;
  padding: 0.65rem 0;
  border-top: 1px solid var(--color-border);
  font-size: 0.86rem;
}
.chat-message-heading {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}
.chat-message-heading time {
  flex: none;
  color: var(--color-text);
  font-size: 0.72rem;
  opacity: 0.7;
}
.chat-message-content {
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.roll-expression {
  display: inline-block;
  margin: 0.15rem 0 0.4rem;
  overflow-wrap: anywhere;
  color: #745526;
}
.roll-repetition {
  display: grid;
  gap: 0.15rem;
  margin: 0.3rem 0;
}
.repetition-label,
.explosion-detail,
.chat-hint,
.chat-empty {
  color: var(--color-text);
  font-size: 0.75rem;
  opacity: 0.75;
}
.roll-values {
  overflow-wrap: anywhere;
}
.roll-total {
  font-weight: 700;
}
.explosion-detail {
  overflow-wrap: anywhere;
}
.chat-compose {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.7rem;
}
.chat-compose textarea {
  width: 100%;
  resize: vertical;
  padding: 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 0.45rem;
  color: var(--color-text);
  background: var(--color-background);
  font: inherit;
}
.chat-compose button {
  justify-self: end;
  min-height: 2.2rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid #526c55;
  border-radius: 0.45rem;
  color: white;
  background: #526c55;
  font: inherit;
  cursor: pointer;
}
.chat-compose button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.chat-hint {
  margin: 0.6rem 0 0;
  overflow-wrap: anywhere;
  line-height: 1.45;
}
.scene-toolbar {
  margin-bottom: 0.7rem;
}
.scene-toolbar h2,
.panel-heading h2 {
  margin: 0;
  font-family: Georgia, serif;
}
.scene-toolbar h2 {
  font-size: 1.3rem;
}
.scene-help {
  margin: 0;
  color: var(--color-text);
  font-size: 0.8rem;
  text-align: right;
  opacity: 0.75;
}
.scene-frame {
  position: relative;
  overflow: hidden;
  min-height: 360px;
  height: clamp(360px, 64vh, 780px);
  border: 1px solid #35483c;
  border-radius: 0.75rem;
  background: #27362e;
  box-shadow: 0 1rem 2.5rem rgb(25 35 28 / 18%);
}
.scene-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 360px;
  place-items: center;
  color: #efe7d2;
}
.inline-message,
.page-message {
  margin: 0.75rem 0;
}
.error-message {
  color: #b42318;
}
.token-panel {
  margin-top: 0.8rem;
}
.panel-heading {
  margin-bottom: 0.9rem;
}
.panel-heading h2 {
  font-size: 1.15rem;
}
.panel-heading h2 span,
.participant-count {
  color: var(--color-text);
  font: 500 0.85rem Arial, sans-serif;
  opacity: 0.65;
}
.selected-label {
  margin: 0;
  color: #735620;
  font-size: 0.88rem;
}
.token-controls {
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.token-controls input {
  flex: 1 1 160px;
  min-width: 140px;
  min-height: 2.45rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 0.45rem;
  color: var(--color-text);
  background: var(--color-background);
  font: inherit;
}
.token-controls button {
  min-height: 2.45rem;
  padding: 0.45rem 0.75rem;
  color: white;
  background: #526c55;
  border-color: #526c55;
  font-size: 0.87rem;
}
.token-controls .secondary-button {
  color: var(--color-heading);
  background: var(--color-background);
  border-color: var(--color-border);
}
.token-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.player-notice,
.empty-tokens,
.presence-note,
.scene-details p:last-child {
  margin: 0.25rem 0 0.75rem;
  color: var(--color-text);
  font-size: 0.88rem;
  opacity: 0.76;
}
.token-list,
.participant-list {
  display: grid;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.token-list button {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.65rem;
  padding: 0.45rem 0.6rem;
  text-align: left;
}
.token-list button.selected {
  border-color: #ad8d54;
  background: #f2ead8;
}
.token-avatar {
  display: grid;
  width: 1.8rem;
  height: 1.8rem;
  place-items: center;
  border-radius: 50%;
  color: #fff8e6;
  background: #526c55;
  font: 700 0.9rem Georgia, serif;
}
.token-coordinates {
  margin-left: auto;
  color: var(--color-text);
  font-size: 0.78rem;
  opacity: 0.7;
}
.room-sidebar {
  display: grid;
  gap: 0.8rem;
}
.sidebar-card {
  padding: 1rem;
}
.participant-list li {
  justify-content: flex-start;
  padding: 0.65rem 0;
  border-top: 1px solid var(--color-border);
}
.participant-name {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.participant-role {
  color: var(--color-text);
  font-size: 0.75rem;
  opacity: 0.72;
}
.presence-note {
  margin: 0.55rem 0 0;
}
.scene-details p {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.55rem;
  color: var(--color-text);
  font-size: 0.87rem;
}
.scene-details p:last-child {
  display: block;
  margin: 0.7rem 0 0;
  line-height: 1.45;
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 960px) {
  .tabletop-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .room-sidebar {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}
@media (max-width: 620px) {
  .tabletop-header,
  .scene-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .session-badges {
    width: 100%;
    justify-content: flex-start;
  }
  .scene-help {
    text-align: left;
  }
  .scene-frame {
    min-height: 360px;
    height: 55vh;
  }
}
</style>
