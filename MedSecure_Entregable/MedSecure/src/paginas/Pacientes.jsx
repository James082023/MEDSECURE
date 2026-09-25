import { useEffect, useState } from 'react'
import api from '../servicios/api'

function Pacientes() {

    const [pacientes, setPacientes] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    const [formulario, setFormulario] = useState({
        nombres: '',
        apellidos: '',
        documentoIdentidad: '',
        fechaNacimiento: '',
        sexo: '',
        telefono: '',
        correo: '',
        direccion: ''
    })

    const [mensaje, setMensaje] = useState('')
    const [errorRegistro, setErrorRegistro] = useState('')
    const [pacienteEditando, setPacienteEditando] = useState(null)

    const manejarCambio = (e) => {
    const { name, value } = e.target

        setFormulario({
                ...formulario,
                [name]: value
        })
    }

    const iniciarEdicion = (paciente) => {
        setPacienteEditando(paciente)

        setFormulario({
            nombres: paciente.nombres || '',
            apellidos: paciente.apellidos || '',
            documentoIdentidad: paciente.documentoIdentidad || '',
            fechaNacimiento: paciente.fechaNacimiento
                ? paciente.fechaNacimiento.substring(0, 10)
                : '',
            sexo: paciente.sexo || '',
            telefono: paciente.telefono || '',
            correo: paciente.correo || '',
            direccion: paciente.direccion || ''
        })

        setMensaje('')
        setErrorRegistro('')
    }

    const actualizarPaciente = async (e) => {
        e.preventDefault()

        if (!pacienteEditando) {
            return
        }

        setMensaje('')
        setErrorRegistro('')

        try {
            const datosPaciente = {
                ...formulario,
                fechaNacimiento:
                    formulario.fechaNacimiento || null
            }

            const respuesta = await api.put(
                `/pacientes/${pacienteEditando.idPaciente}`,
                datosPaciente
            )

            setMensaje(respuesta.data.mensaje)

            const respuestaPacientes = await api.get('/pacientes')
            setPacientes(respuestaPacientes.data)

            setPacienteEditando(null)

            setFormulario({
                nombres: '',
                apellidos: '',
                documentoIdentidad: '',
                fechaNacimiento: '',
                sexo: '',
                telefono: '',
                correo: '',
                direccion: ''
            })
        } catch (error) {
            setErrorRegistro(
                error.response?.data?.mensaje ||
                'No fue posible actualizar el paciente.'
            )
        }
    }

    const registrarPaciente = async (e) => {
        e.preventDefault()

        setMensaje('')
        setErrorRegistro('')

        try {
            const datosPaciente = {
                ...formulario,
                fechaNacimiento:
                    formulario.fechaNacimiento || null
            }

            const respuesta = await api.post(
                '/pacientes',
                datosPaciente
            )

            setMensaje(respuesta.data.mensaje)

            const respuestaPacientes = await api.get('/pacientes')
            setPacientes(respuestaPacientes.data)

            setFormulario({
                nombres: '',
                apellidos: '',
                documentoIdentidad: '',
                fechaNacimiento: '',
                sexo: '',
                telefono: '',
                correo: '',
                direccion: ''
            })
        } catch (error) {
            setErrorRegistro(
                error.response?.data?.mensaje ||
                'No fue posible registrar el paciente.'
            )
        }
    }

    const desactivarPaciente = async (idPaciente) => {
        setMensaje('')
        setErrorRegistro('')

        try {
            const respuesta = await api.put(
                `/pacientes/${idPaciente}/desactivar`
            )

            setMensaje(respuesta.data.mensaje)

            const respuestaPacientes = await api.get('/pacientes')
            setPacientes(respuestaPacientes.data)
        } catch (error) {
            setErrorRegistro(
                error.response?.data?.mensaje ||
                'No fue posible desactivar el paciente.'
            )
        }
    }

    const reactivarPaciente = async (idPaciente) => {
        setMensaje('')
        setErrorRegistro('')

        try {
            const respuesta = await api.put(
                `/pacientes/${idPaciente}/reactivar`
            )

            setMensaje(respuesta.data.mensaje)

            const respuestaPacientes = await api.get('/pacientes')
            setPacientes(respuestaPacientes.data)
        } catch (error) {
            setErrorRegistro(
                error.response?.data?.mensaje ||
                'No fue posible reactivar el paciente.'
            )
        }
    }

    useEffect(() => {
        const obtenerPacientes = async () => {
            try {
                const respuesta = await api.get('/pacientes')
                setPacientes(respuesta.data)
            } catch (error) {
                setError('No fue posible obtener los pacientes.')
            } finally {
                setCargando(false)
            }
        }

        obtenerPacientes()
    }, [])

    return (
        <div>
            <h2>Pacientes</h2>
            <p className="text-muted">
                Gestión de pacientes registrados.
            </p>

            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">
                        Registrar paciente
                    </h5>

                    <form onSubmit={pacienteEditando ? actualizarPaciente : registrarPaciente}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Nombres
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    name="nombres"
                                    value={formulario.nombres}
                                    onChange={manejarCambio}
                                    required
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Apellidos
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    name="apellidos"
                                    value={formulario.apellidos}
                                    onChange={manejarCambio}
                                    required
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Documento de identidad
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    name="documentoIdentidad"
                                    value={formulario.documentoIdentidad}
                                    onChange={manejarCambio}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Fecha de nacimiento
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    name="fechaNacimiento"
                                    value={formulario.fechaNacimiento}
                                    onChange={manejarCambio}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Sexo
                                </label>

                                <select
                                    className="form-select"
                                    name="sexo"
                                    value={formulario.sexo}
                                    onChange={manejarCambio}
                                >
                                    <option value="">Seleccione</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Teléfono
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    name="telefono"
                                    value={formulario.telefono}
                                    onChange={manejarCambio}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Correo
                                </label>

                                <input
                                    type="email"
                                    className="form-control"
                                    name="correo"
                                    value={formulario.correo}
                                    onChange={manejarCambio}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Dirección
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    name="direccion"
                                    value={formulario.direccion}
                                    onChange={manejarCambio}
                                />
                            </div>
                        </div>
                        <div className="d-flex justify-content-end">
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                <i className={`bi ${pacienteEditando ? 'bi-check-circle'
                                    : 'bi-person-plus'} me-2`}
                                ></i>
                                {pacienteEditando
                                    ? 'Guardar cambios'
                                    : 'Registrar paciente'}
                            </button>
                        </div>
                    </form>
                    {mensaje && (
                        <div className="alert alert-success mt-3">
                            {mensaje}
                        </div>
                    )}

                    {errorRegistro && (
                        <div className="alert alert-danger mt-3">
                            {errorRegistro}
                        </div>
                    )}
                </div>
            </div>

            {cargando && (
                <div className="alert alert-info">
                    Cargando pacientes...
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
                            Pacientes registrados
                        </h5>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Paciente</th>
                                        <th>Documento</th>
                                        <th>Fecha de nacimiento</th>
                                        <th>Sexo</th>
                                        <th>Teléfono</th>
                                        <th>Correo</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pacientes.map((paciente) => (
                                        <tr key={paciente.idPaciente}>
                                            <td>{paciente.idPaciente}</td>

                                            <td>
                                                {paciente.nombres}{' '}
                                                {paciente.apellidos}
                                            </td>

                                            <td>
                                                {paciente.documentoIdentidad || '-'}
                                            </td>

                                            <td>
                                                {paciente.fechaNacimiento
                                                    ? new Date(
                                                        paciente.fechaNacimiento
                                                    ).toLocaleDateString()
                                                    : '-'}
                                            </td>

                                            <td>{paciente.sexo || '-'}</td>

                                            <td>{paciente.telefono || '-'}</td>

                                            <td>{paciente.correo || '-'}</td>

                                            <td>
                                                {paciente.activo
                                                    ? 'Activo'
                                                    : 'Inactivo'}
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm me-2"
                                                    onClick={() => iniciarEdicion(paciente)}
                                                >
                                                    <i className="bi bi-pencil me-1"></i>
                                                    Editar
                                                </button>
                                                {paciente.activo ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() =>
                                                            desactivarPaciente(paciente.idPaciente)
                                                        }
                                                    >
                                                        <i className="bi bi-person-x me-1"></i>
                                                        Desactivar
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-success btn-sm"
                                                        onClick={() =>
                                                            reactivarPaciente(paciente.idPaciente)
                                                        }
                                                    >
                                                        <i className="bi bi-person-check me-1"></i>
                                                        Reactivar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Pacientes