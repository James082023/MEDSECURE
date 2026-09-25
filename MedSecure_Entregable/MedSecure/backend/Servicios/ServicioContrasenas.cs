using MedSecure.Modelos;
using Microsoft.AspNetCore.Identity;

namespace MedSecure.Servicios
{
    public class ServicioContrasenas
    {
        private readonly PasswordHasher<Usuario> _generador;

        public ServicioContrasenas()
        {
            _generador = new PasswordHasher<Usuario>();
        }

        public string GenerarHash(Usuario usuario, string contrasena)
        {
            return _generador.HashPassword(usuario, contrasena);
        }

        public bool VerificarContrasena(
            Usuario usuario,
            string contrasena)
        {
            var resultado = _generador.VerifyHashedPassword(
                usuario,
                usuario.ClaveHash,
                contrasena
            );

            return resultado != PasswordVerificationResult.Failed;
        }
    }
}