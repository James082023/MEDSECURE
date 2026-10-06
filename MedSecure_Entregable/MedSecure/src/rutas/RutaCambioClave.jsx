import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'

function RutaCambioClave() {
    const { debeCambiarClave } = useAuth()

    if (debeCambiarClave) {
        return <Navigate to="/cambiar-clave" replace />
    }

    return <Outlet />
}

export default RutaCambioClave