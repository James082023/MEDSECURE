import { useEffect, useState } from 'react'
import api from '../servicios/api'
import { useAuth } from '../contexto/AuthContext'


function Usuarios() {
    const { idUsuario: idUsuarioActual } = useAuth()
    const [nombreUsuario, setNombreUsuario] = useState('')
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const [roles, setRoles] = useState([])
    const [idRolSeleccionado, setIdRolSeleccionado] = useState('')
    const [usuarios, setUsuarios] = useState([])
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
    const [idRolGestion, setIdRolGestion] = useState('')
    const [idRolRetirar, setIdRolRetirar] = useState('')
    const [mensajeGestion, setMensajeGestion] = useState('')
    const [errorGestion, setErrorGestion] = useState('')

    const obtenerUsuarios = async () => {
        try {
            const respuesta = await api.get('/usuarios')
            setUsuarios(respuesta.data)
            return respuesta.data
        } catch (error) {
            console.error('No fue posible obtener los usuarios.')
            return []
        }
    }

    const desactivarUsuario = async (idUsuario) => {
        setMensaje('')
        setError('')

        try {
            await api.put(`/usuarios/${idUsuario}/desactivar`)

            setMensaje('Usuario desactivado correctamente.')

            const usuariosActualizados = await obtenerUsuarios()

            if (usuarioSeleccionado?.idUsuario === idUsuario) {
                const usuarioActualizado = usuariosActualizados.find(
                    (usuario) => usuario.idUsuario === idUsuario
                )

                if (usuarioActualizado) {
                    setUsuarioSeleccionado(usuarioActualizado)
                    setIdRolGestion('')
                    setIdRolRetirar('')
                    setMensajeGestion('')
                    setErrorGestion('')
                }
            }
        } catch (error) {
            setError(
                error.response?.data ||
                'No fue posible desactivar el usuario.'
            )
        }
    }

    const reactivarUsuario = async (idUsuario) => {
        setMensaje('')
        setError('')

        try {
            await api.put(`/usuarios/${idUsuario}/reactivar`)

            setMensaje('Usuario reactivado correctamente.')

            const usuariosActualizados = await obtenerUsuarios()

            if (usuarioSeleccionado?.idUsuario === idUsuario) {
                const usuarioActualizado = usuariosActualizados.find(
                    (usuario) => usuario.idUsuario === idUsuario
                )

                if (usuarioActualizado) {
                    setUsuarioSeleccionado(usuarioActualizado)
                    setIdRolGestion('')
                    setIdRolRetirar('')
                    setMensajeGestion('')
                    setErrorGestion('')
                }
            }
        } catch (error) {
            setError(
                error.response?.data ||
                'No fue posible reactivar el usuario.'
            )
        }
    }

    const asignarRol = async () => {
        setMensajeGestion('')
        setErrorGestion('')

        if (!usuarioSeleccionado) {
            setErrorGestion('Debe seleccionar un usuario.')
            return
        }

        if (!idRolGestion) {
            setErrorGestion('Debe seleccionar un rol.')
            return
        }

        try {
            await api.post(
                `/roles/asignar?idUsuario=${usuarioSeleccionado.idUsuario}&idRol=${idRolGestion}`
            )

            setMensajeGestion('Rol asignado correctamente.')
            setIdRolGestion('')
            setIdRolRetirar('')

            const usuariosActualizados = await obtenerUsuarios()

            const usuarioActualizado = usuariosActualizados.find(
                (usuario) => usuario.idUsuario === usuarioSeleccionado.idUsuario
            )

            if (usuarioActualizado) {
                setUsuarioSeleccionado(usuarioActualizado)
            }
        } catch (error) {
            setErrorGestion(
                error.response?.data ||
                'No fue posible asignar el rol.'
            )
        }
    }

    const retirarRol = async () => {
        setMensajeGestion('')
        setErrorGestion('')

        if (!usuarioSeleccionado) {
            setErrorGestion('Debe seleccionar un usuario.')
            return
        }

        if (!idRolRetirar) {
            setErrorGestion('Debe seleccionar el rol que desea retirar.')
            return
        }

        try {
            await api.delete(
            `/roles/retirar?idUsuario=${usuarioSeleccionado.idUsuario}&idRol=${idRolRetirar}`
        )

            setMensajeGestion('Rol retirado correctamente.')
            setIdRolRetirar('')
            setIdRolGestion('')

            const usuariosActualizados = await obtenerUsuarios()

            const usuarioActualizado = usuariosActualizados.find(
                (usuario) => usuario.idUsuario === usuarioSeleccionado.idUsuario
            )

            if (usuarioActualizado) {
                setUsuarioSeleccionado(usuarioActualizado)
            }
        } catch (error) {
            setErrorGestion(
                error.response?.data ||
                'No fue posible retirar el rol.'
            )
        }
    }

    useEffect(() => {
        const obtenerRoles = async () => {
            try {
                const respuesta = await api.get('/roles')
                setRoles(respuesta.data)
            } catch (error) {
                console.error('No fue posible obtener los roles.')
            }
        }

        obtenerRoles()
        obtenerUsuarios()
    }, [])

    const registrarUsuario = async () => {
        setMensaje('')
        setError('')
        if (!nombreUsuario.trim() || !correo.trim() || !contrasena) {
        setError('Todos los campos son obligatorios.')
        return
    }
    if (contrasena.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.')
        return
    }
    if (!idRolSeleccionado) {
        setError('Debe seleccionar un rol para el usuario.')
        return
    }
    setCargando(true)

    try {
        const respuesta = await api.post('/autenticacion/registro', {
            nombreUsuario: nombreUsuario,
            correo: correo,
            contrasena: contrasena
        })

        if (respuesta.status === 201) {
            const idUsuarioCreado = respuesta.data.idUsuario

        try {
            await api.post(
                `/roles/asignar?idUsuario=${idUsuarioCreado}&idRol=${idRolSeleccionado}`
            )
        } catch (errorRol) {
            setError(
                'El usuario fue creado, pero no fue posible asignarle el rol.'
            )
            return
        }

        setMensaje('Usuario y rol registrados correctamente.')
            setNombreUsuario('')
            setCorreo('')
            setContrasena('')
            setIdRolSeleccionado('')
            await obtenerUsuarios()
        }
            } catch (error) {
                setError(
                    error.response?.data?.mensaje ||
                    'No fue posible registrar el usuario.'
                )
            } finally {
                setCargando(false)
            }
        }

    return (
        <div>
            <h2>Usuarios y roles</h2>
            <p className="text-muted">
                Gestión de usuarios, roles y permisos.
            </p>

            <div className="card shadow-sm border-0 mt-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">
                        Registrar nuevo usuario
                    </h5>

                    <div className="mb-3">
                        <label className="form-label">
                            Nombre de usuario
                        </label>

                        <input
                            type="text"
                            className="form-control"
                            value={nombreUsuario}
                            onChange={(e) => setNombreUsuario(e.target.value)}
                            placeholder="Ingrese el nombre de usuario"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Correo electrónico
                        </label>

                        <input
                            type="email"
                            className="form-control"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="Ingrese el correo electrónico"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Contraseña
                        </label>

                        <input
                            type="password"
                            className="form-control"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            placeholder="Ingrese la contraseña"
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Rol
                        </label>

                        <select
                            className="form-select"
                            value={idRolSeleccionado}
                            onChange={(e) => setIdRolSeleccionado(e.target.value)}
                        >
                            <option value="">
                                Seleccione un rol
                            </option>

                            {roles.map((rol) => (
                                <option
                                    key={rol.idRol}
                                    value={rol.idRol}
                                >
                                    {rol.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {mensaje && (
                        <div className="alert alert-success" role="alert">
                            {mensaje}
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={registrarUsuario}
                        disabled={cargando}
                    >
                        <i className="bi bi-person-plus me-2"></i>
                        {cargando ? 'Registrando...' : 'Registrar usuario'}
                    </button>
                </div>
            </div>
            <h4 className="mt-5 mb-3">
                Usuarios registrados
            </h4>
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {usuarios.map((usuario) => (
                            <tr key={usuario.idUsuario}>
                                <td>{usuario.idUsuario}</td>
                                <td>{usuario.nombreUsuario}</td>
                                <td>{usuario.correo}</td>
                                <td>
                                    {usuario.roles.length > 0
                                        ? usuario.roles
                                            .map((rol) => rol.nombre)
                                            .join(', ')
                                        : 'Sin rol'}
                                </td>
                                <td>
                                    {usuario.activo ? 'Activo' : 'Inactivo'}
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary me-2"
                                        onClick={() => {
                                            setUsuarioSeleccionado(usuario)
                                            setIdRolGestion('')
                                            setIdRolRetirar('')
                                            setMensajeGestion('')
                                            setErrorGestion('')
                                        }}
                                        disabled={usuario.idUsuario === idUsuarioActual}
                                    >
                                        Gestionar roles
                                    </button>
                                    {usuario.idUsuario === idUsuarioActual ? (
                                        <span className="text-muted">
                                            Sesión actual
                                        </span>
                                    ) : usuario.activo ? (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => desactivarUsuario(usuario.idUsuario)}
                                        >
                                            Desactivar
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-success"
                                            onClick={() => reactivarUsuario(usuario.idUsuario)}
                                        >
                                            Reactivar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {usuarioSeleccionado && (
                <div className="card shadow-sm border-0 mt-4">
                    <div className="card-body">
                        <h5 className="card-title">
                            Gestionar roles
                        </h5>

                        <p className="mb-1">
                            Usuario seleccionado:{' '}
                            <strong>
                                {usuarioSeleccionado.nombreUsuario}
                            </strong>
                        </p>

                        <p className="mb-3">
                            Roles actuales:{' '}
                            <strong>
                                {usuarioSeleccionado.roles.length > 0
                                    ? usuarioSeleccionado.roles
                                        .map((rol) => rol.nombre)
                                        .join(', ')
                                    : 'Sin rol'}
                            </strong>
                        </p>

                        {usuarioSeleccionado.activo &&
                        usuarioSeleccionado.roles.length === 0 && (
                            <div className="alert alert-warning" role="alert">
                                <i className="bi bi-exclamation-circle me-2"></i>
                                Este usuario no tiene ningún rol asignado.
                            </div>
                        )}

                        {!usuarioSeleccionado.activo && (
                            <div className="alert alert-warning" role="alert">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                El usuario está inactivo. Debe reactivarlo antes de modificar sus roles.
                            </div>
                        )}

                        {usuarioSeleccionado.activo &&
                            roles.length > 0 &&
                            roles.every((rol) =>
                                usuarioSeleccionado.roles.some(
                                    (rolActual) => rolActual.idRol === rol.idRol
                                )
                            ) && (
                                <div className="alert alert-info" role="alert">
                                    <i className="bi bi-info-circle me-2"></i>
                                    El usuario ya tiene asignados todos los roles disponibles.
                                </div>
                        )}

                        <div className="mt-3">
                            <label className="form-label">
                                Seleccionar rol
                            </label>

                            <select
                                className="form-select"
                                value={idRolGestion}
                                onChange={(e) => setIdRolGestion(e.target.value)}
                                disabled={
                                    !usuarioSeleccionado.activo ||
                                    roles.every((rol) =>
                                        usuarioSeleccionado.roles.some(
                                            (rolActual) => rolActual.idRol === rol.idRol
                                        )
                                    )
                                }
                            >
                                <option value="">
                                    Seleccione un rol
                                </option>

                                {roles
                                    .filter(
                                        (rol) =>
                                            !usuarioSeleccionado.roles.some(
                                                (rolActual) => rolActual.idRol === rol.idRol
                                            )
                                    )
                                    .map((rol) => (
                                    <option
                                        key={rol.idRol}
                                        value={rol.idRol}
                                    >
                                        {rol.nombre}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                className="btn btn-primary mt-3"
                                onClick={asignarRol}
                                disabled={
                                    !usuarioSeleccionado.activo ||
                                    roles.every((rol) =>
                                        usuarioSeleccionado.roles.some(
                                            (rolActual) => rolActual.idRol === rol.idRol
                                        )
                                    )
                                }
                            >
                                <i className="bi bi-person-check me-2"></i>
                                Asignar rol
                            </button>

                            {mensajeGestion && (
                                <div
                                    className="alert alert-success mt-3"
                                    role="alert"
                                >
                                    {mensajeGestion}
                                </div>
                            )}

                            {errorGestion && (
                                <div
                                    className="alert alert-danger mt-3"
                                    role="alert"
                                >
                                    {errorGestion}
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <label className="form-label">
                                Retirar rol
                            </label>

                            <select
                                className="form-select"
                                value={idRolRetirar}
                                onChange={(e) => setIdRolRetirar(e.target.value)}
                                disabled={!usuarioSeleccionado.activo || usuarioSeleccionado.roles.length === 0}
                            >
                                <option value="">
                                    Seleccione el rol que desea retirar
                                </option>

                                {usuarioSeleccionado.roles.map((rol) => (
                                    <option
                                        key={rol.idRol}
                                        value={rol.idRol}
                                    >
                                        {rol.nombre}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                className="btn btn-outline-danger mt-3"
                                onClick={retirarRol}
                                disabled={!usuarioSeleccionado.activo ||usuarioSeleccionado.roles.length === 0}
                            >
                                <i className="bi bi-person-dash me-2"></i>
                                Retirar rol
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Usuarios