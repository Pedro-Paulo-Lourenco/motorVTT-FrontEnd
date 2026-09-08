import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
})
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status
        const url = error.config?.url ?? ''

        const isAuthEndpoint =
            url.includes('/auth/login') ||
            url.includes('/auth/cadastrar') ||
            url.includes('/auth/me')

        if ((status === 401 || status === 403) && !isAuthEndpoint) {
            // Limpar a store e navegar para /login
            unauthorizedHandler?.()
        }

        return Promise.reject(error)
    },
)


let unauthorizedHandler: (() => void) | undefined

export function onUnauthorized(handler: () => void) {
    unauthorizedHandler = handler
}
export default api