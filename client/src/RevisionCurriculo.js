import { useEffect, useState } from 'react';

const etiquetas = {
  cumple: 'Acreditado',
  falta: 'Sin evidencia',
  ilegible: 'Evidencia ilegible',
};

const formatoFecha = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Lima',
});

export default function RevisionCurriculo({ id, alVolver, alVencerSesion }) {
  const ruta = `/api/personal/curriculos/${id}`;
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizacion, setActualizacion] = useState(0);
  const [operacion, setOperacion] = useState('');
  const [orientacion, setOrientacion] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    const solicitud = new AbortController();

    async function cargarRevision() {
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

        if (respuesta.status === 404) {
          setDatos(null);
          throw new Error('La postulación ya no está disponible.');
        }

        if (!respuesta.ok) throw new Error('No se pudo cargar la postulación.');

        const resultado = await respuesta.json();
        if (!solicitud.signal.aborted) setDatos(resultado);
      } catch (problema) {
        if (!solicitud.signal.aborted) setErrorCarga(problema.message);
      } finally {
        if (!solicitud.signal.aborted) setCargando(false);
      }
    }

    cargarRevision();
    return () => solicitud.abort();
  }, [ruta, actualizacion, alVencerSesion]);

  function actualizar() {
    setCargando(true);
    setActualizacion((anterior) => anterior + 1);
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (cargando || operacion || errorCarga) return;

    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    const consultar = evento.nativeEvent.submitter?.value === 'orientar';
    const resultados = Object.fromEntries(
      datos.requisitos.map(({ id: requisitoId }) => [
        requisitoId,
        campos.get(`requisito-${requisitoId}`),
      ])
    );

    setAviso(null);

    if (Object.values(resultados).some((valor) => !valor)) {
      setAviso({ clase: 'warning', texto: 'Completa la verificación de todos los requisitos.' });
      return;
    }

    const motivo = String(campos.get('motivo') ?? '').trim();

    if (!consultar && !motivo) {
      setAviso({ clase: 'warning', texto: 'Escribe el motivo de la decisión.' });
      return;
    }

    const destino = consultar ? 'orientacion' : 'revisiones';
    const contenido = consultar
      ? { resultados }
      : { resultados, decision: campos.get('decision'), motivo };

    setOperacion(destino);
    if (consultar) setOrientacion(null);

    try {
      const respuesta = await fetch(`${ruta}/${destino}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contenido),
      });

      if (respuesta.status === 401) {
        alVencerSesion();
        return;
      }

      if (!respuesta.ok) {
        const resultado = await respuesta.json().catch(() => null);
        throw new Error(resultado?.mensaje || 'No se pudo completar la operación.');
      }

      if (consultar) {
        setOrientacion(await respuesta.json());
      } else {
        formulario.reset();
        setOrientacion(null);
        setAviso({ clase: 'success', texto: 'Revisión guardada correctamente.' });
        actualizar();
      }
    } catch (problema) {
      setAviso({
        clase: 'danger',
        texto: problema.message || 'No se pudo conectar con el servidor.',
      });
    } finally {
      setOperacion('');
    }
  }

  const ocupado = Boolean(operacion);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={alVolver}
          disabled={ocupado}
        >
          <i className="bi bi-arrow-left me-2" aria-hidden="true" />
          Volver a currículos
        </button>
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={actualizar}
          disabled={cargando || ocupado}
        >
          Actualizar ficha
        </button>
      </div>

      {cargando && <p className="text-body-secondary" role="status">Cargando postulación…</p>}
      {errorCarga && <p className="alert alert-danger" role="alert">{errorCarga}</p>}

      {aviso && (
        <p className={`alert alert-${aviso.clase}`} role={aviso.clase === 'success' ? 'status' : 'alert'}>
          {aviso.texto}
        </p>
      )}

      {datos && (
        <>
          <h1 className="h3 mb-1">{datos.postulacion.puesto}</h1>
          <p className="text-body-secondary mb-4">
            Código de postulación <code>{datos.postulacion.codigo}</code>
          </p>

          <section className="card portada-yau shadow-sm mb-4" aria-labelledby="titulo-requisitos">
            <div className="card-body p-3 p-md-4">
              <h2 className="h5 mb-3" id="titulo-requisitos">Verificar requisitos</h2>

              <form onSubmit={enviar}>
                <fieldset disabled={cargando || ocupado || Boolean(errorCarga)}>
                  <div className="row g-3 mb-3">
                    {datos.requisitos.map((requisito) => (
                      <div className="col-md-6 col-lg-4" key={requisito.id}>
                        <label className="form-label" htmlFor={`requisito-${requisito.id}`}>
                          {requisito.descripcion}
                        </label>
                        <select
                          className="form-select"
                          id={`requisito-${requisito.id}`}
                          name={`requisito-${requisito.id}`}
                          defaultValue=""
                          onChange={() => setOrientacion(null)}
                          required
                        >
                          <option value="" disabled>Selecciona un resultado</option>
                          {Object.entries(etiquetas).map(([valor, etiqueta]) => (
                            <option key={valor} value={valor}>{etiqueta}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn btn-outline-primary mb-3"
                    type="submit"
                    value="orientar"
                    formNoValidate
                  >
                    <i className="bi bi-activity me-2" aria-hidden="true" />
                    {operacion === 'orientacion' ? 'Consultando…' : 'Consultar orientación del modelo'}
                  </button>

                  {orientacion && (
                    <div className="alert alert-info" role="status">
                      <strong>{orientacion.mensaje}</strong>
                      <div>
                        Probabilidad de revisión documental{' '}
                        <strong>{Math.round(orientacion.probabilidad * 100)} %</strong>
                      </div>
                    </div>
                  )}

                  <label className="form-label" htmlFor="decision-curriculo">Decisión del evaluador</label>
                  <select
                    className="form-select mb-3"
                    id="decision-curriculo"
                    name="decision"
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>Selecciona una decisión</option>
                    {datos.decisiones.map((decision) => (
                      <option key={decision.codigo} value={decision.codigo}>{decision.nombre}</option>
                    ))}
                  </select>

                  <label className="form-label" htmlFor="motivo-curriculo">Motivo de la decisión</label>
                  <textarea
                    className="form-control mb-3"
                    id="motivo-curriculo"
                    name="motivo"
                    rows={3}
                    maxLength={300}
                    required
                  />

                  <button className="btn btn-primary" type="submit" value="guardar">
                    {operacion === 'revisiones' ? 'Guardando…' : 'Guardar revisión'}
                  </button>
                </fieldset>
              </form>
            </div>
          </section>

          <section className="card portada-yau shadow-sm" aria-labelledby="titulo-revisiones">
            <div className="card-body p-3 p-md-4">
              <h2 className="h5 mb-3" id="titulo-revisiones">Historial de revisiones</h2>
              {datos.revisiones.length === 0 ? (
                <p className="text-body-secondary mb-0">Todavía no hay revisiones registradas.</p>
              ) : (
                datos.revisiones.map((revision) => (
                  <details className="border-top py-2" key={revision.id}>
                    <summary>
                      {revision.decision} ·{' '}
                      <time dateTime={revision.fecha}>{formatoFecha.format(new Date(revision.fecha))}</time>
                    </summary>
                    <p className="my-2">{revision.motivo}</p>
                    <ul className="mb-1">
                      {revision.requisitos.map((requisito, indice) => (
                        <li key={indice}>
                          {requisito.descripcion} · {etiquetas[requisito.resultado]}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}