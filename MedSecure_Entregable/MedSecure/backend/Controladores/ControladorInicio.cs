using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace MedSecure.Controladores
{
    [ApiController]
    [Route("api/[controller]")]
    public class ControladorInicioController : ControllerBase
    {
        [HttpGet]
        public IActionResult ObtenerEstado()
        {
            return Ok(new
            {
                mensaje = "MedSecure funciona correctamente",
                estado = "Activo"
            });
        }
        
        [Authorize]
        [HttpGet("protegido")]
        public IActionResult ObtenerEstadoProtegido()
        {
            return Ok(new
            {
                mensaje = "Acceso autorizado correctamente."
            });
        }
        
        [Authorize(Roles = "Administrador")]
        [HttpGet("administrador")]
        public IActionResult Administrador()
        {
            return Ok(new
            {
                mensaje = "Acceso autorizado como Administrador."
            });
        }   
    }
}