<script setup lang="ts">
import { onBeforeUnmount, onMounted, nextTick, ref } from "vue";
import router from "./router";
import { useAuthStore } from "@/stores/auth.ts";

const authStore = useAuthStore();
const isLoading = ref(true);
const isProfileMenuOpen = ref(false);
const isLoggingOut = ref(false);
const logoutError = ref("");
const profileMenu = ref<HTMLElement | null>(null);

onMounted(async () => {
  // O router e a reidratação da sessão devem terminar antes de remover a tela de carregamento.
  await router.isReady();
  await nextTick();
  isLoading.value = false;

});

function closeProfileMenuOnOutsideClick(event: MouseEvent): void {
  // Mantém o estado do menu local ao cabeçalho; cliques internos não devem fechá-lo.
  if (event.target instanceof Node && !profileMenu.value?.contains(event.target)) {
    isProfileMenuOpen.value = false;
  }
}

function closeProfileMenuOnEscape(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    isProfileMenuOpen.value = false;
  }
}

async function handleLogout(): Promise<void> {
  // Impede solicitações duplicadas enquanto o servidor limpa o cookie de sessão.
  if (isLoggingOut.value) return;

  isLoggingOut.value = true;
  logoutError.value = "";
  try {
    await authStore.logout();
  } catch {
    logoutError.value = "Não foi possível encerrar a sessão no servidor. Você saiu deste dispositivo.";
  } finally {
    isProfileMenuOpen.value = false;
    await router.replace("/login");
    isLoggingOut.value = false;
  }
}

onMounted(() => {
  // Os ouvintes do documento implementam fechamento ao clicar fora e com a tecla Escape.
  document.addEventListener("click", closeProfileMenuOnOutsideClick);
  document.addEventListener("keydown", closeProfileMenuOnEscape);
});

onBeforeUnmount(() => {
  // Remove os ouvintes globais para não acumular handlers ao remontar o cabeçalho.
  document.removeEventListener("click", closeProfileMenuOnOutsideClick);
  document.removeEventListener("keydown", closeProfileMenuOnEscape);
});

</script>

<template>
  <header class="app-header">
    <nav aria-label="Navegação principal">
      <router-link class="brand-link" to="/" exact-active-class="router-link-exact-active" aria-label="Ir para a homepage">VTT</router-link>
      <template v-if="authStore.isAuthenticated">
        <router-link to="/home">Início</router-link>
        <router-link to="/biblioteca">Biblioteca</router-link><router-link to="/templates">Templates de Ficha</router-link>
        <div ref="profileMenu" class="profile-menu">
          <button
            type="button"
            class="profile-button"
            aria-label="Abrir menu do perfil"
            aria-haspopup="menu"
            :aria-expanded="isProfileMenuOpen"
            @click="isProfileMenuOpen = !isProfileMenuOpen"
          >
            <span aria-hidden="true">{{ authStore.user?.nome?.charAt(0).toUpperCase() || " " }}</span>
          </button>
          <section v-if="isProfileMenuOpen" class="profile-dropdown" role="menu">
            <p class="profile-name">{{ authStore.user?.nome }}</p>
            <button
              type="button"
              class="logout-button"
              role="menuitem"
              :disabled="isLoggingOut"
              @click="handleLogout"
            >
              {{ isLoggingOut ? "Saindo..." : "Sair" }}
            </button>
          </section>
        </div>
      </template>
      <template v-else>
        <router-link to="/login">Entrar</router-link>
        <router-link to="/cadastro">Cadastrar</router-link>
      </template>
    </nav>
  </header>

  <p v-if="logoutError" class="logout-error" role="alert">{{ logoutError }}</p>

  <main>
    <!-- Mantém a rota aguardando a checagem do cookie para não exibir conteúdo protegido prematuramente. -->
    <div v-if="isLoading" class="loading-screen">
      <p>Carregando aplicação...</p>
    </div>
    <router-view v-else />
  </main>
</template>
