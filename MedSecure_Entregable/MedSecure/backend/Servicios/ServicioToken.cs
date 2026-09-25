using MedSecure.Modelos;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MedSecure.Servicios
{
    public class ServicioToken
    {
        private readonly IConfiguration _configuracion;

        public ServicioToken(IConfiguration configuracion)
        {
            _configuracion = configuracion;
        }

        public string GenerarToken(Usuario usuario, IEnumerable<string> roles)
        {
            string clave = _configuracion["Jwt:Clave"]
                ?? throw new InvalidOperationException(
                    "No se encontró Jwt:Clave.");

            string emisor = _configuracion["Jwt:Emisor"]
                ?? throw new InvalidOperationException(
                    "No se encontró Jwt:Emisor.");

            string audiencia = _configuracion["Jwt:Audiencia"]
                ?? throw new InvalidOperationException(
                    "No se encontró Jwt:Audiencia.");

            var claims = new List<Claim>
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    usuario.IdUsuario.ToString()
                ),
                new Claim(
                    ClaimTypes.Name,
                    usuario.NombreUsuario
                ),
                new Claim(
                    ClaimTypes.Email,
                    usuario.Correo
                ),

                new Claim(
                    "VersionToken",
                    usuario.VersionToken.ToString()
                )
            };

            foreach (string rol in roles)
            {
                claims.Add(
                    new Claim(ClaimTypes.Role, rol)
                );
            }

            var claveSeguridad = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(clave)
            );

            var credenciales = new SigningCredentials(
                claveSeguridad,
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: emisor,
                audience: audiencia,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: credenciales
            );

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
    }
}