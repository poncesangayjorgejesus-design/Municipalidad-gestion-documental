import { useEffect, useState } from 'react';
import FichaExpediente from './FichaExpediente';
import RegistroExpediente from './RegistroExpediente';

const estados = {
  recibido: { nombre: 'Recibido', color: 'text-bg-secondary' },
  revision: { nombre: 'En revisión', color: 'text-bg-info' },
  observado: { nombre: 'Observado', color: 'text-bg-warning' },
  resuelto: { nombre: 'Resuelto', color: 'text-bg-success' },
};

const indicadores = [
  ['total', 'Expedientes'],
  ['abiertos', 'Abiertos'],
  ['riesgos', 'En riesgo'],
  ['resueltos', 'Resueltos'],
];

function mostrarDias(valor) {
  if (valor == null || valor === '') return '—';

  const dias = Math.ceil(Number(valor));
  if (!Number.isFinite(dias)) return '—';

  return `${dias} ${dias === 1 ? 'día' : 'días'}`;
}

export default function BandejaExpedientes({ alVencerSesion }) {
  const [entrada, setEntrada] = useState('');
  const [expedienteAbierto, setExpedienteAbierto] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [actualizacion, setActualizacion] = useState(0);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const solicitud = new AbortController();
    const parametros = new URLSearchParams({
      q: busqueda,
      estado,
      alertas: soloAlertas ? '1' : '0',
      pagina: String(pagina),
    });

    async function cargarExpedientes() {
      setCargando(true);
      setError('');

      try {
        const respuesta = await fetch(`/api/personal/expedientes?${parametros}`, {
          headers: { Accept: 'application/json' },
          signal: solicitud.signal,
        });

        if (solicitud.signal.aborted) return;

        if (respuesta.status === 401) {
          alVencerSesion();
          return;
        }

        if (!respuesta.ok) {
          throw new Error('No se pudo cargar la bandeja.');
        }

        const resultado = await respuesta.json();
        if (!solicitud.signal.aborted) setDatos(resultado);
      } catch {
        if (!solicitud.signal.aborted) {
          setDatos(null);
          setError('No se pudo cargar la bandeja. Pulsa Actualizar para volver a intentarlo.');
        }
      } finally {
        if (!solicitud.signal.aborted) setCargando(false);
      }
    }

    cargarExpedientes();
    return () => solicitud.abort();
  }, [busqueda, estado, soloAlertas, pagina, actualizacion, alVencerSesion]);

  function buscar(evento) {
    evento.preventDefault();
    setBusqueda(entrada.trim());
    setPagina(1);
  }

  function actualizarBandeja() {
    setActualizacion((anterior) => anterior + 1);
  }

  if (expedienteAbierto !== null) {
    return (
      <FichaExpediente
        key={expedienteAbierto}
        id={expedienteAbierto}
        alVolver={() => setExpedienteAbierto(null)}
        alVencerSesion={alVencerSesion}
      />
    );
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h1 className="h3 mb-0">Gestión de trámites</h1>
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={actualizarBandeja}
          disabled={cargando}
        >
          <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {datos && (
        <div className="row g-3 mb-4">
          {indicadores.map(([clave, titulo]) => (
            <div className="col-6 col-lg-3" key={clave}>
              <dl className="card portada-yau shadow-sm h-100 mb-0">
                <div className="card-body">
                  <dt className="small text-body-secondary">{titulo}</dt>
                  <dd className="fs-3 fw-semibold mb-0">{datos.resumen[clave]}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}

      <RegistroExpediente
        alVencerSesion={alVencerSesion}
        alRegistrar={actualizarBandeja}
      />

      <section className="card portada-yau shadow-sm" aria-labelledby="titulo-bandeja">
        <div className="card-body p-3 p-md-4">
          <h2 className="h5 mb-3" id="titulo-bandeja">Bandeja de expedientes</h2>

          <div className="row g-3 align-items-end mb-4">
            <form className="col-lg-6" onSubmit={buscar}>
              <label className="form-label" htmlFor="buscar-expediente">
                Buscar expediente
              </label>
              <div className="input-group">
                <input
                  className="form-control"
                  id="buscar-expediente"
                  placeholder="Código, trámite o área"
                  maxLength={80}
                  value={entrada}
                  onChange={(evento) => setEntrada(evento.target.value)}
                />
                <button className="btn btn-primary" type="submit">Buscar</button>
              </div>
            </form>

            <div className="col-sm-6 col-lg-3">
              <label className="form-label" htmlFor="estado-bandeja">Estado</label>
              <select
                className="form-select"
                id="estado-bandeja"
                value={estado}
                onChange={(evento) => {
                  setEstado(evento.target.value);
                  setPagina(1);
                }}
              >
                <option value="">Todos</option>
                {Object.entries(estados).map(([codigo, opcion]) => (
                  <option key={codigo} value={codigo}>{opcion.nombre}</option>
                ))}
              </select>
            </div>

            <div className="col-sm-6 col-lg-3 pb-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  id="solo-alertas"
                  type="checkbox"
                  checked={soloAlertas}
                  onChange={(evento) => {
                    setSoloAlertas(evento.target.checked);
                    setPagina(1);
                  }}
                />
                <label className="form-check-label" htmlFor="solo-alertas">
                  Solo riesgo de demora
                </label>
              </div>
            </div>
          </div>

          {cargando && (
            <p className="text-body-secondary mb-0" role="status">Cargando expedientes…</p>
          )}
          {error && <p className="alert alert-danger mb-0" role="alert">{error}</p>}

          {!cargando && datos && (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Trámite</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Plazo</th>
                      <th scope="col">Estimación</th>
                      <th scope="col">Prioridad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.expedientes.map((fila) => (
                      <tr key={fila.id}>
                        <th scope="row">
                          <button
                            className="btn btn-link p-0 text-start fw-semibold"
                            type="button"
                            onClick={() => setExpedienteAbierto(fila.id)}
                          >
                            {fila.tipo}
                          </button>
                          <small className="d-block text-body-secondary fw-normal">{fila.area}</small>
                          <code className="d-block text-break fw-normal">{fila.codigo}</code>
                        </th>
                        <td>
                          <span className={`badge ${estados[fila.estado_codigo]?.color ?? 'text-bg-secondary'}`}>
                            {fila.estado}
                          </span>
                        </td>
                        <td className="text-nowrap">{mostrarDias(fila.plazo_aplicado)}</td>
                        <td className="text-nowrap">{mostrarDias(fila.dias_estimados)}</td>
                        <td>
                          {fila.alerta ? (
                            <span className="badge text-bg-warning">Riesgo de demora</span>
                          ) : (
                            fila.estado_codigo === 'resuelto' ? 'Cerrado' : 'Ordinaria'
                          )}
                        </td>
                      </tr>
                    ))}
                    {datos.expedientes.length === 0 && (
                      <tr>
                        <td className="text-center text-body-secondary py-4" colSpan={5}>
                          No hay expedientes que coincidan con los filtros.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">
                <span className="small text-body-secondary">
                  {datos.paginacion.total} {datos.paginacion.total === 1 ? 'resultado' : 'resultados'}
                </span>
                <nav className="d-flex align-items-center gap-2" aria-label="Páginas de expedientes">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    type="button"
                    disabled={datos.paginacion.pagina <= 1}
                    onClick={() => setPagina(datos.paginacion.pagina - 1)}
                  >
                    Anterior
                  </button>
                  <span className="small">
                    {datos.paginacion.pagina} / {datos.paginacion.paginas}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    type="button"
                    disabled={datos.paginacion.pagina >= datos.paginacion.paginas}
                    onClick={() => setPagina(datos.paginacion.pagina + 1)}
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}