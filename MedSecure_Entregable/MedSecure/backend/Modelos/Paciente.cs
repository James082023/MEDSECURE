namespace MedSecure.Modelos
{
    public class Paciente
    {
        public int IdPaciente { get; set; }

        public string Nombres { get; set; } = string.Empty;

        public string Apellidos { get; set; } = string.Empty;

        public string? DocumentoIdentidad { get; set; }

        public DateTime? FechaNacimiento { get; set; }

        public string? Sexo { get; set; }

        public string? Telefono { get; set; }

        public string? Correo { get; set; }

        public string? Direccion { get; set; }

        public DateTime FechaRegistro { get; set; }

        public bool Activo { get; set; }
    }
}