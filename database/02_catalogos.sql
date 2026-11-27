USE municipalidad_yau;

INSERT IGNORE INTO areas (id, nombre) VALUES
    (1, 'Desarrollo Económico'), (2, 'Desarrollo Urbano'), (3, 'Servicios Municipales'),
    (4, 'Gestión del Riesgo de Desastres');

INSERT IGNORE INTO tipos_tramite (id, codigo, nombre, area_id, plazo_referencial) VALUES
    (1, 'licencia', 'Licencia de funcionamiento', 1, 7),
    (2, 'obra', 'Permiso de obra', 2, 10),
    (3, 'servicio', 'Solicitud de servicio municipal', 3, 5),
    (4, 'anuncios', 'Autorización de publicidad exterior', 1, 10),
    (5, 'comercio_temporal', 'Autorización de comercio temporal en vía pública', 1, 8),
    (6, 'edificacion_a', 'Licencia de edificación - modalidad A', 2, 7),
    (7, 'edificacion_b', 'Licencia de edificación - modalidad B', 2, 15),
    (8, 'demolicion', 'Licencia de edificación para demolición', 2, 12),
    (9, 'via_publica', 'Autorización de ocupación temporal de vía pública', 3, 7),
    (10, 'numeracion', 'Certificado de numeración municipal', 2, 6),
    (11, 'itse', 'Certificado de Inspección Técnica de Seguridad (ITSE)', 4, 10),
    (12, 'espectaculo', 'Autorización de espectáculo público temporal', 1, 8);

INSERT IGNORE INTO estados_tramite (codigo, nombre) VALUES
    ('recibido', 'Recibido'), ('revision', 'En revisión'),
    ('observado', 'Observado'), ('resuelto', 'Resuelto');

INSERT IGNORE INTO transiciones_tramite (origen, destino) VALUES
    ('recibido', 'revision'), ('revision', 'observado'),
    ('observado', 'revision'), ('revision', 'resuelto');

INSERT IGNORE INTO convocatorias (id, codigo, puesto) VALUES
    (1, 'CV-DEMO-01', 'Asistente administrativo');

INSERT IGNORE INTO requisitos_cv (convocatoria_id, descripcion) VALUES
    (1, 'Formación técnica acreditada'),
    (1, 'Experiencia administrativa acreditada'),
    (1, 'Ficha de postulación completa');

INSERT IGNORE INTO decisiones_cv (codigo, nombre) VALUES
    ('observar', 'Solicitar revisión documental'),
    ('preseleccionar', 'Preseleccionar para entrevista'),
    ('archivar', 'Archivar con observación');
