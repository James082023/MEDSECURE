namespace MedSecure.Modelos
{
    public class Expediente
    {
        public int IdExpediente { get; set; }

        public int IdPaciente { get; set; }

        public DateTime FechaCreacion { get; set; }

        public string? ObservacionesGenerales { get; set; }
    }
}