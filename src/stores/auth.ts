import { defineStore } from 'pinia';
import api from "@/services/api.ts";

interface LoginCredentials {
    email: string;
    password: string;
}
interface cadCredentials {
    nome: string;
    email: string;
    senha: string;
}
export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        isAuthenticated: false,
    }),
    actions: {
        async cadastrar(credentials: cadCredentials) {

            const response = await api.post('/auth/cadastrar', credentials)
            this.user = response.data.user;
            this.isAuthenticated = true;

            return response.data;
        },
        async login(credentials: LoginCredentials) {
            // Faz a requisição HTTP (o cookie HttpOnly será injetado automaticamente pelo navegador)
            const response = await api.post('/auth/login', credentials);

            // Atualiza o estado global
            this.user = response.data.user;
            this.isAuthenticated = true;

            return response.data; // Retorna os dados caso o componente precise de algo
        },
        async checkSession() {
            try {
                // Rota no Node que lê o cookie HttpOnly e retorna o usuário logado
                const response = await api.get('/auth/me');
                this.user = response.data.user;
            } catch {
                this.user = null; // Cookie inválido ou expirado
            }
        }
    }
});

