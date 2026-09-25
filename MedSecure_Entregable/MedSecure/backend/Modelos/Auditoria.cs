using System;
using System.ComponentModel.DataAnnotations;

namespace MedSecure.Modelos
{
    public class Auditoria
    {
        [Key]
        public int IdAuditoria { get; set; }

        public int? IdUsuario { get; set; }

        public string Accion { get; set; } = string.Empty;

        public string? Modulo { get; set; }

        public string? Detalles { get; set; }

        public string? DireccionIP { get; set; }

        public DateTime FechaHora { get; set; }
    }
}