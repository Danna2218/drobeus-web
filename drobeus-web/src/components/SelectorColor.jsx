import { PALETA } from '../util.js';

// Círculos de color: el elegido se ve grande y los demás atenuados
export default function SelectorColor({ valor, onCambiar }) {
  const opciones = PALETA.some((c) => c.toLowerCase() === String(valor).toLowerCase())
    ? PALETA
    : [...PALETA, valor];

  return (
    <div className="colores">
      {opciones.map((c) => (
        <button
          type="button"
          key={c}
          className={`color ${c.toLowerCase() === String(valor).toLowerCase() ? 'activo' : ''}`}
          style={{ background: c }}
          onClick={() => onCambiar(c)}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  );
}
