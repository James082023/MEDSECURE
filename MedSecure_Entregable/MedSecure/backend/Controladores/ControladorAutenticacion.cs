using MedSecure.Datos;
using MedSecure.DTOs;
using MedSecure.Modelos;
using MedSecure.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;

namespace MedSecure.Controladores
{
    [ApiController]
    [Route("api/autenticacion")]
    public class ControladorAutenticacionController : ControllerBase
    {
        private readonly ContextoBaseDatos _contexto;
        private readonly ServicioContrasenas _servicioContrasenas;
        private readonly ServicioToken _servicioToken;

        public ControladorAutenticacionController(
        ContextoBaseDatos contexto,
        ServicioContrasenas servicioContrasenas,
        ServicioToken servicioToken)
        {
            _contexto = contexto;
            _servicioContrasenas = servicioContrasenas;
            _servicioToken = servicioToken;
        }

        [HttpPost("login")]
        [EnableRateLimiting("LimiteLogin")]
        public async Task<IActionResult> IniciarSesion(
            [FromBody] SolicitudLogin solicitud)
        {
            Usuario? usuario = await _contexto.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.NombreUsuario == solicitud.NombreUsuario);

            if (usuario == null || !usuario.Activo)
            {
                var auditoriaFallida = new Auditoria
                {
                    IdUsuario = usuario?.IdUsuario,
                    Accion = "INICIO_SESION_FALLIDO",
                    Modulo = "Autenticacion",
                    Detalles = "Intento de inicio de sesión fallido.",
                    DireccionIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    FechaHora = DateTime.UtcNow
                };

                _contexto.Auditorias.Add(auditoriaFallida);

                await _contexto.SaveChangesAsync();

                return Unauthorized(new
                {
                    mensaje = "Credenciales incorrectas."
                });
            }

            bool contrasenaValida =
                _servicioContrasenas.VerificarContrasena(
                    usuario,
                    solicitud.Contrasena
                );

            if (!contrasenaValida)
            {
                var auditoriaFallida = new Auditoria
                {
                    IdUsuario = usuario.IdUsuario,
                    Accion = "INICIO_SESION_FALLIDO",
                    Modulo = "Autenticacion",
                    Detalles = "Intento de inicio de sesión fallido por credenciales incorrectas.",
                    DireccionIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    FechaHora = DateTime.UtcNow
                };

                _contexto.Auditorias.Add(auditoriaFallida);

                await _contexto.SaveChangesAsync();

                return Unauthorized(new
                {
                    mensaje = "Credenciales incorrectas."
                });
            }

            List<string> roles = await _contexto.UsuarioRoles
            .Where(ur => ur.IdUsuario == usuario.IdUsuario)
            .Join(
                _contexto.Roles,
                ur => ur.IdRol,
                rol => rol.IdRol,
                (ur, rol) => rol
            )
            .Where(rol => rol.Activo)
            .Select(rol => rol.Nombre)
            .ToListAsync();

            string token = _servicioToken.GenerarToken(usuario, roles);

            var auditoria = new Auditoria
            {
                IdUsuario = usuario.IdUsuario,
                Accion = "INICIO_SESION",
                Modulo = "Autenticacion",
                Detalles = "Inicio de sesión exitoso.",
                DireccionIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
                FechaHora = DateTime.UtcNow
            };

            _contexto.Auditorias.Add(auditoria);

            await _contexto.SaveChangesAsync();

                return Ok(new
                {
                    mensaje = "Inicio de sesión correcto.",
                    token = token,
                    tipoToken = "Bearer",
                    expiracionMinutos = 30,
                    idUsuario = usuario.IdUsuario,
                    roles = roles
                });
        }

        [Authorize(Roles = "Administrador")]
        [HttpPost("registro")]
        public async Task<IActionResult> RegistrarUsuario(
            [FromBody] SolicitudRegistro solicitud)
        {
            bool usuarioExiste = await _contexto.Usuarios
                .AnyAsync(u =>
                    u.NombreUsuario == solicitud.NombreUsuario ||
                    u.Correo == solicitud.Correo);

            if (usuarioExiste)
            {
                return Conflict(new
                {
                    mensaje = "El nombre de usuario o correo ya está registrado."
                });
            }

            Usuario nuevoUsuario = new Usuario
            {
                NombreUsuario = solicitud.NombreUsuario,
                Correo = solicitud.Correo,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            nuevoUsuario.ClaveHash =
                _servicioContrasenas.GenerarHash(
                    nuevoUsuario,
                    solicitud.Contrasena
                );

            var idAdministradorTexto =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(idAdministradorTexto, out int idAdministrador))
            {
                return Unauthorized(new
                {
                    mensaje = "No se pudo identificar al usuario autenticado."
                });
            }

            await using var transaccion = await _contexto.Database.BeginTransactionAsync();

            try
            {
            _contexto.Usuarios.Add(nuevoUsuario);

            await _contexto.SaveChangesAsync();

            var auditoria = new Auditoria
            {
                IdUsuario = idAdministrador,
                Accion = "CREAR_USUARIO",
                Modulo = "Usuarios",
                Detalles =
                    $"Se creó el usuario {nuevoUsuario.NombreUsuario} " +
                    $"con IdUsuario {nuevoUsuario.IdUsuario}.",
                DireccionIP = HttpContext.Connection.RemoteIpAddress?.ToString(),
                FechaHora = DateTime.UtcNow
            };

            _contexto.Auditorias.Add(auditoria);

            await _contexto.SaveChangesAsync();

            await transaccion.CommitAsync();

            return StatusCode(201, new
            
                {
                    mensaje = "Usuario registrado correctamente.",
                    idUsuario = nuevoUsuario.IdUsuario
                });
            }
            catch (DbUpdateException ex)
            when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx &&
                (sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                await transaccion.RollbackAsync();

                return Conflict(new
                {
                    mensaje = "El nombre de usuario o correo ya está registrado."
                });
            }
            catch
            {
                await transaccion.RollbackAsync();
                throw;
            }
        }
    }
}