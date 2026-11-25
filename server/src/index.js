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

if (!clave || !process.env.DB_PASSWORD) {
  throw new Error('Configura ADMIN_PASSWORD y DB_PASSWORD antes de iniciar el servidor.');
}

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.set({ 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' });
  next();
});
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use('/api', express.json({ limit: '50kb' }));
app.use('/api', (req, _res, next) => {
  const origen = req.get('origin');
  const sitio = req.get('sec-fetch-site');
  if (req.method === 'POST' && (sitio === 'cross-site' ||
      (origen && origen !== `${req.protocol}://${req.get('host')}`))) {
    throw new ErrorHttp(403, 'Envía el formulario desde el portal de Yau.');
  }
  next();
});

app.use('/api', session({
  name: 'yau.sid',
  secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', maxAge: 8 * 60 * 60 * 1000 },
}));