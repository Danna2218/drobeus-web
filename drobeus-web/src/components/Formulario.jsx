import { useState } from 'react';
import Modal from './Modal.jsx';
import SelectorColor from './SelectorColor.jsx';
import { errorTexto } from '../api.js';

// Formulario genérico dentro de una ventana emergente.
export default function Formulario({ titulo, campos, textoGuardar = 'Guardar', onGuardar, onCerrar, ayuda }) {
  const [valores, setValores] = useState(() =>
    Object.fromEntries(campos.map((c) => [c.nombre, c.valor ?? '']))
  );
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (nombre, valor) => setValores((prev) => ({ ...prev, [nombre]: valor }));

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const mensaje = await onGuardar(valores);
      if (mensaje) setError(mensaje);
      else onCerrar();
    } catch (err) {
      setError(errorTexto(err));
    } finally {
      setGuardando(false);
    }
  };

  const campo = (c) => {
    const comunes = { id: `campo-${c.nombre}`, value: valores[c.nombre], placeholder: c.ayuda || '' };
    switch (c.tipo) {
      case 'area':
        return <textarea {...comunes} rows={5} onChange={(e) => cambiar(c.nombre, e.target.value)} />;
      case 'fecha':
        return <input {...comunes} type="date" onChange={(e) => cambiar(c.nombre, e.target.value)} />;
      case 'numero':
        return (
          <input {...comunes} type="number" step="any" onChange={(e) => cambiar(c.nombre, e.target.value)} />
        );
      case 'clave':
        return <input {...comunes} type="password" onChange={(e) => cambiar(c.nombre, e.target.value)} />;
      case 'color':
        return <SelectorColor valor={valores[c.nombre]} onCambiar={(v) => cambiar(c.nombre, v)} />;
      case 'select':
        return (
          <select {...comunes} onChange={(e) => cambiar(c.nombre, e.target.value)}>
            {c.opciones.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      default:
        return <input {...comunes} type="text" onChange={(e) => cambiar(c.nombre, e.target.value)} />;
    }
  };

  return (
    <Modal titulo={titulo} onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        {ayuda && <p className="texto-chico">{ayuda}</p>}
        {campos.map((c) => (
          <div key={c.nombre} className="grupo">
            <label className="etiqueta" htmlFor={`campo-${c.nombre}`}>
              {c.etiqueta}
            </label>
            {campo(c)}
          </div>
        ))}
        {error && <p className="error">{error}</p>}
        <div className="fila-botones">
          <button type="button" className="boton secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="boton" disabled={guardando}>
            {guardando ? 'Guardando...' : textoGuardar}
          </button>
        </div>
      </form>
    </Modal>
  );
}
