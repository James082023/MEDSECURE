import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexto/AuthContext'

function DiseñoPrincipal() {
    const navegar = useNavigate()
    const [menuAbierto, setMenuAbierto] = useState(false)

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

    const cerrarMenu = () => {
        setMenuAbierto(false)
    }

    const cerrarSesion = () => {
        setMenuAbierto(false)
        setToken(null)
        setAutenticado(false)
        setIdUsuario(null)
        setRoles([])
        navegar('/login')
    }

    return (
        <div className="min-vh-100 bg-light">
            <aside
                className={`sidebar-medsecure bg-dark text-white p-3 ${
                    menuAbierto ? 'activo' : ''
                }`}
            >
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <h3 className="mb-0">
                        <i className="bi bi-shield-check me-2"></i>
                        MedSecure
                    </h3>

                    <button
                        type="button"
                        className="btn btn-outline-light d-lg-none"
                        onClick={cerrarMenu}
                        aria-label="Cerrar menú"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="nav flex-column">
                    <Link
                        to="/"
                        className="nav-link text-white mb-2"
                        onClick={cerrarMenu}
                    >
                        <i className="bi bi-house me-2"></i>
                        Inicio
                    </Link>

                    <Link
                        to="/pacientes"
                        className="nav-link text-white mb-2"
                        onClick={cerrarMenu}
                    >
                        <i className="bi bi-people me-2"></i>
                        Pacientes
                    </Link>

                    {tieneAccesoClinico && (
                        <Link
                            to="/expedientes"
                            className="nav-link text-white mb-2"
                            onClick={cerrarMenu}
                        >
                            <i className="bi bi-file-medical me-2"></i>
                            Expedientes
                        </Link>
                    )}

                    {tieneAccesoClinico && (
                        <Link
                            to="/consultas-medicas"
                            className="nav-link text-white mb-2"
                            onClick={cerrarMenu}
                        >
                            <i className="bi bi-clipboard2-pulse me-2"></i>
                            Consultas médicas
                        </Link>
                    )}

                    {esAdministrador && (
                        <Link
                            to="/usuarios"
                            className="nav-link text-white mb-2"
                            onClick={cerrarMenu}
                        >
                            <i className="bi bi-person-gear me-2"></i>
                            Usuarios y roles
                        </Link>
                    )}

                    {esAdministrador && (
                        <Link
                            to="/auditoria"
                            className="nav-link text-white mb-2"
                            onClick={cerrarMenu}
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

            {menuAbierto && (
                <div
                    className="overlay-medsecure d-lg-none"
                    onClick={cerrarMenu}
                ></div>
            )}

            <main className="contenido-medsecure bg-light">
                <header className="bg-white border-bottom p-3">
                    <div className="d-flex align-items-center">
                        <button
                            type="button"
                            className="btn btn-dark d-lg-none me-3"
                            onClick={() => setMenuAbierto(true)}
                            aria-label="Abrir menú"
                        >
                            <i className="bi bi-list"></i>
                        </button>

                        <h5 className="mb-0 titulo-medsecure">
                            Sistema de Seguridad y Gestión Médica
                        </h5>
                    </div>
                </header>

                <section className="contenido-pagina">
                    <Outlet />
                </section>
            </main>
        </div>
    )
}

export default DiseñoPrincipal
