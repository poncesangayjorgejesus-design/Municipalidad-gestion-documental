import { useState } from 'react';

export default function EncuestaAtencion({ ruta, encuestado }) {
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [error, setError] = useState('');

  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;

    const campos = new FormData(evento.currentTarget);
    const calificacion = Number(campos.get('calificacion'));
    const comentario = campos.get('comentario').trim();

    setEnviando(true);
    setError('');

    try {
      const respuesta = await fetch(`${ruta}/encuesta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calificacion, comentario }),
      });

      if (respuesta.status === 409) {
        setError('La encuesta está disponible cuando el expediente está resuelto.');
        return;
      }

      if (!respuesta.ok) {
        throw new Error('Error al guardar la encuesta');
      }

      setEnviada(true);
    } catch {
      setError('No se pudo enviar la encuesta. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (encuestado || enviada) {
    return (
      <p className="alert alert-success mt-4 mb-0" role="status">
        Tu calificación quedó registrada. Gracias por responder.
      </p>
    );
  }

  return (
    <form className="mt-4 border-top pt-3" onSubmit={enviar}>
      <h4 className="h6 mb-3">Califica la atención</h4>

      <fieldset disabled={enviando}>
        <label className="form-label" htmlFor="calificacion">
          Calificación
        </label>
        <select
          className="form-select mb-3"
          id="calificacion"
          name="calificacion"
          defaultValue=""
          required
        >
          <option value="" disabled>Selecciona una calificación</option>
          <option value="5">5 de 5</option>
          <option value="4">4 de 5</option>
          <option value="3">3 de 5</option>
          <option value="2">2 de 5</option>
          <option value="1">1 de 5</option>
        </select>

        <label className="form-label" htmlFor="comentario">
          Comentario (opcional)
        </label>
        <textarea
          className="form-control mb-3"
          id="comentario"
          name="comentario"
          rows={3}
          maxLength={300}
        />

        <button className="btn btn-primary" type="submit">
          {enviando ? 'Enviando…' : 'Enviar calificación'}
        </button>
      </fieldset>

      {error && <p className="alert alert-danger mt-3 mb-0" role="alert">{error}</p>}
    </form>
  );
}