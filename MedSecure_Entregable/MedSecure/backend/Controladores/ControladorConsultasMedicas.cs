using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedSecure.Datos;
using MedSecure.DTO;
using MedSecure.Modelos;
using System.Security.Claims;

namespace MedSecure.Controladores
{
    [ApiController]
    [Route("api/consultas-medicas")]
    [Authorize(Roles = "Administrador,Medico")]
    public class ControladorConsultasMedicasController : ControllerBase
    {
        private readonly ContextoBaseDatos _contexto;

        public ControladorConsultasMedicasController(
            ContextoBaseDatos contexto)
        {
            _contexto = contexto;
        }

        private int? ObtenerIdUsuarioActual()
        {
            var valorIdUsuario =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (int.TryParse(valorIdUsuario, out int idUsuario))
            {
                return idUsuario;
            }

            return null;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerConsultasMedicas()
        {
            var consultas = await _contexto.ConsultasMedicas
                .AsNoTracking()
                .OrderByDescending(c => c.FechaConsulta)
                .Select(c => new
                {
                    c.IdConsulta,
                    c.IdExpediente,
                    c.IdUsuario,

                    NombrePaciente = _contexto.Expedientes
                        .Where(e =>
                            e.IdExpediente == c.IdExpediente)
                        .Join(
                            _contexto.Pacientes,
                            e => e.IdPaciente,
                            p => p.IdPaciente,
                            (e, p) =>
                                p.Nombres + " " + p.Apellidos
                        )
                        .FirstOrDefault(),

                    NombreUsuario = c.IdUsuario.HasValue
                        ? _contexto.Usuarios
                            .Where(u =>
                                u.IdUsuario == c.IdUsuario.Value)
                            .Select(u => u.NombreUsuario)
                            .FirstOrDefault()
                        : null,

                    c.FechaConsulta,
                    c.MotivoConsulta,
                    c.Diagnostico,
                    c.Tratamiento,
                    c.Medicamentos,
                    c.Observaciones,
                    c.ResultadosExamenes
                })
                .ToListAsync();

            return Ok(consultas);
        }

        [HttpPost]
        public async Task<IActionResult> RegistrarConsultaMedica(
            [FromBody] SolicitudRegistroConsultaMedica solicitud)
        {
            if (solicitud.IdExpediente <= 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "Debe seleccionar un expediente válido."
                });
            }

            var expediente = await _contexto.Expedientes
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    e => e.IdExpediente == solicitud.IdExpediente
                );

