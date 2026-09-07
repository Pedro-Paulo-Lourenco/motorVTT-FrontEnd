// src/types/auth.ts

export interface User {
    id: string;
    name: string;
    email: string;
    createdAt?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterPayload extends LoginCredentials {
    name: string;
}


export interface AuthResponse {
    user: User;
    message?: string; // Opcional, caso a API envie uma mensagem de sucesso
}