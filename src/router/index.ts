import { createRouter, createWebHistory } from 'vue-router'
import HomeView from "@/views/HomeView.vue";
import UserHomeView from "@/views/UserHomeView.vue";
import LoginView from "@/views/LoginView.vue";
import CadView from "@/views/CadView.vue";

const routes = [
    {
        path: "/",
        name: "Home",
        component: HomeView,
    },
    {
        path: '/home',
        name: 'UserHome',
        component: UserHomeView
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginView
    },
    {
        path: '/cadastro',
        name: 'Cadastro',
        component: CadView
    }
]

const router = createRouter({
    history: createWebHistory(), // cria histórico de navegação
    routes
})


// TODO token de login para gerenciar permissão de rotas
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token') // Exemplo de verificação

    // Se a rota não for Login e o usuário não estiver autenticado
    if (to.name !== 'Login' && !isAuthenticated) {
        next({ name: 'Login' }) // Redireciona para o Login
    } else {
        next() // Permite prosseguir para a página desejada
    }
})

export default router // O router já vai com o guarda de navegação ativado
