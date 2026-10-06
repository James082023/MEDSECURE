namespace MedSecure.Modelos
{
    public class Usuario
    {
        public int IdUsuario { get; set; }

        public string NombreUsuario { get; set; } = string.Empty;

        public string Correo { get; set; } = string.Empty;

        public string ClaveHash { get; set; } = string.Empty;

        public bool Activo { get; set; }

        public bool DebeCambiarClave { get; set; }

        public int VersionToken { get; set; } = 1;

        public DateTime FechaCreacion { get; set; }
    }
}