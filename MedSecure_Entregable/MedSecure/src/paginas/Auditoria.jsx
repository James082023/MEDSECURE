import { useEffect, useState } from 'react'
import api from '../servicios/api'

function Auditoria() {
    const [registros, setRegistros] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [busqueda, setBusqueda] = useState('')
    const [fechaDesde, setFechaDesde] = useState('')
    const [fechaHasta, setFechaHasta] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const registrosPorPagina = 10
    const [accionSeleccionada, setAccionSeleccionada] = useState('')
    const [moduloSeleccionado, setModuloSeleccionado] = useState('')

    useEffect(() => {
        const obtenerAuditoria = async () => {
            try {
                const respuesta = await api.get('/auditoria')
                setRegistros(respuesta.data)
            } catch (error) {
                setError('No fue posible obtener los registros de auditoría.')
            } finally {
                setCargando(false)
            }
        }

        obtenerAuditoria()
    }, [])

    useEffect(() => {setPaginaActual(1)}, [
        busqueda,
        fechaDesde,
        fechaHasta,
        accionSeleccionada,
        moduloSeleccionado
    ])

    const accionesDisponibles = [
        ...new Set(
            registros
                .map((registro) => registro.accion)
                .filter(Boolean)
        )
    ].sort()

    const modulosDisponibles = [
        ...new Set(
            registros
                .map((registro) => registro.modulo)
                .filter(Boolean)
        )
    ].sort()

    const limpiarFiltros = () => {
        setBusqueda('')
        setFechaDesde('')
        setFechaHasta('')
        setAccionSeleccionada('')
        setModuloSeleccionado('')
        setPaginaActual(1)
    }

    const registrosFiltrados = registros.filter((registro) => {
    const textoBusqueda = busqueda.toLowerCase()

        const coincideBusqueda =
            registro.nombreUsuario?.toLowerCase().includes(textoBusqueda) ||
            registro.accion?.toLowerCase().includes(textoBusqueda) ||
            registro.modulo?.toLowerCase().includes(textoBusqueda) ||
            registro.detalles?.toLowerCase().includes(textoBusqueda) ||
            registro.direccionIP?.toLowerCase().includes(textoBusqueda)

        const coincideAccion =!accionSeleccionada ||registro.accion === accionSeleccionada
        const coincideModulo =!moduloSeleccionado ||registro.modulo === moduloSeleccionado

        const fechaRegistro = new Date(registro.fechaHora)

        let coincideFechaDesde = true
        let coincideFechaHasta = true

        if (fechaDesde) {
            const desde = new Date(`${fechaDesde}T00:00:00`)
            coincideFechaDesde = fechaRegistro >= desde
        }

        if (fechaHasta) {
            const hasta = new Date(`${fechaHasta}T23:59:59`)
            coincideFechaHasta = fechaRegistro <= hasta
        }

        return (
            coincideBusqueda &&
            coincideAccion &&
            coincideModulo &&
            coincideFechaDesde &&
            coincideFechaHasta
        )
    })

    const totalPaginas = Math.ceil(
        registrosFiltrados.length / registrosPorPagina
    )

    const indiceUltimoRegistro =
        paginaActual * registrosPorPagina

    const indicePrimerRegistro =
        indiceUltimoRegistro - registrosPorPagina

    const registrosPaginados = registrosFiltrados.slice(
        indicePrimerRegistro,
        indiceUltimoRegistro
    )

    return (
        <div>
            <h2>Auditoría</h2>
            <p className="text-muted">
                Registro de actividades y eventos del sistema.
            </p>

            <div className="mb-4">
                <label className="form-label">
                    Buscar en auditoría
                </label>

                <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por usuario, acción, módulo, detalle o dirección IP"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="row mb-4">
                <div className="col-md-6">
                    <label className="form-label">
                        Fecha desde
                    </label>

                    <input
                        type="date"
                        className="form-control"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">
                        Fecha hasta
                    </label>

                    <input
                        type="date"
                        className="form-control"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="form-label">
                    Acción
                </label>

                <select
                    className="form-select"
                    value={accionSeleccionada}
                    onChange={(e) => setAccionSeleccionada(e.target.value)}
                >
                    <option value="">
                        Todas las acciones
                    </option>

                    {accionesDisponibles.map((accion) => (
                        <option
                            key={accion}
                            value={accion}
                        >
                            {accion}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="form-label">
                    Módulo
                </label>

                <select
                    className="form-select"
                    value={moduloSeleccionado}
                    onChange={(e) => setModuloSeleccionado(e.target.value)}
                >
                    <option value="">
                        Todos los módulos
                    </option>

                    {modulosDisponibles.map((modulo) => (
                        <option
                            key={modulo}
                            value={modulo}
                        >
                            {modulo}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={limpiarFiltros}
                >
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Limpiar filtros
                </button>
            </div>

            {cargando && (
                <div className="alert alert-info">
                    Cargando registros de auditoría...
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {!cargando && !error && (
                <div className="card shadow-sm border-0">
                    <div className="card-body">
                        <h5 className="card-title mb-3">
                            Registros de auditoría
                        </h5>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Usuario</th>
                                        <th>Acción</th>
                                        <th>Módulo</th>
                                        <th>Detalles</th>
                                        <th>Dirección IP</th>
                                        <th>Fecha y hora</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {registrosPaginados.map((registro) => (
                                        <tr key={registro.idAuditoria}>
                                            <td>{registro.idAuditoria}</td>

                                            <td>
                                                {registro.nombreUsuario || 'Sin usuario'}
                                            </td>

                                            <td>{registro.accion}</td>

                                            <td>
                                                {registro.modulo || '-'}
                                            </td>

                                            <td>
                                                {registro.detalles || '-'}
                                            </td>

                                            <td>
                                                {registro.direccionIP || '-'}
                                            </td>

                                            <td>
                                                {new Date(registro.fechaHora).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {registrosPaginados.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="text-center text-muted py-4"
                                            >
                                                No se encontraron registros de auditoría.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                disabled={paginaActual === 1}
                                onClick={() => setPaginaActual(paginaActual - 1)}
                            >
                                <i className="bi bi-chevron-left me-1"></i>
                                Anterior
                            </button>

                            <span>
                                Página {totalPaginas === 0 ? 0 : paginaActual} de {totalPaginas}
                            </span>

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                disabled={
                                    paginaActual === totalPaginas ||
                                    totalPaginas === 0
                                }
                                onClick={() => setPaginaActual(paginaActual + 1)}
                            >
                                Siguiente
                                <i className="bi bi-chevron-right ms-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Auditoria