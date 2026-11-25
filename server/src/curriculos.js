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
