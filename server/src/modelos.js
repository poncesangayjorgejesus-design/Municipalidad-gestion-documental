import { readFileSync } from 'node:fs';

const modelos = JSON.parse(readFileSync(new URL('../ml/modelos/pesos.json', import.meta.url), 'utf8'));
const tipos = modelos.tipos;
// Los trámites agregados usan la familia más cercana al modelo académico.
const familias = new Map([
  ['anuncios', 'licencia'],
  ['comercio_temporal', 'licencia'],
  ['edificacion_a', 'obra'],
  ['edificacion_b', 'obra'],
  ['demolicion', 'obra'],
  ['via_publica', 'servicio'],
  ['numeracion', 'servicio'],
  ['itse', 'licencia'],
  ['espectaculo', 'licencia'],
]);

function inferir(modelo, datos) {
  const puntuacion = modelo.pesos.reduce((total, peso, i) => (
    total + peso * (datos[i] - modelo.media[i]) / modelo.escala[i]
  ), modelo.sesgo);
  return modelo.activacion === 'sigmoid' ? 1 / (1 + Math.exp(-puntuacion)) : puntuacion;
}