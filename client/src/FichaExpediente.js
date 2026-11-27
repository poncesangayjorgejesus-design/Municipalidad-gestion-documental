import { useEffect, useState } from 'react';

const limitePdf = 2_000_000;

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
  const [operacion, setOperacion] = useState('');
  const [aviso, setAviso] = useState(null);

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

        if (!respuesta.ok) throw new Error('No se pudo cargar la ficha.');

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
    if (operacion || cargando || error) return;

    const campos = new FormData(evento.currentTarget);
    const destino = campos.get('destino');
    const historialId = String(datos.expediente.historial_id);

    setOperacion('estado');
    setAviso(null);

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
        setAviso({
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

      setAviso({ clase: 'success', texto: 'Estado actualizado correctamente.' });
      actualizarFicha();
    } catch (problema) {
      setAviso({ clase: 'danger', texto: problema.message });
    } finally {
      setOperacion('');
    }
  }

  async function adjuntarDocumento(evento) {
    evento.preventDefault();
    if (operacion || cargando || error) return;

    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    const archivo = campos.get('pdf');

    if (!archivo || !/\.pdf$/i.test(archivo.name) || archivo.size === 0 || archivo.size > limitePdf) {
      setAviso({ clase: 'warning', texto: 'Selecciona un archivo PDF de hasta 2 MB.' });
      return;
    }

    setOperacion('documento');
    setAviso(null);

    try {
      const respuesta = await fetch(`${ruta}/documentos`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: campos,
      });

      if (respuesta.status === 401) {
        alVencerSesion();
        return;
      }

      if (!respuesta.ok) {
        const resultado = await respuesta.json().catch(() => null);
        throw new Error(resultado?.mensaje || 'No se pudo adjuntar el PDF.');
      }

      formulario.reset();
      setAviso({ clase: 'success', texto: 'PDF adjuntado correctamente.' });
      actualizarFicha();
    } catch (problema) {
      setAviso({ clase: 'danger', texto: problema.message });
    } finally {
      setOperacion('');
    }
  }

  const ocupado = Boolean(operacion);
  const formularioBloqueado = cargando || ocupado || Boolean(error);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={alVolver}
          disabled={ocupado}
        >
          <i className="bi bi-arrow-left me-2" aria-hidden="true" />
          Volver a la bandeja
        </button>

        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={actualizarFicha}
          disabled={cargando || ocupado}
        >
          <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
          Actualizar ficha
        </button>
      </div>

      {cargando && <p className="text-body-secondary" role="status">Cargando ficha…</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}

      {aviso && (
        <p className={`alert alert-${aviso.clase}`} role={aviso.clase === 'success' ? 'status' : 'alert'}>
          {aviso.texto}
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
                  <fieldset disabled={formularioBloqueado}>
                    <label className="form-label" htmlFor="nuevo-estado">Nuevo estado</label>
                    <select
                      className="form-select mb-3"
                      id="nuevo-estado"
                      name="destino"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>Selecciona un estado</option>
                      {datos.estados.map((estado) => (
                        <option key={estado.codigo} value={estado.codigo}>{estado.nombre}</option>
                      ))}
                    </select>

                    <button className="btn btn-primary" type="submit">
                      {operacion === 'estado' ? 'Guardando…' : 'Actualizar estado'}
                    </button>
                  </fieldset>
                </form>
              )}
            </div>
          </section>

          <section className="card portada-yau shadow-sm mb-4" aria-labelledby="historial-ficha">
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

          <section className="card portada-yau shadow-sm" aria-labelledby="documentos-ficha">
            <div className="card-body p-3 p-md-4">
              <h2 className="h5 mb-3" id="documentos-ficha">Documentos del expediente</h2>

              <form onSubmit={adjuntarDocumento}>
                <fieldset disabled={formularioBloqueado}>
                  <label className="form-label" htmlFor="archivo-pdf">Archivo PDF (hasta 2 MB)</label>
                  <input
                    className="form-control mb-3"
                    id="archivo-pdf"
                    name="pdf"
                    type="file"
                    accept=".pdf,application/pdf"
                    required
                  />

                  <button className="btn btn-primary" type="submit">
                    <i className="bi bi-paperclip me-2" aria-hidden="true" />
                    {operacion === 'documento' ? 'Adjuntando…' : 'Adjuntar PDF'}
                  </button>
                </fieldset>
              </form>

              {datos.documentos.length === 0 ? (
                <p className="text-body-secondary mt-3 mb-0">Aún no hay documentos adjuntos.</p>
              ) : (
                <ul className="list-group list-group-flush mt-3">
                  {datos.documentos.map((documento) => (
                    <li className="list-group-item px-0" key={documento.id}>
                      <a className="text-break" href={`/api/personal/documentos/${documento.id}`}>
                        <i className="bi bi-download me-2" aria-hidden="true" />
                        {documento.nombre}
                      </a>
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