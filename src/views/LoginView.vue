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

async function handleLogin() {
  errorMessage.value = '';

  try {
    // 3. Chama a função que você moveu para a store
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
  }
}

</script>

<template>
  <main id = "login_container">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <label for="campo_email" class="escondido-visual">Email do Usuário:</label>
      <input type="email" name="campo_email" id="campo_email" v-model="email" placeholder="Email" />
      <label for="campo_senha" class="escondido-visual">Senha do Usuário:</label>
      <input type="password" name="campo_senha" id="campo_senha" v-model="password" placeholder="Password" />
      <label for="form_submit_button" class="escondido-visual">Botão de Login para submeter os dados:</label>
      <button name="form_submit_button" id="form_submit_button">Login</button>
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
</style>