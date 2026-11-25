-- Datos ficticios. Los códigos 44454d4f… identifican registros de demostración.
-- Las estimaciones se generaron con los pesos de Keras incluidos en el ZIP.
USE municipalidad_yau;
START TRANSACTION;

-- Expediente ficticio 1
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000001', id, 7, 3, 0, 1
FROM tipos_tramite WHERE codigo = 'licencia';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 4.610 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 72 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 2
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000002', id, 10, 30, 5, 3
FROM tipos_tramite WHERE codigo = 'obra';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 17.160 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 96 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 90 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 3
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000003', id, 5, 0, 0, 0
FROM tipos_tramite WHERE codigo = 'servicio';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 2.012 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 120 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), UTC_TIMESTAMP()
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 114 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), UTC_TIMESTAMP()
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'resuelto', UTC_TIMESTAMP() - INTERVAL 108 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO encuestas (expediente_id, calificacion, comentario)
SELECT @demo_id, 3, 'Encuesta ficticia de la demostración' WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 4
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000004', id, 10, 12, 2, 0
FROM tipos_tramite WHERE codigo = 'anuncios';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 6.488 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 144 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 138 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 5
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000005', id, 8, 18, 2, 1
FROM tipos_tramite WHERE codigo = 'comercio_temporal';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 8.654 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 168 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 162 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'observado', UTC_TIMESTAMP() - INTERVAL 156 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 6
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000006', id, 7, 2, 0, 1
FROM tipos_tramite WHERE codigo = 'edificacion_a';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 6.494 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 192 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), UTC_TIMESTAMP()
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 186 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), UTC_TIMESTAMP()
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'resuelto', UTC_TIMESTAMP() - INTERVAL 180 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO encuestas (expediente_id, calificacion, comentario)
SELECT @demo_id, 3, 'Encuesta ficticia de la demostración' WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 7
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000007', id, 15, 23, 4, 2
FROM tipos_tramite WHERE codigo = 'edificacion_b';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 14.113 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 216 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 210 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 8
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000008', id, 12, 7, 1, 2
FROM tipos_tramite WHERE codigo = 'demolicion';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 9.189 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 240 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 9
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000009', id, 7, 10, 3, 2
FROM tipos_tramite WHERE codigo = 'via_publica';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 8.107 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 264 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 258 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'observado', UTC_TIMESTAMP() - INTERVAL 252 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 10
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000010', id, 6, 2, 0, 0
FROM tipos_tramite WHERE codigo = 'numeracion';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 2.363 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 288 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), UTC_TIMESTAMP()
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 282 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), UTC_TIMESTAMP()
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'resuelto', UTC_TIMESTAMP() - INTERVAL 276 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO encuestas (expediente_id, calificacion, comentario)
SELECT @demo_id, 4, 'Encuesta ficticia de la demostración' WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 11
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000011', id, 10, 22, 3, 3
FROM tipos_tramite WHERE codigo = 'itse';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 12.286 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 312 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 306 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 12
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000012', id, 8, 4, 0, 1
FROM tipos_tramite WHERE codigo = 'espectaculo';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 4.786 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 336 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 13
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000013', id, 10, 23, 5, 3
FROM tipos_tramite WHERE codigo = 'anuncios';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 13.871 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 360 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 354 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'observado', UTC_TIMESTAMP() - INTERVAL 348 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

