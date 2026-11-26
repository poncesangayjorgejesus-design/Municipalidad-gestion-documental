CREATE DATABASE IF NOT EXISTS municipalidad_yau
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE municipalidad_yau;

CREATE TABLE IF NOT EXISTS areas (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipos_tramite (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(25) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    area_id SMALLINT UNSIGNED NOT NULL,
    plazo_referencial SMALLINT UNSIGNED NOT NULL CHECK (plazo_referencial > 0),
    FOREIGN KEY (area_id) REFERENCES areas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estados_tramite (
    codigo VARCHAR(16) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transiciones_tramite (
    origen VARCHAR(16) NOT NULL,
    destino VARCHAR(16) NOT NULL,
    PRIMARY KEY (origen, destino),
    CHECK (origen <> destino),
    FOREIGN KEY (origen) REFERENCES estados_tramite(codigo),
    FOREIGN KEY (destino) REFERENCES estados_tramite(codigo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expedientes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    tipo_id SMALLINT UNSIGNED NOT NULL,
    plazo_aplicado SMALLINT UNSIGNED NOT NULL CHECK (plazo_aplicado BETWEEN 1 AND 365),
    pendientes SMALLINT UNSIGNED NOT NULL CHECK (pendientes <= 30),
    anexos_faltantes TINYINT UNSIGNED NOT NULL CHECK (anexos_faltantes <= 5),
    derivaciones_previstas TINYINT UNSIGNED NOT NULL CHECK (derivaciones_previstas <= 3),
    FOREIGN KEY (tipo_id) REFERENCES tipos_tramite(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historial_tramite (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    expediente_id BIGINT UNSIGNED NOT NULL,
    estado_codigo VARCHAR(16) NOT NULL,
    fecha TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX historial_expediente (expediente_id, id),
    FOREIGN KEY (expediente_id) REFERENCES expedientes(id),
    FOREIGN KEY (estado_codigo) REFERENCES estados_tramite(codigo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notificaciones (
    historial_id BIGINT UNSIGNED PRIMARY KEY,
    leida_en TIMESTAMP(6) NULL DEFAULT NULL,
    FOREIGN KEY (historial_id) REFERENCES historial_tramite(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documentos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    expediente_id BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    contenido MEDIUMBLOB NOT NULL,
    subido_en TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (expediente_id) REFERENCES expedientes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS predicciones (
    expediente_id BIGINT UNSIGNED PRIMARY KEY,
    version_modelo VARCHAR(40) NOT NULL,
    dias_estimados DECIMAL(8,3) NOT NULL CHECK (dias_estimados >= 0),
    FOREIGN KEY (expediente_id) REFERENCES expedientes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS encuestas (
    expediente_id BIGINT UNSIGNED PRIMARY KEY,
    calificacion TINYINT UNSIGNED NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario VARCHAR(300) NOT NULL,
    fecha TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (expediente_id) REFERENCES expedientes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS convocatorias (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    puesto VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS requisitos_cv (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    convocatoria_id SMALLINT UNSIGNED NOT NULL,
    descripcion VARCHAR(150) NOT NULL,
    UNIQUE (convocatoria_id, descripcion),
    FOREIGN KEY (convocatoria_id) REFERENCES convocatorias(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS postulaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    convocatoria_id SMALLINT UNSIGNED NOT NULL,
    codigo CHAR(12) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    registrada_en TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (convocatoria_id) REFERENCES convocatorias(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS decisiones_cv (
    codigo VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS revisiones_cv (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    postulacion_id BIGINT UNSIGNED NOT NULL,
    decision_codigo VARCHAR(20) NOT NULL,
    motivo VARCHAR(300) NOT NULL,
    prob_revision DECIMAL(5,4) NOT NULL CHECK (prob_revision BETWEEN 0 AND 1),
    version_modelo VARCHAR(40) NOT NULL,
    fecha TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id),
    FOREIGN KEY (decision_codigo) REFERENCES decisiones_cv(codigo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS verificaciones_cv (
    revision_id BIGINT UNSIGNED NOT NULL,
    requisito_id SMALLINT UNSIGNED NOT NULL,
    resultado VARCHAR(12) NOT NULL CHECK (resultado IN ('cumple', 'falta', 'ilegible')),
    PRIMARY KEY (revision_id, requisito_id),
    FOREIGN KEY (revision_id) REFERENCES revisiones_cv(id),
    FOREIGN KEY (requisito_id) REFERENCES requisitos_cv(id)
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW vista_expedientes AS
SELECT e.id, e.codigo, e.plazo_aplicado, t.nombre AS tipo, a.nombre AS area,
       h.id AS historial_id, h.estado_codigo, s.nombre AS estado,
       p.dias_estimados, p.version_modelo,
       p.dias_estimados - e.plazo_aplicado AS diferencia,
       IF(p.dias_estimados > e.plazo_aplicado AND h.estado_codigo <> 'resuelto', 1, 0) AS alerta
FROM expedientes e
JOIN tipos_tramite t ON t.id = e.tipo_id
JOIN areas a ON a.id = t.area_id
JOIN historial_tramite h ON h.id = (
    SELECT MAX(h2.id) FROM historial_tramite h2 WHERE h2.expediente_id = e.id
)
JOIN estados_tramite s ON s.codigo = h.estado_codigo
JOIN predicciones p ON p.expediente_id = e.id;
