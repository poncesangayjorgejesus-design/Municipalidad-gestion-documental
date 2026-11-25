import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { filas, transaccion } from './db.js';
import { orientarCurriculo, versionModelo } from './modelos.js';
import { entero, ErrorHttp, identificador, texto } from './validacion.js';

const resultadosValidos = new Set(['cumple', 'falta', 'ilegible']);

async function cargarPostulacion(base, id) {
  const [postulacion] = await filas(base, `SELECT p.id, p.codigo, p.convocatoria_id, c.puesto
    FROM postulaciones p JOIN convocatorias c ON c.id = p.convocatoria_id WHERE p.id = ?`, [id]);
  if (!postulacion) throw new ErrorHttp(404, 'Postulación no encontrada.');
  const requisitos = await filas(base, 'SELECT id, descripcion FROM requisitos_cv WHERE convocatoria_id = ? ORDER BY id',
    [postulacion.convocatoria_id]);
  return { postulacion, requisitos };
}

async function evaluar(base, id, entrada) {
  const { requisitos } = await cargarPostulacion(base, id);
  const resultados = requisitos.map(({ id: requisito }) => entrada?.[requisito]);
  if (!resultados.length || resultados.some((valor) => !resultadosValidos.has(valor))) {
    throw new ErrorHttp(400, 'Verifica todos los requisitos de la convocatoria.');
  }
  return { requisitos, resultados, probabilidad: orientarCurriculo(resultados) };
}

export function curriculos(base) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const convocatorias = await filas(base, 'SELECT id, codigo, puesto FROM convocatorias ORDER BY id DESC');
    const postulaciones = await filas(base, `SELECT p.id, p.codigo, c.puesto FROM postulaciones p
      JOIN convocatorias c ON c.id = p.convocatoria_id ORDER BY p.id DESC LIMIT 100`);
    res.json({ convocatorias, postulaciones });
  });

    router.post('/', async (req, res) => {
    const convocatoriaId = entero(req.body?.convocatoria_id, 1, 65535, 'Convocatoria');
    const [convocatoria] = await filas(base, 'SELECT id FROM convocatorias WHERE id = ?', [convocatoriaId]);
    if (!convocatoria) throw new ErrorHttp(400, 'Selecciona una convocatoria válida.');
    const codigo = randomBytes(6).toString('hex');
    const alta = await filas(base, 'INSERT INTO postulaciones (convocatoria_id, codigo) VALUES (?, ?)',
      [convocatoriaId, codigo]);
    res.status(201).json({ id: String(alta.insertId), codigo });
  });