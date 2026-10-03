import type { ApiSuccess as ContractApiSuccess } from '@motor-vtt/contracts';

export type { AuthResponse, User, UserStatus } from '@motor-vtt/contracts';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterPayload extends LoginCredentials {
    nome: string;
}

export type ApiSuccess<T> = ContractApiSuccess<T>;
