<script setup lang="ts">
import type { Participant } from '@motor-vtt/contracts';

const props = defineProps<{
  participants: Participant[];
  onlineUserIds: string[];
  currentUserId?: string;
}>();

function initials(participant: Participant): string {
  return participant.usuarioId === props.currentUserId ? 'Você'.slice(0, 2).toUpperCase() : participant.usuarioId.slice(0, 2).toUpperCase();
}

function label(participant: Participant): string {
  if (participant.usuarioId === props.currentUserId) return 'Você';
  return participant.papel === 'MESTRE' ? 'Mestre' : `Jogador ${props.participants.filter((item) => item.papel === 'JOGADOR').indexOf(participant) + 1}`;
}
</script>

<template>
  <section class="presence-bar" aria-label="Participantes ativos">
    <div class="presence-heading"><span>Na mesa</span><strong>{{ participants.length }}</strong></div>
    <ul>
      <li v-for="participant in participants" :key="participant.id">
        <div class="presence-avatar" :class="{ online: onlineUserIds.includes(participant.usuarioId) }" aria-hidden="true">
          {{ initials(participant) }}
          <span v-if="onlineUserIds.includes(participant.usuarioId)" class="presence-dot" />
        </div>
        <span class="presence-name">{{ label(participant) }}</span>
        <span class="presence-role" :class="{ master: participant.papel === 'MESTRE' }">{{ participant.papel === 'MESTRE' ? '♛' : 'Jogador' }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.presence-bar{position:fixed;z-index:20;bottom:1rem;left:1rem;width:min(19rem,calc(100vw - 2rem));padding:.7rem;border:1px solid rgb(255 255 255 / 14%);border-radius:.8rem;color:#f4efdf;background:rgb(18 27 23 / 92%);box-shadow:0 1rem 2rem rgb(0 0 0 / 28%);backdrop-filter:blur(12px)}
.presence-heading{display:flex;justify-content:space-between;margin-bottom:.35rem;color:#d9cfba;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase}
.presence-heading strong{color:#8ed6a3}
.presence-bar ul{display:flex;gap:.55rem;margin:0;padding:0;list-style:none}
.presence-bar li{display:flex;min-width:0;align-items:center;gap:.45rem}
.presence-avatar{position:relative;display:grid;width:2.2rem;height:2.2rem;flex:none;place-items:center;border:2px solid #59645f;border-radius:50%;color:#fff;background:#425a48;font:700 .72rem Georgia,serif}
.presence-avatar.online{border-color:#10b981;box-shadow:0 0 0 2px rgb(16 185 129 / 18%)}
.presence-dot{position:absolute;right:-2px;bottom:-2px;width:.65rem;height:.65rem;border:2px solid #121b17;border-radius:50%;background:#10b981}
.presence-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.78rem}
.presence-role{color:#aeb8b0;font-size:.65rem}
.presence-role.master{color:#e8c879;font-size:.9rem}
@media (max-width:620px){.presence-bar{bottom:.5rem;left:.5rem}}
</style>
