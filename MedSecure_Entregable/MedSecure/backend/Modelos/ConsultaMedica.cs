namespace MedSecure.Modelos
{
    public class ConsultaMedica
    {
        public int IdConsulta { get; set; }

        public int IdExpediente { get; set; }

        public int? IdUsuario { get; set; }

        public DateTime FechaConsulta { get; set; }

        public string? MotivoConsulta { get; set; }

        public string? Diagnostico { get; set; }

        public string? Tratamiento { get; set; }

        public string? Medicamentos { get; set; }

        public string? Observaciones { get; set; }

        public string? ResultadosExamenes { get; set; }
    }
}