<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import {useAuthStore} from "@/stores/auth.ts";

const authStore = useAuthStore();
const isLoading = ref(true);

onBeforeMount(async () => {
  try{
    await authStore.checkSession();
  } catch(error){
    console.log('Usuário não está logado ou cookie espirou');
  } finally {
    isLoading.value = false;
  }
})
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <nav>
        <router-link to="/">Início</router-link> |
        <router-link to="/login">Entrar</router-link> |
        <router-link to="/cadastro">Cadastrar</router-link>
      </nav>
    </div>
  </header>

  <main>
    <!-- Enquanto estiver checando o cookie, mostra um carregando para evitar piscar a tela -->
    <div v-if="isLoading" class="loading-screen">
      <p>Carregando aplicação...</p>
    </div>

    <router-view v-else/>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
