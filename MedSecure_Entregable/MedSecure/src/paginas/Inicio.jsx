import api from '../servicios/api'
import { useAuth } from '../contexto/AuthContext'

function Inicio() {
    const { roles } = useAuth()
    const esAdministrador = roles.includes('Administrador')

    return (
        <div>

            <div className="mb-4">
                <h2>Panel principal</h2>
                <p className="text-muted">
                    Bienvenido al sistema MedSecure.
                </p>
            </div>

            <div className="row g-4">

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <i className="bi bi-people fs-1"></i>
                            <h5 className="mt-3">Pacientes</h5>
                            <p className="text-muted">
                                Gestión de pacientes.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <i className="bi bi-file-medical fs-1"></i>
                            <h5 className="mt-3">Expedientes</h5>
                            <p className="text-muted">
                                Expedientes médicos.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <i className="bi bi-shield-lock fs-1"></i>
                            <h5 className="mt-3">Seguridad</h5>
                            <p className="text-muted">
                                Protección del sistema.
                            </p>
                        </div>
                    </div>
                </div>

                {esAdministrador && (
                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <i className="bi bi-journal-check fs-1"></i>
                            <h5 className="mt-3">Auditoría</h5>
                            <p className="text-muted">
                                Registro de actividades.
                            </p>
                        </div>
                    </div>
                </div>
                )}

            </div>

        </div>
    )
}

export default Inicio