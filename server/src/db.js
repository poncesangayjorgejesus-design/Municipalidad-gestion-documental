import mysql from 'mysql2/promise';

export function crearBase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'app_yau',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'municipalidad_yau',
    timezone: 'Z',
    supportBigNumbers: true,
    bigNumberStrings: true,
    decimalNumbers: true,
    connectTimeout: 5000,
    connectionLimit: 8,
    queueLimit: 40,
  });
  pool.on('connection', (conexion) => {
    conexion.query("SET time_zone = '+00:00'", (error) => {
      if (error) conexion.destroy();
    });
  });
  return pool;
}

export async function filas(base, sql, parametros = []) {
  const [resultado] = await base.execute(sql, parametros);
  return resultado;
}

export async function transaccion(base, operacion) {
  const conexion = await base.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await operacion(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}