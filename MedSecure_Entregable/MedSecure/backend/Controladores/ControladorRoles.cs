using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedSecure.Datos;
using MedSecure.Modelos;
using System.Security.Claims;

namespace MedSecure.Controladores
{
    [ApiController]
    [Route("api/roles")]
    [Authorize(Roles = "Administrador")]
    public class ControladorRoles : ControllerBase
    {
        private readonly ContextoBaseDatos _contexto;

        public ControladorRoles(ContextoBaseDatos contexto)
        {
            _contexto = contexto;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerRoles()
        {
            var roles = await _contexto.Roles
                .AsNoTracking()
                .Where(r => r.Activo)
                .OrderBy(r => r.IdRol)
                .Select(r => new
                {
                    r.IdRol,
                    r.Nombre
                })
                .ToListAsync();

            return Ok(roles);
        }

        [HttpPost("asignar")]
        public async Task<IActionResult> AsignarRol(
            [FromQuery] int idUsuario,
            [FromQuery] int idRol)
        {
            var idAdministradorTexto =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                idAdministradorTexto,
                out int idAdministrador))
            {
                return Unauthorized(
                    "No se pudo identificar al usuario autenticado."
                );
            }

            var usuario = await _contexto.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.IdUsuario == idUsuario);

            if (usuario == null)
            {
                return NotFound(
                    "El usuario no existe."
                );
            }

            if (!usuario.Activo)
            {
                return Conflict(
                    "No se puede asignar un rol a un usuario inactivo."
                );
            }

            var rol = await _contexto.Roles
                .FirstOrDefaultAsync(r =>
                    r.IdRol == idRol &&
                    r.Activo);

            if (rol == null)
            {
                return NotFound(
                    "El rol no existe o está inactivo."
                );
            }

            bool yaAsignado = await _contexto.UsuarioRoles
                .AnyAsync(ur =>
                    ur.IdUsuario == idUsuario &&
                    ur.IdRol == idRol);

            if (yaAsignado)
            {
                return Conflict(
                    "El usuario ya tiene asignado este rol."
                );
            }

            await using var transaccion =
                await _contexto.Database.BeginTransactionAsync();

            try
            {
                _contexto.UsuarioRoles.Add(
                    new UsuarioRol
                    {
                        IdUsuario = idUsuario,
                        IdRol = idRol
                    }
                );

                usuario.VersionToken++;

                var auditoria = new Auditoria
                {
                    IdUsuario = idAdministrador,
                    Accion = "ASIGNAR_ROL",
                    Modulo = "Roles",
                    Detalles =
                        $"Se asignó el rol {rol.Nombre} (IdRol {idRol}) al usuario con IdUsuario {idUsuario}.",
                    DireccionIP =
                        HttpContext.Connection.RemoteIpAddress?.ToString(),
                    FechaHora = DateTime.UtcNow
                };

                _contexto.Auditorias.Add(auditoria);

                await _contexto.SaveChangesAsync();
                await transaccion.CommitAsync();

                return Ok(
                    "Rol asignado correctamente. Los tokens anteriores fueron revocados."
                );
            }
            catch (DbUpdateException)
            {
                await transaccion.RollbackAsync();

                bool asignacionExiste =
                    await _contexto.UsuarioRoles
                        .AsNoTracking()
                        .AnyAsync(ur =>
                            ur.IdUsuario == idUsuario &&
                            ur.IdRol == idRol);

                if (asignacionExiste)
                {
                    return Conflict(
                        "El usuario ya tiene asignado este rol."
                    );
                }

                throw;
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }
        }

        [HttpDelete("retirar")]
        public async Task<IActionResult> RetirarRol(
            [FromQuery] int idUsuario,
            [FromQuery] int idRol)
        {
            var idAdministradorTexto =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                idAdministradorTexto,
                out int idAdministrador))
            {
                return Unauthorized(
                    "No se pudo identificar al usuario autenticado."
                );
            }

            var usuario = await _contexto.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.IdUsuario == idUsuario);

            if (usuario == null)
            {
                return NotFound(
                    "El usuario no existe."
                );
            }

            if (!usuario.Activo)
            {
                return Conflict(
                    "No se pueden modificar los roles de un usuario inactivo."
                );
            }

            var rolARetirar = await _contexto.Roles
                .FirstOrDefaultAsync(r =>
                    r.IdRol == idRol);

            if (rolARetirar == null)
            {
                return NotFound(
                    "El rol no existe."
                );
            }

            var usuarioRol = await _contexto.UsuarioRoles
                .FirstOrDefaultAsync(ur =>
                    ur.IdUsuario == idUsuario &&
                    ur.IdRol == idRol);

            if (usuarioRol == null)
            {
                return NotFound(
                    "El usuario no tiene asignado este rol."
                );
            }

            if (
                rolARetirar.Nombre == "Administrador" &&
                idAdministrador == idUsuario
            )
            {
                return Conflict(
                    "No puedes retirar tu propio rol de Administrador."
                );
            }

            if (rolARetirar.Nombre == "Administrador")
            {
                int cantidadAdministradoresActivos =
                    await _contexto.UsuarioRoles
                        .Where(ur =>
                            ur.IdRol == idRol)
                        .Join(
                            _contexto.Usuarios,
                            ur => ur.IdUsuario,
                            u => u.IdUsuario,
                            (ur, u) => u
                        )
                        .CountAsync(u => u.Activo);

                if (cantidadAdministradoresActivos <= 1)
                {
                    return Conflict(
                        "No se puede retirar el rol al último Administrador activo del sistema."
                    );
                }
            }

            await using var transaccion =
                await _contexto.Database.BeginTransactionAsync();

            try
            {
                _contexto.UsuarioRoles.Remove(usuarioRol);

                usuario.VersionToken++;

                var auditoria = new Auditoria
                {
                    IdUsuario = idAdministrador,
                    Accion = "RETIRAR_ROL",
                    Modulo = "Roles",
                    Detalles =
                        $"Se retiró el rol {rolARetirar.Nombre} (IdRol {idRol}) al usuario con IdUsuario {idUsuario}.",
                    DireccionIP =
                        HttpContext.Connection.RemoteIpAddress?.ToString(),
                    FechaHora = DateTime.UtcNow
                };

                _contexto.Auditorias.Add(auditoria);

                await _contexto.SaveChangesAsync();
                await transaccion.CommitAsync();

                return Ok(
                    "Rol retirado correctamente. Los tokens anteriores fueron revocados."
                );
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }
        }
    }
}