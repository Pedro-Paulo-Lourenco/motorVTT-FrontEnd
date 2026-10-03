import axios, { type InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
    interface InternalAxiosRequestConfig {
        authRetry?: boolean;
    }
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

let refreshRequest: Promise<void> | undefined;

function refreshSession(): Promise<void> {
    if (!refreshRequest) {
        refreshRequest = api
            .post('/auth/refresh')
            .then(() => undefined)
            .finally(() => {
                refreshRequest = undefined;
            });
    }
    return refreshRequest;
}

function isAuthEndpoint(url: string): boolean {
    const path = url.split('?')[0] ?? url;
    return ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'].some(
        (endpoint) => path.endsWith(endpoint),
    );
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!axios.isAxiosError(error)) return Promise.reject(error);

        const status = error.response?.status;
        const config = error.config as InternalAxiosRequestConfig | undefined;
        const url = config?.url ?? '';

        if (status === 401 && config && !config.authRetry && !isAuthEndpoint(url)) {
            config.authRetry = true;
            try {
                await refreshSession();
                return api(config);
            } catch {
                unauthorizedHandler?.();
                return Promise.reject(error);
            }
        }

        if (status === 401 && !isAuthEndpoint(url)) {
            unauthorizedHandler?.()
        }

        return Promise.reject(error)
    },
);

let unauthorizedHandler: (() => void) | undefined

export function onUnauthorized(handler: () => void) {
    unauthorizedHandler = handler
}
export default api