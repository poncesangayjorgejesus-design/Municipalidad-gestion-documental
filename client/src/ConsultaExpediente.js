import { useState } from 'react';

function ConsultaExpediente() {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [codigoValido, setCodigoValido] = useState(false);

  function consultar(evento) {
    evento.preventDefault();
    const valido = /^[0-9a-f]{32}$/i.test(codigo.trim());

    setCodigoValido(valido);
    setError(
      valido
        ? ''
        : 'Ingresa los 32 caracteres del código de Mesa de Partes.'
    );
  }

  return (
    <form className="mt-4" onSubmit={consultar} noValidate>
      <label className="form-label fw-semibold" htmlFor="codigo">
        Código de expediente
      </label>

      <input
        className={`form-control${error ? ' is-invalid' : ''}`}
        id="codigo"
        name="codigo"
        type="text"
        value={codigo}
        onChange={(evento) => {
          setCodigo(evento.target.value);
          setError('');
          setCodigoValido(false);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'error-codigo' : undefined}
        autoComplete="off"
        spellCheck={false}
        required
      />

      {error && (
        <p className="invalid-feedback mb-0" id="error-codigo" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary mt-3" type="submit">
        <i className="bi bi-search me-2" aria-hidden="true" />
        Consultar expediente
      </button>

      {codigoValido && (
        <p className="text-body-secondary mt-3 mb-0" role="status">
          Código válido. La consulta se habilitará al conectar el servidor.
        </p>
      )}
    </form>
  );
}

export default ConsultaExpediente;