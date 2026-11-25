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

app.get('/api/salud', async (_req, res) => {
  try {
    await filas(base, 'SELECT id FROM vista_expedientes LIMIT 1');
    const tipos = await filas(base, 'SELECT id FROM tipos_tramite LIMIT 1');
    if (!tipos.length) throw new Error('Catálogos vacíos.');
    res.json({ servidor: 'activo', base_de_datos: 'lista' });
  } catch {
    res.status(503).json({ servidor: 'activo', base_de_datos: 'no disponible' });
  }
});

const hash = (valor) => createHash('sha256').update(valor).digest();

app.get('/api/sesion', (req, res) => res.json({ personal: req.session.personal === true }));
app.post('/api/sesion', (req, res, next) => {
  const enviada = typeof req.body?.clave === 'string' ? req.body.clave : '';
  if (!timingSafeEqual(hash(enviada), hash(clave))) throw new ErrorHttp(401, 'Contraseña incorrecta.');
  req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.personal = true;
    req.session.save((errorGuardado) => {
      if (errorGuardado) return next(errorGuardado);
      res.json({ personal: true });
    });
  });
});
app.post('/api/sesion/salir', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('yau.sid').sendStatus(204);
  });
});