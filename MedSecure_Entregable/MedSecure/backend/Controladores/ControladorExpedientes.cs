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
            var valorIdUsuario = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (int.TryParse(valorIdUsuario, out int idUsuario))
            {
                return idUsuario;
            }

            return null;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerExpedientes()
        {
            var expedientes = await _contexto.Expedientes
                .OrderByDescending(e => e.IdExpediente)
                .Select(e => new
                {
                    e.IdExpediente,
                    e.IdPaciente,

                    NombrePaciente = _contexto.Pacientes
                        .Where(p => p.IdPaciente == e.IdPaciente)
                        .Select(p => p.Nombres + " " + p.Apellidos)
                        .FirstOrDefault(),

                    e.FechaCreacion,
                    e.ObservacionesGenerales
                })
                .ToListAsync();

            return Ok(expedientes);
        }
        
        [HttpPost]
        public async Task<IActionResult> RegistrarExpediente(
            SolicitudRegistroExpediente solicitud)
        {
            var paciente = await _contexto.Pacientes
                .FirstOrDefaultAsync(p => p.IdPaciente == solicitud.IdPaciente);

            if (paciente == null)
            {
                return NotFound("El paciente indicado no existe.");
            }

            if (!paciente.Activo)
            {
                return BadRequest("No se puede crear un expediente para un paciente inactivo.");
            }

            var expediente = new Expediente
            {
                IdPaciente = solicitud.IdPaciente,
                FechaCreacion = DateTime.UtcNow,
                ObservacionesGenerales =
                    string.IsNullOrWhiteSpace(solicitud.ObservacionesGenerales)
                        ? null
                        : solicitud.ObservacionesGenerales.Trim()
            };

            _contexto.Expedientes.Add(expediente);
            await _contexto.SaveChangesAsync();

            var auditoria = new Auditoria
            {
                IdUsuario = ObtenerIdUsuarioActual(),
                Accion = "CREAR_EXPEDIENTE",
                Modulo = "Expedientes",
                Detalles = $"Expediente creado. IdExpediente: {expediente.IdExpediente}",
                DireccionIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
                FechaHora = DateTime.UtcNow
            };

            _contexto.Auditorias.Add(auditoria);
            await _contexto.SaveChangesAsync();

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
        public async Task<IActionResult> ActualizarExpediente(
            int idExpediente,
            SolicitudEdicionExpediente solicitud)
        {
            var expediente = await _contexto.Expedientes
                .FirstOrDefaultAsync(e => e.IdExpediente == idExpediente);

            if (expediente == null)
            {
                return NotFound("El expediente indicado no existe.");
            }

            expediente.ObservacionesGenerales =
                string.IsNullOrWhiteSpace(solicitud.ObservacionesGenerales)
                    ? null
                    : solicitud.ObservacionesGenerales.Trim();

            await _contexto.SaveChangesAsync();

            var auditoria = new Auditoria
            {
                IdUsuario = ObtenerIdUsuarioActual(),
                Accion = "EDITAR_EXPEDIENTE",
                Modulo = "Expedientes",
                Detalles = $"Expediente actualizado. IdExpediente: {expediente.IdExpediente}",
                DireccionIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
                FechaHora = DateTime.UtcNow
            };

            _contexto.Auditorias.Add(auditoria);
            await _contexto.SaveChangesAsync();

            return Ok("Expediente actualizado correctamente.");
        }
    }
}