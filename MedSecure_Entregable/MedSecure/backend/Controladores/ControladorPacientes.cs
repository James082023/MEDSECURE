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

        [HttpGet]
        public async Task<IActionResult> ObtenerPacientes()
        {
            var pacientes = await _contexto.Pacientes
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
        public async Task<IActionResult> RegistrarPaciente(
            [FromBody] SolicitudRegistroPaciente solicitud)
        {
            var paciente = new Paciente
            {
                Nombres = solicitud.Nombres.Trim(),
                Apellidos = solicitud.Apellidos.Trim(),
                DocumentoIdentidad = solicitud.DocumentoIdentidad?.Trim(),
                FechaNacimiento = solicitud.FechaNacimiento,
                Sexo = solicitud.Sexo?.Trim(),
                Telefono = solicitud.Telefono?.Trim(),
                Correo = solicitud.Correo?.Trim(),
                Direccion = solicitud.Direccion?.Trim(),
                FechaRegistro = DateTime.UtcNow,
                Activo = true
            };

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
        public async Task<IActionResult> EditarPaciente(
            int idPaciente,
            [FromBody] SolicitudEdicionPaciente solicitud)
        {
            var paciente = await _contexto.Pacientes
                .FirstOrDefaultAsync(p => p.IdPaciente == idPaciente);

            if (paciente == null)
            {
                return NotFound(new
                {
                    mensaje = "Paciente no encontrado."
                });
            }

            paciente.Nombres = solicitud.Nombres.Trim();
            paciente.Apellidos = solicitud.Apellidos.Trim();
            paciente.DocumentoIdentidad =
                solicitud.DocumentoIdentidad?.Trim();
            paciente.FechaNacimiento = solicitud.FechaNacimiento;
            paciente.Sexo = solicitud.Sexo?.Trim();
            paciente.Telefono = solicitud.Telefono?.Trim();
            paciente.Correo = solicitud.Correo?.Trim();
            paciente.Direccion = solicitud.Direccion?.Trim();

            await _contexto.SaveChangesAsync();

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

            return Ok(new
            {
                mensaje = "Paciente actualizado correctamente."
            });
        }

        [HttpPut("{idPaciente}/desactivar")]
        public async Task<IActionResult> DesactivarPaciente(int idPaciente)
        {
            var paciente = await _contexto.Pacientes
                .FirstOrDefaultAsync(p => p.IdPaciente == idPaciente);

            if (paciente == null)
            {
                return NotFound(new
                {
                    mensaje = "Paciente no encontrado."
                });
            }

            if (!paciente.Activo)
            {
                return BadRequest(new
                {
                    mensaje = "El paciente ya se encuentra inactivo."
                });
            }

            paciente.Activo = false;

            await _contexto.SaveChangesAsync();

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

            return Ok(new
            {
                mensaje = "Paciente desactivado correctamente."
            });
        }

        [HttpPut("{idPaciente}/reactivar")]
        public async Task<IActionResult> ReactivarPaciente(int idPaciente)
        {
            var paciente = await _contexto.Pacientes
                .FirstOrDefaultAsync(p => p.IdPaciente == idPaciente);

            if (paciente == null)
            {
                return NotFound(new
                {
                    mensaje = "Paciente no encontrado."
                });
            }

            if (paciente.Activo)
            {
                return BadRequest(new
                {
                    mensaje = "El paciente ya se encuentra activo."
                });
            }

            paciente.Activo = true;

            await _contexto.SaveChangesAsync();

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

            return Ok(new
            {
                mensaje = "Paciente reactivado correctamente."
            });
        }
    }
}