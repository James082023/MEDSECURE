using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedSecure.Datos;

namespace MedSecure.Controladores
{
    [ApiController]
    [Route("api/auditoria")]
    [Authorize(Roles = "Administrador")]
    public class ControladorAuditoriaController : ControllerBase
    {
        private readonly ContextoBaseDatos _contexto;

        public ControladorAuditoriaController(ContextoBaseDatos contexto)
        {
            _contexto = contexto;
        }
       [HttpGet]
        public async Task<IActionResult> ObtenerAuditoria()
        {
            var registros = await _contexto.Auditorias
                .OrderByDescending(a => a.FechaHora)
                .Select(a => new
                {
                    a.IdAuditoria,
                    a.IdUsuario,

                    NombreUsuario = a.IdUsuario.HasValue
                        ? _contexto.Usuarios
                            .Where(u => u.IdUsuario == a.IdUsuario.Value)
                            .Select(u => u.NombreUsuario)
                            .FirstOrDefault()
                        : null,

                    a.Accion,
                    a.Modulo,
                    a.Detalles,
                    a.DireccionIP,
                    a.FechaHora
                })
                .ToListAsync();

            return Ok(registros);
        }
    }
}