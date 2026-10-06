using System.ComponentModel.DataAnnotations;

namespace MedSecure.Modelos
{
    public class ConsultaMedica
    {
        public int IdConsulta { get; set; }

        public int IdExpediente { get; set; }

        public int? IdUsuario { get; set; }

        public DateTime FechaConsulta { get; set; }

        [MaxLength(500)]
        public string? MotivoConsulta { get; set; }

        [MaxLength(1000)]
        public string? Diagnostico { get; set; }

        [MaxLength(1000)]
        public string? Tratamiento { get; set; }

        [MaxLength(1000)]
        public string? Medicamentos { get; set; }

        [MaxLength(1000)]
        public string? Observaciones { get; set; }

        [MaxLength(2000)]
        public string? ResultadosExamenes { get; set; }
    }
}