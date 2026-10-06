import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'

function DiseñoPrincipal() {
    const navegar = useNavigate()

    const {
        roles,
        setAutenticado,
        setToken,
        setRoles,
        setIdUsuario
    } = useAuth()

    const esAdministrador = roles.includes('Administrador')
    const esMedico = roles.includes('Medico')

    const tieneAccesoClinico =
        esAdministrador || esMedico

    const cerrarSesion = () => {
        setToken(null)
        setAutenticado(false)
        setIdUsuario(null)
        setRoles([])
        navegar('/login')
    }

    return (
        <div className="d-flex min-vh-100">
            <aside
                className="bg-dark text-white p-3"
                style={{
                    width: '250px',
                    height: '100vh',
                    position: 'sticky',
                    top: 0,
                    flexShrink: 0
                }}
            >
                <h3 className="mb-4">
                    <i className="bi bi-shield-check me-2"></i>
                    MedSecure
                </h3>

                <div className="nav flex-column">
                    <Link
                        to="/"
                        className="nav-link text-white mb-2"
                    >
                        <i className="bi bi-house me-2"></i>
                        Inicio
                    </Link>

                    <Link
                        to="/pacientes"
                        className="nav-link text-white mb-2"
                    >
                        <i className="bi bi-people me-2"></i>
                        Pacientes
                    </Link>

                    {tieneAccesoClinico && (
                        <Link
                            to="/expedientes"
                            className="nav-link text-white mb-2"
                        >
                            <i className="bi bi-file-medical me-2"></i>
                            Expedientes
                        </Link>
                    )}

                    {tieneAccesoClinico && (
                        <Link
                            to="/consultas-medicas"
                            className="nav-link text-white mb-2"
                        >
                            <i className="bi bi-clipboard2-pulse me-2"></i>
                            Consultas médicas
                        </Link>
                    )}

                    {esAdministrador && (
                        <Link
                            to="/usuarios"
                            className="nav-link text-white mb-2"
                        >
                            <i className="bi bi-person-gear me-2"></i>
                            Usuarios y roles
                        </Link>
                    )}

                    {esAdministrador && (
                        <Link
                            to="/auditoria"
                            className="nav-link text-white mb-2"
                        >
                            <i className="bi bi-journal-text me-2"></i>
                            Auditoría
                        </Link>
                    )}

                    <button
                        type="button"
                        className="btn btn-outline-light mt-3"
                        onClick={cerrarSesion}
                    >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <main className="flex-grow-1 bg-light">
                <header className="bg-white border-bottom p-3">
                    <h5 className="mb-0">
                        Sistema de Seguridad y Gestión Médica
                    </h5>
                </header>

                <section className="p-4">
                    <Outlet />
                </section>
            </main>
        </div>
    )
}

export default DiseñoPrincipal