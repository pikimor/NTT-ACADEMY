CREATE DATABASE Proyecto_CUN_TalentoTI;
USE Proyecto_CUN_TalentoTI;
CREATE TABLE Usuarios (
    usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    rol ENUM('estudiante', 'reclutador') DEFAULT 'estudiante'
);
CREATE TABLE Modulos (
    modulo_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tema VARCHAR(100) NOT NULL
);
CREATE TABLE Calificaciones (
    calificacion_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    modulo_id INT,
    nota DECIMAL(3,2),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (modulo_id) REFERENCES Modulos(modulo_id)
);
CREATE TABLE Candidatos_Elite (
    elite_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNIQUE,
    promedio_final DECIMAL(3,2),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id)
);
DELIMITER //

CREATE TRIGGER AutomatizarSeleccion
AFTER INSERT ON Calificaciones
FOR EACH ROW
BEGIN
    DECLARE promedio_actual DECIMAL(3,2);

    -- 1. Calculamos el promedio del estudiante que acaba de recibir la nota
    SELECT AVG(nota) INTO promedio_actual 
    FROM Calificaciones 
    WHERE usuario_id = NEW.usuario_id;

    -- 2. Si el promedio es de excelencia, lo enviamos a la tabla Elite
    IF promedio_actual >= 4.5 THEN
        INSERT INTO Candidatos_Elite (usuario_id, promedio_final)
        VALUES (NEW.usuario_id, promedio_actual)
        ON DUPLICATE KEY UPDATE promedio_final = promedio_actual;
    END IF;
END //

DELIMITER ;

-- Registro de usuarios
INSERT INTO Usuarios (nombre, correo) 
VALUES ('Carlos TI', 'carlos@cun.edu.co');

SELECT * FROM Usuarios

-- Registro de Tema
INSERT INTO Modulos (nombre_tema)
VALUES ('Base de Datos Avanzado');

SELECT * FROM Modulos

-- Incertar la nota
INSERT INTO Calificaciones (usuario_id, modulo_id, nota) 
VALUES (1, 1, 4.8);

SELECT * FROM Calificaciones

-- Verificacion de Automatizacion
SELECT * FROM Candidatos_Elite;
