import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'

function RutaAdministrador() {

    const { roles } = useAuth()
    const esAdministrador = roles.includes('Administrador')

    if (!esAdministrador) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default RutaAdministrador