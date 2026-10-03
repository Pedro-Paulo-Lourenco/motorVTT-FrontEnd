<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import {
  apiErrorResponseSchema,
  type ApiSuccess,
  type Participant,
  type Room,
} from '@motor-vtt/contracts';
import api from '@/services/api.ts';
import { useAuthStore } from '@/stores/auth.ts';

interface RoomDetailsResponse {
  sala: Room;
  participantes: Participant[];
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const room = ref<Room | null>(null);
const participants = ref<Participant[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');
let latestRequest = 0;

const currentParticipant = computed(() =>
  participants.value.find((participant) => participant.usuarioId === authStore.user?.id),
);

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

async function loadRoom(id: unknown): Promise<void> {
  const requestId = ++latestRequest;
  room.value = null;
  participants.value = [];
  errorMessage.value = '';

  if (typeof id !== 'string' || !id) {
    errorMessage.value = 'Identificador de sala inválido.';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    const response = await api.get<ApiSuccess<RoomDetailsResponse>>(
      `/rooms/${encodeURIComponent(id)}`,
    );
    if (requestId !== latestRequest) return;
    room.value = response.data.data.sala;
    participants.value = response.data.data.participantes;

    if (!currentParticipant.value) {
      room.value = null;
      participants.value = [];
      errorMessage.value = 'Não foi possível confirmar sua participação nesta sala.';
    }
  } catch (error) {
    if (requestId === latestRequest) {
      errorMessage.value = getRoomErrorMessage(error);
    }
  } finally {
    if (requestId === latestRequest) {
      isLoading.value = false;
    }
  }
}

function participantName(participant: Participant, index: number): string {
  return participant.usuarioId === authStore.user?.id ? 'Você' : `Participante ${index + 1}`;
}

watch(
  () => route.params.id,
  (id) => void loadRoom(id),
  { immediate: true },
);
</script>

<template>
  <main class="room-page">
    <button class="back-button" type="button" @click="router.push('/home')">
      Voltar às salas
    </button>
    <p v-if="isLoading" role="status">Carregando sala...</p>
    <p v-else-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
    <template v-else-if="room">
      <header class="room-header">
        <div>
          <p class="eyebrow">Lobby da sala</p>
          <h1>{{ room.nome }}</h1>
        </div>
        <p v-if="currentParticipant" class="role-badge">
          Seu papel: <strong>{{ currentParticipant.papel }}</strong>
        </p>
      </header>

      <section class="participants" aria-labelledby="participants-heading">
        <h2 id="participants-heading">Participantes ({{ participants.length }})</h2>
        <ul>
          <li v-for="(participant, index) in participants" :key="participant.id">
            <span>{{ participantName(participant, index) }}</span>
            <span class="participant-role">{{ participant.papel }}</span>
            <span v-if="!participant.ativo" class="participant-status">Inativo</span>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<style scoped>
.room-page {
  width: min(100%, 900px);
  margin: 0 auto;
}
.back-button {
  min-height: 2.5rem;
  margin-bottom: 1.5rem;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
}
.room-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.eyebrow {
  color: var(--color-text);
  opacity: 0.7;
}
.role-badge,
.participant-role,
.participant-status {
  padding: 0.25rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
}
.participants {
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}
.participants h2 {
  margin-bottom: 0.75rem;
}
.participants ul {
  padding: 0;
  list-style: none;
}
.participants li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--color-border);
}
.participant-role,
.participant-status {
  margin-left: auto;
  font-size: 0.85rem;
}
.participant-status,
.error-message {
  color: #b42318;
}
@media (max-width: 480px) {
  .room-header {
    flex-direction: column;
  }
}
</style>
