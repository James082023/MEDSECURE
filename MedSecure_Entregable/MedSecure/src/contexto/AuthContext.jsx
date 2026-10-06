import { createContext, useContext, useEffect, useState } from 'react'
import {
    configurarToken,
    configurarManejadorNoAutorizado
} from '../servicios/api'

const AuthContext = createContext(null)

const CLAVE_SESION = 'medsecure_sesion'

const obtenerSesionGuardada = () => {
    try {
        const sesion = sessionStorage.getItem(CLAVE_SESION)

        if (!sesion) {
            return null
        }

        const datos = JSON.parse(sesion)

        if (
            !datos.token ||
            !Array.isArray(datos.roles) ||
            !datos.idUsuario
        ) {
            sessionStorage.removeItem(CLAVE_SESION)
            return null
        }

        return datos
    } catch {
        sessionStorage.removeItem(CLAVE_SESION)
        return null
    }
}

const sesionInicial = obtenerSesionGuardada()

configurarToken(sesionInicial?.token || null)

export function AuthProvider({ children }) {
    const [autenticado, setAutenticado] = useState(
        sesionInicial !== null
    )

    const [token, setToken] = useState(
        sesionInicial?.token || null
    )

    const [roles, setRoles] = useState(
        sesionInicial?.roles || []
    )

    const [idUsuario, setIdUsuario] = useState(
        sesionInicial?.idUsuario || null
    )

    const [debeCambiarClave, setDebeCambiarClave] = useState(
        sesionInicial?.debeCambiarClave === true
    )

    const [mensajeSesion, setMensajeSesion] = useState('')

    useEffect(() => {
        configurarToken(token)
    }, [token])

    useEffect(() => {
        if (
            autenticado &&
            token &&
            idUsuario
        ) {
            sessionStorage.setItem(
                CLAVE_SESION,
                JSON.stringify({
                    token,
                    roles,
                    idUsuario,
                    debeCambiarClave
                })
            )
        }
    }, [
        autenticado,
        token,
        roles,
        idUsuario,
        debeCambiarClave
    ])

    const cerrarSesion = () => {
        sessionStorage.removeItem(CLAVE_SESION)
        configurarToken(null)
        setToken(null)
        setRoles([])
        setIdUsuario(null)
        setDebeCambiarClave(false)
        setAutenticado(false)
    }

    useEffect(() => {
        configurarManejadorNoAutorizado(cerrarSesion)

        return () => {
            configurarManejadorNoAutorizado(null)
        }
    }, [])

    return (
        <AuthContext.Provider
            value={{
                autenticado,
                setAutenticado,
                token,
                setToken,
                roles,
                setRoles,
                idUsuario,
                setIdUsuario,
                debeCambiarClave,
                setDebeCambiarClave,
                cerrarSesion,
                mensajeSesion,
                setMensajeSesion
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}