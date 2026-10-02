<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.ts';

const authStore = useAuthStore();
const router = useRouter();
const isLoggingOut = ref(false);
const errorMessage = ref('');

async function handleLogout(): Promise<void> {
  isLoggingOut.value = true;
  errorMessage.value = '';

  try {
    await authStore.logout();
  } catch {
    errorMessage.value = 'Não foi possível encerrar a sessão no servidor. Você saiu deste dispositivo.';
  } finally {
    await router.replace('/login');
    isLoggingOut.value = false;
  }
}
</script>

<template>
  <main>
    <h1>Home do Usuário</h1>
    <p v-if="authStore.user">Olá, {{ authStore.user.nome }}.</p>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
    <button type="button" :disabled="isLoggingOut" @click="handleLogout">
      {{ isLoggingOut ? 'Saindo...' : 'Sair' }}
    </button>
  </main>
</template>

<style scoped>

</style>