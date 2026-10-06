import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../servicios/api'
import { useAuth } from '../contexto/AuthContext'

function CambiarClave() {
    const [contrasenaActual, setContrasenaActual] = useState('')
    const [contrasenaNueva, setContrasenaNueva] = useState('')
    const [confirmarContrasena, setConfirmarContrasena] = useState('')
    const [mensajeError, setMensajeError] = useState('')
    const [cargando, setCargando] = useState(false)

    const navegar = useNavigate()

    const {
        setToken,
        setRoles,
        setIdUsuario,
        setDebeCambiarClave,
        setAutenticado,
        setMensajeSesion
    } = useAuth()

    const limpiarSesion = () => {
        setToken(null)
        setRoles([])
        setIdUsuario(null)
        setDebeCambiarClave(false)
        setAutenticado(false)
    }

    const cambiarClave = async (e) => {
        e.preventDefault()

        setMensajeError('')

        if (
            !contrasenaActual ||
            !contrasenaNueva ||
            !confirmarContrasena
        ) {
            setMensajeError(
                'Debe completar todos los campos.'
            )
            return
        }

        if (contrasenaNueva.length < 8) {
            setMensajeError(
                'La nueva contraseña debe tener al menos 8 caracteres.'
            )
            return
        }

        if (contrasenaNueva !== confirmarContrasena) {
            setMensajeError(
                'La nueva contraseña y su confirmación no coinciden.'
            )
            return
        }

        if (contrasenaActual === contrasenaNueva) {
            setMensajeError(
                'La nueva contraseña debe ser diferente a la contraseña actual.'
            )
            return
        }

        setCargando(true)

        try {
            await api.post(
                '/autenticacion/cambiar-clave',
                {
                    contrasenaActual,
                    contrasenaNueva,
                    confirmarContrasena
                }
            )

            limpiarSesion()

            setMensajeSesion(
                'Contraseña actualizada correctamente. Inicie sesión con su nueva contraseña.'
            )

            navegar('/login', {
                replace: true
            })
        } catch (error) {
            setMensajeError(
                error.response?.data?.mensaje ||
                error.response?.data ||
                'No fue posible cambiar la contraseña.'
            )
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card shadow">
                        <div className="card-body p-4">
                            <h3 className="text-center mb-3">
                                <i className="bi bi-shield-lock me-2"></i>
                                MedSecure
                            </h3>

                            <h5 className="text-center mb-3">
                                Cambio de contraseña
                            </h5>

                            <div className="alert alert-warning">
                                Debe establecer una nueva contraseña antes de continuar al sistema.
                            </div>

                            <form onSubmit={cambiarClave}>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Contraseña actual
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        value={contrasenaActual}
                                        onChange={(e) =>
                                            setContrasenaActual(
                                                e.target.value
                                            )
                                        }
                                        autoComplete="current-password"
                                        disabled={cargando}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        Nueva contraseña
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        value={contrasenaNueva}
                                        onChange={(e) =>
                                            setContrasenaNueva(
                                                e.target.value
                                            )
                                        }
                                        autoComplete="new-password"
                                        minLength="8"
                                        disabled={cargando}
                                        required
                                    />

                                    <div className="form-text">
                                        Debe contener al menos 8 caracteres.
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        Confirmar nueva contraseña
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        value={confirmarContrasena}
                                        onChange={(e) =>
                                            setConfirmarContrasena(
                                                e.target.value
                                            )
                                        }
                                        autoComplete="new-password"
                                        minLength="8"
                                        disabled={cargando}
                                        required
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
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={cargando}
                                >
                                    {cargando
                                        ? 'Actualizando contraseña...'
                                        : 'Cambiar contraseña'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CambiarClave