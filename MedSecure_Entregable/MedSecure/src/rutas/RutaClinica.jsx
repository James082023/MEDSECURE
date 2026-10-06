import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'

function RutaClinica() {
    const { roles } = useAuth()

    const tieneAcceso =
        roles.includes('Administrador') ||
        roles.includes('Medico')

    if (!tieneAcceso) {
        return <Navigate to="/pacientes" replace />
    }

    return <Outlet />
}

export default RutaClinica