import { useEffect, useState } from 'react'
import api from '../servicios/api'

function Expedientes() {

    const [expedientes, setExpedientes] = useState([])
    const [pacientes, setPacientes] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [expedienteEditando, setExpedienteEditando] = useState(null)

    const [formulario, setFormulario] = useState({
        idPaciente: '',
        observacionesGenerales: ''
    })

    const [mensaje, setMensaje] = useState('')
    const [errorRegistro, setErrorRegistro] = useState('')

    useEffect(() => {
        const obtenerExpedientes = async () => {
            try {
                const [respuestaExpedientes, respuestaPacientes] = await Promise.all([
                    api.get('/expedientes'),
                    api.get('/pacientes')
                ])

                setExpedientes(respuestaExpedientes.data)
                setPacientes(
                    respuestaPacientes.data.filter(paciente => paciente.activo)
                )
            } catch (error) {
                setError('No fue posible obtener los expedientes.')
            } finally {
                setCargando(false)
            }
        }

        obtenerExpedientes()
    }, [])

    const manejarCambio = (e) => {
        const { name, value } = e.target

        setFormulario({
            ...formulario,
            [name]: value
        })
    }

    const iniciarEdicion = (expediente) => {
        setExpedienteEditando(expediente)

        setFormulario({
            idPaciente: expediente.idPaciente,
            observacionesGenerales:
                expediente.observacionesGenerales || ''
        })

        setMensaje('')
        setErrorRegistro('')
    }

    const registrarExpediente = async (e) => {
        e.preventDefault()

        setMensaje('')
        setErrorRegistro('')

        try {
            await api.post('/expedientes', {
                idPaciente: Number(formulario.idPaciente),
                observacionesGenerales:
                    formulario.observacionesGenerales.trim() === ''
                        ? null
                        : formulario.observacionesGenerales
            })

            const respuesta = await api.get('/expedientes')
            setExpedientes(respuesta.data)

            setFormulario({
                idPaciente: '',
                observacionesGenerales: ''
            })

            setMensaje('Expediente creado correctamente.')
        } catch (error) {
            setErrorRegistro(
                error.response?.data ||
                'No fue posible crear el expediente.'
            )
        }
    }

    const actualizarExpediente = async (e) => {
        e.preventDefault()

        setMensaje('')
        setErrorRegistro('')

        try {
            await api.put(
                `/expedientes/${expedienteEditando.idExpediente}`,
                {
                    observacionesGenerales:
                        formulario.observacionesGenerales.trim() === ''
                            ? null
                            : formulario.observacionesGenerales
                }
            )

            const respuesta = await api.get('/expedientes')
            setExpedientes(respuesta.data)

            setExpedienteEditando(null)

            setFormulario({
                idPaciente: '',
                observacionesGenerales: ''
            })

            setMensaje('Expediente actualizado correctamente.')
        } catch (error) {
            setErrorRegistro(
                typeof error.response?.data === 'string'
                    ? error.response.data
                    : 'No fue posible actualizar el expediente.'
            )
        }
    }

    return (
        <div>
            <h2>Expedientes médicos</h2>
            <p className="text-muted">
                Gestión de expedientes médicos.
            </p>
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">
                        Crear expediente
                    </h5>

                    <form onSubmit={expedienteEditando? actualizarExpediente: registrarExpediente}>
                        <div className="mb-3">
                            <label className="form-label">
                                Paciente
                            </label>

                            <select
                                className="form-select"
                                name="idPaciente"
                                value={formulario.idPaciente}
                                onChange={manejarCambio}
                                required
                                disabled={expedienteEditando !== null}
                            >
                                <option value="">
                                    Seleccione un paciente
                                </option>

                                {pacientes.map((paciente) => (
                                    <option
                                        key={paciente.idPaciente}
                                        value={paciente.idPaciente}
                                    >
                                        {paciente.nombres} {paciente.apellidos}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Observaciones generales
                            </label>

                            <textarea
                                className="form-control"
                                name="observacionesGenerales"
                                value={formulario.observacionesGenerales}
                                onChange={manejarCambio}
                                rows="3"
                                placeholder="Ingrese observaciones generales"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {expedienteEditando
                                ? 'Guardar cambios'
                                : 'Crear expediente'}
                        </button>
                    </form>

                    {mensaje && (
                        <div className="alert alert-success mt-3 mb-0">
                            {mensaje}
                        </div>
                    )}

                    {errorRegistro && (
                        <div className="alert alert-danger mt-3 mb-0">
                            {typeof errorRegistro === 'string'
                                ? errorRegistro
                                : 'No fue posible crear el expediente.'}
                        </div>
                    )}
                </div>
            </div>

            {cargando && (
                <div className="alert alert-info">
                    Cargando expedientes...
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {!cargando && !error && (
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title mb-3">
                            Expedientes registrados
                        </h5>

                        <div className="table-responsive">
                            <table className="table table-striped align-middle">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Paciente</th>
                                        <th>Fecha de creación</th>
                                        <th>Observaciones generales</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {expedientes.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="text-center text-muted"
                                            >
                                                No hay expedientes registrados.
                                            </td>
                                        </tr>
                                    ) : (
                                        expedientes.map((expediente) => (
                                            <tr key={expediente.idExpediente}>
                                                <td>
                                                    {expediente.idExpediente}
                                                </td>

                                                <td>
                                                    {expediente.nombrePaciente || 'Sin información'}
                                                </td>

                                                <td>
                                                    {new Date(
                                                        expediente.fechaCreacion
                                                    ).toLocaleString()}
                                                </td>

                                                <td>
                                                    {expediente.observacionesGenerales || 'Sin observaciones'}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-warning"
                                                        onClick={() => iniciarEdicion(expediente)}
                                                    >
                                                        Editar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Expedientes