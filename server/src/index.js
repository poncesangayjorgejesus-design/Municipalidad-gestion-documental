import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import { crearBase, filas } from './db.js';
import { expedientesPersonal, expedientesPublicos } from './expedientes.js';
import { curriculos } from './curriculos.js';
import { ErrorHttp } from './validacion.js';

