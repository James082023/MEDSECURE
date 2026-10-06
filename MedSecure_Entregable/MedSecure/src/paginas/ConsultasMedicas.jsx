import { useEffect, useState } from 'react'
import api from '../servicios/api'

function ConsultasMedicas() {
    const [consultas, setConsultas] = useState([])
    const [expedientes, setExpedientes] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [consultaEditando, setConsultaEditando] = useState(null)

    const [formulario, setFormulario] = useState({
        idExpediente: '',
        motivoConsulta: '',
        diagnostico: '',
        tratamiento: '',
        medicamentos: '',
        observaciones: '',
        resultadosExamenes: ''
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

    const limpiarFormulario = () => {
        setFormulario({
            idExpediente: '',
            motivoConsulta: '',
            diagnostico: '',
            tratamiento: '',
            medicamentos: '',
            observaciones: '',
            resultadosExamenes: ''
        })

        setConsultaEditando(null)
    }

    const cargarDatos = async () => {
        const [
            respuestaConsultas,
            respuestaExpedientes
        ] = await Promise.all([
            api.get('/consultas-medicas'),
            api.get('/expedientes')
        ])

        setConsultas(respuestaConsultas.data)
        setExpedientes(respuestaExpedientes.data)
    }

    useEffect(() => {
        const obtenerDatos = async () => {
            try {
                await cargarDatos()
            } catch {
                setError(
                    'No fue posible obtener las consultas médicas.'
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

    const iniciarEdicion = (consulta) => {
        setConsultaEditando(consulta)

        setFormulario({
            idExpediente: consulta.idExpediente,
            motivoConsulta: consulta.motivoConsulta || '',
            diagnostico: consulta.diagnostico || '',
            tratamiento: consulta.tratamiento || '',
            medicamentos: consulta.medicamentos || '',
            observaciones: consulta.observaciones || '',
            resultadosExamenes:
                consulta.resultadosExamenes || ''
        })

        setMensaje('')
        setErrorRegistro('')
    }

    const cancelarEdicion = () => {
        limpiarFormulario()
        setMensaje('')
        setErrorRegistro('')
    }

    const normalizarTexto = (valor) => {
        const texto = valor.trim()

        return texto === '' ? null : texto
    }

    const registrarConsulta = async (e) => {
        e.preventDefault()

        setMensaje('')
        setErrorRegistro('')

        if (!formulario.idExpediente) {
            setErrorRegistro(
                'Debe seleccionar un expediente.'
            )
            return
        }

        try {
            const respuesta = await api.post(
                '/consultas-medicas',
                {
                    idExpediente: Number(
                        formulario.idExpediente
                    ),
                    motivoConsulta:
                        normalizarTexto(
                            formulario.motivoConsulta
                        ),
                    diagnostico:
                        normalizarTexto(
                            formulario.diagnostico
                        ),
                    tratamiento:
                        normalizarTexto(
                            formulario.tratamiento
                        ),
                    medicamentos:
                        normalizarTexto(
                            formulario.medicamentos
                        ),
                    observaciones:
                        normalizarTexto(
                            formulario.observaciones
                        ),
                    resultadosExamenes:
                        normalizarTexto(
                            formulario.resultadosExamenes
                        )
                }
            )

            await cargarDatos()
            limpiarFormulario()

            setMensaje(
                respuesta.data?.mensaje ||
                'Consulta médica registrada correctamente.'
            )
        } catch (error) {
            setErrorRegistro(
                obtenerMensajeError(
                    error,
                    'No fue posible registrar la consulta médica.'
                )
            )
        }
    }

    const actualizarConsulta = async (e) => {
        e.preventDefault()

        if (!consultaEditando) {
            return
        }

        setMensaje('')
        setErrorRegistro('')

        try {
            const respuesta = await api.put(
                `/consultas-medicas/${consultaEditando.idConsulta}`,
                {
                    motivoConsulta:
                        normalizarTexto(
                            formulario.motivoConsulta
                        ),
                    diagnostico:
                        normalizarTexto(
                            formulario.diagnostico
                        ),
                    tratamiento:
                        normalizarTexto(
                            formulario.tratamiento
                        ),
                    medicamentos:
                        normalizarTexto(
                            formulario.medicamentos
                        ),
                    observaciones:
                        normalizarTexto(
                            formulario.observaciones
                        ),
                    resultadosExamenes:
                        normalizarTexto(
                            formulario.resultadosExamenes
                        )
                }
            )

            await cargarDatos()
            limpiarFormulario()

            setMensaje(
                respuesta.data?.mensaje ||
                'Consulta médica actualizada correctamente.'
            )
        } catch (error) {
            setErrorRegistro(
                obtenerMensajeError(
                    error,
                    'No fue posible actualizar la consulta médica.'
                )
            )
        }
    }

    const expedientesActivos = expedientes.filter(
        expediente => expediente.pacienteActivo
    )

    const expedientesSelector = consultaEditando
        ? expedientes.filter(
            expediente =>
                expediente.idExpediente ===
                consultaEditando.idExpediente
        )
        : expedientesActivos

    return (
        <div>
            <h2>Consultas médicas</h2>

            <p className="text-muted">
                Registro y seguimiento de consultas médicas.
            </p>

            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">
                        {consultaEditando
                            ? 'Editar consulta médica'
                            : 'Registrar consulta médica'}
                    </h5>

                    <form
                        onSubmit={
                            consultaEditando
                                ? actualizarConsulta
                                : registrarConsulta
                        }
                    >
                        <div className="mb-3">
                            <label className="form-label">
                                Expediente / Paciente
                            </label>

                            <select
                                className="form-select"
                                name="idExpediente"
                                value={formulario.idExpediente}
                                onChange={manejarCambio}
                                required
                                disabled={
                                    consultaEditando !== null
                                }
                            >
                                <option value="">
                                    Seleccione un expediente
                                </option>

                                {expedientesSelector.map(
                                    expediente => (
                                        <option
                                            key={
                                                expediente.idExpediente
                                            }
                                            value={
                                                expediente.idExpediente
                                            }
                                        >
                                            Expediente #
                                            {expediente.idExpediente}
                                            {' - '}
                                            {expediente.nombrePaciente}
                                        </option>
                                    )
                                )}
                            </select>

                            {!consultaEditando &&
                                expedientesActivos.length === 0 && (
                                    <div className="form-text">
                                        No hay expedientes de pacientes activos disponibles.
                                    </div>
                                )}
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Motivo de consulta
                            </label>

                            <textarea
                                className="form-control"
                                name="motivoConsulta"
                                value={formulario.motivoConsulta}
                                onChange={manejarCambio}
                                rows="2"
                                maxLength="500"
                            />

                            <div className="form-text text-end">
                                {formulario.motivoConsulta.length}/500
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Diagnóstico
                            </label>

                            <textarea
                                className="form-control"
                                name="diagnostico"
                                value={formulario.diagnostico}
                                onChange={manejarCambio}
                                rows="2"
                                maxLength="1000"
                            />

                            <div className="form-text text-end">
                                {formulario.diagnostico.length}/1000
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Tratamiento
                            </label>

                            <textarea
                                className="form-control"
                                name="tratamiento"
                                value={formulario.tratamiento}
                                onChange={manejarCambio}
                                rows="2"
                                maxLength="1000"
                            />

                            <div className="form-text text-end">
                                {formulario.tratamiento.length}/1000
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Medicamentos
                            </label>

                            <textarea
                                className="form-control"
                                name="medicamentos"
                                value={formulario.medicamentos}
                                onChange={manejarCambio}
                                rows="2"
                                maxLength="1000"
                            />

                            <div className="form-text text-end">
                                {formulario.medicamentos.length}/1000
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Observaciones
                            </label>

                            <textarea
                                className="form-control"
                                name="observaciones"
                                value={formulario.observaciones}
                                onChange={manejarCambio}
                                rows="2"
                                maxLength="1000"
                            />

                            <div className="form-text text-end">
                                {formulario.observaciones.length}/1000
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Resultados de exámenes
                            </label>

                            <textarea
                                className="form-control"
                                name="resultadosExamenes"
                                value={formulario.resultadosExamenes}
                                onChange={manejarCambio}
                                rows="2"
                                maxLength="2000"
                            />

                            <div className="form-text text-end">
                                {formulario.resultadosExamenes.length}/2000
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={
                                    !consultaEditando &&
                                    expedientesActivos.length === 0
                                }
                            >
                                {consultaEditando
                                    ? 'Guardar cambios'
                                    : 'Registrar consulta'}
                            </button>

                            {consultaEditando && (
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
                    Cargando consultas médicas...
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
                            Consultas médicas registradas
                        </h5>

                        <div className="table-responsive">
                            <table className="table table-striped align-middle">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Paciente</th>
                                        <th>Expediente</th>
                                        <th>Usuario</th>
                                        <th>Fecha</th>
                                        <th>Motivo</th>
                                        <th>Diagnóstico</th>
                                        <th>Tratamiento</th>
                                        <th>Medicamentos</th>
                                        <th>Observaciones</th>
                                        <th>
                                            Resultados de exámenes
                                        </th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {consultas.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="12"
                                                className="text-center text-muted"
                                            >
                                                No hay consultas médicas registradas.
                                            </td>
                                        </tr>
                                    ) : (
                                        consultas.map(
                                            consulta => {
                                                const expediente =
                                                    expedientes.find(
                                                        item =>
                                                            item.idExpediente ===
                                                            consulta.idExpediente
                                                    )

                                                const pacienteActivo =
                                                    expediente
                                                        ?.pacienteActivo !==
                                                    false

                                                return (
                                                    <tr
                                                        key={
                                                            consulta.idConsulta
                                                        }
                                                    >
                                                        <td>
                                                            {
                                                                consulta.idConsulta
                                                            }
                                                        </td>

                                                        <td>
                                                            {consulta.nombrePaciente ||
                                                                'Sin información'}
                                                        </td>

                                                        <td>
                                                            #
                                                            {
                                                                consulta.idExpediente
                                                            }
                                                        </td>

                                                        <td>
                                                            {consulta.nombreUsuario ||
                                                                'Sin información'}
                                                        </td>

                                                        <td>
                                                            {new Date(
                                                                consulta.fechaConsulta
                                                            ).toLocaleString()}
                                                        </td>

                                                        <td>
                                                            {consulta.motivoConsulta ||
                                                                '—'}
                                                        </td>

                                                        <td>
                                                            {consulta.diagnostico ||
                                                                '—'}
                                                        </td>

                                                        <td>
                                                            {consulta.tratamiento ||
                                                                '—'}
                                                        </td>

                                                        <td>
                                                            {consulta.medicamentos ||
                                                                '—'}
                                                        </td>

                                                        <td>
                                                            {consulta.observaciones ||
                                                                '—'}
                                                        </td>

                                                        <td>
                                                            {consulta.resultadosExamenes ||
                                                                '—'}
                                                        </td>

                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-warning"
                                                                onClick={() =>
                                                                    iniciarEdicion(
                                                                        consulta
                                                                    )
                                                                }
                                                                disabled={
                                                                    !pacienteActivo
                                                                }
                                                            >
                                                                Editar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            }
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

export default ConsultasMedicas