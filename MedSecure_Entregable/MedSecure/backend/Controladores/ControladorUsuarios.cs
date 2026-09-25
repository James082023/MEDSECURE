using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedSecure.Datos;
using System.Security.Claims;

namespace MedSecure.Controladores
{
    [ApiController]
    [Route("api/usuarios")]
    [Authorize(Roles = "Administrador")]
    public class ControladorUsuarios : ControllerBase
    {
        private readonly ContextoBaseDatos _contexto;

        public ControladorUsuarios(ContextoBaseDatos contexto)
        {
            _contexto = contexto;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerUsuarios()
        {
            var usuarios = await _contexto.Usuarios
                .OrderBy(u => u.IdUsuario)
                .Select(u => new
                {
                    u.IdUsuario,
                    u.NombreUsuario,
                    u.Correo,
                    u.Activo,
                    u.FechaCreacion,

                    Roles = _contexto.UsuarioRoles
                        .Where(ur => ur.IdUsuario == u.IdUsuario)
                        .Join(
                            _contexto.Roles,
                            ur => ur.IdRol,
                            r => r.IdRol,
                            (ur, r) => new
                            {
                                r.IdRol,
                                r.Nombre
                            }
                        )
                        .ToList()
                })
                .ToListAsync();

            return Ok(usuarios);
        }

        [HttpPut("{idUsuario}/desactivar")]
        public async Task<IActionResult> DesactivarUsuario(int idUsuario)
        {
            var usuario = await _contexto.Usuarios
                .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);

            if (usuario == null)
                return NotFound("El usuario no existe.");

            if (!usuario.Activo)
                return Conflict("El usuario ya se encuentra inactivo.");

            var idAdministradorTexto =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(idAdministradorTexto, out int idAdministrador))
                return Unauthorized("No se pudo identificar al usuario autenticado.");

            if (idAdministrador == idUsuario)
                return Conflict("No puedes desactivar tu propia cuenta.");

            usuario.Activo = false;

            usuario.VersionToken++;

            var auditoria = new MedSecure.Modelos.Auditoria
            {
                IdUsuario = idAdministrador,
                Accion = "DESACTIVAR_USUARIO",
                Modulo = "Usuarios",
                Detalles = $"Se desactivó el usuario con IdUsuario {idUsuario}.",
                DireccionIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
                FechaHora = DateTime.UtcNow
            };

            _contexto.Auditorias.Add(auditoria);

            await _contexto.SaveChangesAsync();

            return Ok(
                "Usuario desactivado correctamente. Los tokens anteriores fueron revocados."
            );
        }

        [HttpPut("{idUsuario}/reactivar")]
        public async Task<IActionResult> ReactivarUsuario(int idUsuario)
        {
            var usuario = await _contexto.Usuarios
                .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);

            if (usuario == null)
                return NotFound("El usuario no existe.");

            if (usuario.Activo)
                return Conflict("El usuario ya se encuentra activo.");

            usuario.Activo = true;

            usuario.VersionToken++;

            var idAdministradorTexto =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            int? idAdministrador = null;

            if (int.TryParse(idAdministradorTexto, out int idAdministradorConvertido))
            {
                idAdministrador = idAdministradorConvertido;
            }

            var auditoria = new MedSecure.Modelos.Auditoria
            {
                IdUsuario = idAdministrador,
                Accion = "REACTIVAR_USUARIO",
                Modulo = "Usuarios",
                Detalles = $"Se reactivó el usuario con IdUsuario {idUsuario}.",
                DireccionIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
                FechaHora = DateTime.UtcNow
            };

            _contexto.Auditorias.Add(auditoria);

            await _contexto.SaveChangesAsync();

            return Ok(
                "Usuario reactivado correctamente. Debe iniciar sesión nuevamente."
            );
        }
    }
}