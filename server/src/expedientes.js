import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { filas, transaccion } from './db.js';
import { estimarDemora, tiposModelo, versionModelo } from './modelos.js';
import { entero, ErrorHttp, identificador, texto } from './validacion.js';

const subir = multer({ limits: { fileSize: 2_000_000, files: 1, fields: 0, parts: 2 } });
const suscripciones = new Map();
const estadosValidos = new Set(['recibido', 'revision', 'observado', 'resuelto']);
const tamanoPagina = 10;

function notificarCambio(id) {
  for (const respuesta of suscripciones.get(String(id)) ?? []) {
    respuesta.write('event: cambio\ndata: {}\n\n');
  }
}

async function calcularPrediccion(base, entrada) {
  const tipoId = entero(entrada.tipo_id, 1, 65535, 'Tipo de trámite');
  const plazo = entero(entrada.plazo, 1, 365, 'Plazo aplicado');
  const pendientes = entero(entrada.pendientes, 0, 30, 'Pendientes');
  const anexos = entero(entrada.anexos, 0, 5, 'Anexos faltantes');
  const derivaciones = entero(entrada.derivaciones, 0, 3, 'Derivaciones previstas');
  const [tipo] = await filas(base, 'SELECT codigo FROM tipos_tramite WHERE id = ?', [tipoId]);
  if (!tipo || !tiposModelo.has(tipo.codigo)) throw new ErrorHttp(400, 'Selecciona un tipo válido.');
  const dias = Number(estimarDemora(tipo.codigo, pendientes, anexos, derivaciones).toFixed(3));
  return { tipoId, plazo, pendientes, anexos, derivaciones, dias };
}

const seleccionPublica = 'id, codigo, tipo, estado, estado_codigo';

async function expedientePublico(base, codigo) {
  if (!/^[a-f0-9]{32}$/.test(codigo)) {
    throw new ErrorHttp(400, 'El código debe tener 32 caracteres hexadecimales.');
  }
  const [expediente] = await filas(base,
    `SELECT ${seleccionPublica} FROM vista_expedientes WHERE codigo = ?`, [codigo]);
  if (!expediente) throw new ErrorHttp(404, 'No encontramos un expediente con ese código.');
  return expediente;
}

async function registrarEvento(base, expedienteId, estado) {
  const evento = await filas(base,
    'INSERT INTO historial_tramite (expediente_id, estado_codigo) VALUES (?, ?)',
    [expedienteId, estado]);
  await filas(base, 'INSERT INTO notificaciones (historial_id) VALUES (?)', [evento.insertId]);
}

async function historial(base, id) {
  return filas(base, `
    SELECT CAST(h.id AS CHAR) AS id, s.nombre AS estado, h.fecha, n.leida_en IS NOT NULL AS leido
    FROM historial_tramite h
    JOIN estados_tramite s ON s.codigo = h.estado_codigo
    JOIN notificaciones n ON n.historial_id = h.id
    WHERE h.expediente_id = ? ORDER BY h.id DESC
  `, [id]);
}

export function expedientesPublicos(base) {
  const router = Router();

  router.get('/:codigo', async (req, res) => {
    const resultado = await transaccion(base, async (conexion) => {
      const { id, ...expediente } = await expedientePublico(conexion, req.params.codigo);
      const eventos = await historial(conexion, id);
      const [respuesta] = await filas(conexion, 'SELECT 1 FROM encuestas WHERE expediente_id = ?', [id]);
      return { expediente, historial: eventos, encuestado: Boolean(respuesta) };
    });
    res.json(resultado);
  });

  router.get('/:codigo/eventos', async (req, res) => {
    const { id } = await expedientePublico(base, req.params.codigo);
    if (res.destroyed) return;

    const clave = String(id);
    const conexiones = suscripciones.get(clave) ?? new Set();
    if (conexiones.size >= 16 || (!suscripciones.has(clave) && suscripciones.size >= 250)) {
      throw new ErrorHttp(429, 'La actualización automática está ocupada.');
    }
    suscripciones.set(clave, conexiones);
    conexiones.add(res);
    const latido = setInterval(() => res.write(': conectado\n\n'), 20_000);
    res.on('close', () => {
      clearInterval(latido);
      conexiones.delete(res);
      if (!conexiones.size) suscripciones.delete(clave);
    });

    res.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    res.write('retry: 3000\n\n');
  });

  router.post('/:codigo/avisos/leidos', async (req, res) => {
    const hasta = identificador(req.body?.hasta);
    const expediente = await expedientePublico(base, req.params.codigo);
    await filas(base, `UPDATE notificaciones n JOIN historial_tramite h ON h.id = n.historial_id
      SET n.leida_en = CURRENT_TIMESTAMP(6)
      WHERE h.expediente_id = ? AND h.id <= ? AND n.leida_en IS NULL`, [expediente.id, hasta]);
    res.sendStatus(204);
  });

  router.post('/:codigo/encuesta', async (req, res) => {
    const expediente = await expedientePublico(base, req.params.codigo);
    if (expediente.estado_codigo !== 'resuelto') {
      throw new ErrorHttp(409, 'La encuesta aparece cuando se resuelve el trámite.');
    }
    const nota = entero(req.body?.calificacion, 1, 5, 'Calificación');
    const comentario = texto(req.body?.comentario, 300, 'Comentario');
    await filas(base, `INSERT INTO encuestas (expediente_id, calificacion, comentario) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE expediente_id = expediente_id`, [expediente.id, nota, comentario]);
    res.sendStatus(204);
  });

  return router;
}

