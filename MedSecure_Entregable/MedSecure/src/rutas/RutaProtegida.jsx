import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'

function RutaProtegida() {
    const { autenticado } = useAuth()

    if (!autenticado) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}

export default RutaProtegida