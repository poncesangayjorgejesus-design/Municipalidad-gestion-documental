import './estilos.css';

function App() {
  return (
    <div className="min-vh-100">
      <header className="barra-yau">
        <div className="container d-flex align-items-center gap-3 py-3">
          <span className="marca-yau" aria-hidden="true">
            <i className="bi bi-bank" />
          </span>
          <div>
            <strong>Municipalidad Provincial de Yau</strong>
            <small className="d-block">Mesa de Partes</small>
          </div>
        </div>
      </header>

      <main className="container py-4 py-md-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <section className="card portada-yau shadow-sm">
              <div className="card-body p-4 p-md-5">
                <h1 className="h2 fw-bold">Consulta tu expediente</h1>
                <p className="text-body-secondary mb-0">
                  Usa el código que te entregaron en Mesa de Partes para
                  consultar el estado de tu trámite.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;