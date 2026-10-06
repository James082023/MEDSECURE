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

    const obtenerMensajeError = (
        error,
        mensajePredeterminado
    ) => {
        const datos = error.response?.data

        if (typeof datos === 'string') {
            return datos
        }

        if (datos?.mensaje) {
            return datos.mensaje
        }

        return mensajePredeterminado
    }

    const cargarDatos = async () => {
        const [respuestaExpedientes, respuestaPacientes] =
            await Promise.all([
                api.get('/expedientes'),
                api.get('/pacientes')
            ])

        setExpedientes(respuestaExpedientes.data)

        setPacientes(
            respuestaPacientes.data.filter(
                paciente => paciente.activo
            )
        )
    }

    useEffect(() => {
        const obtenerDatos = async () => {
            try {
                await cargarDatos()
            } catch {
                setError(
                    'No fue posible obtener los expedientes.'
                )
            } finally {
                setCargando(false)
            }
        }

        obtenerDatos()
    }, [])

    const manejarCambio = (e) => {
        const { name, value } = e.target

        setFormulario({
            ...formulario,
            [name]: value
        })
    }

    const limpiarFormulario = () => {
        setFormulario({
            idPaciente: '',
            observacionesGenerales: ''
        })

        setExpedienteEditando(null)
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

    const cancelarEdicion = () => {
        limpiarFormulario()
        setMensaje('')
        setErrorRegistro('')
    }

    const registrarExpediente = async (e) => {
        e.preventDefault()

        setMensaje('')
        setErrorRegistro('')

        if (!formulario.idPaciente) {
            setErrorRegistro(
                'Debe seleccionar un paciente.'
            )
            return
        }

        try {
            const respuesta = await api.post(
                '/expedientes',
                {
                    idPaciente: Number(
                        formulario.idPaciente
                    ),
                    observacionesGenerales:
                        formulario.observacionesGenerales
                            .trim() === ''
                            ? null
                            : formulario
                                .observacionesGenerales
                                .trim()
                }
            )

            await cargarDatos()

            limpiarFormulario()

            setMensaje(
                respuesta.data?.mensaje ||
                'Expediente creado correctamente.'
            )
        } catch (error) {
            setErrorRegistro(
                obtenerMensajeError(
                    error,
                    'No fue posible crear el expediente.'
                )
            )
        }
    }

    const actualizarExpediente = async (e) => {
        e.preventDefault()

        if (!expedienteEditando) {
            return
        }

        setMensaje('')
        setErrorRegistro('')

        try {
            const respuesta = await api.put(
                `/expedientes/${expedienteEditando.idExpediente}`,
                {
                    observacionesGenerales:
                        formulario.observacionesGenerales
                            .trim() === ''
                            ? null
                            : formulario
                                .observacionesGenerales
                                .trim()
                }
            )

            await cargarDatos()

            limpiarFormulario()

            setMensaje(
                respuesta.data?.mensaje ||
                'Expediente actualizado correctamente.'
            )
        } catch (error) {
            setErrorRegistro(
                obtenerMensajeError(
                    error,
                    'No fue posible actualizar el expediente.'
                )
            )
        }
    }

    const idsPacientesConExpediente = new Set(
        expedientes.map(
            expediente => expediente.idPaciente
        )
    )

    const pacientesDisponibles = pacientes.filter(
        paciente =>
            !idsPacientesConExpediente.has(
                paciente.idPaciente
            )
    )

    const pacientesSelector = expedienteEditando
        ? pacientes.filter(
            paciente =>
                paciente.idPaciente ===
                expedienteEditando.idPaciente
        )
        : pacientesDisponibles

    return (
        <div>
            <h2>Expedientes médicos</h2>

            <p className="text-muted">
                Gestión de expedientes médicos.
            </p>

            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">
                        {expedienteEditando
                            ? 'Editar expediente'
                            : 'Crear expediente'}
                    </h5>

                    <form
                        onSubmit={
                            expedienteEditando
                                ? actualizarExpediente
                                : registrarExpediente
                        }
                    >
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
                                disabled={
                                    expedienteEditando !== null
                                }
                            >
                                <option value="">
                                    Seleccione un paciente
                                </option>

                                {pacientesSelector.map(
                                    paciente => (
                                        <option
                                            key={
                                                paciente.idPaciente
                                            }
                                            value={
                                                paciente.idPaciente
                                            }
                                        >
                                            {paciente.nombres}{' '}
                                            {paciente.apellidos}
                                        </option>
                                    )
                                )}
                            </select>

                            {!expedienteEditando &&
                                pacientesDisponibles.length === 0 && (
                                    <div className="form-text">
                                        No hay pacientes activos sin expediente.
                                    </div>
                                )}
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Observaciones generales
                            </label>

                            <textarea
                                className="form-control"
                                name="observacionesGenerales"
                                value={
                                    formulario.observacionesGenerales
                                }
                                onChange={manejarCambio}
                                rows="3"
                                maxLength="1000"
                                placeholder="Ingrese observaciones generales"
                            />

                            <div className="form-text text-end">
                                {
                                    formulario
                                        .observacionesGenerales
                                        .length
                                }/1000
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={
                                    !expedienteEditando &&
                                    pacientesDisponibles.length === 0
                                }
                            >
                                {expedienteEditando
                                    ? 'Guardar cambios'
                                    : 'Crear expediente'}
                            </button>

                            {expedienteEditando && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cancelarEdicion}
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>

                    {mensaje && (
                        <div className="alert alert-success mt-3 mb-0">
                            {mensaje}
                        </div>
                    )}

                    {errorRegistro && (
                        <div className="alert alert-danger mt-3 mb-0">
                            {errorRegistro}
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
                                        <th>
                                            Fecha de creación
                                        </th>
                                        <th>
                                            Observaciones generales
                                        </th>
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
                                        expedientes.map(
                                            expediente => (
                                                <tr
                                                    key={
                                                        expediente.idExpediente
                                                    }
                                                >
                                                    <td>
                                                        {
                                                            expediente.idExpediente
                                                        }
                                                    </td>

                                                    <td>
                                                        {expediente.nombrePaciente ||
                                                            'Sin información'}
                                                    </td>

                                                    <td>
                                                        {new Date(
                                                            expediente.fechaCreacion
                                                        ).toLocaleString()}
                                                    </td>

                                                    <td>
                                                        {expediente.observacionesGenerales ||
                                                            'Sin observaciones'}
                                                    </td>

                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-warning"
                                                            onClick={() =>
                                                                iniciarEdicion(
                                                                    expediente
                                                                )
                                                            }
                                                            disabled={
                                                                expediente.pacienteActivo ===
                                                                false
                                                            }
                                                        >
                                                            Editar
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        )
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