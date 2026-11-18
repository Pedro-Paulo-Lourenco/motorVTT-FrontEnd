import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { onUnauthorized } from '@/services/api.ts'
import { useAuthStore } from '@/stores/auth.ts'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Um 401 em qualquer ponto da API indica que a sessão baseada em cookie não é mais confiável.
// Limpa o estado do cliente antes do redirecionamento para não manter dados protegidos obsoletos.
onUnauthorized(() => {
    const authStore = useAuthStore(pinia)

    authStore.clearSession()

    if (router.currentRoute.value.path !== '/login') {
        void router.replace('/login')
    }
})

async function bootstrap() {
    const authStore = useAuthStore(pinia)

    // Valida o cookie HttpOnly antes da primeira renderização para evitar exibir uma página protegida por engano.
    await authStore.checkSession()

    app.use(router)
    app.mount('#app')
}

void bootstrap()