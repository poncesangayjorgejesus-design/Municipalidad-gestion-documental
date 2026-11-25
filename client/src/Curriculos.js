import { useEffect, useState } from 'react';

const ruta = '/api/personal/curriculos';

export default function Curriculos({ alVencerSesion }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [actualizacion, setActualizacion] = useState(0);
  const [errorCarga, setErrorCarga] = useState('');
  const [errorRegistro, setErrorRegistro] = useState('');
  const [codigoNuevo, setCodigoNuevo] = useState('');

  useEffect(() => {
    const solicitud = new AbortController();

    async function cargarCurriculos() {
      setCargando(true);
      setErrorCarga('');

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

        if (!respuesta.ok) throw new Error('Error al cargar las postulaciones');

        const resultado = await respuesta.json();
        if (!solicitud.signal.aborted) setDatos(resultado);
      } catch {
        if (!solicitud.signal.aborted) {
          setErrorCarga('No se pudieron cargar las postulaciones. Pulsa Actualizar para reintentar.');
        }
      } finally {
        if (!solicitud.signal.aborted) setCargando(false);
      }
    }

    cargarCurriculos();
    return () => solicitud.abort();
  }, [actualizacion, alVencerSesion]);

  function actualizar() {
    setCargando(true);
    setActualizacion((anterior) => anterior + 1);
  }

  async function registrar(evento) {
    evento.preventDefault();
    if (cargando || guardando || errorCarga) return;

    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    const convocatoriaId = Number(campos.get('convocatoria'));

    setGuardando(true);
    setErrorRegistro('');
    setCodigoNuevo('');

    try {
      const respuesta = await fetch(ruta, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ convocatoria_id: convocatoriaId }),
      });

      if (respuesta.status === 401) {
        alVencerSesion();
        return;
      }

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok || !resultado?.codigo) {
        throw new Error(resultado?.mensaje || 'No se pudo registrar la postulación.');
      }

      formulario.reset();
      setCodigoNuevo(resultado.codigo);
      actualizar();
    } catch (problema) {
      setErrorRegistro(problema.message || 'No se pudo conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h1 className="h3 mb-0">Revisión de currículos</h1>
        <button
          className="btn btn-outline-secondary"
          type="button"
          disabled={cargando || guardando}
          onClick={actualizar}
        >
          <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {cargando && <p className="text-body-secondary" role="status">Cargando postulaciones…</p>}
      {errorCarga && <p className="alert alert-danger" role="alert">{errorCarga}</p>}

      {codigoNuevo && (
        <p className="alert alert-success" role="status">
          Postulación registrada. Código <code>{codigoNuevo}</code>
        </p>
      )}

      {datos && (
        <div className="row g-4">
          <div className="col-lg-5">
            <section className="card portada-yau shadow-sm">
              <div className="card-body p-3 p-md-4">
                <h2 className="h5 mb-3">Registrar postulación ficticia</h2>

                {datos.convocatorias.length === 0 ? (
                  <p className="text-body-secondary mb-0">No hay convocatorias disponibles.</p>
                ) : (
                  <form onSubmit={registrar}>
                    <fieldset disabled={cargando || guardando || Boolean(errorCarga)}>
                      <label className="form-label" htmlFor="convocatoria">Convocatoria</label>
                      <select
                        className="form-select mb-3"
                        id="convocatoria"
                        name="convocatoria"
                        defaultValue=""
                        required
                      >
                        <option value="" disabled>Selecciona una convocatoria</option>
                        {datos.convocatorias.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.codigo} · {item.puesto}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-primary" type="submit">
                        {guardando ? 'Registrando…' : 'Registrar postulación'}
                      </button>
                    </fieldset>
                  </form>
                )}

                {errorRegistro && (
                  <p className="alert alert-danger mt-3 mb-0" role="alert">{errorRegistro}</p>
                )}
              </div>
            </section>
          </div>

          <div className="col-lg-7">
            <section className="card portada-yau shadow-sm">
              <div className="card-body p-3 p-md-4">
                <h2 className="h5 mb-3">Postulaciones registradas</h2>

                {datos.postulaciones.length === 0 ? (
                  <p className="text-body-secondary mb-0">Todavía no hay postulaciones registradas.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {datos.postulaciones.map((postulacion) => (
                      <li
                        className="list-group-item px-0 d-flex flex-wrap justify-content-between gap-2"
                        key={postulacion.id}
                      >
                        <span className="fw-semibold">{postulacion.puesto}</span>
                        <code>{postulacion.codigo}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}