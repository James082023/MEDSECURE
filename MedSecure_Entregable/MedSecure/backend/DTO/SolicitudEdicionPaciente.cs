using System.ComponentModel.DataAnnotations;

namespace MedSecure.DTO
{
    public class SolicitudEdicionPaciente
    {
        [Required]
        [MaxLength(100)]
        public string Nombres { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Apellidos { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? DocumentoIdentidad { get; set; }

        public DateTime? FechaNacimiento { get; set; }

        [MaxLength(20)]
        public string? Sexo { get; set; }

        [MaxLength(30)]
        public string? Telefono { get; set; }

        [EmailAddress]
        [MaxLength(150)]
        public string? Correo { get; set; }

        [MaxLength(250)]
        public string? Direccion { get; set; }
    }
}