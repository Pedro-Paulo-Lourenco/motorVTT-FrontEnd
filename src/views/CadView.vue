<script setup lang="ts">
import {ref, computed} from 'vue'
import { useRouter } from 'vue-router'
import {useAuthStore} from "@/stores/auth.ts";
import axios from "axios";

const router = useRouter()
const authStore = useAuthStore();

const form = ref({
  nome: '',
  email: '',
  senha: '',
})
const confirmSenha = ref('')

const senhaMatch = computed(() => {
  if (!confirmSenha.value) return true; // Não mostra erro antes de digitar
  return form.value.senha === confirmSenha.value;
});

const errorMessage = ref('');
const isLoading = ref(false);

async function handleCad(){
  if (!senhaMatch.value) {
    return;
  }
  errorMessage.value = '';
  isLoading.value = true;
  try{
    await new Promise((resolve) => setTimeout(resolve, 250));
    await authStore.cadastrar(form.value)

    await router.push('/home')
  }catch(error){
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
  <main class = "cad_container">
    <h1>Cadastro</h1>
    <form class="cad-form" @submit.prevent="handleCad">
      <label for="campo-nome" class="escondido-visual">Nome: </label>
      <input type="text" name="campo-nome" id="campo-nome" v-model="form.nome" placeholder="Nome" :disabled="isLoading" />
      <br>
      <label for="campo-email" class="escondido-visual">Email: </label>
      <input type="email" name="campo-email" id="campo-email" v-model="form.email" placeholder="Email" :disabled="isLoading"/>
      <br>
      <label for="campo-senha" class="escondido-visual">Senha: </label>
      <input type="password" name="campo-senha" id="campo-senha" v-model="form.senha" placeholder="Senha" :disabled="isLoading"/>
      <br>
      <label for="campo-check-senha" class="escondido-visual">Confirmar a senha: </label>
      <input type="password" name="campo-check-senha" id="campo-check-senha" v-model="confirmSenha" placeholder="Confirmar Senha" :disabled="isLoading"/>
      <br>
      <button name="form-submit-button" class="form-submit-button" :disabled="isLoading">
        <span v-if="isLoading" class="spinner"></span>
        <span v-else>Cadastrar</span>
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
.form-submit-button {
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