            if (expediente == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "El expediente indicado no existe."
                });
            }

            var paciente = await _contexto.Pacientes
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    p => p.IdPaciente == expediente.IdPaciente
                );

            if (paciente == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "El paciente asociado al expediente no existe."
                });
            }

            if (!paciente.Activo)
            {
                return Conflict(new
                {
                    mensaje =
                        "No se puede registrar una consulta para un paciente inactivo."
                });
            }

            var idUsuario = ObtenerIdUsuarioActual();

            if (!idUsuario.HasValue)
            {
                return Unauthorized(new
                {
                    mensaje =
                        "No se pudo identificar al usuario autenticado."
                });
            }

            var usuario = await _contexto.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    u => u.IdUsuario == idUsuario.Value
                );

            if (usuario == null || !usuario.Activo)
            {
                return Unauthorized(new
                {
                    mensaje =
                        "El usuario autenticado no se encuentra activo."
                });
            }

            var consulta = new ConsultaMedica
            {
                IdExpediente = solicitud.IdExpediente,
                IdUsuario = idUsuario.Value,
                FechaConsulta = DateTime.UtcNow,

                MotivoConsulta =
                    string.IsNullOrWhiteSpace(
                        solicitud.MotivoConsulta
                    )
                        ? null
                        : solicitud.MotivoConsulta.Trim(),

                Diagnostico =
                    string.IsNullOrWhiteSpace(
                        solicitud.Diagnostico
                    )
                        ? null
                        : solicitud.Diagnostico.Trim(),

                Tratamiento =
                    string.IsNullOrWhiteSpace(
                        solicitud.Tratamiento
                    )
                        ? null
                        : solicitud.Tratamiento.Trim(),

                Medicamentos =
                    string.IsNullOrWhiteSpace(
                        solicitud.Medicamentos
                    )
                        ? null
                        : solicitud.Medicamentos.Trim(),

                Observaciones =
                    string.IsNullOrWhiteSpace(
                        solicitud.Observaciones
                    )
                        ? null
                        : solicitud.Observaciones.Trim(),

                ResultadosExamenes =
                    string.IsNullOrWhiteSpace(
                        solicitud.ResultadosExamenes
                    )
                        ? null
                        : solicitud.ResultadosExamenes.Trim()
            };

            await using var transaccion =
                await _contexto.Database.BeginTransactionAsync();

            try
            {
                _contexto.ConsultasMedicas.Add(consulta);

                await _contexto.SaveChangesAsync();

                var auditoria = new Auditoria
                {
                    IdUsuario = idUsuario.Value,
                    Accion = "CREAR_CONSULTA_MEDICA",
                    Modulo = "ConsultasMedicas",

                    Detalles =
                        $"Consulta médica registrada. IdConsulta: {consulta.IdConsulta}",

                    DireccionIP =
                        HttpContext.Connection.RemoteIpAddress?.ToString(),

                    FechaHora = DateTime.UtcNow
                };

                _contexto.Auditorias.Add(auditoria);

                await _contexto.SaveChangesAsync();
                await transaccion.CommitAsync();
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }

            return Created(
                $"/api/consultas-medicas/{consulta.IdConsulta}",
                new
                {
                    mensaje =
                        "Consulta médica registrada correctamente.",
                    idConsulta = consulta.IdConsulta
                }
            );
        }

        [HttpPut("{idConsulta}")]
        public async Task<IActionResult> ActualizarConsultaMedica(
            int idConsulta,
            [FromBody] SolicitudEdicionConsultaMedica solicitud)
        {
            var consulta = await _contexto.ConsultasMedicas
                .FirstOrDefaultAsync(
                    c => c.IdConsulta == idConsulta
                );

            if (consulta == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "La consulta médica indicada no existe."
                });
            }

            var expediente = await _contexto.Expedientes
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    e => e.IdExpediente == consulta.IdExpediente
                );

            if (expediente == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "El expediente asociado a la consulta no existe."
                });
            }

            var paciente = await _contexto.Pacientes
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    p => p.IdPaciente == expediente.IdPaciente
                );

            if (paciente == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "El paciente asociado al expediente no existe."
                });
            }

            if (!paciente.Activo)
            {
                return Conflict(new
                {
                    mensaje =
                        "No se puede modificar una consulta de un paciente inactivo."
                });
            }

            var idUsuario = ObtenerIdUsuarioActual();

            if (!idUsuario.HasValue)
            {
                return Unauthorized(new
                {
                    mensaje =
                        "No se pudo identificar al usuario autenticado."
                });
            }

            var usuarioActual = await _contexto.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    u => u.IdUsuario == idUsuario.Value
                );

            if (usuarioActual == null || !usuarioActual.Activo)
            {
                return Unauthorized(new
                {
                    mensaje =
                        "El usuario autenticado no se encuentra activo."
                });
            }

            await using var transaccion =
                await _contexto.Database.BeginTransactionAsync();

            try
            {
                consulta.MotivoConsulta =
                    string.IsNullOrWhiteSpace(
                        solicitud.MotivoConsulta
                    )
                        ? null
                        : solicitud.MotivoConsulta.Trim();

                consulta.Diagnostico =
                    string.IsNullOrWhiteSpace(
                        solicitud.Diagnostico
                    )
                        ? null
                        : solicitud.Diagnostico.Trim();

                consulta.Tratamiento =
                    string.IsNullOrWhiteSpace(
                        solicitud.Tratamiento
                    )
                        ? null
                        : solicitud.Tratamiento.Trim();

                consulta.Medicamentos =
                    string.IsNullOrWhiteSpace(
                        solicitud.Medicamentos
                    )
                        ? null
                        : solicitud.Medicamentos.Trim();

                consulta.Observaciones =
                    string.IsNullOrWhiteSpace(
                        solicitud.Observaciones
                    )
                        ? null
                        : solicitud.Observaciones.Trim();

                consulta.ResultadosExamenes =
                    string.IsNullOrWhiteSpace(
                        solicitud.ResultadosExamenes
                    )
                        ? null
                        : solicitud.ResultadosExamenes.Trim();

                var auditoria = new Auditoria
                {
                    IdUsuario = idUsuario.Value,
                    Accion = "EDITAR_CONSULTA_MEDICA",
                    Modulo = "ConsultasMedicas",

                    Detalles =
                        $"Consulta médica actualizada. IdConsulta: {consulta.IdConsulta}",

                    DireccionIP =
                        HttpContext.Connection.RemoteIpAddress?.ToString(),

                    FechaHora = DateTime.UtcNow
                };

                _contexto.Auditorias.Add(auditoria);

                await _contexto.SaveChangesAsync();
                await transaccion.CommitAsync();
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }

            return Ok(new
            {
                mensaje =
                    "Consulta médica actualizada correctamente."
            });
        }
    }
}