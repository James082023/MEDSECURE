import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../servicios/api'
import { useAuth } from '../contexto/AuthContext'

function InicioSesion() {
    const [nombreUsuario, setNombreUsuario] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [mensajeError, setMensajeError] = useState('')
    const [cargando, setCargando] = useState(false)

    const navegar = useNavigate()

    const {
        setAutenticado,
        setToken,
        setRoles,
        setIdUsuario,
        setDebeCambiarClave
    } = useAuth()

    const iniciarSesion = async () => {
        setMensajeError('')

        if (!nombreUsuario.trim() || !contrasena) {
            setMensajeError(
                'Debe ingresar su usuario y contraseña.'
            )
            return
        }

        setCargando(true)

        try {
            const respuesta = await api.post(
                '/autenticacion/login',
                {
                    nombreUsuario: nombreUsuario.trim(),
                    contrasena
                }
            )

            if (respuesta.status === 200) {
                const cambioObligatorio =
                    respuesta.data.debeCambiarClave === true

                setToken(respuesta.data.token)
                setRoles(respuesta.data.roles || [])
                setIdUsuario(respuesta.data.idUsuario)
                setDebeCambiarClave(cambioObligatorio)
                setAutenticado(true)

                if (cambioObligatorio) {
                    navegar('/cambiar-clave', {
                        replace: true
                    })
                } else {
                    navegar('/', {
                        replace: true
                    })
                }
            }
        } catch (error) {
            setMensajeError(
                error.response?.data?.mensaje ||
                'No fue posible iniciar sesión.'
            )
        } finally {
            setCargando(false)
        }
    }

    const manejarTecla = (e) => {
        if (e.key === 'Enter' && !cargando) {
            iniciarSesion()
        }
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card shadow">
                        <div className="card-body p-4">
                            <h3 className="text-center mb-4">
                                <i className="bi bi-shield-lock me-2"></i>
                                MedSecure
                            </h3>

                            <h5 className="text-center mb-4">
                                Inicio de sesión
                            </h5>

                            <div className="mb-3">
                                <label className="form-label">
                                    Usuario
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ingrese su usuario"
                                    value={nombreUsuario}
                                    onChange={(e) =>
                                        setNombreUsuario(
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={manejarTecla}
                                    autoComplete="username"
                                    disabled={cargando}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    Contraseña
                                </label>

                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Ingrese su contraseña"
                                    value={contrasena}
                                    onChange={(e) =>
                                        setContrasena(
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={manejarTecla}
                                    autoComplete="current-password"
                                    disabled={cargando}
                                />
                            </div>

                            {mensajeError && (
                                <div
                                    className="alert alert-danger"
                                    role="alert"
                                >
                                    {mensajeError}
                                </div>
                            )}

                            <button
                                type="button"
                                className="btn btn-primary w-100"
                                onClick={iniciarSesion}
                                disabled={cargando}
                            >
                                {cargando
                                    ? 'Iniciando sesión...'
                                    : 'Iniciar sesión'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InicioSesion