-- Expediente ficticio 14
INSERT IGNORE INTO expedientes (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
SELECT '44454d4f000000000000000000000014', id, 6, 5, 0, 1
FROM tipos_tramite WHERE codigo = 'numeracion';
SET @demo_id = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
SELECT @demo_id, 'demo-2026-v1', 4.003 WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'recibido', UTC_TIMESTAMP() - INTERVAL 384 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;
INSERT INTO historial_tramite (expediente_id, estado_codigo, fecha)
SELECT @demo_id, 'revision', UTC_TIMESTAMP() - INTERVAL 378 HOUR WHERE @demo_id IS NOT NULL;
INSERT INTO notificaciones (historial_id, leida_en)
SELECT LAST_INSERT_ID(), NULL
WHERE @demo_id IS NOT NULL;

INSERT IGNORE INTO postulaciones (convocatoria_id, codigo)
SELECT id, '44454d4f0001' FROM convocatorias WHERE codigo = 'CV-DEMO-01';
SET @demo_cv = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO revisiones_cv (postulacion_id, decision_codigo, motivo, prob_revision, version_modelo)
SELECT @demo_cv, 'observar', 'Ejemplo: falta acreditar la experiencia.', 1.0000, 'demo-2026-v1'
WHERE @demo_cv IS NOT NULL;
SET @demo_revision = IF(@demo_cv IS NOT NULL, LAST_INSERT_ID(), NULL);
INSERT INTO verificaciones_cv (revision_id, requisito_id, resultado)
SELECT @demo_revision, q.id, 'cumple' FROM requisitos_cv q
JOIN convocatorias c ON c.id = q.convocatoria_id
WHERE @demo_revision IS NOT NULL AND c.codigo = 'CV-DEMO-01' AND q.descripcion = 'Formación técnica acreditada';
INSERT INTO verificaciones_cv (revision_id, requisito_id, resultado)
SELECT @demo_revision, q.id, 'falta' FROM requisitos_cv q
JOIN convocatorias c ON c.id = q.convocatoria_id
WHERE @demo_revision IS NOT NULL AND c.codigo = 'CV-DEMO-01' AND q.descripcion = 'Experiencia administrativa acreditada';
INSERT INTO verificaciones_cv (revision_id, requisito_id, resultado)
SELECT @demo_revision, q.id, 'cumple' FROM requisitos_cv q
JOIN convocatorias c ON c.id = q.convocatoria_id
WHERE @demo_revision IS NOT NULL AND c.codigo = 'CV-DEMO-01' AND q.descripcion = 'Ficha de postulación completa';

INSERT IGNORE INTO postulaciones (convocatoria_id, codigo)
SELECT id, '44454d4f0002' FROM convocatorias WHERE codigo = 'CV-DEMO-01';
SET @demo_cv = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
INSERT INTO revisiones_cv (postulacion_id, decision_codigo, motivo, prob_revision, version_modelo)
SELECT @demo_cv, 'preseleccionar', 'Ejemplo: se acreditaron los tres requisitos.', 0.0130, 'demo-2026-v1'
WHERE @demo_cv IS NOT NULL;
SET @demo_revision = IF(@demo_cv IS NOT NULL, LAST_INSERT_ID(), NULL);
INSERT INTO verificaciones_cv (revision_id, requisito_id, resultado)
SELECT @demo_revision, q.id, 'cumple' FROM requisitos_cv q
JOIN convocatorias c ON c.id = q.convocatoria_id
WHERE @demo_revision IS NOT NULL AND c.codigo = 'CV-DEMO-01' AND q.descripcion = 'Formación técnica acreditada';
INSERT INTO verificaciones_cv (revision_id, requisito_id, resultado)
SELECT @demo_revision, q.id, 'cumple' FROM requisitos_cv q
JOIN convocatorias c ON c.id = q.convocatoria_id
WHERE @demo_revision IS NOT NULL AND c.codigo = 'CV-DEMO-01' AND q.descripcion = 'Experiencia administrativa acreditada';
INSERT INTO verificaciones_cv (revision_id, requisito_id, resultado)
SELECT @demo_revision, q.id, 'cumple' FROM requisitos_cv q
JOIN convocatorias c ON c.id = q.convocatoria_id
WHERE @demo_revision IS NOT NULL AND c.codigo = 'CV-DEMO-01' AND q.descripcion = 'Ficha de postulación completa';

INSERT IGNORE INTO postulaciones (convocatoria_id, codigo)
SELECT id, '44454d4f0003' FROM convocatorias WHERE codigo = 'CV-DEMO-01';
SET @demo_cv = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);
COMMIT;