export function expedientesPersonal(base) {
  const router = Router();

  router.get('/tipos', async (_req, res) => {
    res.json(await filas(base, 'SELECT id, nombre, plazo_referencial FROM tipos_tramite ORDER BY id'));
  });

  router.get('/expedientes', async (req, res) => {
    const busqueda = texto(req.query.q, 80, 'Búsqueda');
    const estado = req.query.estado ?? '';
    if (estado && !estadosValidos.has(estado)) throw new ErrorHttp(400, 'Selecciona un estado válido.');
    const pagina = entero(Number(req.query.pagina ?? 1), 1, 1_000_000, 'Página');
    const filtros = [
      Number(req.query.alertas === '1'), estado, estado,
      busqueda, busqueda, busqueda, busqueda,
    ];
    const condicion = `WHERE (? = 0 OR alerta = 1) AND (? = '' OR estado_codigo = ?)
      AND (? = '' OR LOCATE(?, tipo) > 0 OR LOCATE(?, area) > 0 OR LOCATE(?, codigo) > 0)`;
    const resultado = await transaccion(base, async (conexion) => {
      const [conteo] = await filas(conexion, `SELECT COUNT(*) AS total FROM vista_expedientes ${condicion}`, filtros);
      const total = Number(conteo.total);
      const paginas = Math.max(1, Math.ceil(total / tamanoPagina));
      const actual = Math.min(pagina, paginas);
      const expedientes = await filas(conexion, `SELECT * FROM vista_expedientes ${condicion}
        ORDER BY alerta DESC, IF(alerta = 1, diferencia, 0) DESC, id DESC
        LIMIT ? OFFSET ?`, [...filtros, tamanoPagina, (actual - 1) * tamanoPagina]);
      const [encuesta] = await filas(conexion, 'SELECT COUNT(*) cantidad, AVG(calificacion) promedio FROM encuestas');
      const [resumen] = await filas(conexion, `SELECT COUNT(*) AS total,
        COALESCE(SUM(estado_codigo <> 'resuelto'), 0) AS abiertos, COALESCE(SUM(alerta), 0) AS riesgos,
        COALESCE(SUM(estado_codigo = 'resuelto'), 0) AS resueltos FROM vista_expedientes`);
      return {
        expedientes, encuesta,
        resumen: Object.fromEntries(Object.entries(resumen).map(([clave, valor]) => [clave, Number(valor)])),
        paginacion: { total, paginas, pagina: actual },
      };
    });
    res.json(resultado);
  });

  router.get('/expedientes/areas', async (_req, res) => {
    const areas = await filas(base, `SELECT area, COUNT(*) AS total,
      SUM(estado_codigo <> 'resuelto') AS abiertos, SUM(alerta) AS riesgos,
      SUM(estado_codigo = 'resuelto') AS resueltos
      FROM vista_expedientes GROUP BY area ORDER BY riesgos DESC, abiertos DESC, area ASC`);
    res.json(areas);
  });

  router.post('/expedientes/prediccion', async (req, res) => {
    const { dias, plazo } = await calcularPrediccion(base, req.body ?? {});
    res.json({ dias_estimados: dias, plazo, alerta: dias > plazo });
  });

  router.post('/expedientes', async (req, res) => {
    const { tipoId, plazo, pendientes, anexos, derivaciones, dias } = await calcularPrediccion(base, req.body ?? {});
    const codigo = randomBytes(16).toString('hex');
    const id = await transaccion(base, async (conexion) => {
      const alta = await filas(conexion, `INSERT INTO expedientes
        (codigo, tipo_id, plazo_aplicado, pendientes, anexos_faltantes, derivaciones_previstas)
        VALUES (?, ?, ?, ?, ?, ?)`, [codigo, tipoId, plazo, pendientes, anexos, derivaciones]);
      await filas(conexion, `INSERT INTO predicciones (expediente_id, version_modelo, dias_estimados)
        VALUES (?, ?, ?)`, [alta.insertId, versionModelo, dias]);
      await registrarEvento(conexion, alta.insertId, 'recibido');
      return String(alta.insertId);
    });
    res.status(201).json({ id, codigo });
  });

  router.get('/expedientes/:id', async (req, res) => {
    const id = identificador(req.params.id);
    const resultado = await transaccion(base, async (conexion) => {
      const [expediente] = await filas(conexion, 'SELECT * FROM vista_expedientes WHERE id = ?', [id]);
      if (!expediente) throw new ErrorHttp(404, 'Expediente no encontrado.');
      const estados = await filas(conexion, `SELECT s.codigo, s.nombre FROM transiciones_tramite t
        JOIN estados_tramite s ON s.codigo = t.destino WHERE t.origen = ? ORDER BY s.nombre`,
      [expediente.estado_codigo]);
      const documentos = await filas(conexion, 'SELECT id, nombre FROM documentos WHERE expediente_id = ? ORDER BY id DESC', [id]);
      return { expediente, estados, documentos, historial: await historial(conexion, id) };
    });
    res.json(resultado);
  });
