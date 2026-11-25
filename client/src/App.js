import { useEffect, useState } from 'react';
import ConsultaExpediente from './ConsultaExpediente';
import './estilos.css';

function App() {
  const [vista, setVista] = useState('consulta');
  const [personal, setPersonal] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const solicitud = new AbortController();

    async function recuperarSesion() {
      try {
        const respuesta = await fetch('/api/sesion', {
          headers: { Accept: 'application/json' },
          signal: solicitud.signal,
        });

        if (!respuesta.ok) {
          throw new Error('No se pudo verificar la sesión.');
        }

        const datos = await respuesta.json();
        if (!solicitud.signal.aborted) {
          setPersonal(datos.personal === true);
        }
      } catch {
        if (!solicitud.signal.aborted) {
          setError('No se pudo verificar la sesión con el servidor.');
        }
      } finally {
        if (!solicitud.signal.aborted) {
          setVerificando(false);
        }
      }
    }

    recuperarSesion();
    return () => solicitud.abort();
  }, []);

  async function cambiarSesion(iniciar, clave) {
    if (ocupado || verificando) return;

    setOcupado(true);
    setError('');

    try {
      const respuesta = await fetch(iniciar ? '/api/sesion' : '/api/sesion/salir', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(iniciar ? { clave } : {}),
      });

      if (iniciar && respuesta.status === 401) {
        throw new Error('La contraseña es incorrecta.');
      }

      if (!respuesta.ok) {
        throw new Error(iniciar
          ? 'No se pudo iniciar sesión. Intenta nuevamente.'
          : 'No se pudo cerrar sesión. Intenta nuevamente.');
      }

      setPersonal(iniciar);
      setVista(iniciar ? 'personal' : 'consulta');
    } catch (problema) {
      setError(problema.message);
    } finally {
      setOcupado(false);
    }
  }

  function iniciarSesion(evento) {
    evento.preventDefault();
    const campos = new FormData(evento.currentTarget);
    cambiarSesion(true, campos.get('clave'));
  }

  function navegar(destino) {
    setError('');
    setVista(destino);
  }

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <header className="barra-yau text-white">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
          <div>
            <div className="fw-semibold">Municipalidad Provincial de Yau</div>
            <div className="small">Mesa de Partes</div>
          </div>

          <nav className="d-flex flex-wrap gap-2" aria-label="Navegación principal">
            <button
              className={`btn btn-sm ${vista === 'consulta' ? 'btn-light' : 'btn-outline-light'}`}
              type="button"
              aria-current={vista === 'consulta' ? 'page' : undefined}
              onClick={() => navegar('consulta')}
            >
              Consulta ciudadana
            </button>
            <button
              className={`btn btn-sm ${vista === 'personal' ? 'btn-light' : 'btn-outline-light'}`}
              type="button"
              aria-current={vista === 'personal' ? 'page' : undefined}
              onClick={() => navegar('personal')}
            >
              <i className="bi bi-shield-lock me-2" aria-hidden="true" />
              {personal ? 'Área del personal' : 'Acceso del personal'}
            </button>
            {personal && (
              <button
                className="btn btn-sm btn-outline-light"
                type="button"
                onClick={() => cambiarSesion(false)}
                disabled={ocupado}
              >
                {ocupado ? 'Cerrando sesión…' : 'Cerrar sesión'}
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="container py-4 py-md-5">
        {(vista === 'personal' || personal) && error && (
          <p className="alert alert-danger" role="alert">{error}</p>
        )}

        <div className="row justify-content-center">
          <div className={vista === 'consulta' ? 'col-lg-8' : 'col-md-8 col-lg-5'}>
            {vista === 'consulta' ? (
              <section className="card portada-yau shadow-sm">
                <div className="card-body p-4">
                  <h1 className="h3 mb-3">Consulta tu expediente</h1>
                  <ConsultaExpediente />
                </div>
              </section>
            ) : (
              <section className="card portada-yau shadow-sm">
                <div className="card-body p-4">
                  <h1 className="h3 mb-3">
                    {personal ? 'Área del personal' : 'Acceso del personal'}
                  </h1>

                  {verificando && <p role="status">Verificando sesión…</p>}
                  {personal && <p className="mb-0" role="status">Sesión iniciada.</p>}

                  {!verificando && !personal && (
                    <form onSubmit={iniciarSesion}>
                      <label className="form-label" htmlFor="clave-personal">
                        Contraseña
                      </label>
                      <input
                        className="form-control mb-3"
                        id="clave-personal"
                        name="clave"
                        type="password"
                        autoComplete="current-password"
                        required
                        disabled={ocupado}
                      />
                      <button className="btn btn-primary" type="submit" disabled={ocupado}>
                        {ocupado ? 'Ingresando…' : 'Iniciar sesión'}
                      </button>
                    </form>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;