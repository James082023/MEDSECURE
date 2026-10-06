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
    [Route("api/pacientes")]
    [Authorize]
    public class ControladorPacientesController : ControllerBase
    {
        private readonly ContextoBaseDatos _contexto;

        public ControladorPacientesController(
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

        private static bool EsErrorDuplicado(DbUpdateException excepcion)
        {
            return excepcion.InnerException is SqlException sqlException &&
                   (sqlException.Number == 2601 ||
                    sqlException.Number == 2627);
        }

        [HttpGet]
        [Authorize(Roles = "Administrador,Medico,Recepcion")]
        public async Task<IActionResult> ObtenerPacientes()
        {
            var pacientes = await _contexto.Pacientes
                .AsNoTracking()
                .OrderByDescending(p => p.IdPaciente)
                .Select(p => new
                {
                    p.IdPaciente,
                    p.Nombres,
                    p.Apellidos,
                    p.DocumentoIdentidad,
                    p.FechaNacimiento,
                    p.Sexo,
                    p.Telefono,
                    p.Correo,
                    p.Direccion,
                    p.FechaRegistro,
                    p.Activo
                })
                .ToListAsync();

            return Ok(pacientes);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador,Medico,Recepcion")]
        public async Task<IActionResult> RegistrarPaciente(
            [FromBody] SolicitudRegistroPaciente solicitud)
        {
            var nombres = solicitud.Nombres.Trim();
            var apellidos = solicitud.Apellidos.Trim();

            if (string.IsNullOrWhiteSpace(nombres))
            {
                return BadRequest(new
                {
                    mensaje = "Los nombres del paciente son obligatorios."
                });
            }

            if (string.IsNullOrWhiteSpace(apellidos))
            {
                return BadRequest(new
                {
                    mensaje = "Los apellidos del paciente son obligatorios."
                });
            }

            if (solicitud.FechaNacimiento.HasValue &&
                solicitud.FechaNacimiento.Value.Date > DateTime.UtcNow.Date)
            {
                return BadRequest(new
                {
                    mensaje = "La fecha de nacimiento no puede ser futura."
                });
            }

            var documentoIdentidad =
                string.IsNullOrWhiteSpace(solicitud.DocumentoIdentidad)
                    ? null
                    : solicitud.DocumentoIdentidad.Trim();

            if (documentoIdentidad != null)
            {
                var documentoDuplicado = await _contexto.Pacientes
                    .AsNoTracking()
                    .AnyAsync(p =>
                        p.DocumentoIdentidad == documentoIdentidad);

                if (documentoDuplicado)
                {
                    return Conflict(new
                    {
                        mensaje =
                            "Ya existe un paciente registrado con ese documento de identidad."
                    });
                }
            }

            var paciente = new Paciente
            {
                Nombres = nombres,
                Apellidos = apellidos,
                DocumentoIdentidad = documentoIdentidad,
                FechaNacimiento = solicitud.FechaNacimiento,
                Sexo = string.IsNullOrWhiteSpace(solicitud.Sexo)
                    ? null
                    : solicitud.Sexo.Trim(),
                Telefono = string.IsNullOrWhiteSpace(solicitud.Telefono)
                    ? null
                    : solicitud.Telefono.Trim(),
                Correo = string.IsNullOrWhiteSpace(solicitud.Correo)
                    ? null
                    : solicitud.Correo.Trim(),
                Direccion = string.IsNullOrWhiteSpace(solicitud.Direccion)
                    ? null
                    : solicitud.Direccion.Trim(),
                FechaRegistro = DateTime.UtcNow,
                Activo = true
            };

            await using var transaccion =
                await _contexto.Database.BeginTransactionAsync();

            try
            {
                _contexto.Pacientes.Add(paciente);
                await _contexto.SaveChangesAsync();

                var auditoria = new Auditoria
                {
                    IdUsuario = ObtenerIdUsuarioActual(),
                    Accion = "CREAR_PACIENTE",
                    Modulo = "Pacientes",
                    Detalles =
                        $"Paciente registrado. IdPaciente: {paciente.IdPaciente}",
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

                return Conflict(new
                {
                    mensaje =
                        "Ya existe un paciente registrado con ese documento de identidad."
                });
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }

            return Created(
                $"/api/pacientes/{paciente.IdPaciente}",
                new
                {
                    mensaje = "Paciente registrado correctamente.",
                    idPaciente = paciente.IdPaciente
                }
            );
        }

        [HttpPut("{idPaciente}")]
        [Authorize(Roles = "Administrador,Medico,Recepcion")]
        public async Task<IActionResult> EditarPaciente(
            int idPaciente,
            [FromBody] SolicitudEdicionPaciente solicitud)
        {
            var paciente = await _contexto.Pacientes
                .FirstOrDefaultAsync(
                    p => p.IdPaciente == idPaciente
                );

            if (paciente == null)
            {
                return NotFound(new
                {
                    mensaje = "Paciente no encontrado."
                });
            }

            var nombres = solicitud.Nombres.Trim();
            var apellidos = solicitud.Apellidos.Trim();

            if (string.IsNullOrWhiteSpace(nombres))
            {
                return BadRequest(new
                {
                    mensaje = "Los nombres del paciente son obligatorios."
                });
            }

            if (string.IsNullOrWhiteSpace(apellidos))
            {
                return BadRequest(new
                {
                    mensaje = "Los apellidos del paciente son obligatorios."
                });
            }

            if (solicitud.FechaNacimiento.HasValue &&
                solicitud.FechaNacimiento.Value.Date > DateTime.UtcNow.Date)
            {
                return BadRequest(new
                {
                    mensaje = "La fecha de nacimiento no puede ser futura."
                });
            }

            var documentoIdentidad =
                string.IsNullOrWhiteSpace(solicitud.DocumentoIdentidad)
                    ? null
                    : solicitud.DocumentoIdentidad.Trim();

            if (documentoIdentidad != null)
            {
                var documentoDuplicado = await _contexto.Pacientes
                    .AsNoTracking()
                    .AnyAsync(p =>
                        p.IdPaciente != idPaciente &&
                        p.DocumentoIdentidad == documentoIdentidad);

                if (documentoDuplicado)
                {
                    return Conflict(new
                    {
                        mensaje =
                            "Ya existe otro paciente registrado con ese documento de identidad."
                    });
                }
            }

            await using var transaccion =
                await _contexto.Database.BeginTransactionAsync();

            try
            {
                paciente.Nombres = nombres;
                paciente.Apellidos = apellidos;
                paciente.DocumentoIdentidad = documentoIdentidad;
                paciente.FechaNacimiento = solicitud.FechaNacimiento;

                paciente.Sexo =
                    string.IsNullOrWhiteSpace(solicitud.Sexo)
                        ? null
                        : solicitud.Sexo.Trim();

                paciente.Telefono =
                    string.IsNullOrWhiteSpace(solicitud.Telefono)
                        ? null
                        : solicitud.Telefono.Trim();

                paciente.Correo =
                    string.IsNullOrWhiteSpace(solicitud.Correo)
                        ? null
                        : solicitud.Correo.Trim();

                paciente.Direccion =
                    string.IsNullOrWhiteSpace(solicitud.Direccion)
                        ? null
                        : solicitud.Direccion.Trim();

                var auditoria = new Auditoria
                {
                    IdUsuario = ObtenerIdUsuarioActual(),
                    Accion = "EDITAR_PACIENTE",
                    Modulo = "Pacientes",
                    Detalles =
                        $"Paciente actualizado. IdPaciente: {paciente.IdPaciente}",
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

                return Conflict(new
                {
                    mensaje =
                        "Ya existe otro paciente registrado con ese documento de identidad."
                });
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }

            return Ok(new
            {
                mensaje = "Paciente actualizado correctamente."
            });
        }

        [HttpPut("{idPaciente}/desactivar")]
        [Authorize(Roles = "Administrador,Recepcion")]
        public async Task<IActionResult> DesactivarPaciente(
            int idPaciente)
        {
            var paciente = await _contexto.Pacientes
                .FirstOrDefaultAsync(
                    p => p.IdPaciente == idPaciente
                );

            if (paciente == null)
            {
                return NotFound(new
                {
                    mensaje = "Paciente no encontrado."
                });
            }

            if (!paciente.Activo)
            {
                return Conflict(new
                {
                    mensaje =
                        "El paciente ya se encuentra inactivo."
                });
            }

            await using var transaccion =
                await _contexto.Database.BeginTransactionAsync();

            try
            {
                paciente.Activo = false;

                var auditoria = new Auditoria
                {
                    IdUsuario = ObtenerIdUsuarioActual(),
                    Accion = "DESACTIVAR_PACIENTE",
                    Modulo = "Pacientes",
                    Detalles =
                        $"Paciente desactivado. IdPaciente: {paciente.IdPaciente}",
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
                mensaje = "Paciente desactivado correctamente."
            });
        }

        [HttpPut("{idPaciente}/reactivar")]
        [Authorize(Roles = "Administrador,Recepcion")]
        public async Task<IActionResult> ReactivarPaciente(
            int idPaciente)
        {
            var paciente = await _contexto.Pacientes
                .FirstOrDefaultAsync(
                    p => p.IdPaciente == idPaciente
                );

            if (paciente == null)
            {
                return NotFound(new
                {
                    mensaje = "Paciente no encontrado."
                });
            }

            if (paciente.Activo)
            {
                return Conflict(new
                {
                    mensaje =
                        "El paciente ya se encuentra activo."
                });
            }

            await using var transaccion =
                await _contexto.Database.BeginTransactionAsync();

            try
            {
                paciente.Activo = true;

                var auditoria = new Auditoria
                {
                    IdUsuario = ObtenerIdUsuarioActual(),
                    Accion = "REACTIVAR_PACIENTE",
                    Modulo = "Pacientes",
                    Detalles =
                        $"Paciente reactivado. IdPaciente: {paciente.IdPaciente}",
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
                mensaje = "Paciente reactivado correctamente."
            });
        }
    }
}