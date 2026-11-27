import { useEffect, useState } from 'react';

const formatoPromedio = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export default function ResumenTramites({ encuesta, actualizacion, alVencerSesion }) {
  const [abierto, setAbierto] = useState(false);
  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const cantidad = Number(encuesta?.cantidad ?? 0);

  useEffect(() => {
    if (!abierto) return;

    const solicitud = new AbortController();

    async function cargarAreas() {
      setCargando(true);
      setError('');

      try {
        const respuesta = await fetch('/api/personal/expedientes/areas', {
          headers: { Accept: 'application/json' },
          signal: solicitud.signal,
        });

        if (solicitud.signal.aborted) return;

        if (respuesta.status === 401) {
          alVencerSesion();
          return;
        }

        if (!respuesta.ok) throw new Error('Error al cargar las áreas');

        const resultado = await respuesta.json();
        if (!solicitud.signal.aborted) setAreas(resultado);
      } catch {
        if (!solicitud.signal.aborted) {
          setError('No se pudo cargar la información por área.');
        }
      } finally {
        if (!solicitud.signal.aborted) setCargando(false);
      }
    }

    cargarAreas();
    return () => solicitud.abort();
  }, [abierto, actualizacion, intento, alVencerSesion]);

  function alternarAreas() {
    if (!abierto) {
      setCargando(true);
      setError('');
    }

    setAbierto(!abierto);
  }

  return (
    <section className="card portada-yau shadow-sm mt-4" aria-labelledby="titulo-resumen">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="h5 mb-1" id="titulo-resumen">Resumen de atención</h2>
            <p className="text-body-secondary mb-0">
              {cantidad > 0 ? (
                <>
                  Satisfacción promedio{' '}
                  <strong>{formatoPromedio.format(Number(encuesta.promedio))} de 5</strong>
                  {' · '}{cantidad} {cantidad === 1 ? 'respuesta' : 'respuestas'}
                </>
              ) : (
                'Aún no hay encuestas respondidas.'
              )}
            </p>
          </div>

          <button
            className="btn btn-outline-primary"
            type="button"
            aria-expanded={abierto}
            aria-controls="carga-por-area"
            onClick={alternarAreas}
          >
            <i className="bi bi-bar-chart-line me-2" aria-hidden="true" />
            {abierto ? 'Ocultar carga por área' : 'Ver carga por área'}
          </button>
        </div>

        <div className="border-top mt-3 pt-3" id="carga-por-area" hidden={!abierto}>
          {cargando && (
            <p className="text-body-secondary mb-0" role="status">Cargando áreas…</p>
          )}

          {error && (
            <div className="alert alert-danger mb-0">
              <p className="mb-2" role="alert">{error}</p>
              <button
                className="btn btn-sm btn-outline-danger"
                type="button"
                onClick={() => setIntento((anterior) => anterior + 1)}
              >
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <caption className="visually-hidden">Carga de expedientes por área</caption>
                <thead className="table-light">
                  <tr>
                    <th scope="col">Área</th>
                    <th scope="col">Total</th>
                    <th scope="col">Abiertos</th>
                    <th scope="col">En riesgo</th>
                    <th scope="col">Resueltos</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area) => (
                    <tr key={area.area}>
                      <th scope="row">{area.area}</th>
                      <td>{area.total}</td>
                      <td>{area.abiertos}</td>
                      <td>{area.riesgos}</td>
                      <td>{area.resueltos}</td>
                    </tr>
                  ))}
                  {areas.length === 0 && (
                    <tr>
                      <td className="text-body-secondary" colSpan={5}>
                        Todavía no hay expedientes registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}