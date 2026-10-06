USE MedSecure;
GO

CREATE TABLE Roles
(
    IdRol INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL,
    Descripcion NVARCHAR(250) NULL,
    Activo BIT NOT NULL DEFAULT 1
);
GO

CREATE UNIQUE INDEX UX_Roles_Nombre
ON Roles(Nombre);
GO

CREATE TABLE Usuarios
(
    IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario NVARCHAR(100) NOT NULL UNIQUE,
    Correo NVARCHAR(150) NOT NULL UNIQUE,
    ClaveHash NVARCHAR(500) NOT NULL,
    Activo BIT NOT NULL DEFAULT 1,
    DebeCambiarClave BIT NOT NULL DEFAULT 0,
    VersionToken INT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE UsuarioRol
(
    IdUsuario INT NOT NULL,
    IdRol INT NOT NULL,

    CONSTRAINT PK_UsuarioRol
        PRIMARY KEY (IdUsuario, IdRol),

    CONSTRAINT FK_UsuarioRol_Usuario
        FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario),

    CONSTRAINT FK_UsuarioRol_Rol
        FOREIGN KEY (IdRol)
        REFERENCES Roles(IdRol)
);
GO

CREATE TABLE Pacientes
(
    IdPaciente INT IDENTITY(1,1) PRIMARY KEY,
    Nombres NVARCHAR(100) NOT NULL,
    Apellidos NVARCHAR(100) NOT NULL,
    DocumentoIdentidad NVARCHAR(50) NULL,
    FechaNacimiento DATE NULL,
    Sexo NVARCHAR(20) NULL,
    Telefono NVARCHAR(30) NULL,
    Correo NVARCHAR(150) NULL,
    Direccion NVARCHAR(250) NULL,
    FechaRegistro DATETIME2 NOT NULL DEFAULT GETDATE(),
    Activo BIT NOT NULL DEFAULT 1
);
GO

CREATE UNIQUE INDEX UX_Pacientes_DocumentoIdentidad
ON Pacientes(DocumentoIdentidad)
WHERE DocumentoIdentidad IS NOT NULL;
GO

CREATE TABLE Expedientes
(
    IdExpediente INT IDENTITY(1,1) PRIMARY KEY,
    IdPaciente INT NOT NULL,
    FechaCreacion DATETIME2 NOT NULL DEFAULT GETDATE(),
    ObservacionesGenerales NVARCHAR(MAX) NULL,

    CONSTRAINT FK_Expedientes_Pacientes
        FOREIGN KEY (IdPaciente)
        REFERENCES Pacientes(IdPaciente)
);
GO

CREATE UNIQUE INDEX UX_Expedientes_IdPaciente
ON Expedientes(IdPaciente);
GO

CREATE TABLE ConsultasMedicas
(
    IdConsulta INT IDENTITY(1,1) PRIMARY KEY,
    IdExpediente INT NOT NULL,
    IdUsuario INT NULL,
    FechaConsulta DATETIME2 NOT NULL DEFAULT GETDATE(),
    MotivoConsulta NVARCHAR(500) NULL,
    Diagnostico NVARCHAR(MAX) NULL,
    Tratamiento NVARCHAR(MAX) NULL,
    Medicamentos NVARCHAR(MAX) NULL,
    Observaciones NVARCHAR(MAX) NULL,
    ResultadosExamenes NVARCHAR(MAX) NULL,

    CONSTRAINT FK_Consultas_Expedientes
        FOREIGN KEY (IdExpediente)
        REFERENCES Expedientes(IdExpediente),

    CONSTRAINT FK_Consultas_Usuarios
        FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario)
);
GO

CREATE TABLE Auditoria
(
    IdAuditoria INT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario INT NULL,
    Accion NVARCHAR(100) NOT NULL,
    Modulo NVARCHAR(100) NULL,
    Detalles NVARCHAR(MAX) NULL,
    DireccionIP NVARCHAR(50) NULL,
    FechaHora DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Auditoria_Usuarios
        FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario)
);
GO

INSERT INTO Roles
(
    Nombre,
    Descripcion
)
VALUES
(
    'Administrador',
    'Acceso completo al sistema'
),
(
    'Medico',
    'Acceso a pacientes y expedientes médicos'
),
(
    'Recepcion',
    'Gestión de pacientes'
);
GO