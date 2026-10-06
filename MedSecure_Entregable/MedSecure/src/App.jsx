import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DiseñoPrincipal from './diseños/DiseñoPrincipal'
import Inicio from './paginas/Inicio'
import InicioSesion from './paginas/InicioSesion'
import CambiarClave from './paginas/CambiarClave'
import Pacientes from './paginas/Pacientes'
import Expedientes from './paginas/Expedientes'
import ConsultasMedicas from './paginas/ConsultasMedicas'
import Usuarios from './paginas/Usuarios'
import Auditoria from './paginas/Auditoria'
import RutaProtegida from './rutas/RutaProtegida'
import RutaCambioClave from './rutas/RutaCambioClave'
import RutaAdministrador from './rutas/RutaAdministrador'
import RutaClinica from './rutas/RutaClinica'

function Aplicacion() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={<InicioSesion />}
                />

                <Route element={<RutaProtegida />}>
                    <Route
                        path="/cambiar-clave"
                        element={<CambiarClave />}
                    />

                    <Route element={<RutaCambioClave />}>
                        <Route
                            path="/"
                            element={<DiseñoPrincipal />}
                        >
                            <Route
                                index
                                element={<Inicio />}
                            />

                            <Route
                                path="pacientes"
                                element={<Pacientes />}
                            />

                            <Route element={<RutaClinica />}>
                                <Route
                                    path="expedientes"
                                    element={<Expedientes />}
                                />

                                <Route
                                    path="consultas-medicas"
                                    element={<ConsultasMedicas />}
                                />
                            </Route>

                            <Route element={<RutaAdministrador />}>
                                <Route
                                    path="usuarios"
                                    element={<Usuarios />}
                                />

                                <Route
                                    path="auditoria"
                                    element={<Auditoria />}
                                />
                            </Route>
                        </Route>
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default Aplicacion