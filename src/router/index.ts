import { createRouter, createWebHistory } from 'vue-router'
import {useAuthStore} from "@/stores/auth.ts";
import HomeView from "@/views/HomeView.vue";
import UserHomeView from "@/views/UserHomeView.vue";
import LoginView from "@/views/LoginView.vue";
import CadView from "@/views/CadView.vue";


const routes = [
    {
        path: "/",
        name: "Home",
        component: HomeView,
        meta: {public: true}
    },
    {
        path: '/home',
        name: 'UserHome',
        component: UserHomeView,
        meta: {requiresAuth: true}
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
        meta: {requiresGuest: true}
    },
    {
        path: '/cadastro',
        name: 'Cadastro',
        component: CadView,
        meta: {requiresGuest: true}
    }
]

const router = createRouter({
    history: createWebHistory(), // cria histórico de navegação
    routes
})


// TODO token de login para gerenciar permissão de rotas
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 1. Se o app recarregou (F5), valida o cookie HttpOnly no backend uma vez
    if (!authStore.isInitialized) {
        await authStore.checkSession()
    }

    // 2. Rota exige Login, mas o usuário NÃO está autenticado
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return next('/login')
    }

    // 3. Rota exige ser Visitante (Login/Cadastro), mas o usuário JÁ está autenticado
    if (to.meta.requiresGuest && authStore.isAuthenticated) {
        return next('/home') // Redireciona o usuário logado para a área interna
    }

    // 4. Qualquer outra rota (como a Home "/") é liberada
    next()
})

export default router // O router já vai com o guarda de navegação ativado
