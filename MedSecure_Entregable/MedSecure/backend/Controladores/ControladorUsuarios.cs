using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedSecure.Datos;
using MedSecure.Modelos;
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
                .AsNoTracking()
                .OrderBy(u => u.IdUsuario)
                .Select(u => new
                {
                    u.IdUsuario,
                    u.NombreUsuario,
                    u.Correo,
                    u.Activo,
                    u.DebeCambiarClave,
                    u.FechaCreacion,

                    Roles = _contexto.UsuarioRoles
                        .Where(ur =>
                            ur.IdUsuario == u.IdUsuario)
                        .Join(
                            _contexto.Roles,
                            ur => ur.IdRol,
                            rol => rol.IdRol,
                            (ur, rol) => new
                            {
                                rol.IdRol,
                                rol.Nombre
                            }
                        )
                        .ToList()
                })
                .ToListAsync();

            return Ok(usuarios);
        }

        [HttpPut("{idUsuario}/desactivar")]
        public async Task<IActionResult> DesactivarUsuario(
            int idUsuario)
        {
            var idAdministradorTexto =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                idAdministradorTexto,
                out int idAdministrador))
            {
                return Unauthorized(
                    "No se pudo identificar al usuario autenticado."
                );
            }

            if (idAdministrador == idUsuario)
            {
                return Conflict(
                    "No puedes desactivar tu propia cuenta."
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
                    "El usuario ya se encuentra inactivo."
                );
            }

            bool esAdministrador =
                await _contexto.UsuarioRoles
                    .Where(ur =>
                        ur.IdUsuario == idUsuario)
                    .Join(
                        _contexto.Roles,
                        ur => ur.IdRol,
                        rol => rol.IdRol,
                        (ur, rol) => rol
                    )
                    .AnyAsync(rol =>
                        rol.Nombre == "Administrador");

            if (esAdministrador)
            {
                int cantidadAdministradoresActivos =
                    await _contexto.UsuarioRoles
                        .Join(
                            _contexto.Roles,
                            ur => ur.IdRol,
                            rol => rol.IdRol,
                            (ur, rol) => new
                            {
                                ur.IdUsuario,
                                Rol = rol
                            }
                        )
                        .Where(x =>
                            x.Rol.Nombre == "Administrador")
                        .Join(
                            _contexto.Usuarios,
                            x => x.IdUsuario,
                            u => u.IdUsuario,
                            (x, u) => u
                        )
                        .CountAsync(u => u.Activo);

                if (cantidadAdministradoresActivos <= 1)
                {
                    return Conflict(
                        "No se puede desactivar al último Administrador activo del sistema."
                    );
                }
            }

            await using var transaccion =
                await _contexto.Database
                    .BeginTransactionAsync();

            try
            {
                usuario.Activo = false;
                usuario.VersionToken++;

                var auditoria = new Auditoria
                {
                    IdUsuario = idAdministrador,
                    Accion = "DESACTIVAR_USUARIO",
                    Modulo = "Usuarios",
                    Detalles =
                        $"Se desactivó el usuario con IdUsuario {idUsuario}.",
                    DireccionIP =
                        HttpContext.Connection
                            .RemoteIpAddress?.ToString(),
                    FechaHora = DateTime.UtcNow
                };

                _contexto.Auditorias.Add(auditoria);

                await _contexto.SaveChangesAsync();
                await transaccion.CommitAsync();

                return Ok(
                    "Usuario desactivado correctamente. Los tokens anteriores fueron revocados."
                );
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }
        }

        [HttpPut("{idUsuario}/reactivar")]
        public async Task<IActionResult> ReactivarUsuario(
            int idUsuario)
        {
            var idAdministradorTexto =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

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

            if (usuario.Activo)
            {
                return Conflict(
                    "El usuario ya se encuentra activo."
                );
            }

            await using var transaccion =
                await _contexto.Database
                    .BeginTransactionAsync();

            try
            {
                usuario.Activo = true;
                usuario.VersionToken++;

                var auditoria = new Auditoria
                {
                    IdUsuario = idAdministrador,
                    Accion = "REACTIVAR_USUARIO",
                    Modulo = "Usuarios",
                    Detalles =
                        $"Se reactivó el usuario con IdUsuario {idUsuario}.",
                    DireccionIP =
                        HttpContext.Connection
                            .RemoteIpAddress?.ToString(),
                    FechaHora = DateTime.UtcNow
                };

                _contexto.Auditorias.Add(auditoria);

                await _contexto.SaveChangesAsync();
                await transaccion.CommitAsync();

                return Ok(
                    "Usuario reactivado correctamente. Debe iniciar sesión nuevamente."
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