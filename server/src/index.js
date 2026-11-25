import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import { crearBase, filas } from './db.js';
import { expedientesPersonal, expedientesPublicos } from './expedientes.js';
import { curriculos } from './curriculos.js';
import { ErrorHttp } from './validacion.js';

const app = express();
const base = crearBase();
const clave = process.env.ADMIN_PASSWORD;
const clienteDist = process.env.CLIENT_DIST || fileURLToPath(new URL('../../client/dist/', import.meta.url));
