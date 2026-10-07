import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://localhost:7159/api",
    headers: {
        "Content-Type": "application/json"
    }
});

export const configurarToken = (token) => {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
        delete api.defaults.headers.common.Authorization
    }
}

let manejadorNoAutorizado = null

export const configurarManejadorNoAutorizado = (manejador) => {
    manejadorNoAutorizado = manejador
}

api.interceptors.response.use(
    (respuesta) => respuesta,
    (error) => {
        const esLogin = error.config?.url?.includes('/autenticacion/login')

        if (
            error.response?.status === 401 &&
            !esLogin &&
            manejadorNoAutorizado
        ) {
            manejadorNoAutorizado()
        }

        return Promise.reject(error)
    }
)

export default api;
