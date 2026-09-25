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
    [Authorize]
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
                .OrderByDescending(c => c.FechaConsulta)
                .Select(c => new
                {
                    c.IdConsulta,
                    c.IdExpediente,
                    c.IdUsuario,

                    NombrePaciente = _contexto.Expedientes
                        .Where(e => e.IdExpediente == c.IdExpediente)
                        .Join(
                            _contexto.Pacientes,
                            e => e.IdPaciente,
                            p => p.IdPaciente,
                            (e, p) => p.Nombres + " " + p.Apellidos
                        )
                        .FirstOrDefault(),

                    NombreUsuario = c.IdUsuario.HasValue
                        ? _contexto.Usuarios
                            .Where(u => u.IdUsuario == c.IdUsuario.Value)
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
            SolicitudRegistroConsultaMedica solicitud)
        {
            var expediente = await _contexto.Expedientes
                .FirstOrDefaultAsync(e => e.IdExpediente == solicitud.IdExpediente);

            if (expediente == null)
            {
                return NotFound("El expediente indicado no existe.");
            }

            var paciente = await _contexto.Pacientes
                .FirstOrDefaultAsync(p => p.IdPaciente == expediente.IdPaciente);

            if (paciente == null)
            {
                return NotFound("El paciente asociado al expediente no existe.");
            }

            if (!paciente.Activo)
            {
                return BadRequest(
                    "No se puede registrar una consulta para un paciente inactivo."
                );
            }

            var idUsuario = ObtenerIdUsuarioActual();

            if (!idUsuario.HasValue)
            {
                return Unauthorized();
            }

            var consulta = new ConsultaMedica
            {
                IdExpediente = solicitud.IdExpediente,
                IdUsuario = idUsuario.Value,
                FechaConsulta = DateTime.UtcNow,

                MotivoConsulta = string.IsNullOrWhiteSpace(solicitud.MotivoConsulta)
                    ? null
                    : solicitud.MotivoConsulta.Trim(),

                Diagnostico = string.IsNullOrWhiteSpace(solicitud.Diagnostico)
                    ? null
                    : solicitud.Diagnostico.Trim(),

                Tratamiento = string.IsNullOrWhiteSpace(solicitud.Tratamiento)
                    ? null
                    : solicitud.Tratamiento.Trim(),

                Medicamentos = string.IsNullOrWhiteSpace(solicitud.Medicamentos)
                    ? null
                    : solicitud.Medicamentos.Trim(),

                Observaciones = string.IsNullOrWhiteSpace(solicitud.Observaciones)
                    ? null
                    : solicitud.Observaciones.Trim(),

                ResultadosExamenes =
                    string.IsNullOrWhiteSpace(solicitud.ResultadosExamenes)
                        ? null
                        : solicitud.ResultadosExamenes.Trim()
            };

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

            return Created(
                $"/api/consultas-medicas/{consulta.IdConsulta}",
                new
                {
                    mensaje = "Consulta médica registrada correctamente.",
                    idConsulta = consulta.IdConsulta
                }
            );
        }

        [HttpPut("{idConsulta}")]
        public async Task<IActionResult> ActualizarConsultaMedica(
            int idConsulta,
            SolicitudEdicionConsultaMedica solicitud)
        {
            var consulta = await _contexto.ConsultasMedicas
                .FirstOrDefaultAsync(c => c.IdConsulta == idConsulta);

            if (consulta == null)
            {
                return NotFound("La consulta médica indicada no existe.");
            }

            consulta.MotivoConsulta =
                string.IsNullOrWhiteSpace(solicitud.MotivoConsulta)
                    ? null
                    : solicitud.MotivoConsulta.Trim();

            consulta.Diagnostico =
                string.IsNullOrWhiteSpace(solicitud.Diagnostico)
                    ? null
                    : solicitud.Diagnostico.Trim();

            consulta.Tratamiento =
                string.IsNullOrWhiteSpace(solicitud.Tratamiento)
                    ? null
                    : solicitud.Tratamiento.Trim();

            consulta.Medicamentos =
                string.IsNullOrWhiteSpace(solicitud.Medicamentos)
                    ? null
                    : solicitud.Medicamentos.Trim();

            consulta.Observaciones =
                string.IsNullOrWhiteSpace(solicitud.Observaciones)
                    ? null
                    : solicitud.Observaciones.Trim();

            consulta.ResultadosExamenes =
                string.IsNullOrWhiteSpace(solicitud.ResultadosExamenes)
                    ? null
                    : solicitud.ResultadosExamenes.Trim();

            await _contexto.SaveChangesAsync();

            var auditoria = new Auditoria
            {
                IdUsuario = ObtenerIdUsuarioActual(),
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

            return Ok("Consulta médica actualizada correctamente.");
        }
    }
}