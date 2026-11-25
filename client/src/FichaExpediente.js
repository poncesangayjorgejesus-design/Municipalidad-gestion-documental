import { useEffect, useState } from 'react';

const formatoFecha = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Lima',
});

function mostrarDias(valor) {
  if (valor == null || valor === '') return '—';

  const dias = Math.ceil(Number(valor));
  if (!Number.isFinite(dias)) return '—';

  return `${dias} ${dias === 1 ? 'día' : 'días'}`;
}

export default function FichaExpediente({ id, alVolver, alVencerSesion }) {
  const ruta = `/api/personal/expedientes/${id}`;
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [actualizacion, setActualizacion] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [avisoCambio, setAvisoCambio] = useState(null);

  useEffect(() => {
    const solicitud = new AbortController();

    async function cargarFicha() {
      setCargando(true);
      setError('');

      try {
        const respuesta = await fetch(ruta, {
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
  }, [ruta, actualizacion, alVencerSesion]);

  function actualizarFicha() {
    setCargando(true);
    setActualizacion((anterior) => anterior + 1);
  }

  async function cambiarEstado(evento) {
    evento.preventDefault();
    if (guardando || cargando || error) return;

    const formulario = new FormData(evento.currentTarget);
    const destino = formulario.get('destino');
    const historialId = String(datos.expediente.historial_id);

    setGuardando(true);
    setAvisoCambio(null);

    try {
      const respuesta = await fetch(`${ruta}/estado`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destino, historial_id: historialId }),
      });

      if (respuesta.status === 401) {
        alVencerSesion();
        return;
      }

      if (respuesta.status === 409) {
        setAvisoCambio({
          clase: 'warning',
          texto: 'El expediente cambió mientras lo revisabas. Verifica el estado actual antes de guardar.',
        });
        actualizarFicha();
        return;
      }

      if (!respuesta.ok) {
        const resultado = await respuesta.json().catch(() => null);
        throw new Error(resultado?.mensaje || 'No se pudo guardar el nuevo estado.');
      }

      setAvisoCambio({
        clase: 'success',
        texto: 'Estado actualizado correctamente.',
      });
      actualizarFicha();
    } catch (problema) {
      setAvisoCambio({
        clase: 'danger',
        texto: problema.message || 'No se pudo conectar con el servidor.',
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={alVolver}
          disabled={guardando}
        >
          <i className="bi bi-arrow-left me-2" aria-hidden="true" />
          Volver a la bandeja
        </button>
        <button
          className="btn btn-outline-secondary"
          type="button"
          disabled={cargando || guardando}
          onClick={actualizarFicha}
        >
          <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
          Actualizar ficha
        </button>
      </div>

      {cargando && <p className="text-body-secondary" role="status">Cargando ficha…</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}

      {avisoCambio && (
        <p
          className={`alert alert-${avisoCambio.clase}`}
          role={avisoCambio.clase === 'success' ? 'status' : 'alert'}
        >
          {avisoCambio.texto}
        </p>
      )}

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

              {datos.estados.length > 0 && (
                <form
                  className="border-top pt-3 mt-3"
                  key={datos.expediente.historial_id}
                  onSubmit={cambiarEstado}
                >
                  <fieldset disabled={cargando || guardando || Boolean(error)}>
                    <label className="form-label" htmlFor="nuevo-estado">
                      Nuevo estado
                    </label>
                    <select
                      className="form-select mb-3"
                      id="nuevo-estado"
                      name="destino"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>Selecciona un estado</option>
                      {datos.estados.map((estado) => (
                        <option key={estado.codigo} value={estado.codigo}>
                          {estado.nombre}
                        </option>
                      ))}
                    </select>

                    <button className="btn btn-primary" type="submit">
                      {guardando ? 'Guardando…' : 'Actualizar estado'}
                    </button>
                  </fieldset>
                </form>
              )}
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