using System.ComponentModel.DataAnnotations;

namespace MedSecure.DTOs
{
    public class SolicitudCambioClave
    {
        [Required]
        public string ContrasenaActual { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string ContrasenaNueva { get; set; } = string.Empty;

        [Required]
        public string ConfirmarContrasena { get; set; } = string.Empty;
    }
}