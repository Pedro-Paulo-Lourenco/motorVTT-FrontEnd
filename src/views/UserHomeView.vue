<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.ts';
import api from '@/services/api.ts';
import axios from 'axios';
import {
  apiErrorResponseSchema,
  type ApiSuccess,
  type Room,
  type Participant,
} from '@motor-vtt/contracts';

const authStore = useAuthStore();
const router = useRouter();
const roomName = ref('');
const inviteCode = ref('');
const rooms = ref<Room[]>([]);
const isLoadingRooms = ref(true);
const roomsError = ref('');
const createError = ref('');
const createSuccess = ref('');
const createdRoomId = ref('');
const createdInviteCode = ref('');
const joinError = ref('');
const joinSuccess = ref('');
const joinedRoomId = ref('');
const activeAction = ref<'create' | 'join' | null>(null);

type CreateRoomPayload = { nome: string };
type JoinRoomPayload = { codigoConvite: string };

function getApiError(error: unknown): { status?: number; code?: string } {
  if (!axios.isAxiosError(error)) return {};

  const parsed = apiErrorResponseSchema.safeParse(error.response?.data);
  return {
    status: error.response?.status,
    code: parsed.success ? parsed.data.error.code : undefined,
  };
}

function actionErrorMessage(error: unknown, action: 'create' | 'join'): string {
  const { code, status } = getApiError(error);

  if (code === 'ALREADY_PARTICIPANT') return 'Você já participa desta sala.';
  if (code === 'ROOM_NOT_FOUND') return 'Não encontramos uma sala com esse código de convite.';
  if (code === 'ROOM_INACTIVE') return 'Esta sala não está ativa e não pode receber participantes.';
  if (code === 'ROOM_CODE_UNAVAILABLE') return 'Não foi possível gerar um código para a sala. Tente novamente.';
  if (code === 'VALIDATION_ERROR') {
    return action === 'join'
      ? 'Confira o código de convite e tente novamente.'
      : 'Informe um nome de sala válido.';
  }
  if (status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  return action === 'join'
    ? 'Não foi possível entrar na sala. Tente novamente.'
    : 'Não foi possível criar a sala. Tente novamente.';
}

async function loadRooms(): Promise<void> {
  isLoadingRooms.value = true;
  roomsError.value = '';

  try {
    const response = await api.get<ApiSuccess<Room[]>>('/rooms');
    rooms.value = response.data.data;
  } catch {
    roomsError.value = 'Não foi possível carregar suas salas. Tente novamente.';
  } finally {
    isLoadingRooms.value = false;
  }
}

async function createRoom(): Promise<void> {
  if (activeAction.value !== null) return;

  const nome = roomName.value.trim();
  createError.value = '';
  createSuccess.value = '';
  createdRoomId.value = '';
  createdInviteCode.value = '';
  if (!nome || nome.length > 120) {
    createError.value = 'Informe um nome de sala com até 120 caracteres.';
    return;
  }

  activeAction.value = 'create';
  try {
    const payload: CreateRoomPayload = { nome };
    const response = await api.post<ApiSuccess<Room>>('/rooms', payload);
    createSuccess.value = 'Sala criada com sucesso.';
    createdRoomId.value = response.data.data.id;
    createdInviteCode.value = response.data.data.codigoConvite;
    await loadRooms();
  } catch (error) {
    createError.value = actionErrorMessage(error, 'create');
  } finally {
    activeAction.value = null;
  }
}

async function joinRoom(): Promise<void> {
  if (activeAction.value !== null) return;

  const codigoConvite = inviteCode.value.trim();
  joinError.value = '';
  joinSuccess.value = '';
  joinedRoomId.value = '';
  if (codigoConvite.length < 6 || codigoConvite.length > 64) {
    joinError.value = 'Informe um código de convite válido.';
    return;
  }

  activeAction.value = 'join';
  try {
    const payload: JoinRoomPayload = { codigoConvite };
    const response = await api.post<ApiSuccess<Participant>>('/rooms/join', payload);
    joinSuccess.value = 'Você entrou na sala com sucesso.';
    joinedRoomId.value = response.data.data.salaId;
    await loadRooms();
  } catch (error) {
    joinError.value = actionErrorMessage(error, 'join');
  } finally {
    activeAction.value = null;
  }
}

function openRoom(room: Room): void {
  void router.push({ name: 'Room', params: { id: room.id } });
}

onMounted(() => {
  void loadRooms();
});
</script>

<template>
  <main class="user-home">
    <header class="page-header">
      <div>
        <h1>Suas salas</h1>
        <p v-if="authStore.user">Olá, {{ authStore.user.nome }}.</p>
      </div>
    </header>

    <section class="room-actions" aria-label="Ações de sala">
      <form class="room-form" :aria-busy="activeAction === 'create'" @submit.prevent="createRoom">
        <h2>Criar sala</h2>
        <label for="room-name">Nome da sala</label>
        <input
          id="room-name"
          v-model="roomName"
          name="nome"
          type="text"
          maxlength="120"
          autocomplete="off"
          :disabled="activeAction !== null"
          required
        />
        <p v-if="createError" class="form-message error" role="alert">{{ createError }}</p>
        <p v-if="createSuccess" class="form-message success" role="status">
          {{ createSuccess }} Código de convite:
          <strong>{{ createdInviteCode }}</strong>
        </p>
        <button
          v-if="createdRoomId"
          type="button"
          @click="router.push({ name: 'Room', params: { id: createdRoomId } })"
        >
          Abrir tabletop
        </button>
        <button type="submit" :disabled="activeAction !== null">
          {{ activeAction === 'create' ? 'Criando...' : 'Criar sala' }}
        </button>
      </form>

      <form class="room-form" :aria-busy="activeAction === 'join'" @submit.prevent="joinRoom">
        <h2>Entrar com convite</h2>
        <label for="invite-code">Código de convite</label>
        <input
          id="invite-code"
          v-model="inviteCode"
          name="codigoConvite"
          type="text"
          minlength="6"
          maxlength="64"
          autocomplete="off"
          :disabled="activeAction !== null"
          required
        />
        <p v-if="joinError" class="form-message error" role="alert">{{ joinError }}</p>
        <p v-if="joinSuccess" class="form-message success" role="status">{{ joinSuccess }}</p>
        <button
          v-if="joinedRoomId"
          type="button"
          @click="router.push({ name: 'Room', params: { id: joinedRoomId } })"
        >
          Abrir tabletop
        </button>
        <button type="submit" :disabled="activeAction !== null">
          {{ activeAction === 'join' ? 'Entrando...' : 'Entrar na sala' }}
        </button>
      </form>
    </section>

    <section class="rooms-section" aria-labelledby="rooms-heading">
      <div class="section-heading">
        <h2 id="rooms-heading">Salas de que você participa</h2>
        <button type="button" :disabled="isLoadingRooms || activeAction !== null" @click="loadRooms">
          {{ isLoadingRooms ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </div>
      <p v-if="isLoadingRooms" role="status">Carregando salas...</p>
      <p v-else-if="roomsError" class="form-message error" role="alert">{{ roomsError }}</p>
      <p v-else-if="rooms.length === 0">Você ainda não participa de nenhuma sala.</p>
      <ul v-else class="room-list">
        <li v-for="room in rooms" :key="room.id">
          <span>{{ room.nome }}</span>
          <button type="button" @click="openRoom(room)">Abrir tabletop</button>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.user-home {
  width: min(100%, 900px);
  margin: 0 auto;
}
.page-header,
.section-heading,
.room-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.page-header {
  margin-bottom: 2rem;
}
.room-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 1rem;
}
.room-form,
.rooms-section {
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}
.room-form input {
  width: 100%;
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.35rem;
  color: var(--color-text);
  background: var(--color-background);
}
button {
  min-height: 2.5rem;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}
.rooms-section {
  margin-top: 1.5rem;
}
.room-list {
  display: grid;
  gap: 0.5rem;
  padding: 0;
  list-style: none;
}
.room-list li {
  padding: 0.75rem 0;
  border-top: 1px solid var(--color-border);
}
.form-message.error {
  color: #b42318;
}
.form-message.success {
  color: #067647;
}
@media (max-width: 480px) {
  .page-header,
  .section-heading {
    align-items: flex-start;
  }
}
</style>