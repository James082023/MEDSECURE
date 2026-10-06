using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using MedSecure.Datos;
using MedSecure.DTO;
using MedSecure.Modelos;
using System.Security.Claims;

namespace MedSecure.Controladores
{
    [ApiController]
    [Route("api/expedientes")]
    [Authorize]
    public class ControladorExpedientesController : ControllerBase
    {
        private readonly ContextoBaseDatos _contexto;

        public ControladorExpedientesController(
            ContextoBaseDatos contexto)
        {
            _contexto = contexto;
        }

        private int? ObtenerIdUsuarioActual()
        {
            var valorIdUsuario = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (int.TryParse(valorIdUsuario, out int idUsuario))
            {
                return idUsuario;
            }

            return null;
        }

        private static bool EsErrorDuplicado(
            DbUpdateException excepcion)
        {
            return excepcion.InnerException is SqlException sqlException &&
                   (sqlException.Number == 2601 ||
                    sqlException.Number == 2627);
        }

        [HttpGet]
        [Authorize(Roles = "Administrador,Medico")]
        public async Task<IActionResult> ObtenerExpedientes()
        {
            var expedientes = await _contexto.Expedientes
                .AsNoTracking()
                .OrderByDescending(e => e.IdExpediente)
                .Select(e => new
                {
                    e.IdExpediente,
                    e.IdPaciente,

                    NombrePaciente = _contexto.Pacientes
                        .Where(p => p.IdPaciente == e.IdPaciente)
                        .Select(p => p.Nombres + " " + p.Apellidos)
                        .FirstOrDefault(),

                    PacienteActivo = _contexto.Pacientes
                        .Where(p => p.IdPaciente == e.IdPaciente)
                        .Select(p => p.Activo)
                        .FirstOrDefault(),

                    e.FechaCreacion,
                    e.ObservacionesGenerales
                })
                .ToListAsync();

            return Ok(expedientes);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador,Medico")]
        public async Task<IActionResult> RegistrarExpediente(
            [FromBody] SolicitudRegistroExpediente solicitud)
        {
            if (solicitud.IdPaciente <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "Debe seleccionar un paciente válido."
                });
            }

            var paciente = await _contexto.Pacientes
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    p => p.IdPaciente == solicitud.IdPaciente
                );

            if (paciente == null)
            {
                return NotFound(new
                {
                    mensaje = "El paciente indicado no existe."
                });
            }

            if (!paciente.Activo)
            {
                return Conflict(new
                {
                    mensaje =
                        "No se puede crear un expediente para un paciente inactivo."
                });
            }

            var expedienteExistente = await _contexto.Expedientes
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    e => e.IdPaciente == solicitud.IdPaciente
                );

            if (expedienteExistente != null)
            {
                return Conflict(new
                {
                    mensaje =
                        "El paciente ya tiene un expediente registrado.",
                    idExpediente = expedienteExistente.IdExpediente
                });
            }

            var expediente = new Expediente
            {
                IdPaciente = solicitud.IdPaciente,
                FechaCreacion = DateTime.UtcNow,

                ObservacionesGenerales =
                    string.IsNullOrWhiteSpace(
                        solicitud.ObservacionesGenerales
                    )
                        ? null
                        : solicitud.ObservacionesGenerales.Trim()
            };

            await using var transaccion =
                await _contexto.Database.BeginTransactionAsync();

            try
            {
                _contexto.Expedientes.Add(expediente);

                await _contexto.SaveChangesAsync();

                var auditoria = new Auditoria
                {
                    IdUsuario = ObtenerIdUsuarioActual(),
                    Accion = "CREAR_EXPEDIENTE",
                    Modulo = "Expedientes",

                    Detalles =
                        $"Expediente creado. IdExpediente: {expediente.IdExpediente}",

                    DireccionIP =
                        HttpContext.Connection.RemoteIpAddress?.ToString(),

                    FechaHora = DateTime.UtcNow
                };

                _contexto.Auditorias.Add(auditoria);

                await _contexto.SaveChangesAsync();
                await transaccion.CommitAsync();
            }
            catch (DbUpdateException excepcion)
                when (EsErrorDuplicado(excepcion))
            {
                await transaccion.RollbackAsync();

                var expedienteExistenteActual =
                    await _contexto.Expedientes
                        .AsNoTracking()
                        .FirstOrDefaultAsync(
                            e => e.IdPaciente == solicitud.IdPaciente
                        );

                return Conflict(new
                {
                    mensaje =
                        "El paciente ya tiene un expediente registrado.",
                    idExpediente =
                        expedienteExistenteActual?.IdExpediente
                });
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }

            return Created(
                $"/api/expedientes/{expediente.IdExpediente}",
                new
                {
                    mensaje = "Expediente creado correctamente.",
                    idExpediente = expediente.IdExpediente
                }
            );
        }

        [HttpPut("{idExpediente}")]
        [Authorize(Roles = "Administrador,Medico")]
        public async Task<IActionResult> ActualizarExpediente(
            int idExpediente,
            [FromBody] SolicitudEdicionExpediente solicitud)
        {
            var expediente = await _contexto.Expedientes
                .FirstOrDefaultAsync(
                    e => e.IdExpediente == idExpediente
                );

            if (expediente == null)
            {
                return NotFound(new
                {
                    mensaje = "El expediente indicado no existe."
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
                        "El paciente relacionado con el expediente no existe."
                });
            }

            if (!paciente.Activo)
            {
                return Conflict(new
                {
                    mensaje =
                        "No se puede modificar el expediente de un paciente inactivo."
                });
            }

            await using var transaccion =
                await _contexto.Database.BeginTransactionAsync();

            try
            {
                expediente.ObservacionesGenerales =
                    string.IsNullOrWhiteSpace(
                        solicitud.ObservacionesGenerales
                    )
                        ? null
                        : solicitud.ObservacionesGenerales.Trim();

                var auditoria = new Auditoria
                {
                    IdUsuario = ObtenerIdUsuarioActual(),
                    Accion = "EDITAR_EXPEDIENTE",
                    Modulo = "Expedientes",

                    Detalles =
                        $"Expediente actualizado. IdExpediente: {expediente.IdExpediente}",

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
                mensaje = "Expediente actualizado correctamente."
            });
        }
    }
}