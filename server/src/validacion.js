export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

export function entero(valor, minimo, maximo, campo) {
  if (!Number.isSafeInteger(valor) || valor < minimo || valor > maximo) {
    throw new ErrorHttp(400, `${campo}: ingresa un número entre ${minimo} y ${maximo}.`);
  }
  return valor;
}

export function identificador(valor) {
  if (!/^[1-9]\d{0,19}$/.test(String(valor)) || BigInt(valor) > 18446744073709551615n) {
    throw new ErrorHttp(400, 'Identificador inválido.');
  }
  return String(valor);
}

export function texto(valor, maximo, campo, requerido = false) {
  const contenido = typeof valor === 'string' ? valor.trim() : '';
  if (contenido.length > maximo || (requerido && !contenido)) {
    throw new ErrorHttp(400, `${campo}: ingresa hasta ${maximo} caracteres.`);
  }
  return contenido;
}