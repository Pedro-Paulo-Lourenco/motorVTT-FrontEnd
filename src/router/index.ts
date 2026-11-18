import { createRouter, createWebHistory } from 'vue-router'
import {useAuthStore} from "@/stores/auth.ts";
import HomeView from "@/views/HomeView.vue";
import UserHomeView from "@/views/UserHomeView.vue";
import LoginView from "@/views/LoginView.vue";
import CadView from "@/views/CadView.vue";
import RoomView from "@/views/RoomView.vue";
import SheetTemplateBuilderView from "@/views/SheetTemplateBuilderView.vue";
import TemplateListView from "@/views/TemplateListView.vue";
import UserLibraryView from "@/views/UserLibraryView.vue";


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
        path: '/salas/:id',
        name: 'Room',
        component: RoomView,
        meta: {requiresAuth: true}
    },
    { path: '/templates', name: 'TemplateList', component: TemplateListView, meta: { requiresAuth: true } },
    { path: '/biblioteca', name: 'UserLibrary', component: UserLibraryView, meta: { requiresAuth: true } },
    { path: '/templates/novo', name: 'TemplateCreate', component: SheetTemplateBuilderView, meta: { requiresAuth: true } },
    { path: '/templates/:id/editar', name: 'TemplateEdit', component: SheetTemplateBuilderView, meta: { requiresAuth: true } },
    { path: '/templates/fichas/novo', redirect: { name: 'TemplateCreate' } },
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
      // O histórico do navegador fornece URLs legíveis; o servidor deve retornar index.html.
    history: createWebHistory(),
    routes
})


// Este guarda é uma proteção de interface; a API continua autorizando cada requisição protegida.
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Reidrata uma vez após recarregar; o cookie HttpOnly continua inacessível ao JavaScript.
    if (!authStore.isInitialized) {
        await authStore.checkSession()
    }

    // Redireciona usuários não autenticados antes de entrar em rotas protegidas.
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return next('/login')
    }

    // Rotas exclusivas de visitantes não devem ser acessíveis após autenticação.
    if (to.meta.requiresGuest && authStore.isAuthenticated) {
        return next('/home') // Redireciona o usuário logado para a área interna
    }

    // Rotas públicas continuam normalmente.
    next()
})

export default router
