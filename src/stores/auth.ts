import { defineStore } from 'pinia';
import api from '@/services/api.ts';
import type { ApiSuccess, AuthResponse, LoginCredentials, RegisterPayload, User } from '@/types/auth';

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
            // Limpa somente o estado derivado no cliente; o servidor continua sendo a fonte do cookie.
            this.user = null
            this.isAuthenticated = false
        },
        async logout() {
            // Limpa localmente mesmo com falha de rede para não deixar uma interface autenticada obsoleta.
            try {
                await api.post('/auth/logout')
            } finally {
                this.clearSession()
            }
        },
        async cadastrar(credentials: RegisterPayload) {
            const response = await api.post<ApiSuccess<AuthResponse>>('/auth/register', credentials)
            this.user = response.data.data.user;
            this.isAuthenticated = true;

            return response.data.data;
        },
        async login(credentials: LoginCredentials) {
            // Faz a requisição HTTP (o cookie HttpOnly será injetado automaticamente pelo navegador)
            const response = await api.post<ApiSuccess<AuthResponse>>('/auth/login', credentials);

            // Atualiza o estado global
            this.user = response.data.data.user;
            this.isAuthenticated = true;

            return response.data.data;
        },
        async checkSession() {
            try {
                // O backend lê o cookie HttpOnly e retorna uma identidade de usuário validada.
                const response = await api.get<ApiSuccess<AuthResponse>>('/auth/me');
                this.user = response.data.data.user;
                this.isAuthenticated = true;
            } catch {
                // Cookies inválidos, expirados ou indisponíveis produzem o mesmo estado anônimo.
                this.user = null;
                this.isAuthenticated = false;
            } finally {
                this.isInitialized = true;
            }
        }
    }
});
