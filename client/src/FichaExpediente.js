import { useEffect, useState } from 'react';

const formatoFecha = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Lima',
});

function mostrarDias(valor) {
  if (valor == null) return '—';
  const dias = Math.ceil(Number(valor));
  return `${dias} ${dias === 1 ? 'día' : 'días'}`;
}

export default function FichaExpediente({ id, alVolver, alVencerSesion }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [actualizacion, setActualizacion] = useState(0);

  useEffect(() => {
    const solicitud = new AbortController();

    async function cargarFicha() {
      setCargando(true);
      setError('');

      try {
        const respuesta = await fetch(`/api/personal/expedientes/${id}`, {
          headers: { Accept: 'application/json' },
          signal: solicitud.signal,
        });

        if (solicitud.signal.aborted) return;

        if (respuesta.status === 401) {
          alVencerSesion();
          return;
        }

        if (respuesta.status === 404) {
          setDatos(null);
          throw new Error('El expediente ya no está disponible.');
        }

        if (!respuesta.ok) {
          throw new Error('No se pudo cargar la ficha.');
        }

        const resultado = await respuesta.json();
        if (!solicitud.signal.aborted) setDatos(resultado);
      } catch (problema) {
        if (!solicitud.signal.aborted) {
          setError(problema.message || 'No se pudo conectar con el servidor.');
        }
      } finally {
        if (!solicitud.signal.aborted) setCargando(false);
      }
    }

    cargarFicha();
    return () => solicitud.abort();
  }, [id, actualizacion, alVencerSesion]);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <button className="btn btn-outline-secondary" type="button" onClick={alVolver}>
          <i className="bi bi-arrow-left me-2" aria-hidden="true" />
          Volver a la bandeja
        </button>
        <button
          className="btn btn-outline-secondary"
          type="button"
          disabled={cargando}
          onClick={() => setActualizacion((anterior) => anterior + 1)}
        >
          <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
          Actualizar ficha
        </button>
      </div>

      {cargando && <p className="text-body-secondary" role="status">Cargando ficha…</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}

      {datos && (
        <>
          <section className="card portada-yau shadow-sm mb-4" aria-labelledby="titulo-ficha">
            <div className="card-body p-3 p-md-4">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
                <div>
                  <h1 className="h3 mb-1" id="titulo-ficha">{datos.expediente.tipo}</h1>
                  <p className="text-body-secondary mb-0">{datos.expediente.area}</p>
                </div>
                <span className="badge text-bg-dark">{datos.expediente.estado}</span>
              </div>

              <dl className="row mb-0">
                <dt className="col-sm-5">Código de consulta</dt>
                <dd className="col-sm-7">
                  <code className="text-break">{datos.expediente.codigo}</code>
                </dd>

                <dt className="col-sm-5">Plazo aplicado</dt>
                <dd className="col-sm-7">{mostrarDias(datos.expediente.plazo_aplicado)}</dd>

                <dt className="col-sm-5">Estimación del modelo</dt>
                <dd className="col-sm-7">{mostrarDias(datos.expediente.dias_estimados)}</dd>

                <dt className="col-sm-5">Versión del modelo</dt>
                <dd className="col-sm-7">{datos.expediente.version_modelo ?? '—'}</dd>
              </dl>
            </div>
          </section>

          <section className="card portada-yau shadow-sm" aria-labelledby="historial-ficha">
            <div className="card-body p-3 p-md-4">
              <h2 className="h5 mb-3" id="historial-ficha">Historial de estados</h2>

              {datos.historial.length === 0 ? (
                <p className="text-body-secondary mb-0">Todavía no hay movimientos registrados.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {datos.historial.map((movimiento) => (
                    <li
                      className="list-group-item px-0 d-flex flex-wrap justify-content-between gap-2"
                      key={movimiento.id}
                    >
                      <span>{movimiento.estado}</span>
                      <time className="text-body-secondary small" dateTime={movimiento.fecha}>
                        {formatoFecha.format(new Date(movimiento.fecha))}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}