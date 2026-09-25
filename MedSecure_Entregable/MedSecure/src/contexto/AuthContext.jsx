import { createContext, useContext, useEffect, useState } from 'react'
import {configurarToken, configurarManejadorNoAutorizado} from '../servicios/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [autenticado, setAutenticado] = useState(false)
    const [token, setToken] = useState(null)
    const [roles, setRoles] = useState([])
    const [idUsuario, setIdUsuario] = useState(null)
    const [mensajeSesion, setMensajeSesion] = useState('')

    useEffect(() => {
    configurarToken(token)
    }, [token])

    const cerrarSesion = () => {
        setToken(null)
        setRoles([])
        setIdUsuario(null)
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