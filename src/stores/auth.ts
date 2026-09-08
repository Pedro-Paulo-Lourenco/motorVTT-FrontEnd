import { defineStore } from 'pinia';
import api from "@/services/api.ts";
import type { LoginCredentials, RegisterPayload ,AuthResponse, User} from '@/types/auth';

interface AuthState {
    user : User | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
}



export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        isAuthenticated: false,
        isInitialized: false,
    }),
    actions: {
        clearSession() {
            this.user = null
            this.isAuthenticated = false
        },
        async logout() {
            try {
                await api.post('/auth/logout')
            } finally {
                this.clearSession()
            }
        },
        async cadastrar(credentials: RegisterPayload) {

            const response = await api.post<AuthResponse>('/auth/cadastrar', credentials)
            this.user = response.data.user;
            this.isAuthenticated = true;

            return response.data;
        },
        async login(credentials: LoginCredentials) {
            // Faz a requisição HTTP (o cookie HttpOnly será injetado automaticamente pelo navegador)
            const response = await api.post<AuthResponse>('/auth/login', credentials);

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
                this.isAuthenticated = true;
            } catch {
                this.user = null; // Cookie inválido ou expirado
                this.isAuthenticated = false;
            } finally {
                this.isInitialized = true;
            }
        }
    }
});

