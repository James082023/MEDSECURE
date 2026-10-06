using System.ComponentModel.DataAnnotations;

namespace MedSecure.DTO
{
    public class SolicitudRegistroExpediente
    {
        [Range(1, int.MaxValue)]
        public int IdPaciente { get; set; }

        [MaxLength(1000)]
        public string? ObservacionesGenerales { get; set; }
    }
}