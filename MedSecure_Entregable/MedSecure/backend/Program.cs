using MedSecure.Datos;
using Microsoft.EntityFrameworkCore;
using MedSecure.Servicios;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.Threading.RateLimiting;

var constructor = WebApplication.CreateBuilder(args);

constructor.Services.AddControllers();
constructor.Services.AddScoped<ServicioContrasenas>();
constructor.Services.AddScoped<ServicioToken>();
constructor.Services.AddOpenApi();

constructor.Services.AddRateLimiter(opciones =>
{
    opciones.AddPolicy("LimiteLogin", contexto =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey:
                contexto.Connection.RemoteIpAddress?.ToString()
                ?? "IP_DESCONOCIDA",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }
        )
    );

    opciones.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;

    opciones.OnRejected = async (contexto, tokenCancelacion) =>
    {
        contexto.HttpContext.Response.Headers.RetryAfter = "60";

        await contexto.HttpContext.Response.WriteAsJsonAsync(
            new
            {
                mensaje = "Demasiados intentos. Intenta nuevamente más tarde."
            },
            cancellationToken: tokenCancelacion
        );
    };
});

string claveJwt =
    constructor.Configuration["Jwt:Clave"]
    ?? Environment.GetEnvironmentVariable("JWT_CLAVE")
    ?? throw new InvalidOperationException(
        "No se encontró la configuración de la clave JWT.");

string emisorJwt =
    constructor.Configuration["Jwt:Emisor"]
    ?? Environment.GetEnvironmentVariable("JWT_EMISOR")
    ?? throw new InvalidOperationException(
        "No se encontró la configuración del emisor JWT.");

string audienciaJwt =
    constructor.Configuration["Jwt:Audiencia"]
    ?? Environment.GetEnvironmentVariable("JWT_AUDIENCIA")
    ?? throw new InvalidOperationException(
        "No se encontró la configuración de la audiencia JWT.");

constructor.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opciones =>
    {
        opciones.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = emisorJwt,
                ValidAudience = audienciaJwt,

                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(claveJwt)
                ),

                ClockSkew = TimeSpan.Zero
            };

        opciones.Events = new JwtBearerEvents
        {
            OnTokenValidated = async contexto =>
            {
                string? idTexto = contexto.Principal?
                    .FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!int.TryParse(idTexto, out int idUsuario))
                {
                    contexto.Fail(
                        "El token no contiene un usuario válido."
                    );

                    return;
                }

                string? versionTexto = contexto.Principal?
                    .FindFirst("VersionToken")?.Value;

                if (!int.TryParse(
                    versionTexto,
                    out int versionToken))
                {
                    contexto.Fail(
                        "El token no contiene una versión válida."
                    );

                    return;
                }

                var baseDatos =
                    contexto.HttpContext.RequestServices
                        .GetRequiredService<ContextoBaseDatos>();

                var usuario = await baseDatos.Usuarios
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u =>
                        u.IdUsuario == idUsuario
                    );

                if (usuario == null ||
                    !usuario.Activo ||
                    usuario.VersionToken != versionToken)
                {
                    contexto.Fail(
                        "El usuario está inactivo o el token fue revocado."
                    );

                    return;
                }

                bool esRutaCambioClave =
                    contexto.HttpContext.Request.Path
                        .Equals(
                            "/api/autenticacion/cambiar-clave",
                            StringComparison.OrdinalIgnoreCase
                        );

                if (usuario.DebeCambiarClave &&
                    !esRutaCambioClave)
                {
                    contexto.Fail(
                        "Debe cambiar su contraseña antes de continuar."
                    );

                    return;
                }
            }
        };
    });

string conexionBaseDatos =
    constructor.Configuration.GetConnectionString(
        "ConexionMedSecure"
    )
    ?? Environment.GetEnvironmentVariable(
        "CONEXION_MEDSECURE"
    )
    ?? throw new InvalidOperationException(
        "No se encontró la conexión a la base de datos.");

constructor.Services.AddDbContext<ContextoBaseDatos>(opciones =>
    opciones.UseSqlServer(conexionBaseDatos)
);

constructor.Services.AddCors(opciones =>
{
    opciones.AddPolicy("PoliticaReact", politica =>
    {
        politica
            .WithOrigins(
                "http://localhost:5173",
                "https://medsecureproyecto.netlify.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var aplicacion = constructor.Build();

if (aplicacion.Environment.IsDevelopment())
{
    aplicacion.MapOpenApi();
}

aplicacion.UseHttpsRedirection();

aplicacion.UseCors("PoliticaReact");
aplicacion.UseRateLimiter();
aplicacion.UseAuthentication();
aplicacion.UseAuthorization();
aplicacion.MapControllers();

aplicacion.Run();
