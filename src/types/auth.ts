export type UserStatus = 'PENDENTE' | 'ATIVO' | 'BLOQUEADO';

export interface User {
    id: string;
    nome: string;
    email: string;
    status: UserStatus;
    ultimoLogin: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterPayload extends LoginCredentials {
    nome: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    accessTokenExpiresAt: string;
}

export interface ApiSuccess<T> {
    success: true;
    data: T;
    message?: string;
    correlationId?: string;
}
