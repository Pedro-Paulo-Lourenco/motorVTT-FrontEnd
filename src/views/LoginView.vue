<script setup lang="ts">
import {ref} from "vue";
import { useRouter } from 'vue-router';
import {useAuthStore} from "@/stores/auth.ts";
import axios from "axios";

const router = useRouter();
const authStore = useAuthStore();

const email = ref('')
const password = ref('')
const errorMessage = ref('');

const isLoading = ref(false);

async function handleLogin() {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    // 3. Chama a função que você moveu para a store
    await new Promise((resolve) => setTimeout(resolve, 250));
    await authStore.login({
      email: email.value,
      password: password.value
    });

    // 4. Se deu certo, redireciona para a página restrita
    await router.push('/home');
  } catch (error) {
    // Tratamento de erro visual fica aqui no componente
    if (axios.isAxiosError(error)) {
      // Aqui dentro o TypeScript sabe exatamente o que é error.response
      errorMessage.value = error.response?.data?.message || 'Erro ao fazer login.';
    } else {
      // Caso seja outro tipo de erro (ex: erro de sintaxe no código)
      errorMessage.value = 'Ocorreu um erro inesperado.';
    }
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <main class = "login_container">
    <h1>Login</h1>
    <form class="login-form" @submit.prevent="handleLogin">
      <label for="campo_email" class="escondido-visual">Email do Usuário:</label>
      <input type="email" name="campo_email" id="campo_email" v-model="email" placeholder="Email" :disabled="isLoading"/>

      <label for="campo_senha" class="escondido-visual">Senha do Usuário:</label>
      <input type="password" name="campo_senha" id="campo_senha" v-model="password" placeholder="Password" :disabled="isLoading"/>
      <br>
      <button name="form_submit_button" class="form_submit_button" :disabled="isLoading">
        <span v-if="isLoading" class="spinner"></span>
        <span v-else>Entrar</span>
      </button>

    </form>
  </main>
</template>

<style scoped>
.escondido-visual {
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
.form_submit_button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 16px;
  cursor: pointer;
}
/* Animação do Spinner em CSS puro */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>