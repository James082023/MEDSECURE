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
    const { setAutenticado, setToken, setRoles, setIdUsuario } = useAuth()
    const iniciarSesion = async () => {
    setMensajeError('')
    setCargando(true)

        try {
            const respuesta = await api.post('/autenticacion/login', {
                nombreUsuario: nombreUsuario,
                contrasena: contrasena
            })
            if (respuesta.status === 200) {
                setToken(respuesta.data.token)
                setRoles(respuesta.data.roles || [])
                setIdUsuario(respuesta.data.idUsuario)
                setAutenticado(true)
                navegar('/')
            }

        } catch (error) {
            console.error('Error al iniciar sesión:', error)

            setMensajeError(
                error.response?.data?.mensaje ||
                'No fue posible iniciar sesión.'
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
                                    onChange={(e) => setNombreUsuario(e.target.value)}
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
                                    onChange={(e) => setContrasena(e.target.value)}
                                />
                            </div>

                            {mensajeError && (
                                <div className="alert alert-danger" role="alert">
                                    {mensajeError}
                                </div>
                            )}

                            <button
                                className="btn btn-primary w-100"
                                onClick={iniciarSesion}
                                disabled={cargando}
                            >
                                {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    )
}

export default InicioSesion