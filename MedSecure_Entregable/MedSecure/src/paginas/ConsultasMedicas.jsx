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
    
    useEffect(() => {
        const obtenerConsultas = async () => {
            try {
                const [respuestaConsultas, respuestaExpedientes] = await Promise.all([
                    api.get('/consultas-medicas'),
                    api.get('/expedientes')
                ])

                setConsultas(respuestaConsultas.data)
                setExpedientes(respuestaExpedientes.data)
            } catch (error) {
                setError('No fue posible obtener las consultas médicas.')
            } finally {
                setCargando(false)
            }
        }

        obtenerConsultas()
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
            resultadosExamenes: consulta.resultadosExamenes || ''
        })

        setMensaje('')
        setErrorRegistro('')
    }

    const registrarConsulta = async (e) => {
        e.preventDefault()

        setMensaje('')
        setErrorRegistro('')

        try {
            await api.post('/consultas-medicas', {
                idExpediente: Number(formulario.idExpediente),

                motivoConsulta:
                    formulario.motivoConsulta.trim() === ''
                        ? null
                        : formulario.motivoConsulta,

                diagnostico:
                    formulario.diagnostico.trim() === ''
                        ? null
                        : formulario.diagnostico,

                tratamiento:
                    formulario.tratamiento.trim() === ''
                        ? null
                        : formulario.tratamiento,

                medicamentos:
                    formulario.medicamentos.trim() === ''
                        ? null
                        : formulario.medicamentos,

                observaciones:
                    formulario.observaciones.trim() === ''
                        ? null
                        : formulario.observaciones,

                resultadosExamenes:
                    formulario.resultadosExamenes.trim() === ''
                        ? null
                        : formulario.resultadosExamenes
            })

            const respuesta = await api.get('/consultas-medicas')
            setConsultas(respuesta.data)

            setFormulario({
                idExpediente: '',
                motivoConsulta: '',
                diagnostico: '',
                tratamiento: '',
                medicamentos: '',
                observaciones: '',
                resultadosExamenes: ''
            })

            setMensaje('Consulta médica registrada correctamente.')
        } catch (error) {
            setErrorRegistro(
                typeof error.response?.data === 'string'
                    ? error.response.data
                    : 'No fue posible registrar la consulta médica.'
            )
        }
    }

    const actualizarConsulta = async (e) => {
        e.preventDefault()

        setMensaje('')
        setErrorRegistro('')

        try {
            await api.put(
                `/consultas-medicas/${consultaEditando.idConsulta}`,
                {
                    motivoConsulta:
                        formulario.motivoConsulta.trim() === ''
                            ? null
                            : formulario.motivoConsulta,

                    diagnostico:
                        formulario.diagnostico.trim() === ''
                            ? null
                            : formulario.diagnostico,

                    tratamiento:
                        formulario.tratamiento.trim() === ''
                            ? null
                            : formulario.tratamiento,

                    medicamentos:
                        formulario.medicamentos.trim() === ''
                            ? null
                            : formulario.medicamentos,

                    observaciones:
                        formulario.observaciones.trim() === ''
                            ? null
                            : formulario.observaciones,

                    resultadosExamenes:
                        formulario.resultadosExamenes.trim() === ''
                            ? null
                            : formulario.resultadosExamenes
                }
            )

            const respuesta = await api.get('/consultas-medicas')
            setConsultas(respuesta.data)

            setConsultaEditando(null)

            setFormulario({
                idExpediente: '',
                motivoConsulta: '',
                diagnostico: '',
                tratamiento: '',
                medicamentos: '',
                observaciones: '',
                resultadosExamenes: ''
            })

            setMensaje('Consulta médica actualizada correctamente.')
        } catch (error) {
            setErrorRegistro(
                typeof error.response?.data === 'string'
                    ? error.response.data
                    : 'No fue posible actualizar la consulta médica.'
            )
        }
    }

    return (
        <div>
            <h2>Consultas médicas</h2>

            <p className="text-muted">
                Registro y seguimiento de consultas médicas.
            </p>

            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">
                        Registrar consulta médica
                    </h5>

                    <form onSubmit={consultaEditando? actualizarConsulta: registrarConsulta}>
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
                                disabled={consultaEditando !== null}
                            >
                                <option value="">
                                    Seleccione un expediente
                                </option>

                                {expedientes.map((expediente) => (
                                    <option
                                        key={expediente.idExpediente}
                                        value={expediente.idExpediente}
                                    >
                                        Expediente #{expediente.idExpediente} - {expediente.nombrePaciente}
                                    </option>
                                ))}
                            </select>
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
                            />
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
                            />
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
                            />
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
                            />
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
                            />
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
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {consultaEditando
                                ? 'Guardar cambios'
                                : 'Registrar consulta'}
                        </button>

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
                                        <th>Resultados de exámenes</th>
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
                                        consultas.map((consulta) => (
                                            <tr key={consulta.idConsulta}>
                                                <td>{consulta.idConsulta}</td>

                                                <td>
                                                    {consulta.nombrePaciente || 'Sin información'}
                                                </td>

                                                <td>
                                                    #{consulta.idExpediente}
                                                </td>

                                                <td>
                                                    {consulta.nombreUsuario || 'Sin información'}
                                                </td>

                                                <td>
                                                    {new Date(
                                                        consulta.fechaConsulta
                                                    ).toLocaleString()}
                                                </td>

                                                <td>
                                                    {consulta.motivoConsulta || '—'}
                                                </td>

                                                <td>
                                                    {consulta.diagnostico || '—'}
                                                </td>

                                                <td>
                                                    {consulta.tratamiento || '—'}
                                                </td>

                                                <td>
                                                    {consulta.medicamentos || '—'}
                                                </td>

                                                <td>
                                                    {consulta.observaciones || '—'}
                                                </td>

                                                <td>
                                                    {consulta.resultadosExamenes || '—'}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-warning"
                                                        onClick={() => iniciarEdicion(consulta)}
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

export default ConsultasMedicas