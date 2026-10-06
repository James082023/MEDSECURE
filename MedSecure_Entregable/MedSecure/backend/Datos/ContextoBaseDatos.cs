using Microsoft.EntityFrameworkCore;
using MedSecure.Modelos;

namespace MedSecure.Datos
{
    public class ContextoBaseDatos : DbContext
    {
        public ContextoBaseDatos(
            DbContextOptions<ContextoBaseDatos> opciones)
            : base(opciones)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }

        public DbSet<Rol> Roles { get; set; }

        public DbSet<UsuarioRol> UsuarioRoles { get; set; }

        public DbSet<Paciente> Pacientes { get; set; }

        public DbSet<Expediente> Expedientes { get; set; }

        public DbSet<ConsultaMedica> ConsultasMedicas { get; set; }

        public DbSet<Auditoria> Auditorias { get; set; }

        protected override void OnModelCreating(ModelBuilder modelo)
        {
            base.OnModelCreating(modelo);

            modelo.Entity<Usuario>(entidad =>
            {
                entidad.ToTable("Usuarios");

                entidad.HasKey(u => u.IdUsuario);

                entidad.HasIndex(u => u.NombreUsuario)
                    .IsUnique();

                entidad.HasIndex(u => u.Correo)
                    .IsUnique();
            });

            modelo.Entity<Rol>(entidad =>
            {
                entidad.ToTable("Roles");

                entidad.HasKey(r => r.IdRol);

                entidad.HasIndex(r => r.Nombre)
                    .IsUnique();
            });

            modelo.Entity<Paciente>(entidad =>
            {
                entidad.ToTable("Pacientes");

                entidad.HasKey(p => p.IdPaciente);

                entidad.Property(p => p.FechaNacimiento)
                    .HasColumnType("date");

                entidad.HasIndex(p => p.DocumentoIdentidad)
                    .IsUnique()
                    .HasFilter("[DocumentoIdentidad] IS NOT NULL");
            });

            modelo.Entity<Expediente>(entidad =>
            {
                entidad.ToTable("Expedientes");

                entidad.HasKey(e => e.IdExpediente);

                entidad.HasIndex(e => e.IdPaciente)
                    .IsUnique();

                entidad.HasOne<Paciente>()
                    .WithMany()
                    .HasForeignKey(e => e.IdPaciente)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelo.Entity<ConsultaMedica>(entidad =>
            {
                entidad.ToTable("ConsultasMedicas");

                entidad.HasKey(c => c.IdConsulta);

                entidad.HasOne<Expediente>()
                    .WithMany()
                    .HasForeignKey(c => c.IdExpediente)
                    .OnDelete(DeleteBehavior.Restrict);

                entidad.HasOne<Usuario>()
                    .WithMany()
                    .HasForeignKey(c => c.IdUsuario)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelo.Entity<UsuarioRol>(entidad =>
            {
                entidad.ToTable("UsuarioRol");

                entidad.HasKey(ur => new
                {
                    ur.IdUsuario,
                    ur.IdRol
                });

                entidad.HasOne<Usuario>()
                    .WithMany()
                    .HasForeignKey(ur => ur.IdUsuario)
                    .OnDelete(DeleteBehavior.Restrict);

                entidad.HasOne<Rol>()
                    .WithMany()
                    .HasForeignKey(ur => ur.IdRol)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelo.Entity<Auditoria>(entidad =>
            {
                entidad.ToTable("Auditoria");

                entidad.HasKey(a => a.IdAuditoria);

                entidad.HasOne<Usuario>()
                    .WithMany()
                    .HasForeignKey(a => a.IdUsuario)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}