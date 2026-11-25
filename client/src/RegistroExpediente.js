import { useEffect, useState } from 'react';

const rutaExpedientes = '/api/personal/expedientes';

const campos = [
  ['plazo', 'Plazo aplicado (días calendario)', 1, 365],
  ['pendientes', 'Pendientes en el área', 0, 30],
  ['anexos', 'Anexos faltantes', 0, 5],
  ['derivaciones', 'Derivaciones previstas', 0, 3],
];

function FormularioExpediente({ alRegistrar, alVencerSesion }) {
  const [tipos, setTipos] = useState(null);
  const [plazo, setPlazo] = useState('');
  const [prediccion, setPrediccion] = useState(null);
  const [operacion, setOperacion] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const solicitud = new AbortController();

    async function cargarTipos() {
      try {
        const respuesta = await fetch('/api/personal/tipos', {
          headers: { Accept: 'application/json' },
          signal: solicitud.signal,
        });

        if (solicitud.signal.aborted) return;

        if (respuesta.status === 401) {
          alVencerSesion();
          return;
        }

        if (!respuesta.ok) throw new Error('Error al cargar los tipos de trámite');

        const catalogo = await respuesta.json();
        if (solicitud.signal.aborted) return;

        setTipos(catalogo);
        setPlazo(catalogo[0]?.plazo_referencial ?? '');
      } catch {
        if (!solicitud.signal.aborted) {
          setError('No se pudo cargar el catálogo. Cierra el formulario y vuelve a abrirlo.');
        }
      }
    }

    cargarTipos();
    return () => solicitud.abort();
  }, [alVencerSesion]);

  async function enviar(evento) {
    evento.preventDefault();
    if (operacion) return;

    const accion = evento.nativeEvent.submitter?.value ?? 'estimar';
    const formulario = new FormData(evento.currentTarget);
    const datos = {
      tipo_id: Number(formulario.get('tipo_id')),
      plazo: Number(formulario.get('plazo')),
      pendientes: Number(formulario.get('pendientes')),
      anexos: Number(formulario.get('anexos')),
      derivaciones: Number(formulario.get('derivaciones')),
    };

    setOperacion(accion);
    setError('');

    try {
      const ruta = accion === 'estimar'
        ? `${rutaExpedientes}/prediccion`
        : rutaExpedientes;

      const respuesta = await fetch(ruta, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      });

      if (respuesta.status === 401) {
        alVencerSesion();
        return;
      }

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok || !resultado) {
        throw new Error(resultado?.mensaje || 'El servidor no pudo completar la operación.');
      }

      if (accion === 'estimar') {
        setPrediccion(resultado);
      } else {
        alRegistrar(resultado.codigo);
      }
    } catch (problema) {
      setError(problema.message || 'No se pudo conectar con el servidor.');
    } finally {
      setOperacion('');
    }
  }

  return (
    <section className="card portada-yau shadow-sm mb-4" aria-labelledby="titulo-registro">
      <div className="card-body p-3 p-md-4">
        <h2 className="h5 mb-3" id="titulo-registro">Nuevo expediente</h2>

        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        {!tipos && !error && <p role="status">Cargando tipos de trámite…</p>}
        {tipos?.length === 0 && <p className="mb-0">No hay tipos de trámite disponibles.</p>}

        {tipos?.length > 0 && (
          <form
            id="formulario-registro-expediente"
            onSubmit={enviar}
            onChange={() => {
              setPrediccion(null);
              setError('');
            }}
          >
            <fieldset className="row g-3" disabled={Boolean(operacion)}>
              <div className="col-md-6 col-lg-4">
                <label className="form-label" htmlFor="registro-tipo">Tipo de trámite</label>
                <select
                  className="form-select"
                  id="registro-tipo"
                  name="tipo_id"
                  required
                  onChange={(evento) => {
                    const tipo = tipos.find((item) => String(item.id) === evento.target.value);
                    setPlazo(tipo.plazo_referencial);
                  }}
                >
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              {campos.map(([nombre, etiqueta, min, max]) => (
                <div className="col-md-6 col-lg-4" key={nombre}>
                  <label className="form-label" htmlFor={`registro-${nombre}`}>{etiqueta}</label>
                  <input
                    className="form-control"
                    id={`registro-${nombre}`}
                    name={nombre}
                    type="number"
                    min={min}
                    max={max}
                    step={1}
                    required
                    {...(nombre === 'plazo'
                      ? { value: plazo, onChange: (evento) => setPlazo(evento.target.value) }
                      : { defaultValue: 0 })}
                  />
                </div>
              ))}

              <div className="col-12 d-flex flex-wrap gap-2">
                <button className="btn btn-outline-primary" type="submit" value="estimar">
                  {operacion === 'estimar' ? 'Estimando…' : 'Estimar plazo'}
                </button>
                <button className="btn btn-primary" type="submit" value="registrar">
                  {operacion === 'registrar' ? 'Registrando…' : 'Registrar expediente'}
                </button>
              </div>
            </fieldset>

            {prediccion && (
              <p
                className={`alert ${prediccion.alerta ? 'alert-warning' : 'alert-success'} mt-3 mb-0`}
                role="status"
              >
                <strong>Estimación del modelo:</strong> {Math.ceil(prediccion.dias_estimados)} días
                frente a {prediccion.plazo} días de plazo.
                {' '}{prediccion.alerta ? 'Riesgo de demora.' : 'Dentro del plazo previsto.'}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}

export default function RegistroExpediente({ alRegistrar, alVencerSesion }) {
  const [abierto, setAbierto] = useState(false);
  const [codigo, setCodigo] = useState('');

  function confirmar(nuevoCodigo) {
    setCodigo(nuevoCodigo);
    setAbierto(false);
    alRegistrar();
  }

  return (
    <>
      <button
        className="btn btn-primary mb-3"
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
      >
        <i className={`bi ${abierto ? 'bi-x-lg' : 'bi-plus-lg'} me-2`} aria-hidden="true" />
        {abierto ? 'Cerrar formulario' : 'Nuevo expediente'}
      </button>

      {codigo && (
        <p className="alert alert-success" role="status">
          Expediente registrado. Código de consulta <code className="text-break">{codigo}</code>
        </p>
      )}

      {abierto && (
        <FormularioExpediente alRegistrar={confirmar} alVencerSesion={alVencerSesion} />
      )}
    </>
  );
}