import { useEffect, useRef, useState } from 'react';

const formatoFecha = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Lima',
});

function ResultadoExpediente({ codigo }) {
  const ruta = `/api/consulta/${codigo}`;
  const recargar = useRef(null);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [enVivo, setEnVivo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorLectura, setErrorLectura] = useState('');

  useEffect(() => {
    let solicitud;
    let conexion;

    async function cargar() {
      solicitud?.abort();
      const controlador = new AbortController();
      solicitud = controlador;

      try {
        const respuesta = await fetch(ruta, {
          headers: { Accept: 'application/json' },
          signal: controlador.signal,
        });

        if (respuesta.status === 404) {
          throw new Error('No encontramos un expediente con ese código.');
        }

        if (!respuesta.ok) {
          throw new Error('No se pudo consultar el expediente. Intenta nuevamente.');
        }

        const resultado = await respuesta.json();

        if (!controlador.signal.aborted) {
          setDatos(resultado);
          setError('');
          return true;
        }
      } catch (problema) {
        if (!controlador.signal.aborted) {
          setError(problema.message);
        }
      }

      return false;
    }

    async function iniciar() {
      const encontrado = await cargar();
      if (!encontrado || solicitud.signal.aborted) return;

      conexion = new EventSource(`${ruta}/eventos`);
      conexion.onopen = () => {
        setEnVivo(true);
        cargar();
      };
      conexion.onerror = () => setEnVivo(false);
      conexion.addEventListener('cambio', cargar);
    }

    recargar.current = cargar;
    iniciar();

    return () => {
      recargar.current = null;
      solicitud?.abort();
      conexion?.close();
    };
  }, [ruta]);

  async function marcarLeidos() {
    if (guardando) return;

    // La API devuelve primero el aviso más reciente.
    const hasta = datos.historial[0].id;
    setGuardando(true);
    setErrorLectura('');

    try {
      const respuesta = await fetch(`${ruta}/avisos/leidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasta }),
      });

      if (!respuesta.ok) {
        throw new Error('No se pudo guardar la lectura.');
      }

      await recargar.current?.();
    } catch {
      if (recargar.current) {
        setErrorLectura('No se pudieron marcar los avisos. Intenta nuevamente.');
      }
    } finally {
      if (recargar.current) {
        setGuardando(false);
      }
    }
  }

  if (!datos) {
    return error
      ? <p className="alert alert-danger mt-3 mb-0" role="alert">{error}</p>
      : <p className="text-body-secondary mt-3 mb-0" role="status">Consultando expediente…</p>;
  }

  const { expediente, historial } = datos;
  const pendientes = historial.filter((aviso) => !aviso.leido).length;

  return (
    <section className="mt-4 border-top pt-3" aria-label="Resultado de la consulta">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h3 className="h5 mb-1">{expediente.tipo}</h3>
          <code className="text-break">{expediente.codigo}</code>
        </div>
        <span className="badge rounded-pill text-bg-dark">{expediente.estado}</span>
      </div>

      <p className="small text-body-secondary mt-2" role="status">
        {enVivo ? 'Actualizaciones en vivo' : 'Conectando con los avisos en vivo…'}
      </p>

      {error && <p className="alert alert-warning" role="alert">{error}</p>}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        <h4 className="h6 mb-0">Historial de estados</h4>
        {pendientes > 0 && (
          <button
            className="btn btn-sm btn-outline-primary"
            type="button"
            onClick={marcarLeidos}
            disabled={guardando}
          >
            {guardando ? 'Guardando…' : 'Marcar avisos como leídos'}
          </button>
        )}
      </div>

      <p className="small text-body-secondary mt-2" role="status">
        {pendientes > 0 ? `Avisos sin leer: ${pendientes}` : 'Sin avisos pendientes'}
      </p>

      {errorLectura && <p className="alert alert-danger" role="alert">{errorLectura}</p>}

      {historial.length === 0 ? (
        <p className="text-body-secondary mb-0">Todavía no hay movimientos registrados.</p>
      ) : (
        <ul className="list-group list-group-flush">
          {historial.map((aviso) => (
            <li
              className="list-group-item px-0 d-flex flex-wrap justify-content-between gap-2"
              key={aviso.id}
            >
              <span>
                {aviso.estado}
                {!aviso.leido && <span className="badge text-bg-primary ms-2">Nuevo</span>}
              </span>
              <time className="small text-body-secondary" dateTime={aviso.fecha}>
                {formatoFecha.format(new Date(aviso.fecha))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ConsultaExpediente() {
  const [entrada, setEntrada] = useState('');
  const [busqueda, setBusqueda] = useState(null);
  const [error, setError] = useState('');

  function consultar(evento) {
    evento.preventDefault();
    const codigo = entrada.trim().toLowerCase();

    if (!/^[a-f0-9]{32}$/.test(codigo)) {
      setError('Ingresa los 32 caracteres del código de Mesa de Partes.');
      return;
    }

    setError('');
    setBusqueda((anterior) => ({
      codigo,
      intento: (anterior?.intento ?? 0) + 1,
    }));
  }

  return (
    <>
      <form onSubmit={consultar}>
        <label className="form-label" htmlFor="codigo-expediente">
          Código de expediente
        </label>
        <input
          className="form-control mb-3"
          id="codigo-expediente"
          value={entrada}
          autoComplete="off"
          spellCheck={false}
          onChange={(evento) => {
            setEntrada(evento.target.value);
            setError('');
          }}
          required
        />
        <button className="btn btn-primary" type="submit">
          <i className="bi bi-search me-2" aria-hidden="true" />
          Consultar expediente
        </button>
        {error && <p className="alert alert-warning mt-3 mb-0" role="alert">{error}</p>}
      </form>

      {busqueda && (
        <ResultadoExpediente key={busqueda.intento} codigo={busqueda.codigo} />
      )}
    </>
  );
}