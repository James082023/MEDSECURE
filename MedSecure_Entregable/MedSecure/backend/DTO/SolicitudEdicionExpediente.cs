using System.ComponentModel.DataAnnotations;

namespace MedSecure.DTO
{
    public class SolicitudEdicionExpediente
    {
        [MaxLength(1000)]
        public string? ObservacionesGenerales { get; set; }
    }
}